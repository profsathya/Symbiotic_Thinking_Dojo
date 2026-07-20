import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Architect Studio — Lesson Plan',
  description:
    'Instructor-facing lesson plan for the Architect Studio three-pass activity',
};

// Instructor-facing lesson plan for Architect Studio. Static — no AI calls,
// no key, no student state. This page is the canonical lesson plan.
//
// Print styling: the studio's dark theme would print as ink-heavy or
// white-on-white, so every color class carries a print: override flipping to
// black-on-white with visible table borders. Chrome/screen readers see the
// dark page; the printed handout is a clean document.

const sectionCls = 'space-y-3';
const h2Cls =
  'text-lg font-semibold text-gray-100 print:text-black border-b border-gray-800 print:border-gray-300 pb-1';
const pCls = 'text-sm leading-relaxed text-gray-300 print:text-black';
const mutedCls = 'text-sm leading-relaxed text-gray-400 print:text-gray-700';
const thCls =
  'border border-gray-700 print:border-gray-400 bg-gray-900 print:bg-gray-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-300 print:text-black';
const tdCls =
  'border border-gray-800 print:border-gray-400 px-3 py-2 text-sm text-gray-300 print:text-black align-top';

export default function ArchitectLessonPlanPage() {
  return (
    <div className="min-h-screen bg-gray-950 print:bg-white text-gray-100 print:text-black">
      <header className="border-b border-gray-800 px-4 py-3 print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/architect"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Architect Studio
          </Link>
          <button className="hidden" aria-hidden />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 print:py-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 print:text-black">
            Architect Studio — Lesson Plan
          </h1>
          <p className={`mt-2 ${pCls}`}>
            <strong>Tool:</strong> this site (~100 min, browser only, no
            account or key needed).
          </p>
        </div>

        <section className={sectionCls}>
          <h2 className={h2Cls}>Learning goal (student-facing)</h2>
          <p className={pCls}>
            Strengthen your ability to compare your own work with AI&apos;s on
            a real system design and find the value you add — the skill that
            matters most as AI keeps improving.
          </p>
          <p className={mutedCls}>
            <strong className="text-gray-300 print:text-black">
              Context for faculty:
            </strong>{' '}
            AI capability is improving fast and will keep improving. The
            durable skill is not any single technical call — it is the
            practiced ability to put your work next to AI&apos;s, judge the
            difference, and name the human value. This activity is one rep of
            that practice.
          </p>
        </section>

        <section className={sectionCls}>
          <h2 className={h2Cls}>The activity</h2>
          <p className={pCls}>
            Students architect CampusMesh (a study-session app) by making ten
            decisions across four themes — networking (presence, chat
            delivery), design (component boundaries, a pattern call, data
            model), experience (first open, presence comfort, the moment it
            fails), engineering (testing, shipping) — three ways:
          </p>
          <ol className={`ml-5 list-decimal space-y-1.5 ${pCls}`}>
            <li>
              <strong>Solo (30 min).</strong> AI off. Choose and justify each
              call; &quot;I don&apos;t know&quot; is a legitimate answer.
            </li>
            <li>
              <strong>Delegate (15 min).</strong> AI makes all ten calls
              independently. Student annotates each: agree / disagree /
              glossing over something — and how they know.
            </li>
            <li>
              <strong>Partner (35 min).</strong> Argue decisions out with the
              AI; record a final call for each, marked kept or changed; edit an
              AI-drafted synthesis.
            </li>
          </ol>
          <p className={pCls}>Then a 4-question reflection (15 min).</p>
          <p className={mutedCls}>
            The experience decisions are where human value is likeliest to
            shine — students are this app&apos;s users, and their lived campus
            experience beats the AI&apos;s generic UX answers.
          </p>
        </section>

        <section className={sectionCls}>
          <h2 className={h2Cls}>Session flow and instructor moves</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={thCls}>Segment</th>
                  <th className={thCls}>Time</th>
                  <th className={thCls}>Instructor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={tdCls}>Setup, frame the goal</td>
                  <td className={tdCls}>5</td>
                  <td className={tdCls}>
                    Say the goal in one line; &quot;I don&apos;t know is a real
                    answer here.&quot;
                  </td>
                </tr>
                <tr>
                  <td className={tdCls}>Solo</td>
                  <td className={tdCls}>30</td>
                  <td className={tdCls}>Don&apos;t rescue; note who freezes.</td>
                </tr>
                <tr>
                  <td className={tdCls}>Delegate + annotate</td>
                  <td className={tdCls}>15</td>
                  <td className={tdCls}>
                    Push &quot;how do you know&quot; — evidence, not vibes.
                  </td>
                </tr>
                <tr>
                  <td className={tdCls}>Partner + final calls</td>
                  <td className={tdCls}>35</td>
                  <td className={tdCls}>
                    Circulate; nudge students to argue the decisions they
                    disagreed on.
                  </td>
                </tr>
                <tr>
                  <td className={tdCls}>Reflection</td>
                  <td className={tdCls}>15</td>
                  <td className={tdCls}>
                    Protect this time — the goal lives here.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={mutedCls}>
            Works in-class (two periods or one lab block) or async (passes are
            one-way and self-timed).
          </p>
        </section>

        <section className={sectionCls}>
          <h2 className={h2Cls}>Submission</h2>
          <p className={pCls}>
            The completion screen exports Markdown (human-readable full run)
            and JSON (re-openable read-only at{' '}
            <span className="font-mono">/architect/view</span>). Students
            upload both to Canvas. The submission contains everything below —
            no extra collection needed.
          </p>
        </section>

        <section className={sectionCls}>
          <h2 className={h2Cls}>Metrics</h2>
          <p className={pCls}>
            <strong>Student self-evaluation</strong> (3 items with the
            submission):
          </p>
          <ol className={`ml-5 list-decimal space-y-1.5 ${pCls}`}>
            <li>
              I can point to one decision where I changed my mind for a reason
              I can defend. (yes/no + the decision)
            </li>
            <li>
              I can name one thing I knew or noticed that the AI&apos;s answer
              missed. (yes/no + what)
            </li>
            <li>
              My sense of where I add value beyond AI, before vs. after this
              session. (1–5, twice)
            </li>
          </ol>
          <p className={pCls}>
            <strong>Faculty rubric</strong> (scored from the Markdown, ~10
            min/student, 3 levels each):
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={thCls}>Criterion</th>
                  <th className={thCls}>Strong looks like</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={tdCls}>Annotation judgment</td>
                  <td className={tdCls}>
                    &quot;How you know&quot; cites evidence or experience, not
                    deference or vibes.
                  </td>
                </tr>
                <tr>
                  <td className={tdCls}>Final-call reasoning</td>
                  <td className={tdCls}>
                    Kept/changed for defensible reasons; changes credit the
                    argument, keeps survive it.
                  </td>
                </tr>
                <tr>
                  <td className={tdCls}>Value beyond AI</td>
                  <td className={tdCls}>
                    Reflection names a specific human contribution — not
                    generic.
                  </td>
                </tr>
                <tr>
                  <td className={tdCls}>Engagement with the argument</td>
                  <td className={tdCls}>
                    Argued the decisions where they disagreed or flagged
                    glossing.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={mutedCls}>
            Tool-recorded signals in every submission: kept vs. changed per
            decision, argued count, before/after on each decision.
          </p>
        </section>

        <section className={sectionCls}>
          <h2 className={h2Cls}>Comprehensive by design</h2>
          <p className={pCls}>
            Every student architects the whole system and is assessed on the
            whole run — the skill is judging a complete architecture with AI,
            not the slice a given course teaches. Each course will recognize
            its own territory in the decisions; that recognition is a hook for
            class discussion, not a rubric split.
          </p>
        </section>

        <section className={sectionCls}>
          <h2 className={h2Cls}>How we&apos;d know it isn&apos;t working</h2>
          <p className={pCls}>
            If most reflections can&apos;t name a specific value-add, the
            activity isn&apos;t producing the goal — revise the design,
            don&apos;t lower the bar. Every student, including the one who
            doesn&apos;t know the vocabulary yet, must have an honest move at
            every step.
          </p>
        </section>

        <footer className="border-t border-gray-800 print:border-gray-300 pt-4 text-xs text-gray-600 print:text-gray-600">
          Architect Studio · CampusMesh three-pass activity · ~100 minutes ·{' '}
          <span className="print:hidden">
            <Link href="/architect" className="underline hover:text-gray-400">
              open the activity
            </Link>
          </span>
          <span className="hidden print:inline">/architect</span>
        </footer>
      </main>
    </div>
  );
}
