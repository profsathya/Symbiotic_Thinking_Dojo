export * from './types';
export { claudeProvider } from './claude';

import { LLMProvider } from './types';
import { claudeProvider } from './claude';

// Provider registry for future multi-provider support
const providers: Record<string, LLMProvider> = {
  claude: claudeProvider,
  // Future: openai, gemini, etc.
};

export function getProvider(name: string = 'claude'): LLMProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown LLM provider: ${name}`);
  }
  return provider;
}

export function getAvailableProviders(): string[] {
  return Object.keys(providers);
}
