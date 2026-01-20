/**
 * AI Providers Index
 *
 * Unified interface for multiple AI providers
 */

export * from './types';
export { streamGroqChat, testGroqApiKey } from './groq-client';

import { AIProvider, StreamChatOptions, PROVIDERS } from './types';
import { streamGeminiChat, testApiKey as testGeminiApiKey } from '../gemini-client';
import { streamGroqChat, testGroqApiKey } from './groq-client';

/**
 * Stream chat using the selected provider
 */
export async function streamChat(
  provider: AIProvider,
  options: StreamChatOptions
): Promise<string> {
  switch (provider) {
    case 'gemini':
      return streamGeminiChat(options);
    case 'groq':
      return streamGroqChat(options);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Test API key for the selected provider
 */
export async function testApiKey(
  provider: AIProvider,
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  switch (provider) {
    case 'gemini':
      return testGeminiApiKey(apiKey);
    case 'groq':
      return testGroqApiKey(apiKey);
    default:
      return { valid: false, error: `Unknown provider: ${provider}` };
  }
}

/**
 * Get the default model for a provider
 */
export function getDefaultModel(provider: AIProvider): string {
  return PROVIDERS[provider].defaultModel;
}
