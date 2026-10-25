import React, { useEffect, useState } from 'react';
import { Sparkles, Plus, AlertCircle, CheckCircle, Calendar, Tag } from 'lucide-react';
import { api } from '../../services/api';
import { Promotion, Cafe } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const BusinessPromotionsPage: React.FC = () => {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCafeId, setSelectedCafeId] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discount, setDiscount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSponsored, setIsSponsored] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getBusinessDashboard(), api.getBusinessPromotions()])
      .then(([dash, promos]) => {
        const managed = dash.managed_cafes || [];
        setCafes(managed);
        if (managed.length > 0) setSelectedCafeId(managed[0].id);
        setPromotions(promos.results || promos);
      })
      .catch(console.error);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafeId) return;
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const startIso = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
      const endIso = endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString();

      const created = await api.createPromotion({
        cafe: selectedCafeId,
        title: title.trim(),
        description: description.trim(),
        start_at: startIso,
        end_at: endIso,
        discount_percentage: discount ? parseInt(discount) : null,
        is_sponsored: isSponsored,
        status: 'active',
      });

      setPromotions((prev) => [created, ...prev]);
      setShowCreate(false);
      setTitle('');
      setDescription('');
      setDiscount('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish promotion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-caramel">Merchant Growth</span>
          <h1 className="font-serif text-3xl font-bold text-espresso">Promotions & Campaigns</h1>
          <p className="text-xs text-subtext mt-1">
            Publish seasonal discounts, breakfast combos, and sponsored campaigns across Jhapa.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 shadow-warm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Promotion</span>
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-3xl p-6 sm:p-8 border border-latte shadow-warm-lg space-y-4">
          <h3 className="font-serif text-lg font-bold text-espresso">Create New Promotion</h3>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-espresso mb-1">Select Cafe</label>
              <select
                value={selectedCafeId}
                onChange={(e) => setSelectedCafeId(Number(e.target.value))}
                className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso"
              >
                {cafes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-espresso mb-1">Discount % (Optional)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="e.g. 15"
                className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-espresso mb-1">Campaign Headline</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 15% Off Handcrafted Pour-Overs this Weekend"
              className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-espresso mb-1">Campaign Details & Terms</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the offer, hours valid, or dine-in conditions..."
              className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso resize-none"
            />
          </div>

          <div className="p-3 rounded-2xl bg-cream-100/70 border border-latte flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              id="sponsoredCheck"
              checked={isSponsored}
              onChange={(e) => setIsSponsored(e.target.checked)}
              className="rounded text-caramel focus:ring-caramel"
            />
            <label htmlFor="sponsoredCheck" className="text-espresso font-semibold cursor-pointer">
              Tag with explicit "Sponsored Placement" badge per advertising policy standards
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs text-subtext">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-full text-xs font-bold bg-caramel text-white shadow-warm">
              {isSubmitting ? 'Publishing...' : 'Publish Promotion'}
            </button>
          </div>
        </form>
      )}

      {/* Promotions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {promotions.map((promo) => (
          <div key={promo.id} className="bg-white rounded-3xl p-6 border border-latte shadow-warm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-caramel">
                {promo.cafe_name || 'Your Cafe'}
              </span>
              {promo.is_sponsored && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-caramel/20 text-caramel">
                  Sponsored Placement
                </span>
              )}
            </div>
            <h3 className="font-serif text-lg font-bold text-espresso">{promo.title}</h3>
            <p className="text-xs text-subtext leading-relaxed">{promo.description}</p>
            {promo.discount_percentage && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                <Tag className="w-3.5 h-3.5" />
                <span>{promo.discount_percentage}% Discount</span>
              </div>
            )}
            <div className="pt-3 border-t border-latte/40 text-[11px] text-subtext flex justify-between items-center">
              <span>Status: <strong className="text-sage-600 capitalize">{promo.status}</strong></span>
              <span>Valid through {new Date(promo.end_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

