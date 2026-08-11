import { describe, it, expect } from 'vitest';
import {
  parseCuriosityRecords,
  stripCuriosityRecordMarkers,
  buildRecordBundle,
  recordBundleToJson,
  parseRecordBundle,
  mergeRecords,
  CuriosityRecord,
} from '@/lib/practice-dojo/curiosity-record';

// A complete, schema-shaped payload as the model is instructed to emit it.
const FULL_PAYLOAD = {
  run: 1,
  episodes: [
    {
      period: 'when I was ten',
      what: 'built a treehouse',
      first_move: 'dragged pallets from the alley',
      stayed_through: 'kept at it after the roof collapsed',
      revised: 'switched to a smaller platform',
      ended_how: "still there",
    },
    {
      period: 'last summer',
      what: 'taught myself to solder',
      first_move: 'watched a video and bought a cheap iron',
      stayed_through: 'burned through a lot of bad joints',
      revised: 'started practising on scrap first',
      ended_how: "hasn't ended",
    },
  ],
  thread: {
    student_named: true,
    student_words: 'I like making the thing before I know how',
    sensei_proposed: '',
    response: 'named it themselves',
  },
  present: {
    unrequired_pull: 'the hardware side',
    predicted_struggle: 'keeping up with the reading',
  },
  try: {
    named: true,
    student_words: 'read ahead when something grabs me',
    observable_as: "follow a topic for 30 minutes before the assignment asks",
  },
  evidence_notes: {
    internal: {
      self_knowledge: 'Described their own pattern without prompting.',
      self_regulation: 'Kept going after the roof collapsed.',
      owning_the_outcome: 'Framed the collapse as their design problem.',
    },
    external: {
      initiative: 'Started both projects unprompted.',
      adaptability: 'Switched to a smaller platform rather than quitting.',
      working_with_uncertainty: 'Began soldering before knowing how.',
    },
  },
  flags: { protective_care: false, not_yet_surfaced: false, declined_try: false },
};

const marker = (payload: unknown) => `[CURIOSITY_RECORD: ${JSON.stringify(payload)}]`;

describe('curiosity record — extraction', () => {
  it('parses a full record from a closing message', () => {
    const content = `Thank you for being open with me.\n\n${marker(FULL_PAYLOAD)}`;
    const [record] = parseCuriosityRecords(content, 'map-curiosity');

    expect(record).toBeDefined();
    expect(record.run).toBe(1);
    expect(record.episodes).toHaveLength(2);
    expect(record.episodes[1].period).toBe('last summer');
    expect(record.thread.student_named).toBe(true);
    expect(record.present.predicted_struggle).toBe('keeping up with the reading');
    expect(record.try.observable_as).toContain('30 minutes');
    expect(record.evidence_notes.external.initiative).toBe('Started both projects unprompted.');
    expect(record.flags.declined_try).toBe(false);
    expect(record.topicId).toBe('map-curiosity');
    expect(record.at).toBeTruthy();
  });

  // This is the regression the kata marker's regex would fail: its pattern is
  // \{[^\]]*\}, which stops at the first `]` — and this payload's `episodes`
  // array closes long before the object does.
  it('handles the array in `episodes` (brace matching, not first-] matching)', () => {
    const [record] = parseCuriosityRecords(marker(FULL_PAYLOAD), 'map-curiosity');
    expect(record.episodes).toHaveLength(2);
    expect(record.flags).toBeDefined();
  });

  it('handles braces and brackets inside string values', () => {
    const payload = {
      ...FULL_PAYLOAD,
      present: {
        unrequired_pull: 'arrays like [1,2] and objects like {a:1}',
        predicted_struggle: 'the "quoted } brace" case',
      },
    };
    const [record] = parseCuriosityRecords(marker(payload), 'map-curiosity');
    expect(record.present.unrequired_pull).toBe('arrays like [1,2] and objects like {a:1}');
    expect(record.present.predicted_struggle).toBe('the "quoted } brace" case');
  });

  it('normalizes a partial payload instead of dropping it', () => {
    const [record] = parseCuriosityRecords(
      marker({ run: 1, episodes: [], flags: { not_yet_surfaced: true } }),
      'map-curiosity'
    );
    expect(record).toBeDefined();
    expect(record.episodes).toEqual([]);
    expect(record.thread.student_named).toBeNull();
    expect(record.try.named).toBeNull();
    expect(record.evidence_notes.internal.self_knowledge).toBe('');
    expect(record.flags.not_yet_surfaced).toBe(true);
    expect(record.flags.protective_care).toBe(false);
  });

  it('drops malformed payloads without throwing', () => {
    expect(parseCuriosityRecords('[CURIOSITY_RECORD: {not json}]', 'map-curiosity')).toEqual([]);
    expect(parseCuriosityRecords('[CURIOSITY_RECORD: {"a": 1', 'map-curiosity')).toEqual([]);
    expect(parseCuriosityRecords('no marker here', 'map-curiosity')).toEqual([]);
  });
});

