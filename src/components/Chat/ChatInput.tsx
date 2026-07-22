'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { buildCodeInsertion } from '@/lib/message-format';

type CodeLang = 'java' | 'python' | 'javascript';
const CODE_LANGS: { id: CodeLang; label: string }[] = [
  { id: 'java', label: 'Java' },
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
];

function toCodeLang(value: string | undefined): CodeLang {
  return value === 'python' || value === 'javascript' || value === 'java' ? value : 'java';
}

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  // Best-effort default for the code-block language (e.g. the dojo's chosen
  // language). The student can still switch it in the composer.
  defaultCodeLanguage?: string;
  // Minimal mode for standalone/mobile surfaces (e.g. the INSPIRE demo):
  // hides the code toolbar and the partner-mention hint for a clean chat.
  minimal?: boolean;
}

export function ChatInput({
  onSend,
  isLoading,
  placeholder = 'Share your challenge or question...',
  defaultCodeLanguage,
  minimal = false,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [codeLang, setCodeLang] = useState<CodeLang>(() => toCodeLang(defaultCodeLanguage));

  // Sync the composer language when the dojo's choice arrives/changes. The
  // input is mounted before the student picks a language, so the initializer
  // above can't see it. Adjust during render (not in an effect) when the
  // incoming default changes; a manual selection still persists because the
  // prop is unchanged on those renders.
  const [lastDefault, setLastDefault] = useState(defaultCodeLanguage);
  if (defaultCodeLanguage !== lastDefault) {
    setLastDefault(defaultCodeLanguage);
    setCodeLang(toCodeLang(defaultCodeLanguage));
  }
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wasLoadingRef = useRef(false);
  // Caret to apply after a code-block insertion re-renders the textarea.
  const pendingCaretRef = useRef<{ start: number; end: number } | null>(null);

  // Auto-resize textarea, and apply any pending caret from a code insertion.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
      if (pendingCaretRef.current) {
        const { start, end } = pendingCaretRef.current;
        pendingCaretRef.current = null;
        textarea.focus();
        textarea.setSelectionRange(start, end);
      }
    }
  }, [value]);

  // Auto-focus input when loading completes (AI response finished)
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading) {
      // Loading just finished, focus the input
      textareaRef.current?.focus();
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading]);

  const handleSubmit = () => {
    if (value.trim() && !isLoading) {
      onSend(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Wrap the selection (or the whole message) in a fenced code block so the
  // student's code renders as an editor pane — no need to type ``` fences.
  const handleInsertCode = () => {
    const textarea = textareaRef.current;
    const selStart = textarea?.selectionStart ?? value.length;
    const selEnd = textarea?.selectionEnd ?? value.length;
    const result = buildCodeInsertion(value, selStart, selEnd, codeLang);
    pendingCaretRef.current = { start: result.caretStart, end: result.caretEnd };
    setValue(result.text);
  };

  const isMonospace = value.includes('```');

  return (
    <div className="border-t border-gray-800 p-4">
      {/* Composer toolbar (hidden in minimal mode) */}
      {!minimal && (
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleInsertCode}
            disabled={isLoading}
            title="Wrap your text in a code block so it renders as an editor"
            className="flex items-center gap-1.5 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
          >
            <span className="font-mono text-gray-400">&lt;/&gt;</span>
            Code
          </button>
          <select
            value={codeLang}
            onChange={(e) => setCodeLang(e.target.value as CodeLang)}
            disabled={isLoading}
            aria-label="Code block language"
            className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          >
            {CODE_LANGS.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 ${
              isMonospace ? 'font-mono text-[13px]' : ''
            }`}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <span>Send</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {minimal ? (
          'Press Enter to send, Shift+Enter for a new line'
        ) : (
          <>Press Enter to send, Shift+Enter for new line • <span className="font-mono">&lt;/&gt;</span> Code wraps your text as an editor block • Use @framer, @auditor, @connector, @challenger, @reflector, or @advocate to invoke partners</>
        )}
      </p>
    </div>
  );
}
