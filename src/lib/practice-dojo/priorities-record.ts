/**
 * The "What Are My Priorities?" conversation record.
 *
 * The Sensei emits ONE [PRIORITIES_RECORD: {...}] marker at the close of the
 * conversation. This module extracts it, sanitizes every field (model output
 * is not trusted to be well-formed, and the strings end up in a downloadable
 * file), and renders the two download formats:
 *
 *   - Markdown: the student's own picture, in their words — their time
 *     picture, what their mind is being fed, what they noticed, what they
 *     want to try. It deliberately carries NO evidence notes and no flags:
 *     those are observations for later analysis, not something to hand back
 *     to a student as if it were a report card.
 *   - JSON: the complete record, evidence notes included. A student who opens
 *     the file can read every word of it — which is why the topic tells the
 *     Sensei to write the notes as if they will be read.
 *
 * Storage stance (matches docs/PRIVACY.md): the record is persisted to the
 * browser and downloaded by hand. Nothing is sent anywhere on its own, and no
 * instructor sees it unless the student hands it over.
 */

import { PrioritiesRecord, TimePictureEntry } from './types';

export const PRIORITIES_RECORD_MARKER = '[PRIORITIES_RECORD:';

interface MarkerSpan {
  // Index of the '[' that opens the marker
  start: number;
  // Index just past the ']' that closes it
  end: number;
  json: string;
}

/**
 * Find every complete marker span. A regex can't do this safely: the payload
 * contains both nested objects and arrays, so a non-greedy match stops at the
 * first "}]" (inside time_picture) and a greedy one swallows whatever follows
 * the marker. So we scan braces, respecting strings and escapes.
 */
function scanMarkerSpans(content: string): MarkerSpan[] {
  const spans: MarkerSpan[] = [];
  let searchFrom = 0;

  for (;;) {
    const markerAt = content.indexOf(PRIORITIES_RECORD_MARKER, searchFrom);
    if (markerAt === -1) break;

    const braceStart = content.indexOf('{', markerAt + PRIORITIES_RECORD_MARKER.length);
    if (braceStart === -1) break;

    let depth = 0;
    let inString = false;
    let escaped = false;
    let braceEnd = -1;

    for (let i = braceStart; i < content.length; i++) {
      const ch = content[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (inString) {
        if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          braceEnd = i;
          break;
        }
      }
    }

    // Unterminated: the rest of the string is a partial marker (mid-stream),
    // so there is nothing further to find.
    if (braceEnd === -1) break;

    let close = braceEnd + 1;
    while (close < content.length && /\s/.test(content[close])) close++;

    if (content[close] === ']') {
      spans.push({ start: markerAt, end: close + 1, json: content.slice(braceStart, braceEnd + 1) });
      searchFrom = close + 1;
    } else {
      // Balanced braces but no closing bracket — not our marker; keep looking.
      searchFrom = braceEnd + 1;
    }
  }

  return spans;
}

/**
 * Remove record markers from content for display. Also truncates an
 * UNTERMINATED trailing marker, so a student never watches a JSON blob type
 * itself out at the end of the conversation while the message streams in.
 */
export function stripPrioritiesRecordMarkers(content: string): string {
  let out = content;
  const spans = scanMarkerSpans(out);
  for (let i = spans.length - 1; i >= 0; i--) {
    out = out.slice(0, spans[i].start) + out.slice(spans[i].end);
  }
  const partialAt = out.indexOf(PRIORITIES_RECORD_MARKER);
  if (partialAt !== -1) out = out.slice(0, partialAt);
  return out.trim();
}

// ---------------------------------------------------------------------------
// Sanitizing. Model output is untrusted input here: it is persisted, rendered
// into a Markdown table, and read back by a human. Flatten whitespace (so a
// value can't forge headings or table rows), cap length, clamp numbers.
// ---------------------------------------------------------------------------

