'use client';

import { useState, useEffect } from 'react';
import { fetchCtiBudget, BudgetInfo } from '@/lib/providers';

interface BudgetIndicatorProps {
  apiKey: string;
}

export function BudgetIndicator({ apiKey }: BudgetIndicatorProps) {
  const [budget, setBudget] = useState<BudgetInfo | null>(null);

  // Fetch whenever the key changes; state lands in the async callback, and
  // the cancelled flag drops stale responses from an unmounted/replaced key.
  useEffect(() => {
    let cancelled = false;
    fetchCtiBudget(apiKey)
      .then((data) => {
        if (!cancelled) setBudget(data);
      })
      .catch(() => {
        // Silently fail — don't block the UI
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  if (!budget) return null;

  const pct = Math.round((budget.remaining_tokens / budget.total_budget) * 100);
  const isLow = pct < 20;
  const isExhausted = pct <= 0;

  if (isExhausted) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-900/40 border border-red-700/50">
        <span className="text-xs font-medium text-red-300">Budget exhausted</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${
      isLow ? 'bg-amber-900/30 border border-amber-700/40' : 'bg-gray-800/50 border border-gray-700/40'
    }`}>
      <div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isLow ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${isLow ? 'text-amber-300' : 'text-gray-400'}`}>
        {pct}%
      </span>
    </div>
  );
}
