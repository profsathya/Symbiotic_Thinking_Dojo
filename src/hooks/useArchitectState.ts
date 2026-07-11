'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArchitectRun,
  ArchitectStage,
  DelegateAnnotation,
  DelegateAnswer,
  INITIAL_ARCHITECT_RUN,
  PartnerDecisionState,
  ReflectionAnswers,
  SoloResponse,
  STAGE_ORDER,
  StageStamp,
} from '@/lib/architect/types';

const STORAGE_KEY = 'architectStudio';

function loadRun(): ArchitectRun {
  if (typeof window === 'undefined') return INITIAL_ARCHITECT_RUN;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.version === 1) {
        const run: ArchitectRun = { ...INITIAL_ARCHITECT_RUN, ...parsed };
        // Integrity guards: a fresh run must enter at setup. If the stored
        // stage is unknown, or claims progress without the corroborating
        // start stamp, treat the state as corrupt and start clean rather
        // than dropping a student into the middle of a pass.
        if (!STAGE_ORDER.includes(run.stage)) return INITIAL_ARCHITECT_RUN;
        if (run.stage !== 'setup' && (!run.startedAt || !run.timestamps[run.stage])) {
          console.warn('Architect Studio: inconsistent stored run, resetting to setup');
          return INITIAL_ARCHITECT_RUN;
        }
        return run;
      }
    }
  } catch (e) {
    console.error('Failed to load Architect Studio run:', e);
  }
  return INITIAL_ARCHITECT_RUN;
}

// Fold the running stretch of a stamp into its accumulated active time and
// pause it. Legacy stamps (written before pausing existed) are converted
// from wall-clock on first fold.
function foldStamp(stamp: { enteredAt: string; exitedAt?: string; activeMs?: number; resumedAt?: string | null }): {
  enteredAt: string;
  exitedAt?: string;
  activeMs: number;
  resumedAt: null;
} {
  const now = Date.now();
  let activeMs: number;
  if (stamp.activeMs === undefined && stamp.resumedAt === undefined) {
    activeMs = now - new Date(stamp.enteredAt).getTime();
  } else {
    activeMs =
      (stamp.activeMs ?? 0) +
      (stamp.resumedAt ? now - new Date(stamp.resumedAt).getTime() : 0);
  }
  return { ...stamp, activeMs, resumedAt: null };
}

export interface UseArchitectStateReturn {
  run: ArchitectRun;
  isLoaded: boolean;
  // Forward-only stage advance; records exit/enter timestamps for the trace.
  advanceStage: () => void;
  // Pause/resume the CURRENT stage's timer — used when the student navigates
  // back to review an earlier pass. Both are idempotent.
  pauseStageTimer: () => void;
  resumeStageTimer: () => void;
  resetRun: () => void;
  setSoloResponse: (decisionId: string, response: SoloResponse) => void;
  setDelegateResult: (raw: string, answers: Record<string, DelegateAnswer>) => void;
  setAnnotation: (decisionId: string, annotation: DelegateAnnotation) => void;
  setPartnerDecision: (decisionId: string, state: PartnerDecisionState) => void;
  setSynthesis: (text: string) => void;
  setReflection: (answers: ReflectionAnswers) => void;
}

export function useArchitectState(): UseArchitectStateReturn {
  const [run, setRun] = useState<ArchitectRun>(INITIAL_ARCHITECT_RUN);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Hydration-safe localStorage load: the server render uses INITIAL state,
    // then the client loads the persisted run after mount. Same pattern as
    // usePracticeDojoState — a lazy useState initializer would mismatch SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRun(loadRun());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
    } catch (e) {
      console.error('Failed to save Architect Studio run:', e);
    }
  }, [run, isLoaded]);

  const advanceStage = useCallback(() => {
    setRun((current) => {
      const idx = STAGE_ORDER.indexOf(current.stage);
      if (idx < 0 || idx >= STAGE_ORDER.length - 1) return current;
      const next = STAGE_ORDER[idx + 1] as ArchitectStage;
      const now = new Date().toISOString();
      const timestamps = { ...current.timestamps };
      const currentStamp = timestamps[current.stage];
      if (currentStamp && !currentStamp.exitedAt) {
        timestamps[current.stage] = { ...foldStamp(currentStamp), exitedAt: now };
      }
      timestamps[next] =
        timestamps[next] ?? { enteredAt: now, activeMs: 0, resumedAt: now };
      return {
        ...current,
        stage: next,
        timestamps,
        startedAt: current.startedAt ?? now,
        completedAt: next === 'complete' ? now : current.completedAt,
      };
    });
  }, []);

  const pauseStageTimer = useCallback(() => {
    setRun((current) => {
      const stamp = current.timestamps[current.stage];
      // Nothing running to pause: no stamp, already exited, or already paused
      // (a modern stamp with resumedAt null). Legacy stamps count as running.
      if (!stamp || stamp.exitedAt) return current;
      if (stamp.activeMs !== undefined && !stamp.resumedAt) return current;
      return {
        ...current,
        timestamps: {
          ...current.timestamps,
          [current.stage]: foldStamp(stamp) as StageStamp,
        },
      };
    });
  }, []);

  const resumeStageTimer = useCallback(() => {
    setRun((current) => {
      const stamp = current.timestamps[current.stage];
      if (!stamp || stamp.exitedAt) return current;
      // Only resume an explicitly paused modern stamp; a legacy stamp is
      // already "running" on wall-clock.
      if (stamp.activeMs === undefined || stamp.resumedAt) return current;
      return {
        ...current,
        timestamps: {
          ...current.timestamps,
          [current.stage]: { ...stamp, resumedAt: new Date().toISOString() },
        },
      };
    });
  }, []);

  const resetRun = useCallback(() => {
    setRun({
      ...INITIAL_ARCHITECT_RUN,
      timestamps: {},
    });
  }, []);

  const setSoloResponse = useCallback(
    (decisionId: string, response: SoloResponse) => {
      setRun((current) => ({
        ...current,
        // Stamp the first meaningful action as the run start
        startedAt: current.startedAt ?? new Date().toISOString(),
        solo: { ...current.solo, [decisionId]: response },
      }));
    },
    []
  );

  const setDelegateResult = useCallback(
    (raw: string, answers: Record<string, DelegateAnswer>) => {
      setRun((current) => ({
        ...current,
        delegate: { ...current.delegate, raw, answers },
      }));
    },
    []
  );

  const setAnnotation = useCallback(
    (decisionId: string, annotation: DelegateAnnotation) => {
      setRun((current) => ({
        ...current,
        delegate: {
          ...current.delegate,
          annotations: {
            ...current.delegate.annotations,
            [decisionId]: annotation,
          },
        },
      }));
    },
    []
  );

  const setPartnerDecision = useCallback(
    (decisionId: string, state: PartnerDecisionState) => {
      setRun((current) => ({
        ...current,
        partner: {
          ...current.partner,
          decisions: { ...current.partner.decisions, [decisionId]: state },
        },
      }));
    },
    []
  );

  const setSynthesis = useCallback((text: string) => {
    setRun((current) => ({
      ...current,
      partner: { ...current.partner, synthesis: text },
    }));
  }, []);

  const setReflection = useCallback((answers: ReflectionAnswers) => {
    setRun((current) => ({ ...current, reflection: answers }));
  }, []);

  return {
    run,
    isLoaded,
    advanceStage,
    pauseStageTimer,
    resumeStageTimer,
    resetRun,
    setSoloResponse,
    setDelegateResult,
    setAnnotation,
    setPartnerDecision,
    setSynthesis,
    setReflection,
  };
}
