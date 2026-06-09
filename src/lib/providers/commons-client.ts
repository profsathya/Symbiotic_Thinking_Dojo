/**
 * Commons Chat Client
 *
 * Routes requests through the Next.js Commons Chat API route.
 * No API key needed — the server provides access via a shared key.
 *
 * PRIVACY NOTE: Conversations route through the application server
 * to the configured AI provider. No conversation content is logged.
 */

import { StreamChatOptions, QuotaExceededError } from './types';

/**
 * Check if the Commons Chat API is available
 */
export async function checkCommonsAvailability(): Promise<{
  available: boolean;
  provider?: string;
  model?: string;
}> {
  try {
    const response = await fetch('/api/chat/commons');
    if (!response.ok) return { available: false };

    const data = await response.json();
    return {
      available: data.status === 'available',
      provider: data.provider,
      model: data.model,
    };
  } catch {
    return { available: false };
  }
}

/**
 * Stream a chat response through the Commons Chat API.
 *
 * The API returns a non-streaming JSON response, but we simulate
 * streaming by delivering the full response as a single chunk.
 */
export async function streamCommonsChat({
  systemPrompt,
  messages,
  onChunk,
  onComplete,
  onError,
  signal,
}: StreamChatOptions): Promise<string> {
  try {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const response = await fetch('/api/chat/commons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        system: systemPrompt,
      }),
      signal,
    });

    if (!response.ok) {
      const body = await response
        .json()
        .catch(() => ({ detail: `HTTP ${response.status}` }));
      const detail =
        body.detail || body.error || `Request failed: ${response.status}`;

      if (response.status === 429) {
        const retrySeconds = body.retry_after_seconds || 60;
        onError(
          new QuotaExceededError(
            `Rate limited. Please wait ${retrySeconds} seconds and try again.`,
            retrySeconds,
          ),
        );
        return '';
      }

      if (response.status === 503) {
        onError(
          new Error(
            'Commons Chat is not available on this server. Please use your own API key.',
          ),
        );
        return '';
      }

      onError(new Error(`Commons Chat error: ${detail}`));
      return '';
    }

    const data = await response.json();
    const content = data.content || '';

    // Deliver response as a single chunk to match streaming interface
    onChunk(content);
    onComplete();
    return content;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') throw error;
      onError(error);
    } else {
      onError(new Error('An unexpected error occurred'));
    }
    return '';
  }
}

/**
 * Test if Commons Chat API is available and working
 */
export async function testCommonsApiKey(): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const { available, provider } = await checkCommonsAvailability();
    if (!available) {
      return {
        valid: false,
        error: 'Commons Chat is not configured on this server',
      };
    }
    return { valid: true };
  } catch (error) {
    if (error instanceof Error) {
      return { valid: false, error: error.message };
    }
    return { valid: false, error: 'Unknown error' };
  }
}
