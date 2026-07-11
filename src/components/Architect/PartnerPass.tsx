'use client';

import { useRef, useState } from 'react';
import { getDefaultModel, streamChat } from '@/lib/providers';
import { AIProvider } from '@/lib/providers/types';
import { DECISIONS } from '@/lib/architect/content';
import { soloChoiceText } from '@/lib/architect/export';
import Link from 'next/link';
import {
  partnerSystemPrompt,
  synthesisSystemPrompt,
  synthesisUserMessage,
} from '@/lib/architect/prompts';
import {
  DelegateAnswer,
  EMPTY_PARTNER_DECISION,
  PASS_MINUTES,
  PartnerDecisionState,
  SoloResponse,
  StageStamp,
} from '@/lib/architect/types';
import { DecisionHeader } from './DecisionHeader';
import { Timer } from './Timer';

interface PartnerPassProps {
  provider: AIProvider;
  apiKey: string | null;
  solo: Record<string, SoloResponse>;
  delegateAnswers: Record<string, DelegateAnswer>;
  decisions: Record<string, PartnerDecisionState>;
  synthesis: string;
  stamp: StageStamp | undefined;
  onDecisionChange: (decisionId: string, state: PartnerDecisionState) => void;
  onSynthesisChange: (text: string) => void;
  onFinish: () => void;
}

