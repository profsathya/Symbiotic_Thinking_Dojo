/**
 * Map Your Curiosity — the end-of-session conversation record.
 *
 * The Sensei emits one `[CURIOSITY_RECORD: {...}]` marker in its final
 * message. The marker is stripped before the message is rendered, so the
 * record is never visible to the student in the conversation.
 *
 * The record is INTERNAL: short prose observations for the instructor, never
 * numbers, never levels, never anything the student is shown or graded on.
 */

// ---------------------------------------------------------------------------
// Types — mirror the agreed schema exactly.
// ---------------------------------------------------------------------------

export interface CuriosityEpisode {
  period: string;
  what: string;
  first_move: string;
  stayed_through: string;
  revised: string;
  ended_how: string;
}

export interface CuriosityThread {
  /** true = the student named it, false = the Sensei proposed one, null = neither. */
  student_named: boolean | null;
  student_words: string;
  sensei_proposed: string;
  response: string;
}

export interface CuriosityPresent {
  unrequired_pull: string;
  predicted_struggle: string;
}

export interface CuriosityTry {
  /** true = named, false = declined, null = never reached. */
  named: boolean | null;
  student_words: string;
  observable_as: string;
}

export interface CuriosityEvidenceNotes {
  internal: {
    self_knowledge: string;
    self_regulation: string;
    owning_the_outcome: string;
  };
  external: {
    initiative: string;
    adaptability: string;
    working_with_uncertainty: string;
  };
}

export interface CuriosityFlags {
  protective_care: boolean;
  not_yet_surfaced: boolean;
  declined_try: boolean;
}

export interface CuriosityRecord {
  run: number;
  episodes: CuriosityEpisode[];
  thread: CuriosityThread;
  present: CuriosityPresent;
  try: CuriosityTry;
  evidence_notes: CuriosityEvidenceNotes;
  flags: CuriosityFlags;
  /** Stamped by the app when the marker is parsed — not emitted by the model. */
  at: string;
  /** Which topic produced it, so run-2 records stay distinguishable. */
  topicId: string;
}

// ---------------------------------------------------------------------------
// Extraction
//
// NOTE: this deliberately does NOT reuse KATA_RESULT_MARKER_REGEX's shape
// (`\{[^\]]*\}`). That pattern stops at the first `]`, which is fine for the
// kata payload but breaks on this schema — `episodes` is an ARRAY, so the
// payload contains `]` characters well before its closing brace. We scan for
// the balanced closing brace instead, ignoring braces inside strings.
// ---------------------------------------------------------------------------

const MARKER_OPEN = '[CURIOSITY_RECORD:';

/**
 * Find the index just past the JSON object starting at `start` (which must
 * point at `{`), respecting string literals and escapes. Returns -1 if the
 * object never closes.
 */
function findObjectEnd(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) return i + 1;
    }
  }

  return -1;
}

interface MarkerSpan {
  /** Index of the `[` that opens the marker. */
  start: number;
  /** Index just past the `]` that closes it. */
  end: number;
  /** The raw JSON object text. */
  json: string;
}

/** Locate every well-formed `[CURIOSITY_RECORD: {...}]` span in `content`. */
function findMarkerSpans(content: string): MarkerSpan[] {
  const spans: MarkerSpan[] = [];
  let cursor = 0;

  for (;;) {
    const open = content.indexOf(MARKER_OPEN, cursor);
    if (open === -1) break;

    const braceStart = content.indexOf('{', open + MARKER_OPEN.length);
    if (braceStart === -1) break;

    const objectEnd = findObjectEnd(content, braceStart);
    if (objectEnd === -1) {
      // Unterminated payload — most likely a marker still streaming in.
      // Leave it alone; the end-of-message pass will see the complete text.
      break;
    }

    // The marker's own `]` must follow the object, allowing whitespace.
    const rest = content.slice(objectEnd);
    const closeOffset = rest.search(/\S/);
    if (closeOffset === -1 || rest[closeOffset] !== ']') {
      cursor = objectEnd;
      continue;
    }

    spans.push({
      start: open,
      end: objectEnd + closeOffset + 1,
      json: content.slice(braceStart, objectEnd),
    });
    cursor = objectEnd + closeOffset + 1;
  }

  return spans;
}

