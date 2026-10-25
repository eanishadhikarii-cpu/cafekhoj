import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, ShieldCheck, TrendingUp, Users, MessageSquare, PlusCircle, CheckCircle, ArrowRight } from 'lucide-react';

export const BusinessLandingPage: React.FC = () => {
  return (
    <div className="space-y-16 py-12 pb-20">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-200 border border-latte text-xs font-semibold text-espresso">
          <Coffee className="w-3.5 h-3.5 text-caramel" />
          <span>CafeKhoj Merchant Network</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-6xl font-bold text-espresso tracking-tight max-w-3xl mx-auto leading-tight">
          Grow Your Cafe Business Across <span className="italic text-caramel">Jhapa</span>
        </h1>
        <p className="text-sm sm:text-base text-subtext max-w-2xl mx-auto leading-relaxed">
          Put your coffee, ambiance, and menu directly in front of thousands of local coffee lovers, students, and visitors searching for their next favourite spot in Birtamode and Damak.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            to="/business/claim"
            className="px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold bg-caramel text-white hover:bg-caramel-600 transition-all shadow-warm flex items-center gap-2"
          >
            <span>Claim Your Free Listing</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/business/billing"
            className="px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold bg-espresso text-cream hover:bg-espresso-700 transition-colors shadow-warm"
          >
            View Pricing & Plans
          </Link>
        </div>
      </section>

      {/* Key Benefits Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-latte shadow-warm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 text-caramel flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-espresso">Verified Ownership</h3>
            <p className="text-xs text-subtext leading-relaxed">
              Showcase a verified authenticity badge. Prevent impersonation and ensure only authorized managers can edit menus, contact details, and hours.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-latte shadow-warm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 text-caramel flex items-center justify-center font-bold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-espresso">Respond to Reviews</h3>
            <p className="text-xs text-subtext leading-relaxed">
              Thank delighted guests, clarify customer queries, and build long-term local trust with official business response privileges.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-latte shadow-warm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 text-caramel flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-espresso">Actionable Analytics</h3>
            <p className="text-xs text-subtext leading-relaxed">
              Understand how many explorers viewed your cafe profile, clicked for Google Maps directions, or visited your website each week.
            </p>
          </div>
        </div>
      </section>

      {/* Transparent Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-caramel">Transparent Investment</span>
          <h2 className="font-serif text-3xl font-bold text-espresso">Plans Built for Local Cafes</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { name: 'Free Explorer', price: '0', period: 'Always Free', feats: ['Verified public listing', 'Basic address & map coordinates', 'Operating hours display', 'Standard search ranking'] },
            { name: 'Featured Showcase', price: '500', period: 'per month', badge: 'Popular', feats: ['Featured showcase badge', 'Priority category ranking', 'Up to 10 photos', 'Directions boost'] },
            { name: 'Premium Business', price: '1,000', period: 'per month', badge: 'Best Value', feats: ['Digital menu & prices editor', 'Official review reply privileges', 'Listing views & clicks analytics', 'Monthly promotional banner'] },
            { name: 'Business Plus', price: '2,000', period: 'per month', feats: ['Homepage hero rotational slot', 'Advanced visitor trends', 'Custom seasonal promotion badge', 'Dedicated Jhapa account manager'] },
          ].map((plan, idx) => (
            <div key={idx} className={`bg-white rounded-3xl p-6 border flex flex-col justify-between ${plan.badge ? 'border-caramel ring-2 ring-caramel/30 shadow-warm-lg' : 'border-latte shadow-warm'}`}>
              <div>
                {plan.badge && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-caramel text-white mb-2">
                    {plan.badge}
                  </span>
                )}
                <h3 className="font-serif text-lg font-bold text-espresso">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-xs font-bold text-subtext">NPR</span>
                  <span className="font-serif text-3xl font-bold text-espresso">{plan.price}</span>
                  <span className="text-xs text-subtext">/{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-xs text-subtext">
                  {plan.feats.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-sage-600 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to={`/business/billing`}
                className="mt-8 w-full py-2.5 rounded-full text-xs font-bold text-center bg-espresso text-cream hover:bg-espresso-700 transition-colors shadow-warm"
              >
                Select {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

