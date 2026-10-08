import { describe, it, expect, afterEach, vi } from 'vitest';
import { plausibleCtiPosterKey, ctiPosterDefaultKey } from '@/lib/cti-poster-default-key';

// The /cti page hands a poster visitor the build's conference key when the
// link carries none. These pin down when there IS such a key.

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('the conference key for the poster dojo', () => {
  it('is absent when the build was given nothing', () => {
    vi.stubEnv('NEXT_PUBLIC_CTI_POSTER_KEY', '');
    expect(ctiPosterDefaultKey()).toBeNull();
  });

  it('is the trimmed value the build was given', () => {
    vi.stubEnv('NEXT_PUBLIC_CTI_POSTER_KEY', '  conference-key-1234  ');
    expect(ctiPosterDefaultKey()).toBe('conference-key-1234');
  });

  it('is refused when it is too short or too long to be a key', () => {
    expect(plausibleCtiPosterKey('short')).toBeNull();
    expect(plausibleCtiPosterKey('x'.repeat(257))).toBeNull();
    expect(plausibleCtiPosterKey(undefined)).toBeNull();
    expect(plausibleCtiPosterKey(null)).toBeNull();
    expect(plausibleCtiPosterKey('12345678')).toBe('12345678');
  });
});