// Pass 3 — open collaboration, one decision at a time. The student and the AI
// push on each other's justifications and the student records the final call.
export function PartnerPass({
  provider,
  apiKey,
  solo,
  delegateAnswers,
  decisions,
  synthesis,
  stamp,
  onDecisionChange,
  onSynthesisChange,
  onFinish,
}: PartnerPassProps) {
  const [activeId, setActiveId] = useState<string>(DECISIONS[0].id);
  const [draft, setDraft] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDraftingSynthesis, setIsDraftingSynthesis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeDecision = DECISIONS.find((d) => d.id === activeId)!;
  const activeState = decisions[activeId] ?? EMPTY_PARTNER_DECISION;

  // A final is only "done" when the call, its justification, AND the
  // kept/changed declaration are recorded — the justification captures why
  // the call survived the argument, and the declaration is the flip signal
  // the reflection and comparison view are built on.
  const finalDone = (id: string) =>
    (decisions[id]?.finalChoice ?? '').trim().length > 0 &&
    (decisions[id]?.finalJustification ?? '').trim().length > 0 &&
    (decisions[id]?.finalStance ?? null) !== null;
  const finalsDone = DECISIONS.filter((d) => finalDone(d.id));
  const allFinalsDone = finalsDone.length === DECISIONS.length;
  const canFinish = allFinalsDone && synthesis.trim().length > 0;

  // Argued = at least one actual AI reply in this decision's chat (a length
  // check would count a failed request's orphaned student messages).
  // Surfaced, never gated — but skipping the argument should be visible.
  const arguedCount = DECISIONS.filter((d) =>
    (decisions[d.id]?.messages ?? []).some((m) => m.role === 'assistant')
  ).length;

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !apiKey || isStreaming) return;
    setDraft('');
    setError(null);
    setIsStreaming(true);

    const baseMessages = [...activeState.messages, { role: 'user' as const, content: text }];
    onDecisionChange(activeId, { ...activeState, messages: baseMessages });

    abortRef.current = new AbortController();
    let accumulated = '';
    const commit = (content: string) =>
      onDecisionChange(activeId, {
        ...activeState,
        messages: [...baseMessages, { role: 'assistant' as const, content }],
      });

    try {
      await streamChat(provider, {
        apiKey,
        modelName: getDefaultModel(provider),
        systemPrompt: partnerSystemPrompt(
          activeId,
          solo[activeId],
          delegateAnswers[activeId]
        ),
        messages: baseMessages,
        signal: abortRef.current.signal,
        onChunk: (chunk) => {
          accumulated += chunk;
          commit(accumulated);
        },
        onComplete: () => {
          commit(accumulated);
          setIsStreaming(false);
        },
        onError: (err) => {
          setError(err.message);
          setIsStreaming(false);
        },
      });
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
      setIsStreaming(false);
    }
  };

  const draftSynthesis = async () => {
    if (!apiKey || isDraftingSynthesis) return;
    setIsDraftingSynthesis(true);
    setError(null);
    let accumulated = '';
    try {
      await streamChat(provider, {
        apiKey,
        modelName: getDefaultModel(provider),
        systemPrompt: synthesisSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: synthesisUserMessage(
              DECISIONS.map((d) => ({
                id: d.id,
                title: d.title,
                choice: decisions[d.id]?.finalChoice ?? '',
                justification: decisions[d.id]?.finalJustification ?? '',
              }))
            ),
          },
        ],
        onChunk: (chunk) => {
          accumulated += chunk;
          onSynthesisChange(accumulated);
        },
        onComplete: () => {
          onSynthesisChange(accumulated);
          setIsDraftingSynthesis(false);
        },
        onError: (err) => {
          setError(err.message);
          setIsDraftingSynthesis(false);
        },
      });
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
      setIsDraftingSynthesis(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Pass 3 — Partner</h1>
          <p className="mt-1 text-sm text-gray-400">
            Decision by decision: push on the AI&apos;s justifications, let it
            push on yours, and record a final call for each. You own the call.
          </p>
        </div>
        <Timer stamp={stamp} minutes={PASS_MINUTES.partner ?? 30} />
      </div>

      {!apiKey && (
        <div className="rounded-lg border border-amber-800/50 bg-amber-900/20 p-3 text-sm text-amber-200">
          No AI key is set, so the chat and synthesis are disabled.{' '}
          <Link href="/" className="underline hover:text-amber-100">
            Set your API key on the main Dojo page
          </Link>{' '}
          (sidebar → API Key) and come back — everything here is saved.
        </div>
      )}

      {/* Decision stepper */}
      <div className="flex flex-wrap gap-2">
        {DECISIONS.map((d) => {
          const done = finalDone(d.id);
          return (
            <button
              key={d.id}
              onClick={() => setActiveId(d.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-mono transition-colors ${
                d.id === activeId
                  ? 'border-emerald-600 bg-emerald-900/40 text-emerald-200'
                  : done
                    ? 'border-gray-700 bg-gray-900 text-emerald-400/80'
                    : 'border-gray-700 bg-gray-900 text-gray-400 hover:bg-gray-800'
              }`}
            >
              {d.id}
              {done ? ' ✓' : ''}
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-4">
        <DecisionHeader decision={activeDecision} />

        {/* Context: solo vs AI, side by side */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded border border-gray-700 bg-gray-950 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
              Your solo call
            </div>
            <p className="mt-1 text-sm text-gray-200">
              {soloChoiceText(activeId, solo[activeId]) || '(not reached)'}
            </p>
            {solo[activeId]?.justification && (
              <p className="mt-1 text-xs text-gray-500">
                {solo[activeId].justification}
              </p>
            )}
          </div>
          <div className="rounded border border-gray-700 bg-gray-950 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-purple-400">
              AI&apos;s delegate call
            </div>
            <p className="mt-1 text-sm text-gray-200">
              {delegateAnswers[activeId]?.choice ?? '(none)'}
            </p>
            {delegateAnswers[activeId]?.justification && (
              <p className="mt-1 text-xs text-gray-500">
                {delegateAnswers[activeId].justification}
              </p>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="space-y-2">
          {activeState.messages.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              Open the argument — e.g. challenge the AI&apos;s justification, or
              test the point you were unsure about.
            </p>
          )}
          {activeState.messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-emerald-900/25 text-gray-100 ml-8'
                  : 'bg-gray-800 text-gray-200 mr-8'
              }`}
            >
              {m.content}
            </div>
          ))}
          {error && (
            <div className="rounded border border-red-800 bg-red-900/30 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={apiKey ? 'Argue it out…' : 'Set an API key on the main page first'}
              rows={2}
              disabled={!apiKey || isStreaming}
              className="flex-1 rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!apiKey || isStreaming || !draft.trim()}
              className="rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-40"
            >
              {isStreaming ? '…' : 'Send'}
            </button>
          </div>
        </div>

        {/* Final call */}
        <div className="rounded border border-emerald-800/50 bg-emerald-900/15 p-3 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Final call for {activeId} — yours to make
          </div>
          <input
            value={activeState.finalChoice}
            onChange={(e) =>
              onDecisionChange(activeId, {
                ...activeState,
                finalChoice: e.target.value,
              })
            }
            placeholder="The final choice, stated concretely…"
            className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder-gray-600"
          />
          <textarea
            value={activeState.finalJustification}
            onChange={(e) =>
              onDecisionChange(activeId, {
                ...activeState,
                finalJustification: e.target.value,
              })
            }
            placeholder="Why this call survived the argument (2–4 sentences)…"
            rows={2}
            className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder-gray-600"
          />
          {/* Kept/changed declaration — this, not text comparison, is what
              "decisions that flipped" is computed from. */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-gray-500">
              Compared to your solo call, this is:
            </span>
            {soloChoiceText(activeId, solo[activeId]).trim() ? (
              <>
                <button
                  onClick={() =>
                    onDecisionChange(activeId, { ...activeState, finalStance: 'kept' })
                  }
                  className={`rounded-lg border px-3 py-1 text-xs transition-colors ${
                    activeState.finalStance === 'kept'
                      ? 'border-emerald-600 bg-emerald-800/50 text-emerald-200'
                      : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  The same call (kept it)
                </button>
                <button
                  onClick={() =>
                    onDecisionChange(activeId, { ...activeState, finalStance: 'changed' })
                  }
                  className={`rounded-lg border px-3 py-1 text-xs transition-colors ${
                    activeState.finalStance === 'changed'
                      ? 'border-sky-600 bg-sky-800/50 text-sky-200'
                      : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  A different call (changed it)
                </button>
              </>
            ) : (
              <button
                onClick={() =>
                  onDecisionChange(activeId, { ...activeState, finalStance: 'new' })
                }
                className={`rounded-lg border px-3 py-1 text-xs transition-colors ${
                  activeState.finalStance === 'new'
                    ? 'border-amber-600 bg-amber-800/50 text-amber-200'
                    : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                }`}
              >
                New — I didn&apos;t answer this one solo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Synthesis */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3">
        <h2 className="font-semibold text-gray-200">
          Synthesis — how the seven calls fit together
        </h2>
        <p className="text-sm text-gray-400">
          {allFinalsDone
            ? 'All finals recorded. Have the AI draft the synthesis paragraph, then edit it until it says what you mean.'
            : `For every decision, record the final call, its justification, and whether you kept or changed your solo call (${finalsDone.length}/${DECISIONS.length}).`}
        </p>
        <button
          onClick={draftSynthesis}
          disabled={!allFinalsDone || !apiKey || isDraftingSynthesis}
          className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 transition-colors disabled:opacity-40"
        >
          {isDraftingSynthesis
            ? 'Drafting…'
            : synthesis
              ? 'Redraft with AI'
              : 'Have the AI draft it'}
        </button>
        <textarea
          value={synthesis}
          onChange={(e) => onSynthesisChange(e.target.value)}
          placeholder="The synthesis paragraph appears here for you to edit…"
          rows={5}
          className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder-gray-600"
        />
      </div>

      <div
        className={`rounded-lg border p-3 text-sm ${
          arguedCount < DECISIONS.length
            ? 'border-amber-800/50 bg-amber-900/15 text-amber-200/90'
            : 'border-gray-800 bg-gray-900 text-gray-400'
        }`}
      >
        You&apos;ve argued {arguedCount} of {DECISIONS.length} decisions with
        the AI.{' '}
        {arguedCount < DECISIONS.length &&
          'Skipping the argument is your call — but the decisions where you disagreed with the AI or marked it as glossing are exactly where the argument earns its keep. This is noted in your run record.'}
      </div>

      <button
        onClick={onFinish}
        disabled={!canFinish}
        className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-40"
      >
        Finish Pass 3 — go to Reflection
      </button>
    </div>
  );
}
