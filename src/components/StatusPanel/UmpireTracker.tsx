'use client';

import { UmpireStage, UMPIRE_STAGES } from '@/lib/types';

interface UmpireTrackerProps {
  currentStage: UmpireStage;
  onStageChange: (stage: UmpireStage) => void;
}

export function UmpireTracker({ currentStage, onStageChange }: UmpireTrackerProps) {
  const currentIndex = UMPIRE_STAGES.findIndex(s => s.id === currentStage);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        UMPIRE Stage
      </h3>
      <div className="space-y-1">
        {UMPIRE_STAGES.map((stage, index) => {
          const isActive = stage.id === currentStage;
          const isPast = index < currentIndex;

          return (
            <button
              key={stage.id}
              onClick={() => onStageChange(stage.id)}
              className={`w-full text-left px-3 py-1.5 rounded transition-colors flex items-center gap-2 ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400'
                  : isPast
                  ? 'text-gray-500'
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-600 text-white'
                    : isPast
                    ? 'border-gray-600 bg-gray-700 text-gray-500'
                    : 'border-gray-600'
                }`}
              >
                {isPast ? '✓' : stage.name[0]}
              </span>
              <span className="text-sm">{stage.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
