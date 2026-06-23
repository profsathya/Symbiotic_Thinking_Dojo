'use client';

import { TopicConfig } from '@/lib/practice-dojo/types';

interface ProgressIndicatorProps {
  topic: TopicConfig;
  currentPhase: number;
  completedPhases: number[];
  onExit?: () => void;
}

export function ProgressIndicator({
  topic,
  currentPhase,
  completedPhases,
  onExit,
}: ProgressIndicatorProps) {
  // Phase 0 is a welcome-owned placeholder (the engine starts on phase 1), so
  // the "real" steps are phases[1..]. Count and number against those, and frame
  // the cue as momentum/arrival rather than an unfinished checklist.
  const totalPhases = topic.phases.length;
  const realTotal = Math.max(1, totalPhases - 1);
  const step = Math.min(Math.max(currentPhase, 1), realTotal);
  const currentPhaseConfig = topic.phases[currentPhase];
  const arrivalIndex = topic.phases.findIndex((p) => p.isArrivalMilestone);
  const hasArrived =
    arrivalIndex >= 0 &&
    (currentPhase >= arrivalIndex || completedPhases.includes(arrivalIndex));
  const progress = Math.min(100, (completedPhases.length / realTotal) * 100);

  return (
    <div className="bg-gray-900/80 border-b border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Topic and Phase Info */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg">{topic.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-200 truncate">
                {topic.title}
              </h3>
              <span className="text-xs px-1.5 py-0.5 bg-purple-900/50 text-purple-300 rounded">
                Practice
              </span>
            </div>
            <p className="text-xs text-gray-400 truncate">
              Step {step} of {realTotal}: {currentPhaseConfig?.title || 'Loading...'}
            </p>
          </div>
        </div>

        {/* Progress Bar - momentum, not a checklist. Turns warm once the
            student reaches the "arrival" step (the core payoff). */}
        <div className="flex-1 max-w-xs hidden sm:block">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r transition-all duration-500 ${
                hasArrived
                  ? 'from-emerald-600 to-teal-500'
                  : 'from-purple-600 to-indigo-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {hasArrived && (
            <p className="text-[10px] text-emerald-400/90 mt-1">
              You&apos;ve reached the heart of it &mdash; anything more is yours to explore.
            </p>
          )}
        </div>

        {/* Exit Button */}
        {onExit && (
          <button
            onClick={onExit}
            className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 rounded transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Exit
          </button>
        )}
      </div>

      {/* Step dots (mobile alternative to progress bar). Phase 0 is the
          welcome placeholder, so it is not shown as a step. The arrival
          step warms to emerald once reached. */}
      <div className="flex items-center justify-center gap-1.5 mt-2 sm:hidden">
        {topic.phases.map((phase, index) => {
          if (index === 0) return null;
          const isArrival = index === arrivalIndex;
          const done = completedPhases.includes(index);
          const current = index === currentPhase;
          return (
            <div
              key={phase.phaseId}
              className={`w-2 h-2 rounded-full transition-colors ${
                done
                  ? isArrival
                    ? 'bg-emerald-500'
                    : 'bg-purple-500'
                  : current
                  ? isArrival
                    ? 'bg-emerald-400 ring-2 ring-emerald-400/30'
                    : 'bg-purple-400 ring-2 ring-purple-400/30'
                  : 'bg-gray-700'
              }`}
              title={`Step ${index}: ${phase.title}`}
            />
          );
        })}
      </div>
    </div>
  );
}
