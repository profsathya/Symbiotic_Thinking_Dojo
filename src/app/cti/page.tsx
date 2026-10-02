'use client';

import { useState, useMemo, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { useDojoConfig } from '@/hooks/useDojoConfig';
import { useChat } from '@/hooks/useChat';
import { useApiKey } from '@/hooks/useApiKey';
import { MessageList } from '@/components/Chat/MessageList';
import { ChatInput } from '@/components/Chat/ChatInput';
import {
  CTI_POSTER_TOPIC,
  CTI_POSTER_BOXES,
  CtiPosterBox,
  ctiPosterBoxLabel,
} from '@/lib/practice-dojo/topics/cti-poster';
import { PracticeDojoContext, Pathway } from '@/lib/practice-dojo/types';
import { InspireSaved, restorableMessages } from '@/lib/inspire-session';
import { isBackToPosterCard, visiblePosterMessages } from '@/lib/cti-poster-session';
import { isCtiEnabled } from '@/lib/providers';
import { urlHasKey, validKeyFromUrl, stripKeyFromUrl } from '@/lib/url-key';

/**
 * /cti — the INSPIRE 2026 poster dojo. A standalone mobile page, like
 * /inspire: the opening screen is the poster's nine boxes plus Symbiotic
 * Thinking as tiles; a tap starts the ordinary dojo chat on the `cti-poster`
 * topic with that box sent as the first user message, as a selection card
 * would send it. "Poster" in the header returns to the tiles without
 * clearing the conversation.
 *
 * The session persists under this page's OWN localStorage key, never the
 * shared usePracticeDojoState, so a visitor's refresh resumes their
 * conversation and nothing here can touch a student's saved Dojo progress.
 */
const STORAGE_KEY = 'ctiPosterDojo';

// The topic has one working phase (phases[0] is the welcome placeholder).
const WORKING_PHASE = 1;

const NAVY = '#153857';
const FONT_STACK = "var(--font-jost), -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

const BANDS: { band: 1 | 2 | 3; label: string; edge: string; number: string }[] = [
  { band: 1, label: 'Band 1 · 3 minutes', edge: '#2A6FAD', number: '#2A6FAD' },
  { band: 2, label: 'Band 2 · 5 more minutes', edge: '#2D875E', number: '#2D875E' },
  { band: 3, label: 'Band 3 · The detail', edge: '#9db6cb', number: '#5f7f99' },
];

const WIDE_TILE = CTI_POSTER_BOXES.find((box) => box.band === null);

const NO_CHOICES: Record<string, string> = {};

function loadSaved(): InspireSaved | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InspireSaved) : null;
  } catch {
    return null;
  }
}

function saveSession(state: InspireSaved): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full/unavailable — the in-memory session still works.
  }
}

