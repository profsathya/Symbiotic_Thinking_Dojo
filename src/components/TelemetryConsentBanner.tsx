'use client';

/**
 * One-time opt-in ask for anonymous usage statistics.
 *
 * Shown only when a stats endpoint is configured AND the user has never
 * answered. Every way out of the banner is remembered — Yes, No, and the ✕
 * all persist, so the ask happens at most once per browser. Dismissing (✕)
 * counts as "no" (nothing is sent either way); the choice can be changed
 * any time under Help → Usage Statistics.
 */

interface TelemetryConsentBannerProps {
  onDecision: (decision: 'granted' | 'denied') => void;
}

export function TelemetryConsentBanner({ onDecision }: TelemetryConsentBannerProps) {
  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-lg border border-gray-700 bg-gray-900 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-gray-200">
          Help improve the Dojo by sharing anonymous usage statistics?
        </p>
        <button
          onClick={() => onDecision('denied')}
          aria-label="Dismiss (counts as no; change any time in Help → Usage Statistics)"
          title="Dismiss — counts as no; change any time in Help → Usage Statistics"
          className="shrink-0 text-gray-500 transition-colors hover:text-gray-300"
        >
          ✕
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        Only counts are sent — things like number of messages, which activities get used, and
        thinking-level distributions. Never your conversations, your name, or your key. You can
        say no and everything works exactly the same. Your answer is remembered on this browser
        and can be changed any time under Help → Usage Statistics.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onDecision('granted')}
          className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-purple-500"
        >
          Share anonymous stats
        </button>
        <button
          onClick={() => onDecision('denied')}
          className="rounded-md border border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
