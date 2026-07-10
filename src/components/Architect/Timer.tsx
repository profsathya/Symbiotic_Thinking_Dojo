'use client';

import { useEffect, useState } from 'react';

interface TimerProps {
  // ISO timestamp the pass started (from the run's process trace), so a page
  // refresh resumes the countdown instead of resetting it.
  enteredAt: string | undefined;
  minutes: number;
}

// Soft, always-visible countdown. Never blocks — running out just changes
// the styling. "Unfinished is fine; attempt credit only."
export function Timer({ enteredAt, minutes }: TimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const startMs = enteredAt ? new Date(enteredAt).getTime() : now;
  const remaining = Math.round(minutes * 60 - (now - startMs) / 1000);
  const overtime = remaining <= 0;
  const closing = !overtime && remaining <= 5 * 60;

  const abs = Math.abs(remaining);
  const mm = Math.floor(abs / 60);
  const ss = String(abs % 60).padStart(2, '0');

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-mono ${
        overtime
          ? 'border-red-700/60 bg-red-900/30 text-red-300'
          : closing
            ? 'border-amber-700/60 bg-amber-900/30 text-amber-300'
            : 'border-gray-700 bg-gray-900 text-gray-300'
      }`}
      title="Soft timer — running over is fine; unfinished work still counts"
    >
      <span>⏱</span>
      <span>
        {overtime ? `+${mm}:${ss} over` : `${mm}:${ss}`}
      </span>
    </div>
  );
}
