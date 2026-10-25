# CafeKhoj (क्याफे खोज) ☕🇳🇵
### Premium 3D Cafe Discovery and Review Platform
*Find Your Vibe. Discover Your Cafe.*

CafeKhoj is a production-oriented, full-stack cafe discovery and community review platform designed for coffee lovers, remote workers, students, and cafe owners. Initially launched for **Birtamode and the wider Jhapa District of Nepal** (extensible nationwide), it empowers users to explore venues based on atmosphere, budget, specialty roasts, high-speed Wi-Fi, and verified customer feedback.

---

## 🎨 Brand Identity & Design Tokens

* **Espresso**: `#241711` (Deep roasted typography, dark panels)
* **Coffee Brown**: `#493126` (Warm secondary backgrounds)
* **Warm Cream**: `#F8F3EA` (Primary editorial canvas background)
* **Latte**: `#E8D8C3` (Borders, card dividers, subtle chips)
* **Caramel**: `#C7834B` (Brand accent, primary CTAs, active highlights)
* **Muted Sage**: `#8A9A78` (Verified merchant and safety badges)
* **Pure White**: `#FFFFFF` (Card surfaces, clean modals)
* **Secondary Text**: `#766A60` (Subtitles, metadata, timestamps)

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 / TypeScript
- **Tooling**: Vite 5
- **Styling**: Tailwind CSS with custom design tokens
- **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei` (with responsive procedural ceramic cup, floating beans, mouse parallax, and accessible static fallback for low-spec/reduced-motion devices)
- **Maps**: Leaflet & OpenStreetMap tiles (custom coffee pin markers, popups, coordinates)
- **Icons**: Lucide React
- **Routing**: React Router v6

### Backend
- **Framework**: Python 3.14 / Django 6.0
- **API**: Django REST Framework (DRF)
- **Authentication**: JWT (JSON Web Tokens via `djangorestframework-simplejwt`) + Django Session Auth
- **Database**: PostgreSQL support via `DATABASE_URL` (with automatic fallback to SQLite for zero-friction local development and CI testing)
- **CORS**: `django-cors-headers`
- **Filtering**: `django-filter`

---

## 🚀 Quick Start & Local Development

### Prerequisites
- Python 3.10+ (Python 3.14 supported)
- Node.js 18+ (Node v24 supported) & npm

---

### Step 1: Backend Setup

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```

2. (Optional) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure `.env` (a pre-configured `.env` is created automatically; customize if connecting to PostgreSQL):
   ```ini
   SECRET_KEY=your-secure-secret-key
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   # Optional: set PostgreSQL database URL (or leave blank to use local SQLite)
   DATABASE_URL=postgres://user:password@localhost:5432/cafekhoj_db
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

5. Run database migrations:
   ```bash
   python manage.py migrate
   ```

6. Seed database with real-time cafe data for Birtamode & Damak, Jhapa:
   ```bash
   python manage.py seed_cafekhoj
   ```
   * Automatically imports 53 real-time cafes across Birtamode (23 venues) and Damak (30 venues).
   * Sample flag `is_sample_data` is set to `False` for real establishments.

7. Start the Django development server:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```
   * The REST API will be available at: `http://127.0.0.1:8000/api/v1/`
   * Django admin portal: `http://127.0.0.1:8000/django-admin/`

---

### Step 2: Frontend Setup

1. Open a second terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 🔑 Pre-Configured Test Accounts

| Role | Username | Password | Email | Access |
|---|---|---|---|---|
| **Platform Administrator** | `admin` | `AdminPass123!` | `admin@cafekhoj.np` | Full Admin Dashboard, CSV import, moderation, claims review |
| **Business Owner** | `birtamode_roaster` | `OwnerPass123!` | `owner@thirdhome.np` | Merchant Portal (Third Home Coffee), Menu Editor, Review Replies, Promotions |
| **Customer / Explorer** | `anita_sharma` | `UserPass123!` | `anita@gmail.com` | Favourites, review submission, user profile |
| **Customer / Student** | `kiran_thapa` | `UserPass123!` | `kiran.t@gmail.com` | Favourites, review submission, user profile |

---

## 🧪 Automated Testing

A comprehensive automated test suite validates the core business logic, including JWT authentication, cafe filtering, nearby distance calculation, single-review duplicate prevention, aggregate rating recomputation, business claim approval, and CSV bulk import validation with dry-run mode.

Run backend tests:
```bash
cd backend
python manage.py test tests
```

Build and type-check frontend:
```bash
cd frontend
npm run build
```

---

## 📡 REST API Endpoints Overview (`/api/v1/`)

### Authentication & Users
- `POST /api/v1/auth/register/` - Create customer or business account
- `POST /api/v1/auth/login/` - Returns JWT access + refresh tokens + user profile
- `POST /api/v1/auth/refresh/` - Refresh expired access token
- `GET /api/v1/auth/me/` - Retrieve authenticated user profile
- `PATCH /api/v1/auth/me/` - Update profile bio, phone, avatar

