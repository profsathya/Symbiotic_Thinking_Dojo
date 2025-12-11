export * from './types';

import { LLMProvider } from './types';
import { claudeProvider } from './claude';
import { geminiProvider } from './gemini';
import { gptProvider } from './gpt';

// Provider registry maps a model name prefix to the correct provider
const providers: Record<string, LLMProvider> = {
  'claude-': claudeProvider,
  'gemini-': geminiProvider,
  'gpt-': gptProvider,
};

// Default model if the client doesn't specify one
const DEFAULT_MODEL = 'claude-3-opus-20240229';

/**
 * Returns the appropriate LLM provider based on the model name.
 * @param modelName The full name of the model (e.g., "claude-3-opus-20240229").
 * @returns The corresponding LLM provider.
 */
export function getProvider(modelName: string = DEFAULT_MODEL): LLMProvider {
  const prefix = Object.keys(providers).find(p => modelName.startsWith(p));
  
  if (!prefix) {
    console.warn(`Could not determine provider for model: ${modelName}. Defaulting to Claude.`);
    return claudeProvider;
  }
  
  const provider = providers[prefix];
  if (!provider) {
    throw new Error(`Unknown LLM provider for model: ${modelName}`);
  }
  return provider;
}

/**
 * Returns a list of available provider prefixes.
 * @returns An array of strings, e.g., ["claude-", "gemini-", "gpt-"].
 */
export function getAvailableProviders(): string[] {
  return Object.keys(providers);
}
