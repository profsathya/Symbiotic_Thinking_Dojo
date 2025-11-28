// Core types for Symbiotic Thinking Dojo

// Construct types - the three training environments
export type Construct = 'learn' | 'learn-solve' | 'learn-solve-build';

// Sparring Partner types
export type SparringPartner = 'framer' | 'auditor' | 'connector' | 'challenger';

// UMPIRE stages for tracking progress
export type UmpireStage = 'understand' | 'model' | 'plan' | 'implement' | 'review' | 'extend';

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
export const UMPIRE_STAGES: { id: UmpireStage; name: string }[] = [
  { id: 'understand', name: 'Understand' },
  { id: 'model', name: 'Model' },
  { id: 'plan', name: 'Plan' },
  { id: 'implement', name: 'Implement' },
  { id: 'review', name: 'Review' },
  { id: 'extend', name: 'Extend' },
];

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
