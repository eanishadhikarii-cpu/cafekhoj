import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Sparkles, Building, PhoneCall, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { SubscriptionPlan, Cafe } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const BusinessBillingPage: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState<number>(0);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethodIntent, setPaymentMethodIntent] = useState('Fonepay / Bank Wire');
  const [notes, setNotes] = useState('');
  const [inquiryResult, setInquiryResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getSubscriptionPlans(), api.getBusinessDashboard()])
      .then(([plansData, dashData]) => {
        setPlans(plansData);
        const managed = dashData.managed_cafes || [];
        setCafes(managed);
        if (managed.length > 0) setSelectedCafeId(managed[0].id);
      })
      .catch(console.error);
  }, []);

  const handleInquire = async (plan: SubscriptionPlan) => {
    if (!selectedCafeId) {
      alert('Please select a cafe first.');
      return;
    }
    setSelectedPlan(plan);
  };

  const handleConfirmInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !selectedCafeId) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const res = await api.inquireSubscription({
        cafe_id: selectedCafeId,
        plan_id: selectedPlan.id,
        payment_method_intent: paymentMethodIntent,
        notes: notes.trim(),
      });
      setInquiryResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit subscription inquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-caramel">Merchant Plans</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso tracking-tight mt-1">
          Subscription & Visibility Plans
        </h1>
        <p className="text-xs sm:text-sm text-subtext mt-1 max-w-xl">
          Upgrade your cafe’s visibility in Birtamode and Jhapa. In compliance with Nepal business guidelines, subscriptions are settled via direct institutional transfers.
        </p>
      </div>

      {/* Cafe Selector */}
      {cafes.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-latte shadow-warm flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-caramel" />
            <span className="text-xs font-bold text-espresso">Applying plan to cafe:</span>
          </div>
          <select
            value={selectedCafeId}
            onChange={(e) => setSelectedCafeId(Number(e.target.value))}
            className="px-3.5 py-1.5 rounded-xl border border-latte bg-cream-50 text-xs font-bold text-espresso focus:outline-none focus:border-caramel"
          >
            {cafes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.location?.city})</option>
            ))}
          </select>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-3xl p-6 border flex flex-col justify-between ${
              plan.code === 'premium' ? 'border-caramel ring-2 ring-caramel/30 shadow-warm-lg' : 'border-latte shadow-warm'
            }`}
          >
            <div>
              {plan.code === 'premium' && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-caramel text-white mb-2">
                  Recommended
                </span>
              )}
              <h3 className="font-serif text-lg font-bold text-espresso">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-xs font-bold text-subtext">NPR</span>
                <span className="font-serif text-3xl font-bold text-espresso">{plan.price}</span>
                <span className="text-xs text-subtext">/{plan.billing_period}</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-subtext">
                {plan.features?.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sage-600 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleInquire(plan)}
              className={`mt-8 w-full py-2.5 rounded-full text-xs font-bold transition-colors ${
                plan.code === 'free'
                  ? 'bg-cream-200 text-espresso hover:bg-latte-200'
                  : 'bg-espresso text-cream hover:bg-espresso-700 shadow-warm'
              }`}
            >
              {plan.code === 'free' ? 'Included by Default' : `Inquire for ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      {/* Inquiry Modal with Nepal Settlement Details */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-latte shadow-warm-xl max-w-lg w-full space-y-4">
            <h3 className="font-serif text-xl font-bold text-espresso">
              Plan Activation Inquiry: {selectedPlan.name}
            </h3>

            {inquiryResult ? (
              <div className="space-y-4 text-center py-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-2 text-xs text-amber-900">
                  <p className="font-bold">Status: {inquiryResult.status.toUpperCase()}</p>
                  <p className="leading-relaxed">{inquiryResult.message}</p>
                  <p className="text-[11px] font-mono text-espresso-700 bg-white/70 p-2 rounded">
                    Reference Code: {inquiryResult.subscription?.payment_reference}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan(null);
                    setInquiryResult(null);
                  }}
                  className="px-6 py-2 rounded-full text-xs font-bold bg-caramel text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmInquiry} className="space-y-4">
                <div className="p-3 rounded-2xl bg-cream-100 text-xs text-espresso space-y-1">
                  <p className="font-bold">Monthly Fee: NPR {selectedPlan.price}</p>
                  <p className="text-subtext leading-relaxed">
                    Per Nepal banking compliance, payments are verified via direct settlement before campaign activation.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{errorMsg}</div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase text-espresso mb-1">
                    Preferred Settlement Method
                  </label>
                  <select
                    value={paymentMethodIntent}
                    onChange={(e) => setPaymentMethodIntent(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso"
                  >
                    <option value="Fonepay Direct QR">Fonepay Direct QR</option>
                    <option value="eSewa / Khalti Corporate Transfer">eSewa / Khalti Corporate Transfer</option>
                    <option value="Institutional Bank Wire (Nepal Investment Mega Bank / Nabil)">Institutional Bank Wire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-espresso mb-1">
                    Additional Instructions or Tax Invoice Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter VAT PAN details if institutional tax invoice is required..."
                    className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(null)}
                    className="px-4 py-2 text-xs text-subtext"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-full text-xs font-bold bg-caramel text-white shadow-warm flex items-center gap-1.5"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Submit Activation Request</span>
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

