import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Cafe, Location } from '../types';
import { CafeCard } from '../components/common/CafeCard';
import { ChevronRight, MapPin, Coffee } from 'lucide-react';

export const LocationPage: React.FC = () => {
  const { city } = useParams<{ city: string }>();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cityName = city ? city.charAt(0).toUpperCase() + city.slice(1).toLowerCase() : 'Birtamode';

  useEffect(() => {
    if (!city) return;
    setIsLoading(true);
    api.getCafes({ city: cityName })
      .then((res) => {
        setCafes(res.results || res);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [city]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-subtext">
        <Link to="/" className="hover:text-espresso">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/explore" className="hover:text-espresso">Locations</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-espresso">{cityName}</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-latte-100 to-cream-100 rounded-3xl p-8 border border-latte shadow-warm">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-caramel border border-latte">
            <MapPin className="w-3.5 h-3.5" />
            <span>Jhapa District, Nepal</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
            Cafes in {cityName}
          </h1>
          <p className="text-xs sm:text-sm text-subtext leading-relaxed">
            Discover verified coffee spots, student study spaces, and romantic hangout locations in {cityName}, Jhapa.
          </p>
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs font-bold text-subtext uppercase tracking-wider">
            {cafes.length} {cafes.length === 1 ? 'Cafe' : 'Cafes'} in {cityName}
          </span>
          <Link to={`/map`} className="text-xs font-bold text-caramel hover:underline">
            View on Map →
          </Link>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-caramel border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-subtext">Loading {cityName} venues...</p>
          </div>
        ) : cafes.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-latte max-w-md mx-auto">
            <Coffee className="w-8 h-8 text-caramel mx-auto mb-2" />
            <h3 className="font-serif text-lg font-bold text-espresso">No verified venues listed yet in {cityName}</h3>
            <p className="text-xs text-subtext mt-1">Be the first cafe owner in {cityName} to claim and list your business!</p>
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

