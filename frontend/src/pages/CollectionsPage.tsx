import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ChevronRight, BookOpen, Heart, Coffee, Cake } from 'lucide-react';
import { CafeCard } from '../components/common/CafeCard';
import { api } from '../services/api';
import { Cafe } from '../types';

interface CollectionMeta {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  categoryFilter?: string;
  priceFilter?: string;
}

const collectionsList: CollectionMeta[] = [
  {
    slug: 'first-date-birtamode',
    title: 'Best Cafes for a First Date in Birtamode',
    subtitle: 'Romantic ambiance, cozy lighting, and sweet pairings',
    description: 'First dates require just the right balance of soft acoustic music, warm lighting, and intimate corners. Explore Birtamode’s most charming spots to relax over pour-overs and artisanal cheesecakes.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    categoryFilter: 'date-night',
  },
  {
    slug: 'study-friendly-birtamode',
    title: 'Study & Work-Friendly Cafes in Jhapa',
    subtitle: 'High-speed Wi-Fi, abundant plugs, and quiet zones',
    description: 'Whether preparing for engineering exams or coding on your laptop, these cafes in Birtamode offer ergonomic seating, uninterrupted power sockets, and continuous dark roasts.',
    image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80',
    categoryFilter: 'study-session',
  },
  {
    slug: 'bakeries-jhapa',
    title: 'Artisanal Bakeries & Sweet Treats',
    subtitle: 'Fresh croissants, Basque cheesecakes, and iced lattes',
    description: 'Satisfy your sweet tooth with master French pastries, layered butter croissants, and rich dessert creations made fresh daily across Eastern Nepal.',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    categoryFilter: 'desserts-bakery',
  },
  {
    slug: 'affordable-coffee-jhapa',
    title: 'Affordable Coffee Spots in Jhapa',
    subtitle: 'Quality coffee under NPR 250 without compromising flavor',
    description: 'Great coffee doesn’t have to break the bank. Discover student-friendly spots, Matka chiya addas, and wallet-friendly espresso bars.',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    priceFilter: 'budget',
  },
];

export const CollectionsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const selectedCol = slug ? collectionsList.find((c) => c.slug === slug) : null;

  useEffect(() => {
    if (selectedCol) {
      setIsLoading(true);
      const params: Record<string, string> = {};
      if (selectedCol.categoryFilter) params.category = selectedCol.categoryFilter;
      if (selectedCol.priceFilter) params.price = selectedCol.priceFilter;

      api.getCafes(params)
        .then((res) => setCafes(res.results || res))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [selectedCol]);

  // Single Collection Detail View
  if (slug && selectedCol) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <nav className="flex items-center gap-1.5 text-xs text-subtext">
          <Link to="/" className="hover:text-espresso">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/collections" className="hover:text-espresso">Collections</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-espresso">{selectedCol.title}</span>
        </nav>

        <div className="relative rounded-3xl overflow-hidden bg-espresso text-cream h-72 sm:h-80 flex items-end p-6 sm:p-10 shadow-warm-lg">
          <img
            src={selectedCol.image}
            alt={selectedCol.title}
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-caramel">
              Curated Editorial Collection
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-cream">
              {selectedCol.title}
            </h1>
            <p className="text-xs sm:text-sm text-latte-200 leading-relaxed">
              {selectedCol.description}
            </p>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold text-espresso mb-6">
            Cafes Featured in this Guide ({cafes.length})
          </h2>
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-4 border-caramel border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-subtext">Loading featured collection cafes...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cafes.map((cafe) => (
                <CafeCard key={cafe.id} cafe={cafe} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Collections Overview List View
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-caramel">Local Insights</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso tracking-tight mt-1">
          Curated Cafe Collections
        </h1>
        <p className="text-xs sm:text-sm text-subtext mt-1.5 max-w-xl">
          Carefully themed local lists designed to help you discover the exact vibe, from first dates and quiet study desks to artisan bakeries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {collectionsList.map((col) => (
          <Link
            key={col.slug}
            to={`/collections/${col.slug}`}
            className="group rounded-3xl overflow-hidden bg-white border border-latte shadow-warm hover:shadow-warm-xl transition-all flex flex-col"
          >
            <div className="h-60 w-full overflow-hidden bg-cream-100 relative">
              <img
                src={col.image}
                alt={col.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-cream">
                <span className="text-[10px] uppercase font-bold tracking-wider text-caramel">
                  Jhapa Guide
                </span>
                <h3 className="font-serif text-xl font-bold text-white group-hover:text-caramel transition-colors">
                  {col.title}
                </h3>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <p className="text-xs text-subtext leading-relaxed">
                {col.description}
              </p>
              <div className="pt-4 mt-4 border-t border-latte/40 flex items-center justify-between text-xs font-bold text-caramel">
                <span>Explore This Guide</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

