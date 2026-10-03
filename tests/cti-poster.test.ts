import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  ACTIVITY_ROUTES,
  getTopicById,
  getTopicBySlug,
  WHAT_IS_CTI_DOING_TOPIC,
  CTI_POSTER_TOPIC,
} from '@/lib/practice-dojo/topics';
import * as poster from '@/lib/practice-dojo/topics/cti-poster';
import {
  CTI_POSTER_THEMES,
  CTI_POSTER_TEXT,
  CTI_POSTER_RULES,
  CTI_POSTER_WHERE_CTI_STANDS,
  CTI_POSTER_EXAMPLE_CONVERSATION,
  CTI_POSTER_BACK_CARD,
  ctiPosterThemeLine,
} from '@/lib/practice-dojo/topics/cti-poster';
import * as material from '@/lib/practice-dojo/topics/cti-material';
import { createPracticeDojoWelcome, composeSystemPrompt } from '@/lib/prompts/composer';
import { isBackToThemesCard, visiblePosterMessages } from '@/lib/cti-poster-session';

const posterPhase = CTI_POSTER_TOPIC.phases[1].contentGuidance;
const posterSystem = CTI_POSTER_TOPIC.systemInstructions ?? '';
const posterPrompt = posterPhase + posterSystem;
const councilPhase = WHAT_IS_CTI_DOING_TOPIC.phases[1].contentGuidance;
const pageSource = readFileSync(join(__dirname, '../src/app/cti/page.tsx'), 'utf8');

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

// Phase guidance plus system instructions. The first build (PR #117) was 7,044 words.
const BUDGET = 5500;

