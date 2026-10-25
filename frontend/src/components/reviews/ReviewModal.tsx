import React, { useState } from 'react';
import { Star, X, AlertCircle, Loader2 } from 'lucide-react';
import { StarRating } from '../common/StarRating';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafeId: number;
  cafeName: string;
  onReviewSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  cafeId,
  cafeName,
  onReviewSubmitted,
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [visitDate, setVisitDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Please sign in to post a review.');
      return;
    }
    if (!reviewText.trim()) {
      setErrorMsg('Please write a few words about your experience.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await api.submitReview(cafeId, {
        rating,
        review_text: reviewText.trim(),
        visit_date: visitDate || undefined,
      });
      onReviewSubmitted();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-warm-xl border border-latte overflow-hidden p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-latte/60">
          <div>
            <h3 className="font-serif text-xl font-bold text-espresso">
              Write a Review
            </h3>
            <p className="text-xs text-subtext mt-0.5">
              for <span className="font-semibold text-espresso">{cafeName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-subtext hover:text-espresso hover:bg-cream-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Star Rating Select */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-2">
              Your Overall Rating
            </label>
            <div className="flex items-center gap-2">
              <StarRating
                rating={rating}
                size="lg"
                interactive={true}
                onRate={(newRating) => setRating(newRating)}
                showScore={false}
              />
              <span className="text-sm font-bold text-caramel ml-2">
                {rating === 5 && 'Outstanding ☕'}
                {rating === 4 && 'Very Good 👌'}
                {rating === 3 && 'Average 👍'}
                {rating === 2 && 'Below Expectations'}
                {rating === 1 && 'Poor'}
              </span>
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">
              Your Review & Experience
            </label>
            <textarea
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What made this visit special? How was the coffee, seating, Wi-Fi, or food quality?"
              className="w-full rounded-2xl border border-latte p-3.5 text-xs sm:text-sm text-espresso placeholder-subtext focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel resize-none bg-cream-50/50"
              required
            />
          </div>

          {/* Visit Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">
              Date of Visit (Optional)
            </label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full rounded-xl border border-latte px-3 py-2 text-xs text-espresso focus:outline-none focus:border-caramel bg-white"
            />
          </div>

          {/* Transparency Notice */}
          <div className="p-3 rounded-xl bg-cream-100/60 border border-latte/50 text-[11px] text-subtext leading-relaxed">
            By publishing, you confirm this review reflects your genuine experience as a visitor. Reviews comply with CafeKhoj authenticity and anti-spam standards.
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-subtext hover:text-espresso hover:bg-cream-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 active:scale-95 transition-all shadow-warm flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Submitting...' : 'Post Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

