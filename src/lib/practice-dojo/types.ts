// Practice Dojo Types

// Pathway options for topic engagement
export type Pathway = 'guided' | 'quick' | 'test';

// Topic categories
export type TopicCategory = 'foundations' | 'course' | 'general' | 'career';

// Phase checkpoint status
export type CheckpointStatus = 'pending' | 'passed' | 'needs-work';

// Visual component types that can appear in AI responses
export type DojoVisualType =
  | 'selection-cards'
  | 'comparison-table'
  | 'framework-diagram'
  | 'info-box'
  | 'checkpoint-prompt';

// Selection card option
export interface SelectionOption {
  id: string;
  icon: string;
  title: string;
  description: string;
}

// Comparison table row
export interface ComparisonRow {
  label: string;
  left: string;
  right: string;
}

// Framework diagram types
export type DiagramType = '3cs' | 'umpire' | 'dikw' | 'personal-stack' | '3cs-umpire-mapping' | 'dojo-modes' | 'ikigai' | 'ikigai-passion' | 'ikigai-mission' | 'ikigai-profession' | 'ikigai-vocation';

// Visual component data structures
export interface SelectionCardsData {
  type: 'selection-cards';
  prompt?: string;
  options: SelectionOption[];
}

export interface ComparisonTableData {
  type: 'comparison-table';
  title?: string;
  leftHeader: string;
  rightHeader: string;
  rows: ComparisonRow[];
  question?: string;
}

export interface FrameworkDiagramData {
  type: 'framework-diagram';
  diagram: DiagramType;
  caption?: string;
}

export interface InfoBoxData {
  type: 'info-box';
  style: 'reveal' | 'insight' | 'summary' | 'warning' | 'aside';
  title?: string;
  content: string;
}

export interface CheckpointPromptData {
  type: 'checkpoint-prompt';
  question: string;
  hint?: string;
}

// Union type for all visual component data
export type DojoVisualData =
  | SelectionCardsData
  | ComparisonTableData
  | FrameworkDiagramData
  | InfoBoxData
  | CheckpointPromptData;

// Pathway configuration
export interface PathwayConfig {
  id: Pathway;
  title: string;
  description: string;
  icon: string;
  estimatedTime: string;
}

// Phase configuration
export interface PhaseConfig {
  phaseId: number;
  title: string;
  purpose: string;
  hasCheckpoint: boolean;
  // Content guidance for the AI - what to cover in this phase
  contentGuidance: string;
  // Checkpoint evaluation criteria (if hasCheckpoint is true)
  checkpointCriteria?: string;
  // Short student-facing goal, shown in the "Ready to move on?" self-check.
  // Falls back to `purpose` when absent — add this when `purpose` reads as
  // AI-facing prompt language rather than something a student should see.
  studentGoal?: string;
  // Marks the phase that delivers the core payoff ("you've arrived"), so the
  // ProgressIndicator can signal arrival rather than an unfinished checklist.
  // Optional and backward-compatible: topics that omit it behave as before.
  isArrivalMilestone?: boolean;
}

// Topic configuration
export interface TopicConfig {
  topicId: string;
  title: string;
  description: string;
  estimatedTime: string;
  category: TopicCategory;
  courseCode?: string;
  enabled: boolean;
  icon: string;
  pathways: PathwayConfig[];
  phases: PhaseConfig[];
  // Topic-level instructions that apply to ALL phases (tone, anti-gaming, response style)
  systemInstructions?: string;
  // Additional content for course topics
  courseContent?: {
    syllabus: string;
    learningObjectives: string[];
    schedule?: string;
  };
}

// One entry per completed "Ready to move on?" dialog. The STUDENT is the
// judge of phase readiness; the Sensei's [NEXT_PHASE] emission is recorded
// here as evidence (senseiSignaled) but never advances anything by itself.
export interface PhaseSelfCheck {
  phase: number;
  // The goal text shown to the student at the time
  goal: string;
  // The student's own account of how they met (or didn't meet) the goal
  response: string;
  // 'advance' moves to the next phase; 'complete' (final phase only) closes
  // out the whole activity; 'continue' stays put.
  decision: 'continue' | 'advance' | 'complete';
  // Whether the Sensei had signaled readiness when the student chose
  senseiSignaled: boolean;
  at: string;
}

// Practice Dojo local state (persisted to localStorage)
export interface PracticeDojoState {
  // Whether session is currently active (vs just having resumable data)
  isActive: boolean;

  // Current session info
  topicId: string | null;
  currentPhase: number;
  completedPhases: number[];
  pathway: Pathway | null;

  // Interaction tracking for progressive scaffolding
  // Counts user responses (not including welcome message)
  interactionCount: number;

  // User choices made during the session
  userChoices: Record<string, string>;

  // Checkpoint responses
  checkpointResponses: Record<string, string>;
  checkpointStatuses: Record<string, CheckpointStatus>;

  // Self-checks recorded at the "Ready to move on?" gate (append-only)
  phaseSelfChecks: PhaseSelfCheck[];
  // Phases where the model emitted [NEXT_PHASE] — a readiness signal that
  // highlights the student's button; the engine never advances on it
  senseiSignaledPhases: number[];

  // Completed topics
  completedTopics: string[];

  // Saved messages for resume (serialized)
  savedMessages: SerializedMessage[] | null;

  // Timestamps
  lastUpdated: string;
  sessionStarted: string | null;
}

// Serialized message for localStorage (Date becomes string)
export interface SerializedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  speaker?: string;
}

// Initial state
export const INITIAL_PRACTICE_DOJO_STATE: PracticeDojoState = {
  isActive: false,
  topicId: null,
  currentPhase: 0,
  completedPhases: [],
  pathway: null,
  interactionCount: 0,
  userChoices: {},
  checkpointResponses: {},
  checkpointStatuses: {},
  phaseSelfChecks: [],
  senseiSignaledPhases: [],
  completedTopics: [],
  savedMessages: null,
  lastUpdated: new Date().toISOString(),
  sessionStarted: null,
};

// Context for AI system prompt in Practice Dojo mode
export interface PracticeDojoContext {
  topic: TopicConfig;
  currentPhase: PhaseConfig;
  pathway: Pathway;
  completedPhases: number[];
  userChoices: Record<string, string>;
  checkpointStatuses: Record<string, CheckpointStatus>;
  // Self-checks so far — lets the Sensei open a new phase by addressing a
  // gap the student admitted when they chose to move on
  phaseSelfChecks: PhaseSelfCheck[];
  // Interaction count for progressive scaffolding
  interactionCount: number;
}
