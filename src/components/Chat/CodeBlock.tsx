'use client';

import { useEffect, useRef, useState } from 'react';
import { CodeLanguage, tokenizeToLines, TOKEN_COLORS } from '@/lib/highlight';
import { filenameFor, languageLabel } from '@/lib/message-format';

interface CodeBlockProps {
  code: string;
  language: CodeLanguage;
  rawLanguage: string;
}

// An editor-style pane: a neutral IDE background (distinct from the chat
// bubble), a title bar with traffic-light dots + a filename tab, a
// line-number gutter, and syntax-coloured tokens. The visual break signals
// "this is code, read it like an editor" rather than chat prose.
export function CodeBlock({ code, language, rawLanguage }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear a pending "Copied!" reset if the block unmounts first.
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code).then(
      () => {
        setCopied(true);
        if (copyTimer.current) clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopied(false), 1500);
      },
      () => {
        // Clipboard unavailable — no-op; the code is still selectable.
      }
    );
  };

  const lines = tokenizeToLines(code, language);
  const gutterWidth = String(lines.length).length;

  return (
    <div
      className="my-3 overflow-hidden rounded-lg border border-gray-700 shadow-md"
      style={{ backgroundColor: '#1e1e1e' }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between gap-2 border-b border-gray-700 px-3 py-1.5"
        style={{ backgroundColor: '#252526' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#ff5f56' }} />
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#ffbd2e' }} />
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#27c93f' }} />
          </span>
          <span className="truncate font-mono text-xs text-gray-400">
            {filenameFor(language, rawLanguage)}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="rounded bg-gray-700/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-300">
            {languageLabel(language, rawLanguage)}
          </span>
          <button
            onClick={handleCopy}
            className="rounded px-1.5 py-0.5 text-[11px] font-medium text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200"
            aria-label="Copy code"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Code body with line-number gutter */}
      <div className="overflow-x-auto">
        <pre className="min-w-full font-mono text-[13px] leading-relaxed" style={{ color: TOKEN_COLORS.plain }}>
          <code className="block py-2">
            {lines.map((tokens, lineIndex) => (
              <span key={lineIndex} className="flex">
                <span
                  className="select-none pr-4 pl-3 text-right text-gray-600"
                  style={{ minWidth: `${gutterWidth + 2}ch` }}
                  aria-hidden="true"
                >
                  {lineIndex + 1}
                </span>
                <span className="flex-1 whitespace-pre pr-4">
                  {tokens.length === 0
                    ? ' '
                    : tokens.map((token, tokenIndex) => (
                        <span key={tokenIndex} style={{ color: TOKEN_COLORS[token.type] }}>
                          {token.text}
                        </span>
                      ))}
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
