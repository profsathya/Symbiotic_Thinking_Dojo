import { describe, it, expect } from 'vitest';
import { KATA_BANK, getKataById, renderKataBank, KataCategory } from '@/lib/practice-dojo/kata-bank';
import { INTRODUCTORY_PROGRAMMING_TOPIC } from '@/lib/practice-dojo/topics/introductory-programming';
import { KATA_RESULT_MARKER_REGEX } from '@/lib/types';

describe('kata bank invariants', () => {
  it('has 24 katas: 4 categories x 3 tiers x 2 each', () => {
    expect(KATA_BANK.length).toBe(24);
    const categories: KataCategory[] = ['warmup', 'strings', 'arrays', 'logic'];
    for (const category of categories) {
      for (const tier of [1, 2, 3] as const) {
        const matching = KATA_BANK.filter((k) => k.category === category && k.tier === tier);
        expect(matching.length, `${category} tier ${tier}`).toBe(2);
      }
    }
  });

  it('has unique ids', () => {
    const ids = KATA_BANK.map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every kata has all three language signatures', () => {
    for (const k of KATA_BANK) {
      expect(k.signatures.java, k.id).toMatch(/^public /);
      expect(k.signatures.python, k.id).toMatch(/^def /);
      expect(k.signatures.javascript, k.id).toMatch(/^function /);
    }
  });

  it('every kata has a pattern, a theme hint, and at least 3 test cases', () => {
    for (const k of KATA_BANK) {
      expect(k.pattern.length, k.id).toBeGreaterThan(0);
      expect(k.themeHint.length, k.id).toBeGreaterThan(0);
      expect(k.tests.length, k.id).toBeGreaterThanOrEqual(3);
      for (const t of k.tests) {
        expect(t.expected.length, `${k.id} test (${t.input})`).toBeGreaterThan(0);
      }
    }
  });

  it('getKataById finds every kata and misses unknown ids', () => {
    for (const k of KATA_BANK) {
      expect(getKataById(k.id)).toBe(k);
    }
    expect(getKataById('nope-9z')).toBeUndefined();
  });

  it('renderKataBank includes every kata id and every test table', () => {
    const rendered = renderKataBank();
    for (const k of KATA_BANK) {
      expect(rendered).toContain(k.id);
      expect(rendered).toContain(k.tests[0].expected);
    }
  });
});

describe('Code Kata Dojo topic', () => {
  it('embeds the full kata bank in its system instructions', () => {
    for (const k of KATA_BANK) {
      expect(INTRODUCTORY_PROGRAMMING_TOPIC.systemInstructions).toContain(k.id);
    }
  });

  it('describes the KATA_RESULT protocol', () => {
    expect(INTRODUCTORY_PROGRAMMING_TOPIC.systemInstructions).toContain('KATA_RESULT');
  });

  it('offers Java, Python, and JavaScript', () => {
    const setup = INTRODUCTORY_PROGRAMMING_TOPIC.phases[1].contentGuidance;
    expect(setup).toContain('"java"');
    expect(setup).toContain('"python"');
    expect(setup).toContain('"javascript"');
  });

  it('final phase never signals a next phase', () => {
    const phases = INTRODUCTORY_PROGRAMMING_TOPIC.phases;
    const finalPhase = phases[phases.length - 1];
    expect(finalPhase.contentGuidance).toContain('never emit');
  });
});

describe('KATA_RESULT marker parsing', () => {
  const sample =
    'Great cycle!\n[KATA_RESULT: {"kataId":"str-2a","tier":2,"language":"java","pattern":"adjacent scan","predictionsRight":2,"predictionsTotal":2,"planHeld":true,"solved":true}]';

  it('matches a well-formed marker and captures the JSON payload', () => {
    KATA_RESULT_MARKER_REGEX.lastIndex = 0;
    const matches = [...sample.matchAll(KATA_RESULT_MARKER_REGEX)];
    expect(matches.length).toBe(1);
    const parsed = JSON.parse(matches[0][1]);
    expect(parsed.kataId).toBe('str-2a');
    expect(parsed.predictionsRight).toBe(2);
    expect(parsed.solved).toBe(true);
  });

  it('strips cleanly from display content', () => {
    const stripped = sample.replace(KATA_RESULT_MARKER_REGEX, '').trim();
    expect(stripped).toBe('Great cycle!');
    expect(stripped).not.toContain('KATA_RESULT');
  });

  it('does not match across multiple markers greedily', () => {
    const two = '[KATA_RESULT: {"kataId":"a","pattern":"p","solved":true}] and [KATA_RESULT: {"kataId":"b","pattern":"q","solved":false}]';
    KATA_RESULT_MARKER_REGEX.lastIndex = 0;
    const matches = [...two.matchAll(KATA_RESULT_MARKER_REGEX)];
    expect(matches.length).toBe(2);
    expect(JSON.parse(matches[0][1]).kataId).toBe('a');
    expect(JSON.parse(matches[1][1]).kataId).toBe('b');
  });
});
