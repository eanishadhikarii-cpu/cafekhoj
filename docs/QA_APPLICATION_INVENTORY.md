# CafeKhoj — QA Application Inventory

**Generated Date:** 2026-10-25  
**Version:** 1.0.0 Production Baseline  

---

## 1. Frontend Routes Inventory

| Route | Component | Access Role | Data Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `HomePage` | Public | `/cafes/`, `/categories/`, `/cafes/:id/reviews/` | Verified Functional |
| `/explore` | `ExplorePage` | Public | `/cafes/`, `/categories/`, `/facilities/` | Verified Functional |
| `/search` | `ExplorePage` (alias) | Public | Global query params forwarded | Verified Functional |
| `/map` | `MapPage` | Public | `/cafes/`, `/categories/`, `/facilities/` | Verified Functional |
| `/cafes/:slug` | `CafeDetailPage` | Public | `/cafes/:slug/`, `/cafes/:id/reviews/`, `/favourites/` | Verified Functional |
| `/categories/:category` | `CategoryPage` | Public | `/categories/`, `/cafes/?category=` | Verified Functional |
| `/locations/:city` | `LocationPage` | Public | `/locations/`, `/cafes/?city=` | Verified Functional |
| `/collections` | `CollectionsPage` | Public | Curated editorial mock collections | Verified Functional |
| `/collections/:slug` | `CollectionsPage` | Public | Curated editorial collection viewer | Verified Functional |
| `/about` | `AboutPage` | Public | Static editorial content | Verified Functional |
| `/contact` | `ContactPage` | Public | Contact inquiry form | Verified Functional |
| `/privacy` | `PrivacyPolicyPage` | Public | Static privacy policies | Verified Functional |
| `/terms` | `TermsPage` | Public | Static terms of service | Verified Functional |
| `/login` | `LoginPage` | Anonymous / Public | `POST /auth/login/` | Verified Functional |
| `/register` | `RegisterPage` | Anonymous / Public | `POST /auth/register/` | Verified Functional |
| `/forgot-password` | `ForgotPasswordPage` | Anonymous / Public | Password reset inquiry | Verified Functional |
| `/verify-email` | `VerifyEmailPage` | Anonymous / Public | Email verification notice | Verified Functional |
| `/profile` | `ProfilePage` | Authenticated | `GET/PATCH /auth/me/`, `/me/reviews/`, `/me/favourites/` | Verified Functional |
| `/profile/reviews` | `ProfilePage` | Authenticated | Tab direct link | Verified Functional |
| `/profile/favourites` | `ProfilePage` | Authenticated | Tab direct link | Verified Functional |
| `/profile/settings` | `ProfilePage` | Authenticated | Tab direct link | Verified Functional |
| `/business` | `BusinessLandingPage`| Public | `/subscription-plans/` | Verified Functional |
| `/business/register` | `ClaimCafePage` | Authenticated | `/cafes/`, `POST /business-claims/` | Verified Functional |
| `/business/claim` | `ClaimCafePage` | Authenticated | Preselected cafe claiming | Verified Functional |
| `/business/dashboard`| `BusinessDashboardPage` | Business / Admin | `GET /business/dashboard/`, `/menu-items/` | Verified Functional |
| `/business/promotions`| `BusinessPromotionsPage`| Business / Admin | `GET/POST /business/promotions/` | Verified Functional |
| `/business/billing` | `BusinessBillingPage` | Business / Admin | `GET /subscription-plans/`, `POST /subscriptions/inquire/` | Verified Functional |
| `/admin` | `AdminDashboardPage` | Admin Only | `/admin-api/dashboard/`, `/admin-api/claims/`, `/admin-api/reports/` | Verified Functional |
| `*` | Catch-all redirect | Public | Redirects to `/` | Verified Functional |

---

## 2. Interactive Elements & Controls Audit

