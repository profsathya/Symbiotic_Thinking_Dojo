import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';
import {
  ACTIVITY_ROUTES,
  getTopicById,
  getTopicBySlug,
  WHAT_IS_CTI_DOING_TOPIC,
  CTI_POSTER_TOPIC,
} from '@/lib/practice-dojo/topics';
import {
  CTI_POSTER_BOXES,
  CTI_POSTER_TEXT,
  CTI_POSTER_BACK_CARD,
  ctiPosterBoxLabel,
} from '@/lib/practice-dojo/topics/cti-poster';
import * as material from '@/lib/practice-dojo/topics/cti-material';
import { createPracticeDojoWelcome } from '@/lib/prompts/composer';
import { isBackToPosterCard, visiblePosterMessages } from '@/lib/cti-poster-session';

const posterPhase = CTI_POSTER_TOPIC.phases[1].contentGuidance;
const councilPhase = WHAT_IS_CTI_DOING_TOPIC.phases[1].contentGuidance;

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

// Phase guidance plus system instructions. The first build (PR #117) was 7,044 words.
const BUDGET = 5500;

describe('CTI poster dojo', () => {
  it('is registered, enabled, and served on its own route', () => {
    expect(getTopicById('cti-poster')).toBe(CTI_POSTER_TOPIC);
    expect(getTopicBySlug('cti-poster')).toBe(CTI_POSTER_TOPIC);
    expect(CTI_POSTER_TOPIC.enabled).toBe(true);
    expect(CTI_POSTER_TOPIC.title).toBe('Talk to the Sensei about this poster');
    expect(ACTIVITY_ROUTES['cti-poster']).toBe('/cti');
  });

  it('follows the Council dojo engine conventions', () => {
    expect(CTI_POSTER_TOPIC.phases.length).toBe(2);
    expect(CTI_POSTER_TOPIC.suppressThinkingMetrics).toBe(true);
    expect(CTI_POSTER_TOPIC.suppressPhaseGate).toBe(true);
    expect(posterPhase).toContain('NEVER emit [NEXT_PHASE]');
    expect(CTI_POSTER_TOPIC.systemInstructions).toContain('NEVER emit [NEXT_PHASE]');
  });

  it('has the nine poster boxes in three bands, plus Symbiotic Thinking', () => {
    expect(CTI_POSTER_BOXES.length).toBe(10);
    expect(CTI_POSTER_BOXES.filter((b) => b.number !== null).map((b) => b.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    for (const band of [1, 2, 3]) {
      expect(CTI_POSTER_BOXES.filter((b) => b.band === band).length).toBe(3);
    }
    expect(ctiPosterBoxLabel(CTI_POSTER_BOXES[0])).toBe('Box 1 · The Challenge');
    expect(ctiPosterBoxLabel(CTI_POSTER_BOXES[9])).toBe('Symbiotic Thinking');
  });

  it('gives the sensei every label a tile can send', () => {
    for (const box of CTI_POSTER_BOXES) {
      const label = ctiPosterBoxLabel(box);
      // In the per-box section, and on the fallback picker card.
      expect(posterPhase, label).toContain(`\n${label}`);
      expect(posterPhase, label).toContain(`"title":"${label}"`);
    }
  });

  it('carries one design choice, placing line, reading and neighbors per box', () => {
    for (const marker of ['PLACING:', 'READING:', 'DESIGN CHOICE:', 'POINTS TO:', 'NOT SOLVED:', 'NEIGHBORS:']) {
      expect(posterPhase.split(`\n${marker}`).length - 1, marker).toBe(10);
    }
    expect(posterPhase).toContain(
      'CTI defined the new Point B as handling a goal, not as a list of AI skills or tools.'
    );
    expect(posterPhase).toContain('"Human-led" is inside the definition rather than a rule added afterwards.');
  });

  it('carries the poster text first, then the shared material', () => {
    expect(posterPhase).toContain(CTI_POSTER_TEXT);
    expect(CTI_POSTER_TEXT).toContain(
      'Human value will grow as AI capability grows if students learn to think with AI and use it strategically.'
    );
    expect(CTI_POSTER_TEXT).toContain('What would be worse about my solutions if I had simply handed the problem to AI?');
    expect(posterPhase.indexOf(CTI_POSTER_TEXT)).toBeLessThan(
      posterPhase.indexOf(material.CTI_MATERIAL_SYMBIOTIC_DEFINITION)
    );
  });

  it('carries a lean SOURCE 2: the definition, the daily habits and the framework page only', () => {
    for (const kept of [
      material.CTI_MATERIAL_SYMBIOTIC_DEFINITION,
      material.CTI_MATERIAL_SYMBIOTIC_HABITS,
      material.CTI_MATERIAL_FRAMEWORK_PAGE,
    ]) {
      expect(kept.length).toBeGreaterThan(200);
      expect(posterPhase).toContain(kept);
    }
    expect(posterPhase).toContain('Two things in it are deliberate. Human-led:');
    expect(posterPhase).toContain('Four layers:');
    expect(posterPhase).toContain('Design principles the framework was built against');
    // The Council deck, the operations material and the testing commitments stay out.
    for (const dropped of [
      material.CTI_MATERIAL_SYMBIOTIC_THINKING,
      material.CTI_MATERIAL_FRAMEWORK,
      material.CTI_MATERIAL_CONVERSATIONS,
      material.CTI_MATERIAL_OPERATIONS,
      material.CTI_MATERIAL_TESTING,
    ]) {
      expect(posterPhase).not.toContain(dropped);
    }
    for (const phrase of ['Athena', 'Point A', 'The single sprint', 'Four commitments', 'Leadership Council']) {
      expect(posterPhase, phrase).not.toContain(phrase);
    }
  });

  it('never opens a reply with an evaluation of the visitor', () => {
    expect(CTI_POSTER_TOPIC.systemInstructions).toContain(
      `Never open a reply with an evaluation of the visitor or their answer — no "Good", "Exactly", "That's right", "Sharp", "Great point", "Fair". Start with the substance.`
    );
    expect(posterPhase).toContain('Never praise the reading.');
  });

  it('states what is not solved at Step 4 rather than asking', () => {
    const step4 = posterPhase.slice(posterPhase.indexOf('Step 4 —'), posterPhase.indexOf('Step 5 and Step 6'));
    expect(step4).toContain('This is a statement you make');
    expect(step4).toContain('Never turn it into a question');
    expect(step4).toContain('Say "Box 4 points at this", not "Box 4 answers it".');
    expect(step4).toContain('One follow-up question at most.');
    expect(step4).not.toContain('where CTI addresses it');
  });

  it('always puts Symbiotic Thinking on the closing cards', () => {
    const step6 = posterPhase.slice(posterPhase.indexOf('Step 6 —'), posterPhase.indexOf('MOVING AROUND'));
    expect(step6).toContain('The Symbiotic Thinking card is not optional');
    expect(step6).toContain('left out only when Symbiotic Thinking is the current box');
    expect(step6).toContain('"id": "symbiotic"');
    expect(step6.indexOf('"id": "symbiotic"')).toBeLessThan(step6.indexOf('"id": "poster"'));
  });

  it('keeps staff email addresses out of the prompt', () => {
    expect(posterPhase + CTI_POSTER_TOPIC.systemInstructions).not.toMatch(/[\w.]+@[\w.]+\.\w+/);
  });

  it('stays within the lean context budget (about half the first build)', () => {
    expect(words(posterPhase) + words(CTI_POSTER_TOPIC.systemInstructions ?? '')).toBeLessThan(BUDGET);
  });

  it('sends off-scope and comparison questions to the CTI team at the poster', () => {
    expect(posterPhase).toContain('better discussed with the CTI team — they are at the poster, or write to Sathya');
    expect(CTI_POSTER_TOPIC.systemInstructions).toContain('write to Sathya, or tell the CTI team at the poster');
  });

  it('names the poster, not the framework page, when it reads between the lines', () => {
    const prompt = posterPhase + CTI_POSTER_TOPIC.systemInstructions;
    expect(CTI_POSTER_TOPIC.systemInstructions).toContain(
      `${material.CTI_RULE_SCOPE} "the poster doesn't say this directly; my reading is..."`
    );
    expect(prompt).not.toContain("the framework page doesn't say this directly");
    expect(WHAT_IS_CTI_DOING_TOPIC.systemInstructions).toContain(
      `${material.CTI_RULE_SCOPE} "the framework page doesn't say this directly; my reading is..."`
    );
  });

  it('welcome offers the ten boxes as cards', () => {
    const welcome = createPracticeDojoWelcome(CTI_POSTER_TOPIC, 'guided');
    expect(welcome).toContain('Which box are you looking at?');
    const json = welcome.slice(welcome.indexOf('{'), welcome.lastIndexOf('}') + 1);
    const cards = JSON.parse(json) as { options: { id: string; title: string }[] };
    expect(cards.options.map((o) => o.title)).toEqual(CTI_POSTER_BOXES.map(ctiPosterBoxLabel));
  });
});

describe('material shared by the Council dojo and the poster dojo', () => {
  const bodies = [
    material.CTI_MATERIAL_SYMBIOTIC_THINKING,
    material.CTI_MATERIAL_FRAMEWORK,
    material.CTI_MATERIAL_CONVERSATIONS,
    material.CTI_MATERIAL_OPERATIONS,
    material.CTI_MATERIAL_TESTING,
  ];
  const rules = [
    material.CTI_RULE_SCOPE,
    material.CTI_RULE_HYPOTHESIS,
    material.CTI_RULE_STORAGE,
    material.CTI_RULE_NO_FORWARDING,
    material.CTI_RULE_PLAIN_VOICE,
    material.CTI_RULE_NO_COMPARISONS,
    material.CTI_RULE_NO_NOTING,
    material.CTI_RULE_NO_PRAISE,
    material.CTI_RULE_NEVER_NEXT_PHASE,
  ];

  it('the Council dojo carries all five topic bodies', () => {
    for (const body of bodies) {
      expect(body.length).toBeGreaterThan(200);
      expect(councilPhase).toContain(body);
    }
  });

  it('the Council dojo is unchanged by the lean poster context', () => {
    // sha256 of JSON.stringify(WHAT_IS_CTI_DOING_TOPIC) on main at 7377955,
    // before the shared bodies were split into fragments. A deliberate change
    // to the Council dojo should update this hash in the same commit.
    expect(createHash('sha256').update(JSON.stringify(WHAT_IS_CTI_DOING_TOPIC)).digest('hex')).toBe(
      '200ad8e899b10661ed9a6cc2ef1d01e33aaf2b11a588ae1efc2085e3e344fcf8'
    );
  });

  it('both topics carry every shared sensei rule', () => {
    for (const rule of rules) {
      expect(WHAT_IS_CTI_DOING_TOPIC.systemInstructions).toContain(rule);
      expect(CTI_POSTER_TOPIC.systemInstructions).toContain(rule);
    }
  });

  it('never claims the conversation is stored nowhere', () => {
    expect(material.CTI_RULE_STORAGE).toContain('Do not say the conversation is "not stored anywhere"');
    expect(material.CTI_RULE_STORAGE).toContain('their own browser');
    expect(material.CTI_RULE_STORAGE).toContain('AI provider');
  });

  it('the Council dojo keeps its own shape', () => {
    expect(councilPhase).toContain('HOW A TOPIC RUNS');
    expect(councilPhase).toContain('6. SOMETHING ELSE — THE OPEN BOX');
    expect(councilPhase).not.toContain('HOW A BOX RUNS');
    expect(createPracticeDojoWelcome(WHAT_IS_CTI_DOING_TOPIC, 'guided')).toContain(
      'This is a place to explore what CTI is doing'
    );
  });
});

describe('/cti page helpers', () => {
  it('recognizes the Back to the poster card by id or by title', () => {
    expect(isBackToPosterCard({ optionId: CTI_POSTER_BACK_CARD.id, optionTitle: 'anything' })).toBe(true);
    expect(isBackToPosterCard({ optionId: 'back', optionTitle: ' Back to the poster ' })).toBe(true);
    expect(isBackToPosterCard({ optionId: 'box4', optionTitle: 'Box 4 · Transformation is needed' })).toBe(false);
  });

  it('hides the welcome message and nothing else', () => {
    const welcome = { role: 'assistant', id: 'w' };
    const pick = { role: 'user', id: 'u' };
    expect(visiblePosterMessages([welcome, pick])).toEqual([pick]);
    expect(visiblePosterMessages([pick])).toEqual([pick]);
    expect(visiblePosterMessages([])).toEqual([]);
  });
});