### Cafes & Discovery
- `GET /api/v1/cafes/` - Query cafes with multi-filters (`city`, `category`, `price`, `min_rating`, `facility`, `search`, `sort`)
- `GET /api/v1/cafes/:slug/` - Detailed cafe profile with hours, verified facilities, and digital menus
- `GET /api/v1/cafes/nearby/?lat=&lng=&radius=` - Great-circle Haversine distance-sorted venues
- `POST /api/v1/cafes/create/` - Create cafe listing
- `PATCH /api/v1/cafes/:id/update/` - Update cafe details (authorized owner/admin only)
- `GET /api/v1/categories/` - List all curated mood/experience categories with cafe counts
- `GET /api/v1/facilities/` - List all facilities (Wi-Fi, AC, Parking, Power Outlets, etc.)
- `GET /api/v1/locations/` - List active cities & neighbourhoods (Birtamode, Damak, etc.)
- `GET /api/v1/search/?q=` - Multi-entity quick search

### Reviews & Favourites
- `GET /api/v1/cafes/:id/reviews/` - Published reviews with rating distribution
- `POST /api/v1/cafes/:id/reviews/` - Submit review (1-5 stars; enforces 1 active review per user/cafe)
- `PATCH /api/v1/reviews/:id/` - Update own review
- `DELETE /api/v1/reviews/:id/` - Delete own review
- `POST /api/v1/reviews/:id/helpful/` - Increment helpful vote
- `POST /api/v1/reviews/:id/report/` - Report inappropriate review for admin moderation
- `POST /api/v1/reviews/:id/respond/` - Post official business reply (merchant/admin only)
- `POST /api/v1/favourites/` - Toggle saved cafe
- `GET /api/v1/me/favourites/` - Current user's saved collection

### Business & Monetization
- `POST /api/v1/business-claims/` - Submit ownership claim with PAN/permit evidence
- `GET /api/v1/business/dashboard/` - Real measured analytics (views, direction clicks, contact clicks, reviews)
- `GET /api/v1/subscription-plans/` - Pricing tiers (Free, Featured NPR 500, Premium NPR 1,000, Business Plus NPR 2,000)
- `POST /api/v1/subscriptions/inquire/` - Record manual payment inquiry (institutional wire / Fonepay / eSewa)
- `GET /api/v1/business/promotions/` - List and publish seasonal offers (explicitly badged if sponsored)

### Administration
- `GET /api/v1/admin-api/dashboard/` - Platform health stats (cafes, users, reviews, claims, reports)
- `POST /api/v1/admin-api/claims/:id/review/` - Approve or reject business claims
- `POST /api/v1/admin-api/reviews/:id/moderate/` - Moderate reviews (`published`, `rejected`, `flagged`)
- `POST /api/v1/admin-api/import/` - Bulk CSV import with coordinate validation, duplicate detection, and dry-run safety

---

## 📥 CSV Bulk Import Specification

Administrators can bulk-import verified cafe datasets. The importer requires the following columns:

```csv
name,address,city,district,latitude,longitude,price_range,phone,tagline,description
Sunset Coffee Bar,Muktichowk Central,Birtamode,Jhapa,26.6340,87.9860,moderate,+977-23-549999,Sunset views,Cozy sunset hangout
```

- **Validation Rules**:
  - `name`, `address`, `city` are required.
  - `latitude` must be between -90 and 90; `longitude` between -180 and 180.
  - `price_range` must be `budget`, `moderate`, or `premium`.
  - Duplicate detection: Flagged if a cafe with identical name and city already exists.
  - Dry-Run Mode: Validates all records and outputs error logs without writing to database.

---

## 🔒 Security & Privacy Implementation

1. **Authentication & Authorization**: Protected endpoints require Bearer JWT authentication. Permissions are verified strictly on the backend.
2. **Review Integrity**: Duplicate reviews by the same user on the same cafe are blocked at the serializer and model constraint levels. Aggregate ratings are recalculated within a transactional block from published reviews only.
3. **No Fabricated Data**: Sample demo entries are explicitly tagged with `is_sample_data=True` and rendered with a visible warning badge.
4. **Transparent Payments**: In strict accordance with Nepal commercial policies, no mock credit card charges are fabricated. Subscriptions follow a verified institutional inquiry & settlement workflow.
5. **Location Privacy**: The browser Geolocation API is requested with explicit permission only for distance sorting. Precise user coordinates are never persisted to database profiles.

---

## 🌐 Production Deployment Guide

### Frontend (e.g. Vercel)
1. Set Root Directory to `frontend`.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Set Environment Variable: `VITE_API_URL=https://api.yourdomain.com/api/v1`

### Backend (e.g. Railway / Render / DigitalOcean)
1. Set Root Directory to `backend`.
2. Start Command: `gunicorn cafekhoj.wsgi:application --bind 0.0.0.0:$PORT`
3. Configure Environment Variables:
   - `SECRET_KEY`: High-entropy random production secret
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: `api.yourdomain.com`
   - `DATABASE_URL`: `postgres://user:password@host:5432/dbname`
   - `CORS_ALLOWED_ORIGINS`: `https://yourdomain.com`
4. Run migrations on release: `python manage.py migrate`

---

## 📄 License & Credits
Developed with ❤️ for the cafe culture of Birtamode and Jhapa, Nepal.
© 2026 CafeKhoj Nepal. All rights reserved.

#   c a f e k h o j  
 