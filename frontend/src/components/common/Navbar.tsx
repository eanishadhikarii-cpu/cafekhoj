import React, { useState, useEffect } from 'react';
import { Link, useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import {
  Coffee, MapPin, Search, Heart, User as UserIcon, Menu, X,
  ChevronDown, PlusCircle, ShieldCheck, LayoutDashboard, LogOut, Settings
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

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? 'glass-panel shadow-warm py-3'
            : 'bg-cream-50/90 backdrop-blur-sm border-b border-latte/50 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Logo & City Selector */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="flex items-center gap-2 group focus:outline-none">
              <div className="w-10 h-10 rounded-xl bg-espresso flex items-center justify-center text-caramel shadow-warm group-hover:scale-105 transition-transform">
                <Coffee className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-espresso leading-none">
                  Cafe<span className="text-caramel">Khoj</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-subtext font-medium mt-0.5">
                  Jhapa, Nepal
                </span>
              </div>
            </Link>

            {/* Location Selector */}
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
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => onOpenSearch ? onOpenSearch() : navigate('/explore')}
              className="p-2 sm:px-3 sm:py-2 rounded-full text-espresso hover:text-caramel bg-white border border-latte shadow-xs hover:border-caramel/50 transition-all flex items-center gap-2 text-xs font-medium"
              title="Search cafes, coffee, foods"
            >
              <Search className="w-4 h-4 text-caramel" />
              <span className="hidden sm:inline text-subtext">Search...</span>
            </button>

            {/* Saved Favourites */}
            <Link
              to="/profile/favourites"
              className="p-2 rounded-full text-espresso hover:text-rose-500 bg-white border border-latte shadow-xs hover:border-rose-200 transition-colors relative"
              title="Saved Cafes"
            >
              <Heart className="w-4 h-4" />
            </Link>

            {/* Business CTA */}
            <Link
              to="/business"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-cream-200/80 text-espresso hover:bg-latte-200 transition-colors border border-latte"
            >
              <PlusCircle className="w-3.5 h-3.5 text-caramel" />
              <span>List Your Cafe</span>
            </Link>

            {/* User Dropdown or Sign In */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-espresso text-cream hover:bg-espresso-700 transition-colors shadow-warm focus:outline-none"
                >
                  <div className="w-6 h-6 rounded-full bg-caramel text-white flex items-center justify-center text-xs font-bold">
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
                className="px-4 py-2 rounded-full text-xs font-bold bg-espresso text-cream hover:bg-espresso-700 transition-colors shadow-warm"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-espresso hover:bg-cream-200 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[65px] bg-white/95 backdrop-blur-md border-b border-latte shadow-warm-lg p-5 z-40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-latte/50">
            <span className="text-xs font-bold text-subtext uppercase">Active Location</span>
            <div className="flex gap-2">
              {uniqueCities.map(city => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedCity === city ? 'bg-caramel text-white' : 'bg-cream-200 text-espresso'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm font-semibold text-espresso hover:text-caramel py-1"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/business"
              className="text-sm font-semibold text-caramel flex items-center gap-2 py-1"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Your Cafe</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

