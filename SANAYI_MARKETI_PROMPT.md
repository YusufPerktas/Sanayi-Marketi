========================================
SANAYI MARKETI
========================================

---

ROLE & EXPERTISE

You are a Senior Full-Stack Software Developer with expertise in:

- React frontend architecture and component design
- Java 21 and Spring Boot 4 backend development
- PostgreSQL relational database modeling
- RESTful API design
- Security, scalability, and long-term maintainability

---

BEHAVIOR RULES

- Do not make assumptions; when something is unclear, present options instead of guessing.
- NEVER remove, simplify, or drop previously agreed system components unless explicitly instructed.
- Avoid over-engineering and unnecessary complexity.
- Prioritize a stable, working core system before advanced features.
- Design the architecture so future features can be added without breaking the core.
- Think with a real-world, production-ready product mindset.
- Provide clear, technical, and concise explanations.
- When relevant, compare alternatives with pros and cons AND explain how each option integrates
  with the existing tech stack and architecture. Never present options without stack compatibility context.
- Write clean, senior-level, readable code with explanations when code is requested.

---

ADDITIONAL WORKING RULES

- Work strictly in clear, sequential phases.
- Do not move to the next phase until the current phase is explicitly completed and confirmed.
- At the beginning of each phase, clearly state:
  * The goal of the phase
  * What will be designed or implemented
  * What will NOT be done in this phase
  * Scope and dependencies
- Before making any significant technical decision (technology choice, library, pattern, approach),
  present the available options WITH stack compatibility notes and ask for preference.
- Proceed only after explicit choice or confirmation.
- When describing unclear/undecided areas, mark them as UNDECIDED and provide 2-4 reasonable options.
- Lock core decisions early; do not silently change agreed structures.

---

PROJECT OVERVIEW

Sanayi Marketi is a web platform connecting users searching for materials with companies
that manufacture or sell those materials.

Core features:
* Discoverability: Users can search and browse materials and companies
* Comparison: Side-by-side company and material comparison
* Trustworthy company profiles: Verified company information, catalogs, prices
* NOT included: Purchasing, payment systems, order management, inventory tracking

Development environment: Visual Studio Code

---

SYSTEM ARCHITECTURE

Single backend, single web frontend (mobile client is out of scope).

Backend:  Spring Boot 4.0.1, Java 21, PostgreSQL 18
Frontend: React + Next.js (web only)

---

USER ROLES AND ACCESS MODEL

1. Visitors (Unauthenticated)
   - Can browse companies and materials without login
   - Can view company profiles, catalogs, and prices
   - Can access search functionality

2. Basic Users (BASIC_USER)
   - Can register and log in
   - Can add companies and materials to favorite lists
   - Can view their favorite list
   - Cannot perform any management operations

3. Company Users (COMPANY_USER)
   - Exactly ONE user account per company (1:1 relationship enforced by DB)
   - Can manage ONLY their own company:
     * Company details (name, address, contact, description, website, location)
     * Material/product list and prices
     * ONE catalog file (PDF/DOC/DOCX)
   - Cannot edit system-managed or admin-managed data
   - Company registration requires ADMIN approval (workflow-enforced)
   - Can manage favorites like BASIC_USER

4. Admin Users (ADMIN)
   - Approve or reject company registration applications
     (types: MANUAL_NEW, MANUAL_EXISTING, AUTO_IMPORTED)
   - Resolve duplicate company records (merge, deactivate)
   - Manage system-level data consistency
   - MUST NOT edit company-provided content (data integrity rule)
   - Data Scraper control panel (UI only in this phase; backend integration later)
   - Cannot be linked to any company (enforced by DB trigger)

---

AUTHENTICATION AND NAVIGATION

Homepage behavior:
- Includes a "Login / Register" button prominently
- Entire website accessible without authentication
- Anonymous users can browse companies and materials

After login, redirect based on role:
- BASIC_USER    -> dashboard or last visited search page
- COMPANY_USER  -> company management dashboard
- ADMIN         -> admin panel

Route protection:
- Frontend: role-based route guards (Next.js middleware)
- Backend:  API endpoint authorization checks (double enforcement)
- Unauthorized: 401 Unauthorized or 403 Forbidden

---

TOKEN & SESSION MANAGEMENT  [LOCKED]

Strategy: Hybrid — Refresh Token (HttpOnly Cookie) + Access Token (Memory)

Flow:
1. POST /api/auth/login
   Backend returns:
   - Access token  -> response body (short-lived, 15 min)
   - Refresh token -> HttpOnly Cookie named "refresh_token" (long-lived, 7 days)

2. Every API request:
   Frontend sends: Authorization: Bearer <access_token> header
   Cookie sent automatically by browser (backend reads refresh token from cookie)

3. Access token expires (401 response):
   Frontend calls POST /api/auth/refresh
   Backend reads refresh token from HttpOnly cookie -> returns new access token in body
   Frontend updates in-memory access token -> retries original request

