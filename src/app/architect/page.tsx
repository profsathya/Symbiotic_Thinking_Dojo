'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useArchitectState } from '@/hooks/useArchitectState';
import { useApiKey } from '@/hooks/useApiKey';
import { isCtiEnabled } from '@/lib/providers';
import { SetupScreen } from '@/components/Architect/SetupScreen';
import { SoloPass } from '@/components/Architect/SoloPass';
import { DelegatePass } from '@/components/Architect/DelegatePass';
import { PartnerPass } from '@/components/Architect/PartnerPass';
import { ReflectionScreen } from '@/components/Architect/ReflectionScreen';
import { CompleteScreen } from '@/components/Architect/CompleteScreen';
import { StageReview } from '@/components/Architect/StageReview';
import { ArchitectStage, STAGE_ORDER } from '@/lib/architect/types';
import { urlHasKey, validKeyFromUrl, stripKeyFromUrl } from '@/lib/url-key';

const STAGE_LABELS: Record<string, string> = {
  setup: 'Setup',
  solo: 'Pass 1 · Solo',
  delegate: 'Pass 2 · Delegate',
  partner: 'Pass 3 · Partner',
  reflection: 'Reflection',
  complete: 'Complete',
};

// A key from the URL (#key= preferred, ?key= legacy) that is worth
// persisting: CTI must be enabled in this deployment and the key must pass
// the same length sanity-check the main page uses. Pure read — safe to call
// from a lazy state initializer.
function validCtiKeyFromUrl(): string | null {
  if (!isCtiEnabled()) return null;
  return validKeyFromUrl();
}

