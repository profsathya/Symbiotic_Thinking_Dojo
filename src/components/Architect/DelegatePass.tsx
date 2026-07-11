'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { getDefaultModel, streamChat } from '@/lib/providers';
import { AIProvider } from '@/lib/providers/types';
import { DECISIONS } from '@/lib/architect/content';
import { delegateSystemPrompt, parseDelegateAnswers } from '@/lib/architect/prompts';
import {
  AnnotationVerdict,
  DelegateAnnotation,
  DelegateAnswer,
  EMPTY_ANNOTATION,
  PASS_MINUTES,
  StageStamp,
} from '@/lib/architect/types';
import { DecisionHeader } from './DecisionHeader';
import { Timer } from './Timer';

interface DelegatePassProps {
  provider: AIProvider;
  apiKey: string | null;
  answers: Record<string, DelegateAnswer>;
  annotations: Record<string, DelegateAnnotation>;
  stamp: StageStamp | undefined;
  onResult: (raw: string, answers: Record<string, DelegateAnswer>) => void;
  onAnnotate: (decisionId: string, annotation: DelegateAnnotation) => void;
  onFinish: () => void;
}

const VERDICTS: { id: AnnotationVerdict; label: string; active: string }[] = [
  { id: 'agree', label: 'Agree', active: 'bg-emerald-800/60 border-emerald-600 text-emerald-200' },
  { id: 'disagree', label: 'Disagree', active: 'bg-red-800/50 border-red-600 text-red-200' },
  { id: 'glossing', label: "It's glossing over something", active: 'bg-amber-800/50 border-amber-600 text-amber-200' },
  { id: 'dont-know', label: "I don't know", active: 'bg-sky-800/50 border-sky-600 text-sky-200' },
];

// Pass 2 — pure delegation. One prompt, the AI's seven calls, then the
// student's job is judgment: annotate every answer before moving on.
export function DelegatePass({
  provider,
  apiKey,
  answers,
  annotations,
  stamp,
  onResult,
  onAnnotate,
  onFinish,
}: DelegatePassProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamed, setStreamed] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const hasAnswers = Object.keys(answers).length === DECISIONS.length;
  // "I don't know" is complete on its own — demanding a "how you know" note
  // from a student who just said they can't judge would be incoherent.
  const allAnnotated = DECISIONS.every((d) => {
    const a = annotations[d.id];
    return (
      a &&
      a.verdict !== null &&
      (a.verdict === 'dont-know' || a.note.trim().length > 0)
    );
  });

  // Live progress while the AI works the sheet: the response is streamed
  // JSON keyed D1..D7, so counting which keys have appeared is a REAL
  // progress signal, not a spinner.
  const seenDecisions = DECISIONS.filter((d) =>
    streamed.includes(`"${d.id}"`)
  );

  const runDelegate = async () => {
    if (!apiKey) return;
    setIsRunning(true);
    setError(null);
    setStreamed('');
    abortRef.current = new AbortController();

    let accumulated = '';
    try {
      await streamChat(provider, {
        apiKey,
        modelName: getDefaultModel(provider),
        systemPrompt: delegateSystemPrompt(),
        messages: [
          {
            role: 'user',
            content:
              'Make all seven calls now. Respond with the strict JSON object only.',
          },
        ],
        signal: abortRef.current.signal,
        onChunk: (chunk) => {
          accumulated += chunk;
          setStreamed(accumulated);
        },
        onComplete: () => {
          const parsed = parseDelegateAnswers(accumulated);
          if (parsed) {
            onResult(accumulated, parsed);
          } else {
            setError(
              'The AI response could not be parsed into the seven decisions. Retry — this usually resolves on a second attempt.'
            );
          }
          setIsRunning(false);
        },
        onError: (err) => {
          setError(err.message);
          setIsRunning(false);
        },
      });
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Pass 2 — Delegate</h1>
          <p className="mt-1 text-sm text-gray-400">
            The AI gets the same brief and sheet and makes all seven calls
            itself — you don&apos;t co-work the content. Your job here is
            judgment: annotate each answer before moving on.
          </p>
        </div>
        <Timer stamp={stamp} minutes={PASS_MINUTES.delegate ?? 15} />
      </div>

      {!hasAnswers && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3">
          {!apiKey ? (
            <p className="text-sm text-amber-300">
              No AI key is set.{' '}
              <Link href="/" className="underline hover:text-amber-100">
                Open the main Dojo page
              </Link>
              , set your API key (sidebar → API Key), then return here — your
              solo answers are saved and this pass will pick up where you left
              off.
            </p>
          ) : (
            <button
              onClick={runDelegate}
              disabled={isRunning}
              className="w-full rounded-lg bg-purple-700 px-4 py-2.5 font-semibold text-white hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              {isRunning
                ? 'AI is working the sheet…'
                : 'Hand the sheet to the AI'}
            </button>
          )}
          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  {seenDecisions.length === 0
                    ? 'AI is reading the brief…'
                    : seenDecisions.length < DECISIONS.length
                      ? `Working ${seenDecisions[seenDecisions.length - 1].id} — ${seenDecisions.length} of ${DECISIONS.length} decisions drafted`
                      : 'Finishing the last justification…'}
                </span>
                <span className="font-mono">
                  {seenDecisions.length}/{DECISIONS.length}
                </span>
              </div>
              <div className="flex gap-1">
                {DECISIONS.map((d) => (
                  <div
                    key={d.id}
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      streamed.includes(`"${d.id}"`)
                        ? 'bg-purple-500'
                        : 'bg-gray-800'
                    }`}
                    title={d.id}
                  />
                ))}
              </div>
            </div>
          )}
          {error && (
            <div className="rounded border border-red-800 bg-red-900/30 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      )}

      {hasAnswers &&
        DECISIONS.map((decision) => {
          const answer = answers[decision.id];
          const annotation = annotations[decision.id] ?? EMPTY_ANNOTATION;
          return (
            <div
              key={decision.id}
              className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3"
            >
              <DecisionHeader decision={decision} />
              <div className="rounded border border-purple-800/40 bg-purple-900/15 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-purple-400">
                  AI&apos;s call
                </div>
                <p className="mt-1 text-sm text-gray-100">{answer.choice}</p>
                <p className="mt-2 text-sm text-gray-400">{answer.justification}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {VERDICTS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() =>
                      onAnnotate(decision.id, {
                        ...annotation,
                        verdict: v.id,
                        // "I don't know" needs no note; clear any typed one so
                        // hidden stale text can't leak into the record.
                        note: v.id === 'dont-know' ? '' : annotation.note,
                      })
                    }
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      annotation.verdict === v.id
                        ? v.active
                        : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              {annotation.verdict === 'dont-know' ? (
                <p className="text-xs text-sky-300/80">
                  That&apos;s a legitimate answer — no note needed. In Pass 3,
                  the AI will explain this one before you argue it out.
                </p>
              ) : (
                <input
                  value={annotation.note}
                  onChange={(e) =>
                    onAnnotate(decision.id, { ...annotation, note: e.target.value })
                  }
                  placeholder="…and how you know"
                  className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder-gray-600"
                />
              )}
            </div>
          );
        })}

      {hasAnswers && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="text-sm text-gray-400">
            {allAnnotated
              ? 'All seven annotated. In Pass 3 you argue each decision out with the AI and land the final calls.'
              : "Annotate every answer to continue — verdict plus how you know (no note needed for “I don't know”)."}
          </div>
          <button
            onClick={onFinish}
            disabled={!allAnnotated}
            className="mt-3 w-full rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-40"
          >
            Start Pass 3 — Partner
          </button>
        </div>
      )}
    </div>
  );
}
