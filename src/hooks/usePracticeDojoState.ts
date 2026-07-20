'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  PracticeDojoState,
  INITIAL_PRACTICE_DOJO_STATE,
  Pathway,
  CheckpointStatus,
  PhaseSelfCheck,
  SerializedMessage,
} from '@/lib/practice-dojo/types';

const STORAGE_KEY = 'practiceDojo';

interface UsePracticeDojoStateReturn {
  // Current state
  state: PracticeDojoState;

  // Session status
  isInPracticeDojo: boolean;
  hasResumeableSession: boolean;

  // Session actions
  startSession: (topicId: string, pathway: Pathway) => void;
  resumeSession: () => void;
  exitSession: () => void;
  resetSession: () => void;

  // Phase management
  advancePhase: () => void;
  setPhase: (phase: number) => void;
  markPhaseCompleted: (phase: number) => void;

  // Interaction tracking for progressive scaffolding
  incrementInteractionCount: () => void;

  // Checkpoint management
  setCheckpointResponse: (phase: number, response: string) => void;
  setCheckpointStatus: (phase: number, status: CheckpointStatus) => void;

  // "Ready to move on?" self-check gate. The student judges readiness; the
  // Sensei's [NEXT_PHASE] emission only marks a phase as signaled.
  recordPhaseSelfCheck: (check: PhaseSelfCheck) => void;
  markSenseiSignaled: (phase: number) => void;

  // User choices
  setUserChoice: (key: string, value: string) => void;

  // Topic completion
  markTopicCompleted: (topicId: string) => void;
  isTopicCompleted: (topicId: string) => boolean;

  // Message persistence for resume
  saveMessages: (messages: SerializedMessage[]) => void;
  getSavedMessages: () => SerializedMessage[] | null;
  clearSavedMessages: () => void;
}

// Load state from localStorage
function loadState(): PracticeDojoState {
  if (typeof window === 'undefined') {
    return INITIAL_PRACTICE_DOJO_STATE;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Always start with isActive: false on page load
      // User must explicitly resume to activate the session
      return { ...INITIAL_PRACTICE_DOJO_STATE, ...parsed, isActive: false };
    }
  } catch (e) {
    console.error('Failed to load Practice Dojo state:', e);
  }

  return INITIAL_PRACTICE_DOJO_STATE;
}

// Save state to localStorage
function saveState(state: PracticeDojoState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save Practice Dojo state:', e);
  }
}

