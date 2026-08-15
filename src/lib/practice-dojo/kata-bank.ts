/**
 * Kata bank for the Code Kata Dojo (intro-programming topic) — v2, belts.
 *
 * Original problems in the CodingBat genre — small pure functions checked
 * against a visible test table — but written for this project (CodingBat's
 * own problems are copyrighted; we borrow the format, not the items).
 *
 * v2 organizes the bank into BELTS that mirror a CS1 course's milestones:
 *   white  — Foundations: what a method IS (read/predict before writing)
 *   yellow — Logical operators
 *   orange — Ifs & branching
 *   green  — Strings
 *   blue   — Collections: arrays as the on-ramp, then Maps
 *   black  — OOP principles: encapsulation, inheritance, polymorphism,
 *            abstraction
 *
 * Each belt keeps the tier ladder (1–3) inside it and contains exactly ONE
 * belt-test kata — passing it (full cycle, clean) earns the belt.
 *
 * Kata KINDS beyond plain 'write':
 *   read     — no code written; the student identifies parts / traces flow
 *              (the White-Belt on-ramp for students who don't yet know the
 *              terminology)
 *   predict  — the code is given; the student predicts outputs
 *   bug-hunt — plausible-but-wrong code is given; the student finds which
 *              test breaks and why ("identifying when something isn't
 *              correct")
 *   design   — no test table; the student makes a design decision and
 *              DEFENDS it against the kata's rubric (OOP belt)
 *
 * hiddenTests power the Edge Hunt: they are NOT shown with the kata. Only
 * after the student's code passes the visible tests and they have proposed
 * an edge case of their own does the Sensei reveal and referee them.
 *
 * v1 kata ids are preserved so existing scorecards stay valid.
 */

export type KataBelt = 'white' | 'yellow' | 'orange' | 'green' | 'blue' | 'black';

export const BELT_ORDER: KataBelt[] = ['white', 'yellow', 'orange', 'green', 'blue', 'black'];

export type KataKind = 'read' | 'predict' | 'write' | 'bug-hunt' | 'design';

export interface KataTest {
  input: string;
  expected: string;
}

export interface Kata {
  id: string;
  belt: KataBelt;
  tier: 1 | 2 | 3;
  kind: KataKind;
  /** The reusable move — what the Evaluate step should surface. */
  pattern: string;
  title: string;
  statement: string;
  /** How to re-skin the story to a student interest (never the semantics). */
  themeHint: string;
  /** Passing this kata (full cycle, clean) earns the belt. One per belt. */
  beltTest?: boolean;
  /** Signatures for write katas (starter framing for the student's code). */
  signatures?: {
    java: string;
    python: string;
    javascript: string;
  };
  /**
   * Given code: the snippet to read (read), trace (predict), debug
   * (bug-hunt), or start from (write, as starter code). Java — the Sensei
   * translates on request if the student chose Python/JS.
   */
  code?: string;
  /**
   * Visible test cases. For read/predict katas these are quiz items
   * (question → answer). For bug-hunt katas they state the CORRECT expected
   * behavior the buggy code violates. Design katas may have none.
   */
  tests: KataTest[];
  /** Edge Hunt: revealed only after the student proposes their own edge. */
  hiddenTests?: KataTest[];
  /** Design katas: the criteria a defensible answer must meet. */
  rubric?: string[];
}

