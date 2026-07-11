'use client';

import { REFLECTION_QUESTIONS } from '@/lib/architect/content';
import {
  arguedDecisions,
  flippedDecisions,
  hasStanceData,
} from '@/lib/architect/export';
import {
  ArchitectRun,
  PASS_MINUTES,
  ReflectionAnswers,
  StageStamp,
} from '@/lib/architect/types';
import { Timer } from './Timer';

interface ReflectionScreenProps {
  run: ArchitectRun;
  stamp: StageStamp | undefined;
  onChange: (answers: ReflectionAnswers) => void;
  onFinish: () => void;
}

// Sensei-guided reflection. This is where the activity's evidence lives:
// what did the student know, or do, that the AI didn't — and how do they know.
export function ReflectionScreen({ run, stamp, onChange, onFinish }: ReflectionScreenProps) {
  const flips = flippedDecisions(run);
  const argued = arguedDecisions(run);
  const allAnswered = REFLECTION_QUESTIONS.every(
    (q) => run.reflection[q.key].trim().length > 0
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Reflection</h1>
          <p className="mt-1 text-sm text-gray-400">
            <span className="font-semibold text-gray-300">Sensei:</span> You
            worked the same problem three ways. These four questions are about
            where your own value came from — answer from the specifics of your
            run, not in general.
          </p>
        </div>
        <Timer stamp={stamp} minutes={PASS_MINUTES.reflection ?? 15} />
      </div>

      <div className="rounded-lg border border-sky-800/50 bg-sky-900/20 p-3 text-sm text-sky-200">
        For reference:{' '}
        {!hasStanceData(run) ? (
          'this run has no kept/changed declarations (recorded before they existed)'
        ) : flips.length > 0 ? (
          <>
            you marked <span className="font-mono">{flips.join(', ')}</span> as
            changed from your solo call
          </>
        ) : (
          'you marked no decision as changed from your solo call'
        )}
        , and you argued {argued.length} of 7 decisions with the AI in the
        partner pass.
      </div>

      {REFLECTION_QUESTIONS.map((q, i) => (
        <div
          key={q.key}
          className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-2"
        >
          <div className="text-sm text-gray-200">
            <span className="font-mono text-gray-500 mr-2">Q{i + 1}</span>
            {q.question}
          </div>
          <textarea
            value={run.reflection[q.key]}
            onChange={(e) =>
              onChange({ ...run.reflection, [q.key]: e.target.value })
            }
            rows={4}
            placeholder="Answer from your run…"
            className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder-gray-600"
          />
        </div>
      ))}

      <button
        onClick={onFinish}
        disabled={!allAnswered}
        className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-40"
      >
        Finish — see the full comparison
      </button>
    </div>
  );
}
