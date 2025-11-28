'use client';

import { BalanceState } from '@/lib/types';

interface CreatingConsumingBalanceProps {
  balance: BalanceState;
  hasStartedConversation: boolean;
}

export function CreatingConsumingBalance({
  balance,
  hasStartedConversation,
}: CreatingConsumingBalanceProps) {
  // Calculate tilt angle based on score (-10 to +10 maps to -30 to +30 degrees)
  // Negative score (consuming) tilts right, positive (creating) tilts left
  const tiltAngle = -(balance.score / 10) * 30;

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
          {/* The balance bar and pivot */}
          <div className="relative w-full flex flex-col items-center">
            {/* Balance bar - only show after conversation starts */}
            {hasStartedConversation && (
              <div
                className="w-32 h-1 bg-gray-500 rounded-full transition-transform duration-500 ease-out origin-center"
                style={{ transform: `rotate(${tiltAngle}deg)` }}
              >
                {/* Left weight (Creating) */}
                <div
                  className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full bg-green-500 transition-all duration-500"
                  style={{
                    opacity: balance.score > 0 ? 0.5 + (balance.score / 20) : 0.3,
                    transform: `scale(${balance.score > 0 ? 1 + balance.score / 20 : 0.8})`,
                  }}
                />
                {/* Right weight (Consuming) */}
                <div
                  className="absolute -right-1 -top-1.5 w-3 h-3 rounded-full bg-red-500 transition-all duration-500"
                  style={{
                    opacity: balance.score < 0 ? 0.5 + (Math.abs(balance.score) / 20) : 0.3,
                    transform: `scale(${balance.score < 0 ? 1 + Math.abs(balance.score) / 20 : 0.8})`,
                  }}
                />
              </div>
            )}

            {/* Triangle pivot - always visible */}
            <div className="relative mt-1">
              <div
                className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[10px] border-l-transparent border-r-transparent border-b-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Status text */}
        <div className="text-center mt-2">
          {!hasStartedConversation ? (
            <p className="text-xs text-gray-500">
              Start a conversation to see your balance
            </p>
          ) : balance.score > 2 ? (
            <p className="text-xs text-green-400">
              Great critical engagement!
            </p>
          ) : balance.score < -2 ? (
            <p className="text-xs text-red-400">
              Try engaging more deeply
            </p>
          ) : (
            <p className="text-xs text-gray-400">
              {balance.score > 0 ? 'Leaning toward creating' :
               balance.score < 0 ? 'Leaning toward consuming' :
               'Balanced'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
