'use client';

import { DECISIONS, REFLECTION_QUESTIONS } from '@/lib/architect/content';
import {
  arguedDecisions,
  decisionArgued,
  flippedDecisions,
  hasStanceData,
  soloChoiceText,
} from '@/lib/architect/export';
import { ArchitectRun } from '@/lib/architect/types';
import { DecisionHeader } from './DecisionHeader';

const VERDICT_LABELS: Record<string, { label: string; classes: string }> = {
  agree: { label: 'agreed', classes: 'bg-emerald-900/40 text-emerald-300 border-emerald-800' },
  disagree: { label: 'disagreed', classes: 'bg-red-900/40 text-red-300 border-red-800' },
  glossing: { label: 'glossing', classes: 'bg-amber-900/40 text-amber-300 border-amber-800' },
};

// The per-decision comparison the spec calls for: solo | AI | final, side by
// side, with the "decisions that flipped" summary. Pure display — used for
// both the completed run and the shared read-only view.
export function ComparisonView({ run }: { run: ArchitectRun }) {
  const flips = flippedDecisions(run);
  const argued = arguedDecisions(run);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-sky-800/50 bg-sky-900/20 p-4">
        <h2 className="font-semibold text-sky-200">Decisions that flipped</h2>
        <p className="mt-1 text-sm text-sky-100/80">
          {!hasStanceData(run)
            ? 'Flip data is not available for this run — it was recorded before kept/changed declarations existed.'
            : flips.length > 0
              ? `You marked your final call as changed from your solo call on: ${flips.join(', ')}.`
              : 'You kept your solo call on every decision you answered.'}
        </p>
        <p className="mt-1 text-sm text-sky-100/70">
          Argued with the AI on {argued.length} of {DECISIONS.length} decisions
          {argued.length > 0 ? ` (${argued.join(', ')})` : ''}.
        </p>
      </div>

      {DECISIONS.map((decision) => {
        const solo = run.solo[decision.id];
        const ai = run.delegate.answers[decision.id];
        const annotation = run.delegate.annotations[decision.id];
        const partner = run.partner.decisions[decision.id];
        const verdict = annotation?.verdict
          ? VERDICT_LABELS[annotation.verdict]
          : null;

        return (
          <div
            key={decision.id}
            className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <DecisionHeader decision={decision} />
              <div className="flex shrink-0 gap-1.5">
                {partner?.finalStance === 'changed' && (
                  <span className="rounded border border-sky-800 bg-sky-900/40 px-2 py-0.5 text-xs text-sky-300">
                    flipped
                  </span>
                )}
                {partner?.finalStance === 'new' && (
                  <span className="rounded border border-amber-800 bg-amber-900/40 px-2 py-0.5 text-xs text-amber-300">
                    new in pass 3
                  </span>
                )}
                {!decisionArgued(run, decision.id) && (
                  <span className="rounded border border-gray-700 bg-gray-800/60 px-2 py-0.5 text-xs text-gray-400">
                    not argued
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded border border-gray-700 bg-gray-950 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                  Solo
                </div>
                <p className="mt-1 text-sm text-gray-200">
                  {soloChoiceText(decision.id, solo) || '—'}
                </p>
                {solo?.justification && (
                  <p className="mt-2 text-xs text-gray-500">{solo.justification}</p>
                )}
                {solo?.uncertainty && (
                  <p className="mt-1 text-xs text-gray-600 italic">
                    Unsure: {solo.uncertainty}
                  </p>
                )}
              </div>

              <div className="rounded border border-gray-700 bg-gray-950 p-3">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-purple-400">
                    AI (delegate)
                  </div>
                  {verdict && (
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] ${verdict.classes}`}
                    >
                      {verdict.label}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-200">{ai?.choice ?? '—'}</p>
                {ai?.justification && (
                  <p className="mt-2 text-xs text-gray-500">{ai.justification}</p>
                )}
                {annotation?.note && (
                  <p className="mt-1 text-xs text-gray-600 italic">
                    Your note: {annotation.note}
                  </p>
                )}
              </div>

              <div className="rounded border border-emerald-800/60 bg-emerald-900/10 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  Final (partnered)
                </div>
                <p className="mt-1 text-sm text-gray-100">
                  {partner?.finalChoice || '—'}
                </p>
                {partner?.finalJustification && (
                  <p className="mt-2 text-xs text-gray-500">
                    {partner.finalJustification}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {run.partner.synthesis && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h2 className="font-semibold text-gray-200">Synthesis</h2>
          <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">
            {run.partner.synthesis}
          </p>
        </div>
      )}

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-4">
        <h2 className="font-semibold text-gray-200">Reflection</h2>
        {REFLECTION_QUESTIONS.map((q, i) => (
          <div key={q.key}>
            <div className="text-sm text-gray-400">
              <span className="font-mono text-gray-600 mr-2">Q{i + 1}</span>
              {q.question}
            </div>
            <p className="mt-1 text-sm text-gray-200 whitespace-pre-wrap">
              {run.reflection[q.key] || '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
