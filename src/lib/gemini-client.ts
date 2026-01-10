/**
 * Client-side Gemini API service
 *
 * This module makes direct browser-to-API calls to Google's Gemini API.
 * The API key is stored in the user's browser localStorage and never
 * leaves their device or passes through our servers.
 *
 * PRIVACY: All conversations happen directly between the user's browser
 * and Google's servers. We have zero access to conversation content.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

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
}

/**
 * Stream a chat response from Gemini directly from the browser.
 * Returns the full accumulated response.
 */
export async function streamGeminiChat({
  apiKey,
  modelName,
  systemPrompt,
  messages,
  onChunk,
  onComplete,
  onError,
  signal,
}: StreamChatOptions): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
    });

    // Build chat history (all messages except the last one)
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history });

    // Get the last message (must be from user)
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      throw new Error('The last message must be from the user.');
    }

    // Check if aborted before starting
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const result = await chat.sendMessageStream(lastMessage.content);
    let fullResponse = '';

    for await (const chunk of result.stream) {
      // Check for abort
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      const chunkText = chunk.text();
      if (chunkText) {
        fullResponse += chunkText;
        onChunk(chunkText);
      }
    }

    onComplete();
    return fullResponse;

  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'AbortError') {
        throw error; // Let caller handle abort
      }

      if (error.message.includes('API key not valid') ||
          error.message.includes('API_KEY_INVALID')) {
        onError(new Error('Invalid API key. Please check your Gemini API key in Settings.'));
      } else if (error.message.includes('quota')) {
        onError(new Error('API quota exceeded. Please try again later or check your usage limits.'));
      } else {
        onError(error);
      }
    } else {
      onError(new Error('An unexpected error occurred'));
    }
    throw error;
  }
}

/**
 * Test if an API key is valid by making a minimal request
 */
export async function testApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Make a minimal request to test the key
    await model.generateContent('Hi');

    return { valid: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('API key not valid') ||
          error.message.includes('API_KEY_INVALID')) {
        return { valid: false, error: 'Invalid API key' };
      }
      return { valid: false, error: error.message };
    }
    return { valid: false, error: 'Unknown error' };
  }
}
