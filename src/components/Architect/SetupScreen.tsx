'use client';

import {
  ARCHITECT_JOB,
  CAMPUSMESH_FLOWS,
  CAMPUSMESH_NAME,
  CAMPUSMESH_SUMMARY,
  DECISIONS,
} from '@/lib/architect/content';

interface SetupScreenProps {
  // Omitted when the screen is being reviewed from a later pass — the
  // orientation stays readable all activity long, but there is nothing to
  // start twice.
  onStart?: () => void;
}

// Orientation: the destination has to be vivid before any decision makes sense.
export function SetupScreen({ onStart }: SetupScreenProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">
          Architect Studio: {CAMPUSMESH_NAME}
        </h1>
        <p className="mt-2 text-gray-300">{CAMPUSMESH_SUMMARY}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-200">
          The two flows you are building
        </h2>
        {CAMPUSMESH_FLOWS.map((flow) => (
          <div
            key={flow.title}
            className="rounded-lg border border-gray-800 bg-gray-900 p-4"
          >
            <div className="font-medium text-emerald-300">{flow.title}</div>
            <p className="mt-1 text-sm text-gray-300">{flow.story}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-purple-800/50 bg-purple-900/20 p-4">
        <h2 className="font-semibold text-purple-300">Your job</h2>
        <p className="mt-1 text-sm text-purple-100/90">{ARCHITECT_JOB}</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-200">
          The seven decisions
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {DECISIONS.map((d) => (
            <li
              key={d.id}
              className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm"
            >
              <span className="font-mono text-gray-500">{d.id}</span>{' '}
              <span className="text-gray-200">{d.title}</span>
              <span className="ml-2 text-xs text-gray-500">{d.theme}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm text-gray-300 space-y-2">
        <h2 className="font-semibold text-gray-200">How the session runs (~90 min)</h2>
        <ol className="list-decimal ml-5 space-y-1">
          <li>
            <strong className="text-gray-100">Solo (25 min).</strong> You work the
            sheet alone — AI is off. Picking is fast; the justifying is the
            thinking. Unfinished is fine.
          </li>
          <li>
            <strong className="text-gray-100">Delegate (15 min).</strong> The AI
            gets the same sheet and makes all seven calls itself. You annotate
            each: agree, disagree, or it&apos;s glossing over something — and how
            you know.
          </li>
          <li>
            <strong className="text-gray-100">Partner (30 min).</strong> Decision
            by decision, you and the AI argue it out and land a final call, then
            close with a synthesis the AI drafts and you edit.
          </li>
          <li>
            <strong className="text-gray-100">Reflection (15 min).</strong> Four
            questions on where your own value came from.
          </li>
        </ol>
        <p className="text-xs text-gray-500">
          Passes are one-way: once you move on, earlier answers lock. That&apos;s
          the point — the contrast between passes is the lesson.
        </p>
      </div>

      {onStart && (
        <button
          onClick={onStart}
          className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          Start Pass 1 — Solo (AI off)
        </button>
      )}
    </div>
  );
}
