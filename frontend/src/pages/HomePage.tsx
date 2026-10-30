import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Compass, Navigation, Sparkles, Heart,
  BookOpen, Coffee, Tag, Sun, Cake, Users, VolumeX, ShieldCheck, ArrowRight, Star
} from 'lucide-react';
const CoffeeHero3D = lazy(() =>
  import('../components/3d/CoffeeHero3D').then(({ CoffeeHero3D: component }) => ({ default: component }))
);
import { CafeCard } from '../components/common/CafeCard';
import { CafeMap } from '../components/map/CafeMap';
import { StarRating } from '../components/common/StarRating';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import { useLocation } from '../context/LocationContext';
import { Cafe, Category, Review } from '../types';

export const HomePage: React.FC = () => {
  const { selectedCity, setSelectedCity, userCoords, requestUserLocation, isLocating } = useLocation();
  const navigate = useNavigate();
  const [enableHero3D, setEnableHero3D] = useState(() =>
    window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)').matches
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [popularCafes, setPopularCafes] = useState<Cafe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [selectedMapCafe, setSelectedMapCafe] = useState<Cafe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)');
    const updateHeroMode = () => setEnableHero3D(mediaQuery.matches);
    mediaQuery.addEventListener('change', updateHeroMode);
    return () => mediaQuery.removeEventListener('change', updateHeroMode);
  }, []);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setIsLoading(true);
        // Load cafes in selected city
        const cafesRes = await api.getCafes({ city: selectedCity, page_size: 8 });
        const cafesList = cafesRes.results || cafesRes;
        setPopularCafes(cafesList);
        if (cafesList.length > 0) setSelectedMapCafe(cafesList[0]);

        // Load categories
        const catRes = await api.getCategories();
        setCategories(catRes);

        // Load recent reviews from the first cafe if available
        if (cafesList.length > 0) {
          const revRes = await api.getCafeReviews(cafesList[0].id, { page_size: '4' });
          setRecentReviews(revRes.results || revRes);
        }
      } catch (err) {
        console.error('Error loading homepage:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomeData();
  }, [selectedCity]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}&city=${encodeURIComponent(selectedCity)}`);
    } else {
      navigate(`/explore?city=${encodeURIComponent(selectedCity)}`);
    }
  };

  const handleNearMe = async () => {
    const coords = await requestUserLocation();
    if (coords) {
      navigate(`/explore?lat=${coords.lat}&lng=${coords.lng}&sort=nearest`);
    } else {
      navigate(`/explore?city=${encodeURIComponent(selectedCity)}`);
    }
  };

  const moodIcons: Record<string, any> = {
    'date-night': Heart,
    'study-session': BookOpen,
    'coffee-lovers': Coffee,
    'budget-friendly': Tag,
    'beautiful-interiors': Sparkles,
    'outdoor-seating': Sun,
    'desserts-bakery': Cake,
    'friends-meetup': Users,
    'quiet-corners': VolumeX,
    'family-friendly': Compass,
  };

  return (
    <div className="space-y-12 sm:space-y-20 pb-16">
      {/* A. Hero Section with 3D Experience */}
      <section className="relative overflow-hidden pt-4 pb-10 sm:pt-12 sm:pb-20 bg-gradient-to-b from-cream-100/70 via-cream-50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Headlines & Functional Search */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cream-200/90 border border-latte text-[11px] sm:text-xs font-semibold text-espresso">
                <Sparkles className="w-3.5 h-3.5 text-caramel flex-shrink-0" />
                <span>Specialty Coffee & Cafe Discovery • Jhapa</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-espresso tracking-tight leading-[1.15]">
                Your Next Favourite Cafe Is <span className="italic text-caramel">Closer</span> Than You Think.
              </h1>

              <p className="text-sm sm:text-lg text-subtext leading-relaxed max-w-xl">
                Discover local coffee spots, hidden garden verandas, study hubs with Wi-Fi, and cafes worth coming back to in Birtamode, Damak, and beyond.
              </p>

              {/* Functional Search Box */}
              <form onSubmit={handleHeroSearch} className="bg-white p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl shadow-warm-lg border border-latte flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-2xl">
                <div className="flex-1 flex items-center px-3 py-2 sm:py-0 gap-2.5">
                  <Search className="w-5 h-5 text-caramel flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cafes, coffee, foods..."
                    className="w-full bg-transparent text-xs sm:text-sm text-espresso placeholder-subtext focus:outline-none min-h-[36px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNearMe}
                    disabled={isLocating}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold text-espresso bg-cream-100 hover:bg-latte-200 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[44px]"
                  >
                    <Navigation className={`w-3.5 h-3.5 text-caramel ${isLocating ? 'animate-spin' : ''}`} />
                    <span>Near Me</span>
                  </button>

                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-espresso text-cream hover:bg-espresso-700 active:scale-95 transition-all shadow-warm whitespace-nowrap min-h-[44px] flex items-center justify-center"
                  >
                    Explore
                  </button>
                </div>
              </form>

              {/* Trust & Transparency Note */}
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-subtext pt-1">
                <ShieldCheck className="w-4 h-4 text-sage-600 flex-shrink-0" />
                <span>Verified physical locations in Jhapa District with genuine operating hours.</span>
              </div>
            </div>

            {/* Right Column: 3D Coffee Scene */}
            <div className="lg:col-span-5 relative mt-4 lg:mt-0">
              {enableHero3D ? (
                <Suspense fallback={<div aria-hidden="true" className="h-[380px] sm:h-[460px] md:h-[500px] rounded-3xl bg-gradient-to-br from-caramel/10 via-cream-100 to-espresso/5" />}>
                  <CoffeeHero3D />
                </Suspense>
              ) : (
                <div role="img" aria-label="CafeKhoj coffee illustration" className="h-[250px] sm:h-[320px] md:h-[460px] rounded-3xl bg-gradient-to-br from-caramel/10 via-cream-100 to-espresso/5 flex flex-col items-center justify-center text-caramel">
                  <div className="rounded-full bg-white/80 p-6 shadow-warm"><Coffee className="w-14 h-14" aria-hidden="true" /></div>
                  <p className="mt-5 font-serif text-lg font-semibold text-espresso">A good cup is closer than you think.</p>
                  <span className="mt-1 text-xs text-subtext">Explore local cafes in Jhapa</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* D. Popular Near You */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-caramel">
              <Compass className="w-3.5 h-3.5" />
              <span>Recommended In {selectedCity}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso mt-1">
              Popular Cafes Near You
            </h2>
          </div>
          <Link
            to={`/explore?city=${encodeURIComponent(selectedCity)}`}
            className="text-xs font-bold text-caramel hover:text-espresso flex items-center gap-1 transition-colors min-h-[44px] sm:min-h-0 items-center"
          >
            <span>View All {selectedCity} Cafes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {popularCafes.slice(0, 4).map((cafe) => (
            <CafeCard key={cafe.id} cafe={cafe} />
          ))}
        </div>
      </section>

      {/* E. Explore by Mood */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-caramel">Find What Fits</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso mt-1">
            Explore Cafes by Mood & Occasion
          </h2>
          <p className="text-xs sm:text-sm text-subtext mt-1.5">
            Looking for a quiet corner with power outlets or a romantic terrace? Filter by your exact vibe.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const Icon = moodIcons[cat.slug] || Coffee;
            return (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="group p-3 sm:p-4 rounded-2xl bg-white border border-latte/60 shadow-warm hover:shadow-warm-lg hover:border-caramel/50 transition-all text-center flex flex-col items-center justify-center gap-2.5 sm:gap-3 relative overflow-hidden min-h-[110px]"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-cream-100 text-espresso flex items-center justify-center group-hover:scale-110 group-hover:bg-caramel group-hover:text-white transition-all shadow-xs">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xs sm:text-sm font-bold text-espresso group-hover:text-caramel transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-subtext mt-0.5">
                    {cat.cafe_count || 0} {cat.cafe_count === 1 ? 'place' : 'places'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* F. Interactive Map Preview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-4 sm:p-8 border border-latte shadow-warm-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-caramel">
                <MapPin className="w-3.5 h-3.5" />
                <span>Geographic Discovery</span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso mt-1">
                Explore on the Map
              </h2>
            </div>
            <Link
              to="/map"
              className="px-4 py-2.5 rounded-full text-xs font-bold bg-espresso text-cream hover:bg-espresso-700 transition-colors shadow-warm inline-flex items-center gap-1.5 self-start sm:self-auto min-h-[44px]"
            >
              <span>Full Screen Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 overflow-hidden rounded-2xl border border-latte">
              <CafeMap
                cafes={popularCafes}
                selectedCafeId={selectedMapCafe?.id}
                onSelectCafe={(cafe) => setSelectedMapCafe(cafe)}
                height="320px"
              />
            </div>
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-subtext">
                Selected Destination
              </h3>
              {selectedMapCafe ? (
                <CafeCard cafe={selectedMapCafe} />
              ) : (
                <div className="p-6 rounded-2xl bg-cream-100 text-center text-xs text-subtext">
                  Click any marker on the map to inspect details, directions, and menu prices.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* H. Recently Reviewed Stream */}
      {recentReviews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-caramel">Verified Feedback</span>
            <h2 className="font-serif text-2xl font-bold text-espresso mt-1">
              Recently Reviewed by Locals
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {recentReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-latte/60 shadow-warm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <StarRating rating={rev.rating} size="sm" showScore={false} />
                    <span className="text-[10px] text-subtext">
                      {new Date(rev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <Link
                    to={`/cafes/${rev.cafe_slug || ''}`}
                    className="font-serif text-sm font-bold text-espresso hover:text-caramel transition-colors line-clamp-1"
                  >
                    {rev.cafe_name || 'Specialty Cafe'}
                  </Link>
                  <p className="text-xs text-subtext mt-2 leading-relaxed italic line-clamp-3">
                    "{rev.review_text}"
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-latte/40 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-cream-200 text-espresso text-[10px] font-bold flex items-center justify-center">
                    {rev.user.username[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-espresso truncate">
                    {rev.user.first_name || rev.user.username}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* I. Editorial Discovery Collections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-caramel">Curated Guides</span>
          <h2 className="font-serif text-2xl font-bold text-espresso mt-1">
            Local Cafe Guides for Jhapa
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Best Cafes for a First Date in Birtamode',
              desc: 'Intimate seating, soft ambient music, warm lighting, and artisanal dessert pairings.',
              link: '/collections/first-date-birtamode',
              img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
            },
            {
              title: 'Where to Study & Code with High-Speed Wi-Fi',
              desc: 'Dedicated laptop power sockets, quiet reading zones, and continuous coffee refills.',
              link: '/collections/study-friendly-birtamode',
              img: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=600&q=80',
            },
            {
              title: 'Top Artisanal Bakeries & Sweet Treats in Jhapa',
              desc: 'Authentic 72-hour sourdough croissants, Basque burnt cheesecakes, and iced Spanish lattes.',
              link: '/collections/bakeries-jhapa',
              img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
            },
          ].map((guide, idx) => (
            <Link
              key={idx}
              to={guide.link}
              className="group rounded-2xl overflow-hidden bg-white border border-latte shadow-warm hover:shadow-warm-lg transition-all flex flex-col"
            >
              <div className="h-44 w-full overflow-hidden bg-cream-100">
                <img
                  src={guide.img}
                  alt={guide.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-espresso group-hover:text-caramel transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-subtext mt-1.5 leading-relaxed">
                    {guide.desc}
                  </p>
                </div>
                <span className="text-xs font-bold text-caramel mt-4 inline-flex items-center gap-1">
                  <span>Read Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* J. Cafe Owner Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-espresso text-cream p-6 sm:p-12 border border-latte shadow-warm-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-caramel">
              For Cafe Owners & Managers
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-cream tracking-tight">
              Own a Cafe? Help More People Discover You.
            </h2>
            <p className="text-xs sm:text-sm text-latte-200 leading-relaxed">
              Claim your verified business listing on CafeKhoj. Keep your operating hours and menus up to date, post seasonal promotions, respond directly to customer reviews, and understand listing visitor analytics.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                to="/business/claim"
                className="min-h-[44px] px-6 py-3 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 active:scale-95 transition-all shadow-warm flex items-center justify-center text-center"
              >
                Claim Your Listing
              </Link>
              <Link
                to="/business"
                className="min-h-[44px] px-6 py-3 rounded-full text-xs font-bold bg-coffee-700 text-cream hover:bg-coffee-600 transition-colors border border-latte/30 flex items-center justify-center text-center"
              >
                Learn More About Merchant Portal
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
