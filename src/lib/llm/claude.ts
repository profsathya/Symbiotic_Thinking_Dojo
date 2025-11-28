import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMRequest, LLMResponse, LLMStreamChunk } from './types';

// Check for API key at module load
const apiKey = process.env.ANTHROPIC_API_KEY;

function getClient(): Anthropic {
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY environment variable is not set. ' +
      'Please create a .env.local file with your API key.'
    );
  }
  return new Anthropic({ apiKey });
}

export const claudeProvider: LLMProvider = {
  name: 'claude',

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const anthropic = getClient();
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
    const anthropic = getClient();

    try {
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
    } catch (error) {
      // Re-throw with more context
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('authentication')) {
          throw new Error('Invalid ANTHROPIC_API_KEY. Please check your API key in .env.local');
        }
        if (error.message.includes('429')) {
          throw new Error('Rate limited by Anthropic API. Please wait a moment and try again.');
        }
      }
      throw error;
    }
  },
};
