import { describe, it, expect } from 'vitest';
import { phaseAfterSignal } from '@/lib/practice-dojo/phase-advance';

// A five-entry topic (welcome placeholder + four stages), like
// "What Are My Priorities?" — the only topic that acts on the signal today.
const PHASE_COUNT = 5;

describe('where a Sensei readiness signal moves the session', () => {
  it('moves to the next phase when the student is still where the signal was raised', () => {
    expect(phaseAfterSignal(1, 1, PHASE_COUNT)).toBe(2);
    expect(phaseAfterSignal(2, 2, PHASE_COUNT)).toBe(3);
  });

  // The student's button stays live while the reply streams, so by the time
  // the marker is processed they may already have moved themselves. Advancing
  // again would skip the stage in between entirely.
  it('ignores a signal the student has already outrun', () => {
    expect(phaseAfterSignal(2, 1, PHASE_COUNT)).toBeNull();
  });

  it('ignores a signal from a phase the student went back past', () => {
    expect(phaseAfterSignal(1, 2, PHASE_COUNT)).toBeNull();
  });

  // Without the current-state check this is the ugly one: a stale index of 3
  // still looks in-bounds, and the session lands on phase 5 of 5 — no phase,
  // so the whole Practice Dojo context drops out of the prompt.
  it('never walks off the end, even from a stale index', () => {
    expect(phaseAfterSignal(4, 4, PHASE_COUNT)).toBeNull();
    expect(phaseAfterSignal(4, 3, PHASE_COUNT)).toBeNull();
  });

  it('has nowhere to go in a single-phase topic', () => {
    expect(phaseAfterSignal(0, 0, 1)).toBeNull();
  });
});
