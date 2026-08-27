// Core types for Symbiotic Thinking Dojo

// Construct types - the three training environments
export type Construct = 'learn' | 'learn-solve' | 'learn-solve-build';

// Sparring Partner types
export type SparringPartner = 'framer' | 'auditor' | 'connector' | 'challenger' | 'reflector' | 'advocate';

// UMPIRE stages for tracking progress
export type UmpireStage = 'understand' | 'map' | 'plan' | 'implement' | 'review' | 'evaluate';

// Message speaker types
export type Speaker = 'user' | 'sensei' | SparringPartner;

// Chat message structure
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  speaker?: Speaker;
}

// Configuration for a single construct
export interface ConstructConfig {
  id: Construct;
  name: string;
  description: string;
  prompt: string;
}

// Configuration for a single sparring partner
export interface PartnerConfig {
  id: SparringPartner;
  name: string;
  description: string;
  icon: string;
  prompt: string;
}

// Complete Dojo configuration (all prompts)
export interface DojoConfig {
  dojoPrompt: string;
  senseiPrompt: string;
  ikigaiPrompt: string;
  constructs: ConstructConfig[];
  partners: PartnerConfig[];
}

// Active session state
export interface DojoSessionState {
  activeConstruct: Construct;
  activePartners: SparringPartner[];
  umpireStage: UmpireStage;
  messages: Message[];
}

// Combined state for the hook
export interface DojoState extends DojoSessionState {
  config: DojoConfig;
}

// LLM Provider types (for future multi-provider support)
export type LLMProvider = 'claude' | 'openai' | 'gemini';

// Chat request payload
export interface ChatRequest {
  messages: Message[];
  config: DojoConfig;
  activeConstruct: Construct;
  activePartners: SparringPartner[];
  activeModel: string;
  isGuidedPractice?: boolean;
}

// Chat response
export interface ChatResponse {
  content: string;
  speaker: Speaker;
}

// Utility type for construct display info
export const CONSTRUCT_INFO: Record<Construct, { name: string; stakes: string }> = {
  'learn': { name: 'Learn', stakes: 'Low Stakes' },
  'learn-solve': { name: 'Learn + Solve', stakes: 'Medium Stakes' },
  'learn-solve-build': { name: 'Learn + Solve + Build', stakes: 'High Stakes' },
};

// Utility type for UMPIRE stage display
export const UMPIRE_STAGES: { id: UmpireStage; name: string; description: string }[] = [
  { id: 'understand', name: 'Understand', description: 'Grasp the problem deeply' },
  { id: 'map', name: 'Map', description: 'Connect to prior experience' },
  { id: 'plan', name: 'Plan', description: 'Design your approach' },
  { id: 'implement', name: 'Implement', description: 'Execute with intention' },
  { id: 'review', name: 'Review', description: 'Check results and process' },
  { id: 'evaluate', name: 'Evaluate', description: 'Align with goals and values' },
];

// 3Cs mapping to UMPIRE stages
export const THREE_CS_MAPPING = {
  context: ['understand', 'map'] as UmpireStage[],
  choices: ['plan', 'implement'] as UmpireStage[],
  confirmation: ['review', 'evaluate'] as UmpireStage[],
};

// Creating-Consuming Balance types
// Positive = Creating (engaging critically), Negative = Consuming (offloading to AI)
export interface BalanceState {
  score: number;           // Cumulative score (-10 to +10, clamped). Kept for
                           // the export; the LIVE meter reads recentBalance()
                           // instead, because a running total saturates a few
                           // turns in and then stops reflecting the conversation.
  lastDelta: number;       // Last change (-3 to +3)
  consecutiveConsuming: number;  // Count of consecutive consuming interactions
  history: number[];       // History of deltas for this session
  reasons: string[];       // One short reason per delta, in the model's words,
                           // so a nudge can say WHY it moved. Same length as
                           // history; '' when the model gave no reason.
}

export const INITIAL_BALANCE_STATE: BalanceState = {
  score: 0,
  lastDelta: 0,
  consecutiveConsuming: 0,
  history: [],
  reasons: [],
};

// Balance marker regex - the Sensei includes this in responses.
// Format: [BALANCE: +2] or, preferred, [BALANCE: +2 | named her own gap]
// The reason is optional so older sessions and stray markers still parse.
export const BALANCE_MARKER_REGEX = /\[BALANCE:\s*([+-]?\d+)(?:\s*\|\s*([^\]]*))?\]/;

