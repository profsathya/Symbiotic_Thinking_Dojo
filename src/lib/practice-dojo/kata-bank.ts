/**
 * Kata bank for the Code Kata Dojo (intro-programming topic).
 *
 * Original problems in the CodingBat genre — small pure functions checked
 * against a visible test table — but written for this project (CodingBat's
 * own problems are copyrighted; we borrow the format, not the items).
 *
 * The bank is structured data so the app can verify invariants (tests cover
 * it) and future versions can render test-table visuals or run JS for real.
 * Today it is rendered into the topic's system prompt via renderKataBank(),
 * and the model acts as the referee.
 *
 * Statements are written theme-neutral; themeHint tells the Sensei how to
 * re-skin the story to the student's interest WITHOUT changing the
 * signature, the semantics, or the test table.
 */

export type KataCategory = 'warmup' | 'strings' | 'arrays' | 'logic';

export interface Kata {
  id: string;
  category: KataCategory;
  tier: 1 | 2 | 3;
  /** The reusable move — what the Evaluate step should surface. */
  pattern: string;
  title: string;
  statement: string;
  /** How to re-skin the story to a student interest (never the semantics). */
  themeHint: string;
  signatures: {
    java: string;
    python: string;
    javascript: string;
  };
  /** Display-form test cases: args → expected value. */
  tests: { input: string; expected: string }[];
}

