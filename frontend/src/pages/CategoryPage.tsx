import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Cafe, Category } from '../types';
import { CafeCard } from '../components/common/CafeCard';
import { ChevronRight, Sparkles, Coffee } from 'lucide-react';

export const CategoryPage: React.FC = () => {
  const { category: categorySlug } = useParams<{ category: string }>();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!categorySlug) return;
    setIsLoading(true);
    Promise.all([
      api.getCafes({ category: categorySlug }),
      api.getCategories(),
    ]).then(([cafesRes, catsRes]) => {
      const list = cafesRes.results || cafesRes;
      setCafes(list);
      const cat = catsRes.find((c: Category) => c.slug === categorySlug);
      setCategory(cat || null);
    }).catch(console.error).finally(() => setIsLoading(false));
  }, [categorySlug]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-subtext">
        <Link to="/" className="hover:text-espresso">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/explore" className="hover:text-espresso">Categories</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-espresso">{category?.name || categorySlug}</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cream-200 to-cream-100 rounded-3xl p-8 border border-latte shadow-warm">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-caramel border border-latte">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Mood & Experience</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
            {category?.name || 'Category'} Cafes
          </h1>
          <p className="text-xs sm:text-sm text-subtext leading-relaxed">
            {category?.description || 'Browse places handpicked for this vibe and occasion across Jhapa.'}
          </p>
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs font-bold text-subtext uppercase tracking-wider">
            {cafes.length} {cafes.length === 1 ? 'Cafe' : 'Cafes'} Found
          </span>
          <Link to="/explore" className="text-xs font-bold text-caramel hover:underline">
            View All Categories →
          </Link>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-caramel border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-subtext">Loading category cafes...</p>
          </div>
        ) : cafes.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-latte max-w-md mx-auto">
            <Coffee className="w-8 h-8 text-caramel mx-auto mb-2" />
            <h3 className="font-serif text-lg font-bold text-espresso">No cafes currently under this category</h3>
            <p className="text-xs text-subtext mt-1">Check back soon as local businesses update their listings.</p>
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
};

