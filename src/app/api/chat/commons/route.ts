/**
 * Commons Chat API Route
 *
 * A chat endpoint used by "The Commons" partner platform. It uses a
 * server-side provider key (Gemini/Anthropic) so that The Commons can
 * offer chat without distributing its own keys to its users.
 *
 * Access control:
 * 1. Bearer token auth — clients must send `Authorization: Bearer <token>`
 *    matching COMMONS_AUTH_TOKEN. Unauthorized requests get 401 without
 *    consuming rate-limit slots.
 * 2. Per-IP rate limiting — 10 req/min by default (in-memory).
 * 3. Fail-closed — if COMMONS_AUTH_TOKEN is not set, ALL requests get 503.
 *
 * The provider key (COMMONS_API_KEY) is never exposed to clients.
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// --- Auth ---

const COMMONS_AUTH_TOKEN = process.env.COMMONS_AUTH_TOKEN || '';

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verify the Authorization header contains a valid bearer token.
 * Returns null if authorized, or a NextResponse with an error otherwise.
 */
function checkAuth(
  request: NextRequest,
  cors: Record<string, string>,
): NextResponse | null {
  // Fail-closed: if no token is configured on the server, reject all requests.
  if (!COMMONS_AUTH_TOKEN) {
    return NextResponse.json(
      { error: 'Commons Chat API is not configured (missing auth token)' },
      { status: 503, headers: cors },
    );
  }

  const authHeader = request.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (!match) {
    return NextResponse.json(
      { error: 'Unauthorized: missing or malformed Authorization header' },
      { status: 401, headers: cors },
    );
  }

  const providedToken = match[1].trim();
  if (!safeEqual(providedToken, COMMONS_AUTH_TOKEN)) {
    return NextResponse.json(
      { error: 'Unauthorized: invalid token' },
      { status: 401, headers: cors },
    );
  }

  return null;
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
// Note: conversationHistory is nested inside context
interface CommonsAppRequest {
  message: string;
  partner: string;
  context?: {
    challenge?: string;
    tension?: string;
    layer?: string;
    conversationHistory?: Array<{
      role: string;
      text: string;
    }>;
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

  // Require a valid Bearer token BEFORE anything else, so unauthorized
  // requests cannot consume the rate limit budget of legitimate IPs.
  const authError = checkAuth(request, cors);
  if (authError) return authError;

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
    // Commons sends conversationHistory inside context OR at top level
    const history = appBody.conversationHistory || appBody.context?.conversationHistory;
    messages = [];
    if (history && Array.isArray(history)) {
      for (const entry of history) {
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
  } catch (error: unknown) {
    console.error('Commons Chat API error:', error);
 
    const errMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred';
 
    // Detect specific error types and return helpful messages
    let status = 502;
    let userMessage = 'The AI service encountered an error. Please try again.';
 
    if (errMessage.includes('overloaded') || errMessage.includes('529')) {
      status = 529;
      userMessage = 'The AI service is temporarily overloaded. Please wait a moment and try again.';
    } else if (errMessage.includes('rate') || errMessage.includes('429')) {
      status = 429;
      userMessage = 'Too many requests to the AI service. Please wait a moment and try again.';
    } else if (errMessage.includes('API key') || errMessage.includes('auth') || errMessage.includes('401')) {
      status = 502;
      userMessage = 'Server configuration error. Please try again later.';
    } else if (errMessage.includes('timeout') || errMessage.includes('ETIMEDOUT')) {
      status = 504;
      userMessage = 'The AI service took too long to respond. Please try again.';
    }
 
    return NextResponse.json(
      { error: userMessage, detail: userMessage, errorType: status === 529 ? 'overloaded' : 'server_error' },
      { status, headers: cors },
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
 
