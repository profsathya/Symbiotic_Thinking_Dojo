'use client';

import { DecisionDef } from '@/lib/architect/types';

const THEME_COLORS: Record<string, string> = {
  Networking: 'text-sky-300 border-sky-800/60 bg-sky-900/20',
  Design: 'text-purple-300 border-purple-800/60 bg-purple-900/20',
  Engineering: 'text-amber-300 border-amber-800/60 bg-amber-900/20',
};

export function DecisionHeader({ decision }: { decision: DecisionDef }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-gray-500">{decision.id}</span>
        <span className="font-semibold text-gray-100">{decision.title}</span>
        <span
          className={`rounded border px-1.5 py-0.5 text-xs ${THEME_COLORS[decision.theme] ?? 'text-gray-400 border-gray-700 bg-gray-900'}`}
        >
          {decision.theme}
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-300">{decision.prompt}</p>
      {decision.subPrompt && (
        <p className="mt-1 text-sm text-gray-400 italic">{decision.subPrompt}</p>
      )}
    </div>
  );
}
