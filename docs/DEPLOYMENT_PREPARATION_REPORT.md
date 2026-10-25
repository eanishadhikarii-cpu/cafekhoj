# CafeKhoj — Staging & Production Deployment Preparation Report

**Document Version:** 1.0.0 Production Baseline  
**Evaluation Date:** 2026-10-25  
**DevOps Engineer / Specialist Evaluation**  
**Deployment Target:** Frontend -> Vercel | Backend -> Render | Database -> Managed PostgreSQL (Render)  

---

## 1. Verified Project Structure

The project was inspected and verified at root `C:\Users\maley\cafe khoj`:

```
cafe khoj/
├── .gitignore                     [PASS] Configured for Python, Node, Vite, SQLite, & .env
├── DOCUMENTATION.md               [PASS] Project architecture documentation
├── README.md                      [PASS] Overview and local setup guide
├── audit_tree.py                  [PASS] Project inspection script
├── replace_cafe.py                [PASS] Branding consistency utility
├── backend/                       [PASS] Django 6.0.4 application root
│   ├── .env.example               [PASS] Parameterized template (no credentials)
│   ├── manage.py                  [PASS] Django CLI entrypoint
│   ├── requirements.txt           [PASS] Pinned runtime dependencies
│   ├── requirements-dev.txt       [PASS] Local development packages
│   ├── cafekhoj/                  [PASS] Project module (settings, urls, wsgi, asgi)
│   ├── core/                      [PASS] Users, locations, analytics, audit logs
│   ├── cafes/                     [PASS] Cafes, categories, facilities, menu items
│   ├── reviews/                   [PASS] Reviews, ratings, favorites, reports
│   ├── business/                  [PASS] Claims, promotions, subscription plans
│   ├── seed_data/                 [PASS] Birtamode & Damak cafe seed records
│   └── tests/                     [PASS] Automated DRF test suite (14 test cases)
├── frontend/                      [PASS] React 18 + Vite SPA root
│   ├── .env.example               [PASS] Parameterized template
│   ├── index.html                 [PASS] HTML shell and meta tags
│   ├── package.json               [PASS] React, Leaflet, Three.js, Tailwind dependencies
│   ├── tsconfig.json              [PASS] Strict TypeScript configuration
│   ├── vite.config.ts             [PASS] Manual chunk splitting configuration
│   ├── vercel.json                [PASS] Single Page Application (SPA) rewrite rules
│   ├── tailwind.config.js         [PASS] Tailwind design system tokens
│   └── src/                       [PASS] Components, pages, hooks, services, context
└── docs/                          [PASS] QA and DevOps documentation
    ├── QA_APPLICATION_INVENTORY.md   [PASS] 28 routes, 39 endpoints, 24 UI elements
    ├── QA_FULL_AUDIT_REPORT.md       [PASS] Full testing, defect repairs & audit
    └── DEPLOYMENT_PREPARATION_REPORT.md [PASS] This document
```

---

## 2. Git & Secret-Safety Status

| Check Item | Status | Verified Details |
| :--- | :--- | :--- |
| **Git Repository Initialization** | **PASS** | Initialized at project root `C:\Users\maley\cafe khoj\.git`. |
| **`.env` Exclusion** | **PASS** | Root `.gitignore` includes `.env` and `**/.env`. `git status --ignored` confirms `backend/.env` and `frontend/.env` are ignored. |
| **Local Database Exclusion** | **PASS** | `backend/db.sqlite3` and `*.sqlite3` are strictly ignored. |
| **Virtual Environment Exclusion** | **PASS** | `.venv/` and `venv/` are strictly ignored. |
| **Node Modules & Build Output** | **PASS** | `frontend/node_modules/` and `frontend/dist/` are strictly ignored. |
| **Cache Files Exclusion** | **PASS** | `__pycache__/`, `*.pyc`, `.pytest_cache/`, and `*.log` are strictly ignored. |
| **Secret Scanning in Code** | **PASS** | No hardcoded API keys, JWT secrets, passwords, or production database credentials exist in tracked source code. |
| **Staging & Commit Status** | **PASS** | Staged files: `0`. No commits or remote repository interactions were made, strictly honoring user safety boundaries. |

