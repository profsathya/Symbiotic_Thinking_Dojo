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

// The acceptance checks from the build spec (2026-08-11), as assertions.
describe('What Are My Priorities?', () => {
  const topic = getTopicById('what-are-my-priorities')!;
  const allGuidance = topic.phases.map((p) => p.contentGuidance).join('\n');
  const everything = `${topic.systemInstructions}\n${allGuidance}`;

  it('is registered, enabled, and reachable at ?topic=what-are-my-priorities', () => {
    expect(topic).toBeDefined();
    expect(topic.enabled).toBe(true);
    expect(topic.category).toBe('foundations');
    expect(getTopicBySlug('what-are-my-priorities')?.topicId).toBe('what-are-my-priorities');
  });

  it('runs one path — a student who started before is offered Resume, not a second door', () => {
    expect(topic.pathways).toHaveLength(1);
  });

  it('has the four stages plus the welcome-owned opener, arriving on the mind\'s diet', () => {
    expect(topic.phases).toHaveLength(5);
    expect(topic.phases[3].isArrivalMilestone).toBe(true);
  });

  it('opens with purpose, the honesty condition, and the six-category question', () => {
    const welcome = createPracticeDojoWelcome(topic, 'guided');
    expect(welcome).toContain('understand your own priorities');
    expect(welcome).toContain("this isn't about grading you");
    expect(welcome).toContain('mirror');
    // The honesty condition
    expect(welcome).toContain('look carefully and honestly at our time');
    // The structured question, with all six categories
    expect(welcome).toContain('24-hour period');
    for (const category of [
      'sleeping',
      'nutrition for the body',
      'work',
      'learning',
      'nutrition for the mind',
      'entertainment/fun',
    ]) {
      expect(welcome, category).toContain(category);
    }
    // Hours, not percentages — a student can answer "about 6" off the top of
    // their head; percentages of a day they have never counted, they cannot.
    expect(welcome).toContain('how many hours do you spend on each');
    expect(welcome).toContain('On an average day');
    expect(welcome).not.toMatch(/percentage/i);
    expect(welcome).toContain('rate the quality of each');
    expect(welcome).not.toContain('What drew you to this topic');
  });

  it('asks for hours everywhere, never percentages', () => {
    // Percentages survive only inside prohibitions ("never convert to
    // percentages", "never a percentage in the notes")
    const pctLines = everything.split('\n').filter((line) => /percentage/i.test(line));
    for (const line of pctLines) {
      expect(line, line).toMatch(/never/i);
    }
    expect(topic.phases[1].contentGuidance).toContain('rough hours');
    // The total to notice is a day, not a hundred
    expect(topic.phases[1].contentGuidance).toContain('IF THE HOURS ARE WAY OFF 24');
    expect(topic.systemInstructions).toContain('first_estimate_hours');
  });

  it('gets accuracy from types and sources, with hour-by-hour reconstruction banned', () => {
    expect(topic.systemInstructions).toContain('NO HOUR-BY-HOUR RECONSTRUCTION (HARD BAN)');
    expect(topic.systemInstructions).toContain('TYPES AND SOURCES');
    expect(topic.phases[2].contentGuidance).toContain('TYPES-AND-SOURCES QUESTIONS');
    // Every mention of hour-by-hour anywhere in the topic is a prohibition
    const hourLines = everything.split('\n').filter((line) => /hour[- ]by[- ]hour/i.test(line));
    expect(hourLines.length).toBeGreaterThan(0);
    for (const line of hourLines) {
      expect(line, line).toMatch(/never|ban/i);
    }
  });

  it('never corrects a number and never moralizes about one', () => {
    expect(topic.systemInstructions).toContain('NEVER CORRECT A NUMBER (HARD RULE)');
    expect(topic.systemInstructions).toContain('NEVER MORALIZE ABOUT A NUMBER');
    expect(topic.phases[2].contentGuidance).toContain('THE REVISION — always theirs, never yours');
  });

  it('works classification puzzles with the student instead of ruling on them', () => {
    expect(topic.phases[2].contentGuidance).toContain('CLASSIFICATION PUZZLES ARE THE POINT');
    expect(topic.phases[2].contentGuidance).toContain('do not resolve it for them');
  });

  it('lets the student add a category the six do not hold', () => {
    expect(topic.systemInstructions).toContain('EXTRA CATEGORIES');
    expect(topic.phases[1].contentGuidance).toContain("SOMETHING THAT DOESN'T FIT");
  });

  it('dives deep only on the mind\'s diet, touching physical habits once and leaving them', () => {
    expect(topic.phases[3].title).toContain('Mind');
    expect(topic.phases[3].contentGuidance).toContain('This is the ONLY stage that goes deep');
    expect(topic.systemInstructions).toContain('PHYSICAL HABITS — ONE TOUCH, THEN LEAVE IT');
    expect(topic.phases[3].contentGuidance).toContain('THE ONE PHYSICAL-HABIT TOUCH');
    // If the student opens it themselves: reflection, never a fix
    expect(topic.systemInstructions).toContain('Do NOT try to solve it');
    expect(topic.phases[3].contentGuidance).toContain('No advice, no plan, no fix, no referral');
  });

  it('ends with an invited, declinable try', () => {
    const closing = topic.phases[4].contentGuidance;
    expect(closing).toContain('is there one small thing you want to try in the next few weeks');
    expect(closing).toContain("real enough that you'd notice yourself doing it");
    expect(closing).toContain('IF THEY DECLINE');
    expect(closing).toContain('no second ask');
    expect(closing).toContain('Do not suggest one first');
    // Closes in the throughout frame
    expect(closing).toContain('what happens between now and then is the part that matters');
  });

  it('keeps every turn short, plain, and one question', () => {
    expect(topic.systemInstructions).toContain('ONE MOVE PER TURN (HARD RULE)');
    expect(topic.systemInstructions).toContain('ask ONE question');
  });

  it('reads two qualities only, as prose markers that never surface', () => {
    expect(topic.systemInstructions).toContain('WHAT YOU READ (INTERNAL — NEVER SURFACES)');
    expect(topic.systemInstructions).toContain('SELF-KNOWLEDGE');
    expect(topic.systemInstructions).toContain('SELF-REGULATION');
    expect(topic.systemInstructions).toContain('reads TWO qualities and no others');
    expect(topic.systemInstructions).toContain('not yet in view · taking shape · demonstrated');
    expect(topic.systemInstructions).toContain('UNSURFACED, never low');
    // No scores, ever — from the NEVER list
    expect(topic.systemInstructions).toContain(
      "Name any quality you're tracking, or show a score"
    );
  });

  it('emits one record per conversation, with prose-only evidence notes', () => {
    expect(topic.systemInstructions).toContain('[PRIORITIES_RECORD:');
    expect(topic.systemInstructions).toContain('ONE marker per conversation');
    expect(topic.systemInstructions).toContain('Never a score, a grade, a percentage, or a verdict');
    // The student can open the JSON, so the notes are written for that
    expect(topic.systemInstructions).toContain('as if the student will read them');
    expect(topic.phases[4].contentGuidance).toContain('emit the record marker');
  });

  it('has a truthful answer ready about where what they say goes', () => {
    expect(topic.systemInstructions).toContain('IF THE STUDENT ASKS WHAT HAPPENS TO WHAT THEY SAY');
    expect(topic.systemInstructions).toContain('lives in their browser');
    expect(topic.systemInstructions).toContain('Nothing is sent anywhere on its own');
    expect(topic.systemInstructions).toContain('say plainly that you don\'t know');
  });

  // After the 2026-08-17 TA runs, both of which ended at the Stage 1 card
  // because the student never pressed "Ready to move on?"
  it('moves itself when the Sensei judges a stage done', () => {
    expect(topic.advanceOnSenseiSignal).toBe(true);
    expect(topic.systemInstructions).toContain('HOW STAGES MOVE — SIGNAL AND BRIDGE TOGETHER');
    expect(topic.systemInstructions).toContain('NEVER SIGNAL ON A MESSAGE THAT ENDS WITHOUT A QUESTION');
    // The button survives as the student's escape hatch, not the normal path
    expect(topic.systemInstructions).toContain('escape hatch');
  });

  it('carves the bridge out of the one-move-per-turn rule so it can be sent at all', () => {
    expect(topic.systemInstructions).toContain('THE ONE EXCEPTION is a BRIDGE message');
  });

  it('bridges into the next stage in the same message it signals on', () => {
    for (const phase of topic.phases.slice(1, 4)) {
      expect(phase.contentGuidance, phase.title).toMatch(/BRIDGE into Stage \d/);
    }
    // Each bridge carries the next stage's opening question
    expect(topic.phases[1].contentGuidance).toContain("what's actually in those hours?");
    expect(topic.phases[2].contentGuidance).toContain("Name them like you'd name meals");
    expect(topic.phases[3].contentGuidance).toContain('is there one small thing you want to try');
  });

  it('does not re-open a stage it already bridged into', () => {
    for (const phase of topic.phases.slice(2, 5)) {
      expect(phase.contentGuidance, phase.title).toMatch(/HOW YOU ARRIVED HERE|ASKED IT ALREADY/);
    }
    expect(topic.phases[4].contentGuidance).toContain('do NOT ask again');
  });

  // Stage 1 played as an intake form in both test runs: three consecutive
  // "one number I still need" turns in one, four quality questions in the other
  it('treats stage 1 as an on-ramp, not a form to fill', () => {
    const stageOne = topic.phases[1].contentGuidance;
    expect(stageOne).toContain('AT MOST TWO follow-up questions');
    expect(stageOne).toContain('ENOUGH IS ENOUGH');
    expect(stageOne).toContain('Do NOT chase every blank');
    expect(stageOne).toContain('Do NOT ask for quality category by category');
    // The "reconstruct a normal weekday" fallback produced exactly the
    // hour-by-hour narrative the design bans, so it asks for a bracket instead
    expect(stageOne).toContain('do NOT ask them to reconstruct a day');
    expect(stageOne).toContain('Closer to 2 hours or 6?');
  });

  it('takes the mind-diet reflection when a student offers it early', () => {
    expect(topic.phases[1].contentGuidance).toContain('IF THE STUDENT HANDS YOU STAGE 3 EARLY');
    expect(topic.phases[1].contentGuidance).toContain('Never file it away');
    expect(topic.phases[3].contentGuidance).toContain('never make them repeat themselves');
  });

  // ---- Change request from live testing (2026-08-18) ----

  it('never hands the student a tidier version of their own answer', () => {
    expect(topic.systemInstructions).toContain('THEIR WORDS, NOT YOURS');
    expect(topic.systemInstructions).toContain('HEDGES INCLUDED');
    expect(topic.systemInstructions).toContain('must be a phrase the student actually typed');
    // The cleaner formulation is asked, never asserted
    expect(topic.systemInstructions).toContain('would you call that mostly entertainment?');
  });

  // TA feedback (2026-08-21): the Sensei moved to the next question without
  // visibly doing anything with the numbers the student had just entered
  it('asks questions that could only be asked of this student', () => {
    expect(topic.systemInstructions).toContain('SHOW THAT YOU READ IT');
    expect(topic.systemInstructions).toContain(
      'Never open a turn with a transition that would fit any conversation'
    );
    // Anchored in their own numbers, not asked in the abstract
    expect(topic.phases[1].contentGuidance).toContain('anchor it in their own numbers');
    expect(topic.phases[2].contentGuidance).toContain('names the thing it is about');
    // And it must not become praise or paraphrase, which are banned separately
    expect(topic.systemInstructions).toContain('This is NOT praise and NOT a summary');
  });

  it('bans praise and bans telling the student what to notice', () => {
    expect(topic.systemInstructions).toContain('NEVER EVALUATE AN ANSWER');
    for (const banned of ['Nice catch.', 'Good, that one holds.', "That's a real answer."]) {
      expect(topic.systemInstructions, banned).toContain(banned);
    }
    expect(topic.systemInstructions).toContain('NEVER TELL THE STUDENT WHAT IS WORTH NOTICING');
  });

  it('makes stage 1 end on something that could be wrong', () => {
    const stageOne = topic.phases[1].contentGuidance;
    // Wide ranges get one narrowing ask
    expect(stageOne).toContain('WIDE RANGES');
    expect(stageOne).toContain('closer to 1 or closer to 8?');
    expect(stageOne).toContain('Never ask twice hoping for a different answer');
    // Uniform quality reads get one ask
    expect(stageOne).toContain('UNIFORM QUALITY READS');
    expect(stageOne).toContain('which one is least true?');
    // Blanks get one ask before the bridge
    expect(stageOne).toContain('MOSTLY BLANK PICTURES');
    expect(stageOne).toContain('even roughly?');
  });

  it('never invents a category and keeps the mirror footer fixed', () => {
    expect(topic.systemInstructions).toContain('ROWS COME FROM THE SIX, OR FROM THE STUDENT');
    expect(topic.systemInstructions).toContain('NEVER invent one');
    expect(topic.systemInstructions).toContain('First-guess hours. Nothing here is fixed.');
    expect(topic.systemInstructions).toContain('NO COMMENTARY AROUND IT EITHER');
  });

  it('keeps stage 2 from collapsing into the mind-diet stage', () => {
    const stageTwo = topic.phases[2].contentGuidance;
    expect(stageTwo).toContain('STAY IN THIS PHASE UNTIL ALL FOUR ARE TRUE');
    expect(stageTwo).toContain('hard exit condition');
    expect(stageTwo).toContain('THIS STAGE IS NOT THE MIND-DIET STAGE');
    // The revised list belongs to stage 2, before the bridge
    expect(stageTwo).toContain('Do not show the first-guess-vs-revised card after you have bridged');
    // And stage 1 must not aim its bridge at mind food
    expect(topic.phases[1].contentGuidance).toContain('Do NOT announce nutrition for the mind here');
  });

  it('scaffolds the student who cannot put it into words', () => {
    expect(topic.systemInstructions).toContain("WHEN A STUDENT CAN'T PUT IT INTO WORDS");
    expect(topic.systemInstructions).toContain('closer to 2 hours or 6?');
    expect(topic.systemInstructions).toContain('ASK FOR RECALL, NOT CHARACTERISATION');
    expect(topic.systemInstructions).toContain('ABSORB APOLOGIES IN ONE CLAUSE');
    expect(topic.systemInstructions).toContain('DO NOT RESCUE A THIN PICTURE');
  });

  it('keeps every question answerable from the day they described', () => {
    expect(topic.systemInstructions).toContain('STANDING CONSTRAINT');
    expect(topic.systemInstructions).toContain('recall a past episode and narrate what it meant');
    // The removed episode stage must not creep back in: the phrase survives
    // only inside the rule that bans it
    const episodeLines = everything
      .split('\n')
      .filter((line) => /something you did on your own/i.test(line));
    for (const line of episodeLines) {
      expect(line, line).toMatch(/OUT OF BOUNDS/);
    }
  });

  it('tells the truth about being graded, and says how to submit', () => {
    expect(topic.systemInstructions).toContain('It is a graded activity');
    // The evasive line appears once, in the sentence forbidding it
    const gradeLines = (topic.systemInstructions ?? '')
      .split('\n')
      .filter((line) => line.includes("I honestly don't know how this connects to your grade"));
    expect(gradeLines).toHaveLength(1);
    expect(gradeLines[0]).toContain('Never say');
    expect(topic.phases[4].contentGuidance).toContain(
      'When you\'re ready to submit, click Save Session and copy to clipboard.'
    );
  });

  it('runs without an engagement score', () => {
    expect(topic.suppressThinkingMetrics).toBe(true);
  });

  it('signals readiness in every stage but the last', () => {
    for (const phase of topic.phases.slice(1, 4)) {
      expect(phase.contentGuidance, phase.title).toContain('[NEXT_PHASE]');
      expect(phase.contentGuidance, phase.title).toContain('STAY IN THIS PHASE UNTIL');
    }
    expect(topic.phases[4].contentGuidance).toContain('never emit `[NEXT_PHASE]`');
  });

  it('does not borrow framework names from other Dojo topics', () => {
    // Named once, in the prohibition that bans them
    expect(topic.systemInstructions).toContain('Use framework names from other Dojo topics');
    expect(allGuidance).not.toMatch(/Ikigai|UMPIRE|DIKW/);
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
