// Provider-agnostic LLM types
// Designed for easy addition of other providers (OpenAI, Gemini, etc.)

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  modelName: string;
  messages: LLMMessage[];
  systemPrompt: string;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  finishReason?: string;
}

export interface LLMStreamChunk {
  content: string;
  done: boolean;
}

export interface LLMProvider {
  name: string;
  chat(request: LLMRequest): Promise<LLMResponse>;
  streamChat(request: LLMRequest): AsyncGenerator<LLMStreamChunk>;
}
