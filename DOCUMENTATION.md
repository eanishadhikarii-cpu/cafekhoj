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
9. [Authentication System](#9-authentication-system)
10. [Business & Monetization](#10-business--monetization)
11. [Admin Tools](#11-admin-tools)
12. [Seed Data & Management Commands](#12-seed-data--management-commands)
13. [Automated Test Suite](#13-automated-test-suite)
14. [Frontend Pages & Components](#14-frontend-pages--components)
15. [Deployment Guide](#15-deployment-guide)
16. [Test Accounts](#16-test-accounts)

---

## 1. Project Overview

**CafeKhoj** (क्याफे खोज) is a production-oriented, full-stack cafe discovery and community review platform built for coffee lovers, remote workers, students, and cafe owners in **Birtamode and the wider Jhapa District of Nepal**.

### What it does
- Lets users **discover cafes** by mood, budget, facilities (Wi-Fi, AC, parking), city, and rating
- Shows cafes on an **interactive Leaflet/OpenStreetMap** with custom coffee-pin markers
- Allows authenticated users to **submit reviews**, save favourites, and mark reviews as helpful
- Gives **business owners** a merchant portal to manage listings, menus, promotions, and view analytics
- Gives **platform admins** a full dashboard for moderation, claim approvals, and CSV bulk imports
- Features a **3D animated coffee hero** (Three.js / React Three Fiber) on the homepage

### Geographic Scope
Initially covers **Birtamode** (23 venues) and **Damak** (30 venues) in Jhapa District, Nepal. Designed to be extended nationwide.

---

## 2. Brand & Design System

| Token | Hex | Usage |
|---|---|---|
| Espresso | `#241711` | Primary typography, dark panels |
| Coffee Brown | `#493126` | Warm secondary backgrounds |
| Warm Cream | `#F8F3EA` | Primary editorial canvas |
| Latte | `#E8D8C3` | Borders, card dividers, chips |
| Caramel | `#C7834B` | Brand accent, CTAs, active highlights |
| Muted Sage | `#8A9A78` | Verified merchant & safety badges |
| Pure White | `#FFFFFF` | Card surfaces, modals |
| Secondary Text | `#766A60` | Subtitles, metadata, timestamps |

All tokens are configured as Tailwind CSS custom colors in `tailwind.config.js`.

---

## 3. Technology Stack

### Backend
| Layer | Technology |
|---|---|
| Language | Python 3.14 |
| Framework | Django 6.0 |
| API | Django REST Framework (DRF) |
| Auth | JWT via `djangorestframework-simplejwt` |
| Database | PostgreSQL (prod) / SQLite (dev fallback) |
| CORS | `django-cors-headers` |
| Filtering | `django-filter` |

### Frontend
| Layer | Technology |
|---|---|
| Language | TypeScript |
| Framework | React 18 |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS with custom design tokens |
| 3D Graphics | Three.js, `@react-three/fiber`, `@react-three/drei` |
| Maps | Leaflet + OpenStreetMap tiles |
| Icons | Lucide React |
| Routing | React Router v6 |

---

## 4. Project Structure

```
cafe khoj/
├── backend/
│   ├── cafekhoj/          # Django project settings, root URLs, WSGI/ASGI
│   ├── core/              # Users, Locations, AuditLog, Analytics
│   ├── cafes/             # Cafe listings, Categories, Facilities, Menus
│   ├── reviews/           # Reviews, Favourites, Reports, Responses
│   ├── business/          # Claims, Memberships, Subscriptions, Promotions, Admin API
│   ├── seed_data/         # real_cafes_jhapa.csv (53 real venues)
│   ├── tests/             # Automated API test suite
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # AuthContext, LocationContext
│   │   ├── pages/         # All route-level page components
│   │   ├── services/      # api.ts — unified API client
│   │   ├── types/         # TypeScript interfaces
│   │   ├── App.tsx        # Router and layout shell
│   │   └── main.tsx       # React entry point
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.ts
├── README.md
└── DOCUMENTATION.md
```

---

## 5. Backend Architecture

The backend is split into **4 Django apps**, each with its own models, serializers, views, and URL patterns. All apps are mounted under `/api/v1/` in `cafekhoj/urls.py`.

### App: `core`
Foundation layer. Handles users, locations, audit logging, and analytics event tracking.

**Key responsibilities:**
- Custom `User` model extending `AbstractUser` with role-based access
- `Location` model for city/neighbourhood hierarchy
- `AuditLog` for admin action traceability
- `AnalyticsEvent` for tracking listing views, direction clicks, contact clicks, and favourites

### App: `cafes`
Core discovery engine. The largest app.

**Key responsibilities:**
- `Cafe` model with full metadata: coordinates, price range, verification status, publication status
- `Category` and `Facility` models for mood/amenity filtering
- `OpeningHour`, `CafePhoto`, `MenuCategory`, `MenuItem` for rich listing profiles
- Multi-filter list view with keyword search and 5 sort modes
- Haversine great-circle distance calculation for nearby search
- Global multi-entity search across cafes, categories, and locations

### App: `reviews`
Community feedback layer.

**Key responsibilities:**
- `Review` model with unique-per-user-per-cafe constraint
- Automatic aggregate rating recalculation on every save/delete (transactional)
- `ReviewResponse` (one official business reply per review)
- `ReviewReport` for community moderation flagging
- `Favourite` toggle (save/unsave cafes)

### App: `business`
Merchant portal and admin tooling.

**Key responsibilities:**
- `BusinessClaim` workflow (submit → admin approve/reject)
- `BusinessMembership` linking users to cafes they manage
- `SubscriptionPlan` and `Subscription` for tiered monetization
- `Promotion` model with explicit `is_sponsored` flag
- Full admin dashboard, CSV bulk importer, review moderation, report resolution

---

## 6. Frontend Architecture

### Routing (`App.tsx`)
React Router v6 with the following route groups:

| Group | Routes |
|---|---|
| Public | `/`, `/explore`, `/map`, `/cafes/:slug`, `/categories/:category`, `/locations/:city`, `/collections`, `/about`, `/contact`, `/privacy`, `/terms` |
| Auth | `/login`, `/register`, `/forgot-password`, `/verify-email` |
| Customer | `/profile`, `/profile/reviews`, `/profile/favourites`, `/profile/settings` |
| Business | `/business`, `/business/claim`, `/business/dashboard`, `/business/promotions`, `/business/billing` |
| Admin | `/admin`, `/admin/cafes`, `/admin/reviews`, `/admin/users`, `/admin/businesses`, `/admin/reports` |

All unmatched routes redirect to `/`.

### API Client (`services/api.ts`)
A single `request<T>()` function handles all HTTP calls with:
- Automatic JWT injection from `localStorage`
- Automatic token refresh on 401 responses (retries original request with new token)
- Token cleanup on refresh failure
- Custom `ApiError` class carrying `status` and `data`
- Silent-fail analytics tracking via `trackEvent()` using `sessionStorage` session IDs

### Auth Context (`context/AuthContext.tsx`)
React Context providing:
- `user`, `token`, `isLoading` state
- `login()`, `register()`, `logout()`, `updateUser()` methods
- `isAdmin` and `isBusiness` computed booleans
- Persists user and tokens to `localStorage`; validates token on mount via `GET /auth/me/`

### Location Context (`context/LocationContext.tsx`)
Provides:
- `selectedCity` state (default: Birtamode)
- `userCoords` from browser Geolocation API (explicit permission only, never persisted)
- `requestUserLocation()` and `isLocating` flag

---

## 7. Database Models

### `core` App

#### `User`
Extends Django's `AbstractUser`.

| Field | Type | Notes |
|---|---|---|
| `role` | CharField | `customer`, `business`, `admin` |
| `phone` | CharField | Optional |
| `avatar_url` | URLField | Optional |
| `bio` | TextField | Optional |
| `is_email_verified` | BooleanField | Auto-set to `True` in demo |
| `created_at` / `updated_at` | DateTimeField | Auto timestamps |

Methods:
- `is_business_owner()` — returns `True` if role is `business`, or is staff/superuser
- `is_platform_admin()` — returns `True` if role is `admin`, or is superuser/staff

#### `Location`
| Field | Type | Notes |
|---|---|---|
| `country` | CharField | Default: Nepal |
| `province` | CharField | Default: Koshi Province |
| `district` | CharField | Default: Jhapa |
| `city` | CharField | Required |
| `neighbourhood` | CharField | Optional |
| `latitude` / `longitude` | DecimalField | Optional center coords |
| `is_active` | BooleanField | Filters active cities in API |

Unique constraint: `(city, neighbourhood)`

#### `AuditLog`
Tracks all admin actions: `actor_user`, `action`, `entity_type`, `entity_id`, `details` (JSON), `ip_address`.

#### `AnalyticsEvent`
Event types: `listing_view`, `search_appearance`, `direction_click`, `website_click`, `contact_click`, `favourite_add`. Linked to a `Cafe` (nullable for general events).

---

### `cafes` App

#### `Category`
| Field | Type |
|---|---|
| `name` | CharField (unique) |
| `slug` | SlugField (auto-generated) |
| `description` | TextField |
| `icon_name` | CharField (Lucide icon name) |
| `image_url` | URLField |

10 seeded categories: Date Night, Study Session, Coffee Lovers, Budget Friendly, Beautiful Interiors, Outdoor Seating, Desserts & Bakery, Friends Meetup, Quiet Corners, Family Friendly.

#### `Facility`
| Field | Type |
|---|---|
| `name` | CharField (unique) |
| `slug` | SlugField (auto-generated) |
| `icon_name` | CharField (Lucide icon name) |

8 seeded facilities: Free High-Speed Wi-Fi, Air Conditioning, Outdoor Patio/Garden, Laptop Power Sockets, Dedicated Parking, eSewa/Fonepay/Card Payment, Pet Friendly, Vegan & Vegetarian Options.

#### `Cafe`
The central model. Key fields:

| Field | Type | Notes |
|---|---|---|
| `name` | CharField | |
| `slug` | SlugField | Auto-generated, collision-safe |
| `tagline` | CharField | Short descriptor |
| `description` | TextField | |
| `address` | CharField | |
| `location` | FK → Location | PROTECT on delete |
| `latitude` / `longitude` | DecimalField | 6 decimal places |
| `phone`, `email`, `website` | Various | Contact info |
| `social_instagram`, `social_facebook` | CharField | |
| `price_range` | CharField | `budget`, `moderate`, `premium` |
| `verification_status` | CharField | `unverified`, `pending`, `verified`, `temp_closed`, `permanently_closed`, `archived` |
| `publication_status` | CharField | `draft`, `published`, `archived` |
| `categories` | M2M → Category | |
| `facilities` | M2M → Facility | Through `CafeFacility` |
| `cover_image_url` | URLField | |
| `average_rating` | DecimalField | Cached aggregate |
| `review_count` | PositiveIntegerField | Cached aggregate |
| `is_sample_data` | BooleanField | Labels demo vs live data |
| `source` | CharField | Import attribution |
| `last_verified_at` | DateTimeField | |

Default ordering: `-average_rating`, `-review_count`, `name`.
Slug generation: appends `-1`, `-2`, etc. on collision.

#### `CafeFacility` (through table)
Links `Cafe` ↔ `Facility` with a `verification_status` field (`unverified`/`verified`).

#### `CafePhoto`
| Field | Notes |
|---|---|
| `cafe` | FK → Cafe |
| `image_url` | Required |
| `caption`, `alt_text`, `attribution` | Optional metadata |
| `display_order` | Integer for sorting |
| `moderation_status` | `pending`, `approved`, `rejected` |
| `is_cover` | Boolean |

#### `OpeningHour`
One row per day (0=Monday … 6=Sunday) per cafe. Fields: `opens_at`, `closes_at`, `is_closed`, `special_note`. Unique constraint: `(cafe, day_of_week)`.

#### `MenuCategory` / `MenuItem`
`MenuCategory` groups items per cafe with `display_order`.
`MenuItem` fields: `name`, `description`, `price` (NPR), `currency`, `image_url`, `availability_status` (`available`/`out_of_stock`/`seasonal`), `dietary_labels`, `is_signature`.

---

### `reviews` App

#### `Review`
| Field | Notes |
|---|---|
| `cafe` | FK → Cafe |
| `user` | FK → User |
| `rating` | 1–5 (validated) |
| `review_text` | TextField |
| `visit_date` | DateField (optional) |
| `moderation_status` | `pending`, `published`, `rejected`, `flagged` |
| `helpful_count` | PositiveIntegerField |

Unique constraint: `(cafe, user)` — one active review per user per cafe.

Class method `recalculate_cafe_stats(cafe_id)`: runs inside `transaction.atomic()`, aggregates only `published` reviews, updates `Cafe.average_rating` and `Cafe.review_count`.

Overrides `save()` and `delete()` to always trigger recalculation.

#### `ReviewResponse`
OneToOne to `Review`. Stores the official business reply (`response_text`, `business_user`). Uses `update_or_create` so only one response exists per review.

#### `ReviewReport`
Fields: `review`, `reporter`, `reason`, `details`, `status` (`pending`, `reviewed`, `dismissed`, `action_taken`).

#### `Favourite`
Unique constraint: `(user, cafe)`. Toggle pattern: `get_or_create` → if already exists, delete it.

---

### `business` App

#### `BusinessClaim`
| Field | Notes |
|---|---|
| `cafe` | FK → Cafe |
| `claimant` | FK → User |
| `business_role` | e.g. "Owner / Founder" |
| `contact_phone`, `contact_email` | Required |
| `evidence_reference` | PAN/VAT/permit details |
| `status` | `pending`, `approved`, `rejected` |
| `reviewed_by`, `reviewed_at` | Set on admin action |
| `admin_notes`, `rejection_reason` | Admin feedback |

#### `BusinessMembership`
Links a `User` to a `Cafe` with a `role` (`owner`/`manager`). Unique constraint: `(cafe, user)`. Created automatically on claim approval or cafe creation by a business user.

#### `SubscriptionPlan`
4 seeded tiers:

| Plan | Code | Price (NPR/month) |
|---|---|---|
| Free Explorer | `free` | 0 |
| Featured Showcase | `featured` | 500 |
| Premium Business | `premium` | 1,000 |
| Business Plus | `business_plus` | 2,000 |

Fields: `name`, `code` (unique), `price`, `currency`, `billing_period`, `features` (JSON array), `is_active`, `display_order`.

#### `Subscription`
Links `Cafe` ↔ `SubscriptionPlan`. Status: `active`, `pending_payment`, `expired`, `cancelled`. Payment reference format: `INQ-{cafe_id}-{plan_code}-{timestamp}`.

#### `Promotion`
| Field | Notes |
|---|---|
| `cafe` | FK → Cafe |
| `title`, `description` | Campaign content |
| `start_at`, `end_at` | DateTimeField |
| `status` | `draft`, `pending_approval`, `active`, `expired`, `rejected` |
| `is_sponsored` | Boolean — renders explicit "Sponsored Placement" badge |
| `discount_percentage` | Optional integer |
| `click_count` | Tracked engagement metric |

---

## 8. REST API Reference

All endpoints are prefixed with `/api/v1/`.

### Authentication & Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register/` | Public | Create account. Returns JWT + user profile. Role `admin` is blocked from self-registration. |
| POST | `/auth/login/` | Public | Accepts username or email. Returns JWT access + refresh tokens + user profile. |
| POST | `/auth/refresh/` | Public | Refresh expired access token using refresh token. |
| GET | `/auth/me/` | Bearer JWT | Get authenticated user profile. |
| PATCH | `/auth/me/` | Bearer JWT | Update profile fields: `bio`, `phone`, `avatar_url`, `first_name`, `last_name`. |

### Cafes & Discovery

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/cafes/` | Public | List published cafes with multi-filter support (see filters below). |
| GET | `/cafes/nearby/` | Public | Haversine distance-sorted cafes within a radius. |
| GET | `/cafes/:slug/` | Public | Full cafe detail: hours, facilities, menu, photos, related cafes. |
| POST | `/cafes/create/` | Bearer JWT | Create a new cafe listing. |
| PATCH | `/cafes/:id/update/` | Bearer JWT | Update cafe (owner or admin only). |
| GET | `/categories/` | Public | All categories with live `cafe_count`. |
| GET | `/facilities/` | Public | All facilities. |
| GET | `/locations/` | Public | Active cities with `cafe_count`. |
| GET | `/search/?q=` | Public | Multi-entity search (min 2 chars). Returns cafes, categories, locations. |

#### `GET /cafes/` Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `city` | string | Filter by city or district name (case-insensitive) |
| `category` | string | Filter by category slug |
| `facility` | string | Filter by facility slug |
| `price` | string | `budget`, `moderate`, or `premium` |
| `min_rating` | float | Minimum average rating |
| `verified` | bool | `true` to show only verified cafes |
| `search` | string | Keyword search across name, tagline, description, address, city, neighbourhood, categories |
| `sort` | string | `relevance`, `highest_rated`, `most_reviewed`, `newest`, `name`, `nearest` |
| `lat` / `lng` | float | User coordinates for distance injection and `nearest` sort |

#### `GET /cafes/nearby/` Query Parameters

| Parameter | Default | Description |
|---|---|---|
| `lat` | 26.6343 (Birtamode Muktichowk) | Latitude |
| `lng` | 87.9863 | Longitude |
| `radius` | 15.0 | Search radius in kilometers |

### Reviews & Favourites

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/cafes/:id/reviews/` | Public | Published reviews. Supports `rating`, `sort` (newest/highest/lowest/helpful) filters. |
| POST | `/cafes/:id/reviews/` | Bearer JWT | Submit review (1–5 stars). Enforces one active review per user per cafe. |
| PATCH | `/reviews/:id/` | Bearer JWT | Update own review (or admin). |
| DELETE | `/reviews/:id/` | Bearer JWT | Delete own review (or admin). Triggers rating recalculation. |
| POST | `/reviews/:id/helpful/` | Bearer JWT | Increment helpful vote (race-condition safe via `F()` expression). |
| POST | `/reviews/:id/report/` | Bearer JWT | Report review for moderation. |
| POST | `/reviews/:id/respond/` | Bearer JWT | Post official business reply (owner or admin only). |
| POST | `/favourites/` | Bearer JWT | Toggle save/unsave a cafe. Body: `{ "cafe_id": <int> }`. |
| GET | `/me/favourites/` | Bearer JWT | Current user's saved cafe collection. |
| GET | `/me/reviews/` | Bearer JWT | Current user's submitted reviews. |

### Business & Monetization

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/business-claims/` | Bearer JWT | Submit ownership claim with evidence reference. |
| GET | `/business-claims/` | Bearer JWT | List own claims (admin sees all, filterable by `status`). |
| GET | `/business/dashboard/` | Bearer JWT | Analytics, recent reviews, promotions, subscriptions for managed cafes. |
| GET | `/business/promotions/` | Bearer JWT | List promotions for managed cafes. |
| POST | `/business/promotions/` | Bearer JWT | Create a promotion (ownership-gated). |
| GET | `/subscription-plans/` | Public | All active subscription tiers. |
| POST | `/subscriptions/inquire/` | Bearer JWT | Initiate subscription inquiry (creates `pending_payment` record). |

### Administration

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin-api/dashboard/` | Admin | Platform health stats. |
| POST | `/admin-api/claims/:id/review/` | Admin | Approve or reject a business claim. |
| POST | `/admin-api/reviews/:id/moderate/` | Admin | Set review moderation status. |
| GET | `/admin-api/reports/` | Admin | List all review reports. |
| POST | `/admin-api/reports/:id/resolve/` | Admin | Resolve a report. |
| POST | `/admin-api/import/` | Admin | Bulk CSV import with dry-run support. |

### Analytics

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/analytics/track/` | Public | Track an analytics event. Body: `{ event_type, cafe, anonymous_session_id, metadata }`. |

---

## 9. Authentication System

### JWT Flow
1. User calls `POST /auth/login/` → receives `access` (short-lived) and `refresh` (long-lived) tokens.
2. All protected requests include `Authorization: Bearer <access_token>`.
3. On 401, the frontend `api.ts` automatically calls `POST /auth/refresh/` with the stored refresh token.
4. If refresh succeeds, the original request is retried with the new access token.
5. If refresh fails, all tokens and user data are cleared from `localStorage` and the user is effectively logged out.

### Role System
| Role | Access |
|---|---|
| `customer` | Reviews, favourites, profile |
| `business` | All customer access + merchant portal, claim listings, manage menus and promotions |
| `admin` | Full platform access including moderation, claim review, CSV import, audit logs |

`is_business_owner()` also returns `True` for `is_staff` users.
`is_platform_admin()` also returns `True` for `is_superuser` and `is_staff` users.

### Security Notes
- Admin role cannot be self-registered via the API (silently downgraded to `customer`).
- All protected endpoints verify permissions on the backend — the frontend role checks are UI-only.
- User coordinates from the Geolocation API are never persisted to the database.
- Duplicate reviews are blocked at both the serializer validation level and the database `unique_together` constraint.

---

## 10. Business & Monetization

### Claim Workflow
1. Business user submits `POST /business-claims/` with PAN/VAT/permit evidence.
2. Admin reviews at `POST /admin-api/claims/:id/review/` with `decision: "approve"` or `"reject"`.
3. On approval:
   - `BusinessMembership` is created linking the user to the cafe.
   - Cafe `verification_status` is set to `verified` and `last_verified_at` is stamped.
   - Claimant's role is upgraded from `customer` to `business`.
   - An `AuditLog` entry is written.

### Subscription Inquiry Workflow
No live payment gateway is integrated (per Nepal commercial compliance). Instead:
1. Business user calls `POST /subscriptions/inquire/` with `cafe_id`, `plan_id`, and optional `payment_method_intent`.
2. A `Subscription` record is created with `status: pending_payment` and a reference ID: `INQ-{cafe_id}-{plan_code}-{timestamp}`.
3. An `AuditLog` entry records the inquiry details.
4. The CafeKhoj accounts team contacts the business to confirm settlement via eSewa / Khalti / Fonepay / Bank Transfer.

### Promotions
- Promotions with `is_sponsored: true` are rendered with an explicit **"Sponsored Placement"** badge in the UI.
- Promotions go through a `draft → pending_approval → active` lifecycle.
- `click_count` is tracked per promotion.

---

## 11. Admin Tools

### Admin Dashboard (`GET /admin-api/dashboard/`)
Returns:
- `total_cafes`, `published_cafes`, `verified_cafes`
- `pending_claims`, `total_users`
- `published_reviews`, `pending_reviews`, `reported_reviews`
- `active_promotions`, `total_events`

### CSV Bulk Import (`POST /admin-api/import/`)
Accepts either a file upload (`multipart/form-data`) or raw `csv_text` string.

**Required CSV columns:** `name`, `address`, `city`, `latitude`, `longitude`

**Optional columns:** `district`, `price_range`, `phone`, `tagline`, `description`, `is_sample_data`

**Validation rules:**
- `name`, `address`, `city` must be non-empty
- `latitude` must be between -90 and 90
- `longitude` must be between -180 and 180
- `price_range` must be `budget`, `moderate`, or `premium` (defaults to `moderate` if invalid)
- Duplicate detection: flags if a cafe with the same `name` + `city` already exists

**Dry-run mode:** Pass `dry_run: true` to validate all rows and receive a full error report without writing to the database.

**Response fields:**
```json
{
  "dry_run": true,
  "total_rows_processed": 10,
  "valid_rows": 9,
  "records_created": 0,
  "errors": [{ "row": 5, "error": "Missing cafe name." }],
  "summary": "Processed 10 rows: 9 valid, 1 errors. Dry run completed (no changes committed)."
}
```

All live imports are wrapped in `transaction.atomic()` and write an `AuditLog` entry.

### Review Moderation (`POST /admin-api/reviews/:id/moderate/`)
Sets `moderation_status` to `published`, `rejected`, or `flagged`. Triggers `Review.recalculate_cafe_stats()` via the model's `save()` override.

---

## 12. Seed Data & Management Commands

### `python manage.py seed_cafekhoj`

This command replaces all `is_sample_data=True` entries and imports real-time verified cafe data for Jhapa District.

**What it creates:**

| Entity | Count | Details |
|---|---|---|
| Users | 4 | admin, birtamode_roaster, anita_sharma, kiran_thapa |
| Locations | 2 | Birtamode (Muktichowk), Damak (Damak Chowk) |
| Categories | 10 | Date Night, Study Session, Coffee Lovers, etc. |
| Facilities | 8 | Wi-Fi, AC, Parking, Power Sockets, etc. |
| Subscription Plans | 4 | Free, Featured, Premium, Business Plus |
| Cafes | 53 | 23 in Birtamode, 30 in Damak (from CSV) |
| Reviews | 6 | Seeded for featured venues |
| Promotions | 1 | Active 15% off promotion for Third Home Coffee |

**CSV source:** `backend/seed_data/real_cafes_jhapa.csv`

**CSV columns read:** `name`, `city`, `address_or_location`, `public_phone`, `source_url`, `verification_status`

**Coordinate generation:** Realistic offsets are computed algorithmically around known city landmarks (Birtamode: 26.6343, 87.9863 / Damak: 26.6668, 87.7015) since the CSV does not include precise GPS coordinates.

**Category assignment logic (name-based):**
- Contains `bakery`/`bakes`/`crust` → Desserts & Bakery, Friends Meetup
- Contains `book`/`brewed book` → Study Session, Quiet Corners, Coffee Lovers
- Contains `tea`/`chiya` → Budget Friendly, Friends Meetup
- Contains `lounge`/`restaurant`/`burrow`/`red door` → Date Night, Beautiful Interiors, Friends Meetup
- Default → Coffee Lovers, Friends Meetup, Beautiful Interiors

**Price range logic (name-based):**
- `tea`/`chiya`/`adda`/`budget` → `budget`
- `lounge`/`bistro`/`burrow`/`barista` → `premium`
- Everything else → `moderate`

**Default menu items seeded per cafe:**
- Americano / Black Coffee — NPR 120
- Cappuccino (Signature) — NPR 180
- Steam Veg Momo — NPR 160

---

## 13. Automated Test Suite

**Location:** `backend/tests/test_cafekhoj_api.py`

**Run:** `cd backend && python manage.py test tests`

### Test Cases

#### `test_user_registration_and_login`
- Registers a new user via `POST /auth/register/`
- Asserts `HTTP 201` and presence of `access` token and `user` in response
- Logs in with the new credentials
- Asserts `HTTP 200` and presence of `access` token

#### `test_cafe_list_and_filtering`
- Fetches all cafes — asserts at least 1 result
- Filters by `city=Birtamode` — asserts exactly 1 result
- Filters by `category=coffee-lovers` — asserts exactly 1 result

#### `test_nearby_distance_calculation`
- Calls `GET /cafes/nearby/?lat=26.6343&lng=87.9863&radius=5`
- Asserts at least 1 result
- Asserts `distance_km` field is present
- Asserts distance is ≤ 0.1 km (same coordinates)

#### `test_review_submission_and_duplicate_prevention`
- Submits a 5-star review as an authenticated customer
- Asserts `HTTP 201` and correct rating
- Refreshes cafe from DB — asserts `average_rating = 5.0` and `review_count = 1`
- Attempts a second review from the same user on the same cafe
- Asserts `HTTP 400` with duplicate error message

#### `test_favourite_toggle`
- Toggles favourite on — asserts `is_favourited: true`
- Checks `GET /me/favourites/` — asserts 1 item
- Toggles favourite off — asserts `is_favourited: false`

#### `test_business_claim_and_admin_approval`
- Business user submits a claim with evidence reference
- Asserts `HTTP 201`
- Admin approves the claim
- Asserts `HTTP 200` and `status: approved`
- Asserts `BusinessMembership` record exists for the claimant

#### `test_csv_import_validation_and_dry_run`
- Runs a dry-run import — asserts `records_created: 0`, `valid_rows: 1`, cafe not in DB
- Runs a live import — asserts `records_created: 1`, cafe exists in DB
- Runs the same CSV again — asserts 1 error with "already exists" message

---

## 14. Frontend Pages & Components

### Pages

#### `HomePage` (`/`)
- 3D animated coffee hero (Three.js) with functional search form
- "Near Me" button triggers browser Geolocation API
- Popular cafes grid (top 4 from selected city)
- Explore by Mood category grid (10 categories with icons)
- Interactive Leaflet map preview with selected cafe sidebar
- Recently reviewed stream (4 latest reviews)
- Editorial curated guides section (3 static collection cards)
- Cafe owner call-to-action banner

#### `ExplorePage` (`/explore`)
- Full filterable cafe listing with sidebar filters
- Supports all `GET /cafes/` query parameters
- Infinite scroll or pagination

#### `CafeDetailPage` (`/cafes/:slug`)
- Cover hero image with gradient overlay
- Verified badge, price range badge, category chips
- Save (favourite) and Share buttons
- Directions link to Google Maps (tracks `direction_click` event)
- 5-tab navigation: Overview, Digital Menu, Reviews, Photos, Map & Location
- Overview tab: description, facilities grid, signature menu preview, operating hours sidebar, contact sidebar, owner claim banner
- Menu tab: full menu by category with signature/dietary labels and NPR prices
- Reviews tab: `ReviewList` component + "Write a Review" button → `ReviewModal`
- Photos tab: masonry-style photo gallery
- Location tab: full-screen `CafeMap` + Google Maps directions link
- Related cafes grid at the bottom
- Tracks `listing_view` analytics event on load

#### `MapPage` (`/map`)
Full-screen interactive map of all cafes with filter sidebar.

#### `CategoryPage` (`/categories/:category`)
Cafes filtered by a specific category slug.

#### `LocationPage` (`/locations/:city`)
Cafes filtered by city.

#### `CollectionsPage` (`/collections`)
Editorial curated collection guides.

#### `AuthPages` (`/login`, `/register`, `/forgot-password`, `/verify-email`)
Login and registration forms using `AuthContext`.

#### `ProfilePage` (`/profile`)
Customer profile with tabs: Overview, My Reviews, Saved Cafes, Settings.

#### `BusinessDashboardPage` (`/business/dashboard`)
Merchant portal: managed cafes, analytics metrics, recent reviews, promotions, subscriptions.

#### `BusinessPromotionsPage` (`/business/promotions`)
Create and manage promotional campaigns.

#### `BusinessBillingPage` (`/business/billing`)
Subscription plan selection and inquiry submission.

#### `ClaimCafePage` (`/business/claim`)
Business claim submission form with evidence reference field.

#### `AdminDashboardPage` (`/admin`)
Platform admin panel with tabs for cafes, reviews, users, businesses, reports, CSV import.

### Reusable Components

| Component | Location | Description |
|---|---|---|
| `CoffeeHero3D` | `components/3d/` | Three.js procedural ceramic cup with floating beans and mouse parallax. Falls back to static image for reduced-motion/low-spec devices. |
| `CafeCard` | `components/common/` | Cafe listing card with cover image, rating, price badge, facilities, and favourite toggle. |
| `Navbar` | `components/common/` | Top navigation with search trigger, city selector, auth state, and role-based links. |
| `Footer` | `components/common/` | Site footer with links and brand info. |
| `SearchModal` | `components/common/` | Global search overlay using `GET /search/`. Shows cafes, categories, and locations. |
| `StarRating` | `components/common/` | Configurable star display with optional score label and size variants. |
| `Badge` | `components/common/` | Renders `verified`, `sample`, `price`, and custom label badges. |
| `CafeMap` | `components/map/` | Leaflet map with custom coffee-pin markers, popups, and click callbacks. |
| `ReviewList` | `components/reviews/` | Paginated review list with rating distribution, helpful votes, report button, and business response display. |
| `ReviewModal` | `components/reviews/` | Modal form for submitting or editing a review (1–5 star selector + text area). |

---

## 15. Deployment Guide

### Frontend (Vercel / Netlify)
1. Set root directory to `frontend`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variable: `VITE_API_URL=https://api.yourdomain.com/api/v1`

### Backend (Railway / Render / DigitalOcean)
1. Set root directory to `backend`
2. Start command: `gunicorn cafekhoj.wsgi:application --bind 0.0.0.0:$PORT`
3. Run on release: `python manage.py migrate`

**Required environment variables:**

| Variable | Example |
|---|---|
| `SECRET_KEY` | High-entropy random string |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `api.yourdomain.com` |
| `DATABASE_URL` | `postgres://user:password@host:5432/dbname` |
| `CORS_ALLOWED_ORIGINS` | `https://yourdomain.com` |

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv && .\venv\Scripts\activate   # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_cafekhoj
python manage.py runserver 127.0.0.1:8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

The Vite dev server proxies `/api/v1/` to `http://127.0.0.1:8000` via `vite.config.ts`.

---

## 16. Test Accounts

| Role | Username | Password | Email | Access |
|---|---|---|---|---|
| Platform Administrator | `admin` | `AdminPass123!` | `admin@cafekhoj.np` | Full admin dashboard, CSV import, moderation, claim review |
| Business Owner | `birtamode_roaster` | `OwnerPass123!` | `owner@thirdhome.np` | Merchant portal for Third Home Coffee, menu editor, review replies, promotions |
| Customer / Explorer | `anita_sharma` | `UserPass123!` | `anita@gmail.com` | Favourites, review submission, user profile |
| Customer / Student | `kiran_thapa` | `UserPass123!` | `kiran.t@gmail.com` | Favourites, review submission, user profile |

These accounts are created by `python manage.py seed_cafekhoj`.

---

## Quick Reference: Key Business Rules

| Rule | Implementation |
|---|---|
| One review per user per cafe | `unique_together = ('cafe', 'user')` on `Review` model + serializer validation |
| Rating recalculation | `Review.recalculate_cafe_stats()` called on every `save()` and `delete()`, transactional, published-only |
| Admin role cannot be self-registered | `RegisterSerializer.create()` downgrades `admin` role to `customer` |
| Business claim approval upgrades user role | `AdminClaimReviewView` sets `claimant.role = 'business'` on approval |
| Sponsored promotions are explicitly labelled | `Promotion.is_sponsored` renders a visible badge — no silent paid placement |
| No mock payment charges | All subscriptions use an inquiry + manual settlement workflow |
| User coordinates never persisted | Geolocation API used only for distance sorting; coordinates not saved to any model |
| Sample data is transparently labelled | `Cafe.is_sample_data = True` renders a visible warning badge in the UI |
| CSV import is always audited | Every live import writes an `AuditLog` entry with processed/created/error counts |

---

*© 2026 CafeKhoj Nepal. Developed with ❤️ for the cafe culture of Birtamode and Jhapa.*
