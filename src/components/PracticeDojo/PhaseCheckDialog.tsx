'use client';

import { useState } from 'react';

interface PhaseCheckDialogProps {
  phaseTitle: string;
  // Student-facing goal for the current phase (studentGoal ?? purpose)
  goal: string;
  // Whether the Sensei has signaled this phase's goal looks met
  senseiSignaled: boolean;
  onCancel: () => void;
  onDecision: (decision: 'continue' | 'advance', response: string) => void;
}

// The "Ready to move on?" self-check. The student — not the model, not the
// engine — decides when a phase is done. The price of moving on is one honest
// sentence about the goal; that sentence is stored, shown to the Sensei in
// the next phase, and is deliberately NOT graded or gated. A student who
// writes "yes I did it" and moves on is exercising exactly the autonomy this
// tool promises; holding themselves to more is the higher-order skill the
// activity practices but cannot enforce.
export function PhaseCheckDialog({
  phaseTitle,
  goal,
  senseiSignaled,
  onCancel,
  onDecision,
}: PhaseCheckDialogProps) {
  const [response, setResponse] = useState('');
  const canDecide = response.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-100">Ready to move on?</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Cancel"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 rounded-lg border border-purple-800/50 bg-purple-900/20 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-purple-400">
            The goal of {phaseTitle}
          </div>
          <p className="mt-1 text-sm text-purple-100/90">{goal}</p>
        </div>

        <p
          className={`mt-2 text-xs ${senseiSignaled ? 'text-emerald-400/90' : 'text-gray-500'}`}
        >
          {senseiSignaled
            ? 'The Sensei has signaled that this phase’s goal looks met.'
            : 'The Sensei hasn’t signaled yet — that’s okay; this is your call.'}
        </p>

        <p className="mt-3 text-sm text-gray-300">
          <span className="font-semibold text-gray-200">Sensei:</span> What
          did you actually do or work out toward this goal? Be honest — this
          check is for you, not for a grade. A sincere &quot;not yet&quot; is
          worth more than a rushed &quot;done&quot;.
        </p>

        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={4}
          autoFocus
          placeholder="In your own words…"
          className="mt-2 w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder-gray-600"
        />

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => onDecision('continue', response.trim())}
            disabled={!canDecide}
            className="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            Continue with this phase — not there yet
          </button>
          <button
            onClick={() => onDecision('advance', response.trim())}
            disabled={!canDecide}
            className="flex-1 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-40"
          >
            Move on to the next phase
          </button>
        </div>
      </div>
    </div>
  );
}
