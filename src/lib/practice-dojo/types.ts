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

// One entry per completed kata cycle in the Code Kata Dojo, reported by the
// model via the [KATA_RESULT: {...}] marker and persisted ACROSS sessions so
// a student picks up where they left off (tier, solved katas, calibration).
export interface KataResult {
  kataId: string;
  tier: number;
  language: string;
  // The reusable move this kata practices (from the bank's pattern tag)
  pattern: string;
  // Predict-then-run: how many of the student's test-case predictions about
  // their OWN code were right — the objectively verifiable metacognitive score
  predictionsRight: number;
  predictionsTotal: number;
  // Whether the final code matched the plan the student stated up front
  planHeld: boolean;
  solved: boolean;
  at: string;
  // ---- Belt-system fields (v2; optional so pre-belt records stay valid) ----
  // Which belt (milestone) the kata belongs to
  belt?: string;
  // Whether this kata was a belt test (passing one earns the belt)
  beltTest?: boolean;
  // Edge Hunt: the student proposed a genuine edge case before the hidden
  // tests were revealed
  edgeFound?: boolean;
  // Defend: the student defended a challenged decision by referencing
  // behavior or a test case (not "it just works")
  defended?: boolean;
}

// One conversation's record from "What Are My Priorities?", reported by the
// model via the [PRIORITIES_RECORD: {...}] marker at the close and persisted
// to the browser. Never sent anywhere on its own — the student downloads it
// (Markdown for themselves, JSON for handing in) if they choose to.
export interface TimePictureEntry {
  // The student's own name for the category (the six, plus any they added)
  category: string;
  // Hours on an average day — their opening guess, before types-and-sources
  // made anything concrete. Hours rather than percentages because that is
  // what a student can actually answer; percentages stay derivable from them.
  first_estimate_hours: number | null;
  // Where they landed after. null means they never revised this one — the
  // first estimate is deliberately NOT copied here, because "didn't revise"
  // is itself the signal.
  revised_hours: number | null;
  // Their word for how good this part of the day is, not the Sensei's
  quality_rating: string;
  // The concrete things they named: apps, shows, sources, kinds of meals
  sources_named: string[];
}

export interface PrioritiesRecord {
  activity: 'what-are-my-priorities';
  time_picture: TimePictureEntry[];
  mind_nutrition: {
    sources: string[];
    student_read_on_quality: string;
  };
  // named is true only when the STUDENT put the calibration gap into words
  self_named_gap: {
    named: boolean | null;
    student_words: string;
  };
  try: {
    named: boolean | null;
    student_words: string;
    // Where the try would show up in course behavior if it happened — what
    // makes a later revisit checkable
    observable_as: string;
  };
  // Prose observations, never scores. Limited to the two qualities this
  // activity reads. Written to survive being read by the student.
  evidence_notes: {
    self_knowledge: string;
    self_regulation: string;
  };
  flags: {
    declined_try: boolean;
    // True only when the student themselves opened up about a physical habit
    // and reflected on it. Not a concern rating, not a referral.
    physical_habit_flag: boolean;
  };
  // Stamped locally when the marker is parsed, never taken from the model
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

  // Code Kata Dojo scorecard — persists across sessions AND across topic
  // completion, so returning students resume their tier and calibration.
  // Only ever reset by an explicit full reset.
  kataResults: KataResult[];

  // "What Are My Priorities?" conversation records — one per completed
  // conversation. Kept across sessions and topic completion so a student who
  // comes back still has the record they can download.
  prioritiesRecords: PrioritiesRecord[];

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
  kataResults: [],
  prioritiesRecords: [],
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
  // Kata scorecard history (Code Kata Dojo) — lets the Sensei resume tier,
  // skip solved katas, and speak to the student's prediction calibration
  kataResults: KataResult[];
  // Interaction count for progressive scaffolding
  interactionCount: number;
}
