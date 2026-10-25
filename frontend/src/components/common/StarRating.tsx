import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number | string;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
  showScore?: boolean;
  reviewCount?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onRate,
  showScore = true,
  reviewCount,
}) => {
  const numericRating = typeof rating === 'string' ? parseFloat(rating) || 0 : rating;

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  return (
    <div className="inline-flex items-center gap-1.5" aria-label={`Rating: ${numericRating} out of ${maxStars} stars`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }).map((_, idx) => {
          const starValue = idx + 1;
          const isFilled = starValue <= Math.round(numericRating);
          return (
            <button
              type="button"
              key={idx}
              disabled={!interactive}
              onClick={() => interactive && onRate && onRate(starValue)}
              className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} p-0.5 focus:outline-none`}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-latte-300 fill-latte-100'
                } transition-colors`}
              />
            </button>
          );
        })}
      </div>
      {showScore && (
        <span className="text-xs font-bold text-espresso ml-0.5">
          {numericRating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-xs text-subtext">
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
};

