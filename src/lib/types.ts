// Core types for Symbiotic Thinking Dojo

// Construct types - the three training environments
export type Construct = 'learn' | 'learn-solve' | 'learn-solve-build';

// Sparring Partner types
export type SparringPartner = 'framer' | 'auditor' | 'connector' | 'challenger';

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
  score: number;           // Current cumulative score (-10 to +10 range, clamped)
  lastDelta: number;       // Last change (-3 to +3)
  consecutiveConsuming: number;  // Count of consecutive consuming interactions
  history: number[];       // History of deltas for this session
}

export const INITIAL_BALANCE_STATE: BalanceState = {
  score: 0,
  lastDelta: 0,
  consecutiveConsuming: 0,
  history: [],
};

// Balance marker regex pattern - Sensei includes this in responses
// Format: [BALANCE: +2] or [BALANCE: -1]
export const BALANCE_MARKER_REGEX = /\[BALANCE:\s*([+-]?\d+)\]/;

// DIKW Pyramid types
// Data → Information → Knowledge → Wisdom
export type DIKWLevel = 'data' | 'information' | 'knowledge' | 'wisdom';

export interface DIKWState {
  current: DIKWLevel;      // Current level of the conversation
  highWaterMark: DIKWLevel; // Highest level reached in this session
  history: DIKWLevel[];    // History of levels through the session
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
};

// DIKW marker regex pattern - AI includes this in responses
// Format: [DIKW: K] or [DIKW: W]
export const DIKW_MARKER_REGEX = /\[DIKW:\s*([DIKW])\]/;

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