---

## 3. Backend Readiness

| Subsystem / Setting | Status | Verification & Evidence |
| :--- | :--- | :--- |
| **WSGI Entrypoint** | **PASS** | `backend/cafekhoj/wsgi.py` exposes `application = get_wsgi_application()`. Compatible with Gunicorn. |
| **Dependencies** | **PASS** | `backend/requirements.txt` contains: `Django>=5.0,<6.1`, `djangorestframework`, `djangorestframework-simplejwt`, `django-cors-headers`, `django-filter`, `psycopg2-binary>=2.9.9`, `python-dotenv`, `Pillow`, `gunicorn>=21.2.0`, `whitenoise>=6.7.0`. |
| **`DEBUG` Default Safety** | **PASS** | `DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1', 't')`. Defaults to `False` if variable is absent or empty. |
| **Secret Key Guardrail** | **PASS** | Verified with automated test: raises `RuntimeError` immediately upon startup if `DEBUG=False` and the default development key is left unchanged. |
| **Allowed Hosts** | **PASS** | `ALLOWED_HOSTS` dynamically parsed from comma-separated environment variable; defaults to `localhost,127.0.0.1,testserver`. |
| **CORS Configuration** | **PASS** | `CORS_ALLOW_ALL_ORIGINS = DEBUG`. In production (`DEBUG=False`), origins are strictly restricted to `CORS_ALLOWED_ORIGINS` environment variable. |
| **CSRF Configuration** | **PASS** | `CSRF_TRUSTED_ORIGINS` dynamically parsed from environment variable for secure Django Admin access over HTTPS. |
| **Static Files (WhiteNoise)** | **PASS** | `WhiteNoiseMiddleware` inserted after `SecurityMiddleware`. Static storage configured. Local `collectstatic --dry-run` successfully staged 157 static files. |
| **Automated Test Suite** | **PASS** | `python manage.py test tests`: 14 of 14 tests **PASSED** (100% pass rate in 17.8s). |
| **Django System Checks** | **PASS** | `python manage.py check`: `0 issues (0 silenced)`. |
| **Django Production Security Check** | **PASS** | `python manage.py check --deploy` with simulated production environment variables: `0 issues (0 silenced)`. |

---

## 4. Frontend Readiness

| Subsystem / Setting | Status | Verification & Evidence |
| :--- | :--- | :--- |
| **TypeScript Compilation** | **PASS** | `tsc` runs cleanly with zero type errors. |
| **Vite Production Bundling** | **PASS** | `vite build` completed cleanly in 8.05s. |
| **Code Splitting Optimization** | **PASS** | Manual chunks defined in `vite.config.ts`: `three-vendor` (Three.js/Fiber), `map-vendor` (Leaflet), `react-vendor` (React core). |
| **Client-Side SPA Routing** | **PASS** | `frontend/vercel.json` contains rewrite rule `source: "/(.*)"` -> `destination: "/index.html"`, preventing 404 errors on direct navigation or refresh. |
| **Production API Base** | **PASS** | `frontend/src/services/api.ts` references `import.meta.env.VITE_API_URL || '/api/v1'`. |
| **Environment Variable Binding** | **PASS** | Documented in `frontend/.env.example`. Requires build-time injection on Vercel. |

---

## 5. Database Readiness

| Component | Status | Verification & Evidence |
| :--- | :--- | :--- |
| **Migration Consistency** | **PASS** | `python manage.py makemigrations --check --dry-run`: `No changes detected`. All models in sync with migrations. |
| **Applied Migrations** | **PASS** | All migrations applied across `core`, `cafes`, `reviews`, `business`, `auth`, `admin`, and `sessions`. |
| **Database Engine Switching** | **PASS** | Dynamic: SQLite used when `DATABASE_URL` is empty; PostgreSQL (`psycopg2`) enabled automatically when `DATABASE_URL` starts with `postgres://` or `postgresql://`. |
| **PostgreSQL Credentials Handling** | **PASS** | `urllib.parse.unquote` implemented for username and password to prevent connection failures caused by percent-encoded special characters. |
| **Isolation of Local Data** | **PASS** | Local SQLite database is strictly excluded from version control. |

---

