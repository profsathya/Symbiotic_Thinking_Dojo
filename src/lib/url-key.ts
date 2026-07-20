/**
 * Reading a CTI key out of the page URL.
 *
 * Two link shapes are accepted:
 *   - `#key=<uuid>` (preferred) — the fragment never leaves the browser, so
 *     the key cannot appear in server access logs, proxy logs, or Referer
 *     headers along the way.
 *   - `?key=<uuid>` (legacy) — still supported so existing mailed links keep
 *     working, but new links should use the fragment form.
 *
 * Both forms are stripped from the visible URL immediately after being read
 * so the key doesn't linger in browser history, screenshots, or shared
 * screen-captures.
 */

const MIN_KEY_LENGTH = 8;
const MAX_KEY_LENGTH = 256;

/** Parse the fragment (e.g. "#key=abc" or "#key=abc&x=y") as URL params. */
function fragmentParams(): URLSearchParams {
  return new URLSearchParams(window.location.hash.replace(/^#/, ''));
}

/**
 * Read a raw key from the URL — fragment first, then query param.
 * Returns null when neither is present. Pure read; safe to call from a lazy
 * state initializer.
 */
export function rawKeyFromUrl(): string | null {
  return fragmentParams().get('key') ?? new URLSearchParams(window.location.search).get('key');
}

/** True if either URL form carries a key parameter (valid or not). */
export function urlHasKey(): boolean {
  return fragmentParams().has('key') || new URLSearchParams(window.location.search).has('key');
}

/**
 * Read and sanity-check a key from the URL. Returns the trimmed key, or null
 * if absent or of implausible length. Pure read.
 */
export function validKeyFromUrl(): string | null {
  const raw = rawKeyFromUrl();
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length >= MIN_KEY_LENGTH && trimmed.length <= MAX_KEY_LENGTH ? trimmed : null;
}

/**
 * Remove the key from both the fragment and the query string without a
 * reload, preserving any unrelated params in each. Extra query param names
 * (e.g. 'topic') can be stripped in the same history entry.
 */
export function stripKeyFromUrl(extraQueryParams: string[] = []): void {
  const url = new URL(window.location.href);

  url.searchParams.delete('key');
  for (const param of extraQueryParams) {
    url.searchParams.delete(param);
  }

  const hashParams = fragmentParams();
  hashParams.delete('key');
  const remainingHash = hashParams.toString();
  url.hash = remainingHash ? `#${remainingHash}` : '';

  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}
