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

Fields: company_id, material_id, role (PRODUCER/SELLER/BOTH), price DECIMAL(12,2) NULL (optional),
        unit VARCHAR(50) (e.g. "Ton", "Kg", "m²"), created_at
Unique constraint: (company_id, material_id)
No stock quantity tracked. Catalog is company-level, not material-level.

Materials creation policy (LOCKED 2026-04-19 — Option A):
- Companies can create NEW materials directly (POST /api/materials requires auth only, not ADMIN)
- Frontend: if search returns 0 results, shows "+ 'X' adıyla yeni malzeme oluştur" button
- Admin can also create materials via the same endpoint
- Global pool shared across all companies

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

Admin (/api/admin):  [DONE 2026-04-20 / updated 2026-04-21]
  POST   /companies/{primaryId}/merge/{secondaryId} -> Merge duplicate companies
  PUT    /companies/{id}/status                     -> Change company status
  GET    /companies/duplicates                      -> Levenshtein-based duplicate pairs (NEW 2026-04-21)
  GET    /materials                                 -> Admin material list (filter, search, paginated)
  GET    /materials/stats                           -> Material stats (total/userCreated/unused/suspicious)
  PUT    /materials/{id}                            -> Edit material name
  DELETE /materials/{id}                            -> Delete material
  POST   /materials/{targetId}/merge/{sourceId}     -> Merge two materials
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

DATA SCRAPER  [ACTIVE DEVELOPMENT — Phase 8 & 9]

Admin kullanım yöntemi (LOCKED 2026-05-24):
  Admin panelden tek firma girişi ile çalışır.
  Admin şu 3 bilgiyi girer: Firma Adı + Website URL + Sektör(lar)
  Sistem o firmayı scrape eder, sonucu admin'e gösterir.
  Admin beğenirse "Sisteme Aktar" der.

  Sektör seçenekleri (çoklu seçim — combobox):
    Çelik/Metal, Alüminyum, Demir/Dökme Demir, Bakır/Pirinç,
    Plastik/Polimer, İnşaat Malzemeleri, Elektrik/Elektronik,
    Makine/Endüstriyel Ekipman, Pompa/Vana/Boru, Bağlantı Elemanları,
    Kimya/Boya, Ahşap/Mobilya, Çeşitli

Current state (standalone Python module — /data-scraper/):
- Stack: requests + Selenium (Chrome headless) + BeautifulSoup + lxml
- Finds PDF/DOC/DOCX catalogs by crawling company websites (depth=2, up to 15 pages)
- Extracts contact info: phone, email, address (multiple strategies: Schema.org, footer, semantic HTML, labeled patterns, full-page regex)
- Status values: SUCCESS (katalog + iletişim) | PARTIAL (sadece katalog) | FAILED | ERROR
- Per-company output: D:\Sanayi Marketi Output\catalogs\{CompanyName}\company_info.json + indirilen katalog dosyaları
- Tek firma modu: python main.py --company "Firma Adı"
- Already scraped 7 companies: Borusan Boru, Çolakoğlu Metalurji, İçdaş Çelik,
  Yücel Boru, İzmir Demir Çelik, Borçelik, Kroman Çelik (hepsi PARTIAL — iletişim boş)

Mevcut sorunlar (başarı oranı çok düşük):
1. JS-heavy siteler: Türk sanayi sitelerinin çoğu React/Angular SPA. requests boş HTML alıyor.
   Selenium yavaş (~5-15sn/sayfa) ama şu an ANA SAYFADA BİLE önce Selenium çalışıyor.
2. Anti-bot: Cloudflare, captcha, rate limiting. Birçok site 403/429 döndürüyor.
3. İletişim bilgisi boş: phone/email çoğu firmada çıkarılamıyor.
4. city/district yok: company_info.json'da şehir/ilçe alanı yok — sisteme aktarım için gerekli.
5. Batch modu bozuk: process_batch() company_info.json yazmıyor, katalogları farklı klasöre koyuyor.
6. Katalog filtreleme yetersiz: Sistem hem gerçek katalog OLMAYAN dosyaları indiriyor
   (sertifikalar, KVKK metinleri, faaliyet raporları, ISO belgeleri vb.) hem de bazı
   sitelerdeki asıl ürün kataloglarına erişemiyor veya yanlış dosyayı indiriyor.
   PDF_NEGATIVE_KEYWORDS listesi var ama bazı alakasız dosyalar hâlâ geçiyor.
   Aynı zamanda katalog sayfası JS ile yükleniyorsa veya farklı bir URL pattern'ındaysa
   link tespit edilemiyor.
7. Logo ve açıklama çekilmiyor: Firma logosuna ve "hakkımızda" metnine erişim yok.
   Sisteme aktarım sırasında bu veriler de kullanılabilir olmalı.

company_info.json format (hedef output — Phase 8 sonrası):
  {
    "company_name": "Borusan Boru",
    "website": "https://borusanboru.com/",
    "sectors": ["Çelik/Metal"],
    "status": "SUCCESS",
    "contact_info": {
      "phone": "+90 212 XXX XX XX",
      "email": "info@borusanboru.com",
      "address": "Fatih Sultan Mehmet Mah. ...",
      "city": "İstanbul",
      "district": "Ümraniye"
    },
    "catalog_info": { "count": 4, "files": [...] },
    "imported": false,
    "scrape_date": "...",
    "scrape_timestamp": "..."
  }

  Not: "sector" → "sectors" (array) olarak değişti (çoklu sektör desteği için)
  Not: "imported" alanı eklendi — sisteme aktarılıp aktarılmadığını takip etmek için

---

PHASE 8 — Scraper Optimizasyonu  [IN PROGRESS — 8a ✓ 8b ✓]