function cleanString(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  const flattened = raw.replace(/\s+/g, ' ').trim();
  return flattened.length > maxLen ? flattened.slice(0, maxLen) : flattened;
}

function cleanStringArray(raw: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => cleanString(item, maxLen))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}

// Hours in a day, to one decimal so half-hours survive ("about 6.5").
function cleanHours(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
  return Math.min(24, Math.max(0, Math.round(raw * 10) / 10));
}

function cleanTriState(raw: unknown): boolean | null {
  return typeof raw === 'boolean' ? raw : null;
}

// Who introduced the calibration gap. Anything but the two known values is
// null: an unrecognised value must never read as "the student named it".
function cleanIntroducedBy(raw: unknown): 'student' | 'sensei' | null {
  return raw === 'student' || raw === 'sensei' ? raw : null;
}

function cleanTimePicture(raw: unknown): TimePictureEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: TimePictureEntry[] = [];
  for (const item of raw.slice(0, 16)) {
    const category = cleanString((item as TimePictureEntry)?.category, 60);
    if (!category) continue;
    entries.push({
      category,
      first_estimate_hours: cleanHours((item as TimePictureEntry)?.first_estimate_hours),
      revised_hours: cleanHours((item as TimePictureEntry)?.revised_hours),
      quality_rating: cleanString((item as TimePictureEntry)?.quality_rating, 80),
      sources_named: cleanStringArray((item as TimePictureEntry)?.sources_named, 12, 120),
    });
  }
  return entries;
}

/**
 * Parse one marker payload into a validated record. Returns null when the
 * payload isn't a record at all — a malformed marker is dropped silently, the
 * way a bad kata result is: a record is a best-effort trace and must never
 * break the conversation it came from.
 */
export function parsePrioritiesRecord(json: string, at: string): PrioritiesRecord | null {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  if (!Array.isArray(raw.time_picture)) return null;

  const mind = (raw.mind_nutrition ?? {}) as Record<string, unknown>;
  const gap = (raw.self_named_gap ?? {}) as Record<string, unknown>;
  const theTry = (raw.try ?? {}) as Record<string, unknown>;
  const notes = (raw.evidence_notes ?? {}) as Record<string, unknown>;
  const flags = (raw.flags ?? {}) as Record<string, unknown>;

  return {
    activity: 'what-are-my-priorities',
    time_picture: cleanTimePicture(raw.time_picture),
    mind_nutrition: {
      sources: cleanStringArray(mind.sources, 20, 120),
      student_read_on_quality: cleanString(mind.student_read_on_quality, 400),
    },
    self_named_gap: {
      // A gap credited to the student must be one the student introduced.
      // If the model says named:true but attributes it to itself, the
      // attribution wins — that combination is the exact bookkeeping error
      // this field exists to catch.
      named: cleanIntroducedBy(gap.introduced_by) === 'sensei' ? false : cleanTriState(gap.named),
      introduced_by: cleanIntroducedBy(gap.introduced_by),
      student_words: cleanString(gap.student_words, 400),
    },
    try: {
      named: cleanTriState(theTry.named),
      student_words: cleanString(theTry.student_words, 400),
      observable_as: cleanString(theTry.observable_as, 300),
    },
    evidence_notes: {
      self_knowledge: cleanString(notes.self_knowledge, 800),
      self_regulation: cleanString(notes.self_regulation, 800),
    },
    flags: {
      declined_try: flags.declined_try === true,
      physical_habit_flag: flags.physical_habit_flag === true,
    },
    at,
  };
}

/** Every valid record in a message, stamped with the local time of arrival. */
export function extractPrioritiesRecords(content: string, at: string): PrioritiesRecord[] {
  const records: PrioritiesRecord[] = [];
  for (const span of scanMarkerSpans(content)) {
    const record = parsePrioritiesRecord(span.json, at);
    if (record) records.push(record);
  }
  return records;
}

