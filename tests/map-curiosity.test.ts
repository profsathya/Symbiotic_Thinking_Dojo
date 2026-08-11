import { describe, it, expect } from 'vitest';
import { getTopicById, getTopicBySlug } from '@/lib/practice-dojo/topics';
import { createPracticeDojoWelcome } from '@/lib/prompts/composer';
import { composeSystemPrompt } from '@/lib/prompts/composer';
import { DojoConfig } from '@/lib/types';
import {
  OPENING_FRAME,
  OPENING_QUESTION,
  SECOND_EPISODE_TRANSITION,
  THREAD_QUESTION,
  NOW_QUESTION,
  STRUGGLE_QUESTION,
  TRY_QUESTION,
  CLOSING_LINE,
  STORAGE_ANSWER,
  ASSESSMENT_ANSWER,
  RECORD_SYNC_ENABLED,
  buildMapCuriosityTopic,
} from '@/lib/practice-dojo/topics/map-curiosity-stages';

const topic = getTopicById('map-curiosity')!;

const config: DojoConfig = {
  dojoPrompt: 'DOJO-PROMPT',
  senseiPrompt: 'SENSEI-PROMPT',
  ikigaiPrompt: 'IKIGAI-PROMPT',
  constructs: [],
  partners: [],
};

/** Everything the model is given for a stage: guidance + criteria. */
const stageText = (phaseId: number) => {
  const phase = topic.phases.find((p) => p.phaseId === phaseId)!;
  return `${phase.contentGuidance}\n${phase.checkpointCriteria ?? ''}`;
};

/** The whole prompt surface for the topic. */
const allText = () =>
  [topic.systemInstructions ?? '', ...topic.phases.map((p) => stageText(p.phaseId))].join('\n');

