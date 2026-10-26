# CafeKhoj — Complete Production Deployment Guide

This guide details the deployment architecture, configuration steps, and operational procedures for **CafeKhoj**.

* **Repository:** `https://github.com/eanishadhikarii-cpu/cafekhoj`
* **Frontend:** React + TypeScript + Vite (Hosted on **Vercel**)
* **Backend:** Django 6.0 + Django REST Framework + Gunicorn + WhiteNoise (Hosted on **Render**)
* **Database:** Managed PostgreSQL (Hosted on **Supabase** or **Render**)

---

## 1. System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
└──────────────┬──────────────────────────────▲───────────────┘
               │ HTTPS Requests               │
               ▼                              │
┌──────────────────────────────┐              │
│    Vercel Edge (Frontend)    │              │
│  - React 18 SPA              │              │
│  - Leaflet / Three.js Canvas │              │
│  - vercel.json rewrite       │              │
└──────────────┬───────────────┘              │
               │ REST API Calls               │
               ▼                              │
┌─────────────────────────────────────────────┴───────────────┐
│              Render Web Service (Backend)                   │
│  - Gunicorn WSGI Server (port assigned by Render)           │
│  - WhiteNoise Static Files                                  │
│  - CORS / CSRF Validation                                   │
│  - SimpleJWT Auth & Rate Limiting                           │
│  - Health Checks (/healthz/, /health/, /api/v1/health/)     │
└──────────────┬──────────────────────────────────────────────┘
               │ SQL Queries (Internal Network, Port 5432)
               ▼
┌─────────────────────────────────────────────────────────────┐
│          Render PostgreSQL Managed Database                 │
│  - cafekhoj-db                                              │
│  - SSL Required (External) / Internal Secure Peering        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Required Environment Variables

### 2.1 Backend (Render Web Service: `cafekhoj-api`)

| Variable Name | Required | Example / Placeholder | Description |
| :--- | :--- | :--- | :--- |
| `SECRET_KEY` | **Yes** | `<GENERATE_RANDOM_50_CHAR_KEY>` | Django cryptographic secret key. App will refuse to start if default dev key is used. |
| `DEBUG` | **Yes** | `False` | Disables debug mode and Django debug traceback pages in production. |
| `ALLOWED_HOSTS` | **Yes** | `cafekhoj-api.onrender.com` | Comma-separated list of allowed backend hostnames. |
| `DATABASE_URL` | **Yes** | `postgres://<user>:<password>@<internal_host>:5432/<dbname>` | Render Internal PostgreSQL connection string. App automatically parses URL and applies SSL options. |
| `CORS_ALLOWED_ORIGINS` | **Yes** | `https://cafekhoj.vercel.app` | Comma-separated list of allowed frontend origins. |
| `CSRF_TRUSTED_ORIGINS` | **Yes** | `https://cafekhoj-api.onrender.com` | Backend origin for secure Django Admin access. |
| `SECURE_SSL_REDIRECT` | **Yes** | `True` | Forces all HTTP traffic to HTTPS. |
| `SESSION_COOKIE_SECURE`| **Yes** | `True` | Ensures session cookies are transmitted over HTTPS only. |
| `CSRF_COOKIE_SECURE` | **Yes** | `True` | Ensures CSRF cookies are transmitted over HTTPS only. |
| `SECURE_HSTS_SECONDS` | **Yes** | `31536000` | Enables HTTP Strict Transport Security (HSTS) for 1 year. |
| `PYTHON_VERSION` | Optional | `3.12.8` | Pins Python runtime version on Render. |

### 2.2 Frontend (Vercel Project)

| Variable Name | Required | Value / Placeholder | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | **Yes** | `https://cafekhoj-api.onrender.com/api/v1` | Full base URL of the deployed Django API v1. |
| `VITE_APP_NAME` | Optional | `CafeKhoj` | Platform branding title. |
| `VITE_DEFAULT_CITY` | Optional | `Birtamode` | Default selected city for discovery. |

---

## 3. Local Development Instructions

### 3.1 Backend Setup
1. Open PowerShell and navigate to the backend directory:
   ```powershell
   cd "C:\Users\maley\cafe khoj\backend"
   ```
2. Activate virtual environment:
   ```powershell
   ..\.venv\Scripts\Activate.ps1
   ```
