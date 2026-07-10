// Architect Studio — types for the three-pass CampusMesh architecture activity.
//
// A "run" is one student's complete pass through the activity:
// setup → solo → delegate → partner → reflection → complete.
// Stage transitions are forward-only; that is what enforces mode gating
// (no AI in solo, prompt→output+annotation in delegate, open collab in partner).

export type ArchitectStage =
  | 'setup'
  | 'solo'
  | 'delegate'
  | 'partner'
  | 'reflection'
  | 'complete';

export const STAGE_ORDER: ArchitectStage[] = [
  'setup',
  'solo',
  'delegate',
  'partner',
  'reflection',
  'complete',
];

export type DecisionTheme = 'Networking' | 'Design' | 'Engineering';

export interface DecisionOption {
  id: string;
  label: string;
}

export interface DecisionDef {
  id: string; // 'D1'..'D7'
  theme: DecisionTheme;
  title: string;
  // Main question text
  prompt: string;
  // Secondary "And:" question, when present
  subPrompt?: string;
  // Preset options; student may always write their own instead
  options: DecisionOption[];
}

// ---- Pass 1: Solo ----
export interface SoloResponse {
  // id of a preset option, or 'own' when the student wrote their own
  optionId: string | null;
  // The student's answer in their own words (required for open decisions,
  // used as the "own option" text otherwise)
  ownAnswer: string;
  justification: string;
  uncertainty: string;
}

// ---- Pass 2: Delegate ----
export interface DelegateAnswer {
  choice: string;
  justification: string;
}

export type AnnotationVerdict = 'agree' | 'disagree' | 'glossing';

export interface DelegateAnnotation {
  verdict: AnnotationVerdict | null;
  // "…and how you know"
  note: string;
}

// ---- Pass 3: Partner ----
export interface PartnerMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PartnerDecisionState {
  messages: PartnerMessage[];
  finalChoice: string;
  finalJustification: string;
}

// ---- Reflection ----
export interface ReflectionAnswers {
  changedMind: string; // Q1: decision where solo vs final differ most
  overruled: string; // Q2: decision where you overruled the AI
  delegateWrong: string; // Q3: where delegate pass was wrong/shallow
  aiEnabled: string; // Q4: what partnering made possible
}

// ---- Process trace ----
export interface StageStamp {
  enteredAt: string;
  exitedAt?: string;
}

export interface ArchitectRun {
  version: 1;
  stage: ArchitectStage;
  startedAt: string | null;
  completedAt: string | null;
  timestamps: Partial<Record<ArchitectStage, StageStamp>>;
  solo: Record<string, SoloResponse>;
  delegate: {
    // Raw model output kept for the trace / debugging
    raw: string;
    answers: Record<string, DelegateAnswer>;
    annotations: Record<string, DelegateAnnotation>;
  };
  partner: {
    decisions: Record<string, PartnerDecisionState>;
    synthesis: string;
  };
  reflection: ReflectionAnswers;
}

export const EMPTY_SOLO_RESPONSE: SoloResponse = {
  optionId: null,
  ownAnswer: '',
  justification: '',
  uncertainty: '',
};

export const EMPTY_ANNOTATION: DelegateAnnotation = {
  verdict: null,
  note: '',
};

export const EMPTY_PARTNER_DECISION: PartnerDecisionState = {
  messages: [],
  finalChoice: '',
  finalJustification: '',
};

export const INITIAL_ARCHITECT_RUN: ArchitectRun = {
  version: 1,
  stage: 'setup',
  startedAt: null,
  completedAt: null,
  timestamps: {},
  solo: {},
  delegate: { raw: '', answers: {}, annotations: {} },
  partner: { decisions: {}, synthesis: '' },
  reflection: {
    changedMind: '',
    overruled: '',
    delegateWrong: '',
    aiEnabled: '',
  },
};

// Soft time boxes per pass, in minutes (timer is visible but never blocks)
export const PASS_MINUTES: Partial<Record<ArchitectStage, number>> = {
  solo: 25,
  delegate: 15,
  partner: 30,
  reflection: 15,
};
