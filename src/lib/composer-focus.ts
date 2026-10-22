/**
 * When the chat may move focus into the composer on its own.
 *
 * Programmatic focus on a phone or tablet opens the on-screen keyboard,
 * which covers half the screen just as a Sensei reply arrives. So the
 * composer only auto-focuses on devices whose primary input can hover and
 * point precisely (a mouse or trackpad). Tapping the input still focuses
 * it as usual; this only governs focus the app moves on its own.
 */
export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

type MatchMediaWindow = { matchMedia?: (query: string) => { matches: boolean } };

export function shouldAutoFocusComposer(
  win: MatchMediaWindow | undefined = typeof window === 'undefined' ? undefined : window
): boolean {
  if (!win || typeof win.matchMedia !== 'function') return false;
  try {
    return win.matchMedia(FINE_POINTER_QUERY).matches === true;
  } catch {
    return false;
  }
}

/**
 * The composer's after-reply focus step: when loading has just finished
 * (a Sensei reply landed, including one started by a theme tap on /cti),
 * focus the input, but only where shouldAutoFocusComposer allows it.
 * Returns whether focus was called.
 */
export function focusComposerAfterReply(
  input: { focus: () => void } | null | undefined,
  wasLoading: boolean,
  isLoading: boolean,
  allow: () => boolean = shouldAutoFocusComposer
): boolean {
  if (!input || !wasLoading || isLoading || !allow()) return false;
  input.focus();
  return true;
}

/**
 * Focus the composer because the page asked for it, not because a reply
 * finished. /cti uses this after a theme tap: the Sensei's opener is added
 * locally with no model call, so loading never toggles and the after-reply
 * step never runs. `request` is a counter the page bumps; 0 means no request.
 * The same pointer check applies, so a phone keyboard never pops up.
 * Returns whether focus was called.
 */
export function focusComposerOnRequest(
  input: { focus: () => void } | null | undefined,
  request: number,
  allow: () => boolean = shouldAutoFocusComposer
): boolean {
  if (!input || request <= 0 || !allow()) return false;
  input.focus();
  return true;
}