// ---------------------------------------------------------------------------
// Normalization
//
// The model fills this in from a conversation, so partial and slightly-off
// payloads are expected. We normalize rather than reject: a record with gaps
// is still useful to an instructor, and a malformed one must never break the
// chat. Only a non-object payload is dropped.
// ---------------------------------------------------------------------------

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function boolOrNull(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function bool(value: unknown): boolean {
  return value === true;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeEpisode(raw: unknown): CuriosityEpisode {
  const e = asRecord(raw);
  return {
    period: str(e.period),
    what: str(e.what),
    first_move: str(e.first_move),
    stayed_through: str(e.stayed_through),
    revised: str(e.revised),
    ended_how: str(e.ended_how),
  };
}

function normalizeRecord(raw: unknown, topicId: string, at: string): CuriosityRecord | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;

  const thread = asRecord(r.thread);
  const present = asRecord(r.present);
  const tryBlock = asRecord(r.try);
  const evidence = asRecord(r.evidence_notes);
  const internal = asRecord(evidence.internal);
  const external = asRecord(evidence.external);
  const flags = asRecord(r.flags);

  return {
    run: typeof r.run === 'number' ? r.run : 1,
    episodes: Array.isArray(r.episodes) ? r.episodes.map(normalizeEpisode) : [],
    thread: {
      student_named: boolOrNull(thread.student_named),
      student_words: str(thread.student_words),
      sensei_proposed: str(thread.sensei_proposed),
      response: str(thread.response),
    },
    present: {
      unrequired_pull: str(present.unrequired_pull),
      predicted_struggle: str(present.predicted_struggle),
    },
    try: {
      named: boolOrNull(tryBlock.named),
      student_words: str(tryBlock.student_words),
      observable_as: str(tryBlock.observable_as),
    },
    evidence_notes: {
      internal: {
        self_knowledge: str(internal.self_knowledge),
        self_regulation: str(internal.self_regulation),
        owning_the_outcome: str(internal.owning_the_outcome),
      },
      external: {
        initiative: str(external.initiative),
        adaptability: str(external.adaptability),
        working_with_uncertainty: str(external.working_with_uncertainty),
      },
    },
    flags: {
      protective_care: bool(flags.protective_care),
      not_yet_surfaced: bool(flags.not_yet_surfaced),
      declined_try: bool(flags.declined_try),
    },
    at,
    topicId,
  };
}

/**
 * Parse every `[CURIOSITY_RECORD: {...}]` marker in a message. Malformed
 * payloads are dropped silently — the record is a best-effort trace and a bad
 * marker must never break the conversation.
 */
export function parseCuriosityRecords(
  content: string,
  topicId: string,
  at: string = new Date().toISOString()
): CuriosityRecord[] {
  const records: CuriosityRecord[] = [];

  for (const span of findMarkerSpans(content)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(span.json);
    } catch {
      continue;
    }
    const record = normalizeRecord(parsed, topicId, at);
    if (record) records.push(record);
  }

  return records;
}

/**
 * Remove every `[CURIOSITY_RECORD: …]` marker from a message before display.
 *
 * Also removes a marker whose payload has not finished streaming, so a
 * half-written record never flashes on screen mid-stream — that partial tail
 * is the one case a regex-free scan has to handle deliberately.
 */
export function stripCuriosityRecordMarkers(content: string): string {
  const spans = findMarkerSpans(content);
  let out = content;

  for (let i = spans.length - 1; i >= 0; i--) {
    out = out.slice(0, spans[i].start) + out.slice(spans[i].end);
  }

  // Drop an unterminated marker at the tail (streaming in progress). Every
  // COMPLETE span is already gone, so any opener still present is unfinished
  // — cut from the first one. This must come before the partial check below:
  // the payload contains its own "[" (the `episodes` array), so scanning for
  // the last bracket alone would cut there and leave the opener rendered.
  const unterminated = out.indexOf(MARKER_OPEN);
  if (unterminated !== -1) out = out.slice(0, unterminated);

  // Earlier still, the opener itself arrives a character at a time — the text
  // ends at "[CURIOSIT", which contains no colon and matches nothing above.
  // Any trailing "[" that could still grow into the opener goes.
  const lastBracket = out.lastIndexOf('[');
  if (lastBracket !== -1 && MARKER_OPEN.startsWith(out.slice(lastBracket))) {
    out = out.slice(0, lastBracket);
  }

  return out.trim();
}

// ---------------------------------------------------------------------------
// Export formats
// ---------------------------------------------------------------------------

export interface CuriosityRecordBundle {
  version: 1;
  kind: 'curiosity-records';
  exportedAt: string;
  records: CuriosityRecord[];
}

export function buildRecordBundle(
  records: CuriosityRecord[],
  exportedAt: string
): CuriosityRecordBundle {
  return { version: 1, kind: 'curiosity-records', exportedAt, records };
}

export function recordBundleToJson(bundle: CuriosityRecordBundle): string {
  return JSON.stringify(bundle, null, 2);
}

/**
 * Parse an exported bundle (instructor side: many student files merged into
 * one class view). Returns null if the file is not a record bundle.
 */
export function parseRecordBundle(text: string): CuriosityRecordBundle | null {
  try {
    const raw = JSON.parse(text) as Record<string, unknown>;
    if (raw.kind !== 'curiosity-records' || !Array.isArray(raw.records)) return null;
    const at = typeof raw.exportedAt === 'string' ? raw.exportedAt : '';
    const records = raw.records
      .map((r) => {
        const entry = asRecord(r);
        return normalizeRecord(
          r,
          str(entry.topicId) || 'map-curiosity',
          str(entry.at) || at
        );
      })
      .filter((r): r is CuriosityRecord => r !== null);
    return { version: 1, kind: 'curiosity-records', exportedAt: at, records };
  } catch {
    return null;
  }
}

/** Merge bundles, de-duplicating on (topicId, at). */
export function mergeRecords(
  existing: CuriosityRecord[],
  incoming: CuriosityRecord[]
): CuriosityRecord[] {
  const seen = new Set(existing.map((r) => `${r.topicId}|${r.at}`));
  const merged = [...existing];
  for (const record of incoming) {
    const key = `${record.topicId}|${record.at}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(record);
  }
  return merged;
}

/** Whether this build sends records to a server. Default OFF. */
export const RECORD_SYNC_ENABLED =
  process.env.NEXT_PUBLIC_CURIOSITY_RECORD_SYNC === 'true';

/**
 * Server sync, off unless NEXT_PUBLIC_CURIOSITY_RECORD_SYNC === 'true' AND an
 * endpoint is configured. Scaffolding only — the consent design is not
 * settled, so with the flag off this is a no-op and nothing leaves the
 * browser. Failures are swallowed: a sync problem must never surface to a
 * student mid-conversation.
 */
export async function syncRecord(record: CuriosityRecord): Promise<void> {
  if (!RECORD_SYNC_ENABLED) return;
  const endpoint = process.env.NEXT_PUBLIC_CURIOSITY_RECORD_ENDPOINT;
  if (!endpoint) return;

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
  } catch {
    // Intentionally silent.
  }
}
