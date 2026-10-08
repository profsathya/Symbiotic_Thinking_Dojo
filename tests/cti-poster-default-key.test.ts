import { describe, it, expect, afterEach, vi } from 'vitest';
import { plausibleCtiPosterKey, ctiPosterDefaultKey, planConferenceKey } from '@/lib/cti-poster-default-key';

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

describe('what /cti does about keys when the link carries none', () => {
  const K = 'conference-key-A';

  it('does nothing when the build has no conference key', () => {
    expect(planConferenceKey({ conferenceKey: null, activeKey: null, ctiKey: null, applied: null })).toEqual({
      setKey: null,
      switchToCti: false,
    });
  });

  it('gives a first-time visitor the conference key and switches to CTI', () => {
    expect(planConferenceKey({ conferenceKey: K, activeKey: null, ctiKey: null, applied: null })).toEqual({
      setKey: K,
      switchToCti: true,
    });
  });

  it('leaves a visitor with their own active key alone', () => {
    expect(planConferenceKey({ conferenceKey: K, activeKey: 'my-own-gemini-key', ctiKey: null, applied: null })).toEqual({
      setKey: null,
      switchToCti: false,
    });
  });

  it('uses a saved CTI key rather than overwriting it', () => {
    expect(planConferenceKey({ conferenceKey: K, activeKey: null, ctiKey: 'my-student-key', applied: null })).toEqual({
      setKey: null,
      switchToCti: true,
    });
  });

  it('replaces a conference key it installed once the build key is rotated', () => {
    expect(
      planConferenceKey({ conferenceKey: 'conference-key-B', activeKey: K, ctiKey: K, applied: K })
    ).toEqual({ setKey: 'conference-key-B', switchToCti: false });
  });

  it('never replaces a CTI key the visitor brought themselves', () => {
    expect(
      planConferenceKey({ conferenceKey: 'conference-key-B', activeKey: 'my-student-key', ctiKey: 'my-student-key', applied: K })
    ).toEqual({ setKey: null, switchToCti: false });
  });
});
