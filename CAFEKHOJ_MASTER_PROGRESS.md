# CafeKhoj Master Progress

Updated: 2026-10-30

## Workstreams

| Workstream | Status | Evidence / remaining action |
|---|---|---|
| Preserve existing worktree changes | COMPLETED | Started from branch `main`, HEAD `4878997001735a024c210116e200872811e97c11`; all preexisting edits remain in place. No reset or destructive Git operation was run. |
| Review repository and interim audit | COMPLETED | Reviewed audit, route inventory, working tree, frontend/backend structure, tests, package manifests, and deployment configuration/evidence. |
| CORS configuration | TESTED LOCALLY | Production origin/device headers and OPTIONS regression coverage exist in working tree. Production response headers still need a live authorized request. |
| Public-request stale bearer handling and token refresh persistence | TESTED LOCALLY | Frontend API client omits bearer tokens for public/auth routes and persists rotated refresh tokens. Browser storage/tab behavior is not verified. |
| Password recovery backend and UI | IMPLEMENTED; TESTED LOCALLY | Purpose-specific hashed OTP, expiry, attempt cap, one-time use, resend cooldown, throttling, generic response, password validation, email function, reset API, token invalidation, and UI states implemented. Django tests cover reset and token behavior. Live email delivery and interactive UI are not verified. |
| Remove unused frontend packages | COMPLETED | Removed `canvas-confetti`, `@types/canvas-confetti`, `framer-motion`, `clsx`, and `tailwind-merge`; package manifests/lockfile updated. |
| Backend automated tests | TESTED LOCALLY | `python manage.py test tests`: 36 tests, all passed. |
| Backend configuration and migrations | TESTED LOCALLY | `python manage.py check`: no issues. `python manage.py makemigrations --check --dry-run`: no changes detected. |
| Frontend production build | TESTED LOCALLY | `npm run build` succeeds. Lazy 3D bundle remains 832.61 KB / 224.46 KB gzip and triggers Vite's 500 KB warning. |
| Mobile 3D payload mitigation | IMPLEMENTED; TESTED LOCALLY | Homepage uses a static hero below 768px and when reduced motion is preferred, so those layouts do not render/import the Three.js scene. Build passes; manual viewport verification remains blocked. |
| Frontend browser automation setup | BLOCKED | Playwright install cannot resolve `registry.npmjs.org` (`ENOTFOUND`); no installed browser automation package or Chrome/Edge/Firefox executable was found. No browser results are claimed. |
| Interactive browser and viewport tests | BLOCKED | No browser-control environment available. Production SPA fetch confirms HTML shell only; no JS execution, clicks, responsive screenshots, or console/network inspection. |
| Role-based customer/operator/admin workflows | BLOCKED | No approved non-production role accounts/test environment supplied. Production accounts were not used for mutations. |
| Production API CORS and auth behavior | BLOCKED | Render logs do not expose response headers. Direct API `OPTIONS` and `GET` requests failed DNS resolution (`cafekhoj-api.onrender.com`); no controlled production credentials available for login/protected requests. |
| Production DB read-only integrity checks | BLOCKED | Render SQL integration denied by the database's empty external IP allowlist. No security setting was weakened and no production data was changed. |
| Git commit/push | COMPLETED | Commit `191562de0fb02eab9f58bd6f948de89414d3ab49` pushed to `origin/main`; remote ref verified equal to local HEAD and worktree clean. |
| Deployment | BLOCKED | Do not deploy until browser, production API/CORS, role workflows, and email configuration are verified. Existing Vercel deployment was READY and Render service LIVE in previously observed integration state; neither reflects this working tree. |

## Release blockers to clear

1. Provide an interactive browser environment or allow package registry access and a browser runtime for local Playwright tests.
2. Provide a non-production deployment and dedicated customer, operator, and admin test accounts (never share production passwords in chat).
3. Provide an approved read-only production DB access path that preserves its IP allowlist, or run a reviewed read-only Django inspection from an authorized network.
4. Confirm Render email-provider configuration and perform a controlled reset delivery test.
5. After the above, rerun required checks, inspect any new diff, then deploy only when the release gates pass and verify production.