Hedef: Tek firma scraping başarı oranını artır. Admin panelden tetiklenebilir hale getir.
Kapsam: data-scraper/ Python modülü. Backend/frontend değişikliği yok bu aşamada.

  8a. Selenium stratejisini düzelt  [TAMAMLANDI 2026-05-24]
      - Eski akış: her sayfa için önce Selenium → çok yavaş
      - Yeni akış (uygulandı): önce requests → içerik <500 karakter ise Selenium
      - Bilinen JS-heavy domainler için direkt Selenium (JS_HEAVY_DOMAINS listesi settings.py'de)
      - Değiştirilen dosyalar:
          config/settings.py     → JS_HEAVY_DOMAINS listesi + TESTS_DIR eklendi
          scrapers/generic_scraper.py → scrape() metodunda requests-first mantığı
                                        _is_js_heavy() metodu eklendi

  8a+. Test altyapısı  [TAMAMLANDI 2026-05-24]
      - --test N argümanı: sadece 7 test firmasını tarar, D:\Sanayi Marketi Output\tests\test-N\ klasörüne yazar
      - TEST_COMPANIES sabiti main.py'de — companies.json'daki 53 firmadan 35'ini filtreler (2026-05-25)
      - generate_test_info(): TEST_INFO.md otomatik oluşturur (tarih + sonuçlar tablosu + özet)
      - Değiştirilen dosyalar:
          main.py → TEST_COMPANIES, process_test_run(), generate_test_info(), --test argümanı

  8b. Katalog filtrelemeyi iyileştir  [TAMAMLANDI 2026-05-24]
      Sorunlar: (1) yanlış PDF indirme — sertifika/rapor/politika belgesi
                (2) gerçek katalog atlama — URL/dosya adında keyword olmayan ama katalog olan PDF'ler

      Uygulanan çözüm — should_download_url() yeni karar sırası:
        1. Negatif keyword varsa → ATLA  (eskiyle aynı)
        2. Pozitif keyword varsa → İNDİR  (eskiyle aynı)
        3. Nötr PDF + katalog sayfasından geldiyse (from_catalog_page=True) → İNDİR  (YENİ)
        4. Nötr PDF + URL path'inde katalog göstergesi varsa
           (/katalog/, /download/, /urunler/, /brosur/, /fiyat/ vb.) → İNDİR  (YENİ)
        5. Bunların hiçbiri yoksa → ATLA  (ESKİ: her nötr PDF indiriliyordu — değişti)

      from_catalog_page bağlamı:
        - extract_catalog_links() → from_catalog_page parametresi aldı
        - _find_all_catalogs(): alt sayfanın URL'sinde katalog/download/urunler vb. geçiyorsa
          from_catalog_page=True geçiriyor
        - Ana sayfa taraması daima from_catalog_page=False

      PDF_NEGATIVE_KEYWORDS genişletmesi (settings.py):
        Eklenenler: msds, sds, guvenlik-bilgi, guvenlik_bilgi,
                    basvuru-formu, basvuru_formu, teklif-formu, teklif_formu,
                    ihale-sartnamesi, ihale_sartnamesi

      get_url_score() güncellendi: from_catalog_page=True ise +20 bonus skor

      Değiştirilen dosyalar:
          config/settings.py         → PDF_NEGATIVE_KEYWORDS genişletildi
          utils/file_downloader.py   → should_download_url() yeni mantık + CATALOG_PATH_INDICATORS
                                       get_url_score() from_catalog_page parametresi
          scrapers/generic_scraper.py → extract_catalog_links() from_catalog_page parametresi
                                        _find_all_catalogs() katalog sayfası tespiti

  8c. city / district çıkarımı  [TAMAMLANDI 2026-05-24]
      - utils/location_extractor.py: extract_city_district() — 81 il listesi + heuristik ilçe tespiti
      - Öncelik: Schema.org addressRegion/Locality → adres metninden son match
      - company_info.json contact_info'ya city + district alanları eklendi
      - Değiştirilen dosyalar: settings.py, utils/location_extractor.py, utils/__init__.py,
        scrapers/generic_scraper.py, utils/json_writer.py, main.py

  8d. İletişim bilgisi iyileştirmesi  [TAMAMLANDI 2026-05-24]
      - Strateji 0.5 eklendi: HTML5 Microdata (itemprop="telephone/email/addressLocality/addressRegion")
      - Strateji 0.6 eklendi: OpenGraph + meta tag'lerden telefon/email
      - Schema.org contactPoint (nested + liste) parse desteği eklendi — büyük kurumsal siteler
      - _select_best_phone(): tüm sabit hatlar tercih edilir (sadece İstanbul değil)
      - common_contact_paths: 30+ URL pattern (eski 12'den genişletildi — /en/, /tr/, .html vb.)
      - Değiştirilen dosyalar: scrapers/generic_scraper.py

  8e. Logo ve açıklama çıkarımı  [TAMAMLANDI 2026-05-24]
      - _extract_logo_url(): og:image → twitter:image → apple-touch-icon (max boyut) → img[logo class/id/alt] → header img
      - _extract_description(): meta description → og:description → Schema.org → ilk anlamlı paragraf (puanlama ile)
      - company_info.json'a logo_url + description top-level alanlar olarak eklendi
      - Değiştirilen dosyalar: scrapers/generic_scraper.py, utils/json_writer.py, main.py

  8f. sectors alanına geçiş  [TAMAMLANDI 2026-05-24]
      - company_info.json'da "sector" string → "sectors" array olarak güncellendi
      - companies.json'daki "Çelik/Metal" gibi "/" ile ayrılmış değerler ["Çelik", "Metal"] array'ine split edilir
      - Admin panelden girilen sektörler bu alana yazılacak
      - Değiştirilen dosyalar: scrapers/generic_scraper.py, utils/json_writer.py, utils/excel_writer.py, config/settings.py, main.py

  8g. imported takibi  [TAMAMLANDI 2026-05-24]
      - company_info.json'a "imported": false alanı eklendi
      - Sisteme aktarılınca backend bu alanı true'ya güncellesin
      - Değiştirilen dosyalar: utils/json_writer.py

---

TEST METODOLOJİSİ  [LOCKED 2026-05-24]

Test şirketleri (35 adet — 2026-05-25 güncellendi):
  Doğrulanmış (test-1/2): Borusan Boru, Çolakoğlu Metalurji, İzmir Demir Çelik,
    Yücel Boru, Kroman Çelik, İçdaş Çelik
  Çelik/Metal: Noksel Çelik, Assan Alüminyum, Çemtaş Çelik, Kaptan Demir Çelik,
    Erbakır, Kardemir, Tosyalı Holding, Sarkuysan, KM Metal
  İnşaat/Yapı: Knauf, Mapei, Seranit, Fırat A.Ş.
  Elektrik/Elektronik: Nexans Türkiye, HES, EAE Elektrik, Sigma Elektrik,
    Onka Elektrik, Mutlusan, Best Transformer, Eine
  Endüstriyel/Mekanik: Ayvaz, Ekin Endüstriyel, Dizayn Grup, Vansan,
    Etna, Standart Pompa, Tuna Vida, Çözümbu
  Çıkarılan: Borçelik (sitede kamuya açık katalog yok, teyit edildi)

Başarı kriterleri (bir testin başarılı sayılması için):
  Zorunlu:
    - En az 1 iletişim kanalı (phone VEYA email)
    - Adres
    - En az 1 katalog (doğru katalog — ürün/fiyat içermeli, sertifika/rapor olmamalı)
  Bonus (çekilirse iyi olur):
    - Logo URL
    - Firma açıklaması (description)
    - city + district

Test klasörü yapısı:
  D:\Sanayi Marketi Output\tests\
    test-1/
      Borusan_Boru/company_info.json
      Çolakoğlu_Metalurji/company_info.json
      ...
      TEST_INFO.md   ← bu testte ne değiştirildi, hangi yöntem kullanıldı
    test-2/
      ...
      TEST_INFO.md
    ...

TEST_INFO.md içeriği (her test için):
  - Test numarası ve tarihi
  - Bu testte yapılan değişiklikler (hangi 8x alt görevi uygulandı)
  - 7 şirket için özet sonuçlar (SUCCESS/PARTIAL/FAILED + ne bulundu)
  - Önceki teste göre fark (iyileşme veya kötüleşme)

Not: Her test çalıştırması için scraper yeni TEST_INFO.md oluşturur.
     Eski test klasörleri silinmez — karşılaştırma için korunur.

---

TEST SONUÇLARI

  Test #1  [2026-05-24]
  Kapsam: 8c + 8d + 8e + 8f + 8g tüm değişiklikler

  | Firma               | Durum   | Tel | Email | Adres | Şehir  | İlçe  | Logo | Açıklama | Katalog |
  |---------------------|---------|-----|-------|-------|--------|-------|------|----------|---------|
  | Borusan Boru        | SUCCESS | ✗   | ✓     | ✗     | ✗      | ✗     | ✓    | ✓        | 4       |
  | Borçelik            | FAILED  | ✓   | ✓     | ✓     | Gemlik*| Bursa*| ✓    | ✓        | 0       |
  | Çolakoğlu Metalurji | SUCCESS | ✓   | ✗     | ✓     | ✗      | ✗     | ✓    | ✓        | 2       |
  | İzmir Demir Çelik   | FAILED  | ✓   | ✓     | ✗     | ✗      | ✗     | ✓    | ✓        | 0       |
  | Yücel Boru          | PARTIAL | ✗   | ✗     | ✗     | ✗      | ✗     | ✓    | ✓        | 8       |
  | Kroman Çelik        | PARTIAL | ✗   | ✗     | ✗     | ✗      | ✗     | ✓    | ✓        | 4       |
  | İçdaş Çelik         | PARTIAL | ✗   | ✗     | ✗     | ✗      | ✗     | ✓    | ✓        | 2       |

  Özet: SUCCESS: 2 | PARTIAL: 3 | FAILED: 2
  * Lokasyon swap bug — Borçelik için şehir/ilçe ters geldi (bkz. Bilinen Sorunlar)

  Başarılar:
    - Logo: 7/7 ✓ — her siteden çekildi
    - Açıklama: 7/7 ✓ — her siteden çekildi
    - sectors array: 7/7 ✓ — "Çelik/Metal" → ["Çelik", "Metal"]
    - imported: 7/7 ✓ — her JSON'da false olarak eklendi

  Sorunlar (bkz. Bilinen Sorunlar bölümü):
    - 3 firma PARTIAL: Yücel, Kroman, İçdaş — iletişim çekilemiyor (muhtemelen JS-rendered)
    - 2 firma FAILED: Borçelik (katalog sayfasına ulaşılamadı), İzmir Demir Çelik (PDF'ler indirilemiyor)
    - 6/7 lokasyon boş — adres bilgisi çoğu sitede çekilemiyor
    - 1 lokasyon swap: Borçelik için city/district ters

  Test #2  [2026-05-24]  ← BUG-1 + BUG-2 + BUG-3 + BUG-4 fix sonrası
  Kapsam: lokasyon swap fix, JS Selenium fallback, trusted download, Referer header

  | Firma               | Durum   | Tel | Email | Şehir | İlçe  | Logo | Açıklama | Katalog |
  |---------------------|---------|-----|-------|-------|-------|------|----------|---------|
  | Borusan Boru        | SUCCESS | ✗   | ✓     | ✗     | ✗     | ✓    | ✓        | 5       |
  | Borçelik            | FAILED  | ✓   | ✓     | Bursa | Gemlik| ✓    | ✓        | 0       |
  | Çolakoğlu Metalurji | SUCCESS | ✓   | ✗     | ✗     | ✗     | ✓    | ✓        | 6       |
  | İzmir Demir Çelik   | SUCCESS | ✓   | ✓     | ✗     | ✗     | ✓    | ✓        | 1       |
  | Yücel Boru          | PARTIAL | ✗   | ✗     | ✗     | ✗     | ✓    | ✓        | 12      |
  | Kroman Çelik        | PARTIAL | ✗   | ✗     | ✗     | ✗     | ✓    | ✓        | 6       |
  | İçdaş Çelik         | PARTIAL | ✗   | ✗     | ✗     | ✗     | ✓    | ✓        | 2       |

  Özet: SUCCESS: 3 | PARTIAL: 3 | FAILED: 1
  Test #1'e göre iyileşme:
    ✓ İzmir Demir Çelik: FAILED → SUCCESS (BUG-3 trusted download fix)
    ✓ Borçelik lokasyon: Gemlik/Bursa ters → Bursa/Gemlik doğru (BUG-1 fix)
    ✓ Toplam katalog sayısı arttı: Çolakoğlu +4, Yücel +4, Kroman +2, Borusan +1
    ~ BUG-2 (Yücel/Kroman/İçdaş iletişim): Selenium fallback devreye giriyor
      ama bu sitelerde iletişim bilgisi gerçekten gizlenmiş olabilir, araştırılacak

  Test #3  [2026-05-25]  ← 35 firma (genişletilmiş TEST_COMPANIES), encoding fix
  Kapsam: İlk 35 firma testi. Windows cp1254 encoding bug fix (sys.stdout.reconfigure).

  | Firma               | Durum   | Tel | Email | Adres | Şehir    | İlçe           | Logo | Açıklama | Katalog |
  |---------------------|---------|-----|-------|-------|----------|----------------|------|----------|---------|
  | Tosyalı Holding     | SUCCESS | ✓   | ✗     | ✗     | ✗        | ✗              | ✓    | ✓        | 22      |
  | Kardemir            | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗              | ✓    | ✓        | 0       |
  | Borusan Boru        | SUCCESS | ✗   | ✓     | ✗     | ✗        | ✗              | ✓    | ✓        | 5       |
  | Çolakoğlu Metalurji | SUCCESS | ✓   | ✗     | ✓     | ✗        | ✗              | ✓    | ✓        | 6       |
  | İzmir Demir Çelik   | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗              | ✓    | ✓        | 1       |
  | Noksel Çelik        | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗              | ✗    | ✓        | 0       |
  | Yücel Boru          | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗              | ✓    | ✓        | 12      |
  | Kroman Çelik        | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗              | ✓    | ✓        | 6       |
  | Assan Alüminyum     | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗              | ✓    | ✓        | 0       |
  | Çemtaş Çelik        | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗              | ✗    | ✗        | 2       |
  | Kaptan Demir Çelik  | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗              | ✗    | ✗        | 0       |
  | İçdaş Çelik         | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗              | ✓    | ✓        | 2       |
  | Erbakır             | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗              | ✗    | ✗        | 0 *BUG-5|
  | Knauf               | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗              | ✓    | ✓        | 0       |
  | Seranit             | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗              | ✓    | ✓        | 9       |
  | Mapei               | FAILED  | ✓   | ✓     | ✓     | Ankara   | Nergiz Sk*     | ✓    | ✓        | 0       |
  | Nexans Türkiye      | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗              | ✓    | ✓        | 0       |
  | Ayvaz               | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗              | ✓    | ✓        | 59      |
  | HES                 | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗              | ✗    | ✗        | 2       |
  | Fırat A.Ş.          | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗              | ✗    | ✗        | 1       |
  | Çözümbu             | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗              | ✗    | ✗        | 0       |
  | Eine                | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗              | ✗    | ✓        | 0       |
  | Ekin Endüstriyel    | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗              | ✗    | ✗        | 0       |
  | KM Metal            | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗              | ✓    | ✓        | 0       |
  | Dizayn Grup         | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗              | ✗    | ✓        | 1       |
  | Vansan              | SUCCESS | ✗   | ✓     | ✗     | ✗        | ✗              | ✗    | ✗        | 21      |
  | Etna                | SUCCESS | ✓   | ✓     | ✓     | İstanbul | Ümraniye –*    | ✓    | ✓        | 9       |
  | Standart Pompa      | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗              | ✓    | ✗        | 6       |
  | Best Transformer    | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗              | ✗    | ✗        | 0       |
  | Sigma Elektrik      | FAILED  | ✗   | ✓     | ✓     | İstanbul | No:15*         | ✓    | ✓        | 0       |
  | EAE Elektrik        | SUCCESS | ✓   | ✓     | ✓     | İstanbul | 34522 Esenyurt*| ✓    | ✓        | 57      |
  | Onka Elektrik       | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗              | ✓    | ✗        | 8       |
  | Mutlusan            | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗              | ✗    | ✓        | 0       |
  | Tuna Vida           | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗              | ✗    | ✗        | 1       |
  | Sarkuysan           | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗              | ✗    | ✗        | 0       |

  Özet: SUCCESS: 13 | PARTIAL: 6 | FAILED: 16
  * BUG-5: Erbakır — deep_scan 13 katalog buldu ama double-filter tümünü sildi (bkz. Bilinen Sorunlar)
  * BUG-6: İlçe parse hataları — adres satırı veya posta kodu ilçe alanına yazılıyor
    Mapei: ilçe="Nergiz Sk", Sigma: ilçe="No:15", EAE: ilçe="34522 Esenyurt", Etna: ilçe="Ümraniye –"

  Başarılar:
    - Logo: 22/35 ✓ (%63)
    - Açıklama: 24/35 ✓ (%69)
    - Yüksek katalog: Ayvaz 59, EAE Elektrik 57, Tosyalı 22, Vansan 21, Yücel 12

  Sorunlar:
    - 16 FAILED: çoğunda iletişim var ama katalog bulunamıyor
      8 firmada hem tel+email+adres var ama katalog 0 (Kaptan Demir, Erbakır*BUG-5, Eine,
      KM Metal, Mutlusan, Sarkuysan, Knauf, Nexans, Assan, Çözümbu, Ekin)
    - 6 PARTIAL: iletişim JS-rendered (Yücel, Kroman, İçdaş, Seranit, HES, Standart Pompa)
    - BUG-5 fix → Test #4 çalıştırıldı (bkz. sonraki test)

  Test #5  [2026-05-25]  ← BUG-6 fix (ilçe parse düzeltmesi)
  Kapsam: location_extractor.py — sk/cd keywords, ZIP prefix, em-dash, No:\d, rakamla başlayan token

  | Firma               | Durum   | Tel | Email | Adres | Şehir    | İlçe     | Logo | Açıklama | Katalog |
  |---------------------|---------|-----|-------|-------|----------|----------|------|----------|---------|
  | Tosyalı Holding     | SUCCESS | ✓   | ✗     | ✗     | ✗        | ✗        | ✓    | ✓        | 22      |
  | Kardemir            | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗        | ✓    | ✓        | 0       |
  | Borusan Boru        | SUCCESS | ✗   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 5       |
  | Çolakoğlu Metalurji | SUCCESS | ✓   | ✗     | ✓     | ✗        | ✗        | ✓    | ✓        | 6       |
  | İzmir Demir Çelik   | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 1       |
  | Noksel Çelik        | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✓        | 0       |
  | Yücel Boru          | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗        | ✓    | ✓        | 12      |
  | Kroman Çelik        | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗        | ✓    | ✓        | 6       |
  | Assan Alüminyum     | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗        | ✓    | ✓        | 0       |
  | Çemtaş Çelik        | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✓        | 2       |
  | Kaptan Demir Çelik  | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 0       |
  | İçdaş Çelik         | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗        | ✓    | ✓        | 2       |
  | Erbakır             | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 0 *BUG-7|
  | Knauf               | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗        | ✓    | ✓        | 0       |
  | Seranit             | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗        | ✓    | ✓        | 9       |
  | Mapei               | FAILED  | ✓   | ✓     | ✓     | Ankara   | ✗        | ✓    | ✓        | 0       |
  | Nexans Türkiye      | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗        | ✓    | ✓        | 0       |
  | Ayvaz               | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 59      |
  | HES                 | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗        | ✗    | ✗        | 2       |
  | Fırat A.Ş.          | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 1       |
  | Çözümbu             | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗        | ✗    | ✗        | 0       |
  | Eine                | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✓        | 0       |
  | Ekin Endüstriyel    | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗        | ✗    | ✗        | 0       |
  | KM Metal            | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✓    | ✓        | 0       |
  | Dizayn Grup         | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✓        | 1       |
  | Vansan              | SUCCESS | ✗   | ✓     | ✗     | ✗        | ✗        | ✗    | ✗        | 26      |
  | Etna                | SUCCESS | ✓   | ✓     | ✓     | İstanbul | Ümraniye | ✓    | ✓        | 9       |
  | Standart Pompa      | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗        | ✓    | ✗        | 6       |
  | Best Transformer    | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✗        | 0       |
  | Sigma Elektrik      | FAILED  | ✗   | ✓     | ✓     | İstanbul | ✗        | ✓    | ✓        | 0       |
  | EAE Elektrik        | SUCCESS | ✓   | ✓     | ✓     | İstanbul | Esenyurt | ✓    | ✓        | 57      |
  | Onka Elektrik       | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✗        | 8       |
  | Mutlusan            | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✓        | 1       |
  | Tuna Vida           | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 1       |
  | Sarkuysan           | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 0       |

  Özet: SUCCESS: 14 | PARTIAL: 6 | FAILED: 15
  Test #4 → Test #5 değişimleri (BUG-6 fix doğrulaması):

    ✓ Etna:          district "Ümraniye –" → "Ümraniye"  (em-dash temizlendi)
    ✓ Sigma:         district "No:15"      → ✗           (kapı no reddedildi)
    ✓ EAE Elektrik:  district "34522 Esenyurt" → "Esenyurt" (ZIP temizlendi, ilçe kaldı)
    ✓ Mapei:         district "Nergiz Sk"  → ✗           (sokak adı reddedildi)
    = SUCCESS/PARTIAL/FAILED sayıları değişmedi (BUG-6 sadece ilçe kalitesini etkiler, status'ı değil)

  Test #8  [2026-05-25]  ← B görevi araştırması (FAILED firma katalog tespiti)
  Kapsam: settings.py — kurumsal kaldırıldı PDF_NEGATIVE_KEYWORDS'ten, CATALOG_PAGE_KEYWORDS genişletildi.
          catalog_strategies.py — SPA tespiti (< 5 link → Selenium). Yeni common_paths eklendi.
          Sonuç: FAILED firmalara yardım etmedi. Kardemir flaky (SUCCESS→FAILED). Test #7 hâlâ baseline.

  | Firma               | Durum   | Tel | Email | Adres | Şehir    | İlçe     | Logo | Açıklama | Katalog  |
  |---------------------|---------|-----|-------|-------|----------|----------|------|----------|----------|
  | Tosyalı Holding     | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 22       |
  | Kardemir            | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 0 *flaky |
  | Borusan Boru        | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 5        |
  | Çolakoğlu Metalurji | SUCCESS | ✓   | ✗     | ✓     | ✗        | ✗        | ✓    | ✓        | 6        |
  | İzmir Demir Çelik   | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 1        |
  | Noksel Çelik        | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✓        | 0        |
  | Yücel Boru          | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 12       |
  | Kroman Çelik        | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 6        |
  | Assan Alüminyum     | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✓    | ✓        | 0        |
  | Çemtaş Çelik        | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✗        | 2        |
  | Kaptan Demir Çelik  | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 0        |
  | İçdaş Çelik         | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 2        |
  | Erbakır             | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✓        | 0 *BUG-7 |
  | Knauf               | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✓    | ✓        | 0        |
  | Seranit             | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✓    | ✓        | 9        |
  | Mapei               | FAILED  | ✓   | ✓     | ✓     | Ankara   | ✗        | ✓    | ✓        | 0        |
  | Nexans Türkiye      | FAILED  | ✓   | ✗     | ✗     | ✗        | ✗        | ✓    | ✓        | 0        |
  | Ayvaz               | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 59       |
  | HES                 | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗        | ✗    | ✗        | 2        |
  | Fırat A.Ş.          | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 1        |
  | Çözümbu             | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗        | ✗    | ✗        | 0        |
  | Eine                | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 0        |
  | Ekin Endüstriyel    | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗        | ✗    | ✗        | 0        |
  | KM Metal            | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✓    | ✓        | 0        |
  | Dizayn Grup         | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✓        | 1        |
  | Vansan              | SUCCESS | ✗   | ✓     | ✗     | ✗        | ✗        | ✗    | ✗        | 26       |
  | Etna                | SUCCESS | ✓   | ✓     | ✓     | İstanbul | Ümraniye | ✓    | ✓        | 9        |
  | Standart Pompa      | SUCCESS | ✓   | ✗     | ✓     | ✗        | ✗        | ✓    | ✗        | 6        |
  | Best Transformer    | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✗        | 0        |
  | Sigma Elektrik      | FAILED  | ✗   | ✓     | ✓     | İstanbul | ✗        | ✓    | ✓        | 0 *BUG-7 |
  | EAE Elektrik        | SUCCESS | ✓   | ✓     | ✓     | İstanbul | Esenyurt | ✓    | ✓        | 58       |
  | Onka Elektrik       | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✗        | 8        |
  | Mutlusan            | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✓        | 1        |
  | Tuna Vida           | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 1        |
  | Sarkuysan           | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 0        |

  Özet: SUCCESS: 19 | PARTIAL: 1 | FAILED: 15
  Test #7 → Test #8 değişimleri (B-task araştırması):
    ✗ Kardemir: SUCCESS(1) → FAILED(0) — flaky, test #7'deki katalog bugün açık değil/bloklandı
    = Tüm diğer FAILED firmalar değişmedi — B-task fixler etkisiz kaldı
    SONUÇ: Kalan FAILED firmalar için generic scraper çözüm üretemiyor.
           Gruplara göre: (1) BUG-7 (Erbakır, Sigma) (2) Site yapısı uyumsuz (3) Katalog yok

  Test #9  [2026-05-26]  ← BUG-7 (Wix CDN + SSL fallback) + BUG-8 (sertifika filtreleme) fix doğrulaması
  Kapsam: file_downloader.py — SSLError → verify=False retry. base_scraper.py — wix:document:// → CDN dönüşümü.
          settings.py + file_downloader.py — CERT_BODY_FILENAME_PREFIXES + CERT_FILENAME_PATTERNS (Step 0 kontrolü).
          Sonuç: Sigma FAILED→SUCCESS ✓, Ayvaz 59→29 ✓, Etna 9→7 ✓, Seranit 9→8 ✓.
                 Erbakır hâlâ FAILED (Wix plain path'ler 400). Standart Pompa ERROR (bağlantı sorunu).

  | Firma               | Durum   | Tel | Email | Adres | Şehir    | İlçe     | Logo | Açıklama | Katalog  |
  |---------------------|---------|-----|-------|-------|----------|----------|------|----------|----------|
  | Tosyalı Holding     | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 22       |
  | Kardemir            | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗        | ✓    | ✓        | 30 *flaky|
  | Borusan Boru        | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 5        |
  | Çolakoğlu Metalurji | SUCCESS | ✓   | ✗     | ✓     | ✗        | ✗        | ✓    | ✓        | 6        |
  | İzmir Demir Çelik   | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 1        |
  | Noksel Çelik        | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✓        | 0        |
  | Yücel Boru          | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 12       |
  | Kroman Çelik        | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 6        |
  | Assan Alüminyum     | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✓    | ✓        | 0        |
  | Çemtaş Çelik        | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✗        | 2        |
  | Kaptan Demir Çelik  | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 0        |
  | İçdaş Çelik         | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 2        |
  | Erbakır             | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✓        | 0 *Wix   |
  | Knauf               | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✓    | ✓        | 0        |
  | Seranit             | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✓    | ✓        | 8 *BUG-8 |
  | Mapei               | FAILED  | ✓   | ✓     | ✓     | Ankara   | ✗        | ✓    | ✓        | 0        |
  | Nexans Türkiye      | FAILED  | ✓   | ✗     | ✗     | ✗        | ✗        | ✓    | ✓        | 0        |
  | Ayvaz               | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 29 *BUG-8|
  | HES                 | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗        | ✗    | ✗        | 2        |
  | Fırat A.Ş.          | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 1        |
  | Çözümbu             | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗        | ✗    | ✗        | 0        |
  | Eine                | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 0        |
  | Ekin Endüstriyel    | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗        | ✗    | ✗        | 0        |
  | KM Metal            | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✓    | ✓        | 0        |
  | Dizayn Grup         | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✓        | 1        |
  | Vansan              | SUCCESS | ✗   | ✓     | ✗     | ✗        | ✗        | ✗    | ✗        | 26       |
  | Etna                | SUCCESS | ✓   | ✓     | ✓     | İstanbul | Ümraniye | ✓    | ✓        | 7 *BUG-8 |
  | Standart Pompa      | ERROR   | ✗   | ✗     | ✗     | ✗        | ✗        | ✗    | ✗        | 0 *bağl. |
  | Best Transformer    | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✗        | 0        |
  | Sigma Elektrik      | SUCCESS | ✗   | ✓     | ✓     | İstanbul | ✗        | ✓    | ✓        | 5 *BUG-7 |
  | EAE Elektrik        | SUCCESS | ✓   | ✓     | ✓     | İstanbul | Esenyurt | ✓    | ✓        | 58       |
  | Onka Elektrik       | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✗        | 8        |
  | Mutlusan            | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✓        | 1        |
  | Tuna Vida           | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 1        |
  | Sarkuysan           | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 0        |

  Özet: SUCCESS: 19 | PARTIAL: 2 | FAILED: 13 | ERROR: 1
  Test #8 → Test #9 değişimleri (BUG-7 + BUG-8 doğrulaması):
    ✓ Sigma Elektrik:  FAILED(0)  → SUCCESS(5)  — BUG-7 SSL fallback çalıştı ✓
    ✓ Ayvaz:           SUCCESS(59) → SUCCESS(29) — 30 sertifika belgesi engellendi (BUG-8 ✓)
    ✓ Etna:            SUCCESS(9)  → SUCCESS(7)  — KrediKartı formu kaldırıldı (BUG-8 ✓)
    ✓ Seranit:         SUCCESS(9)  → SUCCESS(8)  — İnternet rehberi kaldırıldı (BUG-8 ✓)
    ~ Kardemir:        FAILED(0)   → PARTIAL(30) — flaky: 30 katalog buldu ama iletişim boş
    ✗ Standart Pompa:  SUCCESS(6)  → ERROR(0)    — bağlantı sorunu, araştırılacak
    ~ Erbakır:         FAILED(0)   → FAILED(0)   — Wix CDN dönüşümü kısmen çalıştı (13 URL CDN'e çevrildi)
                                                     ama plain path PDF'ler sunucudan 400 alıyor; kök neden: Wix
                                                     dosyaları farklı bir alan adında sunuyor olabilir
  * Ayvaz test #9 indirilenler (29 dosya, tamamı meşru katalog):
    AYVAZ-LNG, Kondenstop, ayvaz-yangin-katalog, Solar, Marine_Products, Steam-Equipment, Vana,
    Indoor-flex, Level-Controller, Expansion_Joints, exchangers-shelltube, expansion_joints_book,
    Valves, Oil-Gas, Industrial-Solution, Sprinkler, Fancoil, Hortum, CE_All_Products, Heat-Pump,
    Boilerflex, Expansion-Joints, Flexible-Metal-Hose, Seviye, fire_protection_book, ADS davlumbaz(×2), AEQ, Hydrogenn

  Test #10  [2026-05-27]  ← Strategy 6 (script tag) + Selenium scroll+wait eklendi
  Kapsam: base_scraper.py — fetch_page_with_js() scroll+0.8s wait eklendi (lazy-load).
          generic_scraper.py — _extract_from_script_tags() Strategy 6 eklendi (React/Angular inline data).
  Hedef: HES iletişim bilgisi çıkarımı + Standart Pompa flaky kontrolü.
  Sonuç: HES hâlâ PARTIAL (cookie consent popup Selenium'u bloklıyor — logo/açıklama da boş).
          Standart Pompa SUCCESS'e döndü (test-9 flaky'ydi).

  | Firma               | Durum   | Tel | Email | Adres | Şehir    | İlçe     | Logo | Açıklama | Katalog  |
  |---------------------|---------|-----|-------|-------|----------|----------|------|----------|----------|
  | Tosyalı Holding     | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 22       |
  | Kardemir            | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 1        |
  | Borusan Boru        | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 5        |
  | Çolakoğlu Metalurji | SUCCESS | ✓   | ✗     | ✓     | ✗        | ✗        | ✓    | ✓        | 6        |
  | İzmir Demir Çelik   | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 1        |
  | Noksel Çelik        | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✓        | 0        |
  | Yücel Boru          | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 12       |
  | Kroman Çelik        | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 6        |
  | Assan Alüminyum     | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✓    | ✓        | 0        |
  | Çemtaş Çelik        | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✓        | 2        |
  | Kaptan Demir Çelik  | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✗        | 0        |
  | İçdaş Çelik         | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 2        |
  | Erbakır             | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✓        | 0        |
  | Knauf               | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 0        |
  | Seranit             | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✓    | ✓        | 8        |
  | Mapei               | FAILED  | ✓   | ✓     | ✓     | Ankara   | ✗        | ✓    | ✓        | 0        |
  | Nexans Türkiye      | FAILED  | ✓   | ✗     | ✗     | ✗        | ✗        | ✓    | ✓        | 0        |
  | Ayvaz               | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 29       |
  | HES                 | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗        | ✗    | ✗        | 2        |
  | Fırat A.Ş.          | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 1        |
  | Çözümbu             | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗        | ✗    | ✗        | 0        |
  | Eine                | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✗        | 0        |
  | Ekin Endüstriyel    | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗        | ✗    | ✗        | 0        |
  | KM Metal            | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 0        |
  | Dizayn Grup         | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✓        | 1        |
  | Vansan              | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✗        | 26       |
  | Etna                | SUCCESS | ✓   | ✓     | ✓     | İstanbul | Ümraniye | ✓    | ✓        | 7        |
  | Standart Pompa      | SUCCESS | ✓   | ✗     | ✓     | ✗        | ✗        | ✓    | ✗        | 6        |
  | Best Transformer    | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✗        | 0        |
  | Sigma Elektrik      | SUCCESS | ✗   | ✓     | ✓     | İstanbul | ✗        | ✓    | ✓        | 5        |
  | EAE Elektrik        | SUCCESS | ✓   | ✓     | ✓     | İstanbul | Esenyurt | ✓    | ✓        | 58       |
  | Onka Elektrik       | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✗        | 8        |
  | Mutlusan            | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✓        | 1        |
  | Tuna Vida           | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 1        |
  | Sarkuysan           | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 0        |

  Özet: SUCCESS: 20 | PARTIAL: 1 | FAILED: 14
  Test #9 → Test #10 değişimleri:
    ✓ Standart Pompa: ERROR → SUCCESS — test-9 flaky'ydi, bağlantı sorunu geçiciydi
    ✗ HES: hâlâ PARTIAL — cookie consent popup Selenium'u bloklıyor (logo+açıklama da boş)
    = Diğer tüm firmalar aynı
  KARAR: HES PARTIAL olarak kabul edildi. Script tag stratejisi + scroll işe yaramadı.
         Cookie consent engelini aşmak için özel çözüm gerekir — maliyet/fayda oranı yüksek.
         TODO-8 TAMAMLANDI — TODO-10'a geçmeye hazır.

  Test #7  [2026-05-25]  ← BUG-2 fix (navigasyon linkleri önce — iletişim sayfası sıralama)
  Kapsam: _find_contact_info() — found_pages önce, common_contact_paths sonra; .php varyantları eklendi;
          max_contact_pages 8→12. (Test #6 internet kesintisi nedeniyle geçersiz, #7 temiz tekrar.)

  | Firma               | Durum   | Tel | Email | Adres | Şehir    | İlçe     | Logo | Açıklama | Katalog |
  |---------------------|---------|-----|-------|-------|----------|----------|------|----------|---------|
  | Tosyalı Holding     | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 22      |
  | Kardemir            | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 1       |
  | Borusan Boru        | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 5       |
  | Çolakoğlu Metalurji | SUCCESS | ✓   | ✗     | ✓     | ✗        | ✗        | ✓    | ✓        | 6       |
  | İzmir Demir Çelik   | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 1       |
  | Noksel Çelik        | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✓        | 0       |
  | Yücel Boru          | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 12      |
  | Kroman Çelik        | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 6       |
  | Assan Alüminyum     | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✓    | ✓        | 0       |
  | Çemtaş Çelik        | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✗        | 2       |
  | Kaptan Demir Çelik  | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 0       |
  | İçdaş Çelik         | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 2       |
  | Erbakır             | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 0 *BUG-7|
  | Knauf               | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✓    | ✓        | 0       |
  | Seranit             | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✓    | ✓        | 9       |
  | Mapei               | FAILED  | ✓   | ✓     | ✓     | Ankara   | ✗        | ✓    | ✓        | 0       |
  | Nexans Türkiye      | FAILED  | ✓   | ✗     | ✗     | ✗        | ✗        | ✓    | ✓        | 0       |
  | Ayvaz               | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✓        | 59      |
  | HES                 | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗        | ✗    | ✗        | 2       |
  | Fırat A.Ş.          | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 1       |
  | Çözümbu             | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗        | ✗    | ✗        | 0       |
  | Eine                | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 0       |
  | Ekin Endüstriyel    | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗        | ✗    | ✗        | 0       |
  | KM Metal            | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✓    | ✓        | 0       |
  | Dizayn Grup         | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✓        | 1       |
  | Vansan              | SUCCESS | ✗   | ✓     | ✗     | ✗        | ✗        | ✗    | ✗        | 26      |
  | Etna                | SUCCESS | ✓   | ✓     | ✓     | İstanbul | Ümraniye | ✓    | ✓        | 9       |
  | Standart Pompa      | SUCCESS | ✓   | ✗     | ✓     | ✗        | ✗        | ✓    | ✗        | 6       |
  | Best Transformer    | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗        | ✗    | ✗        | 0       |
  | Sigma Elektrik      | FAILED  | ✗   | ✓     | ✓     | İstanbul | ✗        | ✓    | ✓        | 0 *BUG-7|
  | EAE Elektrik        | SUCCESS | ✓   | ✓     | ✓     | İstanbul | Esenyurt | ✓    | ✓        | 57      |
  | Onka Elektrik       | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗        | ✓    | ✗        | 8       |
  | Mutlusan            | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✓        | 1       |
  | Tuna Vida           | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 1       |
  | Sarkuysan           | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗        | ✗    | ✗        | 0       |

  Özet: SUCCESS: 20 | PARTIAL: 1 | FAILED: 14
  Test #5 → Test #7 değişimleri (BUG-2 fix doğrulaması):
    ✓ Yücel Boru:    PARTIAL(tel✗ email✗) → SUCCESS(tel✓ email✓) — /iletisim.php bulundu
    ✓ Kroman Çelik:  PARTIAL(tel✗ email✗) → SUCCESS(tel✓ email✓) — /iletisim.php bulundu
    ✓ İçdaş Çelik:   PARTIAL(tel✗ email✗) → SUCCESS(tel✓ email✓) — navigasyon linki önce denendi
    ✓ Seranit:        PARTIAL(tel✗ email✗) → SUCCESS(tel✓ email✓) — /tr/Iletisim bulundu
    ✓ Standart Pompa: PARTIAL(tel✗ email✗) → SUCCESS(tel✓ email✗) — /tr/iletisim/... bulundu
    ~ HES:            PARTIAL(tel✗ email✗) → PARTIAL(tel✗ email✗) — iletişim sayfası hâlâ JS-heavy
    ~ Sigma Elektrik: log'da 5 katalog tespit ama 0 indirildi (BUG-7 benzeri download failure)

  Test #4  [2026-05-25]  ← BUG-5 fix (double-filter kaldırıldı)
  Kapsam: _try_alternative_strategies içindeki should_download_url re-filter kaldırıldı.

  | Firma               | Durum   | Tel | Email | Adres | Şehir    | İlçe           | Logo | Açıklama | Katalog |
  |---------------------|---------|-----|-------|-------|----------|----------------|------|----------|---------|
  | Tosyalı Holding     | SUCCESS | ✓   | ✗     | ✗     | ✗        | ✗              | ✓    | ✓        | 22      |
  | Kardemir            | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗              | ✓    | ✓        | 0       |
  | Borusan Boru        | SUCCESS | ✗   | ✓     | ✗     | ✗        | ✗              | ✓    | ✓        | 5       |
  | Çolakoğlu Metalurji | SUCCESS | ✓   | ✗     | ✓     | ✗        | ✗              | ✓    | ✓        | 6       |
  | İzmir Demir Çelik   | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗              | ✓    | ✓        | 1       |
  | Noksel Çelik        | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗              | ✗    | ✓        | 0       |
  | Yücel Boru          | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗              | ✓    | ✓        | 12      |
  | Kroman Çelik        | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗              | ✓    | ✓        | 6       |
  | Assan Alüminyum     | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗              | ✓    | ✓        | 0       |
  | Çemtaş Çelik        | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗              | ✗    | ✓        | 2       |
  | Kaptan Demir Çelik  | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗              | ✗    | ✗        | 0       |
  | İçdaş Çelik         | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗              | ✓    | ✓        | 2       |
  | Erbakır             | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗              | ✗    | ✗        | 0 *BUG-7|
  | Knauf               | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗              | ✓    | ✓        | 0       |
  | Seranit             | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗              | ✓    | ✓        | 9       |
  | Mapei               | FAILED  | ✓   | ✓     | ✓     | Ankara   | Nergiz Sk*     | ✓    | ✓        | 0       |
  | Nexans Türkiye      | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗              | ✓    | ✓        | 0       |
  | Ayvaz               | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗              | ✓    | ✓        | 59      |
  | HES                 | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗              | ✗    | ✗        | 2       |
  | Fırat A.Ş.          | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗              | ✗    | ✗        | 1       |
  | Çözümbu             | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗              | ✗    | ✗        | 0       |
  | Eine                | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗              | ✗    | ✗        | 0       |
  | Ekin Endüstriyel    | FAILED  | ✗   | ✗     | ✗     | ✗        | ✗              | ✗    | ✗        | 0       |
  | KM Metal            | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗              | ✓    | ✓        | 0       |
  | Dizayn Grup         | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗              | ✗    | ✓        | 1       |
  | Vansan              | SUCCESS | ✗   | ✓     | ✗     | ✗        | ✗              | ✗    | ✗        | 26      |
  | Etna                | SUCCESS | ✓   | ✓     | ✓     | İstanbul | Ümraniye –*    | ✓    | ✓        | 9       |
  | Standart Pompa      | PARTIAL | ✗   | ✗     | ✗     | ✗        | ✗              | ✓    | ✗        | 6       |
  | Best Transformer    | FAILED  | ✓   | ✓     | ✗     | ✗        | ✗              | ✗    | ✗        | 0       |
  | Sigma Elektrik      | FAILED  | ✗   | ✓     | ✓     | İstanbul | No:15*         | ✓    | ✓        | 0       |
  | EAE Elektrik        | SUCCESS | ✓   | ✓     | ✓     | İstanbul | 34522 Esenyurt*| ✓    | ✓        | 57      |
  | Onka Elektrik       | SUCCESS | ✓   | ✓     | ✗     | ✗        | ✗              | ✓    | ✗        | 8       |
  | Mutlusan            | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗              | ✗    | ✓        | 1       |
  | Tuna Vida           | SUCCESS | ✓   | ✓     | ✓     | ✗        | ✗              | ✗    | ✗        | 1       |
  | Sarkuysan           | FAILED  | ✓   | ✓     | ✓     | ✗        | ✗              | ✗    | ✗        | 0       |

  Özet: SUCCESS: 14 | PARTIAL: 6 | FAILED: 15
  * BUG-7: Erbakır — deep_scan artık 13 URL buluyor (BUG-5 fix ✓) ama tüm indirmeler sessizce başarısız
            Olası neden: deep_scan session'ına bağlı URL'ler (cookie/auth) veya JS-triggered download

  Test #3 → Test #4 değişimleri:
    ✓ Mutlusan: FAILED(0) → SUCCESS(1) — BUG-5 fix çalıştı (example.pdf, 711KB, gerçek dosya)
    ✓ Vansan:   SUCCESS(21) → SUCCESS(26) — +5 katalog
    ~ Kardemir: Test #3'te tel+email vardı, Test #4'te yok — flaky (site içeriği değişken)
    ~ Erbakır:  "Bulunan katalog: 13" artık doğru gösteriliyor ama indirilemedi (BUG-7)

---

BİLİNEN SORUNLAR  [2026-05-24]

  BUG-1: Lokasyon swap — schema.org addressRegion/addressLocality karışıklığı  [DÜZELTILDI 2026-05-24]
    Neden: Bazı siteler addressRegion'a il yerine ilçe yazıyor (örn. Borçelik: region="Gemlik").
           Kod 81-il listesiyle eşleşme bulamazsa region değerini olduğu gibi city olarak kullanıyordu.
    Düzeltme: Her iki alanı önce 81-il listesiyle eşleştir; il olan → şehir, il olmayan → ilçe adayı.
               region il değilse ama locality il ise: city=locality, district candidate=region.
    Dosya: utils/location_extractor.py → extract_city_district()

  BUG-2: JS-rendered iletişim sayfaları — tel/email çekilemiyor  [DÜZELTILDI 2026-05-25]
    Neden: _find_contact_info() common_contact_paths (~40 hardcoded URL) listesini, navigasyondan
           bulunan gerçek linklere ÖNCE ekliyordu. max_contact_pages=8 ile hardcoded 404'ler bütçeyi
           tüketince /iletisim.php, /tr/Iletisim, /tr/bize-ulasin gibi gerçek URL'ler hiç denenmiyordu.
    Düzeltme:
      1. found_pages (navigasyondan bulunan) artık listeye ÖNCE ekleniyor
      2. common_contact_paths'e .php varyantları (/iletisim.php, /contact.php, /hakkimizda.php)
         ve /tr/Iletisim, /tr/bize-ulasin eklendi
      3. max_contact_pages 8 → 12
    Dosya: scrapers/generic_scraper.py → _find_contact_info()
    Test #7 doğrulaması: 5/6 PARTIAL firma SUCCESS'e geçti.
      ✓ Yücel Boru, Kroman Çelik, İçdaş Çelik, Seranit, Standart Pompa
      ~ HES: hâlâ PARTIAL — iletişim sayfası (hes.com.tr/tr/bize-ulasin) tamamen JS-rendered,
             Selenium de phone/email çıkaramıyor. Ayrı inceleme gerekiyor.

  BUG-3: İzmir Demir Çelik — PDF'ler bulunuyor ama indirilemiyor  [DÜZELTILDI 2026-05-24]
    Neden: _find_all_catalogs URL'leri buldu, ama download() içindeki should_download_url filtresi
           pozitif keyword veya katalog yolu bulamayınca tekrar blokladı. PDF'ler erişilebilir durumda.
    Düzeltme: _download_catalogs artık trusted=True ile çağrıyor; discovery'den geçmiş URL'ler
               download aşamasında tekrar filtrelenmez. Ayrıca Referer header da eklendi.
    Dosya: utils/file_downloader.py, scrapers/generic_scraper.py → _download_catalogs()

  BUG-4: Borçelik — katalog sayfasına ulaşılamıyor  [KAPATILDI - Geçerli FAILED]
    Neden: Manuel inceleme yapıldı. Borçelik'in web sitesinde kamuya açık indirilebilir
           ürün kataloğu bulunmuyor. Yalnızca Çerez Politikası PDF'i mevcut.
           Scraper doğru davranıyor — FAILED sonucu beklenen çıktı.
    Aksiyon: Test firmaları listesinden çıkarılabilir veya olduğu gibi bırakılabilir.

  BUG-5: _try_alternative_strategies double-filter — deep_scan katalogları siliniyor  [DÜZELTILDI 2026-05-25]
    Neden: _try_alternative_strategies() içinde, StrategyManager'dan dönen katalog URL'leri
           should_download_url(url, '') ile tekrar filtreleniyordu. Deep_scan kendi içinde
           PDF_NEGATIVE_KEYWORDS ile zaten filtrelemiş olsa da, should_download_url "context
           kayıpları" nedeniyle (from_catalog_page=False, boş link_text) nötr URL'lerin
           tümünü reddediyordu. Sonuç: deep_scan 13 katalog bulsa bile "Bulunan katalog: 0".
    Test #3 kanıtı: Erbakır → "[deep_scan] 10 sayfa tarandı, 13 katalog bulundu" → "Bulunan katalog: 0"
    Düzeltme: _try_alternative_strategies içindeki re-filter döngüsü kaldırıldı.
              Stratejiler kendi filtrelemelerini yapıyor; _download_catalogs trusted=True kullandığı
              için indirme aşamasında da sorun yok.
    Dosya: scrapers/generic_scraper.py → _try_alternative_strategies()
    Etkilenen firmalar (Test #3): Erbakır (13 katalog), muhtemelen Kaptan Demir, KM Metal,
                                   Mutlusan, Sarkuysan da benzer şekilde etkilendi.

  BUG-7: Katalog URL'leri tespit ediliyor ama indirilemedi  [DÜZELTILDI 2026-05-25]
    Etkilenen: Erbakır (13 URL tespit, 0 indirildi), Sigma Elektrik (5 URL tespit, 0 indirildi)
    Kök neden analizi (log inceleme ile tespit edildi):
      Erbakır (wix.com tabanlı site):
        a) wix:document://v1/ugd/HASH.pdf/... URL'leri — HTTP değil, Wix iç protokolü.
           requests "No connection adapters" hatası verdi.
        b) \/GUID\/hash-name.pdf backslash-escaped path'ler — requests \ → %5C encode eder,
           sunucu 400 Bad Request döndü.
        c) /Haftalık LME Bakır Bülteni-XX. Hafta.pdf plain path'ler — Wix CDN'de,
           www.erbakir.com.tr üzerinde yok, sunucu 400/redirect verdi.
      Sigma Elektrik:
        SSLCertVerificationError — sigmaelektrik.com SSL sertifikası geçersiz,
        tüm 5 download "certificate verify failed" ile başarısız oldu.
    Düzeltme:
      1. base_scraper.py resolve_url(): wix:document://v1/ugd/HASH.pdf →
         https://static.wixstatic.com/ugd/HASH.pdf CDN dönüşümü.
         \/ → / backslash normalizasyonu.
      2. catalog_strategies.py _extract_catalogs_from_soup(): resolve_href() helper eklendi,
         tüm 4 kaynak (a href, data-*, onclick, script) Wix-aware hale getirildi.
      3. file_downloader.py download(): SSLError yakalandığında verify=False ile
         otomatik yeniden deneme.
    Beklenti (test-9'da doğrulanacak):
      Sigma: SSL fallback ile 5 PDF indirilmeli → SUCCESS
      Erbakır: Wix CDN dönüşümü en az 1 URL'i kurtarmalı. Plain path'ler hâlâ 400 alabilir.
    Durum: DÜZELTILDI — test-9 ile doğrulanacak

  BUG-8: Alakasız sertifika/form belgeleri katalog olarak indiriliyor  [DÜZELTILDI 2026-05-26]
    Neden: from_catalog_page=True modunda step 3 tüm PDF'leri kabul eder.
           Ürün katalog sayfalarında DVGW, Bureau Veritas, BSI, DNV-GL, TÜV, VDS, UL,
           KIWA, ASME, AGA, AENOR, CSA, IEP-ATEX sertifikaları da listelenir.
    Düzeltme: should_download_url() içine Step 0 olarak sertifika kuruluşu dosya adı
              prefix kontrolü eklendi. from_catalog_page=True'dan önce çalışır.
              CERT_BODY_FILENAME_PREFIXES (24 prefix) + CERT_FILENAME_PATTERNS (5 pattern)
              → config/settings.py ve utils/file_downloader.py
              Ayrıca PDF_NEGATIVE_KEYWORDS'e 'kredikart' ve 'internet_sitesi' eklendi.
    Test: 20/20 sertifika bloklandı, 11/11 katalog geçti (birim test).

  BUG-6: İlçe parse hataları — adres satırı veya posta kodu ilçe alanına yazılıyor  [DÜZELTILDI 2026-05-25]
    Neden: location_extractor.py adres metninden ilçe tespit ederken posta kodu veya
           adres kalıpları ("No:15", "34522 Esenyurt", "Nergiz Sk", "Ümraniye –") ilçe
           alanına kaçıyor.
    Test #3 örnekleri:
      Mapei:          city=Ankara ✓  district="Nergiz Sk"      (adres satırı)
      Sigma Elektrik: city=İstanbul ✓ district="No:15"          (kapı no)
      EAE Elektrik:   city=İstanbul ✓ district="34522 Esenyurt" (posta kodu + ilçe birlikte)
      Etna:           city=İstanbul ✓ district="Ümraniye –"     (tire karakteri)
    Öneri:
      1. İlçe adayını 81 il + bilinen ilçe listesiyle doğrula (regex ile sayı/özel karakter içeriyorsa reddet)
      2. Posta kodu pattern'i (\d{5}) tespit edilirse sil
      3. Bilinen sonek kalıplarını temizle (Cad., Sk., Sok., No:, Mah. gibi adres bileşenleri)
    Dosya: utils/location_extractor.py → extract_city_district(), _is_district_candidate(), _clean_component()
    Durum: DÜZELTILDI 2026-05-25 — Test #5'te doğrulanacak.

---

PHASE 9 — Katalog Analizi → Malzeme Çıkarımı  [TAMAMLANDI 2026-05-29]

Hedef: İndirilen PDF kataloglarından ürün/malzeme isimlerini çıkar.
       Bu isimler admin onayıyla global malzeme havuzuna eklenir.

ÖNEMLİ: Katalog analizi firma verisinden BAĞIMSIZ çalışır.
  - Bir firmanın scrape'i başarılı oldu → firma "Katalog Analizi" paneline düşer
  - Admin o firmayı istediği zaman ayrıca analiz ettirir
  - Analiz edilmiş kataloglar ayrı takip edilir (tekrar analiz engeli)

Pipeline:
  [D:\Sanayi Marketi Output\catalogs\{CompanyName}\ klasöründeki PDF dosyaları]
    → CatalogAnalyzer her PDF'i okur
    → Sayfa sayfa metin çıkarır (pdfminer / PyMuPDF)
    → Ürün/malzeme isimlerini tespit eder
    → materials_candidates.json olarak kaydeder
    → Admin /admin/scraper Tab 3'te adayları inceler
    → Onayla / Düzenle / Reddet
    → Onaylananlar → POST /api/admin/scraper/materials/import → malzeme havuzu

materials_candidates.json format:
  {
    "company_name": "Borusan Boru",
    "catalog_file": "genel-urun-katalogu.pdf",
    "analyzed_at": "2026-05-23T10:00:00",
    "extraction_method": "rule-based",
    "candidates": [
      { "name": "Dikişsiz Çelik Boru", "confidence": 0.92, "source_page": 3 },
      { "name": "Kaynaklı Boru",        "confidence": 0.88, "source_page": 5 },
      { "name": "Galvanizli Boru",      "confidence": 0.85, "source_page": 7 }
    ],
    "total_candidates": 3,
    "status": "PENDING_REVIEW"
  }

Extraction approach (LOCKED 2026-05-29 — Option A):
  pdfminer.six (metin çıkarımı) + Rule-based (Türkçe sanayi keyword'leri + regex)
  Ücretsiz, GPU gerektirmez, dijital PDF'lerde yüksek başarı.
  Taranmış PDF fallback: Surya OCR 2 (GGUF, CPU-compatible) — eklenmedi, gerekirse eklenir.

Python module: data-scraper/catalog_analyzer.py  [TAMAMLANDI 2026-05-29]
  - Bağımsız çalışır: python catalog_analyzer.py --company "Borusan Boru"
  - python catalog_analyzer.py --company "Dizayn Grup" --test-dir 10
  - python catalog_analyzer.py --pdf "/path/to/file.pdf" --company "Test"
  - company_info.json'dan PDF listesini okur
  - materials_candidates.json yazar (aynı klasöre)
  - Bağımlılık: pdfminer.six (requirements.txt'e eklendi)

Test sonucu (Dizayn Grup — dizayn-fiyat-listesi.pdf, 28 sayfa):
  28 sayfa, 6082 satır → 88 aday (86 yüksek güven, 2 düşük)
  Doğru tespitler: PP-R Boru, Kompozit Boru, Rakorlu Dirsek, Küresel Vana,
                   Kelepçe çeşitleri, Atık Su Boruları, PE-RT Boru, Kollektör vb.
  False positive oranı: ~%10 (admin review ile kolayca elenir)

---

PHASE 10 — Backend + Frontend Entegrasyonu  [TAMAMLANDI 2026-05-27]

Backend (AdminController + ScraperService — TAMAMLANDI 2026-05-27):

  Yeni DTOs:
    ScraperRunRequestDTO    { companyName, website, sectors[] }
    ScraperResultDTO        { companyName, website, status, phone, email, address, city, district,
                              logoUrl, description, scrapeDate, errorMessage, sectors[], catalogFiles[], catalogCount, imported }
    ScraperImportRequestDTO { companyName, website, sectors[], phone, email, city, district, address,
                              catalogFile (tek dosya adı), logoUrl, description }
    ScraperImportResultDTO  { companyId, applicationId }
    MaterialImportItemDTO   { materialName, companyId? }
    MaterialImportResultDTO { created, duplicates[], errors[] }

  Yeni Service: ScraperService.java
    @Value("${scraper.output-dir}")  →  D:/Sanayi Marketi Output
    @Value("${scraper.script-dir}")  →  C:/Users/Yusuf/Desktop/Sanayi Marketi/data-scraper
    runScraper():
      - UTF-8 temp JSON dosyası yazar (charset sorununu önler)
      - ProcessBuilder: python main.py --input-json {tempFile}  (PYTHONIOENCODING=utf-8)
      - stdout/stderr okunur ve @Slf4j ile loglanır (log.debug başarıda, log.warn zaman aşımı/dosya yok)
      - stdoutReader thread join edilir: zaman aşımında join(3000), normal bitişte join(5000)
      - 600 saniye timeout; zaman aşımında destroyForcibly() + log
      - Tamamlandıktan sonra company_info.json'ı okur, ScraperResultDTO döner
    getScraperResults():
      - scraperOutputDir/catalogs/ altındaki tüm company_info.json'ları tarar
      - scrapeDate'e göre desc sıralar
      - Parse hataları log.warn ile loglanır (sessizce yutulmaz)
    importCompany():
      - Company (status: INACTIVE) kaydı oluşturur
      - catalogFile varsa: ~/sanayi-marketi-uploads/catalogs/{companyId}/ klasörüne kopyalar
      - CompanyApplication (type: AUTO_IMPORTED, status: PENDING, user: adminUser) oluşturur
      - Admin kullanıcısı: önce findByEmail("admin@sanayimarketi.com"),
        bulunamazsa UserRepository.findFirstByRole(ADMIN) — findAll() kullanılmaz
      - company_info.json'da imported: true yazar (setImportedFlag); IOException log.warn ile loglanır
    importMaterials():
      - existsByMaterialNameIgnoreCase ile duplicate kontrolü
      - Yeni malzeme: normalizedName türetilerek Materials tablosuna eklenir
    sanitizeFilename():
      - Python'un sanitize_filename mantığını Java'da birebir uygular
      - "<>:\"/\\|?*" ve boşlukları "_" yapar, "__ → _" collapse, baş/son "_" siler
      - Boş/null isim → "unnamed_file" (Python ile aynı; eskiden "unnamed" idi — path uyumsuzluğu vardı)
    parseCompanyJson():
      - Jackson JsonNode ile parse, iç içe contact_info / catalog_info nesneleri işler

  POST /api/admin/scraper/run
    Auth: ADMIN only
    Body: ScraperRunRequestDTO
    Action: ScraperService.runScraper() → subprocess + JSON oku
    Returns: ScraperResultDTO

  GET /api/admin/scraper/results
    Auth: ADMIN only
    Action: ScraperService.getScraperResults() — tüm company_info.json'ları okur
    Returns: List<ScraperResultDTO>

  POST /api/admin/scraper/companies/import
    Auth: ADMIN only
    Body: ScraperImportRequestDTO
    Action: ScraperService.importCompany()
    Returns: ScraperImportResultDTO { companyId, applicationId }

  POST /api/admin/scraper/materials/import
    Auth: ADMIN only
    Body: List<MaterialImportItemDTO>
    Action: ScraperService.importMaterials()
    Returns: MaterialImportResultDTO { created, duplicates[], errors[] }

  NOT: Katalog analizi endpoint'leri (catalogs/analyze, catalogs/candidates) Phase 9 kapsamında —
       TODO-10'da uygulanmadı. Phase 9 başladığında eklenecek.

  application.yml eklemeleri:
    scraper:
      output-dir: "D:/Sanayi Marketi Output"
      script-dir: "C:/Users/Yusuf/Desktop/Sanayi Marketi/data-scraper"

  data-scraper/main.py eklemeleri:
    --input-json argümanı: admin API modunda çalışır, şirket bilgilerini JSON dosyasından okur
    process_direct_company(company_name, website, sector):
      - companies.json listesini bypass eder (admin panelden arbitrary firma girişi)
      - FAILED dahil TÜM durumlarda company_info.json yazar
      - GenericScraper ile process_company() çağırır, sonucu CATALOGS_DIR/{safeName}/ klasörüne kaydeder

Frontend (/admin/scraper — TAMAMLANDI 2026-05-27):

  admin.service.ts eklemeleri:
    Types: ScraperRunRequest, ScraperResult, ScraperImportRequest, ScraperImportResult,
           MaterialImportItem, MaterialImportResult
    Methods: runScraper(), getScraperResults(), importCompany(), importMaterials()

  /admin/scraper/page.tsx — 3 tab, tam fonksiyonel:

  Tab 1: Firma Tara
    - TextField: Firma Adı + Website URL
    - Select multiple (OutlinedInput + renderValue): Sektörler
    - useMutation → adminService.runScraper()
    - Sonuç kartı: StatusChip (SUCCESS/PARTIAL/FAILED/ERROR renkli) + katalog sayısı + iletişim
    - "Sisteme Aktar" butonu → ImportDialog açar

  ImportDialog:
    - catalogFile Select: scraper'dan gelen dosya listesi dropdown'ı
    - "Aktar" → adminService.importCompany()
    - Başarı sonrası /admin/approvals'a yönlendirir (AUTO_IMPORTED onayı için)

  Tab 2: Taranan Firmalar
    - useQuery(['scraper-results']) → adminService.getScraperResults()
    - Filtre butonları: Tümü | Aktarılmamış | Başarısız
    - Tablo: firma adı, sektörler, katalog sayısı, iletişim, durum chip, aktarıldı mı
    - Satır başına: "Aktar" (ImportDialog) + refresh icon (tekrar tara)

  Tab 3: Katalog Analizi  [STUB — Phase 9 bekleniyor]
    - Alert: "Bu özellik Phase 9'da (katalog analizi) gelecek"
    - Mevcut scraper sonuçlarından katalog içeren firmalar listelenir
    - "Analiz Et" butonları disabled (Phase 9 hazır değil)

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
  /admin/companies           Firma listesi + durum yönetimi
  /admin/materials           Malzeme yönetimi -- stats, filtre, düzenle/sil/birleştir [DONE 2026-04-20]
  /admin/duplicates          Duplikat şirket çözümü
  /admin/scraper             Scraper kontrol paneli
                             Tab 1: Firma Tara (form: ad+url+sektörler, sonuç kartı, sisteme aktar)
                             Tab 2: Taranan Firmalar (liste, filtreler, tekrar tara)
                             Tab 3: Katalog Analizi (bağımsız panel, aday listesi, malzeme havuzuna ekle)
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
              PostgreSQL 18, schema: db.sql (fully up to date as of 2026-04-19)
              db.sql includes all columns (no separate migrations needed for a fresh install):
                company_applications: description, phone, company_email, website,
                                      city, district, full_address, rejection_reason
                companies: logo_url
                trigger approve_company_application: copies all application fields to new company

              If upgrading an EXISTING database (not fresh), run these migrations in pgAdmin:
                ALTER TABLE company_applications ADD COLUMN IF NOT EXISTS description TEXT;
                ALTER TABLE company_applications ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
                ALTER TABLE company_applications ADD COLUMN IF NOT EXISTS company_email VARCHAR(255);
                ALTER TABLE company_applications ADD COLUMN IF NOT EXISTS website VARCHAR(255);
                ALTER TABLE company_applications ADD COLUMN IF NOT EXISTS city VARCHAR(100);
                ALTER TABLE company_applications ADD COLUMN IF NOT EXISTS district VARCHAR(100);
                ALTER TABLE company_applications ADD COLUMN IF NOT EXISTS full_address TEXT;
                ALTER TABLE company_applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
                ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
                -- Also re-run the approve_company_application() trigger from db.sql
                -- Added 2026-04-19:
                ALTER TABLE company_materials ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
                -- Added 2026-04-20:
                ALTER TABLE company_materials ALTER COLUMN price DROP NOT NULL;
                ALTER TABLE materials ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
                ALTER TABLE materials ADD COLUMN IF NOT EXISTS created_by_company_id BIGINT;
              -- ALL MIGRATIONS RUN as of 2026-04-20

Backend:      RUNNING (Spring Boot Dashboard, port 8080)
              JWT Security: COMPLETE

              Phase 11 fixes + new endpoints: DONE (2026-05-29)

              CompanyApplicationService.java — approveApplication() yeniden yazıldı:
                3 tip için ayrı switch-case akışı:
                  AUTO_IMPORTED:
                    - company.status → ACTIVE (sadece bu)
                    - Admin rolü hiç değiştirilmiyor  [BUGFIX — eskiden admin COMPANY_USER oluyordu]
                  MANUAL_EXISTING:
                    - targetCompany null ise → IllegalStateException
                    - user.findByUserId() ile mevcut link kontrol edilir:
                        * Farklı firmaya bağlıysa → IllegalStateException  [BUGFIX — eskiden sessizce atlanıyordu]
                        * Aynı firmaya bağlıysa → idempotent (sadece rol upgrade)
                        * Bağlı değilse → CompanyUser oluşturulur
                    - user.role → COMPANY_USER  [BUGFIX — önceden eksikti]
                  MANUAL_NEW:
                    - DB trigger ile company + company_users oluşur (değişmedi)
                    - user.role → COMPANY_USER + application fields → company kopyalanır

              CompanyApplicationService.java — reapply() düzeltildi:
                - applicationType artık last.getApplicationType() korunur  [BUGFIX — eskiden hardcode MANUAL_NEW]
                - MANUAL_EXISTING için targetCompany korunur
                - AUTO_IMPORTED → MANUAL_NEW olarak dönüştürülür (kullanıcı AUTO_IMPORTED reapply yapamaz)

              CompanyService.java — adminUpdateCompany() eklendi:
                - Ownership check olmadan firma güncelleme (admin bypass)
                - Kullanım: PUT /api/admin/companies/{id}
                - Null-safe: sadece gönderilen alanlar güncellenir

              ScraperService.java — extend edildi:
                - analyzeCatalog(companyName, testDir): catalog_analyzer.py subprocess çalıştırır (120s timeout)
                - getCatalogCandidates(companyName, testDir): materials_candidates.json okur → DTO döner
                - importMaterials(): companyId verilince company_materials kaydı da oluşturulur  [EXTEND]
                  * findByCompanyIdAndMaterialId() ile duplicate kontrolü
                  * CompanyMaterialRole.PRODUCER default, price/unit null
                  * company not found → log.warn, material yine de eklenir
                - importCompany(): company_id alanını company_info.json'a yazar  [NEW]
                  * scrapeDate sonrası companyId JSON'da saklanır → Tab 3 firma bağlantısı için kullanılır
                - setCompanyIdFlag() helper metodu eklendi
                - CompanyMaterialRepository inject edildi

              ScraperResultDTO.java — companyId: Long eklendi  [NEW]

              New DTOs (2026-05-29):
                CatalogAnalyzeRequestDTO     { companyName, testDir }
                MaterialCandidateDTO         { name, confidence, sourcePage, category }
                MaterialsCandidatesResponseDTO { companyName, catalogFile, analyzedAt,
                                                extractionMethod, candidates, totalCandidates, status }

              AdminController.java — yeni endpointler:
                GET  /api/admin/companies/owned-ids           → sahipli firma ID listesi
                PUT  /api/admin/companies/{id}                → admin firma düzenleme (bypass)
                POST /api/admin/scraper/catalogs/analyze      → catalog_analyzer.py tetikle
                GET  /api/admin/scraper/catalogs/candidates/{companyName} → aday listesi oku
                (CompanyUserRepository inject edildi)

              Repository güncellemeleri (2026-05-29):
                CompanyUserRepository: existsByCompanyId(Long), findAllOwnedCompanyIds() [NEW]
                MaterialRepository: findByMaterialNameIgnoreCase(String) [NEW]

              Önceki backend değişiklikleri (2026-05-27/28):
                ScraperService.java: runScraper / getScraperResults / importCompany / importMaterials / sanitizeFilename
                New DTOs: ScraperRunRequestDTO, ScraperResultDTO, ScraperImportRequestDTO,
                          ScraperImportResultDTO, MaterialImportItemDTO, MaterialImportResultDTO
                AdminController: 4 yeni scraper endpoint eklendi (run/results/companies/materials)
                application.yml: scraper.output-dir + scraper.script-dir eklendi
                MaterialRepository: existsByMaterialNameIgnoreCase() eklendi
                ScraperService bug fixes (2026-05-28):
                  @Slf4j logging, stdoutReader thread join, sanitizeFilename fallback, findFirstByRole
                UserRepository.java: findFirstByRole(UserRole role) eklendi
                pom.xml: jackson-databind explicit bağımlılık

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
                - Catalog upload: DONE (2026-04-19)
                - AdminController: DONE (2026-04-19 + 2026-04-20 + 2026-04-21)
                - company_materials.unit: DONE (2026-04-19)
                - company_materials.price nullable: DONE (2026-04-20)
                  CompanyMaterialRequestDTO: removed @NotNull from price
                  CompanyMaterial entity: removed nullable=false from price column
                - Material search case-insensitive: DONE (2026-04-20)
                  MaterialRepository: findByNormalizedNameContaining → findByMaterialNameContainingIgnoreCase
                  Reason: normalizedName can be null for seeded records; IgnoreCase handles all cases at DB level
                - Admin material management: DONE (2026-04-20)
                  Material entity: added createdAt (LocalDateTime) + createdByCompanyId (Long) + @PrePersist
                  MaterialRepository: added admin filter queries (USER_CREATED, UNUSED), count queries,
                                      countByMaterialIds bulk query
                  CompanyMaterialRepository: added countByMaterialIds(List<Long>), countByMaterialId(Long)
                  MaterialService: createMaterial() overload with createdByCompanyId param;
                                   getAdminMaterials(), getAdminStats(), mergeMaterials() added
                  New DTOs: AdminMaterialResponseDTO, AdminMaterialStatsDTO
                  MaterialController: passes createdByCompanyId from @RequestAttribute userId on create
                  AdminController: 5 new endpoints (GET materials, GET stats, PUT, DELETE, POST merge)
                - CompanyService.updateCompany(): FIXED — no longer sets status/catalogFileUrl/catalogFileType
                - City filter fix: DONE (2026-04-21)
                  CompanyRepository: removed findFiltered (Hibernate 7 null param bug)
                  Added: findAllByCompanyNameContainingIgnoreCase, findAllByCityIgnoreCase,
                         findByNameAndCity (null-free JPQL), findByStatusNot
                  CompanyService: 4-way dispatch (hasName+hasCity / hasName / hasCity / none)
                - Suspicious material criteria: UPDATED (2026-04-21) — 3 criteria:
                  (1) name < 3 chars, (2) user-created + unused orphan, (3) same normalizedName as another material
                  MaterialRepository: added findDuplicateNormalizedNames() JPQL subquery, countSuspicious(),
                                      findSuspicious(Pageable), findSuspiciousByName(String, Pageable)
                  MaterialService: getAdminStats() uses countSuspicious(); SUSPICIOUS case added to filter dispatch
                                   enrichWithAdminData() computes duplicateNormalizedNames set
                  Fixed: stats showed 14 but filter showed 0 (was passing usageCount=0 to all materials)
                - Duplicate company detection: DONE (2026-04-21)
                  New DTO: DuplicatePairDTO { companyA, companyB, similarityPercent }
                  CompanyService: findDuplicatePairs() — O(n²) Levenshtein with Turkish char normalization
                                   (ğ→g, ş→s, ü→u, ö→o, ç→c) + common suffix removal (a.ş., ltd., sti.)
                                   Threshold: ≥70% similarity. Returns sorted by descending similarity.
                  AdminController: GET /companies/duplicates → List<DuplicatePairDTO>
                - FavoriteController: FIXED (2026-04-21)
                  GET /favorites/materials + POST /favorites/materials/{id} return MaterialResponseDTO
                  (was FavoriteMaterialResponseDTO — materialId field mismatch caused favorites not to appear)
                  FavoriteMapper: toMaterialResponseDTO() now delegates to materialMapper.toResponseDTO()

Frontend:     COMPLETE + UPDATED (2026-04-20)
              Foundation:    Next.js 16.2.4 + React 19.2 + TypeScript, Axios, AuthContext, proxy.ts
              Design system: MUI theme, Manrope + Inter fonts, MD3 color tokens (colors.ts),
                             MainLayout, DashboardLayout, AdminLayout
              Services:      auth, company, material, favorite, companyApplication

              All pages DONE (22 pages -- /admin/materials added 2026-04-20, all updated 2026-04-21):
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
                                       FIXED (2026-04-18): phone masking (05XX XXX XX XX format)
                                         submitted as raw 11 digits, validated starts with 05
                                       FIXED (2026-04-18): city field is now Select dropdown
                                         populated with all 81 TURKISH_CITIES; changing city resets district
                                       Logo upload/delete section at top of form
                - /company/materials   REDESIGNED (2026-04-19):
                                       Add flow: search global pool → click → fill role/unit/price → Ekle
                                       Option A: if 0 search results, shows "+ 'X' adıyla yeni malzeme oluştur"
                                         → POST /api/materials → auto-selects the created material
                                       Unit dropdown: Ton, Kg, Gram, Adet, Paket, Kutu, Metre, m², m³,
                                                      Litre, Metreküp, cm, mm
                                       Price shown as "21.500 TL / Ton" format
                                       Table columns: Malzeme Adı / Rolü / Birim / Liste Fiyatı / İşlemler
                                       Edit (update): uses CompanyMaterialUpdateRequestDTO — no @NotNull on price/materialId
                                       Split search state: tableSearch (table filter) vs modalSearch (dialog)
                - /company/catalog     DONE: real API upload/delete, query key fixed to 'my-company'
                - /admin               overview + recent applications table
                - /admin/approvals     FIXED: expandable rows show ALL application fields:
                                         login email, phone, firm email, website, city+district, description
                                         "Girilmedi" shown for empty optional fields
                - /admin/companies     company list + search + status chip + "Görüntüle" link
                - /admin/duplicates    side-by-side comparison + merge/deactivate (REAL API 2026-04-21)
                - /admin/scraper       DONE (2026-05-27) — 3 tab, tam fonksiyonel
                                             Tab 1: Firma Tara (form + useMutation + sonuç kartı + ImportDialog)
                                             Tab 2: Taranan Firmalar (useQuery + filtreler + tablo + Aktar)
                                             Tab 3: Katalog Analizi (stub — Phase 9 bekleniyor)
                - /admin/statistics    real data: company count, material count,
                                       application breakdown + approval rate, city distribution
                - /admin/materials     NEW (2026-04-20): admin material management
                                       Stats cards: Toplam / Firma Eklemeleri / Kullanılmayan / Şüpheli
                                       Filter tabs: Tümü | Firma Eklemeleri | Kullanılmayan | Şüpheli (2026-04-21)
                                       Table: materialName (+ ⚠ suspicious), ekleyen (firma/Sistem),
                                              kullanım (kaç firma), tarih, işlemler
                                       Edit dialog: rename material
                                       Delete dialog: shows usage count warning
                                       Merge dialog: search target → move all links → delete source
                - /companies          City filter now works (Hibernate 7 null param fix in backend)
                - /materials          Material favoriting added (heart icon on cards, toggle with auth check)
                - /materials/[id]     Material favoriting added (heart icon with Tooltip in header)
                - /                   Search bar: category toggle (Firmalar/Malzemeler) integrated inside
                                       bar as segmented control on left; vertical divider; dynamic placeholder

              DashboardLayout changes:
                - "Hesap Ayarları" REMOVED from nav (page does not exist; decision deferred)
                - "Yeni İlan Oluştur" renamed "Malzeme Ekle", now links to /company/materials
                - Company variant header: shows company logo (if exists) + company name + "Firma Yöneticisi"
                  Logo absent: BusinessIcon placeholder. Fetches via companyService.getMe() (queryKey: my-company)
                - User variant header: initial avatar + "Hesabım" + "Standart Üye"
                - "Favori Firmalar" + "Favori Materyaller" MERGED into single "Favoriler" nav item (2026-04-21)

              company.service.ts changes:
                - Added getMe() -> GET /api/company-users/me
                - Added id field to CompanyMaterial interface
                - Fixed getMaterials: /api/companies/{id}/materials -> /api/materials/companies/{id}
                - Fixed addMaterial: same path fix
                - Fixed updateMaterial: /api/materials/companies/materials/{id} (row ID, no companyId)
                - Fixed deleteMaterial: same (row ID only)
                - CompanyMaterial interface: added unit: string | null (2026-04-19)
                - addMaterial + updateMaterial: accept unit?: string param (2026-04-19)

              material.service.ts changes (2026-04-19):
                - MaterialCompany interface: FLAT (companyId, companyName, companyCity, companyDistrict,
                  companyLogoUrl, materialId, materialName, role, price, unit)
                  NOT nested { company: Company } — backend returns flat CompanyMaterialResponseDTO
                - Added create(materialName) -> POST /api/materials (for Option A)

              /company/manage changes (2026-04-19):
                - Profile completion: all items check real data (was partially hardcoded)
                - Malzeme Listesi item: checks materials.length > 0 via real query
                - Ürün Kataloğu item: checks company.catalogFileUrl (works now — query key unified)
                - "Eksikleri Tamamla" button: hidden when completePct === 100
                - Son Aktiviteler: derived from real entity data (company.createdAt, material.createdAt,
                  presence of logo/catalog/description/phone), sorted newest first — NOT hardcoded

              /companies/[id] changes (2026-04-19):
                - Google Maps: extractMapSrc() parses both full <iframe> HTML and plain URL
                - Uses plain <iframe> element (not Box component="iframe")
                - Suppliers list: uses flat mc.companyCity, mc.companyDistrict, mc.companyId etc.
                - Price shown as "X TL / Birim" format

              /login changes (2026-04-19):
                - Added useEffect: redirects already-logged-in users based on role
                  ADMIN→/admin, COMPANY_USER→/company/manage, PENDING→/application/status, default→/dashboard

              proxy.ts changes (2026-04-19):
                - Removed role-based redirect when refresh_token present + path === /login
                - proxy.ts cannot decode JWT to get role; redirect was always wrong for non-BASIC_USER

              not-found.tsx (2026-04-19):
                - Added 'use client' directive — Server Component cannot pass functions as props to MUI Button

              CRITICAL — Query key consistency:
                ALL company data queries must use queryKey: ['my-company']
                catalog page was using ['company-me'] — caused profile completion to show wrong state
                Rule: never use 'company-me' — always 'my-company'

              CRITICAL — Cross-session cache:
                TanStack Query module-level QueryClient retains cached data between user sessions.
                Solution: QueryCacheClearer component in Providers.tsx watches userId via useRef,
                calls qc.clear() when userId changes (including logout → undefined).
                Rule: always wrap QueryClient logic so cache is cleared on user switch.

              Changes 2026-04-21:
                - /companies page: city filter fixed (was always empty due to Hibernate 7 null param bug)
                - /company-apply, /company/edit, /application/status: phone validation changed from
                  startsWith('05') → startsWith('0') to accept landline numbers (0312, 0216, etc.)
                  Error message updated to show both GSM (0532 XXX XX XX) and landline examples
                - DashboardLayout: "Favori Firmalar" + "Favori Materyaller" merged into single
                  "Favoriler" menu item (same /favorites page, one nav entry)
                - Providers.tsx: QueryCacheClearer component added — watches userId via useRef,
                  calls qc.clear() on user change or logout to prevent cross-session cache leakage
                - /materials page: full material favoriting support added
                  (isFav state, toggleFav(), qc.invalidateQueries after toggle, heart IconButton on cards)
                - /materials/[id] page: material favoriting added
                  (isFav state, toggleFav(), FavoriteIcon button with Tooltip in material header)
                - /companies page: qc.invalidateQueries(['favorites','companies']) added after toggle
                - /admin/duplicates: replaced hardcoded MOCK_PAIRS with real useQuery calling
                  adminService.getCompanyDuplicates() (GET /api/admin/companies/duplicates)
                - admin.service.ts: DuplicatePair interface + getCompanyDuplicates() method added;
                  'SUSPICIOUS' added to AdminMaterialFilter type
                - /admin/materials: "Şüpheli" filter tab added (was missing from FILTERS array)
                - Homepage (/): category toggle (Firmalar/Malzemeler) moved from separate pill buttons
                  below search bar into the search bar itself as integrated segmented control on left,
                  with vertical divider, dynamic placeholder text, and FactoryIcon/CategoryIcon

              Changes 2026-04-20:
                - /companies page: CompanyCard nested <a> fix — outer card uses onClick+router.push,
                  inner "Profili Gör" button uses onClick+stopPropagation. Link import removed.
                  Reason: Box component={Link} + Button component={Link} = nested <a> = hydration error
                - company_materials price: made optional in frontend (label says "opsiyonel",
                  price=undefined sent when empty, formatPrice shows "—" for null)
                - admin.service.ts: added AdminMaterial/AdminMaterialStats types + all material methods
                - AdminLayout: "Malzemeler" nav item added (Inventory2Icon, /admin/materials)
                - constants.ts: ADMIN_MATERIALS route added

              Scraper entegrasyonu: DONE (2026-05-27)
                - /admin/scraper: 3 tab tam fonksiyonel (Tab 1: Firma Tara, Tab 2: Tarananlar, Tab 3: Katalog stub)
                - admin.service.ts: ScraperRunRequest/Result/ImportRequest/ImportResult + 4 method eklendi
                - data-scraper/main.py: --input-json argümanı + process_direct_company() eklendi

              Hesap Ayarları: DONE (2026-05-22)
                - /account/settings page implemented: email + password change
                - UserController PUT /api/users/me wired, password verification in UserService
                - DashboardLayout nav updated (both user and company variants)

              Phase 11 frontend değişiklikleri: DONE (2026-05-29)

              /company-apply — MANUAL_EXISTING modu eklendi  [NEW]
                - ToggleButtonGroup: "Yeni Firma Kaydı" / "Mevcut Firmayı Talep Et"
                - MANUAL_EXISTING modunda: Autocomplete firma arama (GET /api/companies?name=...)
                - selectedCompany → targetCompanyId olarak backend'e gönderilir
                - applicationType: mode (MANUAL_NEW veya MANUAL_EXISTING) dinamik gönderilir
                - Form description alanı: mod bazlı açıklama metni

              /admin/approvals — MANUAL_EXISTING başvuru göstergesi  [NEW]
                - DetailRow: applicationType === 'MANUAL_EXISTING' ise sarı uyarı kutusu gösterilir
                  "Talep Edilen Firma: {targetCompanyName}" + "kimliğini doğrulayın" notu

              /admin/companies — sahipsiz badge + admin düzenleme  [NEW]
                - useQuery(['admin-owned-company-ids']) → adminService.getOwnedCompanyIds()
                - "Sahipsiz" Chip: firma ownedSet'te yoksa PersonOffIcon + sarı badge
                - Sayfa başında "X sahipsiz" chip'i
                - "Düzenle" butonu → EditDialog açar (adminService.adminUpdateCompany())
                - EditDialog: companyName, description, city, district, phone, email, website, fullAddress

              /admin/scraper Tab 3 — tam implementasyon  [NEW — eskisi stub'dı]
                - Firma listesi (katalogCount > 0 olanlar): companyName | katalog sayısı | aktarıldı mı | işlemler
                - "Analiz Et" butonu → CandidateDrawer açılır
                CandidateDrawer (sağ Drawer, 560px):
                  - analyzeMutation: adminService.analyzeCatalog({ companyName })
                  - Analiz sonucu: özet chip'ler (toplam/yüksek güven/seçili)
                  - "Firma Bağlantısı Oluştur" Switch: companyId varsa gösterilir
                  - Checkbox listesi: name | confidence chip | sayfa no
                  - Auto-select: confidence ≥ 0.85 olanlar başlangıçta seçili
                  - "Seçilenleri Malzeme Havuzuna Ekle" → importMaterials({ materialName, companyId? })

              admin.service.ts — yeni metodlar  [NEW]
                analyzeCatalog(request: CatalogAnalyzeRequest) → MaterialsCandidates
                getCatalogCandidates(companyName, testDir?) → MaterialsCandidates
                adminUpdateCompany(id, data) → Company
                getOwnedCompanyIds() → number[]
                Types: CatalogAnalyzeRequest, MaterialCandidate, MaterialsCandidates,
                       AdminCompanyUpdateRequest
                ScraperResult: companyId alanı eklendi

              proxy.ts:      COMPLETE

Data Scraper: Phase 8 TAMAMLANDI (2026-05-27) | Phase 9 TAMAMLANDI (2026-05-29)
              Phase 10 TAMAMLANDI (2026-05-27) | Phase 11 TAMAMLANDI (2026-05-29)
              Admin kullanım yöntemi LOCKED: tek firma girişi (ad + URL + sektörler)
              bkz. DATA SCRAPER bölümü
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
Phase 7: Bug Fixes & UX Improvements    [DONE 2026-04-21]
  - City filter fix (Hibernate 7 null param → 4-way dispatch)
  - Landline phone validation (startsWith('0') instead of '05')
  - Suspicious material criteria expanded to 3 (short name + orphan + duplicate normalizedName)
  - Suspicious filter & stats fixed (countSuspicious() repository method)
  - Real backend duplicate detection (Levenshtein similarity, /admin/companies/duplicates)
  - /admin/duplicates wired to real API (no more mock data)
  - Cross-session TanStack Query cache cleared on user change (QueryCacheClearer)
  - DashboardLayout favorites nav merged to single item
  - Material favoriting added to /materials and /materials/[id] pages
  - FavoriteController returns MaterialResponseDTO (field name fix)
  - All favorite toggle handlers invalidate cache immediately
  - Homepage search bar: category toggle integrated inside bar

Phase 8: Scraper Optimizasyonu         [DONE 2026-05-27]
  - Test #10: SUCCESS 20/35 | PARTIAL 1 | FAILED 14
  - Selenium requests-first stratejisi, katalog filtreleme, iletişim iyileştirmesi
  - city/district çıkarımı + ilçe parse fix, logo + açıklama çıkarımı
  - sectors array, imported takibi, sertifika belge filtresi (BUG-8)
  - Wix CDN dönüşümü + SSL fallback (BUG-7), double-filter fix (BUG-5)
  - Test altyapısı: 35 firma, TEST_INFO.md, --test N argümanı

Phase 9: Katalog Analizi               [DONE 2026-05-29]
  - data-scraper/catalog_analyzer.py: pdfminer.six + rule-based (ücretsiz, GPU yok)
  - Türkçe sanayi keyword seti, fiyat/spec temizleme, deduplication
  - materials_candidates.json çıktısı (GUIDE.md formatı)
  - Test: Dizayn Grup (28 sayfa, 6082 satır) → 88 aday, ~%90 doğruluk
  - requirements.txt'e pdfminer.six==20231228 eklendi

Phase 10: Backend + Frontend Entegrasyonu [DONE 2026-05-27]
  - ScraperService.java + AdminController 4 endpoint + 6 DTO
  - /admin/scraper 3-tab sayfası (Tab 1: Tara, Tab 2: Tarananlar, Tab 3: stub)
  - data-scraper/main.py: --input-json argümanı + process_direct_company()

Phase 11: Tam Akış Entegrasyonu        [DONE 2026-05-29]
  Backend bug fix'leri:
    - approveApplication() 3 tip için doğru akış (AUTO_IMPORTED/MANUAL_EXISTING/MANUAL_NEW)
    - MANUAL_EXISTING onayında company_users oluşturma + çakışma kontrolü
    - reapply() applicationType + targetCompany koruma
  Yeni backend özellikleri:
    - adminUpdateCompany() — sahiplik bypass ile firma düzenleme
    - analyzeCatalog() + getCatalogCandidates() — catalog_analyzer.py entegrasyonu
    - importMaterials() extend — company_materials bağlantısı
    - GET /api/admin/companies/owned-ids
    - POST /api/admin/scraper/catalogs/analyze
    - GET /api/admin/scraper/catalogs/candidates/{companyName}
  Frontend özellikleri:
    - /company-apply: MANUAL_EXISTING modu (firma arama + sahiplik talebi)
    - /admin/approvals: MANUAL_EXISTING için targetCompanyName uyarısı
    - /admin/companies: Sahipsiz badge + admin düzenleme dialogu
    - /admin/scraper Tab 3: CandidateDrawer (tam implementasyon)

---

---

TODO (2026-05-22)

NOT: Her TODO için çözüm önerisi yazılmıştır. Uygulama öncesi birlikte konuşup yöntemi netleştireceğiz.

Priority 1 — Bug fixes (must fix before pre-final):

  [TODO-1] ACTIVE status filter missing in public company listing — YAPILDI, TEST BEKLİYOR
    Problem:  CompanyService.getAllCompanies() fetches ALL companies regardless of status.
              INACTIVE and MERGED companies appear on /companies page and homepage.
    Yapılan:  CompanyRepository.java — 4 yeni ACTIVE-filtered metod eklendi.
              CompanyService.getAllCompanies() — 4 yol CompanyStatus.ACTIVE ile güncellendi.
              Admin arama (searchCompaniesByName) olduğu gibi bırakıldı.
    Scope:    CompanyRepository.java + CompanyService.java only

  [TODO-2] materials/[id] parentMaterialName — TAMAMLANDI (2026-05-22)
    Durum:    Backend (MaterialResponseDTO + MaterialMapper) ve frontend (/materials/[id]/page.tsx)
              zaten doğru şekilde parentMaterialName kullanıyor. Fix gerekmez.

  [TODO-4] Katalog indirme linki kırık — YAPILDI, TEST BEKLİYOR
    Problem:  companies/[id]/page.tsx: href={company.catalogFileUrl} relative path olduğu için
              localhost:3000'e yönlendiriyordu. Dosyalar backend localhost:8080'de sunuluyor.
    Yapılan:  constants.ts'e API_BASE_URL eklendi (NEXT_PUBLIC_API_BASE_URL env var, fallback localhost:8080).
              8 dosyada hardcoded http://localhost:8080 → ${API_BASE_URL} olarak değiştirildi:
              companies/[id], companies, materials/[id], favorites, home/page,
              DashboardLayout, company/edit, company/catalog
              Production için .env'e NEXT_PUBLIC_API_BASE_URL eklemek yeterli.

  [TODO-5] Firma detay header'ında "Aktif" rozeti hardcoded — YAPILDI, TEST BEKLİYOR
    Problem:  companies/[id]/page.tsx satır 148: label="Aktif" sabit yazılmış.
              INACTIVE veya MERGED bir firmaya direkt URL ile girildiğinde yanlış gösterir.
    Öneri:    company.status değerine göre dinamik badge render etmek.
              TODO-1 tamamlandığında etkisi azalır (INACTIVE firmalar listede görünmez)
              ama URL'den direkt girildiğinde hâlâ sorun olur.
    Scope:    client/src/app/(public)/companies/[id]/page.tsx satır 144-150

  [TODO-6] Firma detay malzeme sekmesinde birim (unit) gösterilmiyor — YAPILDI, TEST BEKLİYOR
    Problem:  companies/[id]/page.tsx satır 373: Fiyat gösteriyor (${m.price} ₺) ama birim yok.
              Veri mevcut (CompanyMaterial.unit alanı dolu olabilir) ama render edilmiyor.
              /materials/[id] sayfasında ise birim gösteriliyor — tutarsızlık var.
    Öneri:    Tabloya "Birim" sütunu eklemek veya fiyat yanında göstermek.
    Scope:    client/src/app/(public)/companies/[id]/page.tsx satır 373

  [TODO-7] PUT /api/materials/{id} yetki kontrolü eksik — YAPILDI (endpoint kaldırıldı)
    Problem:  MaterialController.java satır 108: Herhangi bir kimliği doğrulanmış kullanıcı
              global materyal havuzundaki herhangi bir malzemenin adını değiştirebilir.
              Admin için ayrı /api/admin/materials/{id} endpoint'i var.
    Öneri:    Bu endpoint'i ya sadece ADMIN'e kısıtlamak, ya da endpoint'i kaldırıp admin
              endpoint'ine yönlendirmek. Şu an COMPANY_USER bu endpoint'i kullanmıyor
              (admin paneli /api/admin/... kullanıyor) — düşük öncelikli.
    Scope:    MaterialController.java satır 108-118 + SecurityConfig.java

Priority 2 — Data Scraper (Phase 8 → 10 → 9):

  UYGULAMA SIRASI (LOCKED):
    1. TODO-8: Scraper Python modülü tamamlanır (veri çekimi optimize edilir)
    2. TODO-10: Scraper sisteme entegre edilir (backend API + admin UI), uçtan uca test edilir
    3. TODO-9: Katalog analizi — sistem entegrasyonu başarılıysa, indirilen PDF'lerden malzeme çekimi denenir
    Bu sıra değiştirilemez: entegrasyon testi olmadan katalog analizi anlamsız.

  [TODO-8] Scraper optimizasyonu — Phase 8  [DEVAM EDİYOR]
    Kapsam: data-scraper/ Python modülü. Backend/frontend değişikliği yok.
    Yöntem LOCKED: admin panelden tek firma girişi (ad + URL + sektörler).
    Alt görevler:
      8a.  ✓ Selenium stratejisi düzelt — tamamlandı 2026-05-24
           requests-first, JS_HEAVY_DOMAINS listesi, <500 char eşiği
      8a+. ✓ Test altyapısı — tamamlandı 2026-05-24
           --test N argümanı, TEST_COMPANIES sabiti (35 firma — 2026-05-25 genişletildi), generate_test_info()
           Windows encoding fix: sys.stdout.reconfigure(utf-8) eklendi — 2026-05-25
      8b.  ✓ Katalog filtreleme iyileştir — tamamlandı 2026-05-24
           from_catalog_page bağlamı, CATALOG_PATH_INDICATORS, PDF_NEGATIVE_KEYWORDS genişletme
           BUG-5 fix: _try_alternative_strategies double-filter kaldırıldı — 2026-05-25
      8c.  ✓ city/district çıkarımı — tamamlandı 2026-05-24
           BUG-6 AÇIK: ilçe alanına adres satırı/posta kodu kaçıyor — 2026-05-25
      8d.  ✓ İletişim iyileştirmesi — tamamlandı 2026-05-24
      8e.  ✓ Logo + açıklama çıkarımı — tamamlandı 2026-05-24
      8f.  ✓ sectors alanı: "sector" → "sectors" array — tamamlandı 2026-05-24
      8g.  ✓ imported takibi — tamamlandı 2026-05-24
      8h.  ✓ İlçe parse fix (BUG-6) — tamamlandı 2026-05-25
           _STREET_KEYWORDS'e 'sk', 'cd' eklendi
           _clean_component: baştaki ZIP kodu + em-dash/en-dash temizleme eklendi
           _is_district_candidate: rakamla başlayan token, "No:\d" kalıbı reddi eklendi
           word_stem split ile "no:15" → "no" keyword eşleşmesi düzeltildi
           utils/location_extractor.py
    Test metodolojisi: 35 şirket (2026-05-25 genişletildi), test-1/test-2/... klasörleri, her birinde TEST_INFO.md.
    Başarı kriteri: 1 iletişim kanalı + adres + 1 doğru katalog (bonus: logo, açıklama, city).

  [TODO-10] Backend + Frontend entegrasyonu — Phase 10  [TAMAMLANDI 2026-05-27]
    Backend: ScraperService.java + AdminController 4 endpoint + 6 yeni DTO
      - POST /api/admin/scraper/run          ✓
      - GET  /api/admin/scraper/results      ✓
      - POST /api/admin/scraper/companies/import  ✓
      - POST /api/admin/scraper/materials/import  ✓
      - catalogs/analyze + catalogs/candidates: Phase 9 kapsamına ertelendi
    Frontend: /admin/scraper 3 tab + admin.service.ts + data-scraper/main.py
      - Tab 1: Firma Tara — form + useMutation + sonuç kartı + ImportDialog  ✓
      - Tab 2: Taranan Firmalar — useQuery + filtreler + tablo  ✓
      - Tab 3: Katalog Analizi — stub (Phase 9 bekleniyor)  ✓
    data-scraper/main.py: --input-json argümanı + process_direct_company()  ✓
    TypeScript: 0 hata (3 tur tsc --noEmit düzeltmesi: ErrorOutlined icon, Select multiple typing)  ✓

  [TODO-9] Katalog analizi + malzeme çıkarımı — Phase 9  [TAMAMLANDI 2026-05-29]
    Yaklaşım: Option A — pdfminer.six + rule-based (ücretsiz, GPU yok)
    Dosya: data-scraper/catalog_analyzer.py
    Test: Dizayn Grup (28 sayfa) → 88 aday, ~%90 doğruluk, admin review ile tamamlanıyor.
    Kalan: Frontend Tab 3 (Katalog Analizi) backend entegrasyonu — Phase 11 kapsamı.

  BUG-8: Alakasız sertifika/form belgeleri katalog olarak indiriliyor  [DÜZELTILDI 2026-05-26]
    Neden: from_catalog_page=True olunca step 3 (PDF from catalog page) tüm PDF'leri
           indirir — ürün katalogları ile birlikte liste halindeki sertifika belgelerini de.
           Tespit: Test-8 analizi — Ayvaz'da 59 dosyanın ~25'i DVGW/BV/BSI/DNV-GL/TÜV/VDS/
                   UL/KIWA/ASME/AGA/AENOR/CSA/IEP-ATEX sertifikalarıydı.
                   Etna: KrediKartiBilgilendirme formu. Seranit: İnternet sitesi teknik rehberi.
    Düzeltme:
      config/settings.py:
        - CERT_BODY_FILENAME_PREFIXES listesi eklendi (24 prefix) — dosya adı BAŞINDA arama
        - CERT_FILENAME_PATTERNS listesi eklendi (5 pattern) — dosya adı herhangi yerinde
        - PDF_NEGATIVE_KEYWORDS'e 'kredikart', 'kredi-kart', 'internet_sitesi' eklendi
      utils/file_downloader.py:
        - should_download_url(): Step 0 olarak sertifika kuruluşu prefix kontrolü eklendi
          Bu kontrol from_catalog_page=True olsa dahi çalışır (PDF step 3'ten önce gelir)
    Test doğrulaması (birim test):
      20/20 sertifika dosyası bloklandı ✓ (DVGW, BV, BSI, DNV-GL, TÜV, VDS, UL, KIWA, ASME, AGA,
                                            AENOR, CSA, IEP_ATEX, BPV-CERTS, KrediKartı, İnternet_Sitesi)
      11/11 gerçek katalog geçti ✓ (Ayvaz Industrial-Solution, Expansion_Joints, Kondenstop,
                                     EAE e-line, Seranit AQUANIT/SERAWAYS, Mutlusan example.pdf dahil)
    Beklenti (test-9'da doğrulanacak): Ayvaz katalog sayısı azalacak ama doğru dosyalar kalacak.

TAMAMLANDI (2026-05-27):
  TODO-8 (Phase 8): Test #10 final — SUCCESS: 20 | PARTIAL: 1 | FAILED: 14
  TODO-10 (Phase 10): Backend + Frontend entegrasyonu tamamlandı
  TODO-9 (Phase 9): catalog_analyzer.py tamamlandı (2026-05-29)
  Phase 11 (2026-05-29): approveApplication bug fix'ler + MANUAL_EXISTING akışı + katalog analizi UI

Priority 3 — Phase 11 sonrası tespit edilen eksiklikler (2026-05-29):

  [TODO-11] MANUAL_EXISTING reapply formunda targetCompany gösterilmiyor
    Problem:  /application/status sayfasındaki ReapplyForm, başvurunun applicationType'ını
              ve targetCompanyName'ini göstermiyor. MANUAL_EXISTING red sonrası yeniden başvururken
              kullanıcı hangi firmayı talep ettiğini göremez.
    Etki:     Düşük — kullanıcı karışabilir ama işlev doğru çalışıyor.
    Scope:    client/src/app/(protected)/application/status/page.tsx — ReapplyForm komponenti
    Çözüm:   application.targetCompanyName'i form başlığında göster.
             "Firma: {targetCompanyName} için yeniden başvuruyor" notu ekle.

  [TODO-12] /admin/companies sayfası sadece ACTIVE firmaları gösteriyor
    Problem:  companyService.getAll() public endpoint'i CompanyStatus.ACTIVE filtreli çalışır.
              INACTIVE firmalar (scraper import sonrası onay öncesi) admin listesinde görünmez.
              Admin, onaylamadan önce bu firmaları bu sayfadan göremez.
    Etki:     Orta — /admin/approvals'tan firmayı görebilir ama admin/companies'den değil.
    Scope:    AdminController + CompanyService + client/src/app/(protected)/admin/companies/page.tsx
    Çözüm:   GET /api/admin/companies/list → tüm statuslar (no ACTIVE filter)
             Veya mevcut endpoint'e ?status=ALL admin parametresi ekle.

  [TODO-13] Katalog analizi: hardcoded PRODUCER rolü
    Problem:  importMaterials() company_materials oluştururken rol her zaman PRODUCER.
              Satıcı/distribütör firmalar için SELLER veya BOTH uygun olabilir.
    Etki:     Düşük — admin sonradan /company/materials'dan düzenleyebilir.
    Scope:    ScraperService.java importMaterials() + CandidateDrawer (frontend)
    Çözüm:   MaterialImportItemDTO'ya role alanı ekle (opsiyonel, default PRODUCER).
             Frontend'de drawer'a rol seçimi ekle.

  [TODO-14] MANUAL_EXISTING: aynı firmayı birden fazla kullanıcı talep edebilir
    Problem:  Birden fazla kullanıcı aynı firmayı talep eden MANUAL_EXISTING başvurusu yapabilir.
              Admin her ikisini de onaylarsa: ilk onay company_users oluşturur, ikinci onay
              IllegalStateException fırlatır (mevcut fix sayesinde). Ama ikinci kullanıcı zaten
              COMPANY_USER rolüne sahip olmadan PENDING_COMPANY_USER olarak kalır.
    Etki:     Düşük — admin senaryoyu fark edip ikinci başvuruyu reddederse sorun yok.
    Scope:    CompanyApplicationService.approveApplication() + UI uyarısı
    Çözüm:   MANUAL_EXISTING başvuru kabul sırasında aynı firmaya başka pending başvuru varsa
             admin'e uyarı göster. (Frontend: /admin/approvals'da targetCompanyId çakışması chip'i)

  [TODO-15] DB trigger davranışı AUTO_IMPORTED için belgelenmemiş
    Problem:  approve_company_application() DB trigger'ı MANUAL_NEW için company + company_users
              oluşturuyor. AUTO_IMPORTED için ne yaptığı db.sql'de görünür ama GUIDE'da açıklanmamış.
              Eğer trigger tüm APPROVED başvurularda company oluşturmaya çalışıyorsa ve
              AUTO_IMPORTED için targetCompany referansı check edilmiyorsa duplicate company riski var.
    Etki:     Potansiyel yüksek — ancak mevcut kod "saveAndFlush + post-trigger update" ile
              bu durumu zaten ele alıyor (Phase 6'da fixlenmişti).
    Scope:    db.sql — approve_company_application() trigger'ı incelenmeli
    Çözüm:   db.sql'deki trigger'ı okuyup davranışını GUIDE.md'ye ekle.
             Trigger'ın applicationType'ı kontrol ettiğinden emin ol.

---

COMPANY CLAIMING AKIŞI (MANUAL_EXISTING) — TAM SENARYO DOKÜMANTASYONU  [2026-05-29]

Adım 1: Kullanıcı /company-apply sayfasına gider
  - "Mevcut Firmayı Talep Et" tabına geçer
  - Firma arama (Autocomplete) ile mevcut firmayı bulur
  - Hesap bilgilerini (email, şifre) ve firma bilgilerini doldurur
  - Gönder → POST /api/auth/register-company
    Body: { email, password, proposedCompanyName, applicationType: "MANUAL_EXISTING",
            targetCompanyId, description, phone, ... }

Adım 2: Backend register-company işlemi
  - User oluşturulur (role: PENDING_COMPANY_USER)
  - CompanyApplication oluşturulur (type: MANUAL_EXISTING, targetCompany: set, status: PENDING)
  - JWT token döner → kullanıcı /application/status'a yönlendirilir

Adım 3: Admin /admin/approvals'da başvuruyu görür
  - Tip: "Mevcut" chip (sarı)
  - Expandable row'da: "Talep Edilen Firma: {targetCompanyName}" uyarı kutusu
  - Admin kimliği doğrular (telefon, email, açıklama incelenir)

Adım 4: Admin onaylar
  - PUT /api/company-applications/{id}/approve
  - approveApplication() MANUAL_EXISTING dalı:
    * Mevcut user link kontrolü:
      - Farklı firmaya bağlıysa → 400 (admin reddetmeli, kullanıcı önce diğer firmayla bağı koparmalı)
      - Aynı firmaya bağlıysa → idempotent (zaten bağlı, rol upgrade yeterli)
      - Bağlı değilse → CompanyUser{user, targetCompany} oluşturulur
    * user.role → COMPANY_USER

Adım 5: Kullanıcı giriş yapar → /company/manage'e yönlendirilir
  - Artık kendi firmasını tam olarak yönetebilir (edit, materials, catalog)

Red durumu:
  - Admin reddeder → /application/status sayfasında red gerekçesi gösterilir
  - "Yeniden Başvur" formu: aynı firmayı tekrar talep eder (targetCompany korunur)

Çakışma durumu (birden fazla talep):
  - Kullanıcı A MANUAL_EXISTING başvurusu yapıp onaylandı → company_users bağlantısı var
  - Kullanıcı B aynı firmayı talep etti → admin onaylarsa → IllegalStateException
  - Admin B'nin başvurusunu reddetmeli

---

Completed 2026-04-20:
  - Nested <a> hydration fix in CompanyCard (/companies page)
  - Material search case-insensitive fix (findByMaterialNameContainingIgnoreCase)
  - company_materials.price made nullable (DTO @NotNull removed, entity nullable=false removed)
    DB migration run: ALTER TABLE company_materials ALTER COLUMN price DROP NOT NULL;
  - Admin material management — full backend + frontend:
    Backend: Material entity tracking (createdAt, createdByCompanyId), MaterialRepository admin queries,
             AdminMaterialResponseDTO + AdminMaterialStatsDTO, MaterialService admin methods,
             MaterialController tracks creator on POST, AdminController 5 new endpoints
    Frontend: /admin/materials page (stats, filter, table, edit/delete/merge dialogs),
              AdminLayout nav item, admin.service.ts material methods, constants ADMIN_MATERIALS
    DB migrations run: ALTER TABLE materials ADD COLUMN created_at TIMESTAMP;
                       ALTER TABLE materials ADD COLUMN created_by_company_id BIGINT;

Completed 2026-04-19 (session 3):
  - company_materials.unit column: backend entity/DTO/service/mapper/controller all updated
    DB: ALTER TABLE company_materials ADD COLUMN unit VARCHAR(50);
  - CompanyMaterialUpdateRequestDTO: new separate DTO for PUT update (no @NotNull materialId/price)
  - CompanyMaterialResponseDTO: added companyCity, companyDistrict, companyLogoUrl
  - Option A materials: companies can create materials via POST /api/materials (auth only, not admin)
    Frontend "create new" flow with inline button in search dialog
  - Company materials page: unit dropdown, formatted price "21.500 TL / Ton", Birim table column
  - DashboardLayout: company logo + company name in sidebar header
  - Company manage: real profile completion logic, derived activity log, button hidden at 100%
  - Catalog page query key fixed: 'company-me' → 'my-company' (all pages now consistent)
  - Login page: role-based redirect for already-logged-in users
  - proxy.ts: removed wrong role-based redirect (proxy can't decode JWT)
  - not-found.tsx: 'use client' added
  - Google Maps: extractMapSrc() helper, plain <iframe> element
  - CompanyService.updateCompany(): no longer nullifies status/catalogFileUrl/catalogFileType
  - material.service.ts: MaterialCompany interface changed to flat fields

Completed 2026-04-19 (session 2):
  - Company logo: POST/DELETE /api/companies/{id}/logo (files in ~/sanayi-marketi-uploads/logos/)
    Served via /uploads/logos/{companyId}/{filename}
    Frontend: /company/edit logo section, /companies list, /companies/[id] header, /favorites
  - FavoriteController: now returns CompanyResponseDTO (full company data incl. logoUrl, description)
  - approveApplication() fixed: uses saveAndFlush + post-trigger company update (no more double company creation)
  - DB migration needed: ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;

Completed 2026-04-19 (session 1):
  - Catalog upload backend: POST /api/companies/{id}/catalog + DELETE
    Files saved to ${user.home}/sanayi-marketi-uploads/catalogs/
    Served via /uploads/catalogs/{companyId}/{filename}
    WebConfig.java added for static resource serving
    multipart config added to application.yml
  - AdminController: merge + status-change endpoints
  - Frontend catalog page: real API calls (useQuery + useMutation)
  - Frontend admin/duplicates: merge/deactivate buttons wired to real API

Priority order (next session):
  1. Backend restart required after 2026-04-21 changes:
     - CompanyRepository (city filter fix)
     - CompanyService (4-way dispatch + findDuplicatePairs)
     - DuplicatePairDTO (new file)
     - AdminController (GET /companies/duplicates)
     - MaterialRepository (suspicious queries)
     - MaterialService (suspicious filter + countSuspicious)
     - FavoriteMapper (returns MaterialResponseDTO)
     - FavoriteController (return type change)
  2. End-to-end test: city filter on /companies page
  3. End-to-end test: material favoriting (add → panel shows immediately)
  4. End-to-end test: /admin/duplicates loads real pairs
  5. End-to-end test: /admin/materials Şüpheli tab shows correct results
  6. materials/[id]: show parentMaterialName instead of parentMaterialId (minor cosmetic fix)
  7. Decide on "Hesap Ayarları" page (deferred)

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
| Scraper kullanım yöntemi | Tek firma girişi: ad + URL + sektörler (multi-select) | LOCKED  |
| Sektör alanı            | "sector" string → "sectors" array (çoklu sektör)     | LOCKED  |
| Katalog analizi         | Firma scraping'inden bağımsız panel (Tab 3)           | LOCKED  |
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
| Catalog upload backend  | DONE -- POST/DELETE /api/companies/{id}/catalog (2026-04-19) | LOCKED |
| Admin duplicates API    | DONE -- merge/deactivate wired to real API (2026-04-19)      | LOCKED |
| Company logo            | DONE -- POST/DELETE /api/companies/{id}/logo (2026-04-19)    | LOCKED |
| company_materials.unit  | DONE -- unit VARCHAR(50) added (2026-04-19)                  | LOCKED |
| Materials creation      | Option A -- companies create materials (auth only, not admin) | LOCKED |
| CompanyMaterial update  | Uses CompanyMaterialUpdateRequestDTO (separate from add DTO)  | LOCKED |
| Query key consistency   | ALL company queries use 'my-company' (never 'company-me')     | LOCKED |
| proxy.ts role redirect  | REMOVED -- proxy can't decode JWT; redirect is client-side    | LOCKED |
| DashboardLayout header  | Company: logo + companyName. User: initial + "Hesabım"        | LOCKED |
| Profile completion      | Real data checks + "Eksikleri Tamamla" hidden at 100%         | LOCKED |
| Son Aktiviteler         | Derived from entity timestamps (no activity log table)        | LOCKED |
| Price display format    | "21.500 TL / Ton" format in materials table + suppliers list  | LOCKED |
| company_materials.price | NULL allowed -- price is optional for companies               | LOCKED |
| Material search         | findByMaterialNameContainingIgnoreCase -- case-insensitive    | LOCKED |
| Admin material mgmt     | Firms add freely; admin monitors/cleans via /admin/materials  | LOCKED |
| Material tracking       | createdAt + createdByCompanyId stored on every new material   | LOCKED |
| Suspicious materials    | 3 criteria: short name (<3) + orphan + duplicate normalizedName | LOCKED |
| CompanyCard navigation  | onClick+router.push (not component={Link}) -- no nested <a>   | LOCKED |
| City filter             | 4-way dispatch in CompanyService (Hibernate 7 null param fix)  | LOCKED |
| Phone validation        | startsWith('0') — accepts both GSM (05x) and landlines (03x)  | LOCKED |
| Material favoriting     | Supported on /materials list + /materials/[id] detail pages   | LOCKED |
| Favorite cache sync     | qc.invalidateQueries(['favorites','*']) after every toggle    | LOCKED |
| Cross-session cache     | QueryCacheClearer component: qc.clear() on userId change      | LOCKED |
| Favorites nav           | Single "Favoriler" item (merged from 2 separate items)        | LOCKED |
| Duplicate detection     | Levenshtein ≥70%, Turkish normalization, suffix removal       | LOCKED |
| FavoriteController      | Returns MaterialResponseDTO (not FavoriteMaterialResponseDTO) | LOCKED |
| Homepage search bar     | Category toggle integrated inside bar (not below it)          | LOCKED |
| AUTO_IMPORTED approval  | company.status→ACTIVE only; admin role NOT upgraded           | LOCKED |
| MANUAL_EXISTING approval| company_users created; conflict→IllegalStateException         | LOCKED |
| reapply() type preserve | applicationType + targetCompany preserved (not hardcode NEW)  | LOCKED |
| Admin company edit      | PUT /api/admin/companies/{id} bypasses ownership check        | LOCKED |
| importMaterials company | companyId → company_materials with PRODUCER role (default)    | LOCKED |
| Catalog analysis method | Option A: pdfminer.six + rule-based, free, no GPU            | LOCKED |
| Catalog analysis role   | Imported materials get PRODUCER role; admin can edit later    | PENDING |
| INACTIVE company admin  | /admin/companies shows only ACTIVE (TODO-12 to fix)           | PENDING |
| Company claiming flow   | MANUAL_EXISTING fully documented (see COMPANY CLAIMING AKIŞI) | LOCKED |
| Sahipsiz firma tespiti  | GET /api/admin/companies/owned-ids → frontend badge overlay   | LOCKED |
| company_id in JSON      | importCompany writes company_id to company_info.json          | LOCKED |

---

Document version: 20.0
Date: May 29, 2026
Status: ACTIVE -- Phase 8, 9, 10, 11 tamamlandı. Uçtan uca akış entegrasyonu, katalog analizi
        ve MANUAL_EXISTING claiming akışı çalışır durumda.

Sıradaki öncelikli işler:
  1. TODO-1, 4, 5, 6 — "TEST BEKLİYOR" durumundaki düzeltmeleri uçtan uca test et
  2. TODO-12 — /admin/companies INACTIVE firma gösterimi (admin endpoint gerekli)
  3. TODO-11 — MANUAL_EXISTING reapply formunda targetCompanyName göster
  4. TODO-14 — Aynı firma talep çakışması için admin uyarısı
  5. TODO-15 — DB trigger davranışını belgelemek için db.sql'i incele
    - MaterialRepository: findByMaterialNameIgnoreCase() [NEW]
    - ScraperResultDTO: companyId alanı eklendi [NEW]
    - New DTOs: CatalogAnalyzeRequestDTO, MaterialCandidateDTO, MaterialsCandidatesResponseDTO [NEW]
  Frontend:
    - /company-apply: MANUAL_EXISTING mod (firma arama + talep) [NEW]
    - /admin/approvals: MANUAL_EXISTING başvurularda targetCompanyName gösterimi [NEW]
    - /admin/companies: Sahipsiz badge, admin düzenleme dialogu [NEW]
    - /admin/scraper Tab 3: CandidateDrawer (checkbox seçimi, firma bağlantısı, import) [NEW]
    - admin.service.ts: analyzeCatalog, getCatalogCandidates, adminUpdateCompany, getOwnedCompanyIds [NEW]
