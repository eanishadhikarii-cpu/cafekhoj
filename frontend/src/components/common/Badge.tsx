import React from 'react';
import { CheckCircle2, AlertCircle, Sparkles, Tag } from 'lucide-react';

interface BadgeProps {
  type: 'verified' | 'sample' | 'sponsored' | 'price' | 'status';
  text?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, text, className = '' }) => {
  if (type === 'verified') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sage-100 text-sage-600 border border-sage-400/40 ${className}`}>
        <CheckCircle2 className="w-3 h-3 text-sage-600" />
        <span>Verified</span>
      </span>
    );
  }

  if (type === 'sample') {
    return (
      <span
        title="Sample demo record - not genuine customer feedback"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-300/60 ${className}`}
      >
        <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
        <span>Sample Data</span>
      </span>
    );
  }

  if (type === 'sponsored') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-caramel/15 text-caramel border border-caramel/40 ${className}`}>
        <Sparkles className="w-3 h-3 text-caramel" />
        <span>Sponsored Placement</span>
      </span>
    );
  }

  if (type === 'price') {
    const labels: Record<string, string> = {
      budget: 'NPR Under 250',
      moderate: 'NPR 250 - 600',
      premium: 'NPR 600+',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cream-200/60 text-espresso-700 border border-latte ${className}`}>
        <Tag className="w-2.5 h-2.5 text-caramel" />
        <span>{labels[text || 'moderate'] || text}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cream-200 text-espresso ${className}`}>
      {text}
    </span>
  );
};

