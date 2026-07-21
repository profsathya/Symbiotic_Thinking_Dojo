import { describe, it, expect } from 'vitest';
import { ALL_TOPICS, ENABLED_TOPICS, getTopicById, getTopicBySlug, TOPIC_SLUGS } from '@/lib/practice-dojo/topics';
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
