import { DecisionDef } from './types';

// The product brief students architect against. Kept as plain strings so the
// same text drives the setup screen and every AI prompt (one source of truth).

export const LEARNING_GOAL = {
  headline: 'Exercise your ability to partner with AI rather than depend on it.',
  body:
    'True partnership requires differentiating where AI brings knowledge and speed, and where you bring Human Value. In this activity, you will make ten different types of decisions, about a CampusMesh app being built, by yourself, have AI make them, and then revise them in partnership — to clearly experience the difference between AI capability and Human Value.',
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
  'You are the architect. An architecture is the set of decisions that make these flows real. You will make ten of them — two about networking, three about design, three about experience, two about engineering practice. For each: pick an option (or write your own), justify it in 2–4 sentences, and note one thing you are unsure about.';

// Why the Experience theme exists — surfaced in the setup copy: these are the
// decisions where human value is likeliest to shine. Students ARE this app's
// users; their lived campus experience beats the AI's generic UX answers.
export const EXPERIENCE_RATIONALE =
  "The Experience decisions (E1\u2013E3) are where your human value is likeliest to shine \u2014 you ARE this app's users, and your lived campus experience beats the AI's generic UX answers.";

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
    id: 'E1',
    theme: 'Experience',
    title: 'First open',
    prompt:
      'A new student opens the app and no sessions are posted nearby \u2014 what do they see, and why would they come back?',
    options: [
      { id: 'create-first', label: 'Create-first \u2014 an empty state that pushes posting the first session' },
      { id: 'browse-first', label: 'Browse-first \u2014 seed course-based groups so there is always something to join' },
      { id: 'ambient', label: 'Ambient feed \u2014 show recent campus activity even when nothing is live' },
    ],
  },
  {
    id: 'E2',
    theme: 'Experience',
    title: 'Presence comfort',
    prompt:
      "Who gets to see that you're 'live', and what control do you have over it?",
    options: [
      { id: 'default-live', label: 'Live-by-default to everyone in your courses, one-tap hide' },
      { id: 'opt-in', label: 'Opt-in per session \u2014 invisible until you join' },
      { id: 'familiar', label: "Visible only to people from sessions you've joined before" },
    ],
  },
  {
    id: 'E3',
    theme: 'Experience',
    title: 'The moment it fails',
    prompt:
      "Your message doesn't send in a dead zone \u2014 what does the app show, and what happens when signal returns?",
    options: [
      { id: 'optimistic', label: 'Optimistic send with a pending state, auto-retry and reorder on reconnect' },
      { id: 'explicit', label: 'Explicit failure \u2014 message marked red, user taps retry' },
      { id: 'queue', label: 'Silent queue with an offline banner, sends when back' },
    ],
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

THE TEN ARCHITECTURE DECISIONS
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
