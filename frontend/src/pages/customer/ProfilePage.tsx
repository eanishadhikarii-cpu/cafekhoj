import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Heart, MessageSquare, Settings, LogOut, CheckCircle, Trash2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { CafeCard } from '../../components/common/CafeCard';
import { StarRating } from '../../components/common/StarRating';
import { Review } from '../../types';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'reviews' | 'favourites' | 'settings'>('profile');
  const [favourites, setFavourites] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Edit form state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/profile');
      return;
    }

    if (location.pathname.includes('/favourites')) {
      setActiveTab('favourites');
    } else if (location.pathname.includes('/reviews')) {
      setActiveTab('reviews');
    } else if (location.pathname.includes('/settings')) {
      setActiveTab('settings');
    }
  }, [location.pathname, user]);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    Promise.all([api.getUserFavourites(), api.getUserReviews()])
      .then(([favRes, revRes]) => {
        setFavourites(favRes.results || favRes);
        setReviews(revRes.results || revRes);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser({ first_name: firstName, last_name: lastName, phone, bio });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to update profile.');
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      alert('Failed to delete review.');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-latte shadow-warm flex flex-col sm:flex-row items-center gap-6 justify-between">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-espresso text-cream font-serif text-2xl font-bold flex items-center justify-center shadow-warm flex-shrink-0">
            {user.first_name ? user.first_name[0].toUpperCase() : user.username[0].toUpperCase()}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-espresso">
              {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
            </h1>
            <p className="text-xs text-subtext">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cream-200 text-espresso-700">
                {user.role}
              </span>
              <span className="text-[11px] text-subtext">
                Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="px-5 py-2.5 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-latte/60 pb-1 overflow-x-auto">
        {[
          { id: 'profile', label: 'Edit Profile', icon: UserIcon },
          { id: 'favourites', label: `Saved Cafes (${favourites.length})`, icon: Heart },
          { id: 'reviews', label: `My Reviews (${reviews.length})`, icon: MessageSquare },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-espresso text-cream shadow-warm'
                  : 'text-subtext hover:text-espresso hover:bg-cream-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Edit Profile */}
      {activeTab === 'profile' && (
        <div className="max-w-xl bg-white rounded-3xl p-6 sm:p-8 border border-latte shadow-warm space-y-4">
          <h2 className="font-serif text-xl font-bold text-espresso">Profile Information</h2>
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Profile details saved successfully!</span>
            </div>
          )}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">First Name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Phone Number</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+977-98..." className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Bio / Coffee Taste</label>
              <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="e.g. Pour-over explorer, dark roast enthusiast, remote worker in Birtamode..." className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel resize-none" />
            </div>
            <button type="submit" className="px-6 py-2.5 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 shadow-warm">
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Saved Favourites */}
      {activeTab === 'favourites' && (
        <div className="space-y-6">
          <h2 className="font-serif text-xl font-bold text-espresso">Your Saved Cafes</h2>
          {favourites.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-latte max-w-md mx-auto">
              <Heart className="w-8 h-8 text-latte-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-espresso">No saved cafes yet</p>
              <p className="text-xs text-subtext mt-1">Tap the heart icon on any cafe card to save it here for quick access.</p>
              <Link to="/explore" className="mt-4 inline-block px-5 py-2 rounded-full text-xs font-bold bg-caramel text-white">
                Discover Cafes
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favourites.map((fav) => (
                <CafeCard
                  key={fav.id}
                  cafe={fav.cafe}
                  onFavouriteChange={() => {
                    setFavourites((prev) => prev.filter((f) => f.id !== fav.id));
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <h2 className="font-serif text-xl font-bold text-espresso">Reviews Written by You</h2>
          {reviews.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-latte max-w-md mx-auto">
              <MessageSquare className="w-8 h-8 text-latte-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-espresso">You haven't posted any reviews yet</p>
              <p className="text-xs text-subtext mt-1">Share your experience at any cafe you have visited in Jhapa!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white rounded-2xl p-5 border border-latte shadow-warm flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/cafes/${rev.cafe_slug}`} className="font-serif text-base font-bold text-espresso hover:text-caramel">
                        {rev.cafe_name}
                      </Link>
                      <StarRating rating={rev.rating} size="sm" showScore={false} />
                    </div>
                    <p className="text-xs text-subtext italic whitespace-pre-line leading-relaxed">
                      "{rev.review_text}"
                    </p>
                    <span className="text-[10px] text-subtext block">
                      Posted on {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(rev.id)}
                      className="p-2 text-subtext hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-xl bg-white rounded-3xl p-6 sm:p-8 border border-latte shadow-warm space-y-6">
          <h2 className="font-serif text-xl font-bold text-espresso">Account Security & Settings</h2>
          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-espresso">Password Management</h3>
            <p className="text-subtext">You can change your password anytime using our secure reset link flow.</p>
            <Link to="/forgot-password" className="inline-block px-4 py-2 rounded-full border border-latte text-xs font-semibold hover:bg-cream-100">
              Request Password Reset Email
            </Link>
          </div>

          <div className="pt-4 border-t border-latte/50 space-y-2 text-xs">
            <h3 className="font-bold text-rose-700">Delete Account</h3>
            <p className="text-subtext">
              Request permanent deletion of your profile and submitted review records in compliance with data privacy regulations.
            </p>
            <button
              type="button"
              onClick={() => alert('Account deletion request submitted. Support will contact you within 48 hours to confirm identity.')}
              className="px-4 py-2 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100"
            >
              Request Account Deletion
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

