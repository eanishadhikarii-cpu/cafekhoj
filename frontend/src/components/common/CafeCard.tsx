import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Navigation, Clock, ShieldCheck } from 'lucide-react';
import { Cafe } from '../../types';
import { StarRating } from './StarRating';
import { Badge } from './Badge';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface CafeCardProps {
  cafe: Cafe;
  layout?: 'grid' | 'horizontal';
  onFavouriteChange?: (cafeId: number, isFav: boolean) => void;
}

export const CafeCard: React.FC<CafeCardProps> = ({ cafe, layout = 'grid', onFavouriteChange }) => {
  const { user } = useAuth();
  const [isFavourited, setIsFavourited] = useState<boolean>(!!cafe.is_favourited);
  const [isTogglingFav, setIsTogglingFav] = useState<boolean>(false);

  const handleToggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    try {
      setIsTogglingFav(true);
      const res = await api.toggleFavourite(cafe.id);
      setIsFavourited(res.is_favourited);
      if (onFavouriteChange) onFavouriteChange(cafe.id, res.is_favourited);
    } catch (err) {
      console.error('Failed to toggle favourite:', err);
    } finally {
      setIsTogglingFav(false);
    }
  };

  const isVerified = cafe.verification_status === 'verified';
  const coverUrl = cafe.cover_image_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80';

  if (layout === 'horizontal') {
    return (
      <div className="group bg-white rounded-2xl p-3 sm:p-4 border border-latte/60 shadow-warm hover:shadow-warm-lg transition-all duration-300 flex flex-col sm:flex-row gap-4 relative overflow-hidden">
        {/* Cover Photo */}
        <Link to={`/cafes/${cafe.slug}`} className="sm:w-56 h-48 sm:h-auto rounded-xl overflow-hidden relative block flex-shrink-0">
          <img
            src={coverUrl}
            alt={cafe.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <button
            type="button"
            onClick={handleToggleFav}
            disabled={isTogglingFav}
            aria-label="Save to favourites"
            className="absolute top-2.5 right-2.5 p-2 rounded-full glass-panel shadow-sm hover:scale-110 active:scale-95 transition-transform focus:outline-none"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavourited ? 'text-rose-500 fill-rose-500' : 'text-espresso/70'
              }`}
            />
          </button>
        </Link>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                {isVerified && <Badge type="verified" />}
                {cafe.is_sample_data && <Badge type="sample" />}
                <Badge type="price" text={cafe.price_range} />
              </div>
              {cafe.distance_km !== undefined && (
                <span className="text-xs font-semibold text-caramel flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  {cafe.distance_km} km away
                </span>
              )}
            </div>

            <Link to={`/cafes/${cafe.slug}`} className="block">
              <h3 className="font-serif text-xl font-bold text-espresso group-hover:text-caramel transition-colors">
                {cafe.name}
              </h3>
            </Link>

            <p className="text-xs text-subtext line-clamp-1 mt-0.5">
              {cafe.tagline || cafe.description}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-subtext mt-2">
              <MapPin className="w-3.5 h-3.5 text-caramel flex-shrink-0" />
              <span className="truncate">{cafe.address}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-latte/40">
            <StarRating rating={cafe.average_rating} reviewCount={cafe.review_count} />
            <Link
              to={`/cafes/${cafe.slug}`}
              className="text-xs font-bold text-caramel hover:text-espresso transition-colors"
            >
              View Menu & Details →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-latte/60 shadow-warm hover:shadow-warm-lg transition-all duration-300 flex flex-col relative">
      {/* Photo Container */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-cream-100">
        <Link to={`/cafes/${cafe.slug}`} className="block w-full h-full">
          <img
            src={coverUrl}
            alt={cafe.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          {isVerified && <Badge type="verified" />}
          {cafe.is_sample_data && <Badge type="sample" />}
        </div>

        {/* Favourite Button */}
        <button
          type="button"
          onClick={handleToggleFav}
          disabled={isTogglingFav}
          aria-label="Save to favourites"
          className="absolute top-3 right-3 p-2 rounded-full glass-panel shadow-sm hover:scale-110 active:scale-95 transition-transform focus:outline-none"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavourited ? 'text-rose-500 fill-rose-500' : 'text-espresso/70'
            }`}
          />
        </button>

        {/* Distance Pill */}
        {cafe.distance_km !== undefined && (
          <div className="absolute bottom-3 left-3 glass-panel px-2.5 py-1 rounded-full text-[11px] font-semibold text-espresso flex items-center gap-1 shadow-sm">
            <Navigation className="w-3 h-3 text-caramel" />
            <span>{cafe.distance_km} km</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <Badge type="price" text={cafe.price_range} />
            <span className="text-[11px] font-medium text-subtext truncate max-w-[120px]">
              {cafe.location?.neighbourhood || cafe.location?.city}
            </span>
          </div>

          <Link to={`/cafes/${cafe.slug}`} className="block">
            <h3 className="font-serif text-lg font-bold text-espresso group-hover:text-caramel transition-colors line-clamp-1">
              {cafe.name}
            </h3>
          </Link>

          <p className="text-xs text-subtext line-clamp-2 mt-1 leading-relaxed">
            {cafe.tagline || cafe.description}
          </p>
        </div>

        <div className="pt-3 mt-3 border-t border-latte/40 flex items-center justify-between">
          <StarRating rating={cafe.average_rating} reviewCount={cafe.review_count} size="sm" />
          <Link
            to={`/cafes/${cafe.slug}`}
            className="text-xs font-bold text-caramel hover:text-espresso transition-colors"
          >
            Explore →
          </Link>
        </div>
      </div>
    </div>
  );
};

