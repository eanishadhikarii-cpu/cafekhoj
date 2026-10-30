# CafeKhoj Final QA Report

**Audit date:** 2026-10-30
**Status:** BLOCKED for release; local implementation and automated checks are complete for the work possible in this environment.

## What was already working

- The repository has a React/TypeScript/Vite frontend and Django REST backend with existing test coverage and deployment integrations.
- The latest previously observed Vercel deployment was READY, and Render reported the API service LIVE. Those deployments predate this working tree.
- Public/auth requests already had in-progress stale-token handling, token refresh persistence, and CORS configuration changes in the working tree.

## What was broken and changed

- **QA-005 password recovery:** the prior page claimed success without sending a reset message. IMPLEMENTED in the working tree: purpose-specific reset challenges are hashed with Django's salted password hasher, expire after 10 minutes, allow at most five attempts, are one-time, have a 60-second resend cooldown and scoped throttles, and use a generic request response. Passwords are validated; reset audit events are recorded; active device sessions are deactivated. The new UI supports request, code confirmation, password confirmation, loading, success, failure, and resend cooldown. Password-version JWT claims reject old access and refresh tokens after reset while allowing fresh tokens.
- **QA-001 CORS:** production frontend origin and device headers have local preflight regression coverage. Production headers are not verified.
- **QA-002 stale bearer:** public requests omit stored bearer credentials; refresh rotation persistence remains implemented. Real browser storage, multiple-tab, and live API behavior are not verified.
- **Frontend storage:** removed unused `canvas-confetti`, `@types/canvas-confetti`, `framer-motion`, `clsx`, and `tailwind-merge` package entries. No numeric bundle savings are claimed.
- **Responsive/source polish:** existing working-tree updates to navigation, cards, home, auth, location loading, and lazy 3D delivery are retained and build successfully. The homepage now skips the 3D module below 768px and when reduced motion is preferred. Visual improvements are not manually verified.

## Automated checks

| Check | Result |
|---|---|
| `python manage.py test tests` | TESTED LOCALLY — 36 tests passed |
| `python manage.py check` | TESTED LOCALLY — no issues |
| `python manage.py makemigrations --check --dry-run` | TESTED LOCALLY — no model changes missing migrations |
| `npm run build` | TESTED LOCALLY — passed after the mobile fallback change; Vite warns that the lazy Three.js chunk is 832.61 KB (224.46 KB gzip) |
| `git diff --check` | TESTED LOCALLY — passed; Git emitted line-ending conversion notices only |
| Production password reset email | BLOCKED — not sent or verified against the configured provider |

Reset regression coverage verifies the emailed OTP via Django's test outbox, successful password replacement, old access and refresh token rejection, fresh login and `/auth/me/` access, single-use code rejection, and generic handling of unknown email addresses.

## Manual and production verification

- **MANUALLY VERIFIED:** no interactive browser tasks were performed. Previous Vercel fetch results returned HTTP 200 SPA HTML for `/`, `/explore`, `/login`, `/business/dashboard`, and `/admin`; this verifies the route shell only, not the rendered application.
- **Browser and viewport coverage:** BLOCKED. Playwright installation failed because `registry.npmjs.org` could not resolve (`ENOTFOUND`); no browser executable or browser-control tool was available. None of the requested widths/orientations or cross-browser runs are claimed as tested.
- **Production API:** BLOCKED. Render logs showed historical locations responses (including 200 and a 401) and OPTIONS requests, but did not include CORS response headers. Direct `OPTIONS` and `GET` requests from this environment failed DNS resolution for `cafekhoj-api.onrender.com` (`No such host is known`). No controlled live login or authenticated flow was run.
- **Production database:** BLOCKED. The Render SQL integration could not connect because external IP allowlisting is empty. No production records were modified and no network restriction was relaxed.
- **Customer/operator/admin workflows and API authorization:** BLOCKED for live/manual coverage because approved non-production accounts were unavailable. Existing local automated security tests remain partial coverage.
- **Email setup:** actual provider configuration and delivery remain unverified; local regression uses Django's test email outbox.

## Security findings and limitations

- Password reset uses an isolated purpose-specific challenge model rather than account-verification OTPs. Stored code material is salted and hashed; raw OTPs are returned only to the email sender and never in API responses. Existing generic logger messages do not include the OTP.
- Old JWT access and refresh credentials are rejected after a reset using the user's password-version claim. Legacy tokens without a version are rejected once `password_changed_at` is set.
- CORS remains origin-restricted; production response behavior is not known until verified against Render.
- No production data, accounts, or settings were changed.
- Security review is not exhaustive: live object-level authorization, upload, role matrix, CSRF, and deployment-secret checks remain outstanding.

## Git and deployment

- **Current branch/HEAD:** `main` / `4878997001735a024c210116e200872811e97c11` at audit start.
- **Commit hash:** implementation and audit commit `191562de0fb02eab9f58bd6f948de89414d3ab49` was pushed to `origin/main`.
- **Push:** verified; remote `main` points to `191562de0fb02eab9f58bd6f948de89414d3ab49`.
- **Deployment:** not performed; existing deployments predate current working tree.
- **Reason:** release gates remain incomplete; deploying untested UI/API changes would violate the requested release criteria.

## Exact blockers and next actions

1. Provide an interactive browser runtime (or permit package-registry access and provide a browser binary) to run browser and viewport checks.
2. Provide a non-production environment with dedicated customer, operator, and admin accounts to test role workflows safely.
3. Run controlled production OPTIONS/GET/POST/auth requests and record actual headers/statuses once credentials and safe authorization are available.
4. Perform read-only production Django/database checks through an authorized path that respects the existing IP allowlist.
5. Verify Render email-provider configuration and controlled password-reset delivery.
6. After these checks pass, review any new diff, deploy, and retest production.

The code commit and push are verified; production verification and deployment have not occurred.
