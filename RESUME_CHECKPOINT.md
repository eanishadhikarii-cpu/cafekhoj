# CafeKhoj — Production Implementation Checkpoint

* **Last Updated:** 2026-10-29
* **Current Git Commit:** `b603d0c` (Clean working tree on `main`)
* **Target Services:**
  * Frontend: `https://cafekhoj.vercel.app/`
  * Backend: `https://cafekhoj-api.onrender.com/`
  * Database: Supabase PostgreSQL 17 (`ap-south-1`)

---

## 1. Completed Implementation

### Phase 1: Audit & Discovery
* Completed full codebase audit of Django models, DRF views, URL dispatchers, Vite frontend routing, and database configurations.
* Identified and fixed root cause of 404 responses on `GET /` and `GET /api/v1` by implementing dedicated service discovery handlers.
* Fixed IPv6 bracket parsing issue in Supabase pooler connection strings (`@[host]`).

### Phase 2: Authentication & User Control
* **Public Visitors**: Unauthenticated browsing, search, and cafe details without login redirects.
* **Cafe Operators**: Role classification for `Owner`, `Manager`, and `Staff`. Verified email requirement prior to authentication.
* **Platform Administrators**: Enforced strict maximum of **2 platform administrator accounts** via `PlatformAdministrator` model validation. Initial project owner bootstrap command `bootstrap_admin`.
* **OTP Verification**: Cryptographically secure 6-digit OTP stored as salted SHA-256 hashes (`EmailOTP`). 5-minute expiry, max 5 attempts, single-use invalidation, 60-second resend cooldown. Branded HTML email template with plaintext fallback.

### Phase 3: Cafe Management & Onboarding
* Zero fabricated cafes or fake reviews in public listings.
* Dual onboarding flow:
  1. **Claim Existing Cafe**: Evidence submission (PAN/VAT/Ward license) routed to admin for review.
  2. **Register New Cafe**: Interactive cafe submission with name, description, address, contacts, categories, and facilities.
* Status lifecycle: `draft`, `pending_review`, `approved`, `published`, `rejected`, `suspended`.
* Change requests workflow via `CafeChangeRequest`.

### Phase 4: Device Authorization (1-Device Policy)
* Operator accounts restricted to **1 active authorized device session** tracked in `DeviceSession`.
* Second device login attempts blocked with HTTP 403 `device_authorization_required` without token issuance.
* Automatic generation of `DeviceAuthorizationRequest` and `AdminNotification` for administrator review.
* Approving a device deauthorizes the prior device session transactionally.
* Operators can view and deauthorize their own devices from the operator dashboard.

### Phase 5: Administrator Control Panel (`/admin`)
* Real database metrics for cafes, users, claims, and device requests.
* Moderation table with publish, suspend, verify, and Google Places sync actions.
* Device authorization request approval/rejection interface.
* Notification center with real-time alerts and mark-as-read functionality.
* Administrator account management enforcing the maximum 2-admin policy.

### Phase 6: Maps & Google Places Ratings Integration
* Leaflet interactive location picker (`LocationPickerMap`) allowing map click and marker drag to capture precise coordinates (`latitude`, `longitude`).
* Client-side geocoding helper with Nepal bias.
* `google_rating` and `google_user_ratings_total` read-only protection in DRF serializers.
* Graceful fallback displaying "Rating unavailable" when external API is unconfigured.

---

## 2. Files Modified and Created

### Backend Files
* `backend/cafekhoj/settings.py` (Database parser, SMTP, Google Places key, security headers)
* `backend/cafekhoj/urls.py` (Root `/` and `/api/v1` routes)
* `backend/core/models.py` (EmailOTP, DeviceSession, DeviceAuthorizationRequest, PlatformAdministrator, AdminNotification)
* `backend/core/serializers.py` (OTP, Device, Admin, and Notification serializers)
* `backend/core/views.py` (OTP verification, device sessions, admin delegation, notifications)
* `backend/core/urls.py` (API routing)
* `backend/core/email.py` (Branded OTP email generator)
* `backend/core/management/commands/bootstrap_admin.py` (Primary admin bootstrap)
* `backend/cafes/models.py` (Google Places fields, CafeChangeRequest)
* `backend/cafes/serializers.py` (Read-only Google ratings and status protections)
* `backend/cafes/views.py` (Moderation, sync, and listing creation)
* `backend/cafes/urls.py` (Admin moderation and sync endpoints)
* `backend/cafes/google_places.py` (Google Places API integration)
* `backend/business/models.py` (Role choice update)
* `backend/tests/test_cafekhoj_api.py` (Updated registration & login tests)
* `backend/tests/test_auth_and_security.py` (Dedicated production security test suite)
* `backend/.env.example` (Complete environment variable reference)