export interface StripRecord {
  record: PrioritiesRecord;
  // Whether this record came from the conversation on screen, as opposed to
  // one the student finished earlier
  fromThisSession: boolean;
}

/**
 * Which record the download strip should offer.
 *
 * Records are appended in order, so the last one is always the newest. The
 * strip offers it whether or not it came from the conversation on screen:
 * completing the activity clears topicId AND sessionStarted, so a record
 * scoped strictly to the current session would be stranded the moment the
 * student pressed the completion button — with the file still sitting in
 * their browser, unreachable. A student who finished last week can come back
 * to the topic and still download it.
 *
 * A null sessionStarted means no session is running (just completed), so the
 * newest record belongs to the conversation that was on screen.
 */
export function recordForStrip(
  records: PrioritiesRecord[] | undefined,
  sessionStarted: string | null
): StripRecord | null {
  if (!records || records.length === 0) return null;
  const record = records[records.length - 1];
  return { record, fromThisSession: !sessionStarted || record.at >= sessionStarted };
}

// ---------------------------------------------------------------------------
// Downloads
// ---------------------------------------------------------------------------

export function prioritiesRecordToJson(record: PrioritiesRecord): string {
  return JSON.stringify(record, null, 2);
}

function hours(value: number | null): string {
  return value === null ? '—' : `${value}h`;
}

/** Markdown tables break on a raw pipe, and student words can contain one. */
function cell(text: string): string {
  const escaped = text.replace(/\|/g, '\\|');
  return escaped.length > 0 ? escaped : '—';
}

/**
 * The student-facing record: their picture, in their words. No evidence
 * notes, no flags — see the module comment.
 */
export function prioritiesRecordToMarkdown(record: PrioritiesRecord): string {
  const lines: string[] = [
    '# What Are My Priorities? — your record',
    '',
    `Conversation: ${record.at.slice(0, 10)}`,
    '',
    '## Your time picture',
    '',
  ];

  if (record.time_picture.length === 0) {
    lines.push('_No categories were recorded in this conversation._');
  } else {
    lines.push(
      '| Part of the day | First guess | After we looked | How it felt | What you named |',
      '|---|---|---|---|---|'
    );
    for (const entry of record.time_picture) {
      lines.push(
        `| ${cell(entry.category)} | ${hours(entry.first_estimate_hours)} | ${hours(entry.revised_hours)} | ${cell(entry.quality_rating)} | ${cell(entry.sources_named.join(', '))} |`
      );
    }
    lines.push('', '_A dash under "After we looked" means you kept that one as it was._');
  }

  lines.push('', '## What your mind is being fed', '');
  lines.push(
    record.mind_nutrition.sources.length > 0
      ? `Sources you named: ${record.mind_nutrition.sources.join(', ')}`
      : '_No sources were named in this conversation._'
  );
  if (record.mind_nutrition.student_read_on_quality) {
    lines.push('', `Your read on it: "${record.mind_nutrition.student_read_on_quality}"`);
  }

  if (record.self_named_gap.student_words) {
    const heading =
      record.self_named_gap.introduced_by === 'sensei'
        ? '## What you agreed with'
        : '## What you noticed';
    lines.push('', heading, '', `"${record.self_named_gap.student_words}"`);
  }

  lines.push('', '## The small thing you wanted to try', '');
  if (record.flags.declined_try || record.try.named === false) {
    lines.push("You didn't pick one this time — that's a real answer, and it's on the record as one.");
  } else if (record.try.student_words) {
    lines.push(`"${record.try.student_words}"`);
    if (record.try.observable_as) {
      lines.push('', `Where it would show up: ${record.try.observable_as}`);
    }
  } else {
    lines.push('_Nothing was recorded here._');
  }

  lines.push(
    '',
    '---',
    '_Made from your own words in one conversation. It stays in your browser unless you hand it to someone._'
  );

  return lines.join('\n');
}
