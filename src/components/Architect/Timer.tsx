'use client';

import { useEffect, useState } from 'react';
import { StageStamp, stampElapsedMs } from '@/lib/architect/types';

interface TimerProps {
  // The pass's stage stamp from the run's process trace. Elapsed time is
  // accumulated ACTIVE time — it pauses while the student reviews an earlier
  // pass, and survives page refreshes.
  stamp: StageStamp | undefined;
  minutes: number;
  paused?: boolean;
}

// Soft, always-visible countdown. Never blocks — running out just changes
// the styling. "Unfinished is fine; attempt credit only."
export function Timer({ stamp, minutes, paused = false }: TimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.round(minutes * 60 - stampElapsedMs(stamp, now) / 1000);
  const overtime = remaining <= 0;
  const closing = !overtime && remaining <= 5 * 60;

  const abs = Math.abs(remaining);
  const mm = Math.floor(abs / 60);
  const ss = String(abs % 60).padStart(2, '0');

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-mono ${
        paused
          ? 'border-gray-700 bg-gray-900 text-gray-500'
          : overtime
            ? 'border-red-700/60 bg-red-900/30 text-red-300'
            : closing
              ? 'border-amber-700/60 bg-amber-900/30 text-amber-300'
              : 'border-gray-700 bg-gray-900 text-gray-300'
      }`}
      title="Soft timebox — it never blocks you; running over is fine and unfinished work still counts"
    >
      <span>⏱</span>
      <span>{overtime ? `+${mm}:${ss} over` : `${mm}:${ss}`}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-60">
        {paused ? 'paused' : 'soft'}
      </span>
    </div>
  );
}