describe('CTI poster dojo', () => {
  it('is registered, enabled, and served on its own route', () => {
    expect(getTopicById('cti-poster')).toBe(CTI_POSTER_TOPIC);
    expect(getTopicBySlug('cti-poster')).toBe(CTI_POSTER_TOPIC);
    expect(CTI_POSTER_TOPIC.enabled).toBe(true);
    expect(CTI_POSTER_TOPIC.title).toBe("Talk to Sensei about CTI's Human Value Framework");
    expect(ACTIVITY_ROUTES['cti-poster']).toBe('/cti');
  });

  it('follows the Council dojo engine conventions', () => {
    expect(CTI_POSTER_TOPIC.phases.length).toBe(2);
    expect(CTI_POSTER_TOPIC.suppressThinkingMetrics).toBe(true);
    expect(CTI_POSTER_TOPIC.suppressPhaseGate).toBe(true);
    expect(posterPhase).toContain('NEVER emit [NEXT_PHASE]');
    expect(posterSystem).toContain('NEVER emit [NEXT_PHASE]');
  });

  it('has the five themes, in order, with the boxes each covers', () => {
    expect(CTI_POSTER_THEMES.map((t) => `${t.title} — ${ctiPosterThemeLine(t)}`)).toEqual([
      'Philosophy — The hypothesis, and what has to change in post-secondary learning (boxes 2 and 4)',
      "Approach — The challenge, and CTI's three-part answer (boxes 1 and 3)",
      'Framework — The Human Value Framework and Symbiotic Thinking (box 5)',
      'Experiments — Where it is being tested, and the continuing work (boxes 6 and 9)',
      'Results — Early signals and early data (boxes 7 and 8)',
    ]);
    // Every poster box belongs to exactly one theme.
    expect(CTI_POSTER_THEMES.flatMap((t) => t.boxes).sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('gives the sensei every theme a card can send', () => {
    for (const theme of CTI_POSTER_THEMES) {
      expect(posterPhase, theme.title).toContain(`\n${theme.title} — ${ctiPosterThemeLine(theme)}`);
      expect(posterPhase, theme.title).toContain(`"title":"${theme.title}"`);
    }
    expect(posterPhase).toContain('it arrives as "I choose: Approach"');
  });

  it('opens on five theme cards: no box tiles, no Symbiotic Thinking tile', () => {
    expect('CTI_POSTER_BOXES' in poster).toBe(false);
    expect('ctiPosterBoxCards' in poster).toBe(false);
    expect(pageSource).toContain('CTI_POSTER_THEMES.map(');
    expect(pageSource).toContain('Pick a theme.');
    expect(pageSource).toContain('`I choose: ${theme.title}`');
    expect(pageSource).toMatch(/>\s*Themes\s*<\/button>/);
    expect(pageSource).toContain('>Human Value Framework</h1>');
    expect(pageSource).not.toContain('INSPIRE 2026 poster</h1>');
    expect(pageSource).toContain('CTI keeps no copy of this conversation.');
    for (const gone of ['CTI_POSTER_BOXES', 'BANDS', 'WIDE_TILE', 'grid-cols-3', 'Tap the box', 'Band 1']) {
      expect(pageSource, gone).not.toContain(gone);
    }
    expect(pageSource).not.toMatch(/>\s*Poster\s*<\/button>/);
  });

  it('runs a theme as an open conversation, not as steps', () => {
    expect(posterPhase).toContain('HOW A THEME RUNS');
    const how = posterPhase.slice(posterPhase.indexOf('\nHOW A THEME RUNS\n'), posterPhase.indexOf('\nTHE RULES\n'));
    expect(how).toContain(
      `Your whole first reply is one question, in these words, with X filled in: "What reactions, thoughts or questions do you have about CTI's X?"`
    );
    expect(how).toContain(
      'Philosophy — philosophy\nApproach — approach\nFramework — Human Value Framework\nExperiments — experiments\nResults — results'
    );
    expect(how).toContain('do not mention boxes, and no cards');
    expect(how).toContain(
      'The opening question is the one exception to rules 1 and 10: no granting sentence before it, and it is one sentence.'
    );
    expect(posterPrompt).not.toContain('What question or reaction do you have about it?');
    expect(posterPrompt).not.toContain('placing the theme');
    expect(posterPhase).toContain('There is no fixed sequence and no destination.');
    for (const gone of ['HOW A BOX RUNS', 'THE TEN BOXES', 'Step 1', 'Step 4', 'what did you take from that box']) {
      expect(posterPrompt, gone).not.toContain(gone);
    }
    for (const gone of ['THE DESIGN-CHOICE QUESTION', 'DESIGN CHOICES', 'Start with the substance']) {
      expect(posterPrompt, gone).not.toContain(gone);
    }
  });

  it('drops every per-box line', () => {
    for (const marker of ['PLACING', 'READING:', 'DESIGN CHOICE', 'POINTS TO', 'NOT SOLVED', 'NEIGHBORS']) {
      expect(posterPrompt, marker).not.toContain(marker);
    }
  });

  it('carries the ten rules in the wording given', () => {
    expect(posterPhase).toContain(CTI_POSTER_RULES);
    expect(CTI_POSTER_RULES.split('\n\n').map((r) => r.slice(0, r.indexOf('. ')))).toEqual(
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    );
    for (const wording of [
      `1. Grant first. When the visitor has made a claim or pushed back, open by accepting it as legitimate, in one sentence, without defensiveness and without praise: "That is true…", "I understand…", "That is a fair observation." Never praise the visitor or grade their answer: no "Great question", "Good", "Sharp", and no "Exactly" standing alone as a verdict. ("That is exactly the challenge" names the problem, not the visitor, and is fine.) When the visitor has asked a question, there is nothing to grant; go straight to your question.`,
      `2. Ask for what only the visitor has before offering anything of CTI's. When the visitor asks how CTI did something — framed the problem, chose the qualities, built the framework — ask for their own version of that same thing first: one they have found good, or, if they have none, the qualities they would look for in a good one. Do not redirect to the underlying topic ("why are expectations shifting?") and do not ask about their work, field or institution. One line of inquiry per turn. A second question in the same reply is allowed only when it extends the first or offers a fallback to it ("even if you don't have one, what qualities would you look for?"); it must never open a second line of inquiry.`,
      "6. CTI's position enters only when the conversation arrives near it on its own, or when the visitor asks for it directly, or asks the same thing twice.",
      '8. At the edge of what you know, hand off; never improvise.',
      '9. Disagreement is a fine place to end.',
      '10. Register and length. Two to four sentences per turn.',
    ]) {
      expect(CTI_POSTER_RULES).toContain(wording);
    }
  });

  it('carries the poster text with the new Point B in green', () => {
    expect(posterPhase).toContain(CTI_POSTER_TEXT);
    expect(CTI_POSTER_TEXT).toContain('with a second B further out in green.');
    expect(CTI_POSTER_TEXT).toContain(
      '- B (new, green): Now: Start with a goal, learn, adapt and iterate to reach the goal.'
    );
    expect(posterPrompt.toLowerCase()).not.toContain('orange');
  });

  it('carries the poster as printed, with none of the draft wording', () => {
    for (const printed of [
      'Lede: Human value can grow with AI capability if students learn to think with AI and to decide where to use it and where not to.',
      '- Rising curve: Humans thinking symbiotically with AI',
      'Navigating the Jagged Technological Frontier',
      'Title: Our Approach',
      'Item 1: A precise, actionable definition of the problem',
      'Item 2: A well-defined, teachable framework of capabilities',
      'Item 3: A rigorous, adaptive experimental process',
      'We need: Shorter learning experiences that we can test and improve quickly',
      '- Integrative Solver (IS): Connect humans, domains, and perspectives to frame the real problem.',
      '- Applying AI at Work Certificate with De Anza Community College:',
      'Text: We look for evidence of these six qualities in the work students submit to meet the course learning outcomes.',
      '- Owning the outcome 40%',
      "- Working with uncertainty: Current data doesn't measure this",
      'While the early data represented is based on real student work, it is not verified.',
      'A rigorous human-value-in-the-loop process is being developed to build and track such change.',
      'Learning from other disciplines. We are working closely with faculty from Kinesiology.',
      'Learning through collaboration.',
      'Scan to experience Symbiotic Thinking',
    ]) {
      expect(CTI_POSTER_TEXT, printed).toContain(printed);
    }
    for (const draft of [
      'will grow',
      'use it strategically',
      'Our unique approach',
      'theory of change',
      'Problem Framing with AI',
      'Owning the outcome 43%',
      'Working with uncertainty 70%',
      'control group',
      'baseline',
      'Building in public',
      'builds in public',
      'cheap to correct',
      'process is needed',
    ]) {
      expect(posterPrompt, draft).not.toContain(draft);
    }
  });

  it('WHERE CTI STANDS agrees with the printed poster', () => {
    const stands = CTI_POSTER_WHERE_CTI_STANDS;
    expect(stands).toContain(
      'human value can grow with AI capability only if students learn to think with AI and to decide where to use it and where not to'
    );
    expect(stands).toContain(
      'a precise, actionable definition of the problem, a well-defined, teachable framework of capabilities, and a rigorous, adaptive experimental process'
    );
    expect(stands).toContain('the Applying AI at Work Certificate with De Anza');
    expect(stands).toContain(
      'Self-knowledge 88%, Self-regulation 57%, Owning the outcome 40%, Initiative 43% and Adaptability 42%; current data does not measure Working with uncertainty'
    );
    expect(stands).toContain('"is not verified"');
  });

  it('carries the four sources in order', () => {
    const at = (text: string) => posterPhase.indexOf(text);
    const order = [
      at('SOURCE 1 — THE POSTER, VERBATIM'),
      at(CTI_POSTER_TEXT),
      at('SOURCE 2 — BACKGROUND MATERIAL FROM CTI'),
      at(material.CTI_MATERIAL_SYMBIOTIC_DEFINITION),
      at('SOURCE 3 — WHERE CTI STANDS'),
      at(CTI_POSTER_WHERE_CTI_STANDS),
      at('SOURCE 4 — EXAMPLE CONVERSATION'),
      at(CTI_POSTER_EXAMPLE_CONVERSATION),
    ];
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
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

  it('carries WHERE CTI STANDS, one block per theme', () => {
    const blocks = CTI_POSTER_WHERE_CTI_STANDS.split('\n\n');
    expect(blocks.length).toBe(5);
    // The blocks keep the spec's order; each theme has exactly one.
    for (const theme of CTI_POSTER_THEMES) {
      const mine = blocks.filter((block) => block.startsWith(`${theme.title}. `));
      expect(mine.length, theme.title).toBe(1);
      expect(mine[0], theme.title).toContain('Honesty line:');
    }
    expect(blocks[0]).toContain(
      'Honesty line: CTI is not sure these designs are working, but they seem to move things in the right direction.'
    );
    expect(blocks[4]).toContain('Give the numbers only as box 8 gives them.');
    expect(posterPhase).toContain('Draw on a block only when the conversation arrives there (rule 6).');
  });

  it('carries the example conversation under the heading given', () => {
    expect(posterPhase).toContain(
      "EXAMPLE — a conversation at the poster, in the register the Sensei matches. Not a script; the visitor's words will differ."
    );
    const turns = CTI_POSTER_EXAMPLE_CONVERSATION.split('\n\n');
    expect(turns.map((t) => t.slice(0, t.indexOf(':')))).toEqual([
      'Dean', 'Sensei', 'Dean', 'Sensei', 'Dean', 'Sensei', 'Dean', 'Sensei',
    ]);
    expect(turns[0]).toContain("What's the part I couldn't get from the other forty posters?");
    expect(turns[1]).toBe(
      'Sensei: That is true, there are a lot of very similar-sounding words and statements in this topic. Would you mind sharing the best description of the challenge that you found precise, in all the posters?'
    );
    expect(turns[7]).toBe(
      'Sensei: That is a fair observation. I would encourage looking at the course and reaching out to Sathya. One thing I know is that we are scrupulous in how we approach each of these ideas and are very interested in learning from your questions and experience.'
    );
    expect(CTI_POSTER_EXAMPLE_CONVERSATION).not.toContain('**');
  });

  it('carries the single exchange with the reply to avoid and the reply to give', () => {
    expect(posterPhase).toContain(
      `${CTI_POSTER_EXAMPLE_CONVERSATION}\n\nEXAMPLE — a single exchange, with the reply to avoid and the reply to give\n\n${poster.CTI_POSTER_EXAMPLE_EXCHANGE}`
    );
    expect(poster.CTI_POSTER_EXAMPLE_EXCHANGE.split('\n\n').map((l) => l.slice(0, l.indexOf(':')))).toEqual([
      'Visitor (on Approach)', 'Avoid', 'Give', 'Why',
    ]);
    expect(poster.CTI_POSTER_EXAMPLE_EXCHANGE).toContain(
      'Give: Do you have a framing of the problem that you felt was good? Even if you don\'t have a specific one, what are some good qualities of the framing that you would look for?'
    );
    expect(CTI_POSTER_RULES).not.toContain('Their best example, their experience, their reason.');
  });

  it('closes with the other themes as cards, and shows cards nowhere else', () => {
    const closing = posterPhase.slice(posterPhase.indexOf('\nCLOSING\n'), posterPhase.indexOf('\nOFF-SCOPE QUESTIONS\n'));
    expect(closing).toContain('one sentence reflecting their main point');
    expect(closing).toContain('"If you want CTI to hear it, write to Sathya, or tell the CTI team at the poster."');
    expect(closing).toContain('the other four themes, and "Back to the themes" last');
    expect(closing).toContain('Cards appear only here, and when the visitor asks for the themes.');
    expect(closing).toContain(`"id":"${CTI_POSTER_BACK_CARD.id}"`);
    expect(closing).toContain(`"title":"${CTI_POSTER_BACK_CARD.title}"`);
    expect(posterSystem).toContain('Every other reply is plain text with no cards');
    // The first reply and the off-scope redirect carry no cards.
    expect(posterPhase.split('```dojo-visual').length - 1).toBe(2);
  });

  it('shows a closing-card example with four themes, not the one the visitor is on', () => {
    const closing = posterPhase.slice(posterPhase.indexOf('\nCLOSING\n'), posterPhase.indexOf('\nOFF-SCOPE QUESTIONS\n'));
    const example = closing.slice(closing.indexOf('{'), closing.indexOf('}]}') + 3);
    const cards = JSON.parse(example) as { options: { id: string; title: string }[] };
    expect(closing).toContain('This example is for a visitor who was on Philosophy');
    expect(cards.options.map((o) => o.title)).toEqual([
      'Approach', 'Framework', 'Experiments', 'Results', 'Back to the themes',
    ]);
  });

  it('is never told to add a visual after a run of plain-text replies', () => {
    const compose = (topic: typeof CTI_POSTER_TOPIC, n: number) =>
      composeSystemPrompt({ dojoPrompt: 'D', senseiPrompt: 'S', ikigaiPrompt: 'I', constructs: [], partners: [] }, 'learn', [], {
        consecutiveTextOnlyResponses: n,
        practiceDojoContext: {
          topic,
          currentPhase: topic.phases[1],
          pathway: 'guided',
          completedPhases: [0],
          userChoices: {},
          checkpointStatuses: {},
          phaseSelfChecks: [],
          kataResults: [],
          interactionCount: n,
        },
      });
    for (const n of [3, 5, 9]) {
      const prompt = compose(CTI_POSTER_TOPIC, n);
      expect(prompt, String(n)).not.toContain('LEARNING DESIGN REMINDER');
      expect(prompt, String(n)).not.toContain('ENGAGEMENT NEEDED');
    }
    // Other topics keep the reminder.
    expect(compose(WHAT_IS_CTI_DOING_TOPIC, 3)).toContain('LEARNING DESIGN REMINDER');
    expect(compose(WHAT_IS_CTI_DOING_TOPIC, 5)).toContain('ENGAGEMENT NEEDED');
  });

  it('keeps staff email addresses out of the prompt', () => {
    expect(posterPrompt).not.toMatch(/[\w.]+@[\w.]+\.\w+/);
  });

  it('stays within the context budget', () => {
    expect(words(posterPhase) + words(posterSystem)).toBeLessThan(BUDGET);
  });

  it('sends off-scope and comparison questions to the CTI team at the poster', () => {
    expect(posterPhase).toContain('better discussed with the CTI team — they are at the poster, or write to Sathya');
    expect(posterPhase).toContain('Do not draw the comparison yourself');
    expect(posterSystem).toContain('write to Sathya, or tell the CTI team at the poster');
  });

  it('names the poster, not the framework page, when it reads between the lines', () => {
    expect(posterSystem).toContain(
      `${material.CTI_RULE_SCOPE} "the poster doesn't say this directly; my reading is..."`
    );
    expect(posterPrompt).not.toContain("the framework page doesn't say this directly");
    expect(WHAT_IS_CTI_DOING_TOPIC.systemInstructions).toContain(
      `${material.CTI_RULE_SCOPE} "the framework page doesn't say this directly; my reading is..."`
    );
  });

  it('welcome offers the five themes as cards', () => {
    const welcome = createPracticeDojoWelcome(CTI_POSTER_TOPIC, 'guided');
    expect(welcome).toContain('Pick a theme.');
    const json = welcome.slice(welcome.indexOf('{'), welcome.lastIndexOf('}') + 1);
    const cards = JSON.parse(json) as { options: { id: string; title: string; description: string }[] };
    expect(cards.options.map((o) => o.title)).toEqual(CTI_POSTER_THEMES.map((t) => t.title));
    expect(cards.options.map((o) => o.description)).toEqual(CTI_POSTER_THEMES.map(ctiPosterThemeLine));
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
  // Kept by both dojos.
  const rules = [
    material.CTI_RULE_SCOPE,
    material.CTI_RULE_HYPOTHESIS,
    material.CTI_RULE_STORAGE,
    material.CTI_RULE_NO_FORWARDING,
    material.CTI_RULE_NO_NOTING,
    material.CTI_RULE_NEVER_NEXT_PHASE,
  ];
  // The Council's voice rules. The poster dojo's own ten rules replace them:
  // "grant first" opens with wording these would rule out.
  const councilVoice = [
    material.CTI_RULE_PLAIN_VOICE,
    material.CTI_RULE_NO_COMPARISONS,
    material.CTI_RULE_NO_PRAISE,
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

  it('the Council voice rules stay with the Council dojo', () => {
    for (const rule of councilVoice) {
      expect(WHAT_IS_CTI_DOING_TOPIC.systemInstructions).toContain(rule);
      expect(CTI_POSTER_TOPIC.systemInstructions).not.toContain(rule);
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
    expect(councilPhase).not.toContain('HOW A THEME RUNS');
    expect(createPracticeDojoWelcome(WHAT_IS_CTI_DOING_TOPIC, 'guided')).toContain(
      'This is a place to explore what CTI is doing'
    );
  });
});

describe('/cti page helpers', () => {
  it('recognizes the Back to the themes card by id or by title', () => {
    expect(isBackToThemesCard({ optionId: CTI_POSTER_BACK_CARD.id, optionTitle: 'anything' })).toBe(true);
    expect(isBackToThemesCard({ optionId: 'back', optionTitle: ' Back to the themes ' })).toBe(true);
    expect(isBackToThemesCard({ optionId: 'philosophy', optionTitle: 'Philosophy' })).toBe(false);
  });

  it('hides the welcome message and nothing else', () => {
    const welcome = { role: 'assistant', id: 'w' };
    const pick = { role: 'user', id: 'u' };
    expect(visiblePosterMessages([welcome, pick])).toEqual([pick]);
    expect(visiblePosterMessages([pick])).toEqual([pick]);
    expect(visiblePosterMessages([])).toEqual([]);
  });
});