3. Copy environment template:
   ```powershell
   Copy-Item .env.example .env
   ```
4. Run migrations and start server:
   ```powershell
   python manage.py migrate
   python manage.py runserver
   ```
   Backend will be accessible at `http://127.0.0.1:8000`.

### 3.2 Frontend Setup
1. In a separate terminal:
   ```powershell
   cd "C:\Users\maley\cafe khoj\frontend"
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start Vite development server:
   ```powershell
   npm run dev
   ```
   Frontend will be accessible at `http://localhost:5173`. Requests to `/api` are proxied to `http://127.0.0.1:8000`.

---

## 4. Render Backend Setup (`cafekhoj-api`)

* **Dashboard URL:** `https://dashboard.render.com/web/srv-dbf2fh8ae00c73ehur1g`
* **Live URL:** `https://cafekhoj-api.onrender.com`

### 4.1 Service Settings
* **Root Directory:** `backend`
* **Runtime:** `Python 3`
* **Build Command:**
  ```bash
  pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
  ```
* **Start Command:**
  ```bash
  gunicorn cafekhoj.wsgi:application
  ```
* **Health Check Path:**
  ```text
  /healthz/
  ```
  *(Alias `/api/v1/health/` and `/health/` are also active. Returns HTTP 200 with database health status).*

### 4.2 Database Configuration (Supabase & Render PostgreSQL)

CafeKhoj supports both **Supabase PostgreSQL** and **Render PostgreSQL**. The Django backend automatically detects the provider, enables SSL (`sslmode=require`), and configures connection pooling parameters.

#### 4.2.1 Connecting Supabase PostgreSQL (Recommended)
1. In your **Supabase Dashboard**:
   * Navigate to **Project Settings** $\rightarrow$ **Database**.
   * Scroll down to **Connection parameters** / **Connection string**.
   * Under **URI**, select **Connection Pooler**:
     * **Mode:** **Session** (Port `5432` - recommended for Django migrations + web queries)
     * *Or* **Transaction** (Port `6543` - backend automatically detects port `6543`, sets `DISABLE_SERVER_SIDE_CURSORS = True` and `CONN_MAX_AGE = 0`).
2. Copy the Connection string URI:
   ```text
   postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
   *(Note: Remember to replace `[YOUR-PASSWORD]` with your actual Supabase database password).*
3. In Render $\rightarrow$ `cafekhoj-api` $\rightarrow$ **Environment**:
   * Set `DATABASE_URL` = `<PASTE_SUPABASE_URI>`
4. Click **Save Changes**. Render will automatically redeploy the backend and run `python manage.py migrate` against the Supabase database.

#### 4.2.2 Connecting Render PostgreSQL (Fallback / Alternate)
1. Open Render database dashboard: `https://dashboard.render.com/d/dpg-dbf2esgae00c73ehsrj0-a`.
2. Locate the **Connections** block and copy the **Internal Database URL** (format: `postgres://cafekhoj_db_user:<password>@dpg-dbf2esgae00c73ehsrj0-a/cafekhoj_db`).
3. In `cafekhoj-api` settings $\rightarrow$ **Environment**, set:
   * `DATABASE_URL` = `<PASTE_INTERNAL_DATABASE_URL>`

> [!WARNING]
> Do NOT type `${{cafekhoj-db.DATABASE_URL}}` into the Render Web Dashboard. Render's dashboard treats `${{...}}` as literal text. You must paste the actual `postgres://...` string.

#### 4.2.3 Database Guardrails & Safety
* **No SQLite in Production:** In production (`DEBUG=False`), Django refuses to start if `DATABASE_URL` is missing or invalid. During asset compilation (`collectstatic`), an ephemeral in-memory SQLite database compiles static assets safely.
* **Automatic SSL Enforcement:** When connecting to `*.supabase.co`, `*.supabase.com`, or `*.render.com`, Django automatically injects `sslmode=require`.

### 4.3 Database Seeding & Administrator Creation

#### Option A: GitHub Actions (Recommended — No Shell required)
A secure manual workflow is provided at `.github/workflows/seed-production.yml`:
1. In GitHub repo $\rightarrow$ **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**:
   * Add repository secret `DATABASE_URL` with your Supabase connection string.
