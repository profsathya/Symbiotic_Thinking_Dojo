/**
 * Splits assistant/user message text into fenced code blocks and prose runs,
 * so the chat renderer can present code in an IDE-styled pane while keeping
 * the rest as ordinary prose.
 *
 * dojo-visual blocks are extracted upstream (parseDojoVisuals), so this only
 * ever sees ```lang … ``` code fences and plain text.
 */

import { CodeLanguage, normalizeLanguage } from './highlight';

export type MessageSegment =
  | { type: 'code'; language: CodeLanguage; rawLanguage: string; code: string }
  | { type: 'text'; text: string };

// ```lang\n<body>``` — language tag optional; body is non-greedy.
const CODE_FENCE_REGEX = /```([A-Za-z0-9+#._-]*)[ \t]*\r?\n?([\s\S]*?)```/g;

export function splitMessageContent(content: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  CODE_FENCE_REGEX.lastIndex = 0;
  while ((match = CODE_FENCE_REGEX.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      if (text.trim().length > 0) segments.push({ type: 'text', text });
    }

    const rawLanguage = match[1] ?? '';
    // Trim a single trailing newline the closing fence leaves behind.
    const code = match[2].replace(/\n$/, '');
    segments.push({
      type: 'code',
      language: normalizeLanguage(rawLanguage),
      rawLanguage,
      code,
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const text = content.slice(lastIndex);
    if (text.trim().length > 0) segments.push({ type: 'text', text });
  }

  // No fences at all → a single text segment (preserving original content).
  if (segments.length === 0) {
    segments.push({ type: 'text', text: content });
  }

  return segments;
}

/** A friendly filename for the IDE tab, by language. */
export function filenameFor(language: CodeLanguage, rawLanguage: string): string {
  switch (language) {
    case 'java':
      return 'Solution.java';
    case 'python':
      return 'solution.py';
    case 'javascript':
      return 'solution.js';
    default:
      return rawLanguage.trim() ? `snippet.${rawLanguage.trim().toLowerCase()}` : 'snippet.txt';
  }
}

/** The label shown on the IDE tab / header. */
export function languageLabel(language: CodeLanguage, rawLanguage: string): string {
  switch (language) {
    case 'java':
      return 'Java';
    case 'python':
      return 'Python';
    case 'javascript':
      return 'JavaScript';
    default:
      return rawLanguage.trim() || 'Code';
  }
}
