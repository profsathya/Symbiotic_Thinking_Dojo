/**
 * A small, self-contained syntax highlighter for the three languages the
 * Code Kata Dojo uses (Java, Python, JavaScript) plus a plain fallback.
 *
 * Deliberately dependency-free: kata snippets are short, so a scanning
 * tokenizer is plenty and avoids pulling a large highlighter bundle (and its
 * SSR quirks) into the app. It is not a full parser — it is a good-enough
 * lexer for teaching-sized code, tuned to never let a keyword colour bleed
 * into a string or comment.
 */

export type TokenType =
  | 'comment'
  | 'string'
  | 'number'
  | 'keyword'
  | 'type'
  | 'function'
  | 'plain';

export interface Token {
  text: string;
  type: TokenType;
}

export type CodeLanguage = 'java' | 'python' | 'javascript' | 'plain';

// VS Code Dark+-ish palette — applied inline (Tailwind can't see runtime
// class names, so the component uses these as style colours).
export const TOKEN_COLORS: Record<TokenType, string> = {
  comment: '#6A9955',
  string: '#CE9178',
  number: '#B5CEA8',
  keyword: '#569CD6',
  type: '#4EC9B0',
  function: '#DCDCAA',
  plain: '#D4D4D4',
};

/** Normalize a fence tag (```js, ```py…) to a supported language. */
export function normalizeLanguage(raw: string | undefined | null): CodeLanguage {
  const lang = (raw ?? '').trim().toLowerCase();
  switch (lang) {
    case 'java':
      return 'java';
    case 'py':
    case 'python':
      return 'python';
    case 'js':
    case 'jsx':
    case 'javascript':
    case 'ts':
    case 'typescript':
      return 'javascript';
    default:
      return 'plain';
  }
}

interface LangSpec {
  keywords: Set<string>;
  types: Set<string>;
  lineComment: string; // '//' or '#'
  blockComment: boolean; // /* */
  templateStrings: boolean; // backtick strings (JS)
}

const JAVA: LangSpec = {
  keywords: new Set([
    'abstract', 'assert', 'break', 'case', 'catch', 'class', 'const', 'continue',
    'default', 'do', 'else', 'enum', 'extends', 'final', 'finally', 'for', 'goto',
    'if', 'implements', 'import', 'instanceof', 'interface', 'native', 'new',
    'package', 'private', 'protected', 'public', 'return', 'static', 'strictfp',
    'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient',
    'try', 'volatile', 'while', 'var', 'yield', 'record', 'sealed', 'permits',
  ]),
  types: new Set([
    'int', 'long', 'short', 'byte', 'char', 'boolean', 'float', 'double', 'void',
    'String', 'Integer', 'Boolean', 'Object', 'List', 'Map', 'Set', 'ArrayList',
    'HashMap', 'HashSet', 'true', 'false', 'null',
  ]),
  lineComment: '//',
  blockComment: true,
  templateStrings: false,
};

const PYTHON: LangSpec = {
  keywords: new Set([
    'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue',
    'pass', 'import', 'from', 'as', 'class', 'try', 'except', 'finally', 'raise',
    'with', 'lambda', 'yield', 'global', 'nonlocal', 'and', 'or', 'not', 'in',
    'is', 'del', 'assert', 'async', 'await',
  ]),
  types: new Set([
    'True', 'False', 'None', 'int', 'str', 'float', 'bool', 'list', 'dict', 'set',
    'tuple', 'len', 'range', 'print', 'self', 'enumerate', 'abs', 'min', 'max',
    'sum', 'sorted', 'map', 'filter',
  ]),
  lineComment: '#',
  blockComment: false,
  templateStrings: false,
};

const JAVASCRIPT: LangSpec = {
  keywords: new Set([
    'var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'while',
    'do', 'break', 'continue', 'switch', 'case', 'default', 'new', 'class',
    'extends', 'super', 'this', 'typeof', 'instanceof', 'in', 'of', 'try',
    'catch', 'finally', 'throw', 'delete', 'void', 'yield', 'async', 'await',
    'import', 'export', 'from',
  ]),
  types: new Set([
    'true', 'false', 'null', 'undefined', 'NaN', 'console', 'Math', 'Number',
    'String', 'Boolean', 'Array', 'Object', 'JSON', 'length',
  ]),
  lineComment: '//',
  blockComment: true,
  templateStrings: true,
};

