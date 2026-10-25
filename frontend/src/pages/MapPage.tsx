import React, { useEffect, useState } from 'react';
import { CafeMap } from '../components/map/CafeMap';
import { CafeCard } from '../components/common/CafeCard';
import { api } from '../services/api';
import { Cafe, Category } from '../types';
import { Filter, Layers, Navigation } from 'lucide-react';
import { useLocation } from '../context/LocationContext';

export const MapPage: React.FC = () => {
  const { selectedCity } = useLocation();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCafes({ city: selectedCity, category: selectedCategory || undefined }),
      api.getCategories(),
    ]).then(([cafesRes, catsRes]) => {
      const list = cafesRes.results || cafesRes;
      setCafes(list);
      setCategories(catsRes);
      if (list.length > 0) setSelectedCafe(list[0]);
      setIsLoading(false);
    }).catch(console.error);
  }, [selectedCity, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-bold text-espresso">Interactive Cafe Map</h1>
          <p className="text-xs text-subtext">Exploring coordinates and venues in {selectedCity}</p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              !selectedCategory ? 'bg-espresso text-cream' : 'bg-white text-espresso border border-latte'
            }`}
          >
            All Moods
          </button>
          {categories.slice(0, 6).map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.slug)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === c.slug ? 'bg-caramel text-white' : 'bg-white text-espresso border border-latte hover:bg-cream-100'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <CafeMap
            cafes={cafes}
            selectedCafeId={selectedCafe?.id}
            onSelectCafe={(cafe) => setSelectedCafe(cafe)}
            height="700px"
          />
        </div>

        <div className="lg:col-span-4 space-y-4 max-h-[700px] overflow-y-auto pr-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-subtext">
            Venues in View ({cafes.length})
          </h3>
          {selectedCafe && (
            <div className="mb-4">
              <span className="text-[11px] font-bold text-caramel uppercase">Selected Venue</span>
              <div className="mt-1">
                <CafeCard cafe={selectedCafe} />
              </div>
            </div>
          )}

          <div className="space-y-3">
            {cafes.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCafe(c)}
                className={`cursor-pointer rounded-2xl p-3 bg-white border transition-all ${
                  selectedCafe?.id === c.id ? 'border-caramel ring-2 ring-caramel/40 shadow-warm' : 'border-latte hover:border-caramel/40'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-serif text-sm font-bold text-espresso">{c.name}</h4>
                  <span className="text-xs font-bold text-caramel">★ {Number(c.average_rating).toFixed(1)}</span>
                </div>
                <p className="text-[11px] text-subtext truncate mt-0.5">{c.address}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

