import { DECISIONS, getDecision, REFLECTION_QUESTIONS } from './content';
import { ArchitectRun, SoloResponse } from './types';

// Human-readable form of a solo choice (resolves preset option ids to labels)
export function soloChoiceText(
  decisionId: string,
  solo: SoloResponse | undefined
): string {
  if (!solo) return '';
  const decision = getDecision(decisionId);
  if (solo.optionId && solo.optionId !== 'own' && decision) {
    const opt = decision.options.find((o) => o.id === solo.optionId);
    const label = opt ? opt.label : '';
    return solo.ownAnswer ? `${label} — ${solo.ownAnswer}` : label;
  }
  return solo.ownAnswer;
}

// A decision "flipped" when the student, while recording the final call,
// declared it changed from their solo call. Student-declared stance is the
// signal — text comparison was tried first and misfired, since the final
// call is free text and any rewording of a kept call looked like a flip.
export function decisionFlipped(run: ArchitectRun, decisionId: string): boolean {
  return run.partner.decisions[decisionId]?.finalStance === 'changed';
}

export function flippedDecisions(run: ArchitectRun): string[] {
  return DECISIONS.filter((d) => decisionFlipped(run, d.id)).map((d) => d.id);
}

// A decision counts as "argued" once there has been at least one real
// exchange in the partner chat. The test is an actual ASSISTANT reply (which
// in this flow only ever follows a student message) — a raw length check
// would miscount two student messages left behind by a failed/retried
// request as an argument.
export function decisionArgued(run: ArchitectRun, decisionId: string): boolean {
  return (run.partner.decisions[decisionId]?.messages ?? []).some(
    (m) => m.role === 'assistant'
  );
}

// Whether this run carries kept/changed declarations at all. Runs recorded
// before finalStance existed have none — their flip data is UNAVAILABLE,
// which is different from "the student kept every call".
export function hasStanceData(run: ArchitectRun): boolean {
  return DECISIONS.some(
    (d) => (run.partner.decisions[d.id]?.finalStance ?? null) !== null
  );
}

export function arguedDecisions(run: ArchitectRun): string[] {
  return DECISIONS.filter((d) => decisionArgued(run, d.id)).map((d) => d.id);
}

export function runToJson(run: ArchitectRun): string {
  return JSON.stringify(run, null, 2);
}

export function parseRunJson(text: string): ArchitectRun | null {
  try {
    const parsed = JSON.parse(text);
    // Accept both schema versions: version-1 files are seven-decision runs
    // exported before the Experience theme existed. All rendering tolerates
    // their missing E1-E3 keys, so the shared viewer keeps opening them.
    if (parsed && (parsed.version === 1 || parsed.version === 2) && parsed.solo && parsed.partner) {
      return parsed as ArchitectRun;
    }
    return null;
  } catch {
    return null;
  }
}

export function runToMarkdown(run: ArchitectRun): string {
  const lines: string[] = [];
  lines.push('# CampusMesh Architecture — Three-Pass Run');
  lines.push('');
  if (run.startedAt) lines.push(`Started: ${run.startedAt}`);
  if (run.completedAt) lines.push(`Completed: ${run.completedAt}`);
  const flips = flippedDecisions(run);
  const argued = arguedDecisions(run);
  lines.push(
    hasStanceData(run)
      ? `Decisions that flipped between solo and final (student-declared): ${flips.length > 0 ? flips.join(', ') : 'none'}`
      : 'Decisions that flipped: not recorded (this run predates kept/changed declarations).'
  );
  lines.push(
    `Decisions argued with the AI in the partner pass: ${argued.length > 0 ? argued.join(', ') : 'none'} (${argued.length}/${DECISIONS.length})`
  );
  lines.push('');

  for (const d of DECISIONS) {
    const solo = run.solo[d.id];
    const ai = run.delegate.answers[d.id];
    const annotation = run.delegate.annotations[d.id];
    const partner = run.partner.decisions[d.id];
    lines.push(`## ${d.id} · ${d.title} (${d.theme})`);
    lines.push('');
    lines.push(`**Question.** ${d.prompt}${d.subPrompt ? ' ' + d.subPrompt : ''}`);
    lines.push('');
    lines.push(`**Solo choice.** ${soloChoiceText(d.id, solo) || '_not reached_'}`);
    if (solo?.justification) lines.push(`  - Justification: ${solo.justification}`);
    if (solo?.uncertainty) lines.push(`  - Unsure about: ${solo.uncertainty}`);
    lines.push('');
    lines.push(`**AI (delegate) choice.** ${ai?.choice ?? '_none_'}`);
    if (ai?.justification) lines.push(`  - Justification: ${ai.justification}`);
    if (annotation?.verdict) {
      const verdictLabels: Record<string, string> = {
        agree: 'agree',
        disagree: 'disagree',
        glossing: "it's glossing over something",
        'dont-know': "didn't know",
      };
      const verdictLabel = verdictLabels[annotation.verdict] ?? annotation.verdict;
      lines.push(
        `  - Student annotation (${verdictLabel})${annotation.note ? `: ${annotation.note}` : ''}`
      );
    }
    lines.push('');
    lines.push(`**Final (partnered) call.** ${partner?.finalChoice || '_none recorded_'}`);
    if (partner?.finalJustification)
      lines.push(`  - Justification: ${partner.finalJustification}`);
    if (partner?.finalStance === 'changed')
      lines.push(`  - _Student marked this as changed from the solo call._`);
    if (partner?.finalStance === 'kept')
      lines.push(`  - _Student marked this as keeping the solo call._`);
    if (partner?.finalStance === 'new')
      lines.push(`  - _No solo call to compare (not reached in Pass 1)._`);
    lines.push(
      `  - ${decisionArgued(run, d.id) ? `Argued with the AI (${(partner?.messages ?? []).filter((m) => m.role === 'assistant').length} exchange(s)).` : 'Not argued with the AI.'}`
    );
    lines.push('');
  }

  lines.push('## Synthesis');
  lines.push('');
  lines.push(run.partner.synthesis || '_none_');
  lines.push('');

  lines.push('## Reflection');
  lines.push('');
  for (const q of REFLECTION_QUESTIONS) {
    lines.push(`**${q.question}**`);
    lines.push('');
    lines.push(run.reflection[q.key] || '_no answer_');
    lines.push('');
  }

  lines.push('## Process trace');
  lines.push('');
  for (const [stage, stamp] of Object.entries(run.timestamps)) {
    if (!stamp) continue;
    lines.push(
      `- ${stage}: entered ${stamp.enteredAt}${stamp.exitedAt ? `, exited ${stamp.exitedAt}` : ''}`
    );
  }

  return lines.join('\n');
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
