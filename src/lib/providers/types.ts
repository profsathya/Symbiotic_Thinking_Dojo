/**
 * AI Provider Types
 *
 * Defines the common interface for all AI providers (Gemini, Groq, etc.)
 */

export type AIProvider = 'gemini' | 'groq' | 'cti' | 'commons';

export interface ProviderConfig {
  id: AIProvider;
  name: string;
  description: string;
  keyPrefix: string;  // For validation hint (e.g., "AIza" for Gemini, "gsk_" for Groq)
  keyPlaceholder: string;
  getKeyUrl: string;
  getKeyInstructions: string[];
  freeInfo: string;
  defaultModel: string;
}

export const PROVIDERS: Record<AIProvider, ProviderConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google\'s Gemini 2.5 Flash model',
    keyPrefix: 'AIza',
    keyPlaceholder: 'AIza...',
    getKeyUrl: 'https://aistudio.google.com/apikey',
    getKeyInstructions: [
      'Go to Google AI Studio',
      'Sign in with your Google account',
      'Click "Create API key"',
      'Select "Create API key in new project"',
      'Copy the generated key',
    ],
    freeInfo: '~15 requests/min, ~20 requests/day on free tier',
    defaultModel: 'gemini-2.5-flash',
  },
  groq: {
    id: 'groq',
    name: 'Llama',
    description: 'Ultra-fast Llama 3.3 70B inference via Groq',
    keyPrefix: 'gsk_',
    keyPlaceholder: 'gsk_...',
    getKeyUrl: 'https://console.groq.com/keys',
    getKeyInstructions: [
      'Go to console.groq.com (Note: Groq is NOT Grok from xAI — different companies)',
      'Sign up or sign in (Google/GitHub)',
      'Click "API Keys" in sidebar',
      'Click "Create API Key"',
      'Copy the generated key',
    ],
    freeInfo: '~14,400 requests/day, 30 requests/min on free tier',
    defaultModel: 'llama-3.3-70b-versatile',
  },
  cti: {
    id: 'cti',
    name: 'CTI Program',
    description: 'Claude AI via your CTI program key',
    keyPrefix: '',
    keyPlaceholder: 'Enter your CTI program key...',
    getKeyUrl: '',
    getKeyInstructions: [
      'Enter the key provided by your CTI program coordinator',
    ],
    freeInfo: 'Token budget managed by your program coordinator',
    defaultModel: 'claude-sonnet',
  },
  commons: {
    id: 'commons',
    name: 'Commons',
    description: 'Shared AI access — no API key needed',
    keyPrefix: '',
    keyPlaceholder: '',
    getKeyUrl: '',
    getKeyInstructions: [
      'No key required. Commons provides shared access to the Dojo.',
    ],
    freeInfo: 'Shared resource with rate limiting per user',
    defaultModel: 'gemini-2.5-flash',
  },
};

/** Check whether the CTI provider is enabled via env var */
export function isCtiEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_CTI_BACKEND_URL;
}

/** Check whether the Commons provider is enabled via env var */
export function isCommonsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_COMMONS_ENABLED === 'true';
}

/** Get the CTI backend URL */
export function getCtiBackendUrl(): string {
  return process.env.NEXT_PUBLIC_CTI_BACKEND_URL || '';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamChatOptions {
  apiKey: string;
  modelName: string;
  systemPrompt: string;
  messages: ChatMessage[];
  onChunk: (content: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
  // CTI only: which backend model tier to request. 'reasoning' → Sonnet
  // (default, higher quality), 'extraction' → Haiku (faster, lower latency).
  // Other providers ignore this. Lets a surface trade speed for depth per
  // message (e.g. the INSPIRE demo runs fast early, deep once thinking starts).
  requestType?: 'reasoning' | 'extraction';
}

/**
 * Custom error class for quota exceeded errors with retry information
 */
export class QuotaExceededError extends Error {
  retryAfterSeconds: number | null;
  isFreeTier: boolean;
  isDailyLimit: boolean;

  constructor(message: string, retryAfterSeconds: number | null = null, isFreeTier: boolean = false, isDailyLimit: boolean = false) {
    super(message);
    this.name = 'QuotaExceededError';
    this.retryAfterSeconds = retryAfterSeconds;
    this.isFreeTier = isFreeTier;
    this.isDailyLimit = isDailyLimit;
  }
}
