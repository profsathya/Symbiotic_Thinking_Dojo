/**
 * Commons Chat API Route
 *
 * A shared, key-free chat endpoint that uses a server-side API key.
 * This allows anyone to use the Symbiotic Thinking Dojo without
 * providing their own API key — a "commons" resource.
 *
 * Rate limiting is applied per IP address to prevent abuse.
 * The server-side API key is never exposed to the client.
 */

import { NextRequest, NextResponse } from 'next/server';

// --- Configuration ---

const COMMONS_API_KEY = process.env.COMMONS_API_KEY || '';
const COMMONS_MODEL = process.env.COMMONS_MODEL || 'gemini-2.5-flash';
const COMMONS_PROVIDER = process.env.COMMONS_PROVIDER || 'gemini'; // 'gemini' | 'anthropic'
const COMMONS_MAX_TOKENS = parseInt(process.env.COMMONS_MAX_TOKENS || '4096', 10);

// Rate limiting: requests per window per IP
const RATE_LIMIT_MAX = parseInt(process.env.COMMONS_RATE_LIMIT_MAX || '10', 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.COMMONS_RATE_LIMIT_WINDOW_MS || '60000', 10);

// Max conversation length to prevent abuse
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 8000;

// --- In-memory rate limiter ---

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  let entry = rateLimitStore.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(ip, entry);
  }

  // Prune old timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= RATE_LIMIT_MAX) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + RATE_LIMIT_WINDOW_MS - now;
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
  }

  entry.timestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

// Periodic cleanup of stale entries (every 5 minutes)
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS * 2;
  for (const [ip, entry] of rateLimitStore) {
    if (entry.timestamps.every((t) => t < cutoff)) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// --- Provider-specific API calls ---

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CommonsRequest {
  messages: ChatMessage[];
  system?: string;
}

async function callGemini(
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<{ content: string; model: string }> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(COMMONS_API_KEY);
  const model = genAI.getGenerativeModel({
    model: COMMONS_MODEL,
    systemInstruction: systemPrompt || undefined,
  });

  // Convert messages to Gemini format
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage.content);
  const text = result.response.text();

  return { content: text, model: COMMONS_MODEL };
}

async function callAnthropic(
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<{ content: string; model: string }> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: COMMONS_API_KEY });

  const response = await client.messages.create({
    model: COMMONS_MODEL,
    max_tokens: COMMONS_MAX_TOKENS,
    system: systemPrompt || undefined,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  let content = '';
  for (const block of response.content) {
    if (block.type === 'text') {
      content += block.text;
    }
  }

  return { content, model: response.model };
}

// --- Route handler ---

export async function POST(request: NextRequest) {
  // Check that the Commons API is configured
  if (!COMMONS_API_KEY) {
    return NextResponse.json(
      { error: 'Commons Chat API is not configured on this server' },
      { status: 503 },
    );
  }

  // Rate limit by IP
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = checkRateLimit(ip);

  if (!allowed) {
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
    return NextResponse.json(
      {
        error: 'Rate limited',
        detail: `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
        retry_after_seconds: retryAfterSeconds,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSeconds) },
      },
    );
  }

  // Parse and validate request body
  let body: CommonsRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { messages, system = '' } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'messages array is required and must not be empty' },
      { status: 400 },
    );
  }

  if (messages.length > MAX_MESSAGES) {
    return NextResponse.json(
      { error: `Too many messages (max ${MAX_MESSAGES})` },
      { status: 400 },
    );
  }

  // Validate each message
  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      return NextResponse.json(
        { error: 'Each message must have role and content' },
        { status: 400 },
      );
    }
    if (!['user', 'assistant'].includes(msg.role)) {
      return NextResponse.json(
        { error: 'Message role must be "user" or "assistant"' },
        { status: 400 },
      );
    }
    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message content too long (max ${MAX_MESSAGE_LENGTH} characters)` },
        { status: 400 },
      );
    }
  }

  // Call the configured provider
  try {
    let result: { content: string; model: string };

    if (COMMONS_PROVIDER === 'anthropic') {
      result = await callAnthropic(messages, system);
    } else {
      result = await callGemini(messages, system);
    }

    return NextResponse.json({
      content: result.content,
      model: result.model,
      provider: COMMONS_PROVIDER,
    });
  } catch (error) {
    console.error('Commons Chat API error:', error);

    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    // Don't leak API key details
    const safeMessage = message.includes('API key')
      ? 'Server configuration error. Please try again later.'
      : message;

    return NextResponse.json(
      { error: 'Chat request failed', detail: safeMessage },
      { status: 502 },
    );
  }
}

export async function GET() {
  const configured = !!COMMONS_API_KEY;
  return NextResponse.json({
    status: configured ? 'available' : 'not_configured',
    provider: configured ? COMMONS_PROVIDER : null,
    model: configured ? COMMONS_MODEL : null,
    rate_limit: {
      max_requests: RATE_LIMIT_MAX,
      window_seconds: Math.round(RATE_LIMIT_WINDOW_MS / 1000),
    },
  });
}
