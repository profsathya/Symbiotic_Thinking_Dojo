import { TopicConfig } from '../types';
import { buildMapCuriosityTopic } from './map-curiosity-stages';

/**
 * Map Your Curiosity — Run 1 (fall semester, weeks 1–2).
 *
 * A single ~20–25 minute conversation the Sensei leads through five stages:
 * Opening → Episodes → The thread → Now → The try. The Sensei moves forward
 * only, carries a one-line why at each transition, and never names a quality,
 * scores an answer, or promises the student will discover anything.
 *
 * The stage text, verbatim lines, behavior contract, and end-of-session
 * record instruction all live in `map-curiosity-stages.ts` so the week 6–8
 * revisit (run 2) can reuse them without copying. That variant is not built
 * yet; when it is, it calls buildMapCuriosityTopic({ run: 2, ... }) with its
 * own topicId and overrides only the opening.
 *
 * Phase indexing: the engine (usePracticeDojoState.startSession) always
 * starts a session at currentPhase 1, so the five stages occupy phases[1..5]
 * and phases[0] is a welcome-owned placeholder that never runs. The Stage 1
 * frame and question are delivered verbatim by createPracticeDojoWelcome.
 */
export const MAP_CURIOSITY_TOPIC: TopicConfig = buildMapCuriosityTopic({
  run: 1,
  topicId: 'map-curiosity',
  title: 'Map Your Curiosity',
  description:
    'A conversation about things you have done on your own — and what you want from this semester',
  estimatedTime: '~20–25 min',
  pathwayTitle: 'The conversation',
  pathwayDescription: 'Five stages, led — you talk, I ask',
  episodeCount: 2,
});
