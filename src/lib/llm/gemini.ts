import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, LLMRequest, LLMStreamChunk } from './types';

const apiKey = process.env.GEMINI_API_KEY;

function getClient(): GoogleGenerativeAI {
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable is not set. ' +
      'Please create a .env.local file with your API key.'
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

export const geminiProvider: LLMProvider = {
  name: 'gemini',

  // The Gemini API's native 'chat' function is stateful, which doesn't fit
  // our stateless, request-response model. We'll use the 'generateContent'
  // method for both streaming and non-streaming for consistency.
  // This 'chat' method is therefore just a wrapper around the streaming one.
  async chat(request) {
    let fullResponse = '';
    for await (const chunk of this.streamChat(request)) {
      fullResponse += chunk.content;
    }
    return { content: fullResponse };
  },

  async *streamChat(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({
      model: request.modelName,
      systemInstruction: request.systemPrompt,
    });

    const chat = model.startChat({
      history: request.messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: [{ text: msg.content }],
      })),
    });

    // The Gemini API requires sending the last user message separately to start the stream
    const lastMessage = request.messages[request.messages.length - 1];
    if (lastMessage?.role !== 'user') {
      throw new Error('The last message must be from the user to generate a response.');
    }

    try {
      const result = await chat.sendMessageStream(lastMessage.content);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield {
            content: chunkText,
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
        if (error.message.includes('API key not valid')) {
          throw new Error('Invalid GEMINI_API_KEY. Please check your API key in .env.local');
        }
      }
      throw error;
    }
  },
};