## 6. Required Environment Variables (Names Only)

### Backend (Render Web Service)
* `SECRET_KEY` *(Required: 50+ character random string)*
* `DEBUG` *(Required: set to `False`)*
* `ALLOWED_HOSTS` *(Required: comma-separated hostnames, e.g. `your-backend.onrender.com`)*
* `DATABASE_URL` *(Required: Internal PostgreSQL connection string from Render)*
* `CORS_ALLOWED_ORIGINS` *(Required: comma-separated frontend URLs, e.g. `https://your-app.vercel.app`)*
* `CSRF_TRUSTED_ORIGINS` *(Required: comma-separated backend and frontend URLs, e.g. `https://your-backend.onrender.com`)*
* `SECURE_SSL_REDIRECT` *(Recommended: `True`)*
* `SESSION_COOKIE_SECURE` *(Recommended: `True`)*
* `CSRF_COOKIE_SECURE` *(Recommended: `True`)*
* `SECURE_HSTS_SECONDS` *(Recommended: `31536000`)*
* `SECURE_HSTS_INCLUDE_SUBDOMAINS` *(Recommended: `True`)*
* `SECURE_HSTS_PRELOAD` *(Optional: `True`)*
* `PYTHON_VERSION` *(Optional: `3.12.8`)*

### Frontend (Vercel Project)
* `VITE_API_URL` *(Required: full backend API base URL with `/api/v1` path, e.g. `https://your-backend.onrender.com/api/v1`)*
* `VITE_APP_NAME` *(Optional: defaults to `CafeKhoj`)*
* `VITE_DEFAULT_CITY` *(Optional: defaults to `Birtamode`)*

---

## 7. Remaining Blockers & Pre-Deployment Actions

1. **User Approval Required for Git Commit & Remote Setup:**
   * Git is initialized locally. Staging files, committing, creating a GitHub repository, and pushing code requires explicit user approval.