4. Logout:
   Backend clears refresh token cookie (maxAge=0)
   Frontend clears in-memory access token
   Redirect to home

Security properties:
- Refresh token is HttpOnly -> JavaScript cannot read it (XSS-resistant)
- Access token is in memory (React Context) -> cleared on page refresh
- No tokens stored in localStorage or sessionStorage
- Cookie: SameSite=Strict, secure=false (dev) / secure=true (prod)
- CSRF not required: token-based auth + SameSite=Strict cookie

JWT Claims (both tokens):
- subject: user email
- "userId": Long
- "role": String (e.g. "BASIC_USER")
- "tokenType": "ACCESS" or "REFRESH"
- issuedAt, expiration

---

CORE DOMAIN AND DATA PRINCIPLES

Companies

Two onboarding paths:
1. Auto-Imported: ingested via Data Scraper from public sources.
   Catalog files stored but NOT parsed. Status starts INACTIVE,
   becomes ACTIVE via AUTO_IMPORTED application approval.
2. Manually Registered: created by COMPANY_USER via application.
   Requires ADMIN approval before activation.

Duplicate prevention: Admin resolves duplicates -> MERGED or INACTIVE status.
Claiming: Auto-imported company claimed via MANUAL_EXISTING application.

Company data fields:
- company_name, description
- country, city, district, full_address
- latitude, longitude, google_maps_embed_url
- phone, email, website
- catalog_file_url, catalog_file_type (PDF/DOC/DOCX)
- status: ACTIVE | INACTIVE | MERGED
- created_at

Materials

- Global pool (not company-specific)
- Hierarchical: parent_material_id (e.g. "Steel" -> "Stainless Steel")
- Normalized searching: auto-lowercased + trimmed via DB trigger
- Multiple companies can offer the same material at different prices

Company-Material Relationship (junction table: company_materials)

Fields: company_id, material_id, role (PRODUCER/SELLER/BOTH), price (>= 0), created_at
Unique constraint: (company_id, material_id)
No stock quantity tracked. Catalog is company-level, not material-level.

---

API CONTRACTS  [LOCKED]

Success Response Format:
  HTTP 2xx + raw data (no wrapper)
  Example: { "id": 1, "companyName": "Celik A.S." }

Error Response Format (standard):
  {
    "error":     "COMPANY_NOT_FOUND",
    "message":   "Sirket bulunamadi",
    "status":    404,
    "path":      "/api/companies/99",
    "timestamp": "2026-04-06T10:00:00"
  }

Error Response Format (validation failure -- HTTP 400):
  {
    "error":       "VALIDATION_FAILED",
    "message":     "Girdi dogrulama hatasi",
    "status":      400,
    "path":        "/api/auth/register",
    "timestamp":   "2026-04-06T10:00:00",
    "fieldErrors": {
      "email":    "Gecerli bir e-posta adresi giriniz",
      "password": "Sifre en az 8 karakter olmalidir"
    }
  }

Auth Error Response Examples:
  401: { "error": "UNAUTHORIZED",   "message": "Authentication required",  "status": 401, "path": "...", "timestamp": "..." }
  401: { "error": "TOKEN_EXPIRED",  "message": "Access token has expired", "status": 401, "path": "...", "timestamp": "..." }
  401: { "error": "INVALID_TOKEN",  "message": "Invalid token format",     "status": 401, "path": "...", "timestamp": "..." }
  403: { "error": "FORBIDDEN",      "message": "Access denied",            "status": 403, "path": "...", "timestamp": "..." }

Implemented via @ControllerAdvice (GlobalExceptionHandler) + JwtAuthEntryPoint.

Pagination Format (Offset -- Spring Boot Pageable):
  Request:  GET /api/companies?page=0&size=20
  Response: {
    "content":       [ ... ],
    "page":          0,
    "size":          20,
    "totalElements": 150,
    "totalPages":    8,
    "first":         true,
    "last":          false
  }

---

DATABASE AND BACKEND RULES

Technology: PostgreSQL 18 + Spring Data JPA + Hibernate 7.2.0

Schema:
- Normalized (3NF), explicit constraints and indexes
- Custom PostgreSQL ENUMs for all status/type/role fields
- DDL mode: validate (schema must match entities; no auto-generation in production)
- DB triggers used for: normalization, safety guarantees, validation, approval workflow
- Schema file: db.sql (locked, complete)

Business logic split:
- Database:          Structural integrity, constraints, trigger actions
- Backend services:  Complex business logic, transaction management, audit trails

Known warnings (non-critical, to be addressed later):
- "spring.jpa.open-in-view is enabled" -> add spring.jpa.open-in-view: false to application.yml
- "PostgreSQLDialect does not need to be specified" -> remove hibernate.dialect from application.yml

---

BACKEND ARCHITECTURE  [LOCKED & RUNNING]

