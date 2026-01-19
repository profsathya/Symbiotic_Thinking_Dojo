// Re-export everything from defaults
export * from './defaults';

// Export composer functions and types
export { composeSystemPrompt, createWelcomeMessage, createPracticeDojoWelcome } from './composer';
export type { ComposeOptions } from './composer';
