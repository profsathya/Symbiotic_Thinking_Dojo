/**
 * Belt Record — the Code Kata Dojo's submittable, portable progress artifact.
 *
 * Built entirely from the persisted kataResults trace:
 *  - Markdown: human-readable, for a student to submit to their instructor
 *  - JSON: machine-readable (instructors can aggregate a class), and it
 *    doubles as the student's own backup — importing it on another device
 *    merges the results back in, so progress survives browser/device changes
 *
 * Integrity stance (consistent with the self-check gate): visibility, not
 * enforcement. The export embeds the full per-kata trace plus a content
 * checksum. The checksum flags casual tampering; it is NOT cryptographic
 * proof. Instructors can spot-check the underlying chat sessions.
 */

import { KataResult } from './types';
import { KATA_BANK, BELT_ORDER, KataBelt } from './kata-bank';

export const BELT_INFO: Record<KataBelt, { label: string; emoji: string }> = {
  white: { label: 'White Belt — Foundations', emoji: '⬜' },
  yellow: { label: 'Yellow Belt — Logical Operators', emoji: '🟨' },
  orange: { label: 'Orange Belt — Ifs & Branching', emoji: '🟧' },
  green: { label: 'Green Belt — Strings', emoji: '🟩' },
  blue: { label: 'Blue Belt — Collections & Maps', emoji: '🟦' },
  black: { label: 'Black Belt — OOP Principles', emoji: '⬛' },
};

const BELT_TEST_IDS = new Map<string, KataBelt>(
  KATA_BANK.filter((k) => k.beltTest).map((k) => [k.id, k.belt])
);

export interface EarnedBelt {
  belt: KataBelt;
  earnedAt: string;
}

/**
 * Belts earned = a belt-test kata (verified against the bank, not just the
 * result's own flag) reported solved. Earliest solve wins as the earn date.
 */
export function earnedBelts(results: KataResult[]): EarnedBelt[] {
  const earned = new Map<KataBelt, string>();
  for (const r of results) {
    const belt = BELT_TEST_IDS.get(r.kataId);
    if (!belt || !r.solved) continue;
    const existing = earned.get(belt);
    if (!existing || r.at < existing) earned.set(belt, r.at);
  }
  return BELT_ORDER.filter((b) => earned.has(b)).map((belt) => ({
    belt,
    earnedAt: earned.get(belt)!,
  }));
}

export interface BeltRecord {
  version: 1;
  generatedAt: string;
  belts: EarnedBelt[];
  totals: {
    katasAttempted: number;
    katasSolved: number;
    predictionsRight: number;
    predictionsTotal: number;
    plansHeld: number;
    edgesFound: number;
    decisionsDefended: number;
  };
  results: KataResult[];
}

export function buildBeltRecord(results: KataResult[], generatedAt: string): BeltRecord {
  return {
    version: 1,
    generatedAt,
    belts: earnedBelts(results),
    totals: {
      katasAttempted: results.length,
      katasSolved: results.filter((r) => r.solved).length,
      predictionsRight: results.reduce((s, r) => s + r.predictionsRight, 0),
      predictionsTotal: results.reduce((s, r) => s + r.predictionsTotal, 0),
      plansHeld: results.filter((r) => r.planHeld).length,
      edgesFound: results.filter((r) => r.edgeFound).length,
      decisionsDefended: results.filter((r) => r.defended).length,
    },
    results,
  };
}

/**
 * Content checksum (djb2 over the canonical results JSON), hex-encoded.
 * Tamper-evidence for casual edits — explicitly not cryptographic.
 */
