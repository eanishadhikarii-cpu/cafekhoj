import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin, Coffee, Tag, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { Cafe, Category } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    cafes: Cafe[];
    categories: Category[];
    locations: { id: number; name: string; city: string }[];
  }>({ cafes: [], categories: [], locations: [] });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults({ cafes: [], categories: [], locations: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ cafes: [], categories: [], locations: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const data = await api.globalSearch(query);
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectCafe = (slug: string) => {
    onClose();
    navigate(`/cafes/${slug}`);
  };

  const handleSelectCategory = (slug: string) => {
    onClose();
    navigate(`/categories/${slug}`);
  };

  const handleSelectCity = (city: string) => {
    onClose();
    navigate(`/explore?city=${encodeURIComponent(city)}`);
  };

  const handleFullSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      navigate(`/explore?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-espresso/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-warm-xl border border-latte overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <form onSubmit={handleFullSearch} className="flex items-center px-4 py-3.5 border-b border-latte/60 gap-3">
          <Search className="w-5 h-5 text-caramel flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cafes, pour-overs, croissants, date spots in Jhapa..."
            className="flex-1 bg-transparent text-sm sm:text-base text-espresso placeholder-subtext focus:outline-none"
          />
          {isLoading && <Loader2 className="w-4 h-4 text-caramel animate-spin flex-shrink-0" />}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-subtext hover:text-espresso hover:bg-cream-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {query.trim().length >= 2 && !isLoading && results.cafes.length === 0 && results.categories.length === 0 && results.locations.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm font-semibold text-espresso">No matching results found for "{query}".</p>
              <p className="text-xs text-subtext mt-1">Try searching for "coffee", "study", "croissant", or "Birtamode".</p>
            </div>
          )}

          {/* Suggested Cafes */}
          {results.cafes.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-subtext mb-2 flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-caramel" />
                <span>Cafes</span>
              </h4>
              <div className="divide-y divide-latte/40">
                {results.cafes.map((cafe) => (
                  <button
                    key={cafe.id}
                    onClick={() => handleSelectCafe(cafe.slug)}
                    className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-cream-50 flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-bold text-espresso group-hover:text-caramel transition-colors">
                        {cafe.name}
                      </p>
                      <p className="text-xs text-subtext truncate max-w-md">
                        {cafe.address} • {cafe.location?.city}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-latte group-hover:text-caramel transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {results.categories.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-subtext mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-sage-600" />
                <span>Experiences & Moods</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {results.categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.slug)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-cream-100 hover:bg-latte-200 text-espresso transition-colors"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Locations */}
          {results.locations.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-subtext mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-caramel" />
                <span>Neighbourhoods & Cities</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {results.locations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handleSelectCity(loc.city)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-cream-100 hover:bg-latte-200 text-espresso transition-colors"
                  >
                    📍 {loc.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Default Quick Tags when query is empty */}
          {!query && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-subtext mb-3">
                Popular Searches in Jhapa
              </h4>
              <div className="flex flex-wrap gap-2">
                {['Date Night', 'Study Session with Wi-Fi', 'Pour-Over Coffee', 'Croissants', 'Outdoor Veranda', 'Birtamode Muktichowk', 'Damak Chowk'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setQuery(tag);
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-cream-100 hover:bg-latte text-espresso transition-colors border border-latte/50"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-cream-50 border-t border-latte/60 flex items-center justify-between text-xs text-subtext">
          <span>Press Enter for all results</span>
          <span className="font-semibold text-caramel">CafeKhoj Jhapa</span>
        </div>
      </div>
    </div>
  );
};