| Category | Component / Page | Interactive Element | Event Trigger / Destination | Verification Result |
| :--- | :--- | :--- | :--- | :--- |
| Navigation | `Navbar` | Brand Logo | Link to `/` | PASS |
| Navigation | `Navbar` | Nav Links | Links to `/explore`, `/map`, `/categories`, `/collections` | PASS |
| Dropdown | `Navbar` | Market Selector | Dropdown toggle for Birtamode & Damak | PASS |
| Modal | `Navbar` | Search Trigger | Opens `SearchModal` (hotkey & button) | PASS |
| Dropdown | `Navbar` | User Avatar Menu | Links to `/profile`, `/business/dashboard`, `/admin`, Logout | PASS |
| Search | `SearchModal` | Query Input | Debounced fetch to `/api/v1/search/?q=` | PASS |
| Discovery | `HomePage` | Hero Search Bar | Navigates to `/explore?search=...` | PASS |
| 3D Canvas | `CoffeeHero3D` | Interactive Cup | Mouse parallax rotation & pointer tilt | PASS |
| Discovery | `ExplorePage` | Filter Buttons | City, Category, Price, Facilities, Min Rating | PASS |
| Discovery | `ExplorePage` | Sort Selector | Highest Rated, Most Reviewed, Newest, Name | PASS |
| Card Action| `CafeCard` | Heart Button | Toggles `POST /api/v1/favourites/` with count update | PASS |
| Card Action| `CafeCard` | Listing Card Click | Navigates to `/cafes/:slug` | PASS |
| Map Pin | `CafeMap` | Marker Click | Pans map & opens interactive preview popup | PASS |
| Detail Tab | `CafeDetailPage` | Overview/Menu/Reviews/Photos | Switches active tab state dynamically | PASS |
| Review Action| `CafeDetailPage` | "Write a Review" Button | Opens `ReviewModal` dialog | PASS |
| Form | `ReviewModal` | Star Rating + Textarea | Submits `POST /api/v1/cafes/:id/reviews/` | PASS |
| Social Action| `ReviewList` | "Helpful" Thumbs-Up | Calls `POST /api/v1/reviews/:id/helpful/` | PASS |
| Moderation | `ReviewList` | "Report" Flag | Opens report dialog; calls `/reviews/:id/report/` | PASS |
| Business Action| `ReviewList` | "Respond" Button | Verified owner posts official reply via `/reviews/:id/respond/` | PASS |
| Profile Form | `ProfilePage` | Bio & Name Inputs | Submits `PATCH /api/v1/auth/me/` | PASS |
| Business Form| `BusinessDashboardPage`| Add Menu Item | Submits `POST /api/v1/menu-items/` with category fallback | PASS (Fixed) |
| Business Action| `BusinessDashboardPage`| Delete Menu Item | Calls `DELETE /api/v1/menu-items/:id/` | PASS |
| Business Form| `BusinessPromotionsPage`| Create Campaign | Submits `POST /api/v1/business/promotions/` | PASS |
| Billing Action| `BusinessBillingPage` | Inquire Plan | Posts to `/api/v1/subscriptions/inquire/` | PASS |
| Admin Action | `AdminDashboardPage` | Approve/Reject Claim | Calls `POST /api/v1/admin-api/claims/:id/review/` | PASS |
| Admin Action | `AdminDashboardPage` | Resolve Report | Calls `POST /api/v1/admin-api/reports/:id/resolve/` | PASS |
| Admin Form | `AdminDashboardPage` | CSV Bulk Importer | Uploads/validates CSV with Dry Run check | PASS |

---

## 3. Backend API Endpoints Inventory