export default function CtiPosterPage() {
  const { config } = useDojoConfig();
  const { apiKey, isKeySet, provider, setProvider, setKeyForProvider, clearApiKey } = useApiKey();

  // Read once, so a refresh restores the conversation behind the tiles.
  const [initialSaved] = useState<InspireSaved | null>(loadSaved);

  const [view, setView] = useState<'poster' | 'chat'>('poster');
  const [interactionCount, setInteractionCount] = useState(initialSaved?.interactionCount ?? 0);
  const [keyDraft, setKeyDraft] = useState('');

  // False on the server and the first client render, true afterwards: the key
  // gate reads localStorage, so it must only decide after hydration.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Accept a key from the URL (#key= preferred, ?key= legacy) the same way
  // / and /inspire do: store it, switch to it, strip it from the visible URL.
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

  const practiceDojoContext = useMemo<PracticeDojoContext>(
    () => ({
      topic: CTI_POSTER_TOPIC,
      currentPhase: CTI_POSTER_TOPIC.phases[WORKING_PHASE],
      pathway: 'guided' as Pathway,
      completedPhases: [0],
      // Deliberately empty. Whatever is put here is interpolated into the
      // system prompt on every later turn, and a card's id and title are
      // written by the model — which can echo what the visitor typed. The
      // picks are already in the conversation, where they belong.
      userChoices: NO_CHOICES,
      checkpointStatuses: {},
      phaseSelfChecks: [],
      kataResults: [],
      interactionCount,
    }),
    [interactionCount]
  );

  const { messages, isLoading, error, sendMessage, startPracticeDojo, getSerializedMessages, restoreMessages } =
    useChat({
      config,
      activeConstruct: 'learn',
      activePartners: [],
      apiKey,
      provider,
      practiceDojoContext,
    });

  // On mount: restore a saved conversation, else seed the welcome. Both only
  // set local messages — no API call — so it is safe before a key exists.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const restorable = restorableMessages(initialSaved);
    if (restorable.length > 0) {
      restoreMessages(restorable);
    } else {
      startPracticeDojo(CTI_POSTER_TOPIC, 'guided');
    }
  }, [initialSaved, restoreMessages, startPracticeDojo]);

  useEffect(() => {
    if (!mounted || !startedRef.current) return;
    saveSession({
      messages: getSerializedMessages(),
      currentPhase: WORKING_PHASE,
      userChoices: NO_CHOICES,
      interactionCount,
      senseiReady: false,
      // Marks a snapshot taken mid-reply, so the restore drops the partial.
      inFlight: isLoading,
    });
  }, [mounted, messages, isLoading, interactionCount, getSerializedMessages]);

  const handleSend = useCallback(
    (message: string) => {
      setInteractionCount((c) => c + 1);
      sendMessage(message);
    },
    [sendMessage]
  );

  // A tile or a card tapped while a reply is still streaming would be dropped
  // by sendMessage (it returns early while loading). Every tap goes through
  // this one-slot queue instead: it is held and sent as soon as the reply
  // finishes, so a tap is never lost and never counted without being sent.
  const [pendingChoice, setPendingChoice] = useState<string | null>(null);
  useEffect(() => {
    if (pendingChoice === null || isLoading) return;
    const text = pendingChoice;
    // Timer callback keeps the state updates out of the effect body.
    const timer = setTimeout(() => {
      setPendingChoice(null);
      handleSend(text);
    }, 0);
    return () => clearTimeout(timer);
  }, [pendingChoice, isLoading, handleSend]);

  const handlePickBox = useCallback((box: CtiPosterBox) => {
    setView('chat');
    // Same wording a selection card sends.
    setPendingChoice(`I choose: ${ctiPosterBoxLabel(box)}`);
  }, []);

  const handleVisualInteraction = useCallback(
    (action: string, data: Record<string, string>) => {
      if (action !== 'select') return;
      // "Back to the poster" is navigation, not a message.
      if (isBackToPosterCard(data)) {
        setView('poster');
        return;
      }
      const spoken = data.optionTitle?.trim() || data.optionDescription?.trim() || data.optionId?.trim();
      if (!spoken) return;
      setPendingChoice(`I choose: ${spoken}`);
    },
    []
  );

  // A mistyped key passes the gate (any eight characters do) and is only
  // rejected by the backend on the first message. This page has no settings
  // panel, so the error banner carries the way back to the key gate. The
  // conversation is kept.
  const handleChangeKey = useCallback(() => {
    setPendingChoice(null);
    clearApiKey();
  }, [clearApiKey]);

  const handleKeySubmit = () => {
    const key = keyDraft.trim();
    if (key.length < 8) return;
    const target = isCtiEnabled() ? 'cti' : provider;
    setKeyForProvider(target, key);
    setProvider(target);
    setKeyDraft('');
  };

  const chatMessages = useMemo(() => visiblePosterMessages(messages), [messages]);
  const hasConversation = chatMessages.length > 0 || pendingChoice !== null;

  const header = (
    <header
      className="flex shrink-0 items-center gap-[11px] px-4 py-[14px] text-white"
      style={{ background: NAVY, paddingTop: 'max(14px, env(safe-area-inset-top))' }}
    >
      {/* A fixed-height brand mark from /public; next/image adds nothing here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/cti-logo-white.png"
        alt="Computing Talent Initiative"
        width={51}
        height={30}
        className="shrink-0"
        style={{ height: 30, width: 'auto' }}
      />
      <div className="min-w-0 flex-1">
        <h1 className="text-[15.5px] font-semibold leading-tight">Talk to the Sensei about this poster</h1>
        <p className="text-[11px] leading-tight opacity-70">Human Value that Grows with AI Capability</p>
      </div>
      {view === 'chat' && (
        <button
          onClick={() => setView('poster')}
          className="shrink-0 rounded-full px-[11px] py-[7px] text-[12.5px] font-semibold text-white"
          style={{ background: 'rgba(255,255,255,.12)' }}
        >
          Poster
        </button>
      )}
    </header>
  );

  if (!mounted) {
    return (
      <div
        className="flex h-[100dvh] items-center justify-center bg-white text-[#6b7a85]"
        style={{ fontFamily: FONT_STACK }}
      >
        Loading…
      </div>
    );
  }

  // Key gate — the poster's QR code carries the key, so this is the fallback.
  if (!isKeySet) {
    return (
      <div className="flex h-[100dvh] flex-col bg-white text-[#1c2b33]" style={{ fontFamily: FONT_STACK }}>
        {header}
        <div className="flex flex-1 flex-col items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-2xl border-[1.5px] border-[#e6edf1] p-6">
            <h2 className="text-center text-lg font-semibold" style={{ color: NAVY }}>
              Enter your key to begin
            </h2>
            <p className="mt-1 text-center text-sm text-[#6b7a85]">
              The QR code on the poster usually carries it for you. No key? Ask the CTI team at the poster.
            </p>
            <label className="sr-only" htmlFor="cti-key">
              Key
            </label>
            <input
              id="cti-key"
              type="password"
              inputMode="text"
              autoComplete="off"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleKeySubmit();
              }}
              placeholder="Paste key"
              className="mt-4 w-full rounded-lg border-[1.5px] border-[#e6edf1] bg-white px-3 py-2.5 text-sm text-[#1c2b33] placeholder-[#6b7a85] focus:outline-none focus:ring-2 focus:ring-[#2A6FAD]"
            />
            <button
              onClick={handleKeySubmit}
              disabled={keyDraft.trim().length < 8}
              className="mt-3 w-full rounded-lg bg-[#2A6FAD] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Begin
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'poster') {
    return (
      <div className="flex h-[100dvh] justify-center bg-[#c9d4db]" style={{ fontFamily: FONT_STACK }}>
        <div className="flex h-full w-full max-w-[430px] flex-col bg-white text-[#1c2b33]">
          {header}
          <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="px-[22px] pb-1 pt-[22px] text-center">
              <span className="mb-[10px] inline-block text-[11.5px] font-bold uppercase tracking-[.11em] text-[#2A6FAD]">
                3 minutes
              </span>
              <h2 className="mb-[6px] text-[23px] font-bold leading-[1.18]" style={{ color: NAVY }}>
                Which box are you looking at?
              </h2>
              <p className="text-[14.5px] text-[#6b7a85]">
                Tap it. The Sensei will ask what you took from it, then go one layer deeper with you.
              </p>
              {hasConversation && (
                <button
                  onClick={() => setView('chat')}
                  className="mt-3 rounded-full border-[1.5px] border-[#2A6FAD] px-3 py-[6px] text-[13px] font-medium text-[#2A6FAD]"
                >
                  Return to your conversation
                </button>
              )}
            </div>

            {BANDS.map(({ band, label, edge, number }) => (
              <section key={band} className="px-4 pt-[10px]" aria-label={label}>
                <p className="mb-[6px] ml-[2px] text-[10.5px] font-bold uppercase tracking-[.1em] text-[#6b7a85]">
                  {label}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {CTI_POSTER_BOXES.filter((box) => box.band === band).map((box) => (
                    <button
                      key={box.id}
                      onClick={() => handlePickBox(box)}
                      className="flex min-h-[84px] flex-col rounded-xl border-[1.5px] border-[#e6edf1] bg-white px-[9px] pb-[9px] pt-[10px] text-left transition-transform active:scale-[.97]"
                      style={{ borderTop: `4px solid ${edge}` }}
                    >
                      <span className="text-[10.5px] font-bold tracking-[.06em]" style={{ color: number }}>
                        {box.number}
                      </span>
                      <span className="mt-[2px] text-[13px] font-semibold leading-[1.2]" style={{ color: NAVY }}>
                        {box.title}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}

            {WIDE_TILE && (
              <div className="px-4 pt-[10px]">
                <button
                  onClick={() => handlePickBox(WIDE_TILE)}
                  className="flex w-full items-center gap-3 rounded-xl border-[1.5px] border-[#e6edf1] bg-white px-[14px] py-[11px] text-left transition-transform active:scale-[.98]"
                  style={{ borderLeft: '5px solid #d9782a' }}
                >
                  <span className="text-[20px]" aria-hidden="true">
                    🤝
                  </span>
                  <span>
                    <span className="block text-[14.5px] font-semibold" style={{ color: NAVY }}>
                      {WIDE_TILE.title}
                    </span>
                    <span className="block text-[12.5px] text-[#6b7a85]">{WIDE_TILE.description}</span>
                  </span>
                </button>
              </div>
            )}

            <p className="px-[26px] pb-[22px] pt-[14px] text-center text-[12px] text-[#6b7a85]">
              CTI keeps no copy of this conversation. To tell us something,{' '}
              <b style={{ color: NAVY }}>write to Sathya</b> — or just turn around, he is probably right there.
            </p>
          </main>
        </div>
      </div>
    );
  }

  // Chat view: the ordinary dojo chat under the same header.
  return (
    <div className="flex h-[100dvh] justify-center bg-[#c9d4db]" style={{ fontFamily: FONT_STACK }}>
      <div className="flex h-full w-full max-w-[430px] flex-col bg-gray-950 text-gray-100">
        {header}

        {error && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-800 bg-amber-900/40 px-4 py-2 text-xs text-amber-200">
            <span className="min-w-0">{error}</span>
            <button
              onClick={handleChangeKey}
              className="shrink-0 rounded border border-amber-700/60 px-2 py-1 font-semibold text-amber-100"
            >
              Use a different key
            </button>
          </div>
        )}

        <MessageList
          messages={chatMessages}
          isLoading={isLoading || pendingChoice !== null}
          onVisualInteraction={handleVisualInteraction}
        />

        <div className="shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <ChatInput onSend={handleSend} isLoading={isLoading} minimal placeholder="Type your answer…" />
          <p className="pb-2 text-center text-[11px] text-gray-500">
            Symbiotic Thinking Dojo · computingtalentinitiative.org
          </p>
        </div>
      </div>
    </div>
  );
}
