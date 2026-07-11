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

// A decision "flipped" when the student recorded both a solo choice and a
// final choice and they materially differ. Comparison is intentionally
// shallow (normalized text) — the reflection asks the student to judge the
// interesting cases; this just surfaces candidates.
export function decisionFlipped(run: ArchitectRun, decisionId: string): boolean {
  const soloText = soloChoiceText(decisionId, run.solo[decisionId]).trim().toLowerCase();
  const finalText = (run.partner.decisions[decisionId]?.finalChoice ?? '')
    .trim()
    .toLowerCase();
  if (!soloText || !finalText) return false;
  return soloText !== finalText && !finalText.includes(soloText) && !soloText.includes(finalText);
}

export function flippedDecisions(run: ArchitectRun): string[] {
  return DECISIONS.filter((d) => decisionFlipped(run, d.id)).map((d) => d.id);
}

export function runToJson(run: ArchitectRun): string {
  return JSON.stringify(run, null, 2);
}

export function parseRunJson(text: string): ArchitectRun | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed && parsed.version === 1 && parsed.solo && parsed.partner) {
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
  lines.push(
    `Decisions that flipped between solo and final: ${flips.length > 0 ? flips.join(', ') : 'none detected'}`
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
      const verdictLabel =
        annotation.verdict === 'glossing'
          ? "it's glossing over something"
          : annotation.verdict;
      lines.push(`  - Student annotation (${verdictLabel}): ${annotation.note || ''}`);
    }
    lines.push('');
    lines.push(`**Final (partnered) call.** ${partner?.finalChoice || '_none recorded_'}`);
    if (partner?.finalJustification)
      lines.push(`  - Justification: ${partner.finalJustification}`);
    if (decisionFlipped(run, d.id)) lines.push(`  - _Flipped from the solo choice._`);
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
