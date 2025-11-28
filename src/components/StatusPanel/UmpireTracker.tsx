'use client';

import { UmpireStage, UMPIRE_STAGES, THREE_CS_MAPPING } from '@/lib/types';

interface UmpireTrackerProps {
  currentStage: UmpireStage;
  onStageChange: (stage: UmpireStage) => void;
}

// 3Cs configuration with colors
const THREE_CS_CONFIG = [
  {
    key: 'context',
    name: 'Context',
    color: 'blue',
    stages: THREE_CS_MAPPING.context,
  },
  {
    key: 'choices',
    name: 'Choices',
    color: 'amber',
    stages: THREE_CS_MAPPING.choices,
  },
  {
    key: 'confirmation',
    name: 'Confirmation',
    color: 'emerald',
    stages: THREE_CS_MAPPING.confirmation,
  },
];

function StageButton({
  stage,
  isActive,
  isPast,
  color,
  onClick
}: {
  stage: typeof UMPIRE_STAGES[0];
  isActive: boolean;
  isPast: boolean;
  color: string;
  onClick: () => void;
}) {
  const colorClasses = {
    blue: {
      active: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
      circle: 'border-blue-500 bg-blue-600',
    },
    amber: {
      active: 'bg-amber-600/20 text-amber-400 border-amber-500/30',
      circle: 'border-amber-500 bg-amber-600',
    },
    emerald: {
      active: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
      circle: 'border-emerald-500 bg-emerald-600',
    },
  };

  const colors = colorClasses[color as keyof typeof colorClasses];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2 py-1 rounded transition-colors flex items-center gap-2 ${
        isActive
          ? colors.active
          : isPast
          ? 'text-gray-500'
          : 'text-gray-400 hover:bg-gray-800'
      }`}
      title={stage.description}
    >
      <span
        className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
          isActive
            ? `${colors.circle} text-white`
            : isPast
            ? 'border-gray-600 bg-gray-700 text-gray-500'
            : 'border-gray-600'
        }`}
      >
        {isPast ? '✓' : stage.name[0]}
      </span>
      <span className="text-xs">{stage.name}</span>
    </button>
  );
}

function LoopArrow({ from, to, label }: { from: string; to: string; label?: string }) {
  return (
    <div className="flex items-center justify-center gap-1 py-0.5">
      <div className="flex items-center text-gray-500">
        <span className="text-[10px] text-gray-600">{from}</span>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19 12H5M5 12L9 8M5 12L9 16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[10px] text-gray-600">{to}</span>
      </div>
      {label && <span className="text-[9px] text-gray-600 italic">{label}</span>}
    </div>
  );
}

export function UmpireTracker({ currentStage, onStageChange }: UmpireTrackerProps) {
  const currentIndex = UMPIRE_STAGES.findIndex(s => s.id === currentStage);
  const currentGroupIndex = THREE_CS_CONFIG.findIndex(group =>
    group.stages.includes(currentStage)
  );

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        UMPIRE Cycle
      </h3>

      <div className="space-y-1">
        {THREE_CS_CONFIG.map((group, groupIdx) => {
          const isGroupActive = group.stages.includes(currentStage);
          const isGroupPast = groupIdx < currentGroupIndex;

          const headerColors = {
            context: isGroupActive ? 'text-blue-400' : isGroupPast ? 'text-gray-600' : 'text-gray-500',
            choices: isGroupActive ? 'text-amber-400' : isGroupPast ? 'text-gray-600' : 'text-gray-500',
            confirmation: isGroupActive ? 'text-emerald-400' : isGroupPast ? 'text-gray-600' : 'text-gray-500',
          };

          const borderColors = {
            context: isGroupActive ? 'border-blue-500/30' : 'border-gray-700/50',
            choices: isGroupActive ? 'border-amber-500/30' : 'border-gray-700/50',
            confirmation: isGroupActive ? 'border-emerald-500/30' : 'border-gray-700/50',
          };

          return (
            <div key={group.key}>
              <div className={`border rounded-lg p-1.5 ${borderColors[group.key as keyof typeof borderColors]}`}>
                <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 px-1 ${headerColors[group.key as keyof typeof headerColors]}`}>
                  {group.name}
                </div>
                <div className="space-y-0.5">
                  {group.stages.map((stageId) => {
                    const stage = UMPIRE_STAGES.find(s => s.id === stageId)!;
                    const stageIndex = UMPIRE_STAGES.findIndex(s => s.id === stageId);
                    const isActive = stage.id === currentStage;
                    const isPast = stageIndex < currentIndex;

                    return (
                      <StageButton
                        key={stage.id}
                        stage={stage}
                        isActive={isActive}
                        isPast={isPast}
                        color={group.color}
                        onClick={() => onStageChange(stage.id)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Loop arrows between groups */}
              {groupIdx === 1 && (
                <LoopArrow from="R" to="P" label="iterate" />
              )}
              {groupIdx === 2 && (
                <LoopArrow from="E" to="U" label="restart" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-2 border-t border-gray-800">
        <p className="text-[10px] text-gray-600 italic">
          P-I-R: common iteration loop
        </p>
        <p className="text-[10px] text-gray-600 italic">
          E→U: when goals shift, restart
        </p>
      </div>
    </div>
  );
}
