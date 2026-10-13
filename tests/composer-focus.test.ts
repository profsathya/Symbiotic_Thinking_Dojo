import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  FINE_POINTER_QUERY,
  focusComposerAfterReply,
  shouldAutoFocusComposer,
} from '@/lib/composer-focus';

const media = (matches: (q: string) => boolean) => ({
  matchMedia: vi.fn((q: string) => ({ matches: matches(q) })),
});

describe('shouldAutoFocusComposer', () => {
  it('is true with a fine, hovering pointer (mouse or trackpad)', () => {
    const win = media((q) => q === FINE_POINTER_QUERY);
    expect(shouldAutoFocusComposer(win)).toBe(true);
    expect(win.matchMedia).toHaveBeenCalledWith('(hover: hover) and (pointer: fine)');
  });

  it('is false on a coarse or non-hovering pointer (phone, tablet)', () => {
    expect(shouldAutoFocusComposer(media(() => false))).toBe(false);
  });

  it('is false with no window (SSR) or no matchMedia', () => {
    expect(shouldAutoFocusComposer(undefined)).toBe(false);
    expect(shouldAutoFocusComposer({})).toBe(false);
  });

  it('is false in the node test environment, where window is undefined', () => {
    expect(shouldAutoFocusComposer()).toBe(false);
  });

  it('is false if matchMedia throws', () => {
    expect(
      shouldAutoFocusComposer({
        matchMedia: () => {
          throw new Error('nope');
        },
      })
    ).toBe(false);
  });
});

describe('focusComposerAfterReply', () => {
  it('does not call focus when the helper says no', () => {
    const input = { focus: vi.fn() };
    expect(focusComposerAfterReply(input, true, false, () => false)).toBe(false);
    expect(input.focus).not.toHaveBeenCalled();
  });

  it('focuses once a reply finishes when the helper says yes', () => {
    const input = { focus: vi.fn() };
    expect(focusComposerAfterReply(input, true, false, () => true)).toBe(true);
    expect(input.focus).toHaveBeenCalledTimes(1);
  });

  it('does not focus while loading or when nothing was loading', () => {
    const input = { focus: vi.fn() };
    focusComposerAfterReply(input, false, true, () => true);
    focusComposerAfterReply(input, true, true, () => true);
    focusComposerAfterReply(input, false, false, () => true);
    focusComposerAfterReply(null, true, false, () => true);
    expect(input.focus).not.toHaveBeenCalled();
  });

  it('defaults to the pointer check, so it never focuses without a window', () => {
    const input = { focus: vi.fn() };
    expect(focusComposerAfterReply(input, true, false)).toBe(false);
    expect(input.focus).not.toHaveBeenCalled();
  });

  it('is the only after-reply focus in the composer', () => {
    const src = readFileSync('src/components/Chat/ChatInput.tsx', 'utf8');
    expect(src).toContain('focusComposerAfterReply(textareaRef.current, wasLoadingRef.current, isLoading)');
    expect(src).not.toContain('textareaRef.current?.focus()');
  });
});
