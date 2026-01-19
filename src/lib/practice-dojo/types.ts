// Practice Dojo Types

// Pathway options for topic engagement
export type Pathway = 'guided' | 'quick' | 'test';

// Topic categories
export type TopicCategory = 'foundations' | 'course' | 'general';

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
export type DiagramType = '3cs' | 'umpire' | 'dikw' | 'personal-stack' | '3cs-umpire-mapping' | 'dojo-modes';

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
  style: 'reveal' | 'insight' | 'summary' | 'warning';
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
  // Additional content for course topics
  courseContent?: {
    syllabus: string;
    learningObjectives: string[];
    schedule?: string;
  };
}

// Practice Dojo local state (persisted to localStorage)
export interface PracticeDojoState {
  // Current session info
  topicId: string | null;
  currentPhase: number;
  completedPhases: number[];
  pathway: Pathway | null;

  // User choices made during the session
  userChoices: Record<string, string>;

  // Checkpoint responses
  checkpointResponses: Record<string, string>;
  checkpointStatuses: Record<string, CheckpointStatus>;

  // Completed topics
  completedTopics: string[];

  // Timestamps
  lastUpdated: string;
  sessionStarted: string | null;
}

// Initial state
export const INITIAL_PRACTICE_DOJO_STATE: PracticeDojoState = {
  topicId: null,
  currentPhase: 0,
  completedPhases: [],
  pathway: null,
  userChoices: {},
  checkpointResponses: {},
  checkpointStatuses: {},
  completedTopics: [],
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
}
