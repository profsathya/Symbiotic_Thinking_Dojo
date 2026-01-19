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
  const totalPhases = topic.phases.length;
  const currentPhaseConfig = topic.phases[currentPhase];
  const progress = (completedPhases.length / totalPhases) * 100;

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
              Phase {currentPhase + 1} of {totalPhases}: {currentPhaseConfig?.title || 'Loading...'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 max-w-xs hidden sm:block">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-500">
              {completedPhases.length} completed
            </span>
            <span className="text-[10px] text-gray-500">
              {totalPhases - completedPhases.length} remaining
            </span>
          </div>
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

      {/* Phase dots (mobile alternative to progress bar) */}
      <div className="flex items-center justify-center gap-1.5 mt-2 sm:hidden">
        {topic.phases.map((phase, index) => (
          <div
            key={phase.phaseId}
            className={`w-2 h-2 rounded-full transition-colors ${
              completedPhases.includes(index)
                ? 'bg-purple-500'
                : index === currentPhase
                ? 'bg-purple-400 ring-2 ring-purple-400/30'
                : 'bg-gray-700'
            }`}
            title={`Phase ${index + 1}: ${phase.title}`}
          />
        ))}
      </div>
    </div>
  );
}
