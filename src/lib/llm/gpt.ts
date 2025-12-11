import OpenAI from 'openai';
import { LLMProvider, LLMRequest, LLMResponse, LLMStreamChunk } from './types';

const apiKey = process.env.OPENAI_API_KEY;

function getClient(): OpenAI {
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY environment variable is not set. ' +
      'Please create a .env.local file with your API key.'
    );
  }
  return new OpenAI({ apiKey });
}

export const gptProvider: LLMProvider = {
  name: 'openai',

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const openai = getClient();
    const response = await openai.chat.completions.create({
      model: request.modelName,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: request.systemPrompt },
        ...request.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      stream: false,
    });

    return {
      content: response.choices[0].message.content ?? '',
      finishReason: response.choices[0].finish_reason,
    };
  },

  async *streamChat(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    const openai = getClient();

    try {
      const stream = await openai.chat.completions.create({
        model: request.modelName,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: request.systemPrompt },
          ...request.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield {
            content: content,
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
        if (error.message.includes('Incorrect API key')) {
          throw new Error('Invalid OPENAI_API_KEY. Please check your API key in .env.local');
        }
      }
      throw error;
    }
  },
};
