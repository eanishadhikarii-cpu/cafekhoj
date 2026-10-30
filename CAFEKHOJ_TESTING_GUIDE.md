# CafeKhoj Testing Guide

Updated: 2026-10-30

## Local automated checks

Run backend checks from `backend/`:

```powershell
python manage.py test tests
python manage.py check
python manage.py makemigrations --check --dry-run
```

Run the frontend production build from `frontend/`:

```powershell
npm run build
```

Current observed results: 36 Django tests pass; Django checks pass; migration check has no missing migrations; Vite build passes and warns about the 832.61 KB lazy 3D chunk.

## Password recovery regression coverage

`backend/tests/test_cafekhoj_api.py` covers:

- Generic accepted response for an unknown email and no email sent.
- Reset request and one code delivered to Django's test outbox.
- Successful OTP confirmation and password replacement.
- Rejection of a previously issued access token and refresh token.
- Rejection of the old password, success with the new password, and acceptance of the fresh access token on `/auth/me/`.
- Rejection of a reused OTP.

The local test email outbox does not verify Render's configured email service or delivery to a real mailbox.

## Browser/E2E and viewport coverage

Browser tests are currently **BLOCKED**. Playwright could not be installed because the package registry host failed DNS resolution, and this environment did not expose a browser executable or interactive browser-control tool. No browser or viewport pass is claimed.

Once registry and browser access are available, add/run Playwright against local frontend and backend test services. Use a disposable database and test-only email backend. Do not run destructive end-to-end tests against production.

Required viewport widths from the audit prompt: 320, 360, 375, 390, 414, 430, 600, 768, 820, 1024, 1280, and 1440 pixels, in portrait and landscape where applicable. Inspect homepage, browse/search/filter, cafe detail/map, auth/OTP/password recovery, operator/admin pages, forms/tables/modals, and footer for overflow, clipping, keyboard usability, and focus visibility.

## Safe role workflow test data

Use only a non-production test environment with dedicated accounts for:

- Customer: registration/login, profile, reviews/favourites, protected-route denial for operator/admin features.
- Operator: registration/OTP/login, own-cafe dashboard/editing, claims, notifications, and denial when accessing another operator's cafe.
- Administrator: moderation, account/claim/device/notification/audit functions and rejection of unauthenticated or non-admin requests.

Never share production passwords in chat. Never create fake customer/cafe data in the production database.

## Production verification still required

Use an authorized safe test account and record the actual HTTP status and response headers for:

- `OPTIONS`, `GET`, and `POST` to the API with `Origin: https://cafekhoj.vercel.app`.
- `GET /api/v1/locations/` with and without an expired stored bearer token.
- Login, refresh rotation, expired/invalid refresh, logout, and protected `/auth/me/` requests.
- Controlled password-reset email delivery and completion.

Production database checks must run read-only through an approved path that preserves the current IP allowlist. Record migration state, expected tables/relations, reference data, duplicate/invalid rows, and relevant constraints without mutating records. Current integration access is blocked by the empty external IP allowlist.

Current network note: direct production API `OPTIONS` and `GET` attempts from this environment failed DNS resolution for `cafekhoj-api.onrender.com` (`No such host is known`). Render logs do not include the CORS response headers needed as a substitute.
