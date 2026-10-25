import React, { useState } from 'react';
import { ThumbsUp, Flag, MessageSquare, AlertCircle, CheckCircle, Calendar, User as UserIcon, Coffee } from 'lucide-react';
import { Review } from '../../types';
import { StarRating } from '../common/StarRating';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface ReviewListProps {
  reviews: Review[];
  cafeId: number;
  averageRating: number | string;
  reviewCount: number;
  onHelpfulClick?: () => void;
  canRespond?: boolean;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  cafeId,
  averageRating,
  reviewCount,
  onHelpfulClick,
  canRespond = false,
}) => {
  const { user } = useAuth();
  const [helpfulCounts, setHelpfulCounts] = useState<Record<number, number>>({});
  const [reportingId, setReportingId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);
  
  // Responding state
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState<string>('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState<boolean>(false);

  const handleHelpful = async (reviewId: number) => {
    if (!user) {
      alert('Please sign in to mark reviews as helpful.');
      return;
    }
    try {
      const res = await api.markReviewHelpful(reviewId);
      setHelpfulCounts((prev) => ({ ...prev, [reviewId]: res.helpful_count }));
      if (onHelpfulClick) onHelpfulClick();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingId || !reportReason) return;
    try {
      await api.reportReview(reportingId, { reason: reportReason });
      setReportSuccess(true);
      setTimeout(() => {
        setReportingId(null);
        setReportReason('');
        setReportSuccess(false);
      }, 2000);
    } catch (err) {
      alert('Failed to report review.');
    }
  };

  const handleSendResponse = async (reviewId: number) => {
    if (!responseText.trim()) return;
    try {
      setIsSubmittingResponse(true);
      await api.respondReview(reviewId, responseText.trim());
      setRespondingId(null);
      setResponseText('');
      window.location.reload(); // Refresh to show business response
    } catch (err: any) {
      alert(err.message || 'Failed to submit response.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const numericAvg = typeof averageRating === 'string' ? parseFloat(averageRating) || 0 : averageRating;

  return (
    <div className="space-y-6">
      {/* Review Aggregates Summary Header */}
      <div className="bg-white rounded-2xl p-6 border border-latte/60 shadow-warm flex flex-col sm:flex-row items-center gap-6 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-espresso text-cream flex flex-col items-center justify-center font-bold shadow-warm">
            <span className="font-serif text-2xl leading-none">{numericAvg.toFixed(1)}</span>
            <span className="text-[10px] text-latte uppercase tracking-widest mt-0.5">Stars</span>
          </div>
          <div>
            <StarRating rating={numericAvg} size="md" showScore={false} />
            <p className="text-xs font-semibold text-espresso mt-1">
              Based on {reviewCount} verified {reviewCount === 1 ? 'review' : 'reviews'}
            </p>
            <p className="text-[11px] text-subtext mt-0.5">
              Only authentic, published customer reviews contribute to this rating.
            </p>
          </div>
        </div>
      </div>

      {/* Reviews Stream */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-latte/60 text-center">
          <MessageSquare className="w-8 h-8 text-caramel/60 mx-auto mb-2" />
          <h4 className="font-serif text-base font-bold text-espresso">No reviews published yet</h4>
          <p className="text-xs text-subtext mt-1 max-w-sm mx-auto">
            Be the first visitor to share your experience, recommend a coffee or pastry, and help fellow explorers!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const count = helpfulCounts[rev.id] !== undefined ? helpfulCounts[rev.id] : rev.helpful_count;
            return (
              <div
                key={rev.id}
                className="bg-white rounded-2xl p-5 border border-latte/60 shadow-warm space-y-3"
              >
                {/* Reviewer Top Bar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-cream-200 text-espresso font-bold flex items-center justify-center text-xs">
                      {rev.user.first_name ? rev.user.first_name[0].toUpperCase() : rev.user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-espresso">
                        {rev.user.first_name ? `${rev.user.first_name} ${rev.user.last_name}` : rev.user.username}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-subtext">
                        <StarRating rating={rev.rating} size="sm" showScore={false} />
                        <span>•</span>
                        <span>{new Date(rev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {rev.visit_date && (
                    <div className="hidden sm:flex items-center gap-1 text-[11px] text-subtext bg-cream-50 px-2 py-0.5 rounded-full border border-latte/40">
                      <Calendar className="w-3 h-3 text-caramel" />
                      <span>Visited {rev.visit_date}</span>
                    </div>
                  )}
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-espresso leading-relaxed whitespace-pre-line">
                  {rev.review_text}
                </p>

                {/* Review Photos if any */}
                {rev.photos && rev.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {rev.photos.map((p) => (
                      <img
                        key={p.id}
                        src={p.image_url}
                        alt="Customer upload"
                        className="w-20 h-20 object-cover rounded-xl border border-latte"
                      />
                    ))}
                  </div>
                )}

                {/* Business Response */}
                {rev.business_response && (
                  <div className="mt-3 p-3.5 rounded-xl bg-cream-100/70 border-l-4 border-caramel space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-espresso flex items-center gap-1.5">
                        <Coffee className="w-3.5 h-3.5 text-caramel" />
                        <span>Response from Cafe Management</span>
                      </span>
                      <span className="text-[10px] text-subtext">
                        {new Date(rev.business_response.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-espresso-700 leading-relaxed italic">
                      "{rev.business_response.response_text}"
                    </p>
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="pt-2 border-t border-latte/40 flex items-center justify-between text-xs text-subtext">
                  <button
                    type="button"
                    onClick={() => handleHelpful(rev.id)}
                    className="flex items-center gap-1.5 hover:text-caramel transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Helpful ({count})</span>
                  </button>

                  <div className="flex items-center gap-3">
                    {canRespond && !rev.business_response && (
                      <button
                        type="button"
                        onClick={() => setRespondingId(rev.id)}
                        className="text-caramel font-semibold hover:underline"
                      >
                        Reply as Owner
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setReportingId(rev.id)}
                      className="flex items-center gap-1 hover:text-rose-600 transition-colors"
                    >
                      <Flag className="w-3 h-3" />
                      <span>Report</span>
                    </button>
                  </div>
                </div>

                {/* Owner Response Input Box */}
                {respondingId === rev.id && (
                  <div className="mt-3 p-3 rounded-xl bg-cream-50 border border-latte space-y-2">
                    <p className="text-xs font-bold text-espresso">Post a public reply to this review:</p>
                    <textarea
                      rows={2}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Thank the visitor or address their feedback respectfully..."
                      className="w-full text-xs p-2.5 rounded-lg border border-latte bg-white text-espresso focus:outline-none focus:border-caramel resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setRespondingId(null)}
                        className="px-3 py-1 text-xs text-subtext hover:text-espresso"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSubmittingResponse}
                        onClick={() => handleSendResponse(rev.id)}
                        className="px-4 py-1 text-xs font-bold bg-caramel text-white rounded-full hover:bg-caramel-600"
                      >
                        {isSubmittingResponse ? 'Posting...' : 'Submit Reply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {reportingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 border border-latte max-w-sm w-full shadow-warm-xl">
            <h4 className="font-serif text-base font-bold text-espresso mb-2">Report Inappropriate Review</h4>
            {reportSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Thank you. Our moderation team has been notified.</span>
              </div>
            ) : (
              <form onSubmit={handleReport} className="space-y-3">
                <p className="text-xs text-subtext">
                  Please select why this review should be flagged for administrator review:
                </p>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-latte bg-white text-espresso focus:outline-none focus:border-caramel"
                  required
                >
                  <option value="">Select reason...</option>
                  <option value="Spam or promotional link">Spam or commercial advertising</option>
                  <option value="Hate speech, profanity, or harassment">Profanity or abusive language</option>
                  <option value="Conflict of interest or competitor smear">Fake or competitor defamation</option>
                  <option value="Irrelevant to this establishment">Wrong cafe or off-topic</option>
                </select>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportingId(null)}
                    className="px-4 py-1.5 text-xs text-subtext"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-full hover:bg-rose-700"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
