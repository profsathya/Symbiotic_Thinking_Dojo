import { DecisionDef } from './types';

// The product brief students architect against. Kept as plain strings so the
// same text drives the setup screen and every AI prompt (one source of truth).

export const LEARNING_GOAL = {
  headline: 'Exercise your ability to partner with AI rather than depend on it.',
  body:
    'True partnership requires differentiating where AI brings knowledge and speed, and where you bring Human Value. In this activity, you will make seven different types of decisions by yourself, have AI make them, and then revise them in partnership — to clearly experience the difference between AI capability and Human Value.',
};

export const CAMPUSMESH_NAME = 'CampusMesh';

export const CAMPUSMESH_SUMMARY =
  'CampusMesh is a study-session app for students: post or join study sessions, see who is live right now, and chat with everyone inside a session.';

export const CAMPUSMESH_FLOWS = [
  {
    title: 'Posting goes live',
    story:
      'Maya posts "CST 311 midterm review, Library 2F, starting now." Jo has the app open — Maya\'s session appears on Jo\'s screen without Jo doing anything.',
  },
  {
    title: 'Session chat',
    story:
      'Jo joins and sends "Bringing the practice exam." Everyone currently in the session sees Jo\'s message.',
  },
];

export const ARCHITECT_JOB =
  'You are the architect. An architecture is the set of decisions that make these flows real. You will make seven of them — two about networking, three about design, two about engineering practice. For each: pick an option (or write your own), justify it in 2–4 sentences, and note one thing you are unsure about.';

export const DECISIONS: DecisionDef[] = [
  {
    id: 'D1',
    theme: 'Networking',
    title: 'Live presence',
    prompt: 'How does "who\'s live now" reach each client?',
    subPrompt:
      'And: a phone loses signal mid-session — when and how do others\' screens update?',
    options: [
      { id: 'poll', label: 'Clients poll a REST endpoint every N seconds' },
      { id: 'ws', label: 'Server pushes over WebSocket' },
      { id: 'sse', label: 'One-way SSE (server-sent events) stream' },
    ],
  },
  {
    id: 'D2',
    theme: 'Networking',
    title: 'Chat delivery',
    prompt:
      'Trace one message from sender to recipients: what does the server store vs. just relay?',
    subPrompt:
      'Delivery guarantee: at-most-once or at-least-once — and what does your choice do to duplicates and ordering?',
    options: [
      { id: 'store-atleast', label: 'Server stores every message; at-least-once delivery' },
      { id: 'relay-atmost', label: 'Server relays without storing; at-most-once delivery' },
      { id: 'hybrid', label: 'Store recent history only; at-least-once with client-side dedup' },
    ],
  },
  {
    id: 'D3',
    theme: 'Design',
    title: 'Component boundaries',
    prompt: 'Where does session-membership logic live?',
    subPrompt: 'Name the components on each side.',
    options: [
      { id: 'thin', label: 'Thin client — server owns all state' },
      { id: 'fat', label: 'Fat client — server as sync point' },
      {
        id: 'split',
        label: 'Split — client owns UI state, server owns membership truth',
      },
    ],
  },
  {
    id: 'D4',
    theme: 'Design',
    title: 'One pattern call',
    prompt:
      "When a session's membership changes, how do the UI pieces find out?",
    subPrompt: 'Justify against the alternatives.',
    options: [
      { id: 'observer', label: 'Observer — pieces subscribe to the session model' },
      { id: 'timer', label: 'Each piece re-reads state on a timer' },
      { id: 'mediator', label: 'A mediator/controller pushes updates' },
    ],
  },
  {
    id: 'D5',
    theme: 'Design',
    title: 'Data model',
    prompt:
      'Entities and relationships (aim: 4–6 entities), and for each: where does its truth live — client cache, server DB, or both?',
    options: [],
  },
  {
    id: 'D6',
    theme: 'Engineering',
    title: 'Testing',
    prompt:
      'The three highest-risk behaviors in this system, and for each the level that must prove it: unit / integration / end-to-end.',
    options: [],
  },
  {
    id: 'D7',
    theme: 'Engineering',
    title: 'Shipping',
    prompt:
      'How does this deploy (one box, or split services?), the CI steps that run on every merge, and the first thing you expect to break in production.',
    options: [],
  },
];

export function getDecision(id: string): DecisionDef | undefined {
  return DECISIONS.find((d) => d.id === id);
}

// One plain-text rendering of the full brief + decision sheet, used verbatim
// in every AI prompt so the model and the student see the same problem.
export function briefAsText(): string {
  const flows = CAMPUSMESH_FLOWS.map(
    (f, i) => `${i + 1}. ${f.title}: ${f.story}`
  ).join('\n');
  const decisions = DECISIONS.map((d) => {
    const opts =
      d.options.length > 0
        ? '\nOptions: ' + d.options.map((o) => o.label).join(' | ') + ' | or propose your own'
        : '\n(Open decision — no preset options; propose your own answer.)';
    return `${d.id} (${d.theme}) — ${d.title}\n${d.prompt}${d.subPrompt ? '\n' + d.subPrompt : ''}${opts}`;
  }).join('\n\n');

  return `PRODUCT BRIEF — ${CAMPUSMESH_NAME}
${CAMPUSMESH_SUMMARY}

Core flows:
${flows}

THE SEVEN ARCHITECTURE DECISIONS
${decisions}`;
}

export const REFLECTION_QUESTIONS: {
  key: 'changedMind' | 'overruled' | 'delegateWrong' | 'aiEnabled';
  question: string;
}[] = [
  {
    key: 'changedMind',
    question:
      'Pick the decision where your solo choice and the final choice differ most. What changed your mind — and was it right to change?',
  },
  {
    key: 'overruled',
    question:
      'Pick a decision where you overruled the AI. What did you have to know, or be able to do, for that to happen?',
  },
  {
    key: 'delegateWrong',
    question:
      'Where was the delegate pass wrong or shallow, and how do you know?',
  },
  {
    key: 'aiEnabled',
    question:
      "What did AI make possible in the partner pass that you couldn't have done alone?",
  },
];
