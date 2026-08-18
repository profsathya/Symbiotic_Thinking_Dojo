import { describe, it, expect } from 'vitest';
import {
  extractPrioritiesRecords,
  parsePrioritiesRecord,
  prioritiesRecordToJson,
  prioritiesRecordToMarkdown,
  recordForStrip,
  stripPrioritiesRecordMarkers,
} from '@/lib/practice-dojo/priorities-record';
import { PrioritiesRecord } from '@/lib/practice-dojo/types';

const AT = '2026-08-11T17:04:00.000Z';

// A realistic close: two time_picture entries, so the payload contains a "}]"
// in the middle — the exact shape a non-greedy regex would truncate.
const PAYLOAD = JSON.stringify({
  activity: 'what-are-my-priorities',
  time_picture: [
    {
      category: 'sleep',
      first_estimate_hours: 7,
      revised_hours: 5.5,
      quality_rating: 'ok',
      sources_named: ['phone in bed until 2'],
    },
    {
      category: 'entertainment/fun',
      first_estimate_hours: 5,
      revised_hours: 8,
      quality_rating: 'fine',
      sources_named: ['tiktok', 'youtube while eating'],
    },
  ],
  mind_nutrition: {
    sources: ['tiktok', 'two podcasts'],
    student_read_on_quality: 'mostly junk, some good',
  },
  self_named_gap: { named: true, introduced_by: 'student', student_words: 'I scroll way more than I said' },
  try: {
    named: true,
    student_words: 'phone charges across the room',
    observable_as: 'gets to the 8am class awake instead of skipping',
  },
  evidence_notes: {
    self_knowledge: 'Revised fun from five hours to eight once the eating-and-scrolling came up, then named the gap themselves.',
    self_regulation: 'Sleep is a default rather than a routine; the try is their first deliberate structure.',
  },
  flags: { declined_try: false, physical_habit_flag: false },
});

const MESSAGE = `Thank you for being open with me. We'll keep talking through the semester — what happens between now and then is the part that matters.\n\n[PRIORITIES_RECORD: ${PAYLOAD}]`;

describe('priorities record extraction', () => {
  it('extracts a record whose payload contains nested arrays and objects', () => {
    const records = extractPrioritiesRecords(MESSAGE, AT);
    expect(records).toHaveLength(1);
    // The "}]" inside time_picture must not end the marker early
    expect(records[0].time_picture).toHaveLength(2);
    expect(records[0].time_picture[1].category).toBe('entertainment/fun');
    expect(records[0].flags.declined_try).toBe(false);
    expect(records[0].try.observable_as).toContain('8am class');
  });

  it('stamps the record locally, ignoring any timestamp the model supplied', () => {
    const withModelTime = MESSAGE.replace('"activity"', '"at":"1999-01-01T00:00:00.000Z","activity"');
    const [record] = extractPrioritiesRecords(withModelTime, AT);
    expect(record.at).toBe(AT);
  });

  it('strips the marker from what the student sees', () => {
    const display = stripPrioritiesRecordMarkers(MESSAGE);
    expect(display).not.toContain('PRIORITIES_RECORD');
    expect(display).not.toContain('evidence_notes');
    expect(display).toContain('Thank you for being open with me');
  });

  it('hides an unterminated marker mid-stream, so no JSON blob types itself out', () => {
    const partial = `Thanks for being open with me.\n\n[PRIORITIES_RECORD: {"activity":"what-are-my-p`;
    const display = stripPrioritiesRecordMarkers(partial);
    expect(display).toBe('Thanks for being open with me.');
  });

  it('drops malformed markers silently instead of breaking the close', () => {
    const broken = `Close line.\n\n[PRIORITIES_RECORD: {not json at all}]`;
    expect(() => extractPrioritiesRecords(broken, AT)).not.toThrow();
    expect(extractPrioritiesRecords(broken, AT)).toHaveLength(0);
    expect(stripPrioritiesRecordMarkers(broken)).toBe('Close line.');
  });

  it('rejects a payload that is not a record', () => {
    expect(parsePrioritiesRecord('{"kataId":"str-2a","solved":true}', AT)).toBeNull();
  });
});