function specFor(language: CodeLanguage): LangSpec | null {
  switch (language) {
    case 'java':
      return JAVA;
    case 'python':
      return PYTHON;
    case 'javascript':
      return JAVASCRIPT;
    default:
      return null;
  }
}

const IDENT_START = /[A-Za-z_$]/;
const IDENT_PART = /[A-Za-z0-9_$]/;
const DIGIT = /[0-9]/;

/**
 * Tokenize a line of code. Multi-line constructs (block comments, template
 * strings) are handled by the caller passing carry-over state — but for
 * kata-sized snippets we tokenize the whole string at once and split into
 * lines afterwards, so this operates on the full source.
 */
export function tokenize(code: string, language: CodeLanguage): Token[] {
  const spec = specFor(language);
  if (!spec) {
    return code.length > 0 ? [{ text: code, type: 'plain' }] : [];
  }

  const tokens: Token[] = [];
  const n = code.length;
  let i = 0;

  const push = (text: string, type: TokenType) => {
    if (text.length > 0) tokens.push({ text, type });
  };

  while (i < n) {
    const ch = code[i];
    const two = code.slice(i, i + 2);

    // Line comment
    if (
      (spec.lineComment === '//' && two === '//') ||
      (spec.lineComment === '#' && ch === '#')
    ) {
      let j = i;
      while (j < n && code[j] !== '\n') j++;
      push(code.slice(i, j), 'comment');
      i = j;
      continue;
    }

    // Block comment
    if (spec.blockComment && two === '/*') {
      let j = i + 2;
      while (j < n && code.slice(j, j + 2) !== '*/') j++;
      j = Math.min(j + 2, n);
      push(code.slice(i, j), 'comment');
      i = j;
      continue;
    }

    // Strings: double, single, and (JS) template
    if (ch === '"' || ch === "'" || (spec.templateStrings && ch === '`')) {
      const quote = ch;
      let j = i + 1;
      while (j < n) {
        if (code[j] === '\\') {
          j += 2;
          continue;
        }
        if (code[j] === quote) {
          j++;
          break;
        }
        // A newline ends a non-template string (keeps a runaway quote from
        // swallowing the rest of the snippet).
        if (code[j] === '\n' && quote !== '`') break;
        j++;
      }
      push(code.slice(i, j), 'string');
      i = j;
      continue;
    }

    // Numbers
    if (DIGIT.test(ch)) {
      let j = i;
      while (j < n && (DIGIT.test(code[j]) || code[j] === '.')) j++;
      push(code.slice(i, j), 'number');
      i = j;
      continue;
    }

    // Identifiers / keywords / types / function calls
    if (IDENT_START.test(ch)) {
      let j = i;
      while (j < n && IDENT_PART.test(code[j])) j++;
      const word = code.slice(i, j);
      // Peek past spaces for a '(' to detect a call.
      let k = j;
      while (k < n && (code[k] === ' ' || code[k] === '\t')) k++;
      const isCall = code[k] === '(';

      let type: TokenType;
      if (spec.keywords.has(word)) type = 'keyword';
      else if (spec.types.has(word)) type = 'type';
      else if (isCall) type = 'function';
      else type = 'plain';

      push(word, type);
      i = j;
      continue;
    }

    // Anything else (whitespace, punctuation, operators) — plain, coalesced
    // up to the next "interesting" character.
    let j = i;
    while (
      j < n &&
      !IDENT_START.test(code[j]) &&
      !DIGIT.test(code[j]) &&
      code[j] !== '"' &&
      code[j] !== "'" &&
      !(spec.templateStrings && code[j] === '`') &&
      !(spec.lineComment === '#' && code[j] === '#') &&
      code.slice(j, j + 2) !== '//' &&
      !(spec.blockComment && code.slice(j, j + 2) === '/*')
    ) {
      j++;
    }
    if (j === i) j++; // always make progress
    push(code.slice(i, j), 'plain');
    i = j;
  }

  return tokens;
}

/**
 * Tokenize and split into lines for rendering with a line-number gutter.
 * A token that spans newlines (block comment, template string) is split so
 * each line keeps the token's colour.
 */
export function tokenizeToLines(code: string, language: CodeLanguage): Token[][] {
  const tokens = tokenize(code, language);
  const lines: Token[][] = [[]];

  for (const token of tokens) {
    const segments = token.text.split('\n');
    segments.forEach((segment, idx) => {
      if (idx > 0) lines.push([]);
      if (segment.length > 0) {
        lines[lines.length - 1].push({ text: segment, type: token.type });
      }
    });
  }

  return lines;
}
