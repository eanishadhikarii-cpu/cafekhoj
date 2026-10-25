import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Search, CheckCircle, AlertCircle, Coffee, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { Cafe } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const ClaimCafePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedCafeId = searchParams.get('cafe_id');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [role, setRole] = useState('Owner / Founder');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [evidence, setEvidence] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/business/claim');
      return;
    }

    if (preselectedCafeId) {
      api.getCafes().then((res) => {
        const list = res.results || res;
        const match = list.find((c: Cafe) => c.id === Number(preselectedCafeId));
        if (match) setSelectedCafe(match);
      }).catch(console.error);
    }
  }, [user, preselectedCafeId]);

  const handleSearchCafes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await api.getCafes({ search: searchQuery.trim() });
      setCafes(res.results || res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafe) {
      setErrorMsg('Please select a cafe to claim.');
      return;
    }
    if (!evidence.trim()) {
      setErrorMsg('Please provide proof of business authorization.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await api.submitClaim({
        cafe: selectedCafe.id,
        business_role: role,
        contact_phone: phone,
        contact_email: email,
        evidence_reference: evidence.trim(),
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-caramel">Merchant Verification</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
          Claim Your Cafe Listing
        </h1>
        <p className="text-xs sm:text-sm text-subtext max-w-lg mx-auto">
          Verify your ownership or managerial role to unlock the merchant dashboard, manage digital menus, and respond to customer reviews.
        </p>
      </div>

      {isSuccess ? (
        <div className="bg-white rounded-3xl p-10 border border-latte shadow-warm text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-sage-600 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-espresso">Ownership Claim Submitted</h2>
          <p className="text-xs sm:text-sm text-subtext max-w-md mx-auto leading-relaxed">
            Your claim for <span className="font-bold text-espresso">{selectedCafe?.name}</span> has been routed to CafeKhoj administrators. We will verify your credentials and approve management privileges within 24 hours.
          </p>
          <div className="pt-2">
            <Link
              to="/business/dashboard"
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 shadow-warm inline-block"
            >
              Go to Business Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-latte shadow-warm space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Select Cafe */}
          {!selectedCafe ? (
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-bold text-espresso">1. Find Your Cafe in Jhapa</h3>
              <form onSubmit={handleSearchCafes} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter cafe name or address in Birtamode / Damak..."
                  className="flex-1 text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                />
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl text-xs font-bold bg-espresso text-cream hover:bg-espresso-700 shadow-warm"
                >
                  Search
                </button>
              </form>

              {cafes.length > 0 && (
                <div className="divide-y divide-latte/50 border border-latte/60 rounded-2xl overflow-hidden mt-3">
                  {cafes.map((c) => (
                    <div key={c.id} className="p-4 bg-white hover:bg-cream-50 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-serif text-sm font-bold text-espresso">{c.name}</p>
                        <p className="text-xs text-subtext">{c.address}, {c.location?.city}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCafe(c)}
                        className="px-4 py-1.5 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Cafe Summary */}
              <div className="p-4 rounded-2xl bg-cream-100/70 border border-latte flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-caramel">Selected Cafe</span>
                  <p className="font-serif text-base font-bold text-espresso">{selectedCafe.name}</p>
                  <p className="text-xs text-subtext">{selectedCafe.address}, {selectedCafe.location?.city}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCafe(null)}
                  className="text-xs text-subtext hover:text-espresso underline"
                >
                  Change
                </button>
              </div>

              {/* Step 2: Verification Details */}
              <form onSubmit={handleSubmitClaim} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Your Role at Cafe</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                    >
                      <option value="Owner / Founder">Owner / Founder</option>
                      <option value="Cafe Manager">Cafe Manager</option>
                      <option value="Authorized Representative">Authorized Representative</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Contact Phone</label>
                    <input
                      required
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+977-98..."
                      className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Business Email</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">
                    Proof of Ownership / Authorization
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    placeholder="Provide PAN/VAT registration number, Ward/Municipality operating license, or commercial electricity bill reference for validation."
                    className="w-full text-xs p-3.5 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel resize-none"
                  />
                  <p className="text-[11px] text-subtext mt-1">
                    Documents are securely examined by platform administrators only and never shared publicly.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 transition-colors shadow-warm flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'Submitting Claim...' : 'Submit Claim for Verification'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

