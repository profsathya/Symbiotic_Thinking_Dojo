'use client';

import Link from 'next/link';
import { useArchitectState } from '@/hooks/useArchitectState';
import { useApiKey } from '@/hooks/useApiKey';
import { SetupScreen } from '@/components/Architect/SetupScreen';
import { SoloPass } from '@/components/Architect/SoloPass';
import { DelegatePass } from '@/components/Architect/DelegatePass';
import { PartnerPass } from '@/components/Architect/PartnerPass';
import { ReflectionScreen } from '@/components/Architect/ReflectionScreen';
import { CompleteScreen } from '@/components/Architect/CompleteScreen';
import { STAGE_ORDER } from '@/lib/architect/types';

const STAGE_LABELS: Record<string, string> = {
  setup: 'Setup',
  solo: 'Pass 1 · Solo',
  delegate: 'Pass 2 · Delegate',
  partner: 'Pass 3 · Partner',
  reflection: 'Reflection',
  complete: 'Complete',
};

// Architect Studio — a three-pass architecture activity. Lives beside the
// Practice Dojo (not inside its chat-phase engine) because its core mechanic
// is mode gating over structured forms, not guided conversation.
export default function ArchitectPage() {
  const state = useArchitectState();
  const { provider, apiKey } = useApiKey();
  const { run } = state;

  if (!state.isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="text-gray-400">Loading Architect Studio…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header with stage tracker */}
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
              const currentIdx = STAGE_ORDER.indexOf(run.stage);
              const status =
                i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'todo';
              return (
                <span
                  key={stage}
                  className={`whitespace-nowrap rounded px-2 py-1 ${
                    status === 'current'
                      ? 'bg-emerald-900/50 text-emerald-300 font-semibold'
                      : status === 'done'
                        ? 'text-emerald-500/70'
                        : 'text-gray-600'
                  }`}
                >
                  {STAGE_LABELS[stage]}
                </span>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="px-4 py-8">
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
          <CompleteScreen run={run} onReset={state.resetRun} />
        )}
      </main>
    </div>
  );
}
