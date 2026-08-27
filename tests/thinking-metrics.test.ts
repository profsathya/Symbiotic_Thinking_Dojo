import { describe, it, expect } from 'vitest';
import {
  BALANCE_MARKER_REGEX,
  DIKW_MARKER_REGEX,
  DIKWLevel,
  confirmedPeak,
  recentBalance,
} from '@/lib/types';

describe('what the live balance meter reads', () => {
  it('has nothing to say before anything is rated', () => {
    expect(recentBalance([])).toEqual({ mean: 0, count: 0 });
  });

  it('averages the recent window rather than the whole session', () => {
    expect(recentBalance([2, 2, 2])).toEqual({ mean: 2, count: 3 });
    expect(recentBalance([1, -1])).toEqual({ mean: 0, count: 2 });
  });

  // The bug behind "the meter has no visible relationship to the conversation":
  // a cumulative score pins at +10 after a handful of good turns and then stops
  // responding to anything the student does.
  it('follows the conversation down after a strong start', () => {
    const strongStart = [3, 3, 3, 3, 3];
    const thenDisengaged = [...strongStart, -2, -2, -2, -2, -2];
    expect(recentBalance(strongStart).mean).toBe(3);
    expect(recentBalance(thenDisengaged).mean).toBe(-2);
    // The cumulative total would still read +5 here — hence the window
    expect(thenDisengaged.reduce((a, b) => a + b, 0)).toBe(5);
  });

  it('only looks at the last five turns', () => {
    const history = [3, 3, 3, 3, 3, 0, 0, 0, 0, 0];
    expect(recentBalance(history)).toEqual({ mean: 0, count: 5 });
  });
});

describe('when a DIKW level counts as reached', () => {
  const levels = (...l: DIKWLevel[]) => l;

  it('starts at data', () => {
    expect(confirmedPeak([])).toBe('data');
  });

  // One stray reading — often the Sensei rating its own tradeoffs question —
  // used to crown a session at Wisdom permanently
  it('does not crown a session on a single reading', () => {
    expect(confirmedPeak(levels('information', 'information', 'wisdom'))).toBe('information');
  });

  it('confirms a level the second time it appears', () => {
    expect(confirmedPeak(levels('knowledge', 'information', 'knowledge'))).toBe('knowledge');
  });

  it('takes the highest confirmed level, not the most recent', () => {
    expect(confirmedPeak(levels('wisdom', 'wisdom', 'data', 'data'))).toBe('wisdom');
  });

  it('needs the repeats at the same level, not merely nearby', () => {
    expect(confirmedPeak(levels('knowledge', 'wisdom'))).toBe('data');
  });
});

describe('markers carrying their reason', () => {
  it('reads a balance delta with the move that earned it', () => {
    const match = 'Got it.\n[BALANCE: +2 | revised her sleep number]'.match(BALANCE_MARKER_REGEX)!;
    expect(match[1]).toBe('+2');
    expect(match[2].trim()).toBe('revised her sleep number');
  });

  it('still reads a bare delta, so older sessions and slips parse', () => {
    const match = 'Got it.\n[BALANCE: -1]'.match(BALANCE_MARKER_REGEX)!;
    expect(match[1]).toBe('-1');
    expect(match[2]).toBeUndefined();
  });

  it('reads a DIKW level with its reason', () => {
    const match = 'Okay.\n[DIKW: K | gave a reason for the change]'.match(DIKW_MARKER_REGEX)!;
    expect(match[1]).toBe('K');
    expect(match[2].trim()).toBe('gave a reason for the change');
  });

  it('strips whole markers from what the student sees, reason included', () => {
    const shown = 'Noted.\n[BALANCE: +1 | asked her own question]\n[DIKW: I | described the steps]'
      .replace(BALANCE_MARKER_REGEX, '')
      .replace(DIKW_MARKER_REGEX, '')
      .trim();
    expect(shown).toBe('Noted.');
  });
});
