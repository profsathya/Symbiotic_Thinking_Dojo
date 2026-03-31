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
 
// --- CORS ---
 
const ALLOWED_ORIGINS = [
  'https://the-commons-9efbd.web.app',
  'http://localhost:5173',
];
 
function getCorsHeaders(request?: NextRequest): Record<string, string> {
  const origin = request?.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
 
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
 
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
 
// --- Sparring partner system prompts ---
 
const PARTNER_PROMPTS: Record<string, string> = {
  framer: `You are the Framer — a sparring partner in the Symbiotic Thinking Dojo. Your role is to help reframe the conversation by offering alternative perspectives, mental models, and fresh angles on the topic. Ask questions that shift the frame of reference. Be concise and thought-provoking.`,
  auditor: `You are the Auditor — a sparring partner in the Symbiotic Thinking Dojo. Your role is to examine the reasoning and evidence in the conversation. Look for logical gaps, unsupported assumptions, and weak evidence. Challenge claims constructively. Be precise and fair.`,
  connector: `You are the Connector — a sparring partner in the Symbiotic Thinking Dojo. Your role is to find links between seemingly unrelated ideas in the conversation. Draw connections to other fields, concepts, or experiences. Help participants see the bigger picture. Be creative and insightful.`,
  challenger: `You are the Challenger — a sparring partner in the Symbiotic Thinking Dojo. Your role is to push back on ideas and play devil's advocate. Introduce counterarguments, edge cases, and opposing viewpoints. Be respectful but relentless in testing ideas.`,
  reflector: `You are the Reflector — a sparring partner in the Symbiotic Thinking Dojo. Your role is to mirror back what the conversation reveals about the participants' thinking patterns, biases, and growth. Offer metacognitive observations. Be empathetic and perceptive.`,
};
 
// --- Provider-specific API calls ---
 
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
 
// Format sent by The Commons app
interface CommonsAppRequest {
  message: string;
  partner: string;
  context?: {
    challenge?: string;
    tension?: string;
    layer?: string;
  };
  conversationHistory?: Array<{
    role: string;
    text: string;
  }>;
}
 
// Direct API format
interface DirectRequest {
  messages: ChatMessage[];
  system?: string;
}
 
type CommonsRequest = CommonsAppRequest | DirectRequest;
 
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
 
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}
 
export async function POST(request: NextRequest) {
  const cors = getCorsHeaders(request);
 
  // Check that the Commons API is configured
  if (!COMMONS_API_KEY) {
    return NextResponse.json(
      { error: 'Commons Chat API is not configured on this server' },
      { status: 503, headers: cors },
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
        headers: { ...cors, 'Retry-After': String(retryAfterSeconds) },
      },
    );
  }
 
  // Parse and validate request body
  let body: CommonsRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: cors });
  }
 
  // Detect request format: Commons app sends {message, partner, ...}
  // Direct API sends {messages, system}
  let messages: ChatMessage[];
  let system = '';
 
  if ('message' in body && typeof body.message === 'string') {
    // Commons app format: transform to internal format
    const appBody = body as CommonsAppRequest;
    const partner = (appBody.partner || '').toLowerCase();
 
    // Build system prompt from partner + context
    const partnerPrompt = PARTNER_PROMPTS[partner] || PARTNER_PROMPTS['framer'];
    const contextParts: string[] = [partnerPrompt];
 
    if (appBody.context?.challenge) {
      contextParts.push(`Challenge topic: ${appBody.context.challenge}`);
    }
    if (appBody.context?.tension) {
      contextParts.push(`Tension to explore: ${appBody.context.tension}`);
    }
    if (appBody.context?.layer) {
      contextParts.push(`Current layer: ${appBody.context.layer}`);
    }
 
    system = contextParts.join('\n\n');
 
    // Convert conversation history to ChatMessage format
    messages = [];
    if (appBody.conversationHistory && Array.isArray(appBody.conversationHistory)) {
      for (const entry of appBody.conversationHistory) {
        const role = entry.role === 'user' ? 'user' : 'assistant';
        const content = entry.text || '';
        if (content) {
          messages.push({ role, content });
        }
      }
    }
 
    // Add the current message as the latest user message
    if (appBody.message.trim()) {
      messages.push({ role: 'user', content: appBody.message.trim() });
    }
 
    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'No message content provided' },
        { status: 400, headers: cors },
      );
    }
  } else if ('messages' in body && Array.isArray(body.messages)) {
    // Direct API format
    messages = (body as DirectRequest).messages;
    system = (body as DirectRequest).system || '';
  } else {
    return NextResponse.json(
      { error: 'Request must include either "message" (Commons format) or "messages" array (direct format)' },
      { status: 400, headers: cors },
    );
  }
 
  if (messages.length === 0) {
    return NextResponse.json(
      { error: 'messages must not be empty' },
      { status: 400, headers: cors },
    );
  }
 
  if (messages.length > MAX_MESSAGES) {
    return NextResponse.json(
      { error: `Too many messages (max ${MAX_MESSAGES})` },
      { status: 400, headers: cors },
    );
  }
 
  // Validate each message
  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      return NextResponse.json(
        { error: 'Each message must have role and content' },
        { status: 400, headers: cors },
      );
    }
    if (!['user', 'assistant'].includes(msg.role)) {
      return NextResponse.json(
        { error: 'Message role must be "user" or "assistant"' },
        { status: 400, headers: cors },
      );
    }
    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message content too long (max ${MAX_MESSAGE_LENGTH} characters)` },
        { status: 400, headers: cors },
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
 
    return NextResponse.json(
      {
        content: result.content,
        response: result.content,  // Commons app checks for data.response
        text: result.content,      // Fallback field Commons also checks
        model: result.model,
        provider: COMMONS_PROVIDER,
      },
      { headers: cors },
    );
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
      { status: 502, headers: cors },
    );
  }
}
 
export async function GET(request: NextRequest) {
  const cors = getCorsHeaders(request);
  const configured = !!COMMONS_API_KEY;
  return NextResponse.json(
    {
      status: configured ? 'available' : 'not_configured',
      provider: configured ? COMMONS_PROVIDER : null,
      model: configured ? COMMONS_MODEL : null,
      rate_limit: {
        max_requests: RATE_LIMIT_MAX,
        window_seconds: Math.round(RATE_LIMIT_WINDOW_MS / 1000),
      },
    },
    { headers: cors },
  );
}
