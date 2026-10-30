# CafeKhoj QA Audit

Audit started 2026-10-30. Statuses distinguish source-level/local evidence from actual production interaction. Existing user changes in the working tree were preserved.

## Current environment and evidence

- Vercel production `/`, `/explore`, `/login`, `/business/dashboard`, and `/admin` returned HTTP 200 with the SPA HTML shell through the connected Vercel fetch integration. This confirms hosting and nested-route fallback only; JavaScript was not executed and these pages were not manually interacted with.
- Render service `cafekhoj-api` is reported live; the Render Postgres instance is reported available. Its SQL query tool is blocked because external connections are disallowed by the database IP allowlist.
- Historical Render logs show `GET /api/v1/locations/` responses of 200 with both 2-byte and 400-byte bodies, and a 401 on 2026-10-27. Login and locations preflight requests were recorded on 2026-10-30. Logs do not expose CORS response headers.
- Local `python manage.py test tests` passed **36 tests** after the current changes. `python manage.py check` and `python manage.py makemigrations --check --dry-run` pass. Local `npm run build` passes; the lazy Three.js component is emitted as a separate 832.61 KB (224.46 KB gzip) chunk. The build still reports the large lazy chunk warning.
- Removed unused frontend dependencies `canvas-confetti`, `@types/canvas-confetti`, `framer-motion`, `clsx`, and `tailwind-merge`; npm removed 8 package entries in total. Frontend dependency list and lockfile were updated. No runtime bundle-size change is claimed from those packages without a before/after bundle comparison.
- The 3D hero remains available on wider, motion-enabled layouts, but the homepage now renders a lightweight static illustration below 768px and when reduced motion is preferred. This avoids importing the Three.js scene chunk on those layouts. The 3D chunk itself is still large and requires further optimization for desktop.
- No browser automation/browser-control tool is available in this environment. Production interaction, console/network inspection, viewport testing, and cross-browser testing are therefore BLOCKED.

## Frontend route inventory

| Route | Page/component | Audit status |
|---|---|---|
| `/` | HomePage | SPA shell HTTP 200; UI NOT TESTED |
| `/explore` | ExplorePage | SPA shell HTTP 200; UI NOT TESTED |
| `/map` | MapPage | NOT TESTED |
| `/cafes/:slug` | CafeDetailPage | NOT TESTED |
| `/categories/:category` | CategoryPage | NOT TESTED |
| `/locations/:city` | LocationPage | NOT TESTED |
| `/search` | ExplorePage | NOT TESTED |
| `/collections`, `/collections/:slug` | CollectionsPage | NOT TESTED |
| `/about`, `/contact`, `/privacy`, `/terms` | StaticPages | NOT TESTED |
| `/login` | LoginPage | SPA shell HTTP 200; UI NOT TESTED |
| `/register` | RegisterPage | NOT TESTED |
| `/forgot-password` | ForgotPasswordPage | NOT TESTED |
| `/verify-email` | VerifyEmailPage | NOT TESTED |
| `/profile`, `/profile/reviews`, `/profile/favourites`, `/profile/settings` | ProfilePage | NOT TESTED; requires account |
| `/business` | BusinessLandingPage | NOT TESTED |
| `/business/register`, `/business/claim` | ClaimCafePage | NOT TESTED |
| `/business/dashboard`, `/business/listings`, `/business/listings/:id`, `/business/reviews`, `/business/analytics` | BusinessDashboardPage | Shell HTTP 200 for dashboard; authenticated workflows NOT TESTED |
| `/business/promotions` | BusinessPromotionsPage | NOT TESTED; requires operator account |
| `/business/billing` | BusinessBillingPage | NOT TESTED |
| `/admin`, `/admin/cafes`, `/admin/reviews`, `/admin/users`, `/admin/businesses`, `/admin/categories`, `/admin/promotions`, `/admin/reports`, `/admin/settings` | AdminDashboardPage | Shell HTTP 200 for `/admin`; authenticated workflows NOT TESTED |
| `*` | Navigate to `/` | NOT TESTED |

## Backend endpoint inventory

All paths below are prefixed by `/api/v1/` unless marked otherwise. Permission labels are based on current source configuration; runtime behavior is NOT considered passed until exercised against the deployed service.

