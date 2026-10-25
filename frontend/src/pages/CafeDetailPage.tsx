import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart, Share2, MapPin, Phone, Mail, Globe, Clock, CheckCircle2,
  Navigation, Sparkles, MessageSquare, Plus, ChevronRight, AlertCircle, ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { Cafe, Review } from '../types';
import { StarRating } from '../components/common/StarRating';
import { Badge } from '../components/common/Badge';
import { CafeMap } from '../components/map/CafeMap';
import { ReviewList } from '../components/reviews/ReviewList';
import { ReviewModal } from '../components/reviews/ReviewModal';
import { CafeCard } from '../components/common/CafeCard';
import { useAuth } from '../context/AuthContext';

export const CafeDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'reviews' | 'photos' | 'location'>('overview');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isFavourited, setIsFavourited] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchCafe = async () => {
      try {
        setIsLoading(true);
        const data = await api.getCafeBySlug(slug);
        setCafe(data);
        setIsFavourited(!!data.is_favourited);

        // Track listing view event
        api.trackEvent('listing_view', data.id, { source: 'detail_page' });

        // Load reviews
        const revRes = await api.getCafeReviews(data.id);
        setReviews(revRes.results || revRes);
      } catch (err) {
        console.error('Error fetching cafe detail:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCafe();
  }, [slug]);

  const handleToggleFav = async () => {
    if (!cafe) return;
    if (!user) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    try {
      const res = await api.toggleFavourite(cafe.id);
      setIsFavourited(res.is_favourited);
      if (res.is_favourited) {
        api.trackEvent('favourite_add', cafe.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${cafe?.name} on CafeKhoj`,
        text: `Check out ${cafe?.name} in ${cafe?.location?.city} on CafeKhoj!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDirectionClick = () => {
    if (cafe) {
      api.trackEvent('direction_click', cafe.id);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-caramel border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-espresso">Loading cafe profile...</p>
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-espresso">Cafe not found</h2>
        <p className="text-xs text-subtext mt-2">The cafe listing you are looking for may have moved or been updated.</p>
        <Link to="/explore" className="mt-4 inline-block px-5 py-2 rounded-full text-xs font-bold bg-caramel text-white">
          Explore All Cafes
        </Link>
      </div>
    );
  }

  const isVerified = cafe.verification_status === 'verified';
  const coverUrl = cafe.cover_image_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80';
  const canRespond = !!cafe.claimed_by_current_user;

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header & Cover Hero */}
      <div className="relative w-full h-72 sm:h-96 bg-espresso overflow-hidden">
        <img
          src={coverUrl}
          alt={cafe.name}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/40 to-transparent" />

        <div className="absolute bottom-6 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-cream">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {isVerified && <Badge type="verified" />}
                {cafe.is_sample_data && <Badge type="sample" />}
                <Badge type="price" text={cafe.price_range} />
                {cafe.categories?.map((cat) => (
                  <span key={cat.id} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs text-cream">
                    {cat.name}
                  </span>
                ))}
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-cream">
                {cafe.name}
              </h1>

              <p className="text-xs sm:text-sm text-latte-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-caramel flex-shrink-0" />
                <span>{cafe.address}, {cafe.location?.city}</span>
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleFav}
                className={`px-4 py-2 rounded-full text-xs font-bold glass-panel shadow-sm flex items-center gap-1.5 transition-transform active:scale-95 ${
                  isFavourited ? 'text-rose-500 bg-white' : 'text-cream bg-white/20 hover:bg-white/30'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavourited ? 'fill-rose-500' : ''}`} />
                <span>{isFavourited ? 'Saved' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="px-4 py-2 rounded-full text-xs font-bold bg-white/20 hover:bg-white/30 text-cream backdrop-blur-xs shadow-sm flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
              </button>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${cafe.latitude},${cafe.longitude}`}
                target="_blank"
                rel="noreferrer"
                onClick={handleDirectionClick}
                className="px-5 py-2 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 shadow-warm flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <Navigation className="w-4 h-4" />
                <span>Directions</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container with Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-latte/60 pb-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'menu', label: `Digital Menu (${cafe.menu_categories?.reduce((acc, mc) => acc + (mc.items?.length || 0), 0) || 0})` },
            { id: 'reviews', label: `Reviews (${cafe.review_count || 0})` },
            { id: 'photos', label: `Photos (${cafe.photos?.length || 0})` },
            { id: 'location', label: 'Map & Location' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-espresso text-cream shadow-warm'
                  : 'text-subtext hover:text-espresso hover:bg-cream-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-8">
              {/* Description */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-latte shadow-warm space-y-4">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso">
                  About {cafe.name}
                </h2>
                <p className="text-xs sm:text-sm text-espresso leading-relaxed whitespace-pre-line">
                  {cafe.description}
                </p>

                {cafe.source && (
                  <div className="pt-3 border-t border-latte/40 text-[11px] text-subtext flex items-center justify-between">
                    <span>Source: {cafe.source}</span>
                    {cafe.last_verified_at && (
                      <span>Last verified: {new Date(cafe.last_verified_at).toLocaleDateString()}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Facilities / Amenities */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-latte shadow-warm space-y-4">
                <h3 className="font-serif text-lg font-bold text-espresso">
                  Facilities & Amenities
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {cafe.facilities?.map((fac) => (
                    <div
                      key={fac.id}
                      className="p-3 rounded-2xl bg-cream-50 border border-latte/50 flex items-center gap-2.5 text-xs font-semibold text-espresso"
                    >
                      <CheckCircle2 className="w-4 h-4 text-sage-600 flex-shrink-0" />
                      <span>{fac.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature Menu Preview */}
              {cafe.menu_categories && cafe.menu_categories.length > 0 && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-latte shadow-warm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg font-bold text-espresso">
                      Signature Highlights
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('menu')}
                      className="text-xs font-bold text-caramel hover:underline"
                    >
                      View Full Menu →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cafe.menu_categories[0]?.items?.slice(0, 4).map((item) => (
                      <div key={item.id} className="p-3.5 rounded-2xl bg-cream-50 border border-latte/40 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-espresso">{item.name}</p>
                          <p className="text-[11px] text-subtext line-clamp-1">{item.description}</p>
                        </div>
                        <span className="text-xs font-bold text-caramel whitespace-nowrap ml-2">
                          NPR {item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar: Operating Hours & Contact */}
            <div className="lg:col-span-4 space-y-6">
              {/* Operating Hours Card */}
              <div className="bg-white rounded-3xl p-6 border border-latte shadow-warm space-y-4">
                <h3 className="font-serif text-base font-bold text-espresso flex items-center gap-2">
                  <Clock className="w-4 h-4 text-caramel" />
                  <span>Operating Hours</span>
                </h3>
                <div className="divide-y divide-latte/40 text-xs">
                  {cafe.opening_hours && cafe.opening_hours.length > 0 ? (
                    cafe.opening_hours.map((oh) => (
                      <div key={oh.id} className="py-2 flex items-center justify-between">
                        <span className="font-medium text-espresso">{oh.day_name}</span>
                        <span className={oh.is_closed ? 'text-rose-600 font-bold' : 'text-subtext font-semibold'}>
                          {oh.is_closed ? 'Closed' : `${oh.opens_at?.substring(0, 5)} - ${oh.closes_at?.substring(0, 5)}`}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-subtext">Open daily 7:30 AM - 9:30 PM</div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-3xl p-6 border border-latte shadow-warm space-y-3 text-xs">
                <h3 className="font-serif text-base font-bold text-espresso">
                  Contact & Location
                </h3>
                {cafe.phone && (
                  <div className="flex items-center gap-2 text-espresso">
                    <Phone className="w-3.5 h-3.5 text-caramel flex-shrink-0" />
                    <span>{cafe.phone}</span>
                  </div>
                )}
                {cafe.email && (
                  <div className="flex items-center gap-2 text-espresso">
                    <Mail className="w-3.5 h-3.5 text-caramel flex-shrink-0" />
                    <span>{cafe.email}</span>
                  </div>
                )}
                {cafe.website && (
                  <div className="flex items-center gap-2 text-espresso">
                    <Globe className="w-3.5 h-3.5 text-caramel flex-shrink-0" />
                    <a href={cafe.website} target="_blank" rel="noreferrer" className="text-caramel hover:underline truncate">
                      {cafe.website}
                    </a>
                  </div>
                )}
                <div className="pt-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${cafe.latitude},${cafe.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-espresso text-cream hover:bg-espresso-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-warm"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Get Directions on Google Maps</span>
                  </a>
                </div>
              </div>

              {/* Owner Claim Banner */}
              {!cafe.claimed_by_current_user && (
                <div className="p-5 rounded-3xl bg-cream-200/80 border border-latte text-xs space-y-2">
                  <p className="font-bold text-espresso">Do you own or manage {cafe.name}?</p>
                  <p className="text-subtext leading-relaxed">
                    Claim this listing to update opening hours, edit menu items, and reply to customer reviews.
                  </p>
                  <Link
                    to={`/business/claim?cafe_id=${cafe.id}`}
                    className="inline-block pt-1 font-bold text-caramel hover:underline"
                  >
                    Claim this listing →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Menu */}
        {activeTab === 'menu' && (
          <div className="space-y-8">
            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>Prices and seasonal item availability may change. Menu updated by verified management.</span>
            </div>

            {cafe.menu_categories && cafe.menu_categories.length > 0 ? (
              cafe.menu_categories.map((cat) => (
                <div key={cat.id} className="bg-white rounded-3xl p-6 sm:p-8 border border-latte shadow-warm space-y-4">
                  <h3 className="font-serif text-xl font-bold text-espresso border-b border-latte/40 pb-2">
                    {cat.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cat.items?.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-cream-50/60 border border-latte/50 flex justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-espresso">{item.name}</span>
                            {item.is_signature && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-caramel/20 text-caramel">
                                Signature
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-subtext leading-relaxed">{item.description}</p>
                          )}
                          {item.dietary_labels && (
                            <span className="inline-block text-[10px] font-semibold text-sage-600 bg-sage-100 px-2 py-0.5 rounded-full">
                              {item.dietary_labels}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-caramel whitespace-nowrap">
                          NPR {item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-3xl p-10 border border-latte text-center">
                <p className="text-sm font-semibold text-espresso">Digital menu items are being updated.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-2xl font-bold text-espresso">Customer Reviews</h3>
                <p className="text-xs text-subtext mt-0.5">Read verified experiences from cafe guests</p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(true)}
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 active:scale-95 transition-all shadow-warm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Write a Review</span>
              </button>
            </div>

            <ReviewList
              reviews={reviews}
              cafeId={cafe.id}
              averageRating={cafe.average_rating}
              reviewCount={cafe.review_count}
              canRespond={canRespond}
            />
          </div>
        )}

        {/* Tab 4: Photos */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            <h3 className="font-serif text-2xl font-bold text-espresso">Photo Gallery</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {cafe.photos && cafe.photos.length > 0 ? (
                cafe.photos.map((photo) => (
                  <div key={photo.id} className="h-64 rounded-2xl overflow-hidden border border-latte bg-cream-100 group relative">
                    <img
                      src={photo.image_url}
                      alt={photo.alt_text || photo.caption || cafe.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {photo.caption && (
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-espresso/80 to-transparent text-cream text-xs">
                        {photo.caption}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-10 bg-white rounded-2xl border border-latte">
                  <p className="text-xs text-subtext">No additional gallery photographs uploaded yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Location */}
        {activeTab === 'location' && (
          <div className="space-y-6">
            <h3 className="font-serif text-2xl font-bold text-espresso">Location & Map</h3>
            <CafeMap
              cafes={[cafe]}
              selectedCafeId={cafe.id}
              height="500px"
              defaultCenter={[Number(cafe.latitude), Number(cafe.longitude)]}
              defaultZoom={16}
            />
            <div className="p-4 rounded-2xl bg-white border border-latte flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-espresso">{cafe.address}</p>
                <p className="text-xs text-subtext">Coordinates: {cafe.latitude}, {cafe.longitude}</p>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${cafe.latitude},${cafe.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 transition-colors shadow-warm flex items-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>
        )}

        {/* Related Cafes Section */}
        {cafe.related_cafes && cafe.related_cafes.length > 0 && (
          <div className="pt-10 border-t border-latte/60 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-caramel">More in {cafe.location?.city}</span>
              <h3 className="font-serif text-2xl font-bold text-espresso mt-1">Similar Cafes You Might Like</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {cafe.related_cafes.map((rel) => (
                <CafeCard key={rel.id} cafe={rel} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Submission Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        cafeId={cafe.id}
        cafeName={cafe.name}
        onReviewSubmitted={async () => {
          const revRes = await api.getCafeReviews(cafe.id);
          setReviews(revRes.results || revRes);
          // Refresh cafe data for updated rating
          const fresh = await api.getCafeBySlug(slug!);
          setCafe(fresh);
        }}
      />
    </div>
  );
};