describe('priorities record sanitizing', () => {
  it('keeps revised_hours null when the student never revised — the gap is the signal', () => {
    const payload = JSON.stringify({
      time_picture: [
        { category: 'work', first_estimate_hours: 4, revised_hours: null, quality_rating: 'good', sources_named: [] },
      ],
    });
    const record = parsePrioritiesRecord(payload, AT)!;
    expect(record.time_picture[0].revised_hours).toBeNull();
    expect(record.time_picture[0].first_estimate_hours).toBe(4);
  });

  it('clamps hours to a real day, keeps half-hours, and rejects non-numeric ones', () => {
    const payload = JSON.stringify({
      time_picture: [
        { category: 'a', first_estimate_hours: 40, revised_hours: -5, quality_rating: '', sources_named: [] },
        { category: 'b', first_estimate_hours: 'lots', revised_hours: 6.5, quality_rating: '', sources_named: [] },
      ],
    });
    const record = parsePrioritiesRecord(payload, AT)!;
    expect(record.time_picture[0].first_estimate_hours).toBe(24);
    expect(record.time_picture[0].revised_hours).toBe(0);
    expect(record.time_picture[1].first_estimate_hours).toBeNull();
    // Half-hours survive — "about six and a half" is how students answer
    expect(record.time_picture[1].revised_hours).toBe(6.5);
  });

  it('flattens whitespace and caps long strings so nothing can forge structure in the file', () => {
    const payload = JSON.stringify({
      time_picture: [{ category: 'sleep', quality_rating: 'ok', sources_named: [] }],
      self_named_gap: { named: true, student_words: 'line one\n\n## Fake heading\n| forged | row |' },
      evidence_notes: { self_knowledge: 'x'.repeat(2000), self_regulation: '' },
    });
    const record = parsePrioritiesRecord(payload, AT)!;
    expect(record.self_named_gap.student_words).not.toContain('\n');
    expect(record.self_named_gap.student_words).toContain('## Fake heading');
    expect(record.evidence_notes.self_knowledge.length).toBeLessThanOrEqual(800);
  });

  // §1.2: a gap the Sensei proposed and the student agreed with is not a
  // student-named gap. Without this, the most agreeable student in a cohort
  // produces the strongest-looking record while doing the least thinking.
  it('credits a gap to the student only when the student introduced it', () => {
    const record = parsePrioritiesRecord(
      JSON.stringify({
        time_picture: [],
        self_named_gap: { named: true, introduced_by: 'student', student_words: 'I scroll more than I said' },
      }),
      AT
    )!;
    expect(record.self_named_gap.named).toBe(true);
    expect(record.self_named_gap.introduced_by).toBe('student');
  });

  it('demotes a Sensei-proposed reframe even when the model marks it named', () => {
    const record = parsePrioritiesRecord(
      JSON.stringify({
        time_picture: [],
        self_named_gap: {
          named: true,
          introduced_by: 'sensei',
          student_words: 'probably feeding my mind more than entertainment',
        },
      }),
      AT
    )!;
    // The attribution wins over the claim — that combination is the exact
    // bookkeeping error the field exists to catch
    expect(record.self_named_gap.named).toBe(false);
    expect(record.self_named_gap.introduced_by).toBe('sensei');
    // The student's words are still kept: an accepted reframe is a real reading
    expect(record.self_named_gap.student_words).toContain('feeding my mind');
  });

  it('will not credit the student when the attribution is missing or unrecognised', () => {
    // A model that skips or misspells introduced_by used to keep named:true,
    // which is the same corrupt reading by a different route
    const noAttribution = parsePrioritiesRecord(
      JSON.stringify({ time_picture: [], self_named_gap: { named: true, student_words: 'hm' } }),
      AT
    )!;
    expect(noAttribution.self_named_gap.named).toBe(false);
    expect(noAttribution.self_named_gap.introduced_by).toBeNull();
  });

  it('treats an unrecognised attribution as no attribution', () => {
    const record = parsePrioritiesRecord(
      JSON.stringify({ time_picture: [], self_named_gap: { named: true, introduced_by: 'both' } }),
      AT
    )!;
    expect(record.self_named_gap.introduced_by).toBeNull();
  });

  it('titles the student-facing section by who did the noticing', () => {
    const mine = parsePrioritiesRecord(
      JSON.stringify({
        time_picture: [],
        self_named_gap: { named: true, introduced_by: 'student', student_words: 'I scroll more' },
      }),
      AT
    )!;
    const theirs = parsePrioritiesRecord(
      JSON.stringify({
        time_picture: [],
        self_named_gap: { named: false, introduced_by: 'sensei', student_words: 'yeah that tracks' },
      }),
      AT
    )!;
    expect(prioritiesRecordToMarkdown(mine)).toContain('## What you noticed');
    // "sensei" covers acceptance, amendment and rejection alike — the heading
    // must not put agreement in the mouth of a student who pushed back
    expect(prioritiesRecordToMarkdown(theirs)).toContain('## What came up');
    expect(prioritiesRecordToMarkdown(theirs)).not.toContain('agreed with');
  });

  it('defaults missing sections rather than dropping the record', () => {
    const record = parsePrioritiesRecord('{"time_picture":[]}', AT)!;
    expect(record.activity).toBe('what-are-my-priorities');
    expect(record.mind_nutrition.sources).toEqual([]);
    // "Nothing of the kind came up" is named:false — not an open question
    expect(record.self_named_gap.named).toBe(false);
    expect(record.self_named_gap.introduced_by).toBeNull();
    expect(record.flags.physical_habit_flag).toBe(false);
  });
});

