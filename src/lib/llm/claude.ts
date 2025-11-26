import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMRequest, LLMResponse, LLMStreamChunk } from './types';

const anthropic = new Anthropic();

export const claudeProvider: LLMProvider = {
  name: 'claude',

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: request.systemPrompt,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const textContent = response.content.find(block => block.type === 'text');
    return {
      content: textContent?.type === 'text' ? textContent.text : '',
      finishReason: response.stop_reason || undefined,
    };
  },

  async *streamChat(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: request.systemPrompt,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield {
          content: event.delta.text,
          done: false,
        };
      }
    }

    yield {
      content: '',
      done: true,
    };
  },
};
