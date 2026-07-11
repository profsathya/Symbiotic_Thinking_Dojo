'use client';

import { useState } from 'react';
import { DECISIONS } from '@/lib/architect/content';
import {
  EMPTY_SOLO_RESPONSE,
  PASS_MINUTES,
  SoloResponse,
  StageStamp,
} from '@/lib/architect/types';
import { DecisionHeader } from './DecisionHeader';
import { Timer } from './Timer';

interface SoloPassProps {
  responses: Record<string, SoloResponse>;
  stamp: StageStamp | undefined;
  onChange: (decisionId: string, response: SoloResponse) => void;
  onFinish: () => void;
}

// Pass 1 — the whole sheet, alone. This component deliberately has no AI
// affordance of any kind: the mode gate is that the capability simply does
// not exist here.
export function SoloPass({ responses, stamp, onChange, onFinish }: SoloPassProps) {
  const [confirming, setConfirming] = useState(false);

  const answeredCount = DECISIONS.filter((d) => {
    const r = responses[d.id];
    return r && (r.optionId || r.ownAnswer.trim()) && r.justification.trim();
  }).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Pass 1 — Solo</h1>
          <p className="mt-1 text-sm text-gray-400">
            AI is off for this pass. For each decision: pick an option or write
            your own, justify it in 2–4 sentences, and note one thing you&apos;re
            unsure about. The justifying is where the thinking is.
          </p>
        </div>
        <Timer enteredAt={stamp?.enteredAt} minutes={PASS_MINUTES.solo ?? 25} />
      </div>

      {DECISIONS.map((decision) => {
        const response = responses[decision.id] ?? EMPTY_SOLO_RESPONSE;
        const update = (patch: Partial<SoloResponse>) =>
          onChange(decision.id, { ...response, ...patch });

        return (
          <div
            key={decision.id}
            className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3"
          >
            <DecisionHeader decision={decision} />

            {decision.options.length > 0 && (
              <div className="space-y-1.5">
                {decision.options.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex items-start gap-2 text-sm text-gray-200 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`${decision.id}-option`}
                      checked={response.optionId === opt.id}
                      onChange={() =>
                        update({
                          optionId: opt.id,
                          // Text typed under "write my own" was a standalone
                          // answer, not a refinement of this preset — carrying
                          // it over would silently corrupt the locked record.
                          ownAnswer:
                            response.optionId === 'own' ? '' : response.ownAnswer,
                        })
                      }
                      className="mt-1 accent-emerald-500"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
                <label className="flex items-start gap-2 text-sm text-gray-200 cursor-pointer">
                  <input
                    type="radio"
                    name={`${decision.id}-option`}
                    checked={response.optionId === 'own'}
                    onChange={() => update({ optionId: 'own' })}
                    className="mt-1 accent-emerald-500"
                  />
                  <span>Write my own</span>
                </label>
              </div>
            )}

            {(decision.options.length === 0 || response.optionId === 'own') && (
              <textarea
                value={response.ownAnswer}
                onChange={(e) => update({ ownAnswer: e.target.value })}
                placeholder={
                  decision.options.length === 0
                    ? 'Your answer…'
                    : 'Your own option…'
                }
                rows={3}
                className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder-gray-600"
              />
            )}
            {decision.options.length > 0 && response.optionId && response.optionId !== 'own' && (
              <input
                value={response.ownAnswer}
                onChange={(e) => update({ ownAnswer: e.target.value })}
                placeholder="Optional: refine the option in your own words (e.g. the signal-loss answer for D1)"
                className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder-gray-600"
              />
            )}

            <textarea
              value={response.justification}
              onChange={(e) => update({ justification: e.target.value })}
              placeholder="Justify your call in 2–4 sentences…"
              rows={3}
              className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder-gray-600"
            />
            <input
              value={response.uncertainty}
              onChange={(e) => update({ uncertainty: e.target.value })}
              placeholder="One thing you're unsure about…"
              className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder-gray-600"
            />
          </div>
        );
      })}

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <div className="text-sm text-gray-400">
          {answeredCount} of {DECISIONS.length} decisions answered with a
          justification. Unfinished is fine — but once you continue, this sheet
          locks and the AI makes its own calls.
        </div>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="mt-3 w-full rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-600 transition-colors"
          >
            Finish solo pass
          </button>
        ) : (
          <div className="mt-3 flex gap-2">
            <button
              onClick={onFinish}
              className="flex-1 rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-600 transition-colors"
            >
              Lock my answers — start Pass 2
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-gray-700 px-4 py-2.5 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Keep working
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
