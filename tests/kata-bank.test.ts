import { describe, it, expect } from 'vitest';
import {
  KATA_BANK,
  BELT_ORDER,
  getKataById,
  beltTestKata,
  renderKataBank,
} from '@/lib/practice-dojo/kata-bank';
import { INTRODUCTORY_PROGRAMMING_TOPIC } from '@/lib/practice-dojo/topics/introductory-programming';
import { createPracticeDojoWelcome } from '@/lib/prompts/composer';
import { KATA_RESULT_MARKER_REGEX } from '@/lib/types';

describe('kata bank invariants (v2 belts)', () => {
  it('has unique ids', () => {
    const ids = KATA_BANK.map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every belt has at least 4 katas and exactly one belt test', () => {
    for (const belt of BELT_ORDER) {
      const katas = KATA_BANK.filter((k) => k.belt === belt);
      expect(katas.length, belt).toBeGreaterThanOrEqual(4);
      expect(katas.filter((k) => k.beltTest).length, `${belt} belt tests`).toBe(1);
      expect(beltTestKata(belt)?.belt).toBe(belt);
    }
  });

  it('write katas carry all three language signatures and at least 3 visible tests', () => {
    for (const k of KATA_BANK.filter((k) => k.kind === 'write')) {
      expect(k.signatures, k.id).toBeDefined();
      expect(k.signatures!.java.length, k.id).toBeGreaterThan(0);
      expect(k.signatures!.python.length, k.id).toBeGreaterThan(0);
      expect(k.signatures!.javascript.length, k.id).toBeGreaterThan(0);
      expect(k.tests.length, k.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('write-kind belt tests power the Edge Hunt with at least one hidden test', () => {
    for (const belt of BELT_ORDER) {
      const test = beltTestKata(belt)!;
      if (test.kind === 'write') {
        expect(test.hiddenTests?.length, `${belt} belt test hidden`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('read, predict, and bug-hunt katas carry the code they refer to', () => {
    for (const k of KATA_BANK.filter((k) => ['read', 'predict', 'bug-hunt'].includes(k.kind))) {
      expect(k.code, k.id).toBeDefined();
      expect(k.code!.length, k.id).toBeGreaterThan(0);
      expect(k.tests.length, k.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('design katas carry a defense rubric of at least 2 criteria', () => {
    const designs = KATA_BANK.filter((k) => k.kind === 'design');
    expect(designs.length).toBeGreaterThanOrEqual(3);
    for (const k of designs) {
      expect(k.rubric?.length, k.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('the White Belt on-ramp starts with read katas', () => {
    const white = KATA_BANK.filter((k) => k.belt === 'white');
    expect(white.filter((k) => k.kind === 'read').length).toBeGreaterThanOrEqual(2);
  });

  it('every belt beyond white trains "finding what is wrong" (bug-hunt or design)', () => {
    for (const belt of BELT_ORDER.filter((b) => b !== 'white')) {
      const katas = KATA_BANK.filter(
        (k) => k.belt === belt && (k.kind === 'bug-hunt' || k.kind === 'design')
      );
      expect(katas.length, belt).toBeGreaterThanOrEqual(1);
    }
  });

  it('v1 kata ids are preserved so existing scorecards stay valid', () => {
    for (const id of ['war-1a', 'str-2a', 'arr-3b', 'log-2a', 'str-3a']) {
      expect(getKataById(id), id).toBeDefined();
    }
  });

  it('every phase-1..3 kata field renders into the prompt bank', () => {
    const rendered = renderKataBank();
    for (const k of KATA_BANK) {
      expect(rendered).toContain(k.id);
    }
    expect(rendered).toContain('HIDDEN edge tests');
    expect(rendered).toContain('Defense rubric');
    expect(rendered).toContain('BELT TEST');
  });
});

describe('Code Kata Dojo topic (v2)', () => {
  const instructions = INTRODUCTORY_PROGRAMMING_TOPIC.systemInstructions!;

  it('embeds the full kata bank in its system instructions', () => {
    for (const k of KATA_BANK) {
      expect(instructions).toContain(k.id);
    }
  });

  it('describes the extended KATA_RESULT protocol', () => {
    expect(instructions).toContain('KATA_RESULT');
    expect(instructions).toContain('"edgeFound"');
    expect(instructions).toContain('"defended"');
    expect(instructions).toContain('"beltTest"');
  });

  it('demands task clarity, the jargon decoder, and the edge-hunt secrecy rule', () => {
    expect(instructions).toContain('YOUR TASK');
    expect(instructions).toContain('JARGON DECODER');
    expect(instructions).toContain('Reveal hidden edge tests before the student proposes an edge');
  });

  it('keeps belts soft-gated (never locked)', () => {
    expect(instructions).toContain('Never lock a belt');
  });

  it('welcome message asks the language question with all three options', () => {
    const welcome = createPracticeDojoWelcome(INTRODUCTORY_PROGRAMMING_TOPIC, 'guided');
    expect(welcome).toContain('"java"');
    expect(welcome).toContain('"python"');
    expect(welcome).toContain('"javascript"');
    expect(welcome).toContain('belts');
    expect(welcome).not.toContain('What drew you to this topic');
  });

  it('setup phase treats the opening message as the language pick and asks belt placement', () => {
    const setup = INTRODUCTORY_PROGRAMMING_TOPIC.phases[1].contentGuidance;
    expect(setup).toContain('WELCOME message already asked the language question');
    expect(setup).toContain('Do NOT re-show the language cards');
    expect(setup).toContain('Where is your class right now?');
  });

  it('final phase never signals a next phase', () => {
    const phases = INTRODUCTORY_PROGRAMMING_TOPIC.phases;
    expect(phases[phases.length - 1].contentGuidance).toContain('never emit');
  });
});

describe('KATA_RESULT marker parsing (v2 fields)', () => {
  const sample =
    'Belt test passed!\n[KATA_RESULT: {"kataId":"yel-3a","belt":"yellow","tier":3,"kind":"write","language":"java","pattern":"negation in conditions","predictionsRight":2,"predictionsTotal":2,"planHeld":true,"edgeFound":true,"defended":true,"beltTest":true,"solved":true}]';

  it('matches and captures the extended payload', () => {
    KATA_RESULT_MARKER_REGEX.lastIndex = 0;
    const matches = [...sample.matchAll(KATA_RESULT_MARKER_REGEX)];
    expect(matches.length).toBe(1);
    const parsed = JSON.parse(matches[0][1]);
    expect(parsed.belt).toBe('yellow');
    expect(parsed.beltTest).toBe(true);
    expect(parsed.edgeFound).toBe(true);
    expect(parsed.defended).toBe(true);
  });

  it('strips cleanly from display content', () => {
    const stripped = sample.replace(KATA_RESULT_MARKER_REGEX, '').trim();
    expect(stripped).toBe('Belt test passed!');
  });
});