export function usePracticeDojoState(): UsePracticeDojoStateReturn {
  const [state, setState] = useState<PracticeDojoState>(INITIAL_PRACTICE_DOJO_STATE);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (state !== INITIAL_PRACTICE_DOJO_STATE) {
      saveState({
        ...state,
        lastUpdated: new Date().toISOString(),
      });
    }
  }, [state]);

  // Derived states
  // isInPracticeDojo: true only when session is actively running
  const isInPracticeDojo = state.isActive;
  // hasResumeableSession: true when there's saved session data to resume
  const hasResumeableSession = !state.isActive && state.topicId !== null && state.sessionStarted !== null;

  // Start a new session
  // Note: We start at Phase 1 because Phase 0 (pathway selection) is handled by the UI modal
  const startSession = useCallback((topicId: string, pathway: Pathway) => {
    setState(current => ({
      ...current,
      isActive: true, // Mark session as active
      topicId,
      pathway,
      currentPhase: 1, // Skip Phase 0 (pathway selection already done in modal)
      completedPhases: [0], // Mark Phase 0 as completed
      interactionCount: 0, // Reset interaction count for new session
      userChoices: {},
      checkpointResponses: {},
      checkpointStatuses: {},
      phaseSelfChecks: [],
      senseiSignaledPhases: [],
      savedMessages: null, // Clear any saved messages from previous session
      sessionStarted: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Resume existing session (mark as active, state is already loaded)
  const resumeSession = useCallback(() => {
    setState(current => ({
      ...current,
      isActive: true, // Mark session as active
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Exit session (deactivate but keep progress for resume)
  const exitSession = useCallback(() => {
    // Keep the state for potential resume, just mark as inactive
    setState(current => ({
      ...current,
      isActive: false, // Deactivate session
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Reset session completely
  const resetSession = useCallback(() => {
    setState(current => ({
      ...INITIAL_PRACTICE_DOJO_STATE,
      completedTopics: current.completedTopics, // Keep completed topics
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Advance to next phase
  const advancePhase = useCallback(() => {
    setState(current => ({
      ...current,
      completedPhases: [...current.completedPhases, current.currentPhase],
      currentPhase: current.currentPhase + 1,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Set specific phase
  const setPhase = useCallback((phase: number) => {
    setState(current => ({
      ...current,
      currentPhase: phase,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Increment interaction count (called when user sends a message in Practice Dojo)
  const incrementInteractionCount = useCallback(() => {
    setState(current => ({
      ...current,
      interactionCount: current.interactionCount + 1,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Mark a phase as completed
  const markPhaseCompleted = useCallback((phase: number) => {
    setState(current => {
      if (current.completedPhases.includes(phase)) {
        return current;
      }
      return {
        ...current,
        completedPhases: [...current.completedPhases, phase],
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  // Set checkpoint response
  const setCheckpointResponse = useCallback((phase: number, response: string) => {
    setState(current => ({
      ...current,
      checkpointResponses: {
        ...current.checkpointResponses,
        [`phase${phase}`]: response,
      },
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Set checkpoint status
  const setCheckpointStatus = useCallback((phase: number, status: CheckpointStatus) => {
    setState(current => ({
      ...current,
      checkpointStatuses: {
        ...current.checkpointStatuses,
        [`phase${phase}`]: status,
      },
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Record a completed "Ready to move on?" dialog (append-only trace)
  const recordPhaseSelfCheck = useCallback((check: PhaseSelfCheck) => {
    setState(current => ({
      ...current,
      phaseSelfChecks: [...current.phaseSelfChecks, check],
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // The model emitted [NEXT_PHASE] for this phase — record the signal so the
  // UI can highlight the button. Idempotent; never advances the phase.
  const markSenseiSignaled = useCallback((phase: number) => {
    setState(current => {
      if (current.senseiSignaledPhases.includes(phase)) return current;
      return {
        ...current,
        senseiSignaledPhases: [...current.senseiSignaledPhases, phase],
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  // Set a user choice
  const setUserChoice = useCallback((key: string, value: string) => {
    setState(current => ({
      ...current,
      userChoices: {
        ...current.userChoices,
        [key]: value,
      },
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Mark a topic as completed. Always resets the current session — a student
  // revisiting an already-completed topic must still get a clean close-out
  // when they finish it again (the completedTopics list just stays as-is).
  const markTopicCompleted = useCallback((topicId: string) => {
    setState(current => ({
      ...current,
      completedTopics: current.completedTopics.includes(topicId)
        ? current.completedTopics
        : [...current.completedTopics, topicId],
      // Also reset the current session
      isActive: false,
      topicId: null,
      currentPhase: 0,
      completedPhases: [],
      pathway: null,
      userChoices: {},
      checkpointResponses: {},
      checkpointStatuses: {},
      phaseSelfChecks: [],
      senseiSignaledPhases: [],
      sessionStarted: null,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Check if topic is completed
  const isTopicCompleted = useCallback((topicId: string) => {
    return state.completedTopics.includes(topicId);
  }, [state.completedTopics]);

  // Save messages for resume functionality
  const saveMessages = useCallback((messages: SerializedMessage[]) => {
    setState(current => ({
      ...current,
      savedMessages: messages,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Get saved messages
  const getSavedMessages = useCallback((): SerializedMessage[] | null => {
    return state.savedMessages;
  }, [state.savedMessages]);

  // Clear saved messages
  const clearSavedMessages = useCallback(() => {
    setState(current => ({
      ...current,
      savedMessages: null,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  return {
    state,
    isInPracticeDojo,
    hasResumeableSession,
    startSession,
    resumeSession,
    exitSession,
    resetSession,
    advancePhase,
    setPhase,
    markPhaseCompleted,
    incrementInteractionCount,
    setCheckpointResponse,
    setCheckpointStatus,
    recordPhaseSelfCheck,
    markSenseiSignaled,
    setUserChoice,
    markTopicCompleted,
    isTopicCompleted,
    saveMessages,
    getSavedMessages,
    clearSavedMessages,
  };
}
