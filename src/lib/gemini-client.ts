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
 * Custom error class for quota exceeded errors with retry information
 */
export class QuotaExceededError extends Error {
  retryAfterSeconds: number | null;
  isFreeTier: boolean;
  isDailyLimit: boolean;

  constructor(message: string, retryAfterSeconds: number | null = null, isFreeTier: boolean = false, isDailyLimit: boolean = false) {
    super(message);
    this.name = 'QuotaExceededError';
    this.retryAfterSeconds = retryAfterSeconds;
    this.isFreeTier = isFreeTier;
    this.isDailyLimit = isDailyLimit;
  }
}

/**
 * Parse quota error message to extract retry delay and tier information
 */
function parseQuotaError(errorMessage: string): { retrySeconds: number | null; isFreeTier: boolean; isDailyLimit: boolean } {
  let retrySeconds: number | null = null;
  let isFreeTier = false;
  let isDailyLimit = false;

  // Check if it's a free tier error
  if (errorMessage.includes('free_tier') || errorMessage.includes('FreeTier')) {
    isFreeTier = true;
  }

  // Check if it's a daily limit (not just per-minute rate limit)
  // Daily limits typically mention "PerDay" or have low limits like "limit: 20"
  if (errorMessage.includes('PerDay') ||
      errorMessage.includes('per_day') ||
      errorMessage.includes('per day')) {
    isDailyLimit = true;
  }

  // Also check for the specific free tier daily limit pattern
  // The error mentions "limit: 20" which is the daily free tier limit
  const limitMatch = errorMessage.match(/limit:\s*(\d+)/i);
  if (limitMatch && isFreeTier) {
    const limit = parseInt(limitMatch[1], 10);
    // Free tier daily limit is typically 20 or similar low number
    if (limit <= 50) {
      isDailyLimit = true;
    }
  }

  // Try to extract retry delay from message
  // Pattern: "Please retry in 16.147817032s" or "retryDelay":"16s"
  const retryMatch = errorMessage.match(/retry\s*(?:in\s*)?(\d+(?:\.\d+)?)\s*s/i);
  if (retryMatch) {
    retrySeconds = Math.ceil(parseFloat(retryMatch[1]));
  }

  return { retrySeconds, isFreeTier, isDailyLimit };
}

/**
 * Format a user-friendly quota error message
 */
function formatQuotaErrorMessage(retrySeconds: number | null, isFreeTier: boolean, isDailyLimit: boolean): string {
  // Daily limit exhausted - different message
  if (isDailyLimit) {
    let message = '📅 **Daily API Limit Reached**\n\n';
    message += 'You\'ve used all your free tier requests for today.\n\n';
    message += '**What now?**\n';
    message += '• Your quota resets at **midnight Pacific Time**\n';
    message += '• Upgrade to a paid API key at [Google AI Studio](https://aistudio.google.com/apikey) for higher limits\n';
    message += '• The free tier allows ~20 requests per day\n';
    return message;
  }

  // Per-minute rate limit - show retry time
  let message = '⏳ **API Rate Limit Reached**\n\n';

  if (isFreeTier) {
    message += 'You\'ve hit the per-minute rate limit for the free tier.\n\n';
  } else {
    message += 'You\'ve exceeded your current API quota.\n\n';
  }

  if (retrySeconds !== null && retrySeconds > 0) {
    if (retrySeconds < 60) {
      message += `**Try again in ${retrySeconds} seconds.**\n\n`;
    } else {
      const minutes = Math.ceil(retrySeconds / 60);
      message += `**Try again in about ${minutes} minute${minutes > 1 ? 's' : ''}.**\n\n`;
    }
  }

  message += '**Options:**\n';
  message += '• Wait a moment and try again\n';
  if (isFreeTier) {
    message += '• Upgrade to a paid API key at [Google AI Studio](https://aistudio.google.com/apikey)\n';
    message += '• The free tier has limited requests per minute/day\n';
  } else {
    message += '• Check your usage at [Google AI Studio](https://aistudio.google.com/)\n';
    message += '• Review your billing and quota settings\n';
  }

  return message;
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

      const errorMessage = error.message;

      if (errorMessage.includes('API key not valid') ||
          errorMessage.includes('API_KEY_INVALID')) {
        onError(new Error('Invalid API key. Please check your Gemini API key in Settings.'));
        // Don't re-throw - we've handled this error via onError callback
        return '';
      } else if (errorMessage.includes('429') ||
                 errorMessage.includes('quota') ||
                 errorMessage.includes('rate') ||
                 errorMessage.includes('exceeded')) {
        // Parse quota error details
        const { retrySeconds, isFreeTier, isDailyLimit } = parseQuotaError(errorMessage);
        const friendlyMessage = formatQuotaErrorMessage(retrySeconds, isFreeTier, isDailyLimit);
        const quotaError = new QuotaExceededError(friendlyMessage, retrySeconds, isFreeTier, isDailyLimit);
        onError(quotaError);
        // Don't re-throw - we've handled this error via onError callback
        return '';
      } else {
        onError(error);
        // Don't re-throw - we've handled this error via onError callback
        return '';
      }
    } else {
      onError(new Error('An unexpected error occurred'));
      return '';
    }
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
      // Check for quota errors during test
      if (error.message.includes('429') || error.message.includes('quota')) {
        return { valid: true, error: 'API key valid but quota exceeded' };
      }
      return { valid: false, error: error.message };
    }
    return { valid: false, error: 'Unknown error' };
  }
}