2. **External Cloud Accounts (User Action):**
   * Account creation and login on [render.com](https://render.com) and [vercel.com](https://vercel.com).
3. **Database Provisioning (Render):**
   * Creation of a free or standard PostgreSQL instance on Render.
4. **Seed Data Ingestion (Post-Deployment):**
   * After running migrations against the fresh PostgreSQL database, the initial Jhapa café data should be imported using the Django seed command or CSV importer.

---

## 8. Render Configuration (Backend)

* **Service Type:** Web Service
* **Repository:** GitHub repository for CafeKhoj
* **Root Directory:** `backend`
* **Runtime:** Python 3
* **Build Command:**
  ```bash
  pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
  ```
* **Start Command:**
  ```bash
  gunicorn cafekhoj.wsgi:application
  ```
* **Health Check Path:**
  ```
  /api/v1/locations/
  ```
  *(Returns HTTP 200 without requiring authentication)*
* **Auto-Deploy:** Yes (on push to `main` or `master`)

---

## 9. Vercel Configuration (Frontend)

* **Framework Preset:** Vite
* **Root Directory:** `frontend`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Install Command:** `npm install`
* **SPA Routing:** Pre-configured via `frontend/vercel.json` (rewrites all paths to `/index.html`)
* **Environment Variable:** Set `VITE_API_URL` to `https://<your-render-service>.onrender.com/api/v1`
* **Redeployment Rule:** Any update to `VITE_API_URL` requires a redeployment ("Redeploy without cache") because Vite statically replaces variables at build time.

---

## 10. Exact Manual Deployment Steps

### Step 1: Initial Commit & GitHub Push (Upon User Approval)
1. In PowerShell at project root:
   ```powershell
   git add .
   git commit -m "feat: production ready cafekhoj staging release"
   ```
2. Create an empty repository on GitHub named `cafekhoj`.
3. Add remote and push:
   ```powershell
   git remote add origin https://github.com/<your-username>/cafekhoj.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Provision PostgreSQL Database on Render
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** -> **PostgreSQL**.
3. Set Name: `cafekhoj-db`.
4. Select Region: Singapore (`ap-southeast-1`) or Frankfurt (closest latency to Nepal).
5. Choose Free or Starter plan.
6. Click **Create Database**.
7. Once created, copy the **Internal Database URL** (e.g. `postgres://user:password@dpg-...-a/cafekhoj_db`).

### Step 3: Deploy Backend Web Service on Render
1. In Render dashboard, click **New +** -> **Web Service**.
2. Connect your `cafekhoj` GitHub repository.
3. Configure settings:
   * **Name:** `cafekhoj-api`
   * **Root Directory:** `backend`
   * **Runtime:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   * **Start Command:** `gunicorn cafekhoj.wsgi:application`
4. In the **Environment Variables** section, add:
   * `SECRET_KEY`: *(Generate via `python -c "import secrets; print(secrets.token_urlsafe(50))"`)*
   * `DEBUG`: `False`
   * `DATABASE_URL`: *(Paste Internal Database URL from Step 2)*
   * `ALLOWED_HOSTS`: `cafekhoj-api.onrender.com`
   * `CORS_ALLOWED_ORIGINS`: `https://cafekhoj.vercel.app` *(update with your actual Vercel domain)*
   * `CSRF_TRUSTED_ORIGINS`: `https://cafekhoj-api.onrender.com`
   * `SECURE_SSL_REDIRECT`: `True`
   * `SESSION_COOKIE_SECURE`: `True`
   * `CSRF_COOKIE_SECURE`: `True`
   * `SECURE_HSTS_SECONDS`: `31536000`
5. Click **Create Web Service** and wait for deployment logs to complete.

### Step 4: Seed Database & Create Superuser on Render
1. Open your Render Web Service dashboard and go to the **Shell** tab.
2. Run database migrations verification:
   ```bash
   python manage.py showmigrations
   ```
3. Load initial seed data (if using custom command):
   ```bash
   python manage.py seed_cafes
   ```
4. Create an administrator account:
   ```bash
   python manage.py createsuperuser
   ```

### Step 5: Deploy Frontend on Vercel
1. Log in to [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
2. Import the `cafekhoj` repository from GitHub.
3. In Project Settings:
   * **Framework Preset:** `Vite`
   * **Root Directory:** Click "Edit" and choose `frontend`.
4. In **Environment Variables**:
   * Key: `VITE_API_URL`
   * Value: `https://cafekhoj-api.onrender.com/api/v1`
5. Click **Deploy**.
6. Note the generated Vercel domain (e.g. `https://cafekhoj-xxxx.vercel.app`).

### Step 6: Final CORS Handshake
1. Return to the Render Web Service settings for `cafekhoj-api`.
2. Update `CORS_ALLOWED_ORIGINS` to include the exact Vercel URL:
   ```
   https://cafekhoj-xxxx.vercel.app,https://cafekhoj.vercel.app
   ```
3. Render will automatically redeploy the service with the updated CORS rule.

---

## 11. Post-Deployment Smoke Tests

| Phase | Test Action | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| **Backend Health** | `GET https://cafekhoj-api.onrender.com/api/v1/locations/` | HTTP 200 with JSON list of locations (Birtamode, Damak) | **NOT TESTED** (Awaiting Deploy) |
| **Admin Panel** | Navigate to `https://cafekhoj-api.onrender.com/django-admin/` | Renders styled Django Admin login with valid CSRF token | **NOT TESTED** (Awaiting Deploy) |
| **Frontend Homepage** | Navigate to `https://cafekhoj.vercel.app/` | Hero section, 3D coffee canvas, and trending cafes render | **NOT TESTED** (Awaiting Deploy) |
| **Direct Navigation** | Navigate directly to `https://cafekhoj.vercel.app/explore` | Page loads without 404 (handled by `vercel.json` rewrite) | **NOT TESTED** (Awaiting Deploy) |
| **CORS Validation** | Open Browser DevTools Network tab on Vercel app | API calls succeed with `Access-Control-Allow-Origin` matching frontend | **NOT TESTED** (Awaiting Deploy) |
| **Interactive Map** | Navigate to `https://cafekhoj.vercel.app/map` | Leaflet tiles render centered on Jhapa, markers clickable | **NOT TESTED** (Awaiting Deploy) |
| **Authentication Flow** | Register or log in with test account on frontend | JWT tokens stored; user avatar appears in navbar | **NOT TESTED** (Awaiting Deploy) |

