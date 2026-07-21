'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetTime: Date;
  onComplete?: () => void;
}

export function CountdownTimer({ targetTime, onComplete }: CountdownTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const diff = Math.ceil((targetTime.getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    const update = () => {
      const newDiff = Math.ceil((targetTime.getTime() - Date.now()) / 1000);
      const newSeconds = Math.max(0, newDiff);
      setSecondsRemaining(newSeconds);

      if (newSeconds <= 0) {
        clearInterval(interval);
        onComplete?.();
      }
    };

    const interval = setInterval(update, 1000);
    // Immediate async tick so a changed targetTime is reflected right away
    // (state updates stay in timer callbacks, never in the effect body).
    const immediate = setTimeout(update, 0);

    return () => {
      clearInterval(interval);
      clearTimeout(immediate);
    };
  }, [targetTime, onComplete]);

  if (secondsRemaining <= 0) {
    return (
      <span className="text-green-400 font-medium">
        Ready to retry!
      </span>
    );
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <span className="font-mono font-medium text-amber-400">
      {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
    </span>
  );
}