describe('Map Your Curiosity — slot and shape', () => {
  it('keeps the existing topic id, title, and URL slug', () => {
    expect(topic.topicId).toBe('map-curiosity');
    expect(topic.title).toBe('Map Your Curiosity');
    expect(topic.category).toBe('foundations');
    expect(topic.enabled).toBe(true);
    expect(getTopicBySlug('map-curiosity')?.topicId).toBe('map-curiosity');
  });

  // The engine always starts at currentPhase 1 and marks phase 0 completed,
  // so the five stages must occupy phases[1..5].
  it('puts the five stages at phases 1-5 behind a welcome-owned phase 0', () => {
    expect(topic.phases).toHaveLength(6);
    expect(topic.phases.map((p) => p.phaseId)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(topic.phases.slice(1).map((p) => p.title)).toEqual([
      'Opening',
      'Episodes',
      'The thread',
      'Now',
      'The try',
    ]);
  });

  it('signals readiness in stages 1-4 and never in the final stage', () => {
    for (const phaseId of [1, 2, 3, 4]) {
      expect(stageText(phaseId), `stage ${phaseId}`).toContain('[NEXT_PHASE]');
    }
    expect(stageText(5)).toContain('Do NOT emit');
    expect(stageText(5)).not.toMatch(/emit \\?`?\[NEXT_PHASE\]\\?`? on its own line/);
  });
});

describe('Map Your Curiosity — verbatim lines', () => {
  it('delivers the opening frame and question word for word in the welcome', () => {
    const welcome = createPracticeDojoWelcome(topic, 'guided');
    expect(welcome).toContain(OPENING_FRAME);
    expect(welcome).toContain(OPENING_QUESTION);
    // The old flow's free-time selection cards are gone.
    expect(welcome).not.toContain('selection-cards');
    expect(welcome).not.toContain('free time');
  });

  it('carries each scripted line in the stage that must say it', () => {
    expect(stageText(2)).toContain(SECOND_EPISODE_TRANSITION);
    expect(stageText(3)).toContain(THREAD_QUESTION);
    expect(stageText(4)).toContain(NOW_QUESTION);
    expect(stageText(4)).toContain(STRUGGLE_QUESTION);
    expect(stageText(5)).toContain(TRY_QUESTION);
    expect(stageText(5)).toContain(CLOSING_LINE);
  });

  it('asks the struggle question as its own turn, not bundled', () => {
    expect(stageText(4)).toMatch(/AS ITS OWN TURN/);
    expect(stageText(4)).toMatch(/not bundled/i);
  });
});

describe('Map Your Curiosity — Sensei behavior contract', () => {
  const instructions = topic.systemInstructions ?? '';

  it('forbids naming qualities, scoring, and praising content', () => {
    expect(instructions).toMatch(/[Nn]ever name a quality/);
    expect(instructions).toMatch(/[Nn]ever show, imply, or hint at a score/);
    expect(instructions).toMatch(/forbidden/);
  });

  it('forbids promising discovery', () => {
    expect(instructions).toMatch(/NEVER PROMISE DISCOVERY/);
    expect(instructions).toMatch(/passion/);
  });

  it('holds the one-question-per-turn rule', () => {
    expect(instructions).toMatch(/ONE QUESTION PER TURN/);
  });

  it('restricts whys to stage transitions and gives one per transition', () => {
    expect(instructions).toMatch(/ONLY at stage transitions/);
    for (const phaseId of [2, 3, 4, 5]) {
      expect(stageText(phaseId), `stage ${phaseId}`).toContain('TRANSITION WHY');
    }
    // Stage 1 is entered from the welcome, so it carries no transition why.
    expect(stageText(1)).not.toContain('TRANSITION WHY');
  });

  it('sanctions exactly one mechanism reveal — the stage 2 transition', () => {
    expect(instructions).toMatch(/ONE sanctioned exception/);
    expect(stageText(2)).toMatch(/ONE place the conversation reveals its own mechanism/);
  });

  it('teaches signal semantics, not engine semantics, for [NEXT_PHASE]', () => {
    expect(instructions).toContain('STUDENT');
    expect(instructions).not.toContain('only way the engine advances');
  });
});

describe('Map Your Curiosity — the nothing-comes path', () => {
  const stage1 = stageText(1);

  it('steps down gently with concrete smaller doors', () => {
    expect(stage1).toMatch(/STEP DOWN/);
    expect(stage1).toMatch(/Do not push/);
    expect(stage1).toMatch(/game they went deep on/);
    expect(stage1).toMatch(/routine they built/);
    expect(stage1).toMatch(/fixed or reorganized/);
    expect(stage1).toMatch(/kept doing after the original reason/);
  });

  it('routes to Stage 4 and flags the record, without the forbidden promise', () => {
    expect(stage1).toMatch(/move to Stage 4/);
    expect(stage1).toMatch(/not_yet_surfaced/);
    expect(stage1).toMatch(/do NOT promise/i);
  });

  it('never tells the student their thing will be found', () => {
    // The forbidden promise, in the shapes it would actually take.
    expect(allText()).not.toMatch(/we'll find (what|your)/i);
    expect(allText()).not.toMatch(/we will find (what|your)/i);
    expect(allText()).not.toMatch(/discover your (passion|purpose|calling)/i);
  });
});

describe('Map Your Curiosity — truthful fallback answers', () => {
  it('defaults to the no-server answer, because sync defaults off', () => {
    expect(RECORD_SYNC_ENABLED).toBe(false);
    expect(STORAGE_ANSWER).toContain('nothing is saved to a server');
    expect(STORAGE_ANSWER).toContain('stays in your browser');
  });

  it('answers the scoring question without claiming there are no notes', () => {
    expect(ASSESSMENT_ANSWER).toContain("I'm not scoring you");
    expect(ASSESSMENT_ANSWER).toContain('for your instructor');
    expect(ASSESSMENT_ANSWER).toContain('no grade and no score');
  });

  it('puts both answers in the prompt, marked as exact', () => {
    const instructions = topic.systemInstructions ?? '';
    expect(instructions).toContain(STORAGE_ANSWER);
    expect(instructions).toContain(ASSESSMENT_ANSWER);
    expect(instructions).toMatch(/answer with exactly this and nothing more/);
  });
});

describe('Map Your Curiosity — the record instruction', () => {
  const instructions = topic.systemInstructions ?? '';

  it('asks for the marker only in the final message, and hides it', () => {
    expect(instructions).toContain('[CURIOSITY_RECORD:');
    expect(instructions).toMatch(/never shown to the student/);
    expect(instructions).toMatch(/strips this marker/);
    expect(instructions).toMatch(/exactly one record, in your final message only/);
  });

  it('describes every schema field', () => {
    for (const field of [
      'run',
      'episodes',
      'first_move',
      'stayed_through',
      'revised',
      'ended_how',
      'student_named',
      'sensei_proposed',
      'unrequired_pull',
      'predicted_struggle',
      'observable_as',
      'self_knowledge',
      'self_regulation',
      'owning_the_outcome',
      'initiative',
      'adaptability',
      'working_with_uncertainty',
      'protective_care',
      'not_yet_surfaced',
      'declined_try',
    ]) {
      expect(instructions, field).toContain(field);
    }
  });

  it('bans numbers and levels in evidence notes', () => {
    expect(instructions).toMatch(/NEVER numbers, NEVER levels, NEVER ratings/);
  });
});

describe('Map Your Curiosity — variant reuse', () => {
  it('builds a run-2 variant from the same stages without copying text', () => {
    const run2 = buildMapCuriosityTopic({
      run: 2,
      topicId: 'map-curiosity-revisit',
      title: 'Map Your Curiosity — Revisit',
      description: 'A shorter check-in later in the semester',
      estimatedTime: '~10 min',
      pathwayTitle: 'The check-in',
      pathwayDescription: 'Shorter, same shape',
      episodeCount: 1,
      openingFrame: 'We talked earlier in the semester. I want to pick that back up.',
      openingQuestion: 'What have you done on your own since we last talked?',
    });

    expect(run2.topicId).toBe('map-curiosity-revisit');
    expect(run2.phases).toHaveLength(6);
    // Shared scaffolding carries over…
    expect(run2.phases[3].contentGuidance).toContain(THREAD_QUESTION);
    expect(run2.phases[5].contentGuidance).toContain(CLOSING_LINE);
    expect(run2.systemInstructions).toContain(ASSESSMENT_ANSWER);
    // …the record is stamped run 2, and the single-episode variant drops the
    // second-episode transition line.
    expect(run2.systemInstructions).toContain('"run": 2');
    expect(run2.phases[2].contentGuidance).not.toContain(SECOND_EPISODE_TRANSITION);
  });
});

describe('Map Your Curiosity — the old flow is gone', () => {
  it('leaves no trace of the retired four-step activity', () => {
    const text = allText() + createPracticeDojoWelcome(topic, 'guided');
    for (const relic of [
      'CONNECTOR',
      'What Pulls You In',
      'Name the Question',
      "Find What's Under It",
      'Carry It',
      'Nanoprogramming Workshop',
      'Math Summer Bridge',
      'MIN TURNS TO LAND',
      'curiosity-led',
    ]) {
      expect(text.toLowerCase(), relic).not.toContain(relic.toLowerCase());
    }
  });

  it('drops the multi-pathway menu for a single led conversation', () => {
    expect(topic.pathways).toHaveLength(1);
    expect(topic.pathways[0].id).toBe('guided');
  });
});

describe('Map Your Curiosity — composed prompt', () => {
  it('reaches the model with the stage guidance and the behavior contract', () => {
    const prompt = composeSystemPrompt(config, 'learn', [], {
      practiceDojoContext: {
        topic,
        currentPhase: topic.phases[2],
        pathway: 'guided',
        completedPhases: [0, 1],
        userChoices: {},
        checkpointStatuses: {},
        phaseSelfChecks: [],
        kataResults: [],
        interactionCount: 3,
      },
    });

    expect(prompt).toContain('MAP YOUR CURIOSITY');
    expect(prompt).toContain(SECOND_EPISODE_TRANSITION);
    expect(prompt).toContain(ASSESSMENT_ANSWER);
    expect(prompt).toContain('ONE QUESTION PER TURN');
    // The kata scorecard block must not leak into this topic.
    expect(prompt).not.toContain('KATA SCORECARD');
  });
});
