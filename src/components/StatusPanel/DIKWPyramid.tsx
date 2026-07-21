'use client';

import { DIKWState, DIKW_LEVELS, DIKW_ORDER } from '@/lib/types';

interface DIKWPyramidProps {
  dikwState: DIKWState;
}

export function DIKWPyramid({ dikwState }: DIKWPyramidProps) {
  const { current, highWaterMark } = dikwState;
  const currentIndex = DIKW_ORDER[current];
  const highWaterIndex = DIKW_ORDER[highWaterMark];


  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        DIKW Pyramid
      </h3>

      <div className="flex gap-3">
        {/* Vertical bar */}
        <div className="relative w-3 flex flex-col-reverse">
          {DIKW_LEVELS.map((level, idx) => {
            const isAtOrBelowHighWater = idx <= highWaterIndex;
            const isCurrent = idx === currentIndex;


            const activeColors = {
              data: 'bg-gray-500',
              information: 'bg-blue-500',
              knowledge: 'bg-emerald-500',
              wisdom: 'bg-purple-500',
            };

            return (
              <div
                key={level.id}
                className={`flex-1 relative transition-all duration-300 ${
                  idx === 0 ? 'rounded-b' : ''
                } ${idx === DIKW_LEVELS.length - 1 ? 'rounded-t' : ''} ${
                  isAtOrBelowHighWater
                    ? activeColors[level.id]
                    : 'bg-gray-800'
                }`}
              >
                {/* Current position indicator */}
                {isCurrent && (
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0 h-0
                    border-t-[5px] border-t-transparent
                    border-r-[6px] border-r-white
                    border-b-[5px] border-b-transparent" />
                )}

                {/* High water mark indicator (only show if different from current) */}
                {idx === highWaterIndex && highWaterIndex !== currentIndex && (
                  <div className="absolute -right-1 top-0 w-2 h-0.5 bg-yellow-400" />
                )}
              </div>
            );
          })}
        </div>

        {/* Labels */}
        <div className="flex flex-col-reverse flex-1 justify-between py-0.5">
          {DIKW_LEVELS.map((level, idx) => {
            const isCurrent = idx === currentIndex;
            const isHighWater = idx === highWaterIndex;
            const isAtOrBelowHighWater = idx <= highWaterIndex;

            const textColors = {
              data: isCurrent ? 'text-gray-300' : 'text-gray-500',
              information: isCurrent ? 'text-blue-400' : isAtOrBelowHighWater ? 'text-blue-500/70' : 'text-gray-500',
              knowledge: isCurrent ? 'text-emerald-400' : isAtOrBelowHighWater ? 'text-emerald-500/70' : 'text-gray-500',
              wisdom: isCurrent ? 'text-purple-400' : isAtOrBelowHighWater ? 'text-purple-500/70' : 'text-gray-500',
            };

            return (
              <div
                key={level.id}
                className={`flex items-center gap-1 transition-colors ${textColors[level.id]}`}
                title={`${level.description}\nQuestions: ${level.questions}`}
              >
                <span className={`text-xs font-medium ${isCurrent ? 'font-bold' : ''}`}>
                  {level.name[0]}
                </span>
                <span className={`text-[10px] ${isCurrent ? '' : 'hidden sm:inline'}`}>
                  {level.name.slice(1)}
                </span>
                {isHighWater && highWaterIndex !== currentIndex && (
                  <span className="text-[9px] text-yellow-500 ml-1">peak</span>
                )}
                {isCurrent && (
                  <span className="text-[9px] ml-1">current</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Guidance text */}
      <div className="pt-1 border-t border-gray-800">
        <p className="text-[10px] text-gray-600 italic">
          {currentIndex < 2 ? (
            <>Ask <span className="text-gray-500">why</span> and <span className="text-gray-500">how</span> to climb higher</>
          ) : currentIndex < 3 ? (
            <>Ask about <span className="text-gray-500">tradeoffs</span> and <span className="text-gray-500">alternatives</span></>
          ) : (
            <>Applying wisdom to novel situations</>
          )}
        </p>
      </div>
    </div>
  );
}
