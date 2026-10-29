# CafeKhoj — Full Project Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Brand & Design System](#2-brand--design-system)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Backend Architecture](#5-backend-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Database Models](#7-database-models)
8. [REST API Reference](#8-rest-api-reference)
9. [Authentication & Security Architecture](#9-authentication--security-architecture)
10. [Device Authorization (1-Device Policy)](#10-device-authorization-1-device-policy)
11. [Google Places & Maps Integration](#11-google-places--maps-integration)
12. [Business & Monetization](#12-business--monetization)
13. [Admin Control Panel & Governance](#13-admin-control-panel--governance)
14. [Seed Data & Management Commands](#14-seed-data--management-commands)
15. [Automated Test Suite](#15-automated-test-suite)
16. [Frontend Pages & Components](#16-frontend-pages--components)
17. [Deployment & Production Runbook](#17-deployment--production-runbook)
18. [Test Accounts](#18-test-accounts)
19. [Quick Reference: Production Rules](#19-quick-reference-production-rules)

---

## 1. Project Overview

**CafeKhoj** (क्याफे खोज) is a production-grade, full-stack cafe discovery, management, and community platform built for coffee enthusiasts, remote workers, students, and cafe operators in **Birtamode, Damak, and the wider Jhapa District of Nepal**.

### What it does
- **Public Discovery**: Unauthenticated visitors can browse, search, and view verified cafes, facilities, menus, and operating hours without forced registration or login barriers.
- **Interactive Mapping**: Leaflet and OpenStreetMap integration featuring custom coffee pins, distance calculations, and an interactive coordinate picker.
- **Community Reviews**: Authenticated customer reviews (1–5 stars) with transactional aggregate score calculations and official business responses.
- **Merchant Management Portal**: Dual onboarding for cafe operators (claim existing venues or submit new listings), menu authoring, promotional campaign management, and active device controls.
- **High-Security Operator Auth**: Cryptographic 6-digit email OTP verification, salted SHA-256 code hashing, 5-minute expiry, and strict single-device session locking for merchant operators.
- **Admin Control Panel**: Real-time database metrics, cafe moderation workflow, change request approvals, device authorization queues, alert notifications, and 2-admin platform governance.
- **External Rating Verification**: Google Places API sync providing verified Google star ratings and review counts with read-only tamper resistance and graceful fallback.
- **Hero 3D Canvas**: Procedural ceramic cup and coffee bean physics rendered using Three.js and React Three Fiber.

### Geographic Scope
Initially focused on **Jhapa District, Nepal** (Birtamode, Damak, Bhadrapur, Kankai, Mechinagar) using verified physical venues, with nationwide architectural extensibility.

---

## 2. Brand & Design System

| Token | Hex | Usage |
|---|---|---|
| Espresso | `#241711` | Primary typography, dark panels, solid buttons |
| Coffee Brown | `#493126` | Warm secondary backgrounds, card accents |
| Warm Cream | `#F8F3EA` | Primary canvas, page backgrounds |
| Latte | `#E8D8C3` | Borders, card dividers, chip outlines |
| Caramel | `#C7834B` | Brand primary accent, CTAs, interactive highlights |
| Caramel Dark | `#B56F35` | Hover states on caramel controls |
| Muted Sage | `#8A9A78` | Verified merchant badges, success indicators |
| Pure White | `#FFFFFF` | Card surfaces, modal sheets |
| Secondary Text | `#766A60` | Metadata, subtitles, timestamps, labels |

Configured as Tailwind CSS color tokens in `frontend/tailwind.config.js`.

---

## 3. Technology Stack

### Backend
| Layer | Technology | Version | Notes |
|---|---|---|---|
| Runtime | Python | 3.14 / 3.12+ | Strongly typed modern Python |
| Web Framework | Django | 6.0 | Production configured |
| API Framework | Django REST Framework | 3.15+ | JSON REST endpoints |
| Database Engine | PostgreSQL | 17 (Supabase) | Production target (`ap-south-1`) with SQLite local fallback |
| Auth Tokens | `djangorestframework-simplejwt` | 5.3+ | JWT access & refresh cycle |
| Security & CORS | `django-cors-headers` | 4.3+ | Explicit origin whitelisting |
| External APIs | Google Places API (New) | REST | Read-only rating sync |
| Email Service | Django SMTP | Standard | Branded HTML & plain text OTP delivery |
| WSGI Server | Gunicorn | 21+ | Multi-worker production process |

### Frontend
| Layer | Technology | Version | Notes |
|---|---|---|---|
| Runtime / UI | React | 18.3 | TypeScript strict mode |
| Build Tool | Vite | 5.4 | Fast ESM bundling and Rollup production builds |
| Routing | React Router | 6.22 | Nested layouts, client route protection |
| Styling | Tailwind CSS | 3.4 | Utility-first styling with custom tokens |
| Maps | Leaflet + React-Leaflet | 1.9+ | Custom markers and location picker map |
| 3D Graphics | Three.js + R3F + Drei | 0.160+ | Procedural ceramic cup hero |
| Icons | Lucide React | 0.344+ | Clean modern SVG iconography |

---

## 4. Project Structure

```text
cafe khoj/
├── backend/
│   ├── cafekhoj/                  # Django project configuration
│   │   ├── settings.py            # Environment parser, DB config, JWT, security
│   │   ├── urls.py                # Root router, service discovery (/ & /api/v1/)
│   │   ├── wsgi.py / asgi.py
│   ├── core/                      # User authentication, OTPs, devices, admin governance
│   │   ├── models.py              # User, EmailOTP, DeviceSession, PlatformAdministrator, AdminNotification
│   │   ├── serializers.py         # Auth, OTP, Device, and Admin serializers
│   │   ├── views.py               # Auth, OTP, device sessions, admin delegation views
│   │   ├── email.py               # Cryptographic OTP email dispatcher
│   │   ├── management/commands/   # bootstrap_admin, verify_database, seed_cafekhoj
│   │   └── migrations/
│   ├── cafes/                     # Cafe catalog, categories, facilities, Google Places
│   │   ├── models.py              # Cafe, Category, Facility, OpeningHour, CafePhoto, CafeChangeRequest
│   │   ├── serializers.py         # Listing serializers with read-only rating protections
│   │   ├── views.py               # Search, filters, moderation, change requests, places sync
│   │   ├── google_places.py       # Google Places API integration module
│   │   └── migrations/
│   ├── reviews/                   # Customer reviews, favourites, moderation
│   │   ├── models.py              # Review, ReviewResponse, ReviewReport, Favourite
│   │   ├── views.py               # Recalculation signals and review endpoints
│   ├── business/                  # Claims, memberships, promotions, operator portal
│   │   ├── models.py              # BusinessClaim, BusinessMembership, Promotion, Subscription
│   │   ├── views.py               # Merchant dashboard, claim processing, analytics
│   ├── tests/                     # Automated test suites
│   │   ├── test_cafekhoj_api.py   # Catalog, search, claims, reviews tests
│   │   └── test_auth_and_security.py # OTP, 1-device policy, 2-admin limit, ratings tests
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── 3d/                # CoffeeHero3D component
│   │   │   ├── common/            # Navbar, Footer, CafeCard, StarRating, Badge
│   │   │   ├── map/               # CafeMap, LocationPickerMap
│   │   │   └── reviews/           # ReviewList, ReviewModal
│   │   ├── context/               # AuthContext, LocationContext
│   │   ├── pages/
│   │   │   ├── admin/             # AdminDashboardPage (8-tab governance panel)
│   │   │   ├── business/          # BusinessDashboardPage, ClaimCafePage
│   │   │   ├── AuthPages.tsx      # Login, Register, OTP verification
│   │   │   └── HomePage.tsx, ExplorePage.tsx, CafeDetailPage.tsx
│   │   ├── services/api.ts        # Unified client, device ID header injection, auto-refresh
│   │   ├── types/index.ts         # TypeScript models and interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── DOCUMENTATION.md
├── DEPLOYMENT.md
└── RESUME_CHECKPOINT.md
```

---

## 5. Backend Architecture

All API endpoints are mounted under `/api/v1/`.

### App: `core`
- **User Identity**: Custom `User` model with roles (`customer`, `business`, `admin`), `operator_relationship` (`owner`, `manager`, `staff`), and suspension status.
- **Email OTP Engine**: `EmailOTP` records cryptographically secure 6-digit verification codes using salted SHA-256 hashes with 5-minute expiry, 5-attempt limits, and 60-second cooldowns.
- **Operator Device Protection**: `DeviceSession` tracks hardware fingerprinting and session freshness. Restricts operator logins to a single authorized device.
- **Admin Delegation**: `PlatformAdministrator` enforces a strict platform-wide maximum of 2 administrators.
- **Notifications**: `AdminNotification` alerts platform administrators about device authorization requests, claims, and change requests.

### App: `cafes`
- **Catalog Management**: `Cafe` model featuring address, coordinates, price range, verification status, and publication status.
- **Google Places Integration**: `google_place_id`, `google_rating`, `google_user_ratings_total`, and `google_sync_status`. These fields are strictly read-only in serializers.
- **Change Request Auditing**: `CafeChangeRequest` allows operators to propose edits to published cafe metadata for administrative review before going live.
- **Distance Calculations**: Haversine formula calculation for `GET /cafes/nearby/` with coordinate radius filtering.

### App: `reviews`
- **Community Integrity**: `Review` model enforcing `(cafe, user)` uniqueness so each user may post only one review per cafe.
- **Automatic Score Updates**: Class method `recalculate_cafe_stats()` updates `average_rating` and `review_count` inside an atomic transaction upon review save or deletion.
- **Responses & Moderation**: Official one-to-one business replies (`ReviewResponse`) and community flagging (`ReviewReport`).

### App: `business`
- **Claim Workflow**: `BusinessClaim` stores PAN/VAT/business registration documents for admin review.
- **Team Access**: `BusinessMembership` assigns granular venue permissions (`owner`, `manager`, `staff`).
- **Promotions & Subscriptions**: Explicitly badged sponsored placements (`is_sponsored: true`) and inquiry-driven subscription upgrades.

---

## 6. Frontend Architecture

### Unified API Client (`frontend/src/services/api.ts`)
- **Automatic Header Injection**: Every outgoing request automatically attaches the persistent client device identifiers (`X-Device-Id` and `X-Device-Name`) generated from the browser environment.
- **Transparent Token Refresh**: Intercepts HTTP 401 responses, executes `POST /auth/refresh/` using the stored refresh token, and replays failed queries seamlessly.
- **Graceful Error Handling**: Maps API error objects into structured `ApiError` instances containing HTTP status codes and backend validation feedback.

### Client Contexts
- **`AuthContext.tsx`**: Provides authentication state, reactive user data, login/register triggers, OTP verification hooks, and device authorization warning propagation.
- **`LocationContext.tsx`**: Manages selected city state (defaulting to Birtamode) and handles browser Geolocation API permissions without persisting raw user coordinates.

---

## 7. Database Models

### `core` App Models

#### `User`
| Field | Type | Details |
|---|---|---|
| `role` | CharField | `customer`, `business`, `admin` |
| `operator_relationship` | CharField | `owner`, `manager`, `staff` (operator role classification) |
| `is_email_verified` | BooleanField | Required `True` before operators can log in |
| `is_suspended` | BooleanField | Flag to immediately block compromised accounts |
| `terms_accepted_at` | DateTimeField | Timestamp recording terms of service acceptance |

#### `EmailOTP`
| Field | Type | Details |
|---|---|---|
| `user` | FK → User | Target account |
| `email` | EmailField | Email where OTP was dispatched |
| `otp_hash` | CharField (64) | SHA-256 hash of the 6-digit code with salt |
| `salt` | CharField (32) | Cryptographic salt generated per request |
| `attempts` | IntegerField | Incrementing attempt counter (max 5) |
| `is_used` | BooleanField | Invalidation flag preventing replay attacks |
| `expires_at` | DateTimeField | Valid for exactly 5 minutes from generation |

#### `DeviceSession`
| Field | Type | Details |
|---|---|---|
| `user` | FK → User | Operator account |
| `device_id` | CharField (128) | Unique hardware/browser client identifier |
| `device_name` | CharField (255) | User-agent descriptor (OS, browser) |
| `ip_address` | GenericIPAddressField | IP recorded at authorization |
| `is_active` | BooleanField | Current authorization state |
| `last_used_at` | DateTimeField | Session freshness tracking |

#### `PlatformAdministrator`
| Field | Type | Details |
|---|---|---|
| `user` | OneToOne → User | Platform administrator account |
| `is_primary` | BooleanField | True for the founding system owner |
| `granted_by` | FK → User | Administrator who delegated the seat |

*Validation Rule:* `PlatformAdministrator.clean()` validates `PlatformAdministrator.objects.count() < 2` before creating new records, strictly preventing more than 2 administrators across the entire application.

---

### `cafes` App Models

#### `Cafe`
| Field | Type | Details |
|---|---|---|
| `name` | CharField | Cafe name |
| `slug` | SlugField | Collision-safe URL identifier |
| `address`, `location` | CharField, FK | Physical address and hierarchical City Location |
| `latitude`, `longitude` | DecimalField | Precise 6-decimal coordinates |
| `google_place_id` | CharField | Google Places identifier for rating sync |
| `google_rating` | DecimalField | Read-only Google star rating (1.0 to 5.0) |
| `google_user_ratings_total` | IntegerField | Read-only total review count from Google |
| `google_maps_url` | URLField | Direct link to official Google Maps listing |
| `google_sync_status` | CharField | `pending`, `synced`, `failed`, `not_found` |
| `verification_status` | CharField | `unverified`, `pending`, `verified`, `suspended` |
| `publication_status` | CharField | `draft`, `published`, `archived` |

---

## 8. REST API Reference

All routes are mounted under `/api/v1/`.

### Service Discovery & Health
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | System root status and version discovery. Returns HTTP 200. |
| GET | `/api/v1/` | Public | API v1 root index and service status. Returns HTTP 200. |

### Authentication & Account Security
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register/` | Public | Account registration. If registering as an operator (`business`), dispatches OTP and sets `is_email_verified=False`. |
| POST | `/api/v1/auth/verify-otp/` | Public | Validates 6-digit OTP code. Marks email as verified and activates account. |
| POST | `/api/v1/auth/resend-otp/` | Public | Requests fresh OTP. Enforces 60-second cooldown between requests. |
| POST | `/api/v1/auth/login/` | Public | Validates credentials. For operators, evaluates `X-Device-Id`. Blocks unrecognized devices with HTTP 403 `device_authorization_required`. |
| POST | `/api/v1/auth/refresh/` | Public | Refreshes expired access tokens. |
| GET | `/api/v1/auth/me/` | Bearer JWT | Returns authenticated user profile, roles, and status. |

### Operator Device Management
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/devices/` | Operator | Lists authorized device sessions for the authenticated operator. |
| POST | `/api/v1/devices/:id/deauthorize/` | Operator | Deauthorizes an active device session. |

### Cafe Catalog & Discovery
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/cafes/` | Public | Filterable list of published cafes (`city`, `category`, `facility`, `price`, `search`, `sort`). |
| GET | `/api/v1/cafes/nearby/` | Public | Radius-based distance search using Haversine calculation (`lat`, `lng`, `radius`). |
| GET | `/api/v1/cafes/:slug/` | Public | Detailed cafe listing including Google rating, facilities, menu, and hours. |
| POST | `/api/v1/cafes/create/` | Operator | Submit a new cafe listing for administrator verification. |
| POST | `/api/v1/cafes/:id/request-change/` | Operator | Submit an audited change request for a published cafe. |

### Administrator Governance (`/api/v1/admin-api/`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin-api/dashboard/` | Admin | Real database metrics for cafes, claims, users, and device requests. |
| GET | `/admin-api/cafes/` | Admin | Moderation listing with status filters. |
| POST | `/admin-api/cafes/:id/status/` | Admin | Change cafe status (`published`, `suspended`, `verified`). |
| POST | `/admin-api/cafes/:id/sync-google/` | Admin | Manually trigger Google Places rating sync for a cafe. |
| GET | `/admin-api/device-requests/` | Admin | List pending secondary device authorization requests. |
| POST | `/admin-api/device-requests/:id/review/` | Admin | Approve or reject a device authorization request (`decision: approve/reject`). |
| GET | `/admin-api/administrators/` | Admin | List current platform administrators (max 2). |
| POST | `/admin-api/administrators/delegate/` | Primary Admin | Delegate the second administrator seat. Fails if 2 already exist. |
| GET | `/admin-api/notifications/` | Admin | Alert stream for claims, device requests, and reports. |
| POST | `/admin-api/notifications/:id/read/` | Admin | Mark notification as read. |

---

## 9. Authentication & Security Architecture

```mermaid
sequenceDiagram
    actor Operator as Cafe Operator
    participant Client as Frontend (Vite)
    participant API as Django REST Framework
    participant Mail as SMTP Mailer
    participant DB as Supabase PostgreSQL

    Operator->>Client: Enters Registration Details
    Client->>API: POST /api/v1/auth/register/ (role='business')
    API->>DB: Create User (is_email_verified=False)
    API->>API: Generate 6-digit OTP & Salted Hash
    API->>DB: Store EmailOTP (expires in 5 min)
    API->>Mail: Dispatch Branded OTP Email
    API-->>Client: 201 Created (otp_required=True)
    Operator->>Client: Enters 6-digit code
    Client->>API: POST /api/v1/auth/verify-otp/
    API->>DB: Verify Salted Hash & Expiry
    API->>DB: Set is_email_verified=True, is_used=True
    API-->>Client: 200 OK (Verification Successful)
```

### Security Safeguards
1. **Public Exploration Free of Auth Barriers**: General visitors can browse cafes, view menus, and read reviews without creating an account or logging in.
2. **Cryptographic OTP Security**:
   - 6-digit OTP codes are hashed with a 32-character random salt via SHA-256 before storage.
   - Plain text codes are never persisted to the database.
   - Code expires in 5 minutes; maximum 5 invalid verification attempts permitted before invalidation.
   - 60-second cooldown enforced between resend requests to prevent mailbox flooding.
3. **Strict 2-Administrator Platform Limit**:
   - The platform strictly enforces a ceiling of **2 platform administrators**.
   - Admin account delegation is restricted to the primary owner.
   - Public registration as an administrator is impossible.
   - Primary owner is bootstrapped via the secure `bootstrap_admin` command.

---

## 10. Device Authorization (1-Device Policy)

To protect confidential merchant operations and prevent credential sharing, CafeKhoj implements a strict **1 active authorized device policy** for operators (`Owner`, `Manager`, `Staff`):

```mermaid
flowchart TD
    LoginReq[Operator Login Request] --> CheckVerified{Email Verified?}
    CheckVerified -- No --> RejectUnverified[403 Forbidden: Email verification required]
    CheckVerified -- Yes --> CheckDevice{Device ID matches active DeviceSession?}
    CheckDevice -- Yes --> IssueToken[Issue JWT Tokens: Allow Access]
    CheckDevice -- No --> HasActive{Does Operator already have an active device?}
    HasActive -- No --> RegisterInitial[Register DeviceSession as Active: Issue JWT Tokens]
    HasActive -- Yes --> BlockSecondary[403: device_authorization_required]
    BlockSecondary --> CreateRequest[Create DeviceAuthorizationRequest & AdminNotification]
    CreateRequest --> AdminReview{Admin Approves?}
    AdminReview -- Yes --> RevokePrior[Deauthorize Prior Device Session]
    RevokePrior --> AuthorizeNew[Mark New Device Active: Operator Can Now Log In]
    AdminReview -- No --> RejectReq[Request Marked Rejected]
```

### Key Policy Rules
1. **No Tokens on Unauthorized Devices**: When a second device attempts login, the backend **refuses to issue JWT tokens**.
2. **Automated Admin Escalation**: A `DeviceAuthorizationRequest` is created immediately alongside an `AdminNotification` alerting platform administrators.
3. **Zero Compromise Session Handoff**: Approving a new device transactionally deauthorizes the prior device session.
4. **Self-Service Deauthorization**: Operators can view and deauthorize their own active device sessions from the business dashboard.

---

## 11. Google Places & Maps Integration

### Leaflet Interactive Location Picker (`LocationPickerMap`)
- Used in the cafe onboarding wizard (`/business/claim` -> "Register New Cafe").
- Allows cafe owners to click anywhere on the map or drag a pin to select their exact coordinates.
- Includes a Nepal-biased search input to jump directly to locations in Jhapa (Birtamode, Damak, etc.).
- Automatically synchronizes `latitude` and `longitude` form fields to 6 decimal places.

### Google Places Ratings Integration
- **Read-Only Fields**: `google_rating`, `google_user_ratings_total`, and `google_maps_url` are strictly read-only for operators.
- **Admin & Background Sync**: Ratings are synchronized via `cafes.google_places.sync_cafe_google_places` using the Google Places API (New).
- **Graceful UI Fallback**: If the API key is not configured, or if a cafe has not yet been linked to a Google Place ID, the UI renders a clean **"Rating unavailable"** badge rather than breaking or displaying false zero values.
- **Zero Fabricated Data**: The platform strictly prohibits seeded mock ratings or fake reviews.

---

## 12. Business & Monetization

### Dual Onboarding Flow (`/business/claim`)
Operators can choose between two pathways:
1. **Claim Existing Cafe**:
   - Search published cafes in Jhapa.
   - Enter operator relationship (`Owner`, `Manager`, `Staff`), contact details, and evidence (PAN, VAT, Municipal License).
   - Routed to administrator review queue.
2. **Register New Cafe**:
   - Full cafe profile authoring: name, address, phone, Instagram, description.
   - Interactive pin placement using `LocationPickerMap`.
   - Category and amenity selection.
   - Submitted to moderation queue with status `pending_review`.

---

## 13. Admin Control Panel & Governance

The platform administrator control panel at `/admin` provides 8 dedicated governance sections:

1. **Overview**: Real-time database metrics (total cafes, published, pending review, active claims, device authorization requests).
2. **Cafes Moderation**: Filter by status, approve pending submissions, publish, suspend, and trigger manual Google Places syncs.
3. **Device Authorizations**: Review secondary device access requests from operators with one-click Approve / Reject actions.
4. **Claims Review**: Verify submitted PAN/VAT business registration documents and approve merchant ownership.
5. **Notification Center**: Real-time alert stream for pending claims, device requests, and reports with mark-as-read toggles.
6. **Platform Administrators**: View active administrators and delegate the 2nd administrator seat (strictly capped at 2).
7. **Reports & Moderation**: Review community-flagged reviews and take moderation actions.
8. **Bulk CSV Import**: Import venues with dry-run validation and audit logging.

---

## 14. Seed Data & Management Commands

### `python manage.py bootstrap_admin`
Bootstraps the primary platform owner account:
```bash
python manage.py bootstrap_admin --username <username> --email <email> --password <password>
```
- Creates or promotes the user to `admin` role with superuser privileges.
- Registers the primary `PlatformAdministrator` record.
- Ensures the maximum 2-admin platform policy is initialized cleanly.

### `python manage.py verify_database`
Verifies database connectivity, tables, and record counts:
```bash
python manage.py verify_database
```

### `python manage.py seed_cafekhoj`
Populates foundational metadata (categories, facilities, subscription tiers, locations) and imports verified Jhapa venues from `real_cafes_jhapa.csv` without creating fake reviews.

---

## 15. Automated Test Suite

CafeKhoj maintains 31 automated tests covering functional and security requirements.

### Test Execution
```bash
cd backend
python manage.py test tests
```

### Coverage Breakdown
1. **`tests/test_cafekhoj_api.py`**:
   - `test_user_registration_and_login`: Customer registration and JWT lifecycle.
   - `test_cafe_list_and_filtering`: Category, city, and amenity filtering.
   - `test_nearby_distance_calculation`: Haversine geographic radius query verification.
   - `test_review_submission_and_duplicate_prevention`: Rating recalculation and duplicate blocking.
   - `test_favourite_toggle`: Customer saving/unsaving collection toggling.
   - `test_business_claim_and_admin_approval`: Claim evidence review and role elevation.
   - `test_csv_import_validation_and_dry_run`: CSV bulk import validation and dry-run safety.
2. **`tests/test_auth_and_security.py`**:
   - `test_unauthenticated_visitor_can_browse_cafes`: Confirms no auth barriers for public browsing.
   - `test_root_endpoints_return_200`: Verifies `GET /` and `GET /api/v1` return HTTP 200.
   - `test_operator_registration_requires_email_verification`: Verifies unverified operator login is rejected.
   - `test_otp_generation_verification_and_single_use`: Verifies salted SHA-256 OTP hashing and replay prevention.
   - `test_operator_device_session_limit_blocks_second_device`: Verifies 1-device policy and 403 response.
   - `test_platform_administrator_max_limit_enforced`: Verifies strict 2-admin model limit.
   - `test_google_places_rating_is_readonly_in_serializers`: Verifies operator rating tamper resistance.
   - `test_cafe_change_request_workflow`: Verifies change request auditing.

---

## 16. Frontend Pages & Components

### Route Map
| Route | Page Component | Access | Purpose |
|---|---|---|---|
| `/` | `HomePage` | Public | 3D Hero, mood discovery, featured venues, map preview |
| `/explore` | `ExplorePage` | Public | Full filterable directory (city, amenity, price, rating) |
| `/map` | `MapPage` | Public | Full-screen interactive Leaflet map of all cafes |
| `/cafes/:slug` | `CafeDetailPage` | Public | Venue profile, Google ratings, menu, hours, reviews |
| `/login` | `AuthPages` | Public | User and operator sign in with device detection |
| `/register` | `AuthPages` | Public | Customer & operator sign up with relationship picker |
| `/verify-otp` | `AuthPages` | Public | 6-digit cryptographic email verification form |
| `/business/claim` | `ClaimCafePage` | Authenticated | Dual wizard (Claim existing / Register new cafe with map) |
| `/business/dashboard` | `BusinessDashboardPage` | Operator | Analytics, menu management, authorized devices list |
| `/admin` | `AdminDashboardPage` | Admin Only | 8-tab operations, moderation, and device approval panel |

---

## 17. Deployment & Production Runbook

### Production Architecture
- **Frontend**: Vercel (`https://cafekhoj.vercel.app/`)
- **Backend API**: Render (`https://cafekhoj-api.onrender.com/`)
- **Database**: Supabase PostgreSQL 17 (`ap-south-1`)

### Required Production Environment Variables

#### Render Backend Configuration
| Variable | Value / Format | Purpose |
|---|---|---|
| `SECRET_KEY` | High-entropy random string | Django cryptographic signing |
| `DEBUG` | `False` | Disables debug mode in production |
| `ALLOWED_HOSTS` | `cafekhoj-api.onrender.com,localhost,127.0.0.1` | Host header validation |
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?sslmode=require` | Supabase connection string |
| `CORS_ALLOWED_ORIGINS` | `https://cafekhoj.vercel.app` | Allowed CORS origins |
| `EMAIL_BACKEND` | `django.core.mail.backends.smtp.EmailBackend` | SMTP delivery |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP server |
| `EMAIL_PORT` | `587` | TLS port |
| `EMAIL_USE_TLS` | `True` | TLS encryption |
| `EMAIL_HOST_USER` | `your-email@example.com` | SMTP username |
| `EMAIL_HOST_PASSWORD` | App Password (16 chars) | SMTP app password |
| `DEFAULT_FROM_EMAIL` | `CafeKhoj <noreply@cafekhoj.np>` | Sender header |
| `GOOGLE_PLACES_API_KEY` | `AIzaSy...` | Google Places API key (optional) |
| `OPERATOR_MAX_ACTIVE_DEVICES` | `1` | Strict device limit enforcement |

#### Vercel Frontend Configuration
| Variable | Value | Purpose |
|---|---|---|
| `VITE_API_URL` | `https://cafekhoj-api.onrender.com/api/v1` | Production API endpoint |

---

## 18. Test Accounts

| Role | Username | Password | Email | Access |
|---|---|---|---|---|
| Platform Administrator | `admin` | `AdminPass123!` | `admin@cafekhoj.np` | Full governance panel, moderation, claims, device approvals |
| Business Owner | `birtamode_roaster` | `OwnerPass123!` | `owner@thirdhome.np` | Third Home Coffee portal, menu, reviews, promotions |
| Customer / Explorer | `anita_sharma` | `UserPass123!` | `anita@gmail.com` | Public discovery, favourites, review submission |
| Customer / Student | `kiran_thapa` | `UserPass123!` | `kiran.t@gmail.com` | Public discovery, favourites, review submission |

---

## 19. Quick Reference: Production Rules

| Rule | Enforcement Mechanism |
|---|---|
| **Public Unauthenticated Browsing** | All discovery endpoints (`/api/v1/cafes/`, `/api/v1/categories/`, `/api/v1/search/`) allow unauthenticated `GET` requests without login redirects. |
| **Operator 1-Device Policy** | `DeviceSession` blocks secondary devices with HTTP 403 `device_authorization_required` without issuing tokens. |
| **Max 2 Platform Administrators** | `PlatformAdministrator.clean()` validates `count < 2` at the database model layer. |
| **Cryptographic OTP Invalidation** | Salted SHA-256 hash, 5-minute expiration, 5-attempt limit, and single-use invalidation (`is_used=True`). |
| **Tamper-Proof Google Ratings** | `google_rating` and `google_user_ratings_total` are read-only in serializers with safe fallback when unconfigured. |
| **Atomic Rating Recalculation** | `Review.recalculate_cafe_stats()` recalculates average ratings inside `transaction.atomic()` on every review change. |
| **One Review Per User** | Enforced via database `unique_together = ('cafe', 'user')` and DRF validation. |
| **Zero Mock Venues in Production** | Listings strictly represent verified real cafes in Jhapa, Nepal. |

---

*© 2026 CafeKhoj Nepal. Production-ready full-stack cafe discovery and management architecture.*
