import { describe, it, expect } from 'vitest';
import { tokenize, tokenizeToLines, normalizeLanguage, Token } from '@/lib/highlight';
import { splitMessageContent, filenameFor, languageLabel, buildCodeInsertion } from '@/lib/message-format';

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

describe('buildCodeInsertion (composer Code button)', () => {
  it('wraps the whole message when there is no selection and no existing fence', () => {
    const value = 'int x = 5;';
    const r = buildCodeInsertion(value, 0, 0, 'java');
    expect(r.text).toBe('```java\nint x = 5;\n```');
    // The wrapped code is selected so the student can keep typing/replace.
    expect(r.text.slice(r.caretStart, r.caretEnd)).toBe('int x = 5;');
  });

  it('wraps only the selection when one exists', () => {
    const value = 'before CODE after';
    const start = 'before '.length;
    const end = start + 'CODE'.length;
    const r = buildCodeInsertion(value, start, end, 'python');
    expect(r.text).toBe('before ```python\nCODE\n``` after');
    expect(r.text.slice(r.caretStart, r.caretEnd)).toBe('CODE');
  });

  it('inserts an empty scaffold at the caret when the value is empty', () => {
    const r = buildCodeInsertion('', 0, 0, 'javascript');
    expect(r.text).toBe('```javascript\n\n```');
    // Caret sits on the empty line inside the fence, nothing selected.
    expect(r.caretStart).toBe(r.caretEnd);
    expect(r.caretStart).toBe('```javascript\n'.length);
  });

  it('inserts a scaffold (does not double-wrap) when a fence already exists', () => {
    const value = '```java\nint a;\n```';
    const caret = value.length;
    const r = buildCodeInsertion(value, caret, caret, 'java');
    expect(r.text.startsWith(value)).toBe(true);
    expect(r.text.endsWith('```java\n\n```')).toBe(true);
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
