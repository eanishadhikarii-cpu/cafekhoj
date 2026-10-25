import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { SearchModal } from './components/common/SearchModal';

// Pages
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { MapPage } from './pages/MapPage';
import { CafeDetailPage } from './pages/CafeDetailPage';
import { CategoryPage } from './pages/CategoryPage';
import { LocationPage } from './pages/LocationPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { AboutPage, ContactPage, PrivacyPolicyPage, TermsPage } from './pages/StaticPages';
import { LoginPage, RegisterPage, ForgotPasswordPage, VerifyEmailPage } from './pages/AuthPages';
import { ProfilePage } from './pages/customer/ProfilePage';
import { BusinessLandingPage } from './pages/business/BusinessLandingPage';
import { ClaimCafePage } from './pages/business/ClaimCafePage';
import { BusinessDashboardPage } from './pages/business/BusinessDashboardPage';
import { BusinessPromotionsPage } from './pages/business/BusinessPromotionsPage';
import { BusinessBillingPage } from './pages/business/BusinessBillingPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

export const App: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-cream-50 text-espresso selection:bg-caramel/20 selection:text-espresso">
      <Navbar onOpenSearch={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/cafes/:slug" element={<CafeDetailPage />} />
          <Route path="/categories/:category" element={<CategoryPage />} />
          <Route path="/locations/:city" element={<LocationPage />} />
          <Route path="/search" element={<ExplorePage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/:slug" element={<CollectionsPage />} />
          
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Customer Routes */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/reviews" element={<ProfilePage />} />
          <Route path="/profile/favourites" element={<ProfilePage />} />
          <Route path="/profile/settings" element={<ProfilePage />} />

          {/* Business Routes */}
          <Route path="/business" element={<BusinessLandingPage />} />
          <Route path="/business/register" element={<ClaimCafePage />} />
          <Route path="/business/claim" element={<ClaimCafePage />} />
          <Route path="/business/dashboard" element={<BusinessDashboardPage />} />
          <Route path="/business/listings" element={<BusinessDashboardPage />} />
          <Route path="/business/listings/:id" element={<BusinessDashboardPage />} />
          <Route path="/business/reviews" element={<BusinessDashboardPage />} />
          <Route path="/business/analytics" element={<BusinessDashboardPage />} />
          <Route path="/business/promotions" element={<BusinessPromotionsPage />} />
          <Route path="/business/billing" element={<BusinessBillingPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/cafes" element={<AdminDashboardPage />} />
          <Route path="/admin/reviews" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminDashboardPage />} />
          <Route path="/admin/businesses" element={<AdminDashboardPage />} />
          <Route path="/admin/categories" element={<AdminDashboardPage />} />
          <Route path="/admin/promotions" element={<AdminDashboardPage />} />
          <Route path="/admin/reports" element={<AdminDashboardPage />} />
          <Route path="/admin/settings" element={<AdminDashboardPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

