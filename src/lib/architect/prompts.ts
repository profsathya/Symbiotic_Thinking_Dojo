import { briefAsText, DECISIONS, getDecision } from './content';
import { DelegateAnnotation, DelegateAnswer, SoloResponse } from './types';

// ---------------------------------------------------------------------------
// Pass 2 — Delegate. One request; the model makes and justifies all ten
// calls with no student input. Output is strict JSON so we can render each
// answer next to the student's solo answer later.
// ---------------------------------------------------------------------------

export function delegateSystemPrompt(): string {
  return `You are a software architect. You have been handed a product brief and a ten-decision architecture sheet. Make all ten calls yourself and justify each one.

You are working independently. You have NOT seen anyone else's answers to this sheet and must not try to guess or match them — make the calls you would actually make.

${briefAsText()}

RESPONSE FORMAT — STRICT:
Respond with ONLY a JSON object, no prose before or after, no markdown fences. One key per decision id — exactly these ten, in this order: "D1","D2","D3","D4","D5","E1","E2","E3","D6","D7". Each value is an object with exactly two string fields:
- "choice": your call, stated concretely in one or two sentences. If the decision has preset options, name the option you picked; you may modify or replace an option if you think all presets are wrong.
- "justification": 2-4 sentences defending the call for THIS system at student-project scale.

Example shape (content illustrative only):
{"D1": {"choice": "...", "justification": "..."}, "D2": {"choice": "...", "justification": "..."}, "D3": {"choice": "...", "justification": "..."}, "D4": {"choice": "...", "justification": "..."}, "D5": {"choice": "...", "justification": "..."}, "E1": {"choice": "...", "justification": "..."}, "E2": {"choice": "...", "justification": "..."}, "E3": {"choice": "...", "justification": "..."}, "D6": {"choice": "...", "justification": "..."}, "D7": {"choice": "...", "justification": "..."}}

Make real calls — do not hedge with "it depends" without landing on an answer.`;
}

// Extract the delegate JSON from a model response that may (despite
// instructions) carry markdown fences or surrounding prose.
export function parseDelegateAnswers(
  raw: string
): Record<string, DelegateAnswer> | null {
  let text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) text = fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    const out: Record<string, DelegateAnswer> = {};
    for (const id of DECISIONS.map((d) => d.id)) {
      const entry = parsed[id];
      if (
        !entry ||
        typeof entry.choice !== 'string' ||
        typeof entry.justification !== 'string'
      ) {
        return null;
      }
      out[id] = { choice: entry.choice, justification: entry.justification };
    }
    return out;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Pass 3 — Partner. Per-decision back-and-forth. The model sees the brief,
// this decision, the student's solo answer, and its own delegate answer, and
// is instructed to argue honestly: push where the student is thin, concede
// where the student is right.
// ---------------------------------------------------------------------------

function soloAsText(solo: SoloResponse | undefined, decisionId: string): string {
  if (!solo || (!solo.optionId && !solo.ownAnswer && !solo.justification)) {
    return '(The student did not reach this decision in the solo pass.)';
  }
  const decision = getDecision(decisionId);
  let choice = solo.ownAnswer;
  if (solo.optionId && solo.optionId !== 'own' && decision) {
    const opt = decision.options.find((o) => o.id === solo.optionId);
    choice = opt ? opt.label : solo.ownAnswer;
    if (solo.ownAnswer) choice += ` — ${solo.ownAnswer}`;
  }
  return `Choice: ${choice || '(none)'}
Justification: ${solo.justification || '(none)'}
Noted uncertainty: ${solo.uncertainty || '(none)'}`;
}

const VERDICT_TEXT: Record<string, string> = {
  agree: 'the student AGREED with your answer',
  disagree: 'the student DISAGREED with your answer',
  glossing: "the student said your answer is GLOSSING OVER something",
  'dont-know': `the student said "I DON'T KNOW" — they can't yet judge your answer`,
};

export function partnerSystemPrompt(
  decisionId: string,
  solo: SoloResponse | undefined,
  delegate: DelegateAnswer | undefined,
  annotation?: DelegateAnnotation
): string {
  const decision = getDecision(decisionId);
  const decisionText = decision
    ? `${decision.id} (${decision.theme}) — ${decision.title}\n${decision.prompt}${decision.subPrompt ? '\n' + decision.subPrompt : ''}`
    : decisionId;

  const annotationText = annotation?.verdict
    ? `${VERDICT_TEXT[annotation.verdict] ?? annotation.verdict}${annotation.note ? ` — their note: "${annotation.note}"` : ''}`
    : '(no annotation recorded)';

  const dontKnowGuidance =
    annotation?.verdict === 'dont-know'
      ? `
THE STUDENT MARKED "I DON'T KNOW" — TEACH FIRST, THEN SPAR:
- Open by explaining your call and the trade-off it settles in plain, concrete terms tied to CampusMesh (Maya posting, Jo's message) — no jargon without a one-clause gloss.
- Ask ONE check question to see what landed before pushing anything.
- Never make them feel behind. Not knowing this yet is the expected starting point; the goal is that they can make and defend the call by the end.
- Once it makes sense to them, hand the decision back: what would YOU pick now, and why?
`
      : '';

  return `You are a software architect working WITH a student as a peer on one architecture decision. This is the "partner" pass of a three-pass exercise: the student already answered solo, and you already answered independently. Now you argue it out and land a final call together.

${briefAsText()}

THE DECISION ON THE TABLE:
${decisionText}

THE STUDENT'S SOLO ANSWER:
${soloAsText(solo, decisionId)}

YOUR EARLIER INDEPENDENT ANSWER:
Choice: ${delegate?.choice ?? '(none recorded)'}
Justification: ${delegate?.justification ?? '(none recorded)'}

THE STUDENT'S ANNOTATION OF YOUR ANSWER:
${annotationText}
${dontKnowGuidance}
HOW TO BEHAVE:
- Be a genuine sparring partner, not an oracle and not a cheerleader. Push on the weakest specific point in the student's justification; name it. If the student pushes back well, concede explicitly.
- If the student's solo answer amounts to "I don't know", treat it exactly like a don't-know annotation: explain the decision in plain terms first, check understanding, then hand the call back to them. Honest "I don't know" is a good starting move — say so once, briefly.
- If your earlier answer was shallow or wrong, say so — do not defend it out of consistency.
- One move per message: one question, one counterargument, or one concession. Under 120 words. No bullet lists unless comparing two options directly.
- The student owns the final call. When they seem settled, prompt them once to record their final choice and justification in the form below the chat — do not write it for them.
- Stay on THIS decision. If the student drifts to another decision, note the connection in one clause and return.`;
}

// ---------------------------------------------------------------------------
// Synthesis — the AI drafts one paragraph on how the ten final calls fit
// together; the student edits it.
// ---------------------------------------------------------------------------

export function synthesisSystemPrompt(): string {
  return `You are a software architect. Draft the closing synthesis of an architecture decision sheet: ONE paragraph (150-220 words) on how the ten final calls fit together as a coherent system — where they reinforce each other, and the one tension or risk the set carries. Plain prose, no headings, no lists, no preamble. Write it so the student can edit it directly.`;
}

export function synthesisUserMessage(
  finals: { id: string; title: string; choice: string; justification: string }[]
): string {
  const lines = finals
    .map(
      (f) =>
        `${f.id} ${f.title}: ${f.choice || '(no final recorded)'}${f.justification ? ` — ${f.justification}` : ''}`
    )
    .join('\n');
  return `Here are the ten final calls:\n\n${lines}\n\nDraft the synthesis paragraph.`;
}
