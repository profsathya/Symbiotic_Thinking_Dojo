'use client';

/**
 * One-time opt-in ask for anonymous usage statistics.
 *
 * Shown only when a stats endpoint is configured AND the user has never
 * answered. Until they answer "share", nothing is sent — declining and
 * ignoring the banner behave identically for data flow; answering just
 * records the choice so we stop asking.
 */

interface TelemetryConsentBannerProps {
  onDecision: (decision: 'granted' | 'denied') => void;
}

export function TelemetryConsentBanner({ onDecision }: TelemetryConsentBannerProps) {
  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-lg border border-gray-700 bg-gray-900 p-4 shadow-xl">
      <p className="text-sm text-gray-200">
        Help improve the Dojo by sharing anonymous usage statistics?
      </p>
      <p className="mt-1 text-xs text-gray-400">
        Only counts are sent — things like number of messages, which activities get used, and
        thinking-level distributions. Never your conversations, your name, or your key. You can
        say no and everything works exactly the same.
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
