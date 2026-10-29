import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck, Search, CheckCircle, AlertCircle, Coffee, Loader2,
  PlusCircle, MapPin, Building, Phone, Mail, Globe, Image, Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { Cafe, Category, Facility } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { LocationPickerMap } from '../../components/map/LocationPickerMap';

export const ClaimCafePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedCafeId = searchParams.get('cafe_id');
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'claim';
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeMode, setActiveMode] = useState<'claim' | 'register'>(initialMode);

  // Claim State
  const [searchQuery, setSearchQuery] = useState('');
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [role, setRole] = useState('Owner / Founder');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [evidence, setEvidence] = useState('');

  // Register New Cafe State
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Birtamode');
  const [cafePhone, setCafePhone] = useState(user?.phone || '');
  const [cafeEmail, setCafeEmail] = useState(user?.email || '');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [priceRange, setPriceRange] = useState<'budget' | 'moderate' | 'premium'>('moderate');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [latitude, setLatitude] = useState(26.6343);
  const [longitude, setLongitude] = useState(87.9863);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<number[]>([]);

  // Metadata
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [availableFacilities, setAvailableFacilities] = useState<Facility[]>([]);

  // Workflow State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successType, setSuccessType] = useState<'claim' | 'register'>('claim');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/business/claim');
      return;
    }

    if (preselectedCafeId) {
      api.getCafes().then((res) => {
        const list = res.results || res;
        const match = list.find((c: Cafe) => c.id === Number(preselectedCafeId));
        if (match) setSelectedCafe(match);
      }).catch(console.error);
    }

    // Load categories and facilities for registration
    api.getCategories().then(setAvailableCategories).catch(console.error);
    api.getFacilities().then(setAvailableFacilities).catch(console.error);
  }, [user, preselectedCafeId]);

  const handleSearchCafes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await api.getCafes({ search: searchQuery.trim() });
      setCafes(res.results || res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafe) {
      setErrorMsg('Please select a cafe to claim.');
      return;
    }
    if (!evidence.trim()) {
      setErrorMsg('Please provide proof of business authorization.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await api.submitClaim({
        cafe: selectedCafe.id,
        business_role: role,
        contact_phone: phone,
        contact_email: email,
        evidence_reference: evidence.trim(),
      });
      setSuccessType('claim');
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitNewCafe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Cafe name is required.');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('Cafe street address is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      // Find or default location for city
      const locations = await api.getLocations().catch(() => []);
      const matchedLoc = locations.find((l: any) => l.city.toLowerCase() === city.toLowerCase()) || locations[0];

      await api.createCafe({
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        address: address.trim(),
        location: matchedLoc?.id,
        latitude,
        longitude,
        phone: cafePhone.trim(),
        email: cafeEmail.trim(),
        website: website.trim(),
        social_instagram: instagram.trim(),
        social_facebook: facebook.trim(),
        price_range: priceRange,
        cover_image_url: coverImageUrl.trim(),
        google_place_id: googlePlaceId.trim() || null,
        category_ids: selectedCategoryIds,
        facility_ids: selectedFacilityIds,
      });

      setSuccessType('register');
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register cafe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleFacility = (id: number) => {
    setSelectedFacilityIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Page Title */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-caramel">Merchant Onboarding</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
          Cafe Operator Portal
        </h1>
        <p className="text-xs sm:text-sm text-subtext max-w-lg mx-auto">
          Claim an existing cafe or register a new coffee space in Jhapa, Nepal to manage your listing, menu, and customer presence.
        </p>
      </div>

      {/* Onboarding Mode Selector */}
      {!isSuccess && (
        <div className="flex justify-center">
          <div className="bg-white p-1.5 rounded-2xl border border-latte shadow-warm inline-flex gap-2">
            <button
              type="button"
              onClick={() => { setActiveMode('claim'); setErrorMsg(null); }}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeMode === 'claim'
                  ? 'bg-espresso text-cream shadow-warm'
                  : 'text-subtext hover:text-espresso'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-caramel" />
              <span>Claim Existing Listing</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveMode('register'); setErrorMsg(null); }}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeMode === 'register'
                  ? 'bg-caramel text-white shadow-warm'
                  : 'text-subtext hover:text-espresso'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register New Cafe</span>
            </button>
          </div>
        </div>
      )}

      {isSuccess ? (
        <div className="bg-white rounded-3xl p-10 border border-latte shadow-warm text-center space-y-4">
          <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-espresso">
            {successType === 'claim' ? 'Ownership Claim Submitted' : 'Cafe Listing Submitted for Review'}
          </h2>
          <p className="text-xs sm:text-sm text-subtext max-w-md mx-auto leading-relaxed">
            {successType === 'claim' ? (
              <>
                Your claim for <strong className="text-espresso">{selectedCafe?.name}</strong> has been routed to platform administrators. We will review your credentials and approve management access within 24 hours.
              </>
            ) : (
              <>
                Your new cafe <strong className="text-espresso">{name}</strong> has been successfully registered. The listing remains pending review until verified by platform administrators.
              </>
            )}
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Link
              to="/business/dashboard"
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-espresso text-cream hover:bg-espresso-700 shadow-warm inline-block"
            >
              Go to Operator Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsSuccess(false);
                setSelectedCafe(null);
                setName('');
                setAddress('');
              }}
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-cream-100 text-espresso hover:bg-cream-200 border border-latte inline-block"
            >
              Submit Another
            </button>
          </div>
        </div>
      ) : activeMode === 'claim' ? (
        /* MODE 1: CLAIM EXISTING CAFE */
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-latte shadow-warm space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!selectedCafe ? (
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-bold text-espresso">1. Find Your Cafe in Jhapa</h3>
              <form onSubmit={handleSearchCafes} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter cafe name or address in Birtamode / Damak..."
                  className="flex-1 text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                />
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl text-xs font-bold bg-espresso text-cream hover:bg-espresso-700 shadow-warm"
                >
                  Search
                </button>
              </form>

              {cafes.length > 0 && (
                <div className="divide-y divide-latte/50 border border-latte/60 rounded-2xl overflow-hidden mt-3">
                  {cafes.map((c) => (
                    <div key={c.id} className="p-4 bg-white hover:bg-cream-50 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-serif text-sm font-bold text-espresso">{c.name}</p>
                        <p className="text-xs text-subtext">{c.address}, {c.location?.city}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCafe(c)}
                        className="px-4 py-1.5 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-cream-100/70 border border-latte flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-caramel">Selected Cafe</span>
                  <p className="font-serif text-base font-bold text-espresso">{selectedCafe.name}</p>
                  <p className="text-xs text-subtext">{selectedCafe.address}, {selectedCafe.location?.city}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCafe(null)}
                  className="text-xs text-subtext hover:text-espresso underline"
                >
                  Change
                </button>
              </div>

              <form onSubmit={handleSubmitClaim} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Your Role at Cafe</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                    >
                      <option value="Owner / Founder">Owner / Founder</option>
                      <option value="Cafe Manager">Cafe Manager</option>
                      <option value="Authorized Representative">Authorized Representative</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Contact Phone</label>
                    <input
                      required
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+977-98..."
                      className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Business Email</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">
                    Proof of Ownership / Authorization
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    placeholder="Provide PAN/VAT registration number, Ward/Municipality operating license, or commercial electricity bill reference for validation."
                    className="w-full text-xs p-3.5 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 transition-colors shadow-warm flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'Submitting Claim...' : 'Submit Claim for Verification'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        /* MODE 2: REGISTER NEW CAFE LISTING */
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-latte shadow-warm space-y-6">
          <div className="border-b border-latte pb-4">
            <h3 className="font-serif text-xl font-bold text-espresso">Register a New Cafe Listing</h3>
            <p className="text-xs text-subtext">Provide your cafe details and place your precise map pin for discovery.</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitNewCafe} className="space-y-6">
            {/* General Info */}
            <div className="space-y-4">
              <h4 className="font-serif text-sm font-bold text-espresso flex items-center gap-2">
                <Building className="w-4 h-4 text-caramel" />
                <span>Basic Cafe Information</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Cafe Name *</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Himalayan Java Coffee Birtamode"
                    className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Freshly roasted artisan beans"
                    className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell visitors about your coffee ambiance, signature roast, seating, and specialities..."
                  className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel resize-none"
                />
              </div>
            </div>

            {/* Location & Map Picker */}
            <div className="space-y-4 border-t border-latte pt-6">
              <h4 className="font-serif text-sm font-bold text-espresso flex items-center gap-2">
                <MapPin className="w-4 h-4 text-caramel" />
                <span>Location & Interactive Map Selection</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Street Address *</label>
                  <input
                    required
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Muktichowk, Ward 4"
                    className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">City / Municipality</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                  >
                    <option value="Birtamode">Birtamode</option>
                    <option value="Damak">Damak</option>
                    <option value="Bhadrapur">Bhadrapur</option>
                    <option value="Mechinagar">Mechinagar (Kakarbhitta)</option>
                    <option value="Kankai">Kankai (Surunga)</option>
                    <option value="Arjundhara">Arjundhara (Sanischare)</option>
                  </select>
                </div>
              </div>

              {/* Leaflet Location Picker */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso">
                  Set Exact Map Coordinates
                </label>
                <p className="text-[11px] text-subtext">Click on the map or drag the pin to position your cafe entrance.</p>
                <LocationPickerMap
                  initialLat={latitude}
                  initialLng={longitude}
                  onSelectCoordinates={(lat, lng, addressHint) => {
                    setLatitude(lat);
                    setLongitude(lng);
                    if (addressHint && !address) {
                      setAddress(addressHint.split(',')[0]);
                    }
                  }}
                />
              </div>
            </div>

            {/* Contact & Social Links */}
            <div className="space-y-4 border-t border-latte pt-6">
              <h4 className="font-serif text-sm font-bold text-espresso flex items-center gap-2">
                <Phone className="w-4 h-4 text-caramel" />
                <span>Contact & Links</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Phone</label>
                  <input
                    type="tel"
                    value={cafePhone}
                    onChange={(e) => setCafePhone(e.target.value)}
                    placeholder="+977-23-XXXXXX"
                    className="w-full text-xs p-2.5 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Email</label>
                  <input
                    type="email"
                    value={cafeEmail}
                    onChange={(e) => setCafeEmail(e.target.value)}
                    placeholder="contact@mycafe.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Price Range</label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                  >
                    <option value="budget">Budget (NPR 100 - 250)</option>
                    <option value="moderate">Moderate (NPR 250 - 500)</option>
                    <option value="premium">Premium (NPR 500+)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Website URL</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://mycafe.np"
                    className="w-full text-xs p-2.5 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Instagram</label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@mycafe.jhapa"
                    className="w-full text-xs p-2.5 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Google Place ID (optional)</label>
                  <input
                    type="text"
                    value={googlePlaceId}
                    onChange={(e) => setGooglePlaceId(e.target.value)}
                    placeholder="ChIJ..."
                    className="w-full text-xs p-2.5 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full text-xs p-2.5 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                />
              </div>
            </div>

            {/* Categories & Facilities */}
            <div className="space-y-4 border-t border-latte pt-6">
              <h4 className="font-serif text-sm font-bold text-espresso flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-caramel" />
                <span>Categories & Facilities</span>
              </h4>

              {availableCategories.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-2">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map((cat) => {
                      const selected = selectedCategoryIds.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                            selected
                              ? 'bg-caramel text-white border-caramel'
                              : 'bg-cream-50 text-espresso border-latte hover:border-caramel/50'
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {availableFacilities.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-2">Facilities Available</label>
                  <div className="flex flex-wrap gap-2">
                    {availableFacilities.map((fac) => {
                      const selected = selectedFacilityIds.includes(fac.id);
                      return (
                        <button
                          key={fac.id}
                          type="button"
                          onClick={() => toggleFacility(fac.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                            selected
                              ? 'bg-espresso text-cream border-espresso'
                              : 'bg-cream-50 text-espresso border-latte hover:border-espresso/50'
                          }`}
                        >
                          {fac.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 transition-colors shadow-warm flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Registering Cafe...' : 'Submit Cafe for Verification'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