export const KATA_BANK: Kata[] = [
  // ============================== WARMUP ==============================
  {
    id: 'war-1a',
    category: 'warmup',
    tier: 1,
    pattern: 'guard clause',
    title: 'doubleOrZero',
    statement:
      'Given an int n, return n doubled. But if n is negative, return 0 instead.',
    themeHint: 'n can be points scored, coins collected, likes received…',
    signatures: {
      java: 'public int doubleOrZero(int n)',
      python: 'def double_or_zero(n):',
      javascript: 'function doubleOrZero(n)',
    },
    tests: [
      { input: '5', expected: '10' },
      { input: '-3', expected: '0' },
      { input: '0', expected: '0' },
      { input: '100', expected: '200' },
    ],
  },
  {
    id: 'war-1b',
    category: 'warmup',
    tier: 1,
    pattern: 'boolean logic',
    title: 'matchingParity',
    statement:
      'Given two ints a and b, return true if both are even or both are odd.',
    themeHint: 'a and b can be two players’ scores, two song lengths…',
    signatures: {
      java: 'public boolean matchingParity(int a, int b)',
      python: 'def matching_parity(a, b):',
      javascript: 'function matchingParity(a, b)',
    },
    tests: [
      { input: '2, 4', expected: 'true' },
      { input: '3, 7', expected: 'true' },
      { input: '2, 3', expected: 'false' },
      { input: '0, 5', expected: 'false' },
    ],
  },
  {
    id: 'war-2a',
    category: 'warmup',
    tier: 2,
    pattern: 'clamping (min/max)',
    title: 'clampScore',
    statement:
      'Given an int n, clamp it into the range 0..100: values below 0 become 0, values above 100 become 100, everything else is unchanged.',
    themeHint: 'a volume slider, a health bar, a grade…',
    signatures: {
      java: 'public int clampScore(int n)',
      python: 'def clamp_score(n):',
      javascript: 'function clampScore(n)',
    },
    tests: [
      { input: '45', expected: '45' },
      { input: '-10', expected: '0' },
      { input: '130', expected: '100' },
      { input: '100', expected: '100' },
    ],
  },
  {
    id: 'war-2b',
    category: 'warmup',
    tier: 2,
    pattern: 'absolute difference',
    title: 'closerTo',
    statement:
      'Given ints a, b, and target, return whichever of a or b is closer to target. If they are equally close, return a.',
    themeHint: 'guesses in a guessing game, two prices vs a budget…',
    signatures: {
      java: 'public int closerTo(int a, int b, int target)',
      python: 'def closer_to(a, b, target):',
      javascript: 'function closerTo(a, b, target)',
    },
    tests: [
      { input: '7, 4, 6', expected: '7' },
      { input: '1, 9, 6', expected: '9' },
      { input: '3, 5, 4', expected: '3' },
      { input: '10, 2, 2', expected: '2' },
    ],
  },
  {
    id: 'war-3a',
    category: 'warmup',
    tier: 3,
    pattern: 'modular arithmetic',
    title: 'wrapIndex',
    statement:
      'Given an int i (possibly negative) and a size n (n > 0), return i wrapped into the range 0..n-1, the way positions wrap around a circle of n slots.',
    themeHint: 'a circular playlist, seats around a table, a game board loop…',
    signatures: {
      java: 'public int wrapIndex(int i, int n)',
      python: 'def wrap_index(i, n):',
      javascript: 'function wrapIndex(i, n)',
    },
    tests: [
      { input: '5, 4', expected: '1' },
      { input: '-1, 4', expected: '3' },
      { input: '8, 4', expected: '0' },
      { input: '2, 7', expected: '2' },
    ],
  },
  {
    id: 'war-3b',
    category: 'warmup',
    tier: 3,
    pattern: 'ceiling division',
    title: 'stepsBetween',
    statement:
      'Given ints start, end, and step (step > 0, end >= start), return how many steps of size step it takes to reach or pass end starting from start. If start equals end, return 0.',
    themeHint: 'levels to grind, savings toward a goal, laps to run…',
    signatures: {
      java: 'public int stepsBetween(int start, int end, int step)',
      python: 'def steps_between(start, end, step):',
      javascript: 'function stepsBetween(start, end, step)',
    },
    tests: [
      { input: '0, 10, 2', expected: '5' },
      { input: '0, 10, 3', expected: '4' },
      { input: '5, 5, 3', expected: '0' },
      { input: '1, 2, 5', expected: '1' },
    ],
  },

  // ============================== STRINGS ==============================
  {
    id: 'str-1a',
    category: 'strings',
    tier: 1,
    pattern: 'index access',
    title: 'edges',
    statement:
      'Given a non-empty string s, return a new string made of its first and last characters. A one-character string uses that character twice.',
    themeHint: 'a username, a song title, a team name…',
    signatures: {
      java: 'public String edges(String s)',
      python: 'def edges(s):',
      javascript: 'function edges(s)',
    },
    tests: [
      { input: '"code"', expected: '"ce"' },
      { input: '"a"', expected: '"aa"' },
      { input: '"hi"', expected: '"hi"' },
      { input: '"kata"', expected: '"ka"' },
    ],
  },
  {
    id: 'str-1b',
    category: 'strings',
    tier: 1,
    pattern: 'index arithmetic',
    title: 'middle',
    statement:
      'Given a non-empty string s, return its middle: the middle two characters when the length is even, the middle one character when the length is odd.',
    themeHint: 'any word the student cares about — a handle, a title…',
    signatures: {
      java: 'public String middle(String s)',
      python: 'def middle(s):',
      javascript: 'function middle(s)',
    },
    tests: [
      { input: '"code"', expected: '"od"' },
      { input: '"cat"', expected: '"a"' },
      { input: '"go"', expected: '"go"' },
      { input: '"stars"', expected: '"a"' },
    ],
  },
  {
    id: 'str-2a',
    category: 'strings',
    tier: 2,
    pattern: 'adjacent scan',
    title: 'countDoubles',
    statement:
      'Given a string s, count the positions where a character is immediately followed by the same character.',
    themeHint: 'double letters in chat messages, repeated notes in a melody…',
    signatures: {
      java: 'public int countDoubles(String s)',
      python: 'def count_doubles(s):',
      javascript: 'function countDoubles(s)',
    },
    tests: [
      { input: '"aabbc"', expected: '2' },
      { input: '"abc"', expected: '0' },
      { input: '"aaa"', expected: '2' },
      { input: '""', expected: '0' },
    ],
  },
  {
    id: 'str-2b',
    category: 'strings',
    tier: 2,
    pattern: 'split and accumulate',
    title: 'initials',
    statement:
      'Given a string of words separated by single spaces, return the first letter of each word, uppercased, joined by periods.',
    themeHint: 'player names, artist names, book titles…',
    signatures: {
      java: 'public String initials(String s)',
      python: 'def initials(s):',
      javascript: 'function initials(s)',
    },
    tests: [
      { input: '"grace hopper"', expected: '"G.H"' },
      { input: '"ada"', expected: '"A"' },
      { input: '"alan m turing"', expected: '"A.M.T"' },
    ],
  },
  {
    id: 'str-3a',
    category: 'strings',
    tier: 3,
    pattern: 'run tracking',
    title: 'runLength',
    statement:
      'Given a string s, return its run-length encoding: each maximal run of a repeated character becomes the character followed by the run count. The empty string returns the empty string.',
    themeHint: 'compressing chat spam ("loooool"), streaks in a game log…',
    signatures: {
      java: 'public String runLength(String s)',
      python: 'def run_length(s):',
      javascript: 'function runLength(s)',
    },
    tests: [
      { input: '"aaabb"', expected: '"a3b2"' },
      { input: '"abc"', expected: '"a1b1c1"' },
      { input: '""', expected: '""' },
      { input: '"zzzz"', expected: '"z4"' },
    ],
  },
  {
    id: 'str-3b',
    category: 'strings',
    tier: 3,
    pattern: 'counter as stack',
    title: 'balanced',
    statement:
      'Given a string containing only the characters ( and ), return true if the parentheses are balanced: every ( is closed by a later ), and no ) appears before its (.',
    themeHint: 'matching open/close tags, quest start/finish pairs…',
    signatures: {
      java: 'public boolean balanced(String s)',
      python: 'def balanced(s):',
      javascript: 'function balanced(s)',
    },
    tests: [
      { input: '"(())"', expected: 'true' },
      { input: '"()()"', expected: 'true' },
      { input: '"(()"', expected: 'false' },
      { input: '")("', expected: 'false' },
    ],
  },

  // ============================== ARRAYS ==============================
  {
    id: 'arr-1a',
    category: 'arrays',
    tier: 1,
    pattern: 'accumulator',
    title: 'countTarget',
    statement:
      'Given an int array xs and an int target, return how many times target appears in xs.',
    themeHint: 'counting a jersey number in play logs, a rating in reviews…',
    signatures: {
      java: 'public int countTarget(int[] xs, int target)',
      python: 'def count_target(xs, target):',
      javascript: 'function countTarget(xs, target)',
    },
    tests: [
      { input: '[1, 2, 2, 3], 2', expected: '2' },
      { input: '[5], 5', expected: '1' },
      { input: '[1, 3], 2', expected: '0' },
      { input: '[], 7', expected: '0' },
    ],
  },
  {
    id: 'arr-1b',
    category: 'arrays',
    tier: 1,
    pattern: 'edge indexing',
    title: 'endsMatch',
    statement:
      'Given a non-empty int array xs, return true if the first and last elements are equal.',
    themeHint: 'a setlist that opens and closes with the same song…',
    signatures: {
      java: 'public boolean endsMatch(int[] xs)',
      python: 'def ends_match(xs):',
      javascript: 'function endsMatch(xs)',
    },
    tests: [
      { input: '[3, 1, 3]', expected: 'true' },
      { input: '[2, 2]', expected: 'true' },
      { input: '[1, 2]', expected: 'false' },
      { input: '[9]', expected: 'true' },
    ],
  },
  {
    id: 'arr-2a',
    category: 'arrays',
    tier: 2,
    pattern: 'streak tracking',
    title: 'longestRise',
    statement:
      'Given an int array xs, return the length of the longest run of strictly increasing consecutive elements. An empty array returns 0; a single element returns 1.',
    themeHint: 'improving scores across games, rising daily steps…',
    signatures: {
      java: 'public int longestRise(int[] xs)',
      python: 'def longest_rise(xs):',
      javascript: 'function longestRise(xs)',
    },
    tests: [
      { input: '[1, 2, 3, 1, 2]', expected: '3' },
      { input: '[5, 4, 3]', expected: '1' },
      { input: '[2, 2, 3]', expected: '2' },
      { input: '[]', expected: '0' },
    ],
  },
  {
    id: 'arr-2b',
    category: 'arrays',
    tier: 2,
    pattern: 'index parity',
    title: 'altSum',
    statement:
      'Given an int array xs, return the sum of elements at even indices minus the sum of elements at odd indices.',
    themeHint: 'alternating home/away scores, turn-based points…',
    signatures: {
      java: 'public int altSum(int[] xs)',
      python: 'def alt_sum(xs):',
      javascript: 'function altSum(xs)',
    },
    tests: [
      { input: '[10, 3, 2]', expected: '9' },
      { input: '[5]', expected: '5' },
      { input: '[1, 1, 1, 1]', expected: '0' },
      { input: '[]', expected: '0' },
    ],
  },
  {
    id: 'arr-3a',
    category: 'arrays',
    tier: 3,
    pattern: 'two-variable tracking',
    title: 'secondMax',
    statement:
      'Given an int array xs with at least two distinct values, return the largest value that is strictly smaller than the maximum.',
    themeHint: 'the runner-up score, the second-most-played track…',
    signatures: {
      java: 'public int secondMax(int[] xs)',
      python: 'def second_max(xs):',
      javascript: 'function secondMax(xs)',
    },
    tests: [
      { input: '[3, 1, 4, 4, 2]', expected: '3' },
      { input: '[5, 5, 7]', expected: '5' },
      { input: '[1, 2]', expected: '1' },
      { input: '[9, 8, 9, 7]', expected: '8' },
    ],
  },
  {
    id: 'arr-3b',
    category: 'arrays',
    tier: 3,
    pattern: 'prefix sums',
    title: 'splitPoint',
    statement:
      'Given an int array xs, return true if it can be split into a non-empty left part and a non-empty right part with equal sums.',
    themeHint: 'splitting chores, loot, or team points evenly…',
    signatures: {
      java: 'public boolean splitPoint(int[] xs)',
      python: 'def split_point(xs):',
      javascript: 'function splitPoint(xs)',
    },
    tests: [
      { input: '[1, 2, 3]', expected: 'true' },
      { input: '[2, 2]', expected: 'true' },
      { input: '[1, 1, 3]', expected: 'false' },
      { input: '[10]', expected: 'false' },
    ],
  },

  // ============================== LOGIC ==============================
  {
    id: 'log-1a',
    category: 'logic',
    tier: 1,
    pattern: 'boolean composition',
    title: 'freeEntry',
    statement:
      'Entry is free for children under 5 and for members of any age. Given an int age and a boolean member, return true if entry is free.',
    themeHint: 'a museum, a game server, a concert…',
    signatures: {
      java: 'public boolean freeEntry(int age, boolean member)',
      python: 'def free_entry(age, member):',
      javascript: 'function freeEntry(age, member)',
    },
    tests: [
      { input: '3, false', expected: 'true' },
      { input: '30, true', expected: 'true' },
      { input: '30, false', expected: 'false' },
      { input: '5, false', expected: 'false' },
    ],
  },
  {
    id: 'log-1b',
    category: 'logic',
    tier: 1,
    pattern: 'threshold banding',
    title: 'speedCheck',
    statement:
      'Given ints speed and limit, return 0 if speed is at or under the limit, 1 if it is over by at most 10, and 2 if it is over by more than 10.',
    themeHint: 'reaction times, upload sizes, song tempo vs a target…',
    signatures: {
      java: 'public int speedCheck(int speed, int limit)',
      python: 'def speed_check(speed, limit):',
      javascript: 'function speedCheck(speed, limit)',
    },
    tests: [
      { input: '60, 60', expected: '0' },
      { input: '65, 60', expected: '1' },
      { input: '75, 60', expected: '2' },
      { input: '70, 60', expected: '1' },
    ],
  },
  {
    id: 'log-2a',
    category: 'logic',
    tier: 2,
    pattern: 'rule ordering',
    title: 'ticketPrice',
    statement:
      'Base ticket price is 12. Under-13s and 65-and-overs pay 8. Otherwise students pay 9. Peak time adds 2 to whatever the price is. Given int age, boolean student, boolean peak, return the price.',
    themeHint: 'cinema, gig, tournament entry…',
    signatures: {
      java: 'public int ticketPrice(int age, boolean student, boolean peak)',
      python: 'def ticket_price(age, student, peak):',
      javascript: 'function ticketPrice(age, student, peak)',
    },
    tests: [
      { input: '10, false, false', expected: '8' },
      { input: '20, true, true', expected: '11' },
      { input: '70, true, false', expected: '8' },
      { input: '30, false, true', expected: '14' },
    ],
  },
  {
    id: 'log-2b',
    category: 'logic',
    tier: 2,
    pattern: 'rounded division',
    title: 'roundTo',
    statement:
      'Given ints n (n >= 0) and unit (unit > 0), return n rounded to the nearest multiple of unit. Exactly halfway rounds up.',
    themeHint: 'rounding scores, prices, or times for a leaderboard…',
    signatures: {
      java: 'public int roundTo(int n, int unit)',
      python: 'def round_to(n, unit):',
      javascript: 'function roundTo(n, unit)',
    },
    tests: [
      { input: '47, 10', expected: '50' },
      { input: '43, 10', expected: '40' },
      { input: '45, 10', expected: '50' },
      { input: '7, 4', expected: '8' },
    ],
  },
  {
    id: 'log-3a',
    category: 'logic',
    tier: 3,
    pattern: 'interval intersection',
    title: 'overlapMinutes',
    statement:
      'Two events run from s1 to e1 and from s2 to e2 (all ints, start <= end). Return how many minutes they overlap, or 0 if they do not.',
    themeHint: 'streams, practice sessions, class schedules…',
    signatures: {
      java: 'public int overlapMinutes(int s1, int e1, int s2, int e2)',
      python: 'def overlap_minutes(s1, e1, s2, e2):',
      javascript: 'function overlapMinutes(s1, e1, s2, e2)',
    },
    tests: [
      { input: '1, 5, 3, 8', expected: '2' },
      { input: '1, 3, 4, 6', expected: '0' },
      { input: '0, 10, 2, 4', expected: '2' },
      { input: '5, 5, 1, 9', expected: '0' },
    ],
  },
  {
    id: 'log-3b',
    category: 'logic',
    tier: 3,
    pattern: 'compound rules',
    title: 'loyaltyPoints',
    statement:
      'Points earned = spend × multiplier, where the multiplier is 1 for tier 0, 2 for tier 1, and 3 for tier 2. Spending 100 or more adds a flat 50 bonus points after the multiplier. Given ints spend and tier, return the points.',
    themeHint: 'game XP, café stamps, airline miles…',
    signatures: {
      java: 'public int loyaltyPoints(int spend, int tier)',
      python: 'def loyalty_points(spend, tier):',
      javascript: 'function loyaltyPoints(spend, tier)',
    },
    tests: [
      { input: '40, 0', expected: '40' },
      { input: '100, 1', expected: '250' },
      { input: '99, 2', expected: '297' },
      { input: '100, 0', expected: '150' },
    ],
  },
];

const CATEGORY_ORDER: KataCategory[] = ['warmup', 'strings', 'arrays', 'logic'];

export function getKataById(id: string): Kata | undefined {
  return KATA_BANK.find((k) => k.id === id);
}

/**
 * Render the whole bank as a compact markdown block for the topic's system
 * prompt. The model selects, themes, and referees from this text.
 */
export function renderKataBank(): string {
  const sections: string[] = [];
  for (const category of CATEGORY_ORDER) {
    for (const tier of [1, 2, 3] as const) {
      const katas = KATA_BANK.filter((k) => k.category === category && k.tier === tier);
      if (katas.length === 0) continue;
      sections.push(`### ${category} — Tier ${tier}`);
      for (const k of katas) {
        sections.push(
          [
            `- **${k.id} · ${k.title}** (pattern: ${k.pattern})`,
            `  Statement: ${k.statement}`,
            `  Theme hint: ${k.themeHint}`,
            `  Java: \`${k.signatures.java}\` · Python: \`${k.signatures.python}\` · JS: \`${k.signatures.javascript}\``,
            `  Tests: ${k.tests.map((t) => `(${t.input}) → ${t.expected}`).join(' ; ')}`,
          ].join('\n')
        );
      }
    }
  }
  return sections.join('\n');
}