export const KATA_BANK: Kata[] = [
  // ============================================================
  // WHITE BELT — Foundations (the on-ramp: read before you write)
  // ============================================================
  {
    id: 'whi-1a',
    belt: 'white',
    tier: 1,
    kind: 'read',
    pattern: 'reading a signature',
    title: 'Parts of a method',
    statement:
      'Look at this method and identify its parts. No code to write — just point at the pieces. (Present each question with selection cards where it helps.)',
    themeHint: 'rename addPoints/score/bonus to fit their interest — game points, likes, savings…',
    code: `public int addPoints(int score, int bonus) {
    return score + bonus;
}`,
    tests: [
      { input: 'Which part is the method’s name?', expected: 'addPoints' },
      { input: 'Which parts are the parameters (the inputs)?', expected: 'score and bonus' },
      { input: 'What TYPE of value comes back?', expected: 'int (a whole number)' },
      { input: 'addPoints(3, 2) — what value comes back?', expected: '5' },
    ],
  },
  {
    id: 'whi-1b',
    belt: 'white',
    tier: 1,
    kind: 'read',
    pattern: 'return vs print',
    title: 'Return is not print',
    statement:
      'Two different things happen here: a value comes BACK, and something appears ON SCREEN. Tell them apart.',
    themeHint: 'half of anything countable — coins, followers, laps…',
    code: `public int half(int n) {
    return n / 2;
}

// elsewhere in the program:
int result = half(10);
System.out.println("got " + result);`,
    tests: [
      { input: 'What value does the caller receive from half(10)?', expected: '5' },
      { input: 'What appears on the screen?', expected: 'got 5' },
      {
        input: 'Does return itself show anything on screen?',
        expected: 'No — return hands a value back to the caller; println is what shows things',
      },
    ],
  },
  {
    id: 'whi-2a',
    belt: 'white',
    tier: 2,
    kind: 'predict',
    pattern: 'tracing a call',
    title: 'One method, three calls',
    statement: 'The code is written for you. Predict what each call returns — no running, just reading.',
    themeHint: 'tripling points, streaks, reps…',
    code: `public int triple(int n) {
    return n * 3;
}`,
    tests: [
      { input: 'triple(4)', expected: '12' },
      { input: 'triple(0)', expected: '0' },
      { input: 'triple(10)', expected: '30' },
    ],
  },
  {
    id: 'whi-2b',
    belt: 'white',
    tier: 2,
    kind: 'predict',
    pattern: 'arguments in, value out',
    title: 'Different input, different output',
    statement:
      'Same method, different arguments. Predict each result — notice how the argument flows into the calculation.',
    themeHint: 'tickets, ride tokens, print credits — anything priced per unit plus a flat fee',
    code: `public int costForTickets(int tickets) {
    return 8 * tickets + 2;
}`,
    tests: [
      { input: 'costForTickets(1)', expected: '10' },
      { input: 'costForTickets(3)', expected: '26' },
      { input: 'costForTickets(0)', expected: '2' },
    ],
  },
  {
    id: 'whi-3a',
    belt: 'white',
    tier: 3,
    kind: 'write',
    pattern: 'completing a method',
    title: 'Finish the return line',
    statement:
      'Your first code in the dojo: the method is started for you — write only the return line so every test passes.',
    themeHint: 'adding ten of anything — bonus points, minutes, dollars…',
    code: `public int addTen(int n) {
    return ____;   // <- your line
}`,
    signatures: {
      java: 'public int addTen(int n)',
      python: 'def add_ten(n):',
      javascript: 'function addTen(n)',
    },
    tests: [
      { input: '5', expected: '15' },
      { input: '0', expected: '10' },
      { input: '-10', expected: '0' },
    ],
    hiddenTests: [{ input: '100', expected: '110' }],
  },
  {
    id: 'war-1a',
    belt: 'white',
    tier: 3,
    kind: 'write',
    beltTest: true,
    pattern: 'guard clause',
    title: 'doubleOrZero',
    statement:
      'Given an int n, return n doubled. But if n is negative, return 0 instead. (White Belt test: a whole method, yours from scratch.)',
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
    hiddenTests: [{ input: '-1', expected: '0' }],
  },

  // ============================================================
  // YELLOW BELT — Logical operators
  // ============================================================
  {
    id: 'war-1b',
    belt: 'yellow',
    tier: 1,
    kind: 'write',
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
    id: 'log-1a',
    belt: 'yellow',
    tier: 1,
    kind: 'write',
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
    id: 'yel-2a',
    belt: 'yellow',
    tier: 2,
    kind: 'write',
    pattern: 'compound conditions',
    title: 'bothInRange',
    statement:
      'Given ints a, b, lo, and hi, return true only if BOTH a and b are within the range lo..hi (inclusive).',
    themeHint: 'two scores inside a bracket, two tempos inside a BPM window…',
    signatures: {
      java: 'public boolean bothInRange(int a, int b, int lo, int hi)',
      python: 'def both_in_range(a, b, lo, hi):',
      javascript: 'function bothInRange(a, b, lo, hi)',
    },
    tests: [
      { input: '3, 7, 1, 10', expected: 'true' },
      { input: '3, 12, 1, 10', expected: 'false' },
      { input: '0, 5, 0, 5', expected: 'true' },
    ],
    hiddenTests: [{ input: '5, 5, 5, 5', expected: 'true' }],
  },
  {
    id: 'yel-2b',
    belt: 'yellow',
    tier: 2,
    kind: 'write',
    pattern: 'exclusive or',
    title: 'exactlyOne',
    statement:
      'Given two booleans a and b, return true if EXACTLY one of them is true.',
    themeHint: 'exactly one power-up active, exactly one coupon applied…',
    signatures: {
      java: 'public boolean exactlyOne(boolean a, boolean b)',
      python: 'def exactly_one(a, b):',
      javascript: 'function exactlyOne(a, b)',
    },
    tests: [
      { input: 'true, false', expected: 'true' },
      { input: 'true, true', expected: 'false' },
      { input: 'false, false', expected: 'false' },
    ],
    hiddenTests: [{ input: 'false, true', expected: 'true' }],
  },
  {
    id: 'yel-2c',
    belt: 'yellow',
    tier: 2,
    kind: 'bug-hunt',
    pattern: 'and vs or',
    title: 'The generous gate',
    statement:
      'Riders may ride only if they are at least 120 cm tall AND have a ticket. This code compiles and often looks right — but one of the tests below fails. Find which one, explain why, and fix it.',
    themeHint: 'age gates, level requirements, tournament entry…',
    code: `public boolean canRide(int height, boolean hasTicket) {
    return height >= 120 || hasTicket;
}`,
    tests: [
      { input: '130, true', expected: 'true' },
      { input: '100, true', expected: 'false' },
      { input: '130, false', expected: 'false' },
    ],
  },
  {
    id: 'yel-3a',
    belt: 'yellow',
    tier: 3,
    kind: 'write',
    beltTest: true,
    pattern: 'negation in conditions',
    title: 'validPassword',
    statement:
      'A password is valid if its length is at least 8, it has a digit, and it does NOT contain a space. Given int len, boolean hasDigit, boolean hasSpace, return whether it’s valid. (Yellow Belt test.)',
    themeHint: 'usernames, team names, save-file names…',
    signatures: {
      java: 'public boolean validPassword(int len, boolean hasDigit, boolean hasSpace)',
      python: 'def valid_password(len_, has_digit, has_space):',
      javascript: 'function validPassword(len, hasDigit, hasSpace)',
    },
    tests: [
      { input: '10, true, false', expected: 'true' },
      { input: '6, true, false', expected: 'false' },
      { input: '9, false, false', expected: 'false' },
      { input: '12, true, true', expected: 'false' },
    ],
    hiddenTests: [{ input: '8, true, false', expected: 'true' }],
  },

  // ============================================================
  // ORANGE BELT — Ifs & branching
  // ============================================================
  {
    id: 'log-1b',
    belt: 'orange',
    tier: 1,
    kind: 'write',
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
    id: 'war-2a',
    belt: 'orange',
    tier: 1,
    kind: 'write',
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
    hiddenTests: [{ input: '0', expected: '0' }],
  },
  {
    id: 'war-2b',
    belt: 'orange',
    tier: 2,
    kind: 'write',
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
    id: 'log-2a',
    belt: 'orange',
    tier: 2,
    kind: 'write',
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
    hiddenTests: [{ input: '12, true, true', expected: '10' }],
  },
  {
    id: 'log-2b',
    belt: 'orange',
    tier: 2,
    kind: 'write',
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
    id: 'ora-2a',
    belt: 'orange',
    tier: 2,
    kind: 'bug-hunt',
    pattern: 'branch ordering',
    title: 'The D-shaped ceiling',
    statement:
      'Letter bands: 90+ is "A", 80+ is "B", 70+ is "C", 60+ is "D", below 60 is "F". This code compiles — but most of the tests below fail. Work out why the ORDER of the checks matters, then fix it.',
    themeHint: 'medal tiers, rank ladders, loyalty levels…',
    code: `public String gradeBand(int score) {
    if (score >= 60) return "D";
    if (score >= 70) return "C";
    if (score >= 80) return "B";
    if (score >= 90) return "A";
    return "F";
}`,
    tests: [
      { input: '95', expected: '"A"' },
      { input: '72', expected: '"C"' },
      { input: '50', expected: '"F"' },
    ],
    hiddenTests: [{ input: '89', expected: '"B"' }],
  },
  {
    id: 'log-3b',
    belt: 'orange',
    tier: 3,
    kind: 'write',
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
  {
    id: 'log-3a',
    belt: 'orange',
    tier: 3,
    kind: 'write',
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
    id: 'war-3b',
    belt: 'orange',
    tier: 3,
    kind: 'write',
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
  {
    id: 'ora-3a',
    belt: 'orange',
    tier: 3,
    kind: 'write',
    beltTest: true,
    pattern: 'ordered rule application',
    title: 'shippingCost',
    statement:
      'Shipping starts at a base of 5. Weight over 10 adds 3. Express doubles the total so far. Remote delivery adds 4 at the very end. Given int weight, boolean express, boolean remote, return the cost — the ORDER the rules apply in is part of the problem. (Orange Belt test.)',
    themeHint: 'delivery of merch, equipment, care packages…',
    signatures: {
      java: 'public int shippingCost(int weight, boolean express, boolean remote)',
      python: 'def shipping_cost(weight, express, remote):',
      javascript: 'function shippingCost(weight, express, remote)',
    },
    tests: [
      { input: '5, false, false', expected: '5' },
      { input: '12, false, false', expected: '8' },
      { input: '12, true, false', expected: '16' },
      { input: '5, true, true', expected: '14' },
    ],
    hiddenTests: [{ input: '11, true, true', expected: '20' }],
  },

  // ============================================================
  // GREEN BELT — Strings
  // ============================================================
  {
    id: 'str-1a',
    belt: 'green',
    tier: 1,
    kind: 'write',
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
    belt: 'green',
    tier: 1,
    kind: 'write',
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
    belt: 'green',
    tier: 2,
    kind: 'write',
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
    hiddenTests: [{ input: '"a"', expected: '0' }],
  },
  {
    id: 'str-2b',
    belt: 'green',
    tier: 2,
    kind: 'write',
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
    id: 'gre-2a',
    belt: 'green',
    tier: 2,
    kind: 'bug-hunt',
    pattern: 'off-by-one at the boundary',
    title: 'The last-character crash',
    statement:
      'This is meant to count doubled letters — and on some inputs it even seems to work. But it CRASHES on every non-empty input. Trace it to the exact index where it dies, explain why, and fix it.',
    themeHint: 'the same doubled-letters story as countDoubles…',
    code: `public int countDoubles(String s) {
    int count = 0;
    for (int i = 0; i < s.length(); i++) {
        if (s.charAt(i) == s.charAt(i + 1)) {
            count = count + 1;
        }
    }
    return count;
}`,
    tests: [
      { input: '"aab"', expected: '1' },
      { input: '"abc"', expected: '0' },
      { input: '""', expected: '0' },
    ],
  },
  {
    id: 'str-3b',
    belt: 'green',
    tier: 3,
    kind: 'write',
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
  {
    id: 'str-3a',
    belt: 'green',
    tier: 3,
    kind: 'write',
    beltTest: true,
    pattern: 'run tracking',
    title: 'runLength',
    statement:
      'Given a string s, return its run-length encoding: each maximal run of a repeated character becomes the character followed by the run count. The empty string returns the empty string. (Green Belt test.)',
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
    hiddenTests: [{ input: '"a"', expected: '"a1"' }],
  },

  // ============================================================
  // BLUE BELT — Collections: arrays on-ramp, then Maps
  // ============================================================
  {
    id: 'arr-1a',
    belt: 'blue',
    tier: 1,
    kind: 'write',
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
    belt: 'blue',
    tier: 1,
    kind: 'write',
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
    id: 'war-3a',
    belt: 'blue',
    tier: 1,
    kind: 'write',
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
    id: 'arr-2a',
    belt: 'blue',
    tier: 2,
    kind: 'write',
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
    hiddenTests: [{ input: '[7]', expected: '1' }],
  },
  {
    id: 'arr-2b',
    belt: 'blue',
    tier: 2,
    kind: 'write',
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
    id: 'blu-2a',
    belt: 'blue',
    tier: 2,
    kind: 'write',
    pattern: 'counting with a map',
    title: 'wordCounts',
    statement:
      'Given an array of words, return a map from each word to how many times it appears.',
    themeHint: 'hashtags, song plays, item drops…',
    signatures: {
      java: 'public Map<String, Integer> wordCounts(String[] words)',
      python: 'def word_counts(words):',
      javascript: 'function wordCounts(words)',
    },
    tests: [
      { input: '["a", "b", "a"]', expected: '{a=2, b=1}' },
      { input: '["x"]', expected: '{x=1}' },
      { input: '[]', expected: '{}' },
    ],
    hiddenTests: [{ input: '["a", "a", "a"]', expected: '{a=3}' }],
  },
  {
    id: 'blu-2b',
    belt: 'blue',
    tier: 2,
    kind: 'write',
    pattern: 'safe lookup (getOrDefault)',
    title: 'scoreLookup',
    statement:
      'Given a map of names to scores and a name, return that name’s score — or -1 if the name isn’t in the map.',
    themeHint: 'leaderboards, gradebooks, playlists…',
    signatures: {
      java: 'public int scoreLookup(Map<String, Integer> scores, String name)',
      python: 'def score_lookup(scores, name):',
      javascript: 'function scoreLookup(scores, name)',
    },
    tests: [
      { input: '{amy=90, bo=75}, "amy"', expected: '90' },
      { input: '{amy=90}, "zoe"', expected: '-1' },
      { input: '{}, "amy"', expected: '-1' },
    ],
  },
  {
    id: 'blu-2c',
    belt: 'blue',
    tier: 2,
    kind: 'bug-hunt',
    pattern: 'the missing-key trap',
    title: 'The first-time crash',
    statement:
      'This word counter crashes the FIRST time it sees any word. Work out what counts.get(w) returns for a word that isn’t in the map yet, why that explodes, and fix it.',
    themeHint: 'the same counting story as wordCounts…',
    code: `public Map<String, Integer> wordCounts(String[] words) {
    Map<String, Integer> counts = new HashMap<>();
    for (String w : words) {
        counts.put(w, counts.get(w) + 1);
    }
    return counts;
}`,
    tests: [
      { input: '["a"]', expected: '{a=1}' },
      { input: '["a", "b", "a"]', expected: '{a=2, b=1}' },
    ],
  },
  {
    id: 'arr-3a',
    belt: 'blue',
    tier: 3,
    kind: 'write',
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
    belt: 'blue',
    tier: 3,
    kind: 'write',
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
  {
    id: 'blu-3a',
    belt: 'blue',
    tier: 3,
    kind: 'write',
    pattern: 'aggregate then select',
    title: 'mostFrequent',
    statement:
      'Given a non-empty array of words, return the word that appears most often. If several tie, return the one whose FIRST appearance comes earliest in the array.',
    themeHint: 'most-played song, most-used emote, most-picked champion…',
    signatures: {
      java: 'public String mostFrequent(String[] words)',
      python: 'def most_frequent(words):',
      javascript: 'function mostFrequent(words)',
    },
    tests: [
      { input: '["a", "b", "a"]', expected: '"a"' },
      { input: '["x", "y", "y", "x"]', expected: '"x"' },
      { input: '["solo"]', expected: '"solo"' },
    ],
    hiddenTests: [{ input: '["b", "a", "a", "b"]', expected: '"b"' }],
  },
  {
    id: 'blu-3b',
    belt: 'blue',
    tier: 3,
    kind: 'write',
    beltTest: true,
    pattern: 'reshaping a map',
    title: 'invert',
    statement:
      'Given a map whose values are all unique, return the inverted map: every value becomes a key, and its key becomes the value. (Blue Belt test.)',
    themeHint: 'usernames↔IDs, seats↔students, codes↔prizes…',
    signatures: {
      java: 'public Map<String, String> invert(Map<String, String> m)',
      python: 'def invert(m):',
      javascript: 'function invert(m)',
    },
    tests: [
      { input: '{"a"="x"}', expected: '{"x"="a"}' },
      { input: '{}', expected: '{}' },
      { input: '{"k1"="v1", "k2"="v2"}', expected: '{"v1"="k1", "v2"="k2"}' },
    ],
    hiddenTests: [{ input: '{"a"="a"}', expected: '{"a"="a"}' }],
  },

  // ============================================================
  // BLACK BELT — OOP principles
  // ============================================================
  {
    id: 'bla-1a',
    belt: 'black',
    tier: 1,
    kind: 'predict',
    pattern: 'dynamic dispatch (polymorphism)',
    title: 'Which speak() runs?',
    statement:
      'A variable’s declared type and the object’s actual type can differ. Predict what prints — and be ready to say WHICH class’s method ran and why.',
    themeHint: 'Animal/Dog can become Enemy/Boss, Instrument/Guitar…',
    code: `class Animal {
    String speak() { return "..."; }
}
class Dog extends Animal {
    @Override String speak() { return "woof"; }
}

// elsewhere:
Animal a = new Dog();
System.out.println(a.speak());
Animal b = new Animal();
System.out.println(b.speak());`,
    tests: [
      { input: 'first println', expected: 'woof' },
      { input: 'second println', expected: '...' },
      {
        input: 'For variable a, which speak() ran — Animal’s or Dog’s, and why?',
        expected: 'Dog’s — the OBJECT’s actual type decides at runtime, not the variable’s declared type',
      },
    ],
  },
  {
    id: 'bla-1b',
    belt: 'black',
    tier: 1,
    kind: 'predict',
    pattern: 'super calls (inheritance)',
    title: 'The discounted ticket',
    statement:
      'A subclass can build on its parent’s behavior instead of replacing it. Trace both calls.',
    themeHint: 'tickets can become subscriptions, passes, memberships…',
    code: `class Ticket {
    int price() { return 10; }
}
class StudentTicket extends Ticket {
    @Override int price() { return super.price() - 4; }
}

// elsewhere:
System.out.println(new StudentTicket().price());
System.out.println(new Ticket().price());`,
    tests: [
      { input: 'first println', expected: '6' },
      { input: 'second println', expected: '10' },
      { input: 'What does super.price() return inside StudentTicket?', expected: '10 — the parent’s version' },
    ],
  },
  {
    id: 'bla-2a',
    belt: 'black',
    tier: 2,
    kind: 'write',
    pattern: 'overriding',
    title: 'Square extends Shape',
    statement:
      'Given the Shape base class, write a Square subclass: a side field set in the constructor, and an overridden area(). ',
    themeHint: 'shapes can become units, cards, tiles — anything with a computed stat…',
    code: `class Shape {
    double area() { return 0; }
}`,
    signatures: {
      java: 'class Square extends Shape { Square(int side) {...} double area() {...} }',
      python: 'class Square(Shape): def __init__(self, side) / def area(self)',
      javascript: 'class Square extends Shape { constructor(side) {...} area() {...} }',
    },
    tests: [
      { input: 'new Square(3).area()', expected: '9.0' },
      { input: 'new Square(2).area()', expected: '4.0' },
      { input: 'new Square(0).area()', expected: '0.0' },
    ],
  },
  {
    id: 'bla-2b',
    belt: 'black',
    tier: 2,
    kind: 'write',
    pattern: 'programming to the base type',
    title: 'totalArea',
    statement:
      'Square and Rect both extend Shape and override area(). Write totalArea so it works for ANY mix of shapes — without checking what kind each one is.',
    themeHint: 'summing damage across unit types, cost across item types…',
    code: `class Shape { double area() { return 0; } }
class Square extends Shape { /* side*side */ }
class Rect extends Shape { /* w*h */ }`,
    signatures: {
      java: 'public double totalArea(Shape[] shapes)',
      python: 'def total_area(shapes):',
      javascript: 'function totalArea(shapes)',
    },
    tests: [
      { input: '[Square(2), Rect(2, 3)]', expected: '10.0' },
      { input: '[]', expected: '0.0' },
      { input: '[Square(1)]', expected: '1.0' },
    ],
  },
  {
    id: 'bla-2c',
    belt: 'black',
    tier: 2,
    kind: 'design',
    pattern: 'encapsulation',
    title: 'Who may touch the score?',
    statement:
      'A ScoreKeeper class for a leaderboard has: an int score, a String playerName, void addPoints(int p), and void reset(). Decide which members are private and which are public — then DEFEND each choice. What concretely goes wrong if score is public?',
    themeHint: 'leaderboard, bank balance, health bar — any guarded number…',
    tests: [],
    rubric: [
      'score is private, defended with an INVARIANT (e.g. it must never change except through addPoints/reset), not with "you’re supposed to"',
      'the public surface is behaviors (addPoints, reset, a getter to read) rather than raw data',
      'the defense names a concrete failure: some other code writes score = -999 and the leaderboard silently lies',
    ],
  },
  {
    id: 'bla-3a',
    belt: 'black',
    tier: 3,
    kind: 'design',
    pattern: 'abstraction',
    title: 'Interface or abstract class?',
    statement:
      'You’re adding notifications: Email, SMS, and Push. All three must offer send(String msg). Email and SMS share the same retry logic; Push has none. Interface, abstract class, or both? Decide and DEFEND — the defense matters more than the pick.',
    themeHint: 'notifications can become exporters, renderers, payment channels…',
    tests: [],
    rubric: [
      'distinguishes the CONTRACT (what all three promise: send) from SHARED IMPLEMENTATION (the retry logic two of them share)',
      'ties the choice to what varies vs what is fixed, not to a memorized rule',
      'names one concrete consequence of the wrong choice (retry logic duplicated twice, or Push forced to inherit retry machinery it must stub out)',
    ],
  },
  {
    id: 'bla-3b',
    belt: 'black',
    tier: 3,
    kind: 'bug-hunt',
    pattern: 'the leaky field',
    title: 'The wallet anyone can edit',
    statement:
      'Wallet guards deposits carefully — and yet its invariant ("balance never negative") can be broken in one line, without calling any method. Find the hole, show the one-line attack, and name the one-word fix.',
    themeHint: 'wallet, health bar, inventory count…',
    code: `class Wallet {
    public int balance = 0;

    void deposit(int amount) {
        if (amount > 0) balance += amount;
    }
}

// elsewhere:
Wallet w = new Wallet();
w.deposit(50);`,
    tests: [
      { input: 'Can deposit(-10) corrupt the balance?', expected: 'No — the guard blocks it' },
      { input: 'Can OTHER code corrupt the balance without calling deposit?', expected: 'Yes — w.balance = -999; the public field bypasses every guard' },
      { input: 'The one-word fix?', expected: 'private (plus a getBalance() to read it)' },
    ],
  },
  {
    id: 'bla-3c',
    belt: 'black',
    tier: 3,
    kind: 'design',
    beltTest: true,
    pattern: 'designing a hierarchy',
    title: 'The campus payment hierarchy',
    statement:
      'Design the payment side of a campus app: Card, DiningDollars, and GiftPoints can each pay(amount), each validates differently, and only Card charges a processing fee. Sketch the hierarchy in words or code — base type, what’s abstract, what’s overridden, what’s private — then DEFEND the two decisions you’re least sure of. (Black Belt test.)',
    themeHint: 'payments can become shipping carriers, login providers, save-file formats…',
    tests: [],
    rubric: [
      'a base type exists and calling code programs to it — the polymorphism argument is made, not assumed',
      'the behavior that VARIES (validation) is abstract/overridden per subclass; shared flow stays in one place',
      'the Card-only fee is handled without corrupting the shared logic (an override or hook, defended)',
      'at least one field is private with an invariant-based defense',
      'the two defenses cite failure scenarios, not habits',
    ],
  },
];

export function getKataById(id: string): Kata | undefined {
  return KATA_BANK.find((k) => k.id === id);
}

/** The single belt-test kata for a belt. */
export function beltTestKata(belt: KataBelt): Kata | undefined {
  return KATA_BANK.find((k) => k.belt === belt && k.beltTest);
}

/**
 * Render the whole bank as a compact markdown block for the topic's system
 * prompt. The model selects, themes, and referees from this text.
 */
export function renderKataBank(): string {
  const sections: string[] = [];
  for (const belt of BELT_ORDER) {
    for (const tier of [1, 2, 3] as const) {
      const katas = KATA_BANK.filter((k) => k.belt === belt && k.tier === tier);
      if (katas.length === 0) continue;
      sections.push(`### ${belt.toUpperCase()} BELT — Tier ${tier}`);
      for (const k of katas) {
        const lines = [
          `- **${k.id} · ${k.title}** (${k.kind}${k.beltTest ? ' · BELT TEST' : ''}; pattern: ${k.pattern})`,
          `  Statement: ${k.statement}`,
          `  Theme hint: ${k.themeHint}`,
        ];
        if (k.signatures) {
          lines.push(
            `  Java: \`${k.signatures.java}\` · Python: \`${k.signatures.python}\` · JS: \`${k.signatures.javascript}\``
          );
        }
        if (k.code) {
          lines.push(`  Given code (Java):\n\`\`\`\n${k.code}\n\`\`\``);
        }
        if (k.tests.length > 0) {
          lines.push(`  Tests: ${k.tests.map((t) => `(${t.input}) → ${t.expected}`).join(' ; ')}`);
        }
        if (k.hiddenTests && k.hiddenTests.length > 0) {
          lines.push(
            `  HIDDEN edge tests (reveal ONLY after the student proposes an edge of their own): ${k.hiddenTests
              .map((t) => `(${t.input}) → ${t.expected}`)
              .join(' ; ')}`
          );
        }
        if (k.rubric && k.rubric.length > 0) {
          lines.push(`  Defense rubric:\n${k.rubric.map((r) => `    - ${r}`).join('\n')}`);
        }
        sections.push(lines.join('\n'));
      }
    }
  }
  return sections.join('\n');
}
