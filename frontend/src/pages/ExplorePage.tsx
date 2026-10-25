import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, SlidersHorizontal, MapPin, Grid, List, Map, X,
  RotateCcw, Sparkles, Navigation, Loader2
} from 'lucide-react';
import { CafeCard } from '../components/common/CafeCard';
import { CafeMap } from '../components/map/CafeMap';
import { api } from '../services/api';
import { Cafe, Category, Facility } from '../types';
import { useLocation } from '../context/LocationContext';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { userCoords, requestUserLocation, isLocating } = useLocation();

  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMap, setShowMap] = useState(false);
  const [selectedMapCafe, setSelectedMapCafe] = useState<Cafe | null>(null);

  // Filters from URL
  const search = searchParams.get('search') || '';
  const city = searchParams.get('city') || '';
  const category = searchParams.get('category') || '';
  const facility = searchParams.get('facility') || '';
  const price = searchParams.get('price') || '';
  const minRating = searchParams.get('min_rating') || '';
  const sort = searchParams.get('sort') || 'relevance';

  // Load initial filter metadata
  useEffect(() => {
    Promise.all([api.getCategories(), api.getFacilities()]).then(([cats, facs]) => {
      setCategories(cats);
      setFacilities(facs);
    }).catch(console.error);
  }, []);

  // Fetch cafes whenever URL searchParams change
  useEffect(() => {
    const fetchCafes = async () => {
      try {
        setIsLoading(true);
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (city) params.city = city;
        if (category) params.category = category;
        if (facility) params.facility = facility;
        if (price) params.price = price;
        if (minRating) params.min_rating = minRating;
        if (sort) params.sort = sort;

        if (userCoords) {
          params.lat = String(userCoords.lat);
          params.lng = String(userCoords.lng);
        }

        const res = await api.getCafes(params);
        const list = res.results || res;
        setCafes(list);
        if (list.length > 0) setSelectedMapCafe(list[0]);
      } catch (err) {
        console.error('Failed to load cafes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCafes();
  }, [searchParams, userCoords]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handleNearMeClick = async () => {
    const coords = await requestUserLocation();
    if (coords) {
      updateFilter('sort', 'nearest');
    }
  };

  const hasActiveFilters = Boolean(search || city || category || facility || price || minRating || sort !== 'relevance');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso tracking-tight">
          Discover Cafes
        </h1>
        <p className="text-xs sm:text-sm text-subtext mt-1">
          Explore artisanal coffee roasters, study havens, and cozy date spots across Birtamode and Jhapa.
        </p>
      </div>

      {/* Filter & Control Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-latte shadow-warm space-y-4">
        {/* Top row: search & primary actions */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1 flex items-center px-4 py-2.5 rounded-2xl bg-cream-50 border border-latte gap-2.5">
            <Search className="w-4 h-4 text-caramel flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search by name, address, menu items..."
              className="w-full bg-transparent text-xs sm:text-sm text-espresso placeholder-subtext focus:outline-none"
            />
            {search && (
              <button type="button" onClick={() => updateFilter('search', '')} className="text-subtext hover:text-espresso">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleNearMeClick}
              disabled={isLocating}
              className="px-3.5 py-2.5 rounded-2xl text-xs font-bold text-espresso bg-cream-100 hover:bg-latte-200 border border-latte transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Navigation className={`w-3.5 h-3.5 text-caramel ${isLocating ? 'animate-spin' : ''}`} />
              <span>Nearest to Me</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                showMap
                  ? 'bg-caramel text-white border-caramel'
                  : 'bg-white text-espresso border-latte hover:bg-cream-100'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>{showMap ? 'Hide Map' : 'Map View'}</span>
            </button>

            <div className="hidden sm:flex items-center bg-cream-100 p-1 rounded-2xl border border-latte">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-espresso shadow-xs' : 'text-subtext hover:text-espresso'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-xl transition-colors ${
                  viewMode === 'list' ? 'bg-white text-espresso shadow-xs' : 'text-subtext hover:text-espresso'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-latte/50">
          {/* City */}
          <select
            value={city}
            onChange={(e) => updateFilter('city', e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-cream-50 border border-latte text-espresso focus:outline-none focus:border-caramel"
          >
            <option value="">All Locations</option>
            <option value="Birtamode">Birtamode</option>
            <option value="Damak">Damak</option>
          </select>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-cream-50 border border-latte text-espresso focus:outline-none focus:border-caramel"
          >
            <option value="">All Moods & Occasions</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>

          {/* Price */}
          <select
            value={price}
            onChange={(e) => updateFilter('price', e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-cream-50 border border-latte text-espresso focus:outline-none focus:border-caramel"
          >
            <option value="">Any Budget</option>
            <option value="budget">Budget (Under NPR 250)</option>
            <option value="moderate">Moderate (NPR 250 - 600)</option>
            <option value="premium">Premium (NPR 600+)</option>
          </select>

          {/* Rating */}
          <select
            value={minRating}
            onChange={(e) => updateFilter('min_rating', e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-cream-50 border border-latte text-espresso focus:outline-none focus:border-caramel"
          >
            <option value="">Any Rating</option>
            <option value="4.5">4.5★ & Above</option>
            <option value="4.0">4.0★ & Above</option>
            <option value="3.5">3.5★ & Above</option>
          </select>

          {/* Facilities */}
          <select
            value={facility}
            onChange={(e) => updateFilter('facility', e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-cream-50 border border-latte text-espresso focus:outline-none focus:border-caramel"
          >
            <option value="">Any Facility</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.slug}>{f.name}</option>
            ))}
          </select>

          {/* Sorting */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs text-subtext font-medium hidden sm:inline">Sort:</span>
            <select
              value={sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-cream-100 border border-latte text-espresso focus:outline-none focus:border-caramel"
            >
              <option value="relevance">Top Relevance</option>
              <option value="highest_rated">Highest Rated</option>
              <option value="most_reviewed">Most Reviewed</option>
              <option value="nearest">Nearest</option>
              <option value="newest">Recently Added</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-latte/40 text-xs">
            <span className="text-subtext font-medium">Active filters:</span>
            {city && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cream-200 text-espresso font-semibold">
                City: {city}
                <button type="button" onClick={() => updateFilter('city', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cream-200 text-espresso font-semibold">
                Mood: {categories.find(c => c.slug === category)?.name || category}
                <button type="button" onClick={() => updateFilter('category', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {price && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cream-200 text-espresso font-semibold">
                Price: {price}
                <button type="button" onClick={() => updateFilter('price', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {minRating && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cream-200 text-espresso font-semibold">
                Min {minRating}★
                <button type="button" onClick={() => updateFilter('min_rating', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-caramel font-bold hover:underline flex items-center gap-1 ml-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Results Container (Map Split View if Map is Open) */}
      {showMap ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 sticky top-24">
            <CafeMap
              cafes={cafes}
              selectedCafeId={selectedMapCafe?.id}
              onSelectCafe={(cafe) => setSelectedMapCafe(cafe)}
              height="600px"
            />
          </div>
          <div className="lg:col-span-5 space-y-4 max-h-[600px] overflow-y-auto pr-1">
            <div className="text-xs font-semibold text-subtext mb-2">
              Showing {cafes.length} {cafes.length === 1 ? 'result' : 'results'} in visible area
            </div>
            {cafes.map((cafe) => (
              <div
                key={cafe.id}
                onClick={() => setSelectedMapCafe(cafe)}
                className={`cursor-pointer rounded-2xl transition-all ${
                  selectedMapCafe?.id === cafe.id ? 'ring-2 ring-caramel' : ''
                }`}
              >
                <CafeCard cafe={cafe} layout="horizontal" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-caramel animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-espresso">Loading curated cafes...</p>
            </div>
          ) : cafes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-latte shadow-warm max-w-lg mx-auto">
              <Sparkles className="w-10 h-10 text-caramel/50 mx-auto mb-3" />
              <h3 className="font-serif text-xl font-bold text-espresso">No matching cafes found</h3>
              <p className="text-xs text-subtext mt-1.5 leading-relaxed">
                Try widening your price range, clearing mood filters, or searching for a neighbouring area like Birtamode or Damak.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-5 px-5 py-2.5 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 transition-colors shadow-warm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'flex flex-col gap-4'
              }
            >
              {cafes.map((cafe) => (
                <CafeCard key={cafe.id} cafe={cafe} layout={viewMode === 'list' ? 'horizontal' : 'grid'} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
