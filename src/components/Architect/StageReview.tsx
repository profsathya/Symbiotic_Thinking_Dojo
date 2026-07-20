'use client';

import { REFLECTION_QUESTIONS } from '@/lib/architect/content';
import { runDecisions, soloChoiceText } from '@/lib/architect/export';
import { ArchitectRun, ArchitectStage } from '@/lib/architect/types';
import { DecisionHeader } from './DecisionHeader';
import { SetupScreen } from './SetupScreen';

interface StageReviewProps {
  stage: ArchitectStage;
  run: ArchitectRun;
}

// Read-only view of an earlier pass, for when a student navigates back.
// Reviewing is always allowed; editing is not — the one-way locks are the
// mode gates, and this component simply has no inputs.
export function StageReview({ stage, run }: StageReviewProps) {
  const sheet = runDecisions(run);
  if (stage === 'setup') {
    return <SetupScreen />;
  }

  if (stage === 'solo') {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-xl font-bold text-gray-100">
          Pass 1 — Solo <span className="text-sm font-normal text-gray-500">(locked)</span>
        </h1>
        {sheet.map((d) => {
          const r = run.solo[d.id];
          return (
            <div key={d.id} className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-2">
              <DecisionHeader decision={d} />
              <p className="text-sm text-gray-200">
                {soloChoiceText(d.id, r) || (
                  <span className="italic text-gray-600">not reached</span>
                )}
              </p>
              {r?.justification && (
                <p className="text-xs text-gray-500">{r.justification}</p>
              )}
              {r?.uncertainty && (
                <p className="text-xs text-gray-600 italic">Unsure: {r.uncertainty}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (stage === 'delegate') {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-xl font-bold text-gray-100">
          Pass 2 — Delegate <span className="text-sm font-normal text-gray-500">(locked)</span>
        </h1>
        {sheet.map((d) => {
          const a = run.delegate.answers[d.id];
          const note = run.delegate.annotations[d.id];
          return (
            <div key={d.id} className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-2">
              <DecisionHeader decision={d} />
              <p className="text-sm text-gray-200">{a?.choice ?? '—'}</p>
              {a?.justification && (
                <p className="text-xs text-gray-500">{a.justification}</p>
              )}
              {note?.verdict && (
                <p className="text-xs text-gray-400">
                  Your annotation (
                  {note.verdict === 'glossing'
                    ? "it's glossing over something"
                    : note.verdict === 'dont-know'
                      ? "didn't know"
                      : note.verdict}
                  ){note.note ? `: ${note.note}` : ''}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (stage === 'partner') {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-xl font-bold text-gray-100">
          Pass 3 — Partner <span className="text-sm font-normal text-gray-500">(locked)</span>
        </h1>
        {sheet.map((d) => {
          const p = run.partner.decisions[d.id];
          return (
            <div key={d.id} className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-2">
              <DecisionHeader decision={d} />
              <p className="text-sm text-gray-100">{p?.finalChoice || '—'}</p>
              {p?.finalJustification && (
                <p className="text-xs text-gray-500">{p.finalJustification}</p>
              )}
              {p && p.messages.length > 0 && (
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-300">
                    Argument transcript (
                    {p.messages.filter((m) => m.role === 'assistant').length} exchange
                    {p.messages.filter((m) => m.role === 'assistant').length === 1 ? '' : 's'})
                  </summary>
                  <div className="mt-2 space-y-1.5">
                    {p.messages.map((m, i) => (
                      <p key={i} className="whitespace-pre-wrap">
                        <span className={m.role === 'user' ? 'text-emerald-400' : 'text-purple-400'}>
                          {m.role === 'user' ? 'You: ' : 'AI: '}
                        </span>
                        {m.content}
                      </p>
                    ))}
                  </div>
                </details>
              )}
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
      </div>
    );
  }

  // reflection (and any future stage) — Q/A list
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-100">
        Reflection <span className="text-sm font-normal text-gray-500">(locked)</span>
      </h1>
      {REFLECTION_QUESTIONS.map((q, i) => (
        <div key={q.key} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
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
  );
}
