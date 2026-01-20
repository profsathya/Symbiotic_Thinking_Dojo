/**
 * Client-side Groq API service
 *
 * Groq provides ultra-fast inference for open-source models like Llama.
 * Uses OpenAI-compatible API format.
 *
 * PRIVACY: All conversations happen directly between the user's browser
 * and Groq's servers. We have zero access to conversation content.
 */

import { StreamChatOptions, QuotaExceededError } from './types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Parse Groq error response for quota/rate limit info
 */
function parseGroqError(errorBody: string, status: number): { retrySeconds: number | null; isDailyLimit: boolean } {
  let retrySeconds: number | null = null;
  let isDailyLimit = false;

  try {
    const parsed = JSON.parse(errorBody);
    const message = parsed?.error?.message || errorBody;

    // Check for daily limit
    if (message.includes('daily') || message.includes('per day')) {
      isDailyLimit = true;
    }

    // Try to extract retry-after
    const retryMatch = message.match(/try again in (\d+(?:\.\d+)?)\s*s/i);
    if (retryMatch) {
      retrySeconds = Math.ceil(parseFloat(retryMatch[1]));
    }
  } catch {
    // Parsing failed, use defaults
  }

  // For 429 without specific time, default to 60 seconds
  if (status === 429 && retrySeconds === null && !isDailyLimit) {
    retrySeconds = 60;
  }

  return { retrySeconds, isDailyLimit };
}

/**
 * Format user-friendly error message for Groq quota errors
 */
function formatGroqQuotaMessage(retrySeconds: number | null, isDailyLimit: boolean): string {
  if (isDailyLimit) {
    return `📅 **Daily API Limit Reached**

You've used all your Groq free tier requests for today.

**What now?**
• Your quota resets at **midnight UTC**
• Groq's free tier allows ~14,400 requests per day
• Check your usage at [Groq Console](https://console.groq.com/)`;
  }

  let message = '⏳ **API Rate Limit Reached**\n\n';
  message += 'You\'ve hit the per-minute rate limit for Groq.\n\n';

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
  message += '• Groq allows ~30 requests per minute on free tier\n';

  return message;
}

/**
 * Stream a chat response from Groq directly from the browser.
 */
export async function streamGroqChat({
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
    // Check if aborted before starting
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    // Build messages array with system prompt
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: apiMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();

      if (response.status === 401) {
        onError(new Error('Invalid API key. Please check your Groq API key in Settings.'));
        return '';
      }

      if (response.status === 429) {
        const { retrySeconds, isDailyLimit } = parseGroqError(errorBody, response.status);
        const friendlyMessage = formatGroqQuotaMessage(retrySeconds, isDailyLimit);
        const quotaError = new QuotaExceededError(friendlyMessage, retrySeconds, true, isDailyLimit);
        onError(quotaError);
        return '';
      }

      onError(new Error(`Groq API error: ${response.status} - ${errorBody}`));
      return '';
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullResponse = '';
    let buffer = '';

    while (true) {
      if (signal?.aborted) {
        reader.cancel();
        throw new DOMException('Aborted', 'AbortError');
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              onChunk(content);
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }

    onComplete();
    return fullResponse;

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      onError(error);
    } else {
      onError(new Error('An unexpected error occurred'));
    }
    return '';
  }
}

/**
 * Test if a Groq API key is valid
 */
export async function testGroqApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
    });

    if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    }

    if (response.status === 429) {
      return { valid: true, error: 'API key valid but rate limit exceeded' };
    }

    if (!response.ok) {
      const errorBody = await response.text();
      return { valid: false, error: `API error: ${errorBody}` };
    }

    return { valid: true };
  } catch (error) {
    if (error instanceof Error) {
      return { valid: false, error: error.message };
    }
    return { valid: false, error: 'Unknown error' };
  }
}