// Architect Studio — a three-pass architecture activity. Lives beside the
// Practice Dojo (not inside its chat-phase engine) because its core mechanic
// is mode gating over structured forms, not guided conversation.
export default function ArchitectPage() {
  const state = useArchitectState();
  const { provider, apiKey, setKeyForProvider, setProvider } = useApiKey();
  const { run } = state;

  // Accept a key on the direct URL (#key= preferred, ?key= legacy),
  // mirroring the main page: store it in the CTI provider slot, switch the
  // active provider, and strip it from the visible URL so it doesn't linger
  // in history/screenshots. (Links shaped /?topic=architect with a key are
  // handled by the main page, which persists the key before redirecting
  // here — this covers direct links.) The notice is derived lazily at first
  // render (pure URL read); the effect below only updates external systems —
  // localStorage, history, provider.
  const keyUrlProcessedRef = useRef(false);
  const [keyFromUrlNotice, setKeyFromUrlNotice] = useState(
    () => typeof window !== 'undefined' && validCtiKeyFromUrl() !== null
  );
  useEffect(() => {
    if (keyUrlProcessedRef.current) return;
    keyUrlProcessedRef.current = true;

    if (!urlHasKey()) return;
    const validKey = validCtiKeyFromUrl();

    stripKeyFromUrl();

    if (validKey) {
      setKeyForProvider('cti', validKey);
      setProvider('cti');
    }
  }, [setKeyForProvider, setProvider]);

  // Which stage is being DISPLAYED. null = the current (frontier) stage.
  // Students can navigate back to review any earlier stage read-only; the
  // frontier stage's timer pauses while they do.
  const [viewStage, setViewStage] = useState<ArchitectStage | null>(null);
  const reviewing = viewStage !== null && viewStage !== run.stage;

  // Mid-run escape hatch. Deliberately quiet (small header link) and
  // double-confirmed — it erases a run that may represent an hour of work.
  // The pending confirmation is keyed to the stage it was opened in, so it
  // cannot outlive that stage: finishing Reflection with the banner open
  // must not carry the destructive erase onto the Complete screen, which
  // has its own export-first reset flow.
  const [confirmingResetStage, setConfirmingResetStage] =
    useState<ArchitectStage | null>(null);
  const confirmingReset = confirmingResetStage === run.stage;

  const { pauseStageTimer, resumeStageTimer, isLoaded } = state;
  useEffect(() => {
    if (!isLoaded) return;
    if (reviewing) {
      pauseStageTimer();
    } else {
      // Also covers a refresh that happened while paused: landing back on
      // the frontier stage restarts the active stretch.
      resumeStageTimer();
    }
  }, [reviewing, isLoaded, pauseStageTimer, resumeStageTimer]);

  if (!state.isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="text-gray-400">Loading Architect Studio…</div>
      </div>
    );
  }

  const frontierIdx = STAGE_ORDER.indexOf(run.stage);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header with stage tracker — earlier stages are clickable to review */}
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-950/95 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors shrink-0"
          >
            ← Dojo
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto text-xs">
            {STAGE_ORDER.map((stage, i) => {
              const isPast = i < frontierIdx;
              const isCurrent = i === frontierIdx;
              const isViewed = reviewing ? stage === viewStage : isCurrent;
              const classes = isViewed
                ? reviewing
                  ? 'bg-sky-900/50 text-sky-300 font-semibold'
                  : 'bg-emerald-900/50 text-emerald-300 font-semibold'
                : isPast
                  ? 'text-emerald-500/70 hover:bg-gray-800 cursor-pointer'
                  : isCurrent
                    ? 'text-emerald-300 hover:bg-gray-800 cursor-pointer'
                    : 'text-gray-600';
              return (
                <button
                  key={stage}
                  disabled={!isPast && !isCurrent}
                  onClick={() =>
                    setViewStage(stage === run.stage ? null : stage)
                  }
                  title={
                    isPast
                      ? 'Review this pass (read-only; your current timer pauses)'
                      : isCurrent
                        ? 'Your current pass'
                        : 'Not reached yet'
                  }
                  className={`whitespace-nowrap rounded px-2 py-1 transition-colors ${classes}`}
                >
                  {STAGE_LABELS[stage]}
                </button>
              );
            })}
          </nav>
          {/* Only once there is something to reset; Complete has its own
              reset with export-first guidance. */}
          {run.startedAt && run.stage !== 'complete' ? (
            <button
              onClick={() => setConfirmingResetStage(run.stage)}
              className="shrink-0 text-xs text-gray-600 hover:text-gray-300 transition-colors"
              title="Erase this run and start the activity from the beginning"
            >
              Start over
            </button>
          ) : (
            <span className="w-14 shrink-0" aria-hidden />
          )}
        </div>
      </header>

      <main className="px-4 py-8">
        {keyFromUrlNotice && (
          <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between gap-3 rounded-lg border border-amber-800/50 bg-amber-900/20 p-3 text-sm text-amber-200">
            <span>
              Your CTI key from the link was saved to this browser — the AI
              passes are ready to go.
            </span>
            <button
              onClick={() => setKeyFromUrlNotice(false)}
              className="shrink-0 text-amber-400 hover:text-amber-200 transition-colors"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {confirmingReset && run.stage !== 'complete' && (
          <div className="mx-auto mb-6 max-w-3xl rounded-lg border border-red-800/60 bg-red-900/20 p-4">
            <p className="text-sm text-red-200">
              Start over? This erases your <strong>entire run</strong> — solo
              answers, the AI&apos;s calls and your annotations, every partner
              chat, finals, and reflection. There is no undo, and nothing is
              exported until the Complete screen.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setConfirmingResetStage(null);
                  setViewStage(null);
                  state.resetRun();
                }}
                className="rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Erase everything and start over
              </button>
              <button
                onClick={() => setConfirmingResetStage(null)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Keep my run
              </button>
            </div>
          </div>
        )}

        {reviewing && viewStage && (
          <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between gap-3 rounded-lg border border-sky-800/50 bg-sky-900/20 p-3 text-sm text-sky-200">
            <span>
              Reviewing {STAGE_LABELS[viewStage]} — read-only. Your{' '}
              {STAGE_LABELS[run.stage]} timer is paused.
            </span>
            <button
              onClick={() => setViewStage(null)}
              className="shrink-0 rounded-lg bg-sky-700 px-3 py-1.5 font-semibold text-white hover:bg-sky-600 transition-colors"
            >
              Return to {STAGE_LABELS[run.stage]}
            </button>
          </div>
        )}

        {reviewing && viewStage ? (
          <StageReview stage={viewStage} run={run} />
        ) : (
          <>
            {run.stage === 'setup' && <SetupScreen onStart={state.advanceStage} />}

            {run.stage === 'solo' && (
              <SoloPass
                responses={run.solo}
                stamp={run.timestamps.solo}
                onChange={state.setSoloResponse}
                onFinish={state.advanceStage}
              />
            )}

            {run.stage === 'delegate' && (
              <DelegatePass
                provider={provider}
                apiKey={apiKey}
                answers={run.delegate.answers}
                annotations={run.delegate.annotations}
                stamp={run.timestamps.delegate}
                onResult={state.setDelegateResult}
                onAnnotate={state.setAnnotation}
                onFinish={state.advanceStage}
              />
            )}

            {run.stage === 'partner' && (
              <PartnerPass
                provider={provider}
                apiKey={apiKey}
                solo={run.solo}
                delegateAnswers={run.delegate.answers}
                annotations={run.delegate.annotations}
                decisions={run.partner.decisions}
                synthesis={run.partner.synthesis}
                stamp={run.timestamps.partner}
                onDecisionChange={state.setPartnerDecision}
                onSynthesisChange={state.setSynthesis}
                onFinish={state.advanceStage}
              />
            )}

            {run.stage === 'reflection' && (
              <ReflectionScreen
                run={run}
                stamp={run.timestamps.reflection}
                onChange={state.setReflection}
                onFinish={state.advanceStage}
              />
            )}

            {run.stage === 'complete' && (
              <CompleteScreen run={run} onReset={() => { setViewStage(null); state.resetRun(); }} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
