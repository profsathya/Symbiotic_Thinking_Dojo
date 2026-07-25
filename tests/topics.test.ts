import { describe, it, expect } from 'vitest';
import { ALL_TOPICS, ENABLED_TOPICS, getTopicById, getTopicBySlug, TOPIC_SLUGS } from '@/lib/practice-dojo/topics';
import { createPracticeDojoWelcome } from '@/lib/prompts/composer';
import { NEXT_PHASE_MARKER_REGEX } from '@/lib/types';

describe('topic invariants', () => {
  it('has unique topic ids', () => {
    const ids = ALL_TOPICS.map((t) => t.topicId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every topic has at least one pathway and one phase', () => {
    for (const topic of ALL_TOPICS) {
      expect(topic.pathways.length, topic.topicId).toBeGreaterThan(0);
      expect(topic.phases.length, topic.topicId).toBeGreaterThan(0);
    }
  });

  it('every phase can present a goal to the student (studentGoal or purpose)', () => {
    for (const topic of ALL_TOPICS) {
      for (const phase of topic.phases) {
        const goal = phase.studentGoal ?? phase.purpose;
        expect(goal, `${topic.topicId} phase ${phase.phaseId}`).toBeTruthy();
      }
    }
  });

  it('phaseIds match their position in the phases array', () => {
    for (const topic of ALL_TOPICS) {
      topic.phases.forEach((phase, index) => {
        expect(phase.phaseId, `${topic.topicId}[${index}]`).toBe(index);
      });
    }
  });

  it('topics that use the [NEXT_PHASE] marker teach signal semantics, not engine semantics', () => {
    for (const topic of ALL_TOPICS) {
      if (topic.systemInstructions?.includes('[NEXT_PHASE]')) {
        expect(topic.systemInstructions, topic.topicId).toContain('STUDENT');
        expect(topic.systemInstructions, topic.topicId).not.toContain(
          'only way the engine advances'
        );
      }
    }
  });

  it('every slug maps to a topic or a standalone activity route', () => {
    for (const slug of Object.keys(TOPIC_SLUGS)) {
      const topicId = TOPIC_SLUGS[slug];
      // Standalone activities (e.g. architect) are not TopicConfigs
      if (topicId === 'architect') continue;
      expect(getTopicById(topicId), slug).toBeDefined();
      expect(getTopicBySlug(slug), slug).toBeDefined();
    }
  });

  it('enabled topics are a subset of all topics', () => {
    for (const topic of ENABLED_TOPICS) {
      expect(topic.enabled).toBe(true);
      expect(ALL_TOPICS).toContain(topic);
    }
  });
});

describe('Project Interview Dojo', () => {
  const topic = getTopicById('project-interview')!;

  it('is registered, enabled, and reachable at ?topic=interview', () => {
    expect(topic).toBeDefined();
    expect(topic.enabled).toBe(true);
    expect(getTopicBySlug('interview')?.topicId).toBe('project-interview');
  });

  it('has the five rounds plus the welcome placeholder', () => {
    expect(topic.phases.length).toBe(6);
    expect(topic.phases[4].isArrivalMilestone).toBe(true);
  });

  it('carries the round-4 role-switch and re-orientation protocols', () => {
    expect(topic.systemInstructions).toContain('ROUND 4 ROLE-SWITCH PROTOCOL');
    expect(topic.systemInstructions).toContain('RE-ORIENTATION');
    expect(topic.systemInstructions).toContain('CORNER COACH');
    // Unassisted answering is the rep
    expect(topic.systemInstructions).toContain('Give the CANDIDATE nothing during the interview');
  });

  it('trains the honest "I don\'t know yet" and the committed addition', () => {
    const round2 = topic.phases[2].contentGuidance;
    expect(round2).toContain("I don't know yet — here's how I'd find out");
    expect(round2).toContain('ONE concrete addition');
    expect(round2).toContain('FIRST MOVE');
  });

  it('welcome states the frame and asks for the project', () => {
    const welcome = createPracticeDojoWelcome(topic, 'guided');
    expect(welcome).toContain('what you did and why, in your own words');
    expect(welcome).toContain('tell me about your project');
    expect(welcome).not.toContain('What drew you to this topic');
  });

  it('final phase never signals a next phase', () => {
    expect(topic.phases[topic.phases.length - 1].contentGuidance).toContain('never emit');
  });

  // Live-test fixes (2026-07-24 field trial)
  it('enforces voice label discipline and bans stage directions', () => {
    expect(topic.systemInstructions).toContain('LABEL DISCIPLINE');
    expect(topic.systemInstructions).toContain('FIRST token of the message');
    expect(topic.systemInstructions).toContain('Never emit a label with no content after it');
    expect(topic.systemInstructions).toContain('No stage directions');
  });

  it('folds stray partner mentions into the current round instead of switching modes', () => {
    expect(topic.systemInstructions).toContain('STRAY @MENTIONS');
    expect(topic.systemInstructions).toContain('never switch modes');
  });

  it('round 2 catches up a skipped 60-second version without scolding', () => {
    const round2 = topic.phases[2].contentGuidance;
    expect(round2).toContain('WITHOUT a typed 60-second version');
    expect(round2).toContain('rough is fine');
    expect(round2).toContain('no scolding');
  });

  it('names the real "Save Session" button, never a nonexistent Export one', () => {
    const allText = topic.systemInstructions + topic.phases.map((p) => p.contentGuidance).join('');
    expect(allText).toContain('"Save Session"');
    expect(allText).not.toMatch(/EXPORT the session|export button/);
  });
});

describe('NEXT_PHASE marker regex', () => {
  it('strips every occurrence from a message', () => {
    const message = 'Great work!\n[NEXT_PHASE]\nMore text [NEXT_PHASE]';
    expect(message.replace(NEXT_PHASE_MARKER_REGEX, '')).not.toContain('[NEXT_PHASE]');
  });

  it('detects the marker anywhere in the message', () => {
    NEXT_PHASE_MARKER_REGEX.lastIndex = 0;
    expect(NEXT_PHASE_MARKER_REGEX.test('closing thoughts\n[NEXT_PHASE]')).toBe(true);
  });

  it('does not match near-miss text', () => {
    NEXT_PHASE_MARKER_REGEX.lastIndex = 0;
    expect(NEXT_PHASE_MARKER_REGEX.test('the next phase is yours')).toBe(false);
  });
});
