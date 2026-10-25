import React, { useState } from 'react';
import { Coffee, ShieldCheck, Mail, MapPin, Phone, CheckCircle } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-3 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-caramel">Our Story & Mission</span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-espresso">
          About CafeKhoj
        </h1>
        <p className="text-sm sm:text-base text-subtext max-w-2xl mx-auto leading-relaxed">
          Connecting coffee enthusiasts, remote workers, students, and cafe owners across Birtamode, Jhapa, and Eastern Nepal.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-latte shadow-warm space-y-6 text-xs sm:text-sm text-espresso leading-relaxed">
        <h2 className="font-serif text-2xl font-bold text-espresso">
          Find Your Vibe. Discover Your Cafe.
        </h2>
        <p>
          Until now, finding reliable information about local cafes in Jhapa—whether they have fast Wi-Fi for coding, quiet corners for reading, or romantic settings for an evening date—required scrolling through disconnected social media pages with out-of-date hours.
        </p>
        <p>
          CafeKhoj was built to bridge this gap. We provide a single, beautifully designed platform featuring verified coordinates, genuine customer reviews, digital menu prices in Nepali Rupees (NPR), and rich interactive filters.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-4 rounded-2xl bg-cream-50 border border-latte text-center space-y-1">
            <h4 className="font-serif text-base font-bold text-espresso">Authentic Data</h4>
            <p className="text-xs text-subtext">No fake reviews. Demo entries are transparently labeled.</p>
          </div>
          <div className="p-4 rounded-2xl bg-cream-50 border border-latte text-center space-y-1">
            <h4 className="font-serif text-base font-bold text-espresso">Owner Empowerment</h4>
            <p className="text-xs text-subtext">Local businesses claim and update their listings directly.</p>
          </div>
          <div className="p-4 rounded-2xl bg-cream-50 border border-latte text-center space-y-1">
            <h4 className="font-serif text-base font-bold text-espresso">Built for Nepal</h4>
            <p className="text-xs text-subtext">Optimized for local connectivity, devices, and community habits.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-caramel">We’d love to hear from you</span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-espresso">
          Contact CafeKhoj
        </h1>
        <p className="text-sm text-subtext max-w-md mx-auto">
          Have feedback, need assistance claiming your business, or wish to report outdated information? Reach out below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Info Column */}
        <div className="md:col-span-5 bg-espresso text-cream p-8 rounded-3xl space-y-6 shadow-warm">
          <h3 className="font-serif text-xl font-bold text-cream">Regional Office</h3>
          <div className="space-y-4 text-xs text-latte-200">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-caramel flex-shrink-0 mt-0.5" />
              <span>Muktichowk, Birtamode-4, Jhapa District, Koshi Province, Nepal</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-caramel flex-shrink-0" />
              <span>support@cafekhoj.np</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-caramel flex-shrink-0" />
              <span>+977-23-540112 / +977-9801234567</span>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="md:col-span-7 bg-white p-8 rounded-3xl border border-latte shadow-warm">
          {submitted ? (
            <div className="py-10 text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-sage-600 mx-auto" />
              <h3 className="font-serif text-xl font-bold text-espresso">Message Received</h3>
              <p className="text-xs text-subtext">Thank you. Our Jhapa support team will respond to your inquiry shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Your Name</label>
                <input required type="text" className="w-full text-xs p-3 rounded-xl border border-latte focus:outline-none focus:border-caramel bg-cream-50/50" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Email Address</label>
                <input required type="email" className="w-full text-xs p-3 rounded-xl border border-latte focus:outline-none focus:border-caramel bg-cream-50/50" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Subject</label>
                <input required type="text" className="w-full text-xs p-3 rounded-xl border border-latte focus:outline-none focus:border-caramel bg-cream-50/50" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Message</label>
                <textarea required rows={4} className="w-full text-xs p-3 rounded-xl border border-latte focus:outline-none focus:border-caramel bg-cream-50/50 resize-none" />
              </div>
              <button type="submit" className="w-full py-3 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 transition-colors shadow-warm">
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-espresso">
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">Privacy Policy</h1>
      <div className="bg-white rounded-3xl p-8 border border-latte shadow-warm space-y-4 text-xs sm:text-sm text-subtext leading-relaxed">
        <p className="text-espresso font-semibold">Effective Date: October 2026</p>
        <p>CafeKhoj ("we", "our") respects your personal privacy. This Privacy Policy details how we collect, use, and protect information across our platform in compliance with prevailing Nepal IT principles.</p>
        <h3 className="font-serif text-base font-bold text-espresso pt-2">1. Location Data</h3>
        <p>We only request geolocation with explicit browser permission. Your coordinates are used locally to calculate real-world distances to cafes and are never sold or permanently logged to personal profiles without consent.</p>
        <h3 className="font-serif text-base font-bold text-espresso pt-2">2. User Account Data</h3>
        <p>When you register, we store your username, hashed password, and email. Passwords are encrypted using industry-standard hashing algorithms (PBKDF2/SHA256). We never store raw passwords.</p>
        <h3 className="font-serif text-base font-bold text-espresso pt-2">3. Reviews & Community Contributions</h3>
        <p>Reviews submitted are published publicly under your chosen display name. You may edit or delete your review at any time from your customer profile.</p>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-espresso">
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">Terms of Service</h1>
      <div className="bg-white rounded-3xl p-8 border border-latte shadow-warm space-y-4 text-xs sm:text-sm text-subtext leading-relaxed">
        <p className="text-espresso font-semibold">Last Updated: October 2026</p>
        <p>By using CafeKhoj, you agree to these Terms. Please read them carefully.</p>
        <h3 className="font-serif text-base font-bold text-espresso pt-2">1. Review Integrity</h3>
        <p>Users must submit honest feedback based on personal visits. Defamatory content, spam, automated submissions, or competitor tampering is prohibited and subject to moderation or account suspension.</p>
        <h3 className="font-serif text-base font-bold text-espresso pt-2">2. Business Claims</h3>
        <p>Only authorized owners or legal representatives may claim a business listing. Claims are verified by platform administrators using official registration references (PAN/VAT/Ward municipality permit).</p>
      </div>
    </div>
  );
};

