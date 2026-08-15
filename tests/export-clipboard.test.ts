import { describe, it, expect, vi, afterEach } from 'vitest';
import { copyToClipboard } from '@/lib/export';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('copyToClipboard', () => {
  it('writes through the Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const result = await copyToClipboard('# Session');

    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith('# Session');
  });

  it('falls back to execCommand when the Clipboard API rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const textarea = { value: '', setAttribute: vi.fn(), select: vi.fn(), style: {} };
    const execCommand = vi.fn().mockReturnValue(true);
    vi.stubGlobal('document', {
      createElement: vi.fn().mockReturnValue(textarea),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      execCommand,
    });

    const result = await copyToClipboard('# Session');

    expect(result).toBe(true);
    expect(textarea.value).toBe('# Session');
    expect(textarea.select).toHaveBeenCalled();
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('returns false when no copy mechanism works', async () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('document', undefined);

    expect(await copyToClipboard('# Session')).toBe(false);
  });
});