describe('curiosity record — the student never sees it', () => {
  it('strips the marker from the displayed message', () => {
    const content = `Thank you for being open with me. We'll talk again later in the semester.\n\n${marker(FULL_PAYLOAD)}`;
    const stripped = stripCuriosityRecordMarkers(content);

    expect(stripped).toBe(
      "Thank you for being open with me. We'll talk again later in the semester."
    );
    expect(stripped).not.toContain('CURIOSITY_RECORD');
    expect(stripped).not.toContain('evidence_notes');
    expect(stripped).not.toContain('self_knowledge');
  });

  // Mid-stream the payload arrives a few characters at a time. Every prefix
  // must render clean, or the record flashes on screen before it completes.
  it('hides every partial prefix while the marker is still streaming', () => {
    const closing = 'Thank you for being open with me.';
    const full = `${closing}\n\n${marker(FULL_PAYLOAD)}`;

    for (let i = closing.length; i <= full.length; i++) {
      const stripped = stripCuriosityRecordMarkers(full.slice(0, i));
      expect(stripped, `prefix length ${i}`).not.toContain('CURIOSITY_RECORD');
      expect(stripped, `prefix length ${i}`).not.toContain('evidence_notes');
      expect(stripped, `prefix length ${i}`).not.toContain('self_knowledge');
      expect(stripped, `prefix length ${i}`).not.toContain('protective_care');
    }
  });

  it('leaves ordinary messages untouched', () => {
    const plain = 'What did you actually do first?';
    expect(stripCuriosityRecordMarkers(plain)).toBe(plain);
  });
});

describe('curiosity record — export', () => {
  const record = parseCuriosityRecords(marker(FULL_PAYLOAD), 'map-curiosity')[0];

  it('round-trips through the export bundle', () => {
    const bundle = buildRecordBundle([record], '2026-08-11T00:00:00.000Z');
    const parsed = parseRecordBundle(recordBundleToJson(bundle));

    expect(parsed).not.toBeNull();
    expect(parsed!.records).toHaveLength(1);
    expect(parsed!.records[0].episodes).toHaveLength(2);
    expect(parsed!.records[0].topicId).toBe('map-curiosity');
    expect(parsed!.records[0].evidence_notes.internal.self_regulation).toBe(
      'Kept going after the roof collapsed.'
    );
  });

  it('rejects files that are not record bundles', () => {
    expect(parseRecordBundle('{"kind":"belt-record","results":[]}')).toBeNull();
    expect(parseRecordBundle('not json')).toBeNull();
  });

  it('merges without duplicating the same run', () => {
    const other: CuriosityRecord = { ...record, at: '2026-09-30T00:00:00.000Z', run: 2 };
    expect(mergeRecords([record], [record])).toHaveLength(1);
    expect(mergeRecords([record], [other])).toHaveLength(2);
  });

  it('carries no numbers, levels, or ratings in evidence notes', () => {
    const notes = Object.values(record.evidence_notes.internal).concat(
      Object.values(record.evidence_notes.external)
    );
    for (const note of notes) {
      expect(typeof note).toBe('string');
      expect(note).not.toMatch(/\b(high|low|strong|weak|developing|proficient|level|score)\b/i);
    }
  });
});
