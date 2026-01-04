-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE user_role AS ENUM (
  'BASIC_USER',
  'COMPANY_USER',
  'ADMIN'
);

CREATE TYPE company_status AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'MERGED'
);

CREATE TYPE company_application_status AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE company_application_type AS ENUM (
  'AUTO_IMPORTED',
  'MANUAL_NEW',
  'MANUAL_EXISTING'
);

CREATE TYPE company_material_role AS ENUM (
  'PRODUCER',
  'SELLER',
  'BOTH'
);

CREATE TYPE catalog_file_type AS ENUM (
  'PDF',
  'DOC',
  'DOCX'
);

-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- COMPANIES
-- =====================================================

CREATE TABLE companies (
  id BIGSERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  description TEXT,

  country VARCHAR(100),
  city VARCHAR(100),
  district VARCHAR(100),
  full_address TEXT,

  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),

  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  google_maps_embed_url TEXT,

  catalog_file_url TEXT,
  catalog_file_type catalog_file_type,

  status company_status NOT NULL DEFAULT 'INACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- COMPANY APPLICATIONS
-- =====================================================

CREATE TABLE company_applications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_type company_application_type NOT NULL,

  target_company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
  proposed_company_name VARCHAR(255),

  status company_application_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- COMPANY USERS
-- (1 user = 1 company enforced by PRIMARY KEY)
-- (Admin users cannot be linked to companies - enforced by trigger)
-- =====================================================

CREATE TABLE company_users (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MATERIALS (GLOBAL POOL)
-- =====================================================

CREATE TABLE materials (
  id BIGSERIAL PRIMARY KEY,
  material_name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255),
  parent_material_id BIGINT REFERENCES materials(id) ON DELETE SET NULL
);

-- =====================================================
-- COMPANY MATERIALS (PRICE + ROLE)
-- =====================================================

CREATE TABLE company_materials (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  material_id BIGINT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  role company_material_role NOT NULL,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (company_id, material_id)
);

-- =====================================================
-- FAVORITES
-- =====================================================

CREATE TABLE user_favorite_companies (
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, company_id)
);

CREATE TABLE user_favorite_materials (
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  material_id BIGINT REFERENCES materials(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, material_id)
);

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Material name normalization
CREATE OR REPLACE FUNCTION normalize_material_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_name := lower(trim(NEW.material_name));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Prevent admin users from being linked to companies
CREATE OR REPLACE FUNCTION prevent_admin_company_link()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = NEW.user_id AND role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Admin users cannot be linked to companies';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Validate application fields based on type
CREATE OR REPLACE FUNCTION validate_application_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- MANUAL_NEW: proposed_company_name required, target_company_id must be NULL
  IF NEW.application_type = 'MANUAL_NEW' THEN
    IF NEW.proposed_company_name IS NULL OR trim(NEW.proposed_company_name) = '' THEN
      RAISE EXCEPTION 'proposed_company_name is required for MANUAL_NEW applications';
    END IF;
    IF NEW.target_company_id IS NOT NULL THEN
      RAISE EXCEPTION 'target_company_id must be NULL for MANUAL_NEW applications';
    END IF;
  END IF;

  -- MANUAL_EXISTING: target_company_id required
  IF NEW.application_type = 'MANUAL_EXISTING' THEN
    IF NEW.target_company_id IS NULL THEN
      RAISE EXCEPTION 'target_company_id is required for MANUAL_EXISTING applications';
    END IF;
  END IF;

  -- AUTO_IMPORTED: can only be created by system (backend should handle this too)
  IF NEW.application_type = 'AUTO_IMPORTED' AND TG_OP = 'INSERT' THEN
    -- This is a safety net. Backend should prevent this, but DB enforces it too.
    IF NEW.status = 'PENDING' THEN
      RAISE EXCEPTION 'AUTO_IMPORTED applications cannot be created directly by users';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Company application approval workflow
