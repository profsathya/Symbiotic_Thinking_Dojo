'use client';

import { useState, useMemo, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useDojoConfig } from '@/hooks/useDojoConfig';
import { useChat } from '@/hooks/useChat';
import { useApiKey } from '@/hooks/useApiKey';
import { MessageList } from '@/components/Chat/MessageList';
import { ChatInput } from '@/components/Chat/ChatInput';
import { INSPIRE_DEMO_TOPIC } from '@/lib/practice-dojo/topics';
import { PracticeDojoContext, Pathway } from '@/lib/practice-dojo/types';
import { isCtiEnabled } from '@/lib/providers';
import { urlHasKey, validKeyFromUrl, stripKeyFromUrl } from '@/lib/url-key';

/**
 * INSPIRE demo — a standalone, mobile-first chat surface for the "Think it
 * through" topic. Unlike the main Dojo (three columns of sidebar / chat /
 * status), this route is JUST the conversation: full-screen, safe-area
 * aware, seamless on a phone. Lives on its own page like Architect Studio.
 *
 * Phase progression is auto-advanced on the model's [NEXT_PHASE] signal so
 * the 2-minute demo flows with no side UI or buttons. Session state is local
 * to this page (not the persisted usePracticeDojoState), so a conference
 * visitor's run never touches a real student's saved Dojo progress.
 */
const LAST_PHASE = INSPIRE_DEMO_TOPIC.phases.length - 1;

