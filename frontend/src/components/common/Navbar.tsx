import React, { useState, useEffect } from 'react';
import { Link, useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import {
  Coffee, MapPin, Search, Heart, User as UserIcon, Menu, X,
  ChevronDown, PlusCircle, ShieldCheck, LayoutDashboard, LogOut,
  Sparkles, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';

export const Navbar: React.FC<{ onOpenSearch?: () => void }> = ({ onOpenSearch }) => {
  const { user, logout, isAdmin, isBusiness } = useAuth();
  const { selectedCity, setSelectedCity, locations } = useLocation();
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setLocationDropdownOpen(false);
    setUserDropdownOpen(false);
  }, [routerLocation.pathname]);

  const navLinks = [
    { label: 'Explore', path: '/explore' },
    { label: 'Map', path: '/map' },
    { label: 'Categories', path: '/categories/coffee-lovers' },
    { label: 'Collections', path: '/collections' },
  ];

  const uniqueCities = Array.from(new Set(locations.map(l => l.city))).filter(Boolean);
  if (!uniqueCities.includes('Birtamode')) uniqueCities.unshift('Birtamode');
  if (!uniqueCities.includes('Damak')) uniqueCities.push('Damak');

  const handleMobileNavClick = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? 'glass-panel shadow-warm py-2.5 sm:py-3'
            : 'bg-cream-50/95 backdrop-blur-md border-b border-latte/50 py-3 sm:py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & City Selector */}
          <div className="flex items-center gap-2 sm:gap-6 min-w-0">
            <Link to="/" className="flex items-center gap-2 group focus:outline-none flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-espresso flex items-center justify-center text-caramel shadow-warm group-hover:scale-105 transition-transform">
                <Coffee className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-espresso leading-none">
                  Cafe<span className="text-caramel">Khoj</span>
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-subtext font-medium mt-0.5">
                  Jhapa, Nepal
                </span>
              </div>
            </Link>

            {/* Desktop Location Selector */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-espresso bg-white border border-latte hover:border-caramel/50 transition-colors shadow-xs"
              >
                <MapPin className="w-3.5 h-3.5 text-caramel" />
                <span>{selectedCity}</span>
                <ChevronDown className="w-3 h-3 text-subtext" />
              </button>

              {locationDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-warm-lg border border-latte/80 py-1 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-subtext border-b border-latte/40">
                    Select Launch Market
                  </div>
                  {uniqueCities.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city);
                        setLocationDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-cream-100 flex items-center justify-between transition-colors ${
                        selectedCity === city ? 'text-caramel font-bold bg-cream-50' : 'text-espresso'
                      }`}
                    >
                      <span>{city}</span>
                      {selectedCity === city && <span className="text-caramel">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = routerLocation.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-caramel ${
                    isActive ? 'text-caramel font-semibold' : 'text-espresso-700'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions & User Menu */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => onOpenSearch ? onOpenSearch() : navigate('/explore')}
              className="p-2 sm:px-3 sm:py-2 rounded-full text-espresso hover:text-caramel bg-white border border-latte shadow-xs hover:border-caramel/50 transition-all flex items-center gap-1.5 text-xs font-medium min-h-[38px] min-w-[38px] justify-center"
              title="Search cafes, coffee, foods"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-caramel" />
              <span className="hidden sm:inline text-subtext">Search...</span>
            </button>

            {/* Saved Favourites */}
            <Link
              to="/profile/favourites"
              className="p-2 rounded-full text-espresso hover:text-rose-500 bg-white border border-latte shadow-xs hover:border-rose-200 transition-colors relative min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Saved Cafes"
              aria-label="Saved Cafes"
            >
              <Heart className="w-4 h-4" />
            </Link>

            {/* Business CTA (Desktop) */}
            <Link
              to="/business"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-cream-200/80 text-espresso hover:bg-latte-200 transition-colors border border-latte"
            >
              <PlusCircle className="w-3.5 h-3.5 text-caramel" />
              <span>List Your Cafe</span>
            </Link>

            {/* Desktop User Dropdown */}
            {user ? (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-espresso text-cream hover:bg-espresso-700 transition-colors shadow-warm focus:outline-none min-h-[38px]"
                >
                  <div className="w-6 h-6 rounded-full bg-caramel text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {user.first_name ? user.first_name[0].toUpperCase() : user.username[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold hidden md:inline max-w-[100px] truncate">
                    {user.first_name || user.username}
                  </span>
                  <ChevronDown className="w-3 h-3 text-latte" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-warm-xl border border-latte py-2 z-50">
                    <div className="px-4 py-2 border-b border-latte/50">
                      <p className="text-xs font-bold text-espresso truncate">
                        {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                      </p>
                      <p className="text-[11px] text-subtext truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cream-200 text-espresso-700">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="px-4 py-2 text-xs font-medium text-espresso hover:bg-cream-100 flex items-center gap-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-caramel" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        to="/profile/favourites"
                        className="px-4 py-2 text-xs font-medium text-espresso hover:bg-cream-100 flex items-center gap-2"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>Saved Cafes</span>
                      </Link>

                      {isBusiness && (
                        <Link
                          to="/business/dashboard"
                          className="px-4 py-2 text-xs font-medium text-caramel hover:bg-cream-100 flex items-center gap-2 font-semibold"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>Owner Dashboard</span>
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="px-4 py-2 text-xs font-medium text-sage-600 hover:bg-cream-100 flex items-center gap-2 font-semibold"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Admin Control Panel</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-latte/50 pt-1">
                      <button
                        type="button"
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex px-4 py-2 rounded-full text-xs font-bold bg-espresso text-cream hover:bg-espresso-700 transition-colors shadow-warm items-center justify-center min-h-[38px]"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-espresso hover:bg-cream-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-espresso" /> : <Menu className="w-6 h-6 text-espresso" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu & Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-espresso/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div className="relative z-50 bg-white rounded-t-3xl border-t border-latte shadow-warm-2xl max-h-[85vh] overflow-y-auto p-5 sm:p-6 space-y-5 animate-slide-up">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 rounded-full bg-latte mx-auto -mt-1 mb-2" />

            {/* City Selector */}
            <div className="space-y-2 pb-4 border-b border-latte/50">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-subtext">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-caramel" />
                  <span>Selected City in Jhapa</span>
                </span>
                <span className="text-[10px] text-caramel font-semibold">Active Market</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {uniqueCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setSelectedCity(city);
                    }}
                    className={`min-h-[40px] px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedCity === city
                        ? 'bg-caramel text-white shadow-warm'
                        : 'bg-cream-100 text-espresso hover:bg-cream-200 border border-latte'
                    }`}
                  >
                    <span>{city}</span>
                    {selectedCity === city && <span>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-subtext px-2">Navigation</span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {navLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => handleMobileNavClick(link.path)}
                    className="min-h-[44px] text-left px-3.5 py-2.5 rounded-2xl bg-cream-50 hover:bg-cream-100 text-xs font-bold text-espresso transition-colors flex items-center justify-between"
                  >
                    <span>{link.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-1">
              <Link
                to="/business"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full min-h-[44px] px-4 py-3 rounded-2xl bg-cream-100 hover:bg-cream-200 text-xs font-bold text-espresso border border-latte flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-caramel" />
                  <span>List / Claim Your Cafe</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-caramel bg-white px-2 py-0.5 rounded-full border border-latte">Free</span>
              </Link>
            </div>

            {/* User Account Controls in Mobile Menu */}
            <div className="pt-3 border-t border-latte/50 space-y-3">
              {user ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-cream-50 border border-latte flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-caramel text-white flex items-center justify-center font-bold text-sm">
                        {user.first_name ? user.first_name[0].toUpperCase() : user.username[0].toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-espresso truncate">
                          {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                        </p>
                        <p className="text-[10px] text-subtext truncate max-w-[180px]">{user.email}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cream-200 text-espresso">
                      {user.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    <button
                      onClick={() => handleMobileNavClick('/profile')}
                      className="min-h-[44px] p-2.5 rounded-xl bg-white border border-latte text-espresso flex items-center gap-2 justify-center"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-caramel" />
                      <span>My Profile</span>
                    </button>
                    <button
                      onClick={() => handleMobileNavClick('/profile/favourites')}
                      className="min-h-[44px] p-2.5 rounded-xl bg-white border border-latte text-espresso flex items-center gap-2 justify-center"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>Saved Cafes</span>
                    </button>
                    {isBusiness && (
                      <button
                        onClick={() => handleMobileNavClick('/business/dashboard')}
                        className="col-span-2 min-h-[44px] p-2.5 rounded-xl bg-espresso text-cream flex items-center gap-2 justify-center font-bold"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-caramel" />
                        <span>Owner Dashboard</span>
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleMobileNavClick('/admin')}
                        className="col-span-2 min-h-[44px] p-2.5 rounded-xl bg-sage-600 text-white flex items-center gap-2 justify-center font-bold"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Admin Control Panel</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full min-h-[44px] py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => handleMobileNavClick('/login')}
                    className="w-full min-h-[44px] py-3 rounded-full text-xs font-bold bg-espresso text-cream hover:bg-espresso-700 shadow-warm flex items-center justify-center"
                  >
                    Sign In
                  </button>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <button
                      onClick={() => handleMobileNavClick('/register')}
                      className="min-h-[42px] py-2 px-3 rounded-xl border border-latte bg-cream-50 text-xs font-semibold text-espresso"
                    >
                      Join CafeKhoj
                    </button>
                    <button
                      onClick={() => handleMobileNavClick('/register?role=operator')}
                      className="min-h-[42px] py-2 px-3 rounded-xl border border-caramel/40 bg-caramel/10 text-xs font-semibold text-espresso"
                    >
                      Register Cafe
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
