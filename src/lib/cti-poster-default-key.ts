/**
 * The conference key for the /cti poster dojo.
 *
 * The printed INSPIRE poster's QR code is the bare address
 * (dojo.symbioticthinking.ai/cti), so the page cannot count on a `#key=` in
 * the link. Instead the frontend build is given the conference key in
 * NEXT_PUBLIC_CTI_POSTER_KEY, and /cti uses it for a visitor who has no key.
 *
 * Like a key printed in a QR code, this value ships to every visitor's
 * browser, so it is NOT a secret: it must be a key made for the conference,
 * with its own spending cap, and never a personal or admin key. It is kept
 * out of the repository (it is a deploy-time value) so it can be rotated by
 * rebuilding, without a code change. Unset or implausible, the page falls
 * back to the key gate for new visitors.
 *
 * To WITHDRAW the key (after the conference, or if it is abused), deactivate
 * it in the backend (`manage_prod_keys.sh deactivate --key <uuid>`). That is
 * the only real stop: browsers that already hold the key keep it until then,
 * and removing the build value alone does not take it back from them.
 */

const MIN_KEY_LENGTH = 8;
const MAX_KEY_LENGTH = 256;

/** Sanity-check a candidate key the same way a key from the URL is checked. */
export function plausibleCtiPosterKey(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length >= MIN_KEY_LENGTH && trimmed.length <= MAX_KEY_LENGTH ? trimmed : null;
}

/** The conference key this build was given, or null when there is none. */
export function ctiPosterDefaultKey(): string | null {
  return plausibleCtiPosterKey(process.env.NEXT_PUBLIC_CTI_POSTER_KEY);
}

// ── Deciding when to use it ─────────────────────────────────────────────

/** Where /cti remembers which conference key it installed, so a later build
 *  with a rotated key can replace it. Never holds a key the visitor typed. */
const APPLIED_STORAGE_KEY = 'ctiPosterConferenceKeyApplied';

export function readAppliedConferenceKey(): string | null {
  try {
    return localStorage.getItem(APPLIED_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function rememberAppliedConferenceKey(key: string): void {
  try {
    localStorage.setItem(APPLIED_STORAGE_KEY, key);
  } catch {
    // Private mode or a full store: the key still works for this visit.
  }
}

export interface ConferenceKeyPlan {
  /** Store this under the CTI provider (and remember it as applied). */
  setKey: string | null;
  /** Make CTI the active provider. */
  switchToCti: boolean;
}

/**
 * What /cti should do about keys when the link carried none.
 *
 * - No conference key in this build: nothing. The key gate handles it.
 * - The saved CTI key is one WE installed and the build's key has since been
 *   rotated: replace it, or the visitor would keep sending a dead key.
 * - The visitor has an active key of their own (any provider): leave their
 *   key and their provider alone.
 * - No active key: use the saved CTI key if there is one, otherwise install
 *   the conference key; either way make CTI the active provider.
 */
export function planConferenceKey(input: {
  conferenceKey: string | null;
  activeKey: string | null;
  ctiKey: string | null;
  applied: string | null;
}): ConferenceKeyPlan {
  const { conferenceKey, activeKey, ctiKey, applied } = input;
  if (!conferenceKey) return { setKey: null, switchToCti: false };
  const hasActive = !!activeKey && activeKey.length > 0;
  const installedByUs = !!ctiKey && !!applied && ctiKey === applied;
  if (installedByUs && applied !== conferenceKey) {
    return { setKey: conferenceKey, switchToCti: !hasActive };
  }
  if (hasActive) return { setKey: null, switchToCti: false };
  return { setKey: ctiKey ? null : conferenceKey, switchToCti: true };
}