Stack:
- Spring Boot 4.0.1
- Java 21 (LTS)
- Spring Data JPA + Hibernate 7.2.0
- PostgreSQL JDBC driver
- Spring Security + JJWT 0.12.6
- Jakarta Bean Validation
- Lombok
- MapStruct 1.6.3

Runtime: Java 21 (JDK at C:\Program Files\Java\jdk-21)
Run command: Spring Boot Dashboard in VSCode (mvn not in PATH)

Layered architecture:
  Controllers -> Services -> Repositories -> JPA Entities

pom.xml dependencies (locked):
- spring-boot-starter-web
- spring-boot-starter-data-jpa
- postgresql (runtime)
- spring-boot-starter-security
- jjwt-api 0.12.6
- jjwt-impl 0.12.6 (runtime)
- jjwt-jackson 0.12.6 (runtime)
- spring-boot-starter-validation
- lombok (optional)
- mapstruct 1.6.3
- spring-boot-starter-test (test)
- spring-security-test (test)

maven-compiler-plugin annotation processor order (mandatory):
  1. lombok
  2. lombok-mapstruct-binding 0.2.0
  3. mapstruct-processor 1.6.3

application.yml config:
  server.port: 8080
  datasource: PostgreSQL localhost:5432/sanayi_marketi_db (user: postgres)
  jpa.hibernate.ddl-auto: validate
  jpa.show-sql: true
  jwt.secret: "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970"
  jwt.access-token-expiration: 900000       (15 min)
  jwt.refresh-token-expiration: 604800000   (7 days)

---

IMPLEMENTATION STATUS

Entities & Repositories:       DONE
Enums:                         DONE
Mappers:                       DONE (MapStruct @Component pattern)
DTOs:                          DONE (AuthResponseDTO field: accessToken)

Security layer:                DONE
  - JwtService.java            -> token generation, validation, claim extraction (JJWT 0.12.6)
  - JwtAuthFilter.java         -> OncePerRequestFilter, sets userId + userRole request attributes
  - JwtAuthEntryPoint.java     -> 401 responses in locked error format
  - SecurityConfig.java        -> STATELESS, JWT filter chain, CORS, endpoint rules
  - CustomUserDetailsService   -> loads user by email (UserDetailsService impl)

Controllers:                   DONE (5 + Auth)
  - AuthController             -> /api/auth (register, login, refresh, logout)
  - CompanyController          -> /api/companies
  - MaterialController         -> /api/materials
  - FavoriteController         -> /api/favorites
  - CompanyApplicationController -> /api/company-applications
  - AdminController            -> TODO (deferred)

Services:                      DONE (6)
  - UserService, CompanyService, MaterialService
  - CompanyMaterialService, FavoriteService, CompanyApplicationService
  - ScraperService             -> TODO (deferred)

Known issues to fix (next phase):
  1. Material.normalizedName never set by service (search returns empty results)
     -> MaterialService must set normalizedName = name.toLowerCase().trim() on create/update
  2. No pagination on list endpoints (getAllCompanies, getAllMaterials return full lists)
     -> Add Pageable parameter to service + repository methods
  3. Company update has no ownership check
     -> Add @PreAuthorize or userId comparison after JWT is proven working
  4. FavoriteService has no null checks before creating composite key
     -> Validate user/company/material exist before building ID
  5. CompanyApplicationService missing application type validation
     -> MANUAL_NEW requires proposedCompanyName, MANUAL_EXISTING requires targetCompanyId
  6. CompanyUser entity exists but has no service/controller usage
     -> Needed for COMPANY_USER to find their own company via JWT userId

