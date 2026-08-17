/**
 * Where a Sensei readiness signal should move the session — if anywhere.
 *
 * Only topics that set `advanceOnSenseiSignal` act on the marker at all; for
 * every other topic the marker just highlights the student's "Ready to move
 * on?" button and this is never consulted.
 *
 * The staleness check is the point. The signal is processed when the reply
 * finishes streaming, but the callback that handles it captured the phase
 * index from when the reply STARTED — and the student can advance themselves
 * mid-stream, since their button stays live while the Sensei is talking. Two
 * ways that goes wrong without this guard:
 *   - Student advances 1 → 2 while the Stage 1 reply streams; the marker then
 *     advances again, and Stage 2 is skipped entirely.
 *   - Student advances 3 → 4 mid-stream; the marker's bounds check, using the
 *     stale index 3, still thinks there is a successor and moves to 5 — past
 *     the last phase, which leaves the session with no phase and drops the
 *     whole Practice Dojo context out of the prompt.
 * So the decision is made against the CURRENT phase, not the captured one.
 */
export function phaseAfterSignal(
  currentPhase: number,
  signaledPhase: number,
  phaseCount: number
): number | null {
  // The student already moved (or moved back) — their choice wins, and this
  // signal is about a phase they have left.
  if (currentPhase !== signaledPhase) return null;

  const next = signaledPhase + 1;
  // The final phase has no successor: closing the activity stays the
  // student's call, through the "Finished with this activity?" gate.
  if (next >= phaseCount) return null;

  return next;
}
