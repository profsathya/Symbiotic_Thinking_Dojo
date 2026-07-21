import { describe, it, expect } from 'vitest';
import { tokenize, tokenizeToLines, normalizeLanguage, Token } from '@/lib/highlight';
import { splitMessageContent, filenameFor, languageLabel } from '@/lib/message-format';

// Concatenating token texts must always reproduce the input exactly — a
// highlighter that drops or duplicates characters is worse than none.
function roundtrips(code: string, language: 'java' | 'python' | 'javascript'): boolean {
  return tokenize(code, language).map((t) => t.text).join('') === code;
}

function typeOf(tokens: Token[], text: string): string | undefined {
  return tokens.find((t) => t.text === text)?.type;
}

describe('normalizeLanguage', () => {
  it('maps aliases to supported languages', () => {
    expect(normalizeLanguage('java')).toBe('java');
    expect(normalizeLanguage('PY')).toBe('python');
    expect(normalizeLanguage('python')).toBe('python');
    expect(normalizeLanguage('js')).toBe('javascript');
    expect(normalizeLanguage('ts')).toBe('javascript');
    expect(normalizeLanguage('')).toBe('plain');
    expect(normalizeLanguage('rust')).toBe('plain');
    expect(normalizeLanguage(undefined)).toBe('plain');
  });
});

describe('tokenizer round-trips (no lost characters)', () => {
  it('java', () => {
    expect(roundtrips('public int doubleOrZero(int n) { return n < 0 ? 0 : n * 2; }', 'java')).toBe(true);
  });
  it('python', () => {
    expect(roundtrips('def clamp(n):\n    # keep in range\n    return max(0, min(100, n))', 'python')).toBe(true);
  });
  it('javascript', () => {
    expect(roundtrips('function f(x) {\n  const s = `hi ${x}`;\n  return s;\n}', 'javascript')).toBe(true);
  });
  it('preserves an unterminated string without hanging', () => {
    expect(roundtrips('String s = "oops', 'java')).toBe(true);
  });
});

describe('token classification', () => {
  it('classifies keywords, types, numbers, and calls in Java', () => {
    const tokens = tokenize('public int n = countTarget(xs, 5);', 'java');
    expect(typeOf(tokens, 'public')).toBe('keyword');
    expect(typeOf(tokens, 'int')).toBe('type');
    expect(typeOf(tokens, 'countTarget')).toBe('function');
    expect(typeOf(tokens, '5')).toBe('number');
  });

  it('colours a line comment as comment, not its keywords', () => {
    const tokens = tokenize('// return the answer\nreturn n;', 'java');
    const comment = tokens.find((t) => t.type === 'comment');
    expect(comment?.text).toBe('// return the answer');
    // The 'return' inside the comment must NOT be a separate keyword token.
    const keywordReturns = tokens.filter((t) => t.text === 'return' && t.type === 'keyword');
    expect(keywordReturns.length).toBe(1); // only the real one on line 2
  });

  it('does not treat keywords inside strings as keywords', () => {
    const tokens = tokenize('String s = "return if for";', 'java');
    const str = tokens.find((t) => t.type === 'string');
    expect(str?.text).toBe('"return if for"');
    expect(tokens.some((t) => t.type === 'keyword')).toBe(false);
  });

  it('handles Python # comments and None/True', () => {
    const tokens = tokenize('x = None  # done', 'python');
    expect(typeOf(tokens, 'None')).toBe('type');
    expect(tokens.find((t) => t.type === 'comment')?.text).toBe('# done');
  });

  it('leaves unknown languages entirely plain', () => {
    const tokens = tokenize('SELECT * FROM t', 'plain');
    expect(tokens.every((t) => t.type === 'plain')).toBe(true);
  });
});

describe('tokenizeToLines', () => {
  it('splits into one entry per source line', () => {
    const lines = tokenizeToLines('int a = 1;\nint b = 2;', 'java');
    expect(lines.length).toBe(2);
    expect(lines[0].map((t) => t.text).join('')).toBe('int a = 1;');
    expect(lines[1].map((t) => t.text).join('')).toBe('int b = 2;');
  });

  it('keeps a block comment colour across the lines it spans', () => {
    const lines = tokenizeToLines('/* one\n   two */\nint x;', 'java');
    expect(lines.length).toBe(3);
    expect(lines[0][0].type).toBe('comment');
    expect(lines[1][0].type).toBe('comment');
  });
});

describe('splitMessageContent', () => {
  it('returns a single text segment when there is no code', () => {
    const segments = splitMessageContent('Just some prose with `inline` code.');
    expect(segments.length).toBe(1);
    expect(segments[0].type).toBe('text');
  });

  it('extracts a fenced block with its language and strips the trailing newline', () => {
    const content = 'Here is the signature:\n```java\npublic int f(int n)\n```\nWhat is your plan?';
    const segments = splitMessageContent(content);
    expect(segments.map((s) => s.type)).toEqual(['text', 'code', 'text']);
    const code = segments.find((s) => s.type === 'code');
    expect(code).toMatchObject({ language: 'java', code: 'public int f(int n)' });
  });

  it('handles an untagged fence as plain code', () => {
    const segments = splitMessageContent('```\nsome code\n```');
    expect(segments.length).toBe(1);
    expect(segments[0]).toMatchObject({ type: 'code', language: 'plain' });
  });

  it('handles multiple code blocks', () => {
    const content = '```java\na\n```\nmid\n```python\nb\n```';
    const segments = splitMessageContent(content);
    expect(segments.map((s) => s.type)).toEqual(['code', 'text', 'code']);
  });
});

describe('IDE labels', () => {
  it('gives a filename and label per language', () => {
    expect(filenameFor('java', 'java')).toBe('Solution.java');
    expect(filenameFor('python', 'py')).toBe('solution.py');
    expect(filenameFor('javascript', 'js')).toBe('solution.js');
    expect(languageLabel('java', 'java')).toBe('Java');
    expect(languageLabel('plain', 'sql')).toBe('sql');
  });
});