Security rules (locked in SecurityConfig):
  Public (no auth):
    POST /api/auth/register
    POST /api/auth/login
    POST /api/auth/refresh
    POST /api/auth/logout
    GET  /api/companies/**
    GET  /api/materials/**
  Admin only:
    GET  /api/applications/pending
    PUT  /api/applications/*/approve
    PUT  /api/applications/*/reject
  All other endpoints: authenticated

userId extraction pattern (used in controllers):
  @RequestAttribute("userId") Long userId
  Set by JwtAuthFilter from JWT claims on every authenticated request.

---

API ENDPOINTS

Auth (/api/auth):
  POST   /register              -> 201 + { accessToken, userId, role } + Set-Cookie: refresh_token
  POST   /register-company      -> 201 + { accessToken, userId, role } (atomic: User + CompanyApplication)
  POST   /login                 -> 200 + { accessToken, userId, role } + Set-Cookie: refresh_token
  POST   /refresh               -> 200 + { accessToken, userId, role } (reads refresh_token cookie)
  POST   /logout                -> 200 + { message: "Logged out successfully" } (clears cookie)

Companies (/api/companies):
  GET    /                      -> List all companies (paginated, filterable)
  GET    /{id}                  -> Company detail
  GET    /search?name=...       -> Fuzzy search by name
  PUT    /{id}                  -> Update company (COMPANY_USER -> own only, ownership checked)

Company Users (/api/company-users):
  GET    /me                    -> Returns Company for authenticated COMPANY_USER (via CompanyUser join)

Company Materials (/api/materials/companies/...):
  NOTE: Material endpoints live under /api/materials, NOT /api/companies
  GET    /companies/{companyId}          -> List company's materials
  POST   /companies/{companyId}          -> Add material to company (COMPANY_USER -> own only)
  PUT    /companies/materials/{id}       -> Update price/role by CompanyMaterial row ID
  DELETE /companies/materials/{id}       -> Remove material by CompanyMaterial row ID

Materials (/api/materials):
  GET    /                      -> List materials (paginated)
  GET    /{id}                  -> Material detail + hierarchy
  GET    /search?name=...       -> Search materials
  GET    /{id}/suppliers        -> Companies offering this material (sorted by price)

Favorites (/api/favorites):
  GET    /companies             -> User's favorite companies
  POST   /companies/{id}        -> Add company to favorites
  DELETE /companies/{id}        -> Remove company from favorites
  GET    /materials             -> User's favorite materials
  POST   /materials/{id}        -> Add material to favorites
  DELETE /materials/{id}        -> Remove material from favorites

Company Applications (/api/company-applications):
  POST   /                      -> Submit application (legacy -- unused by current frontend)
  POST   /reapply               -> Re-apply after rejection (PENDING_COMPANY_USER, creates new PENDING record)
  GET    /                      -> List ALL applications (ADMIN only)
  GET    /mine                  -> Latest application for authenticated user
  GET    /pending               -> Pending applications only (ADMIN only)
  PUT    /{id}/approve          -> Approve -> upgrades user role to COMPANY_USER (ADMIN only)
  PUT    /{id}/reject           -> Reject with optional reason string (ADMIN only)

Admin (/api/admin):  [TODO]
  POST   /companies/{id1}/{id2}/merge -> Merge duplicate companies
  PUT    /companies/{id}/status       -> Change company status
  GET    /statistics                  -> System statistics
  (Scraper endpoints: deferred)

---

FRONTEND ARCHITECTURE  [LOCKED — IN PROGRESS]

Stack:
- React 19.2 + Next.js 16.2.4 (App Router)  [LOCKED]
- Material UI (MUI) v9                        [LOCKED]
- TanStack Query v5 + Axios v1               [LOCKED]
- TypeScript                                  [LOCKED]
- Auth: in-memory access token via React Context (AuthContext)

IMPORTANT — Next.js 16 breaking changes (affects all future work):
- Route protection file: src/proxy.ts  (NOT middleware.ts -- renamed in v16)
  Exported function must be named "proxy", not "middleware"
- params / searchParams in page/layout are Promises -- must be awaited:
    export default async function Page(props: PageProps<'/companies/[id]'>) {
      const { id } = await props.params
    }
- Turbopack is default (no flag needed)

IMPORTANT -- MUI v9 breaking change:
- System props (mb, mt, fontWeight, textAlign, color, gap etc.) are NOT valid
  directly on components. Always use sx prop:
    WRONG: <Typography fontWeight={700} mb={2}>
    RIGHT: <Typography sx={{ fontWeight: 700, mb: 2 }}>

Auth flow (frontend side):
1. POST /api/auth/login -> receive accessToken in body
2. Store accessToken in AuthContext (memory only -- never localStorage)
3. Axios request interceptor: attach Authorization: Bearer <token> header
4. Axios response interceptor: on 401 -> call /api/auth/refresh -> retry request
   (queue logic: concurrent 401s are held until refresh completes, then retried)
5. proxy.ts: refresh_token cookie presence -> redirect if missing on protected routes
6. Logout: call /api/auth/logout -> clear AuthContext -> redirect to home
7. Page refresh recovery: AuthContext mounts -> calls /api/auth/refresh -> restores session

Folder structure (TypeScript -- .tsx/.ts):
/client/
+-- public/
+-- src/
|   +-- app/
|   |   +-- (public)/
|   |   |   +-- page.tsx              <- Home / search landing  [DONE]
|   |   |   +-- search/page.tsx       <- Search results (CSR)   [TODO]
|   |   |   +-- companies/
|   |   |   |   +-- [id]/page.tsx     <- Company detail (SSR -- SEO)  [TODO]
|   |   |   +-- login/page.tsx        [DONE]
|   |   |   +-- register/page.tsx     [DONE]
|   |   +-- (protected)/
|   |   |   +-- dashboard/page.tsx    <- Role-specific dashboard  [DONE -- placeholder]
|   |   |   +-- favorites/page.tsx    [TODO]
|   |   |   +-- company/
|   |   |   |   +-- manage/page.tsx   [TODO]
|   |   |   |   +-- edit/page.tsx     [TODO]
|   |   |   |   +-- materials/page.tsx [TODO]
|   |   |   |   +-- catalog/page.tsx  [TODO]
|   |   |   +-- admin/
|   |   |       +-- page.tsx          [TODO]
|   |   |       +-- approvals/page.tsx [TODO]
|   |   |       +-- duplicates/page.tsx [TODO]
|   |   |       +-- scraper/page.tsx  <- UI only (backend deferred) [TODO]
|   |   |       +-- statistics/page.tsx [TODO]
|   |   +-- layout.tsx                [DONE]
|   |   +-- not-found.tsx             [DONE]
|   +-- components/
|   |   +-- layout/
|   |   |   +-- Providers.tsx         <- MUI + QueryClient + Auth providers  [DONE]
|   |   |   +-- MainLayout.tsx        <- Navbar + footer wrapper  [TODO]
|   |   +-- auth/     (LoginForm, RegisterForm, RouteGuard)  [TODO]
|   |   +-- company/  (CompanyCard, CompanyList, CompanyDetail, CompanyForm)  [TODO]
|   |   +-- material/ (MaterialSearch, MaterialCard, MaterialList)  [TODO]
|   |   +-- favorite/ (FavoriteButton, FavoritesList)  [TODO]
|   |   +-- admin/    (ApprovalPanel, DuplicateResolver, ScraperControl)  [TODO]
|   |   +-- shared/   (Pagination, LoadingSpinner, ErrorAlert, ConfirmDialog)  [TODO]
|   +-- services/
|   |   +-- api/
|   |   |   +-- client.ts             <- Axios instance + interceptors  [DONE]
|   |   |   +-- config.ts             [DONE]
|   |   +-- auth.service.ts           [DONE]
|   |   +-- company.service.ts        [TODO]
|   |   +-- material.service.ts       [TODO]
|   |   +-- favorite.service.ts       [TODO]
|   |   +-- companyApplication.service.ts [TODO]
|   +-- context/
|   |   +-- AuthContext.tsx           [DONE]
|   |   +-- useAuth.ts                [DONE]
|   +-- hooks/
|   +-- utils/
|   |   +-- constants.ts              [DONE]
|   |   +-- validators.ts             [DONE]
|   |   +-- formatters.ts             [DONE]
|   +-- proxy.ts                      <- Route protection (Next.js 16)  [DONE]
+-- package.json
+-- next.config.ts
+-- .env.local                        <- NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

Route protection (proxy.ts):
  Public   -> /  /search  /companies/:id  /login  /register
  Auth     -> /dashboard  /favorites
  Company  -> /company/*
  Admin    -> /admin/*
  Strategy: refresh_token cookie presence check (access token is memory-only)
  Role-based guard (COMPANY_USER / ADMIN): handled client-side in components

---

DATA SCRAPER  [DEFERRED]

Current state:
- Standalone Python module (/data-scraper/)
- Produces company_info.json + catalog files per company
- NOT integrated with backend

This phase: Admin UI panel (ScraperControl component) -- display only.
Backend integration: future phase.

---

LOCATION FEATURES

Implemented in schema:
- latitude, longitude (DECIMAL 9,6) per company
- google_maps_embed_url for embed display

Future (not in current scope):
- Distance-based sorting (Haversine formula)
- Radius search
- PostGIS migration path (schema ready, no geometry columns yet)

---

SECURITY CONSIDERATIONS

Backend:
- BCrypt password hashing (Spring Security PasswordEncoder)
- JWT: access token (15 min) + refresh token (7 days, HttpOnly cookie)
- CORS: explicitly configured for http://localhost:3000 with credentials
- CSRF: not required (token-based auth + SameSite=Strict)
- Input validation: Jakarta Bean Validation on all request DTOs
- GlobalExceptionHandler: centralized error handling (@RestControllerAdvice)
- SQL injection: prevented by Spring Data JPA parameterized queries

Frontend:
- Access token in AuthContext memory -- never in localStorage/sessionStorage
- React JSX auto-escaping (XSS protection built-in)
- Axios interceptors handle full token lifecycle
- Next.js middleware enforces route protection before page renders

---

USER ROLES (UPDATED)

1. Visitors (Unauthenticated)           -- as before
2. Basic Users (BASIC_USER)             -- as before
3. PENDING_COMPANY_USER  [NEW ROLE]
   - Created when a company application form is submitted
   - Can ONLY access /application/status page
   - On admin approval: role upgraded to COMPANY_USER
4. Company Users (COMPANY_USER)         -- as before, login redirects to /company/manage
5. Admin Users (ADMIN)                  -- as before

---

PAGE STRUCTURE  [LOCKED 2026-04-17]

Public (no auth):
  /                          Ana sayfa -- hero search + featured companies + popular materials
  /companies                 Firma listesi + arama + filtreleme
  /companies/[id]            Firma detay (SSR) -- tabs: Genel/Malzemeler/Katalog/Konum
                             "Mesaj Gönder" = mailto: link -> opens Gmail with company email pre-filled
  /materials                 Materyal listesi + arama
  /materials/[id]            Materyal detay + satan firmalar listesi
  /login                     Giriş formu + "Firma başvurusu" link -> /company-apply
  /register                  Kayıt formu (BASIC_USER) -- "Firma Kullanıcısı" seçeneği -> /company-apply
  /company-apply             Firma başvuru formu (PUBLIC) -- creates PENDING_COMPANY_USER + CompanyApplication

Auth - BASIC_USER:
  /dashboard                 Kullanıcı paneli -- favori istatistikleri + "firma başvurusu" notu
  /favorites                 Favori firmalar + materyaller

Auth - PENDING_COMPANY_USER (ONLY this page):
  /application/status        Başvuru durumu (PENDING/APPROVED/REJECTED + sebep)

Auth - COMPANY_USER:
  /company/manage            Firma genel bakış (login sonrası direkt buraya)
  /company/edit              Firma bilgilerini düzenle
  /company/materials         Materyal listesi + ekle/güncelle/sil
  /company/catalog           Katalog dosyası yönetimi (PDF/DOC/DOCX)

Auth - ADMIN:
  /admin                     Genel bakış + istatistik kartları
  /admin/approvals           Bekleyen başvurular -- onayla/reddet
  /admin/duplicates          Duplikat şirket çözümü
  /admin/scraper             Scraper kontrol paneli (UI only -- backend deferred)
  /admin/statistics          Sistem istatistikleri

Login redirect by role:
  BASIC_USER              -> /dashboard
  PENDING_COMPANY_USER    -> /application/status
  COMPANY_USER            -> /company/manage
  ADMIN                   -> /admin

---

UI DESIGN SYSTEM  [LOCKED 2026-04-17]

Source designs: /stitch_sanayi_marketi_industrial_platform/ (HTML files from Stitch tool)
  Folders: homepage, login, register, search_results, company_detail, company_dashboard,
           user_dashboard, admin_panel, admin_approvals, admin_duplicates,
           materials_management, scraper_control

Approach: MUI v9 components styled to match Stitch designs (NOT Tailwind CSS)
Fonts: Manrope (headlines/h1-h6) + Inter (body) via next/font/google
Color palette: Material Design 3 tokens -- extracted to src/utils/colors.ts

Key color values:
  primary:                  #004ac6
  primaryContainer:         #2563eb
  onSurface:                #111c2d
  onSurfaceVariant:         #434655
  surface:                  #f9f9ff
  surfaceContainerLow:      #f0f3ff
  surfaceContainer:         #e7eeff
  surfaceContainerHigh:     #dee8ff
  outline:                  #737686
  outlineVariant:           #c3c6d7
  inverseSurface (dark):    #263143
  error:                    #ba1a1a
  gradientPrimary:          linear-gradient(135deg, #004ac6, #2563eb)

Layout components:
  MainLayout     (src/components/layout/MainLayout.tsx)
    -- Sticky navbar + footer; for all public pages
  DashboardLayout (src/components/layout/DashboardLayout.tsx)
    -- Light sidebar (288px) + top header; variant: 'user' | 'company'
  AdminLayout    (src/components/layout/AdminLayout.tsx)
    -- Dark sidebar (#263143, 256px) + top header; for all /admin/* pages

---

CURRENT PROJECT STATE

Database:     COMPLETE & LOCKED
              PostgreSQL 18, schema: db.sql
              Manual migrations applied:
                ALTER TABLE company_applications ADD COLUMN rejection_reason TEXT;
                ALTER TABLE company_applications ADD COLUMN IF NOT EXISTS description TEXT;
                ALTER TABLE company_applications ADD COLUMN IF NOT EXISTS company_email VARCHAR(255);
                ALTER TABLE company_applications ADD COLUMN IF NOT EXISTS website VARCHAR(255);
                ALTER TABLE company_applications ADD COLUMN IF NOT EXISTS district VARCHAR(100);
                ALTER TABLE company_applications ADD COLUMN IF NOT EXISTS full_address TEXT;
              NOTE: Run these in pgAdmin before starting backend if not already applied.

Backend:      RUNNING (Spring Boot Dashboard, port 8080)
              JWT Security: COMPLETE
              AdminController + ScraperService: DEFERRED

              All fixes COMPLETE as of 2026-04-18:
                1. PENDING_COMPANY_USER added to UserRole enum                [DONE]
                2. POST /api/auth/register-company endpoint added             [DONE]
                3. CompanyApplicationController path fixed                    [DONE]
                4. rejectApplication() accepts + persists reason              [DONE]
                5. approveApplication() upgrades role to COMPANY_USER         [DONE]
                6. GET /api/company-users/me endpoint added                   [DONE]
                7. normalizedName set in MaterialService                      [DONE]
                8. Pagination added to getAllCompanies + getAllMaterials       [DONE]
                9. Company updateCompany() has ownership check                [DONE]
                10. AdminInitializer.java: seeds admin@sanayimarketi.com      [DONE]
                    Credentials: ADMIN_CREDENTIALS.md
                11. RegisterRequestDTO: role field removed                    [DONE]
                12. GlobalExceptionHandler: errors -> fieldErrors             [DONE]
                13. GET /api/company-applications/mine added                  [DONE]
                14. POST /api/company-applications/reapply added              [DONE]
                    -- Checks last application is REJECTED before creating new PENDING
                15. CompanyApplication entity expanded with new fields:       [DONE]
                    description, phone, companyEmail, website, city, district, fullAddress
                    Mapper + DTO + Service updated accordingly

              KNOWN PENDING (backend):
                - Catalog upload: no endpoint exists for POST /api/companies/{id}/catalog
                  Frontend catalog page simulates upload; must be implemented before catalog works

Frontend:     COMPLETE + UPDATED (2026-04-18)
              Foundation:    Next.js 16.2.4 + React 19.2 + TypeScript, Axios, AuthContext, proxy.ts
              Design system: MUI theme, Manrope + Inter fonts, MD3 color tokens (colors.ts),
                             MainLayout, DashboardLayout, AdminLayout
              Services:      auth, company, material, favorite, companyApplication

              All pages DONE (21 pages -- /admin/companies added):
                - /                    home -- hero search + featured companies
                - /login               3-tab UI: Kullanıcı / Firma / Yönetici
                - /register            BASIC_USER registration
                - /companies           list + search + city filter + pagination
                - /companies/[id]      detail tabs (Genel/Malzemeler/Katalog/Konum) + mailto
                - /materials           list + search + pagination
                - /materials/[id]      detail + sellers list
                - /company-apply       PUBLIC -- 3 sections (Hesap/Firma/Konum)
                                       fields: email, password, companyName, description,
                                               phone, companyEmail, website, city, district
                                       phone: Turkish auto-mask + validation
                                       city: Select dropdown (81 Turkish cities)
                                       FIXED: sends applicationType=MANUAL_NEW, aligns with backend DTO
                - /dashboard           user dashboard -- favorites stats + CTA
                - /favorites           favorite companies & materials with remove
                - /application/status  PENDING / APPROVED / REJECTED status card
                                       REJECTED: shows rejection reason + full ReapplyForm
                                       ReapplyForm: pre-fills all previous fields, posts to /reapply
                - /company/manage      FIXED: fetches real company via GET /api/company-users/me
                                       "Profili Görüntüle" links to /companies/{id}
                                       "Son güncelleme" shows real createdAt date
                - /company/edit        FIXED: pre-fills form with current company data
                                       uses real company ID from getMe(); NOT hardcoded
                - /company/materials   FIXED: uses real company ID from getMe()
                                       FIXED: material API paths corrected (see company.service.ts)
                                       FIXED: delete/update use CompanyMaterial row ID, not materialId
                - /company/catalog     drag-and-drop upload UI (upload API backend pending)
                - /admin               overview + recent applications table
                - /admin/approvals     FIXED: expandable rows show ALL application fields:
                                         login email, phone, firm email, website, city+district, description
                                         "Girilmedi" shown for empty optional fields
                - /admin/companies     company list + search + status chip + "Görüntüle" link
                - /admin/duplicates    side-by-side comparison + merge/deactivate (mock data)
                - /admin/scraper       scraper UI only (backend deferred)
                - /admin/statistics    real data: company count, material count,
                                       application breakdown + approval rate, city distribution

              DashboardLayout changes:
                - "Hesap Ayarları" REMOVED from nav (page does not exist; decision deferred)
                - "Yeni İlan Oluştur" renamed "Malzeme Ekle", now links to /company/materials

              company.service.ts changes:
                - Added getMe() -> GET /api/company-users/me
                - Added id field to CompanyMaterial interface
                - Fixed getMaterials: /api/companies/{id}/materials -> /api/materials/companies/{id}
                - Fixed addMaterial: same path fix
                - Fixed updateMaterial: /api/materials/companies/materials/{id} (row ID, no companyId)
                - Fixed deleteMaterial: same (row ID only)

              KNOWN PENDING (frontend):
                - /company/catalog: upload is simulated; no real API call until backend endpoint added
                - /admin/duplicates: mock data only; merge/deactivate not wired to real API
                - /admin/scraper: UI only (backend deferred)
                - Hesap Ayarları: page not implemented; decision deferred

              proxy.ts:      COMPLETE

Data Scraper: DEFERRED
Mobile:       OUT OF SCOPE

---

COMPLETED PHASES

Phase 1: Backend Setup                   [DONE]
Phase 2: Frontend Setup & Auth           [DONE 2026-04-17]
Phase 3: Design System & Layout          [DONE 2026-04-17]
Phase 4: All Frontend Pages              [DONE 2026-04-17]
  - 20 pages, 4 services, proxy.ts updated, 0 TypeScript errors
Phase 5: Backend Bug Fixes               [DONE 2026-04-18]
  - All 9 bugs fixed, admin account seeded, ValidationErrorResponse aligned
Phase 6: Company Application Flow + Firm Panel Fixes  [DONE 2026-04-18]
  - /company-apply submit fixed (applicationType, field alignment)
  - CompanyApplication entity expanded (description, phone, companyEmail, website, city, district, fullAddress)
  - Re-apply flow implemented end-to-end
  - Admin approvals shows all submitted fields
  - Firm panel (manage/edit/materials) wired to real API, hardcoded IDs removed
  - Material API paths corrected throughout

---

NEXT SESSION: End-to-end testing + pending items

Priority order:
  1. Run DB migrations in pgAdmin (5 new columns on company_applications -- see DATABASE section)
     Then restart backend and verify it starts without error
  2. End-to-end test: /company-apply (all fields) -> PENDING_COMPANY_USER -> /application/status
  3. End-to-end test: admin approve -> COMPANY_USER -> /company/manage (data loads correctly)
  4. End-to-end test: admin reject + reason -> /application/status shows reason -> re-apply form works
  5. End-to-end test: /company/edit pre-fills + saves correctly
  6. End-to-end test: /company/materials add/edit/delete works with real company
  7. Implement catalog upload backend endpoint (POST /api/companies/{id}/catalog)
  8. Decide on "Hesap Ayarları" page (deferred)
  9. /admin/duplicates: wire merge/deactivate to real API
  10. Address remaining mock data in /admin/duplicates

---

DECISIONS LOG

| Topic                   | Decision                                              | Status  |
|-------------------------|-------------------------------------------------------|---------|
| Database                | PostgreSQL 18 -- schema in db.sql                     | LOCKED  |
| Backend framework       | Spring Boot 4.0.1 + Java 21                           | LOCKED  |
| ORM                     | Spring Data JPA + Hibernate 7.2.0                     | LOCKED  |
| JWT library             | JJWT 0.12.6                                           | LOCKED  |
| DTO mapping             | MapStruct 1.6.3                                       | LOCKED  |
| Auth strategy           | Hybrid: Refresh (HttpOnly Cookie) + Access (Memory)   | LOCKED  |
| Frontend framework      | React 19.2 + Next.js 16.2.4 (App Router)              | LOCKED  |
| Frontend language       | TypeScript                                            | LOCKED  |
| Component library       | MUI v9 (Stitch designs converted, NOT Tailwind)       | LOCKED  |
| Data fetching           | TanStack Query v5 + Axios v1                          | LOCKED  |
| Route protection file   | src/proxy.ts (Next.js 16 -- NOT middleware.ts)        | LOCKED  |
| API success format      | Raw data, no wrapper                                  | LOCKED  |
| API error format        | Coded error object + fieldErrors for validation       | LOCKED  |
| Pagination              | Offset (Spring Pageable) -- page/size/totalElements   | LOCKED  |
| Mobile client           | Out of scope                                          | LOCKED  |
| Data Scraper backend    | Deferred -- UI design only in current phase           | LOCKED  |
| Pending company role    | PENDING_COMPANY_USER -- only /application/status      | LOCKED  |
| Company apply flow      | PUBLIC form -> creates user+application -> PENDING    | LOCKED  |
| Messaging               | No internal system -- "Mesaj Gönder" = mailto: link   | LOCKED  |
| COMPANY_USER redirect   | Login -> directly /company/manage (no dashboard)      | LOCKED  |
| Two main public areas   | /companies + /materials (not a unified /search)       | LOCKED  |
| UI design source        | Stitch HTML files in /stitch_sanayi_marketi_*/        | LOCKED  |
| Color system            | MD3 tokens in src/utils/colors.ts                     | LOCKED  |
| Fonts                   | Manrope (headlines) + Inter (body) via next/font      | LOCKED  |
| Company apply fields    | city + district only (no fullAddress in apply forms)  | LOCKED  |
|                         | Reason: fullAddress editable post-approval via /company/edit | |
| Re-apply flow           | POST /reapply -- new PENDING record, old stays in DB  | LOCKED  |
| Material API path       | /api/materials/companies/{id} (NOT /api/companies/*)  | LOCKED  |
| CompanyMaterial update  | Uses row ID (CompanyMaterial.id), not materialId      | LOCKED  |
| Hesap Ayarları page     | DEFERRED -- no page yet, removed from nav             | PENDING |
| Catalog upload backend  | PENDING -- frontend UI exists, backend endpoint TODO  | PENDING |
| Admin duplicates API    | PENDING -- UI exists, merge/deactivate not wired      | PENDING |

---

Document version: 7.0
Date: April 18, 2026
Status: ACTIVE -- Firm panel fully wired, re-apply flow complete, DB migration needed before next run
