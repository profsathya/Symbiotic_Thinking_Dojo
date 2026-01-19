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
    // Update immediately in case targetTime changed
    const diff = Math.ceil((targetTime.getTime() - Date.now()) / 1000);
    setSecondsRemaining(Math.max(0, diff));

    const interval = setInterval(() => {
      const newDiff = Math.ceil((targetTime.getTime() - Date.now()) / 1000);
      const newSeconds = Math.max(0, newDiff);
      setSecondsRemaining(newSeconds);

      if (newSeconds <= 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
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
