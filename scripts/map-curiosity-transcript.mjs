#!/usr/bin/env node
/**
 * Map Your Curiosity — live acceptance transcript.
 *
 * Drives the REAL composed system prompt against the REAL Anthropic API with
 * a scripted student, and prints the transcript plus a pass/fail summary for
 * the checks that need an actual model in the loop:
 *
 *   1. All five stages, with the exact opening / transition / closing lines
 *   2. The nothing-comes path reaches Stage 4 without pressure or the
 *      forbidden promise
 *   3. "What are you measuring?" gets the approved truthful answer
 *   4. The record is emitted, matches the schema, and is stripped from
 *      everything the student would see
 *
 * The remaining checks (no old-flow code left, other topics untouched) are
 * covered by `npm run test` and need no key.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/map-curiosity-transcript.mjs
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/map-curiosity-transcript.mjs --run happy
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/map-curiosity-transcript.mjs --run nothing
 *
 * Costs a few cents per run. Each scripted turn advances the stage the way a
 * student would — the harness clicks "Ready to move on?" on the model's
 * behalf when it signals readiness, exactly as the app's gate does.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const MODEL = process.env.HARNESS_MODEL ?? 'claude-sonnet-4-6';
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error(
    'ANTHROPIC_API_KEY is not set.\n\n' +
      '  ANTHROPIC_API_KEY=sk-ant-... node scripts/map-curiosity-transcript.mjs\n'
  );
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Pull the verbatim lines straight out of the shipped source, so this harness
// can never drift from what the app actually says.
// ---------------------------------------------------------------------------

const stagesSrc = readFileSync(
  join(ROOT, 'src/lib/practice-dojo/topics/map-curiosity-stages.ts'),
  'utf8'
);

function constantFromSource(name) {
  // Matches:  export const NAME = "..." ;   /  = '...' ;  across line breaks
  const re = new RegExp(
    `export const ${name}[^=]*=\\s*(?:\\n\\s*)?(['"\`])([\\s\\S]*?)\\1;`,
    'm'
  );
  const match = stagesSrc.match(re);
  if (!match) throw new Error(`Could not read ${name} from map-curiosity-stages.ts`);
  return match[2].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, '\n');
}

const OPENING_FRAME = constantFromSource('OPENING_FRAME');
const OPENING_QUESTION = constantFromSource('OPENING_QUESTION');
const SECOND_EPISODE_TRANSITION = constantFromSource('SECOND_EPISODE_TRANSITION');
const THREAD_QUESTION = constantFromSource('THREAD_QUESTION');
const NOW_QUESTION = constantFromSource('NOW_QUESTION');
const STRUGGLE_QUESTION = constantFromSource('STRUGGLE_QUESTION');
const TRY_QUESTION = constantFromSource('TRY_QUESTION');
const CLOSING_LINE = constantFromSource('CLOSING_LINE');
const ASSESSMENT_ANSWER = constantFromSource('ASSESSMENT_ANSWER');

// ---------------------------------------------------------------------------
// Build the same system prompt the app builds, by compiling the TS modules.
// ---------------------------------------------------------------------------

async function loadAppModules() {
  const { register } = await import('node:module');
  try {
    register('tsx/esm', import.meta.url);
  } catch {
    console.error(
      'This harness compiles the app\'s TypeScript on the fly and needs `tsx`:\n\n' +
        '  npm install --no-save tsx\n'
    );
    process.exit(2);
  }
  const topics = await import('../src/lib/practice-dojo/topics/index.ts');
  const composer = await import('../src/lib/prompts/composer.ts');
  const record = await import('../src/lib/practice-dojo/curiosity-record.ts');
  const defaults = await import('../src/lib/prompts/defaults/index.ts');
  return { topics, composer, record, defaults };
}

// ---------------------------------------------------------------------------
// Scripted students
// ---------------------------------------------------------------------------

const SCRIPTS = {
  // Walks all five stages, and asks the measurement question mid-session.
  happy: [
    "I built a treehouse when I was about ten. Nobody asked me to, I just started.",
    "I dragged pallets back from the alley behind our street. Took me most of a week.",
    "The roof caved in the first time. I rebuilt it smaller so it would hold.",
    "Wait — what are you measuring here?",
    "I taught myself to solder last summer. Watched a video, bought a cheap iron.",
    "I burned through a lot of bad joints first. Started practising on scrap.",
    "Nobody stopped me. I just did it in the garage after work.",
    "I guess I like starting the thing before I really know how to do it.",
    "Probably the hardware side. I'd mess with the boards even if it wasn't graded.",
    "Keeping up with the reading, honestly. I fall behind and then avoid it.",
    "Maybe read ahead when something actually grabs me.",
    "Yeah — follow it for half an hour before the assignment asks me to.",
  ],
  // The nothing-comes path: refuses twice, then continues normally.
  nothing: [
    "I can't really think of anything.",
    "No, still nothing. I don't think I've done anything like that.",
    "I guess the hardware stuff sounds interesting.",
    "Time management. I always leave things too late.",
    "Maybe start assignments the day they're posted.",
    "Yeah, just open the file the first day. That I'd notice.",
  ],
};

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const argRun = process.argv.includes('--run')
  ? process.argv[process.argv.indexOf('--run') + 1]
  : null;
const RUNS = argRun ? [argRun] : ['happy', 'nothing'];

const client = new Anthropic({ apiKey: API_KEY });

function bold(s) {
  return `\x1b[1m${s}\x1b[0m`;
}
function dim(s) {
  return `\x1b[2m${s}\x1b[0m`;
}

async function runScript(name, app) {
  const { topics, composer, record: recordLib } = app;
  const topic = topics.getTopicById('map-curiosity');
  const script = SCRIPTS[name];

  const config = {
    dojoPrompt: app.defaults.DEFAULT_DOJO_PROMPT,
    senseiPrompt: app.defaults.DEFAULT_SENSEI_PROMPT,
    ikigaiPrompt: '',
    constructs: app.defaults.DEFAULT_CONSTRUCTS,
    partners: app.defaults.DEFAULT_PARTNERS,
  };

  // Mirror the app: the welcome delivers Stage 1's frame + question verbatim,
  // and the engine starts at phase 1.
  const welcome = composer.createPracticeDojoWelcome(topic, 'guided');
  let currentPhase = 1;
  const completedPhases = [0];

  const shown = [];
  const messages = [{ role: 'assistant', content: welcome }];

  console.log('\n' + bold(`━━━ ${name.toUpperCase()} RUN ━━━`));
  console.log(bold('\nSENSEI (welcome):'));
  console.log(welcome);
  shown.push(welcome);

  const records = [];

  for (const studentTurn of script) {
    console.log(bold('\nSTUDENT:'));
    console.log(studentTurn);
    messages.push({ role: 'user', content: studentTurn });

    const systemPrompt = composer.composeSystemPrompt(config, 'learn', [], {
      practiceDojoContext: {
        topic,
        currentPhase: topic.phases[currentPhase],
        pathway: 'guided',
        completedPhases: [...completedPhases],
        userChoices: {},
        checkpointStatuses: {},
        phaseSelfChecks: [],
        kataResults: [],
        interactionCount: shown.length,
      },
    });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const raw = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    messages.push({ role: 'assistant', content: raw });

    // What the student would actually see, after the app strips markers.
    const display = recordLib
      .stripCuriosityRecordMarkers(raw)
      .replace(/\[NEXT_PHASE\]/g, '')
      .trim();

    for (const r of recordLib.parseCuriosityRecords(raw, 'map-curiosity')) {
      records.push(r);
    }

    console.log(bold(`\nSENSEI ${dim(`[stage ${currentPhase}]`)}:`));
    console.log(display);
    shown.push(display);

    // The student's gate: advance when the Sensei signals readiness.
    if (raw.includes('[NEXT_PHASE]') && currentPhase < topic.phases.length - 1) {
      completedPhases.push(currentPhase);
      currentPhase += 1;
      console.log(dim(`  ↳ student advances to stage ${currentPhase}`));
    }
  }

  return { shown, records, finalPhase: currentPhase, raw: messages };
}

function check(label, ok, detail) {
  const mark = ok ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`  ${mark}  ${label}${detail && !ok ? dim(`\n         ${detail}`) : ''}`);
  return ok;
}

function evaluate(name, result) {
  const all = result.shown.join('\n');
  const studentVisible = all;
  console.log(bold(`\n━━━ ${name.toUpperCase()} CHECKS ━━━`));

  const results = [];

  if (name === 'happy') {
    results.push(check('Opening frame said verbatim', all.includes(OPENING_FRAME)));
    results.push(check('Opening question said verbatim', all.includes(OPENING_QUESTION)));
    results.push(
      check('Stage 2 transition said verbatim', all.includes(SECOND_EPISODE_TRANSITION))
    );
    results.push(check('Thread question said verbatim', all.includes(THREAD_QUESTION)));
    results.push(check('Now question said verbatim', all.includes(NOW_QUESTION)));
    results.push(check('Struggle question said verbatim', all.includes(STRUGGLE_QUESTION)));
    results.push(check('Try question said verbatim', all.includes(TRY_QUESTION)));
    results.push(check('Closing line said verbatim', all.includes(CLOSING_LINE)));
    results.push(check('Reached stage 5', result.finalPhase === 5));
    results.push(
      check(
        'Answered "what are you measuring?" with the approved text',
        all.includes(ASSESSMENT_ANSWER),
        'expected: ' + ASSESSMENT_ANSWER
      )
    );
    results.push(check('Record emitted', result.records.length >= 1));
    if (result.records.length) {
      const r = result.records[0];
      results.push(check('Record has run number', typeof r.run === 'number'));
      results.push(check('Record captured episodes', r.episodes.length >= 1));
      results.push(
        check('Record has evidence notes', typeof r.evidence_notes?.internal?.self_knowledge === 'string')
      );
      const notes = [
        ...Object.values(r.evidence_notes.internal),
        ...Object.values(r.evidence_notes.external),
      ];
      results.push(
        check(
          'Evidence notes carry no levels or ratings',
          !notes.some((n) => /\b(high|low|strong|weak|developing|proficient|\d+\/\d+)\b/i.test(n))
        )
      );
    }
  }

  if (name === 'nothing') {
    results.push(
      check('Reached stage 4 or beyond after refusing twice', result.finalPhase >= 4)
    );
    results.push(check('Asked the Now question', all.includes(NOW_QUESTION)));
    results.push(
      check(
        'Did not promise to find what they care about',
        !/we'?ll find|we will find|discover your (passion|purpose|calling)|figure out what you (love|care)/i.test(
          all
        )
      )
    );
    results.push(
      check(
        'Did not re-ask the opening question after the refusals',
        all.split(OPENING_QUESTION).length - 1 <= 1
      )
    );
    if (result.records.length) {
      results.push(
        check('Record flags not_yet_surfaced', result.records[0].flags.not_yet_surfaced === true)
      );
    }
  }

  // Applies to every run.
  results.push(
    check('Record never visible to the student', !/CURIOSITY_RECORD|evidence_notes|self_knowledge|protective_care/.test(studentVisible))
  );
  results.push(
    check('No [NEXT_PHASE] marker leaked into view', !studentVisible.includes('[NEXT_PHASE]'))
  );
  results.push(
    check(
      'Never named a quality it was reading',
      !/\byou'?re (very |really |quite )?(curious|self-motivated|resilient|driven|persistent|resourceful)\b/i.test(
        studentVisible
      )
    )
  );
  results.push(
    check(
      'Never praised the content of an answer',
      !/\b(great|excellent|amazing|fantastic|wonderful|perfect) (answer|point|example|story)\b/i.test(
        studentVisible
      )
    )
  );

  return results.every(Boolean);
}

const app = await loadAppModules();
let allPassed = true;

for (const name of RUNS) {
  if (!SCRIPTS[name]) {
    console.error(`Unknown run "${name}". Use: ${Object.keys(SCRIPTS).join(', ')}`);
    process.exit(2);
  }
  const result = await runScript(name, app);
  if (!evaluate(name, result)) allPassed = false;
}

console.log(
  '\n' + (allPassed ? '\x1b[32mAll live checks passed.\x1b[0m' : '\x1b[31mSome live checks failed — see above.\x1b[0m')
);
process.exit(allPassed ? 0 : 1);
