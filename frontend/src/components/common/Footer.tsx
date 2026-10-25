import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, MapPin, Mail, Phone, Heart, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-espresso text-cream-100 border-t border-coffee-700 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-coffee-700/80">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-caramel text-espresso flex items-center justify-center font-bold">
                <Coffee className="w-5 h-5 text-espresso" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-cream">
                Cafe<span className="text-caramel">Khoj</span>
              </span>
            </Link>
            <p className="text-xs text-latte-200 leading-relaxed max-w-sm">
              Find Your Vibe. Discover Your Cafe. Nepal’s dedicated cafe discovery and community review platform, highlighting specialty brews, study nooks, date-night ambiance, and local artisans across Jhapa District.
            </p>
            <div className="flex items-center gap-2 text-xs text-latte-300">
              <MapPin className="w-3.5 h-3.5 text-caramel" />
              <span>Launch Market: Birtamode & Jhapa, Koshi Province, Nepal</span>
            </div>
          </div>

          {/* Quick Discovery */}
          <div>
            <h4 className="font-serif text-sm font-bold text-cream uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs text-latte-200">
              <li><Link to="/explore" className="hover:text-caramel transition-colors">All Cafes</Link></li>
              <li><Link to="/map" className="hover:text-caramel transition-colors">Interactive Map</Link></li>
              <li><Link to="/categories/coffee-lovers" className="hover:text-caramel transition-colors">Specialty Coffee</Link></li>
              <li><Link to="/categories/study-session" className="hover:text-caramel transition-colors">Study with Wi-Fi</Link></li>
              <li><Link to="/categories/date-night" className="hover:text-caramel transition-colors">Date Night Spots</Link></li>
              <li><Link to="/collections" className="hover:text-caramel transition-colors">Curated Collections</Link></li>
            </ul>
          </div>

          {/* Locations & Guides */}
          <div>
            <h4 className="font-serif text-sm font-bold text-cream uppercase tracking-wider mb-4">
              Locations
            </h4>
            <ul className="space-y-2.5 text-xs text-latte-200">
              <li><Link to="/locations/birtamode" className="hover:text-caramel transition-colors">Cafes in Birtamode</Link></li>
              <li><Link to="/locations/damak" className="hover:text-caramel transition-colors">Cafes in Damak</Link></li>
              <li><Link to="/locations/jhapa" className="hover:text-caramel transition-colors">Jhapa District Guide</Link></li>
              <li><Link to="/collections/study-friendly-birtamode" className="hover:text-caramel transition-colors">Student Friendly Hubs</Link></li>
            </ul>
          </div>

          {/* For Cafe Owners & Trust */}
          <div>
            <h4 className="font-serif text-sm font-bold text-cream uppercase tracking-wider mb-4">
              For Businesses
            </h4>
            <ul className="space-y-2.5 text-xs text-latte-200">
              <li><Link to="/business" className="hover:text-caramel transition-colors">Merchant Portal</Link></li>
              <li><Link to="/business/claim" className="hover:text-caramel transition-colors font-semibold text-caramel">Claim Your Listing</Link></li>
              <li><Link to="/business/billing" className="hover:text-caramel transition-colors">Plans & Pricing</Link></li>
              <li><Link to="/about" className="hover:text-caramel transition-colors">About CafeKhoj</Link></li>
              <li><Link to="/contact" className="hover:text-caramel transition-colors">Contact Support</Link></li>
              <li><Link to="/privacy" className="hover:text-caramel transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-caramel transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits & Integrity Disclaimer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-latte-300">
          <p>
            © {new Date().getFullYear()} CafeKhoj Nepal. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs">
            <Shield className="w-3.5 h-3.5 text-sage-400" />
            <span>Honest, independent reviews. Demo records are clearly transparent.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

