/**
 * Saved-session shape and restore rule for the standalone /inspire demo.
 *
 * The demo persists under its OWN localStorage key (never the shared
 * practiceDojo state), so a conference visitor's refresh resumes their run
 * without touching a real student's saved progress.
 *
 * The restore rule exists because the save effect writes on every streamed
 * chunk: useChat appends an empty assistant message before the request starts
 * and fills it in as chunks arrive, so a snapshot taken mid-reply ends in a
 * partial — or completely empty — assistant turn. Restoring that verbatim
 * would hand it back as finished history: at best the model continues from
 * words it never said, at worst an empty assistant message goes to the API
 * (nothing filters empty content on the way out) and the request is rejected,
 * leaving the demo unable to send until the visitor restarts.
 */

import { SerializedMessage } from '@/lib/practice-dojo/types';

export interface InspireSaved {
  messages: SerializedMessage[];
  currentPhase: number;
  userChoices: Record<string, string>;
  interactionCount: number;
  senseiReady: boolean;
  // True when the snapshot was written while a reply was still streaming.
  // Optional so snapshots saved before this field existed still load.
  inFlight?: boolean;
}

/**
 * The messages that are safe to restore: everything up to the last COMPLETED
 * turn. An interrupted reply is dropped rather than kept — the visitor's own
 * message stays on screen, so they can ask again when they're ready. We don't
 * resend for them: that would spend tokens they never asked to spend.
 */
export function restorableMessages(saved: InspireSaved | null | undefined): SerializedMessage[] {
  const messages = saved?.messages ?? [];
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'assistant') return messages;

  // Interrupted mid-stream, or a blank placeholder left behind by an aborted
  // request (and by snapshots that predate the inFlight flag).
  if (saved?.inFlight || last.content.trim().length === 0) {
    return messages.slice(0, -1);
  }
  return messages;
}