| Endpoint | Intended methods / access | Audit status |
|---|---|---|
| `/health/` | GET, public | NOT TESTED live |
| `/auth/register/` | POST, public | Local test coverage; production flow NOT TESTED |
| `/auth/verify-otp/` | POST, public | Local test coverage; real email flow NOT TESTED |
| `/auth/resend-otp/` | POST, public | NOT TESTED live |
| `/auth/password-reset/`, `/auth/password-reset/confirm/` | POST, public, throttled | TESTED LOCALLY; email delivery and live flow NOT TESTED |
| `/auth/login/` | POST, public | Local valid/invalid login tests; production credentials unavailable |
| `/auth/refresh/` | POST with refresh token | Local refresh test; expired-token browser flow NOT TESTED |
| `/auth/me/` | GET/PATCH, authenticated | Local suite coverage partial; NOT TESTED live |
| `/auth/devices/`, `/auth/devices/:id/deauthorize/` | GET/POST, operator-authenticated | Local security coverage partial; NOT TESTED live |
| `/admin-api/devices/`, `/admin-api/devices/:id/review/` | GET/POST, admin | Local security coverage partial; NOT TESTED live |
| `/admin-api/notifications/`, `/admin-api/notifications/:id/read/`, `/admin-api/notifications/read-all/` | GET/POST, admin | NOT TESTED live |
| `/admin-api/administrators/`, `/admin-api/administrators/delegate/` | GET/POST, admin | Local suite coverage partial; NOT TESTED live |
| `/locations/` | GET, public | Local response-shape/public test; live logs include 200 and historical 401 |
| `/analytics/track/` | POST, public | NOT TESTED live |
| `/audit-logs/` | GET, authenticated/admin permission per view | NOT TESTED live |
| `/cafes/`, `/cafes/nearby/`, `/cafes/:slug/` | GET, public browsing | Local API test coverage partial; NOT TESTED live |
| `/cafes/create/`, `/cafes/:id/update/` | POST/PATCH, authenticated/role checks | Local suite coverage partial; NOT TESTED live |
| `/categories/`, `/facilities/`, `/search/` | GET, public | NOT TESTED live |
| `/menu-items/`, `/menu-items/:id/` | GET/POST/PATCH/DELETE with role/object checks | Local suite coverage partial; NOT TESTED live |
| `/cafe-change-requests/`, `/cafe-change-requests/:id/review/` | GET/POST with role checks | NOT TESTED live |
| `/admin-api/cafes/`, `/admin-api/cafes/:id/review/`, `/admin-api/cafes/:id/sync-google/` | GET/POST, admin | NOT TESTED live |
| `/cafes/:id/reviews/`, `/reviews/:id/`, `/reviews/:id/helpful/`, `/reviews/:id/report/`, `/reviews/:id/respond/` | GET/POST/DELETE with auth and ownership checks | Local suite coverage partial; NOT TESTED live |
| `/favourites/`, `/me/favourites/`, `/me/reviews/` | POST/GET, authenticated | NOT TESTED live |
| `/business-claims/`, `/business/dashboard/`, `/business/promotions/`, `/subscriptions/inquire/` | GET/POST, operator/role checks | NOT TESTED live |
| `/subscription-plans/` | GET, public | NOT TESTED live |
| `/admin-api/dashboard/`, `/admin-api/claims/:id/review/`, `/admin-api/reviews/:id/moderate/`, `/admin-api/reports/`, `/admin-api/reports/:id/resolve/`, `/admin-api/import/` | Admin-only | Local suite coverage partial; NOT TESTED live |

Other Django routes: `/`, `/healthz/`, `/health/`, `/django-admin/`, and `/api/v1/` are service/admin roots outside the API prefix.

## Issues and fixes

### QA-001 — Production CORS may block frontend API requests

- **Page/feature:** Production login, locations, and other frontend API calls.
- **Reproduction evidence:** Frontend API client sends custom device headers. The base committed settings did not include the production Vercel origin or those custom headers. Render logs show OPTIONS requests; response headers were not available for inspection.
- **Expected:** Browser preflight permits the actual request from the production frontend.
- **Actual:** Production CORS response headers could not be verified; production requests remain BLOCKED for manual confirmation.
- **Severity:** HIGH.
- **Root cause:** Source configuration omitted the production origin/device-header allowances.
- **Files affected:** `backend/cafekhoj/settings.py`, `backend/tests/test_cafekhoj_api.py`.
- **Fix:** Current working tree adds the origin/header configuration and a preflight regression test.
- **Retest:** Local CORS preflight test passed as part of the 34-test Django suite. Production retest BLOCKED; changes are not deployed.