describe('which record the download strip offers', () => {
  const older: PrioritiesRecord = { ...extractPrioritiesRecords(MESSAGE, AT)[0], at: '2026-08-11T17:04:00.000Z' };
  const newer: PrioritiesRecord = { ...older, at: '2026-08-18T18:00:00.000Z' };

  it('offers nothing before the first record exists', () => {
    expect(recordForStrip([], '2026-08-11T17:00:00.000Z')).toBeNull();
    expect(recordForStrip(undefined, null)).toBeNull();
  });

  it('offers this conversation\'s record while the session runs', () => {
    const strip = recordForStrip([older], '2026-08-11T17:00:00.000Z')!;
    expect(strip.record.at).toBe(older.at);
    expect(strip.fromThisSession).toBe(true);
  });

  // Regression: completing the activity clears topicId AND sessionStarted, so
  // a strictly session-scoped record was stranded the moment the student
  // pressed the completion button — with the file still in their browser.
  it('still offers the record after the activity completes and sessionStarted is cleared', () => {
    const strip = recordForStrip([older], null)!;
    expect(strip.record.at).toBe(older.at);
    expect(strip.fromThisSession).toBe(true);
  });

  it('offers an earlier record when the student comes back, marked as not this one', () => {
    const strip = recordForStrip([older], '2026-08-18T09:00:00.000Z')!;
    expect(strip.record.at).toBe(older.at);
    expect(strip.fromThisSession).toBe(false);
  });

  it('offers the newest record when there are several', () => {
    const strip = recordForStrip([older, newer], '2026-08-18T09:00:00.000Z')!;
    expect(strip.record.at).toBe(newer.at);
    expect(strip.fromThisSession).toBe(true);
  });
});

describe('priorities record downloads', () => {
  const record: PrioritiesRecord = extractPrioritiesRecords(MESSAGE, AT)[0];

  it('the student-facing Markdown carries their picture but no evidence notes or flags', () => {
    const md = prioritiesRecordToMarkdown(record);
    expect(md).toContain('Your time picture');
    expect(md).toContain('7h');
    expect(md).toContain('5.5h');
    expect(md).not.toContain('%');
    expect(md).toContain('entertainment/fun');
    expect(md).toContain('I scroll way more than I said');
    expect(md).toContain('phone charges across the room');
    // The notes are observations for later analysis, not a report card
    expect(md).not.toContain('Revised fun from five hours to eight');
    expect(md).not.toContain('self_knowledge');
    expect(md).not.toContain('physical_habit_flag');
  });

  it('the JSON carries the complete record, notes included', () => {
    const json = prioritiesRecordToJson(record);
    const round = JSON.parse(json);
    expect(round.evidence_notes.self_knowledge).toContain('named the gap themselves');
    expect(round.flags).toEqual({ declined_try: false, physical_habit_flag: false });
    expect(round.at).toBe(AT);
  });

  it('escapes pipes so a student\'s own words cannot break the table', () => {
    const piped = parsePrioritiesRecord(
      JSON.stringify({
        time_picture: [
          { category: 'fun', first_estimate_hours: 5, revised_hours: null, quality_rating: 'good | bad', sources_named: [] },
        ],
      }),
      AT
    )!;
    const md = prioritiesRecordToMarkdown(piped);
    const row = md.split('\n').find((line) => line.startsWith('| fun'))!;
    expect(row).toContain('good \\| bad');
    // With the escaped pipe removed, only the 6 real cell delimiters remain
    expect(row.replace(/\\\|/g, '').split('|').length - 1).toBe(6);
  });

  it('records a declined try as a real answer, not a blank', () => {
    const declined = parsePrioritiesRecord(
      JSON.stringify({
        time_picture: [{ category: 'sleep', first_estimate_hours: 7, revised_hours: null, quality_rating: 'ok', sources_named: [] }],
        try: { named: false, student_words: '', observable_as: '' },
        flags: { declined_try: true, physical_habit_flag: false },
      }),
      AT
    )!;
    const md = prioritiesRecordToMarkdown(declined);
    expect(md).toContain("didn't pick one this time");
    expect(md).toContain('real answer');
  });
});