export function beltRecordChecksum(results: KataResult[]): string {
  const canonical = JSON.stringify(results);
  let hash = 5381;
  for (let i = 0; i < canonical.length; i++) {
    hash = ((hash << 5) + hash + canonical.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function beltRecordToJson(record: BeltRecord): string {
  return JSON.stringify(
    { ...record, checksum: beltRecordChecksum(record.results) },
    null,
    2
  );
}

export function beltRecordToMarkdown(record: BeltRecord): string {
  const { totals } = record;
  const lines: string[] = [
    '# Code Kata Dojo — Belt Record',
    '',
    `Generated: ${record.generatedAt}`,
    '',
    '## Belts earned',
    '',
  ];

  if (record.belts.length === 0) {
    lines.push('_No belts earned yet — training in progress._');
  } else {
    for (const b of record.belts) {
      const info = BELT_INFO[b.belt];
      lines.push(`- ${info.emoji} **${info.label}** — earned ${b.earnedAt.slice(0, 10)}`);
    }
  }

  lines.push(
    '',
    '## Scorecard',
    '',
    `| Measure | Value |`,
    `|---|---|`,
    `| Katas attempted | ${totals.katasAttempted} |`,
    `| Katas solved | ${totals.katasSolved} |`,
    `| Prediction calibration | ${totals.predictionsRight}/${totals.predictionsTotal} test-case predictions correct |`,
    `| Plans that held | ${totals.plansHeld}/${totals.katasAttempted} |`,
    `| Edge cases found | ${totals.edgesFound} |`,
    `| Decisions defended | ${totals.decisionsDefended} |`,
    '',
    '## Kata trace',
    '',
    '| When | Kata | Belt | Tier | Solved | Predict | Plan held | Edge | Defended |',
    '|---|---|---|---|---|---|---|---|---|'
  );

  for (const r of record.results) {
    lines.push(
      `| ${r.at.slice(0, 10)} | ${r.kataId} | ${r.belt ?? '—'} | ${r.tier} | ${r.solved ? '✓' : '✗'} | ${r.predictionsRight}/${r.predictionsTotal} | ${r.planHeld ? '✓' : '✗'} | ${r.edgeFound ? '✓' : '—'} | ${r.defended ? '✓' : '—'} |`
    );
  }

  lines.push(
    '',
    '---',
    `_Checksum: ${beltRecordChecksum(record.results)} — instructors: an edited record won't match its checksum, and the per-kata trace can be spot-checked against the student's session exports._`
  );

  return lines.join('\n');
}

// Imported strings are untrusted: they get persisted and later spliced into
// the KATA SCORECARD section of the system prompt, so flatten whitespace
// (no smuggled headings/newlines) and cap length. Legit exports are already
// flat and short, so sanitizing is a no-op for them — and therefore does not
// disturb their checksum.
function cleanImportedString(raw: unknown, maxLen: number): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const flattened = raw.replace(/\s+/g, ' ').trim();
  if (flattened.length === 0) return undefined;
  return flattened.length > maxLen ? flattened.slice(0, maxLen) : flattened;
}

/**
 * Parse an exported Belt Record JSON for import/restore. All string fields
 * are sanitized (flattened, capped; belt/language whitelisted) because they
 * end up inside the system prompt. Returns the results plus whether the
 * embedded checksum still matches (a mismatch is surfaced as a warning,
 * never a hard block — the record may simply predate a change).
 */
export function parseBeltRecordJson(
  text: string
): { results: KataResult[]; checksumOk: boolean } | null {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.results)) return null;
    const results: KataResult[] = [];
    for (const raw of parsed.results) {
      const kataId = cleanImportedString(raw?.kataId, 40);
      const at = cleanImportedString(raw?.at, 40);
      if (!kataId || !at || typeof raw?.solved !== 'boolean') continue;

      const language = cleanImportedString(raw.language, 20);
      const belt = cleanImportedString(raw.belt, 10);
      results.push({
        kataId,
        tier: typeof raw.tier === 'number' ? raw.tier : 1,
        language: language === 'python' || language === 'javascript' || language === 'java' ? language : 'java',
        pattern: cleanImportedString(raw.pattern, 80) ?? '',
        predictionsRight: typeof raw.predictionsRight === 'number' ? raw.predictionsRight : 0,
        predictionsTotal: typeof raw.predictionsTotal === 'number' ? raw.predictionsTotal : 0,
        planHeld: raw.planHeld === true,
        solved: raw.solved,
        at,
        belt: belt && (BELT_ORDER as string[]).includes(belt) ? belt : undefined,
        beltTest: raw.beltTest === true ? true : undefined,
        edgeFound: raw.edgeFound === true ? true : undefined,
        defended: raw.defended === true ? true : undefined,
      });
    }
    if (results.length === 0) return null;
    const checksumOk =
      typeof parsed.checksum === 'string' && parsed.checksum === beltRecordChecksum(results);
    return { results, checksumOk };
  } catch {
    return null;
  }
}

/**
 * Merge imported results into the existing trace: dedupe on (kataId, at),
 * keep chronological order. Used by cross-device restore.
 */
export function mergeKataResults(existing: KataResult[], imported: KataResult[]): KataResult[] {
  const seen = new Set(existing.map((r) => `${r.kataId}|${r.at}`));
  const merged = [...existing];
  for (const r of imported) {
    const key = `${r.kataId}|${r.at}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(r);
    }
  }
  return merged.sort((a, b) => a.at.localeCompare(b.at));
}
