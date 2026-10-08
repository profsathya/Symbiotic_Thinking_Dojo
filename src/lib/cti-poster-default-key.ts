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
 * out of the repository (it is a deploy-time value) so it can be rotated or
 * withdrawn by rebuilding, without a code change. Unset or implausible, the
 * page falls back to the key gate.
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
