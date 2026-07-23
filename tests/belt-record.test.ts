import { describe, it, expect } from 'vitest';
import {
  earnedBelts,
  buildBeltRecord,
  beltRecordChecksum,
  beltRecordToJson,
  beltRecordToMarkdown,
  parseBeltRecordJson,
  mergeKataResults,
} from '@/lib/practice-dojo/belt-record';
import { beltTestKata } from '@/lib/practice-dojo/kata-bank';
import { KataResult } from '@/lib/practice-dojo/types';

function result(overrides: Partial<KataResult>): KataResult {
  return {
    kataId: 'war-1b',
    tier: 1,
    language: 'java',
    pattern: 'boolean logic',
    predictionsRight: 2,
    predictionsTotal: 2,
    planHeld: true,
    solved: true,
    at: '2026-07-23T10:00:00.000Z',
    belt: 'yellow',
    ...overrides,
  };
}

const yellowTestId = beltTestKata('yellow')!.id;
const whiteTestId = beltTestKata('white')!.id;

describe('earnedBelts', () => {
  it('awards a belt only for a SOLVED belt-test kata verified against the bank', () => {
    const results = [
      result({}), // ordinary solve — no belt
      result({ kataId: yellowTestId, tier: 3, beltTest: true, at: '2026-07-23T11:00:00.000Z' }),
      result({ kataId: whiteTestId, belt: 'white', beltTest: true, solved: false }), // failed test
    ];
    const belts = earnedBelts(results);
    expect(belts.map((b) => b.belt)).toEqual(['yellow']);
    expect(belts[0].earnedAt).toBe('2026-07-23T11:00:00.000Z');
  });

  it('does not trust a beltTest flag on a non-belt-test kata', () => {
    const forged = [result({ kataId: 'war-1b', beltTest: true })];
    expect(earnedBelts(forged)).toEqual([]);
  });

  it('orders belts by belt order and keeps the earliest earn date', () => {
    const results = [
      result({ kataId: yellowTestId, at: '2026-07-23T12:00:00.000Z' }),
      result({ kataId: yellowTestId, at: '2026-07-23T09:00:00.000Z' }),
      result({ kataId: whiteTestId, belt: 'white', at: '2026-07-23T13:00:00.000Z' }),
    ];
    const belts = earnedBelts(results);
    expect(belts.map((b) => b.belt)).toEqual(['white', 'yellow']);
    expect(belts[1].earnedAt).toBe('2026-07-23T09:00:00.000Z');
  });
});

describe('belt record build + export', () => {
  const results = [
    result({ edgeFound: true, defended: true }),
    result({ kataId: yellowTestId, at: '2026-07-23T11:00:00.000Z', predictionsRight: 1 }),
    result({ kataId: 'log-1a', solved: false, planHeld: false, at: '2026-07-23T12:00:00.000Z' }),
  ];
  const record = buildBeltRecord(results, '2026-07-23T14:00:00.000Z');

  it('aggregates the scorecard totals', () => {
    expect(record.totals.katasAttempted).toBe(3);
    expect(record.totals.katasSolved).toBe(2);
    expect(record.totals.predictionsRight).toBe(5);
    expect(record.totals.predictionsTotal).toBe(6);
    expect(record.totals.plansHeld).toBe(2);
    expect(record.totals.edgesFound).toBe(1);
    expect(record.totals.decisionsDefended).toBe(1);
    expect(record.belts.map((b) => b.belt)).toEqual(['yellow']);
  });

  it('markdown contains belts, scorecard, trace, and checksum', () => {
    const md = beltRecordToMarkdown(record);
    expect(md).toContain('Belt Record');
    expect(md).toContain('Yellow Belt');
    expect(md).toContain('5/6 test-case predictions correct');
    expect(md).toContain('| Edge cases found | 1 |');
    expect(md).toContain(yellowTestId);
    expect(md).toContain(beltRecordChecksum(results));
  });

  it('json round-trips through parseBeltRecordJson with a valid checksum', () => {
    const json = beltRecordToJson(record);
    const parsed = parseBeltRecordJson(json);
    expect(parsed).not.toBeNull();
    expect(parsed!.checksumOk).toBe(true);
    expect(parsed!.results.length).toBe(3);
    expect(parsed!.results[1].kataId).toBe(yellowTestId);
  });

  it('flags a tampered export via the checksum', () => {
    const json = beltRecordToJson(record).replace('"solved": false', '"solved": true');
    const parsed = parseBeltRecordJson(json);
    expect(parsed).not.toBeNull();
    expect(parsed!.checksumOk).toBe(false);
  });

  it('rejects non-record JSON', () => {
    expect(parseBeltRecordJson('{"hello": 1}')).toBeNull();
    expect(parseBeltRecordJson('not json')).toBeNull();
  });
});

describe('mergeKataResults (cross-device restore)', () => {
  it('dedupes on kataId+at and keeps chronological order', () => {
    const a = result({ at: '2026-07-23T10:00:00.000Z' });
    const b = result({ kataId: 'log-1a', at: '2026-07-23T12:00:00.000Z' });
    const c = result({ kataId: 'yel-2a', at: '2026-07-23T11:00:00.000Z' });
    const merged = mergeKataResults([a, b], [a, c]);
    expect(merged.map((r) => r.kataId)).toEqual(['war-1b', 'yel-2a', 'log-1a']);
    expect(merged.length).toBe(3);
  });

  it('merging the same export twice is a no-op', () => {
    const existing = [result({})];
    const once = mergeKataResults(existing, existing);
    expect(once.length).toBe(1);
  });
});
