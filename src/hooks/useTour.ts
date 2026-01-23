'use client';

import { useState, useEffect, useCallback } from 'react';

export interface TourStep {
  id: string;
  target: string; // CSS selector for the element to highlight
  title: string;
  content: string;
  yourPart: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: '[data-tour="welcome"]',
    title: 'The Dojo',
    content: "This isn't a chatbot. It's a space for deliberate practice—developing your thinking WITH AI, not outsourcing it TO AI.",
    yourPart: 'Engage actively. The tool guides, but YOU do the thinking.',
    position: 'bottom',
  },
  {
    id: 'constructs',
    target: '[data-tour="constructs"]',
    title: 'Learn → Solve → Build',
    content: 'Start in Learn mode—safe exploration, no stakes. As your confidence grows, raise the stakes. Build mode means creating real value for real people.',
    yourPart: 'Be honest about where you are. Growth comes from the right level of challenge.',
    position: 'right',
  },
  {
    id: 'partners',
    target: '[data-tour="partners"]',
    title: 'Challenge Yourself',
    content: 'These partners push your thinking from different angles. The Framer scopes problems. The Challenger pressure-tests. The Reflector helps you step back.',
    yourPart: 'Invite challenge. Comfort is the enemy of growth.',
    position: 'right',
  },
  {
    id: 'practice-dojo',
    target: '[data-tour="practice-dojo"]',
    title: 'Structured Practice',
    content: 'Like kata in martial arts—deliberate repetition builds capability. These guided sessions develop specific thinking skills through experience, not lecture.',
    yourPart: 'Show up consistently. Capability compounds with practice.',
    position: 'right',
  },
  {
    id: 'balance',
    target: '[data-tour="balance"]',
    title: 'Are You Thinking?',
    content: "This tracks whether you're actively engaging (creating) or passively receiving (consuming). The goal isn't zero consuming—it's tilting toward creating.",
    yourPart: 'Notice when you\'re drifting. Ask yourself: "What would I do differently?"',
    position: 'left',
  },
  {
    id: 'umpire',
    target: '[data-tour="umpire"]',
    title: 'Thinking is Iterative',
    content: "Understand, Map, Plan, Implement, Review, Evaluate. Real problem-solving loops back. Returning to \"Understand\" after \"Plan\" isn't failure—it's wisdom.",
    yourPart: 'Track where you are. Embrace the loops.',
    position: 'left',
  },
  {
    id: 'dikw',
    target: '[data-tour="dikw"]',
    title: 'Climb Toward Wisdom',
    content: 'Data → Information → Knowledge → Wisdom. Most AI interactions stay shallow. The Dojo aspires to push you toward judgment and wisdom.',
    yourPart: 'Ask "why" and "what if." Don\'t settle for answers—seek understanding.',
    position: 'left',
  },
  {
    id: 'session-controls',
    target: '[data-tour="session-controls"]',
    title: 'Your Progress Persists',
    content: 'Import a saved session to continue where you left off. Save Session appears in the chat area once you start—export your thinking journey as JSON or Markdown.',
    yourPart: 'Treat your sessions as artifacts of growth. Review them. Learn from the patterns.',
    position: 'right',
  },
  {
    id: 'chat',
    target: '[data-tour="chat"]',
    title: 'Your Practice Space',
    content: "Short exchanges work best. You should talk more than the AI. If it's lecturing, redirect. This is YOUR practice, YOUR growth.",
    yourPart: 'Lead the conversation. Use @framer or @challenger to invoke partners when you need them.',
    position: 'top',
  },
];

interface TourState {
  hasCompletedTour: boolean;
  dismissCount: number;
  currentStep: number | null;
}

const STORAGE_KEY = 'dojo_tour_state';

const DEFAULT_STATE: TourState = {
  hasCompletedTour: false,
  dismissCount: 0,
  currentStep: null,
};

export function useTour() {
  const [state, setState] = useState<TourState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(parsed);
      }
    } catch (e) {
      console.error('Failed to load tour state:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('Failed to save tour state:', e);
      }
    }
  }, [state, isLoaded]);

  const startTour = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: 0 }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => {
      if (prev.currentStep === null) return prev;
      const next = prev.currentStep + 1;
      if (next >= TOUR_STEPS.length) {
        // Tour completed
        return { ...prev, currentStep: null, hasCompletedTour: true };
      }
      return { ...prev, currentStep: next };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => {
      if (prev.currentStep === null || prev.currentStep === 0) return prev;
      return { ...prev, currentStep: prev.currentStep - 1 };
    });
  }, []);

  const skipTour = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: null, hasCompletedTour: true }));
  }, []);

  const dismissPrompt = useCallback(() => {
    setState(prev => ({ ...prev, dismissCount: prev.dismissCount + 1 }));
  }, []);

  const resetTour = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  // Should show the first-time prompt?
  // Show if: not completed tour AND dismissed fewer than 3 times AND not currently in tour
  const shouldShowPrompt = isLoaded &&
    !state.hasCompletedTour &&
    state.dismissCount < 3 &&
    state.currentStep === null;

  // Is tour currently active?
  const isActive = state.currentStep !== null;

  // Current step data
  const currentStepData = isActive ? TOUR_STEPS[state.currentStep!] : null;

  return {
    isLoaded,
    isActive,
    currentStep: state.currentStep,
    currentStepData,
    totalSteps: TOUR_STEPS.length,
    shouldShowPrompt,
    hasCompletedTour: state.hasCompletedTour,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    dismissPrompt,
    resetTour,
  };
}