| Method | Endpoint | Auth Class | Permissions | Database Persistence |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register/` | None | `AllowAny` | `core.User` |
| `POST` | `/api/v1/auth/login/` | None | `AllowAny` | Returns JWT tokens |
| `POST` | `/api/v1/auth/refresh/` | None | `AllowAny` | SimpleJWT token refresh |
| `GET` | `/api/v1/auth/me/` | JWT / Session | `IsAuthenticated` | `core.User` |
| `PATCH` | `/api/v1/auth/me/` | JWT / Session | `IsAuthenticated` | `core.User` |
| `GET` | `/api/v1/locations/` | None | `AllowAny` | `core.Location` |
| `POST` | `/api/v1/analytics/track/` | None | `AllowAny` | `core.AnalyticsEvent` |
| `GET` | `/api/v1/cafes/` | None | `AllowAny` | `cafes.Cafe` |
| `GET` | `/api/v1/cafes/:slug/` | None | `AllowAny` | `cafes.Cafe` |
| `GET` | `/api/v1/cafes/nearby/` | None | `AllowAny` | Haversine distance computation |
| `POST` | `/api/v1/cafes/create/` | JWT | `IsAuthenticated` | `cafes.Cafe` |
| `PATCH` | `/api/v1/cafes/:pk/update/` | JWT | Owner / Admin | `cafes.Cafe` |
| `GET` | `/api/v1/categories/` | None | `AllowAny` | `cafes.Category` |
| `GET` | `/api/v1/facilities/` | None | `AllowAny` | `cafes.Facility` |
| `GET` | `/api/v1/menu-items/` | None | `IsAuthenticatedOrReadOnly` | `cafes.MenuItem` |
| `POST` | `/api/v1/menu-items/` | JWT | Owner / Admin | `cafes.MenuItem` |
| `PATCH` | `/api/v1/menu-items/:pk/` | JWT | Owner / Admin | `cafes.MenuItem` |
| `DELETE`| `/api/v1/menu-items/:pk/` | JWT | Owner / Admin | `cafes.MenuItem` |
| `GET` | `/api/v1/search/` | None | `AllowAny` | Multi-table lookup |
| `GET` | `/api/v1/cafes/:id/reviews/`| None | `AllowAny` | `reviews.Review` |
| `POST` | `/api/v1/cafes/:id/reviews/`| JWT | `IsAuthenticated` | `reviews.Review` |
| `POST` | `/api/v1/reviews/:pk/helpful/`| JWT | `IsAuthenticated` | `reviews.Review` |
| `POST` | `/api/v1/reviews/:pk/report/` | JWT | `IsAuthenticated` | `reviews.ReviewReport` |
| `POST` | `/api/v1/reviews/:pk/respond/`| JWT | Owner / Admin | `reviews.ReviewResponse` |
| `POST` | `/api/v1/favourites/` | JWT | `IsAuthenticated` | `reviews.Favourite` |
| `GET` | `/api/v1/me/favourites/` | JWT | `IsAuthenticated` | `reviews.Favourite` |
| `GET` | `/api/v1/me/reviews/` | JWT | `IsAuthenticated` | `reviews.Review` |
| `POST` | `/api/v1/business-claims/` | JWT | `IsAuthenticated` | `business.BusinessClaim` |
| `GET` | `/api/v1/business/dashboard/` | JWT | `IsAuthenticated` | Aggregates views, clicks, reviews |
| `GET` | `/api/v1/business/promotions/`| JWT | `IsAuthenticated` | `business.Promotion` |
| `POST` | `/api/v1/business/promotions/`| JWT | Owner / Admin | `business.Promotion` |
| `GET` | `/api/v1/subscription-plans/` | None | `AllowAny` | `business.SubscriptionPlan` |
| `POST` | `/api/v1/subscriptions/inquire/` | JWT | `IsAuthenticated` | `business.Subscription` + `core.AuditLog` |
| `GET` | `/api/v1/admin-api/dashboard/`| JWT | `IsAdminUser` | Aggregated platform health |
| `POST` | `/api/v1/admin-api/claims/:id/review/` | JWT | `IsAdminUser` | `business.BusinessClaim` + membership |
| `POST` | `/api/v1/admin-api/reviews/:id/moderate/` | JWT | `IsAdminUser` | `reviews.Review` moderation |
| `GET` | `/api/v1/admin-api/reports/` | JWT | `IsAdminUser` | `reviews.ReviewReport` |
| `POST` | `/api/v1/admin-api/reports/:id/resolve/` | JWT | `IsAdminUser` | `reviews.ReviewReport` |
| `POST` | `/api/v1/admin-api/import/` | JWT | `IsAdminUser` | Bulk CSV Parser with Dry Run |