/**
 * What the live meter reads: the mean of the last few rated turns.
 *
 * The cumulative score was the bug behind "the meter has no visible
 * relationship to the conversation" — five good turns pin it at +10 and
 * nothing afterwards moves it. A window keeps the needle attached to what is
 * happening now, which is the only thing a formative nudge can act on.
 */
export function recentBalance(history: number[], window = 5): { mean: number; count: number } {
  // Only real ratings count. An imported or hand-edited session can carry a
  // non-numeric entry, and one NaN in the window turns the needle into
  // rotate(NaNdeg) — a meter that silently stops meaning anything.
  const rated = history.filter((delta) => Number.isFinite(delta) && delta >= -3 && delta <= 3);
  const recent = rated.slice(-window);
  if (recent.length === 0) return { mean: 0, count: 0 };
  const sum = recent.reduce((total, delta) => total + delta, 0);
  return { mean: sum / recent.length, count: recent.length };
}

// Practice Dojo phase-readiness marker - the model emits this at the end of
// a turn to signal the current phase's goal looks met. The app highlights
// the student's "Ready to move on?" button; the STUDENT decides whether to
// advance. Stripped before display; never advances state by itself.
export const NEXT_PHASE_MARKER_REGEX = /\[NEXT_PHASE\]/g;

// Code Kata Dojo result marker - the model emits one of these at the end of
// a completed kata cycle so the app can persist the scorecard across
// sessions. Format: [KATA_RESULT: {"kataId":"str-2a", ...}] on its own line.
// Stripped before display.
export const KATA_RESULT_MARKER_REGEX = /\[KATA_RESULT:\s*(\{[^\]]*\})\]/g;

// DIKW Pyramid types
// Data → Information → Knowledge → Wisdom
export type DIKWLevel = 'data' | 'information' | 'knowledge' | 'wisdom';

export interface DIKWState {
  current: DIKWLevel;      // Level of the student's most recent message
  highWaterMark: DIKWLevel; // Highest level reached TWICE — see confirmedPeak
  history: DIKWLevel[];    // History of levels through the session
  reasons: string[];       // One short reason per level, same length as history
}

export const DIKW_LEVELS: { id: DIKWLevel; name: string; description: string; questions: string }[] = [
  {
    id: 'data',
    name: 'Data',
    description: 'Raw facts and content',
    questions: 'What is it? Give me the answer.'
  },
  {
    id: 'information',
    name: 'Information',
    description: 'Organized, connected data',
    questions: 'How does it work? Show me the steps.'
  },
  {
    id: 'knowledge',
    name: 'Knowledge',
    description: 'Understanding why and when to apply',
    questions: 'Why does this work? What are the assumptions?'
  },
  {
    id: 'wisdom',
    name: 'Wisdom',
    description: 'Judgment for novel situations',
    questions: 'What are the tradeoffs? How would this change if...?'
  },
];

export const INITIAL_DIKW_STATE: DIKWState = {
  current: 'data',
  highWaterMark: 'data',
  history: [],
  reasons: [],
};

// DIKW marker regex - the AI includes this in responses.
// Format: [DIKW: K] or, preferred, [DIKW: K | weighed two options]
export const DIKW_MARKER_REGEX = /\[DIKW:\s*([DIKW])(?:\s*\|\s*([^\]]*))?\]/;

/**
 * The highest level the conversation has reached AT LEAST TWICE.
 *
 * A single stray reading used to crown a whole session: one "W" — often
 * rating the Sensei's own tradeoffs question rather than the student's
 * thinking — left the peak at Wisdom permanently, including on sessions where
 * the student volunteered nothing. Reaching a level twice is a low bar, but it
 * is a bar, and it makes the claim survivable.
 */
export function confirmedPeak(history: DIKWLevel[]): DIKWLevel {
  const counts = new Map<DIKWLevel, number>();
  for (const level of history) {
    counts.set(level, (counts.get(level) ?? 0) + 1);
  }
  let peak: DIKWLevel = 'data';
  for (const [level, count] of counts) {
    if (count >= 2 && DIKW_ORDER[level] > DIKW_ORDER[peak]) peak = level;
  }
  return peak;
}

// Helper to convert marker letter to level
export const DIKW_MARKER_MAP: Record<string, DIKWLevel> = {
  'D': 'data',
  'I': 'information',
  'K': 'knowledge',
  'W': 'wisdom',
};

// Helper to get numeric order for comparison
export const DIKW_ORDER: Record<DIKWLevel, number> = {
  'data': 0,
  'information': 1,
  'knowledge': 2,
  'wisdom': 3,
};