CREATE OR REPLACE FUNCTION approve_company_application()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APPROVED' AND OLD.status = 'PENDING' THEN

    -- Create new company if needed
    IF NEW.application_type IN ('MANUAL_NEW', 'AUTO_IMPORTED') THEN
      INSERT INTO companies (company_name, status)
      VALUES (NEW.proposed_company_name, 'ACTIVE')
      RETURNING id INTO NEW.target_company_id;
    END IF;

    -- Link user to company (with safety checks)
    IF NEW.target_company_id IS NOT NULL THEN
      INSERT INTO company_users (user_id, company_id)
      VALUES (NEW.user_id, NEW.target_company_id)
      ON CONFLICT (user_id) DO NOTHING;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trg_normalize_material
BEFORE INSERT OR UPDATE ON materials
FOR EACH ROW
EXECUTE FUNCTION normalize_material_name();

CREATE TRIGGER trg_prevent_admin_company
BEFORE INSERT ON company_users
FOR EACH ROW
EXECUTE FUNCTION prevent_admin_company_link();

CREATE TRIGGER trg_validate_application
BEFORE INSERT OR UPDATE ON company_applications
FOR EACH ROW
EXECUTE FUNCTION validate_application_fields();

CREATE TRIGGER trg_company_application_approve
AFTER UPDATE ON company_applications
FOR EACH ROW
EXECUTE FUNCTION approve_company_application();

-- =====================================================
-- INDEXES
-- =====================================================

-- Users (email already has implicit unique index)
CREATE INDEX idx_users_role ON users(role);

-- Companies
CREATE INDEX idx_companies_name ON companies(company_name);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_status_name ON companies(status, company_name);
CREATE INDEX idx_companies_location ON companies(country, city, district);
CREATE INDEX idx_companies_geo ON companies(latitude, longitude);

-- Company Applications
CREATE INDEX idx_company_applications_status
  ON company_applications(status);
CREATE INDEX idx_company_applications_type
  ON company_applications(application_type);
CREATE INDEX idx_company_applications_user
  ON company_applications(user_id);
CREATE INDEX idx_company_applications_target
  ON company_applications(target_company_id);

-- Company Users
CREATE INDEX idx_company_users_company
  ON company_users(company_id);

-- Materials
CREATE INDEX idx_materials_normalized
  ON materials(normalized_name);
CREATE INDEX idx_materials_parent
  ON materials(parent_material_id);
CREATE INDEX idx_materials_name_trgm
  ON materials USING gin(material_name gin_trgm_ops);

-- Company Materials
CREATE INDEX idx_company_materials_company
  ON company_materials(company_id);
CREATE INDEX idx_company_materials_material
  ON company_materials(material_id);
CREATE INDEX idx_company_materials_price
  ON company_materials(material_id, price);

-- Favorites
CREATE INDEX idx_fav_companies_user
  ON user_favorite_companies(user_id);
CREATE INDEX idx_fav_companies_company
  ON user_favorite_companies(company_id);
CREATE INDEX idx_fav_materials_user
  ON user_favorite_materials(user_id);
CREATE INDEX idx_fav_materials_material
  ON user_favorite_materials(material_id);

-- =====================================================
-- COMMENTS (DOCUMENTATION)
-- =====================================================

COMMENT ON TABLE company_users IS 
  'One user can own only one company (enforced by PK). Admin users cannot be linked to companies (enforced by trigger).';

COMMENT ON COLUMN materials.normalized_name IS 
  'Auto-generated lowercase trimmed version for case-insensitive search';

COMMENT ON COLUMN company_materials.price IS 
  'Price must be non-negative (enforced by CHECK constraint)';

COMMENT ON INDEX idx_materials_name_trgm IS 
  'Enables fuzzy search - "çelik" matches "Çelik Boru"';

COMMENT ON TRIGGER trg_company_application_approve ON company_applications IS 
  'Automatically creates company and links user when application is approved';

COMMENT ON TRIGGER trg_prevent_admin_company ON company_users IS 
  'Ensures admin users cannot be linked to any company';

COMMENT ON TRIGGER trg_validate_application ON company_applications IS 
  'Validates application fields based on application type before insert/update';