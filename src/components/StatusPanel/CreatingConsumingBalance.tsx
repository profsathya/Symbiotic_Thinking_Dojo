'use client';

import { BalanceState, recentBalance } from '@/lib/types';

interface CreatingConsumingBalanceProps {
  balance: BalanceState;
  hasStartedConversation: boolean;
}

/**
 * The Creating–Consuming meter, read as a FORMATIVE NUDGE rather than a score.
 *
 * Two things make that possible. It reads the last few rated turns instead of
 * the running total — a cumulative score pins itself after a handful of good
 * turns and then stops responding to anything, which is why testers saw a
 * meter with no visible relationship to their conversation. And its status
 * line says what to DO next, not how the student is doing: a student who reads
 * "Great critical engagement!" has learned nothing they can act on.
 */
export function CreatingConsumingBalance({
  balance,
  hasStartedConversation,
}: CreatingConsumingBalanceProps) {
  const { mean, count } = recentBalance(balance.history);
  // Deltas run -3..+3, so the mean maps straight onto the beam's ±30°
  const tiltAngle = -(mean / 3) * 30;
  const weight = Math.min(1, Math.abs(mean) / 3);
  // The reason for the LATEST rated turn — not the latest turn that happened to
  // have one. Searching backwards for the most recent non-empty reason meant a
  // bare marker moved the needle while the meter still displayed the
  // explanation for a turn two exchanges ago.
  const reasons = balance.reasons ?? [];
  const lastReason = reasons.length === balance.history.length ? reasons[reasons.length - 1] ?? '' : '';

  // A claim about engagement needs more than a turn or two behind it
  const enoughToJudge = count >= 4;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Creating-Consuming
      </h3>
      <div className="bg-gray-800 rounded-lg p-3">
        {/* Labels */}
        <div className="flex justify-between text-xs mb-2">
          <span className="text-green-400">Creating</span>
          <span className="text-red-400">Consuming</span>
        </div>

        {/* Balance visualization */}
        <div className="relative h-12 flex items-center justify-center">
          <div className="relative w-full flex flex-col items-center">
            {hasStartedConversation && count > 0 && (
              <div
                className="w-32 h-1 bg-gray-500 rounded-full transition-transform duration-500 ease-out origin-center"
                style={{ transform: `rotate(${tiltAngle}deg)` }}
              >
                {/* Left weight (Creating) */}
                <div
                  className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full bg-green-500 transition-all duration-500"
                  style={{
                    opacity: mean > 0 ? 0.5 + weight * 0.5 : 0.3,
                    transform: `scale(${mean > 0 ? 1 + weight * 0.5 : 0.8})`,
                  }}
                />
                {/* Right weight (Consuming) */}
                <div
                  className="absolute -right-1 -top-1.5 w-3 h-3 rounded-full bg-red-500 transition-all duration-500"
                  style={{
                    opacity: mean < 0 ? 0.5 + weight * 0.5 : 0.3,
                    transform: `scale(${mean < 0 ? 1 + weight * 0.5 : 0.8})`,
                  }}
                />
              </div>
            )}

            {/* Triangle pivot - always visible */}
            <div className="relative mt-1">
              <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[10px] border-l-transparent border-r-transparent border-b-gray-400" />
            </div>
          </div>
        </div>

        {/* Status text — a next move, not a verdict */}
        <div className="text-center mt-2">
          {!hasStartedConversation || count === 0 ? (
            <p className="text-xs text-gray-500">Start a conversation to see your balance</p>
          ) : mean <= -1 ? (
            <p className="text-xs text-red-400">
              I&apos;m doing more of the thinking — try answering one in your own words
            </p>
          ) : enoughToJudge && mean >= 1 ? (
            <p className="text-xs text-green-400">You&apos;re driving this one — keep going</p>
          ) : (
            <p className="text-xs text-gray-400">
              Add a reason or a question of your own to tip this
            </p>
          )}
        </div>

        {/* Why it last moved — the meter is only useful if it can be checked */}
        {lastReason && count > 0 && (
          <p className="mt-1.5 text-[10px] text-gray-500 text-center italic">
            last: {lastReason}
          </p>
        )}

        {/* What it is reading, so the number isn't a mystery */}
        {count > 0 && (
          <p className="mt-1 text-[10px] text-gray-600 text-center">
            your last {count} turn{count === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </div>
  );
}
