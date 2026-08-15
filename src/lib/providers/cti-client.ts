/**
 * CTI Backend Proxy Client
 *
 * Routes requests through the CTI backend service instead of directly
 * to an AI provider. The backend handles model selection and token tracking.
 *
 * PRIVACY NOTE: When using a CTI key, conversations route through the CTI
 * backend server. No conversation content is logged server-side.
 */

import { StreamChatOptions, getCtiBackendUrl, QuotaExceededError } from './types';

export interface BudgetInfo {
  remaining_tokens: number;
  total_budget: number;
  used_tokens: number;
  expires_at: string | null;
}

/**
 * Fetch budget info for a CTI key
 */
export async function fetchCtiBudget(apiKey: string): Promise<BudgetInfo> {
  const url = getCtiBackendUrl();
  const response = await fetch(`${url}/api/budget`, {
    headers: { 'X-CTI-Key': apiKey },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Budget check failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Extract a retry delay (seconds) from a 429 response.
 * Checks the Retry-After header, then the JSON body, then falls back to 30s.
 */
function parseRetrySeconds(response: Response, body: Record<string, unknown>): number {
  const header = response.headers.get('Retry-After');
  if (header) {
    const parsed = parseInt(header, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (typeof body.retry_after_seconds === 'number' && body.retry_after_seconds > 0) {
    return Math.ceil(body.retry_after_seconds);
  }
  // Backend rate limiter detail includes "Try again in N seconds."
  const detail = typeof body.detail === 'string' ? body.detail : '';
  const match = detail.match(/try again in (\d+)/i);
  if (match) return parseInt(match[1], 10);
  return 30;
}

/**
 * Stream a chat response through the CTI backend proxy.
 *
 * The backend returns a non-streaming JSON response, but we simulate
 * streaming by delivering the full response as a single chunk.
 * This keeps the same interface as the other providers.
 */
export async function streamCtiChat({
  apiKey,
  systemPrompt,
  messages,
  onChunk,
  onComplete,
  onError,
  signal,
  requestType = 'reasoning',
}: StreamChatOptions): Promise<string> {
  try {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const url = getCtiBackendUrl();
    const response = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CTI-Key': apiKey,
      },
      body: JSON.stringify({
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        system: systemPrompt,
        request_type: requestType,
        max_tokens: 4096,
      }),
      signal,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
      const detail = body.detail || body.error || `Request failed: ${response.status}`;

      if (response.status === 401) {
        onError(new Error('Invalid CTI key. Please check your key in Settings.'));
        return '';
      }
      if (response.status === 403) {
        onError(new Error(detail.includes('expired')
          ? 'Your CTI key has expired. Please contact your program coordinator.'
          : detail.includes('budget')
            ? 'Your token budget is exhausted. Please contact your program coordinator.'
            : `Access denied: ${detail}`
        ));
        return '';
      }
      if (response.status === 429) {
        // Rate limit (per-key or the program's shared upstream limit) — this is
        // temporary and does NOT consume or reflect the student's token budget.
        const retrySeconds = parseRetrySeconds(response, body);
        const message = `⏳ **The Dojo is busy right now**\n\n` +
          `Too many requests in a short time — this happens when the whole class is working at once.\n\n` +
          `**Try again in ${retrySeconds} seconds.** Your token budget is not affected.`;
        onError(new QuotaExceededError(message, retrySeconds, false, false));
        return '';
      }

      if (response.status === 502 || response.status === 503) {
        // Upstream (Anthropic) problem with the program's shared account or
        // service — never the student's budget. Don't surface raw upstream
        // billing language, which reads as "your credits ran out."
        const message = detail.toLowerCase().includes('credit') || detail.toLowerCase().includes('billing')
          ? 'The Dojo\'s shared AI account needs attention from the program coordinator. This is not your token budget — please notify your coordinator.'
          : `The AI service had a temporary problem. Please try again in a moment. (${detail})`;
        onError(new Error(message));
        return '';
      }

      onError(new Error(`CTI backend error: ${detail}`));
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
 * Test if a CTI key is valid by checking budget
 */
export async function testCtiApiKey(apiKey: string): Promise<{ valid: boolean; error?: string; budget?: BudgetInfo }> {
  try {
    const budget = await fetchCtiBudget(apiKey);
    if (budget.remaining_tokens <= 0) {
      return { valid: false, error: 'Token budget exhausted', budget };
    }
    return { valid: true, budget };
  } catch (error) {
    if (error instanceof Error) {
      return { valid: false, error: error.message };
    }
    return { valid: false, error: 'Unknown error' };
  }
}