export default function InspirePage() {
  const { config } = useDojoConfig();
  const { apiKey, isKeySet, provider, setProvider, setKeyForProvider } = useApiKey();

  const [currentPhase, setCurrentPhase] = useState(1); // engine starts on phase 1
  const [userChoices, setUserChoices] = useState<Record<string, string>>({});
  const [interactionCount, setInteractionCount] = useState(0);
  const [keyDraft, setKeyDraft] = useState('');
  // The model emitted [NEXT_PHASE] — a readiness SIGNAL, not a transition.
  // Per the repo convention the app never advances on it; instead we surface
  // a Continue control and the visitor taps to move on.
  const [senseiReady, setSenseiReady] = useState(false);

  // Client-only flag (idiomatic hydration hook): false on the server and on
  // the first client render, true afterwards — with no setState-in-effect and
  // no hydration mismatch. The key gate reads localStorage, so it must only
  // decide after hydration.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Accept a key from the URL (#key= preferred, ?key= legacy), mirroring the
  // main page and Architect Studio: store it in the CTI slot (the demo's
  // provider), switch to it, and strip it from the visible URL.
  const keyProcessedRef = useRef(false);
  useEffect(() => {
    if (keyProcessedRef.current) return;
    keyProcessedRef.current = true;
    if (!urlHasKey()) return;
    const key = validKeyFromUrl();
    stripKeyFromUrl();
    if (key) {
      const target = isCtiEnabled() ? 'cti' : provider;
      setKeyForProvider(target, key);
      setProvider(target);
    }
  }, [provider, setKeyForProvider, setProvider]);

  const practiceDojoContext = useMemo<PracticeDojoContext | null>(() => {
    const phase = INSPIRE_DEMO_TOPIC.phases[currentPhase];
    if (!phase) return null;
    return {
      topic: INSPIRE_DEMO_TOPIC,
      currentPhase: phase,
      pathway: 'guided' as Pathway,
      completedPhases: Array.from({ length: currentPhase }, (_, i) => i),
      userChoices,
      checkpointStatuses: {},
      phaseSelfChecks: [],
      kataResults: [],
      interactionCount,
    };
  }, [currentPhase, userChoices, interactionCount]);

  const { messages, isLoading, error, sendMessage, startPracticeDojo } = useChat({
    config,
    activeConstruct: 'learn',
    activePartners: [],
    apiKey,
    provider,
    practiceDojoContext,
    onPhaseComplete: () => {
      // [NEXT_PHASE] is a readiness signal — surface the Continue control and
      // let the visitor decide. The button render is gated on the phase, so
      // it's harmless to set this on the final phase.
      setSenseiReady(true);
    },
  });

  // Seed the welcome (door picker) once on mount. This only sets local chat
  // messages — no API call — so it's safe before a key is entered.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startPracticeDojo(INSPIRE_DEMO_TOPIC, 'guided');
  }, [startPracticeDojo]);

  const handleSend = useCallback(
    (message: string) => {
      setInteractionCount((c) => c + 1);
      // A new turn re-derives readiness from the model's next reply.
      setSenseiReady(false);
      sendMessage(message);
    },
    [sendMessage]
  );

  // Full, clean restart: reset phase/choices and re-seed the door picker. Also
  // used by "Try another door" so the fresh door pick is sent under Phase 1's
  // routing prompt, never the stale closing-phase context.
  const handleRestart = useCallback(() => {
    setCurrentPhase(1);
    setUserChoices({});
    setInteractionCount(0);
    setSenseiReady(false);
    startPracticeDojo(INSPIRE_DEMO_TOPIC, 'guided');
  }, [startPracticeDojo]);

  const handleVisualInteraction = useCallback(
    (action: string, data: Record<string, string>) => {
      if (action === 'select' && data.optionTitle) {
        // "Try another door" at the close = a clean slate (resets phase and
        // re-shows the door picker), which also sidesteps sending the new
        // door choice under the Phase-4 prompt.
        if (data.optionId === 'another') {
          handleRestart();
          return;
        }
        if (data.optionId) {
          setUserChoices((c) => ({ ...c, [data.optionId]: data.optionTitle }));
        }
        handleSend(`I choose: ${data.optionTitle}`);
      }
    },
    [handleSend, handleRestart]
  );

  // Student-owned advance: the visitor taps Continue after the Sensei signals.
  const handleContinue = useCallback(() => {
    setSenseiReady(false);
    setCurrentPhase((p) => Math.min(p + 1, LAST_PHASE));
  }, []);

  const handleKeySubmit = () => {
    const key = keyDraft.trim();
    if (key.length < 8) return;
    const target = isCtiEnabled() ? 'cti' : provider;
    setKeyForProvider(target, key);
    setProvider(target);
    setKeyDraft('');
  };

  if (!mounted) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-950 text-gray-400">
        Loading…
      </div>
    );
  }

  // Key gate — a compact, mobile-friendly card when no key is configured.
  if (!isKeySet) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-gray-950 px-6 text-gray-100">
        <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
          <div className="mb-3 text-center text-3xl">🧭</div>
          <h1 className="text-center text-lg font-semibold">Think it through</h1>
          <p className="mt-1 text-center text-sm text-gray-400">
            A two-minute taste of the Dojo. It helps you think — it doesn&apos;t think for you.
          </p>
          <label className="mt-5 block text-xs font-medium text-gray-400" htmlFor="demo-key">
            Enter your demo key to begin
          </label>
          <input
            id="demo-key"
            type="password"
            inputMode="text"
            autoComplete="off"
            value={keyDraft}
            onChange={(e) => setKeyDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleKeySubmit();
            }}
            placeholder="Paste key"
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleKeySubmit}
            disabled={keyDraft.trim().length < 8}
            className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
          >
            Begin
          </button>
          <p className="mt-3 text-center text-[11px] text-gray-600">
            A conference link usually carries the key for you. No key? Ask at the booth.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-gray-950 text-gray-100">
      {/* Slim header — safe-area aware so it clears a notch */}
      <header
        className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-800 bg-gray-950/95 px-4 py-3 backdrop-blur"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-lg">🧭</span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-gray-100">Think it through</h1>
            <p className="truncate text-[11px] text-gray-500">
              It helps you think — it doesn&apos;t think for you.
            </p>
          </div>
        </div>
        <button
          onClick={handleRestart}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
          title="Start over"
        >
          Restart
        </button>
      </header>

      {error && (
        <div className="shrink-0 border-b border-amber-800 bg-amber-900/40 px-4 py-2 text-xs text-amber-200">
          {error}
        </div>
      )}

      {/* Conversation fills the screen */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        onVisualInteraction={handleVisualInteraction}
      />

      {/* Student-owned advance: appears only when the Sensei has signalled the
          step's move looks done. The visitor decides when to move on. */}
      {senseiReady && currentPhase < LAST_PHASE && (
        <div className="shrink-0 border-t border-emerald-800/40 bg-emerald-900/15 px-4 py-2">
          <button
            onClick={handleContinue}
            className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Continue →
          </button>
          <p className="mt-1 text-center text-[11px] text-gray-500">
            Take your time — keep replying above, or move on when you&apos;re ready.
          </p>
        </div>
      )}

      {/* Composer, pinned to the bottom above the home indicator */}
      <div className="shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <ChatInput onSend={handleSend} isLoading={isLoading} minimal placeholder="Type your answer…" />
      </div>

      <Link
        href="/"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-gray-800 focus:px-2 focus:py-1 focus:text-xs"
      >
        Back to the full Dojo
      </Link>
    </div>
  );
}