2. Go to the **Actions** tab $\rightarrow$ **Seed Production Database** $\rightarrow$ **Run workflow**.
3. Enter `SEED_CAFEKHOJ` in the confirmation input to execute.

#### Option B: Render Web Shell
In Render's web **Shell** tab:
```bash
python manage.py createsuperuser
python manage.py seed_cafekhoj
```

### 4.4 Rollback Procedure
If you ever need to roll back from Supabase to Render PostgreSQL:
1. Copy the Render Internal Database URL from `cafekhoj-db`.
2. Update `DATABASE_URL` in Render `cafekhoj-api` environment variables.
3. Save changes. Render redeploys and connects back to Render PostgreSQL immediately. Render DB data and schema are preserved.

---

## 5. Vercel Frontend Setup

1. Open [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** $\rightarrow$ **Project**.
2. Connect your GitHub repository `https://github.com/eanishadhikarii-cpu/cafekhoj`.
3. In **Build & Development Settings**:
   * **Framework Preset:** `Vite`
   * **Root Directory:** `frontend`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. In **Environment Variables**:
   * `VITE_API_URL` = `https://cafekhoj-api.onrender.com/api/v1`
5. Click **Deploy**.
6. Note your live URL (e.g. `https://cafekhoj-xxxx.vercel.app` or custom domain `https://cafekhoj.vercel.app`).

### 5.1 Single-Page Application (SPA) Routing
`frontend/vercel.json` contains:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
This routes direct URLs like `/explore`, `/map`, `/cafes/himalayan-java-birtamode` directly to `/index.html`, eliminating 404 errors on browser page reloads.

---

## 6. CORS Handshake Configuration

After Vercel provides your frontend domain:
1. Return to Render $\rightarrow$ `cafekhoj-api` $\rightarrow$ **Environment**.
2. Add or update:
   ```text
   CORS_ALLOWED_ORIGINS=https://cafekhoj.vercel.app,https://<your-vercel-domain>.vercel.app
   ```
3. Save changes. Render will automatically redeploy the backend with the new CORS configuration.

---

## 7. Deployment & Redeployment Instructions

* **Automatic Deployments:** Render and Vercel automatically trigger new deployments whenever changes are pushed to branch `main` on GitHub:
  ```powershell
  git add .
  git commit -m "fix/feat: update description"
  git push origin main
  ```
* **Frontend Redeployment Notice:** Vite bakes `VITE_API_URL` into the JavaScript bundle at build time. If you change `VITE_API_URL` in the Vercel dashboard, you **must** trigger a redeploy (**Redeploy without cache**) for the new URL to take effect.

---

## 8. Troubleshooting & Diagnostics

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **CORS error in browser console** | Frontend origin missing from backend CORS list | Update `CORS_ALLOWED_ORIGINS` in Render dashboard with exact protocol and domain. Do not include trailing slashes. |
| **HTTP 500 on database queries** | Invalid or missing `DATABASE_URL` | Verify the Internal Database URL from Render database dashboard. Ensure `psycopg2-binary` is installed. |
| **HTTP 400 Bad Request on API requests** | Hostname missing from `ALLOWED_HOSTS` | Add backend domain to `ALLOWED_HOSTS` or verify `RENDER_EXTERNAL_HOSTNAME`. |
| **Page reload returns 404 on Vercel** | Missing SPA rewrite rule | Ensure `frontend/vercel.json` exists with `source: "/(.*)"` to `/index.html`. |
| **Static files / Django Admin CSS missing** | Static files not collected | Ensure `python manage.py collectstatic --noinput` is in the Render Build Command. |
| **Health check failing** | Service not listening or DB disconnected | Verify `/healthz/` returns HTTP 200. Check Render application logs in dashboard. |

---

## 9. Security Precautions

1. **Zero Secret Exposure:** Never commit `.env` files, production database URLs, or API keys to GitHub.
2. **Key Rotation:** Generate high-entropy 50+ character random keys for `SECRET_KEY`.
3. **Database Guardrail:** SQLite is strictly prevented in production mode (`DEBUG=False`), ensuring data is never accidentally written to temporary container storage.
4. **HTTPS Enforcement:** `SECURE_SSL_REDIRECT=True` and `SECURE_HSTS_SECONDS=31536000` ensure all web and API traffic is encrypted.