### Frontend Files
* `frontend/src/types/index.ts` (Types for device sessions, admin notifications, Google Places)
* `frontend/src/services/api.ts` (API methods and automatic `X-Device-Id` header injection)
* `frontend/src/context/AuthContext.tsx` (OTP registration handling and device error propagation)
* `frontend/src/pages/AuthPages.tsx` (OTP verification page, operator registration, device block warning)
* `frontend/src/pages/admin/AdminDashboardPage.tsx` (Full operations panel)
* `frontend/src/pages/business/ClaimCafePage.tsx` (Claim + Register new cafe dual wizard)
* `frontend/src/pages/business/BusinessDashboardPage.tsx` (Device sessions & claims tabs)
* `frontend/src/components/map/LocationPickerMap.tsx` (Leaflet location picker)

### Documentation & Migrations
* `DEPLOYMENT.md` (Operational deployment runbook)
* `backend/business/migrations/0002_alter_businessmembership_role.py`
* `backend/cafes/migrations/0003_cafe_admin_notes_cafe_google_last_synced_at_and_more.py`
* `backend/core/migrations/0002_user_is_suspended_user_operator_relationship_and_more.py`

---

## 3. Database Migration Status
* **Local SQLite Dev Database**: All 3 migrations applied cleanly via `python manage.py migrate`.
* **Supabase Production PostgreSQL**: Ready to apply via Render build command (`python manage.py migrate`) or GitHub Actions workflow `.github/workflows/migrate-production.yml`.

---

## 4. Tests Executed & Actual Results

### Backend Django Test Suite
* **Command**: `python backend/manage.py test tests`
* **Result**: **31/31 tests passed** (Ran 31 tests in 27.383s, 0 failures, 0 errors).
* **Passed Scenarios**:
  * Unauthenticated visitor browsing without login.
  * Root and API v1 endpoints availability.
  * Operator registration and unverified login rejection.
  * OTP generation, validation, and single-use invalidation.
  * Operator 1-device enforcement and secondary device blocking.
  * Platform administrator maximum 2 limit enforcement.
  * Google Places ratings read-only tamper resistance.

### Frontend Production Build
* **Command**: `cd frontend && npm run build`
* **Result**: **Built successfully in 1m 26s with 0 errors**.
* **Output**: Production assets generated in `frontend/dist/`.

---

## 5. Deployment Status
* **Working Branch**: `main`
* **Remote Repository**: `https://github.com/eanishadhikarii-cpu/cafekhoj`
* **Latest Commit**: `d5fd067` pushed to `origin/main`.
* **Render**: Automatic deployment triggers upon push to `main`.
* **Vercel**: Automatic preview/production build triggers upon push to `main`.

---

## 6. Missing Credentials / External Setup
1. **SMTP Mail Credentials**: Live email delivery to external inboxes requires configuring `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` (e.g. Google Workspace or Gmail App Password) in the Render dashboard. Console output is active in `DEBUG=True`.
2. **Google Places API Key**: Live rating sync requires `GOOGLE_PLACES_API_KEY` in Render. Without it, the UI gracefully renders "Rating unavailable".
3. **Primary Admin Bootstrap**: Requires one-time execution of `python manage.py bootstrap_admin` on production.

---

## 7. Exact Next Implementation Step
1. Trigger or verify production deployment on Render and Vercel.
2. Run `python manage.py bootstrap_admin` with your project owner credentials in Render Shell.
3. Test live registration with your email to receive a live verification OTP.

