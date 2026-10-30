# CafeKhoj Release Notes

**Working-tree release candidate:** 2026-10-30
**Release status:** NOT DEPLOYED — production/browser verification gates remain open.

## Implemented in the working tree

- Replaced the forgot-password placeholder with an email OTP recovery flow and corresponding frontend states. Reset codes are stored using Django's salted password hasher.
- Added reset challenge hashing, expiry, attempt limits, one-time use, resend cooldown, API throttling, generic account-safe requests, password checks, audit logging, device-session deactivation, and old-token invalidation.
- Added backend regression tests for the reset flow and password-version JWT behavior.
- Added production CORS origin and required device headers with local preflight coverage.
- Updated frontend public API calls to omit stale bearer tokens and persist rotated refresh credentials.
- Improved responsive navigation/cards/auth/home presentation. Kept the 3D scene for wider, motion-enabled layouts and added a lightweight static hero illustration for small screens and reduced-motion preferences, so those layouts skip loading Three.js.
- Removed unused frontend package entries: `canvas-confetti`, `@types/canvas-confetti`, `framer-motion`, `clsx`, and `tailwind-merge`.

## Verification

- Django: 36 tests passed; system check passed; migration check reports no changes pending.
- Frontend: production build passed after the mobile-only hero fallback adjustment. The lazy Three.js chunk remains 832.61 KB (224.46 KB gzip) and produces a Vite size warning, though small-screen and reduced-motion layouts no longer load it.
- Git diff whitespace check passed, with line-ending conversion notices.
- Browser, viewport, real email delivery, production CORS/API behavior, and production database integrity are not verified.

## Release decision

Do not deploy this working tree yet. Complete the blocked browser/viewport, non-production role, production API/CORS, and authorized read-only database checks; verify the configured email provider; then review and commit the intended diff before release. No commit or deployment was made.