### QA-002 — Stale bearer token could block public login/locations calls

- **Page/feature:** Login and visitor location loading.
- **Reproduction evidence:** The frontend attached saved bearer tokens to every request. DRF JWT authentication can reject an invalid/expired token before an `AllowAny` view. Render logs include a historical locations 401.
- **Expected:** Public calls work regardless of stale client auth state.
- **Actual:** Historical 401 observed for locations; no live request with a controlled stale token was attempted.
- **Severity:** HIGH.
- **Root cause:** Authorization header was sent on public auth/location requests.
- **Files affected:** `frontend/src/services/api.ts`.
- **Fix:** Public auth endpoints, health, and locations omit the bearer token; rotated refresh tokens are persisted.
- **Retest:** Backend public-location/login tests passed. Frontend browser retest BLOCKED.

### QA-003 — Production data count could not be independently inspected

- **Page/feature:** Locations/database.
- **Reproduction evidence:** Render reports the database available; historical location API responses show both an empty array and non-empty JSON. Direct read-only SQL was refused due the database's empty external IP allowlist.
- **Expected:** Read-only table and row-count verification.
- **Actual:** SQL inspection unavailable from hosted integration.
- **Severity:** MEDIUM.
- **Root cause:** External query source is not allowlisted; no production data was changed.
- **Files affected:** None.
- **Fix:** No production data change attempted.
- **Retest:** BLOCKED pending an approved read-only database access path.

### QA-004 — Manual interactive and viewport audit unavailable

- **Page/feature:** All routes, roles, browser console/network, and 12 target widths/orientations.
- **Reproduction evidence:** No browser-control or automation tool is exposed in this environment. Vercel fetch returns the HTML shell only and cannot click, scroll, inspect computed layout, or capture browser console/network events.
- **Expected:** Actual interactive browser coverage across routes and viewports.
- **Actual:** NOT TESTED.
- **Severity:** HIGH for release confidence.
- **Root cause:** Browser-control capability unavailable; no test credentials supplied for customer/operator/admin workflows.
- **Files affected:** None.
- **Fix:** None; deployment held to avoid releasing unverified visual changes.
- **Retest:** BLOCKED.

### QA-005 — Forgot-password form reported success without a reset workflow

- **Page/feature:** `/forgot-password`.
- **Reproduction:** Source inspection shows the form submit handler only sets local `submitted` state; no password-reset API route or frontend request exists. The confirmation claims recovery instructions were dispatched.
- **Expected:** A reset request sends a secure one-time code/link, supports confirmation with a new password, and permits login with the new password.
- **Actual before fix:** No email or reset token was issued; the UI presented a false success message.
- **Severity:** HIGH.
- **Root cause:** The frontend form is a placeholder with no backend endpoint.
- **Files affected:** `frontend/src/pages/AuthPages.tsx`; backend route/serializer/email flow absent.
- **Fix:** IMPLEMENTED in the working tree. Added a purpose-bound password-reset challenge stored with Django's salted password hasher, 10-minute expiry, five-attempt limit, one-time use, per-account resend cooldown, generic request response, scoped API throttles, password validation, reset email, challenge invalidation, audit log entry, device-session deactivation, and frontend request/confirm/success/error/cooldown states. Added password-version JWT claims so pre-reset access and refresh tokens are rejected while a new login works immediately.
- **Retest:** TESTED LOCALLY by backend API regression test, including code extraction from Django's test email outbox, password change, rejection of old access and refresh tokens, new-password login, acceptance of the new access token, and code-reuse rejection. Unknown-email response tested. Frontend production build passes. Live email-provider delivery and interactive browser flow are BLOCKED / NOT TESTED.

## Current release gate

Local frontend build and Django tests pass. This audit remains BLOCKED for release: interactive browser/viewport tests, role-based workflows, production CORS headers, and production database integrity checks remain unverified. Do not treat local checks as production verification.
