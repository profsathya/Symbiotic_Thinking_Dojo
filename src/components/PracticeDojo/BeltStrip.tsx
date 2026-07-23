'use client';

import { useRef, useState } from 'react';
import { KataResult } from '@/lib/practice-dojo/types';
import { BELT_ORDER } from '@/lib/practice-dojo/kata-bank';
import {
  BELT_INFO,
  earnedBelts,
  buildBeltRecord,
  beltRecordToJson,
  beltRecordToMarkdown,
  parseBeltRecordJson,
} from '@/lib/practice-dojo/belt-record';

interface BeltStripProps {
  kataResults: KataResult[];
  // Merge results from an imported Belt Record (cross-device restore)
  onImport: (results: KataResult[]) => void;
}

function triggerDownload(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * The Code Kata Dojo's belt strip: earned belts glow, unearned ones sit dim;
 * the Belt Record downloads as Markdown (submit to your instructor) or JSON
 * (your own backup — import it on any device to carry progress with you).
 */
export function BeltStrip({ kataResults, onImport }: BeltStripProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const earned = new Set(earnedBelts(kataResults).map((b) => b.belt));

  const handleDownload = (format: 'md' | 'json') => {
    const record = buildBeltRecord(kataResults, new Date().toISOString());
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === 'md') {
      triggerDownload(`belt-record-${stamp}.md`, beltRecordToMarkdown(record), 'text/markdown');
    } else {
      triggerDownload(`belt-record-${stamp}.json`, beltRecordToJson(record), 'application/json');
    }
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseBeltRecordJson(String(reader.result ?? ''));
      if (!parsed) {
        setNotice('That file is not a Belt Record JSON.');
        return;
      }
      onImport(parsed.results);
      setNotice(
        parsed.checksumOk
          ? `Imported ${parsed.results.length} kata result${parsed.results.length === 1 ? '' : 's'}.`
          : `Imported ${parsed.results.length} kata result${parsed.results.length === 1 ? '' : 's'} — note: the file's checksum didn't match (edited or older format).`
      );
    };
    reader.readAsText(file);
  };

  return (
    <div className="border-b border-gray-800 bg-gray-900/60 px-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5" title="Belts earned — pass a belt test to earn the next">
          {BELT_ORDER.map((belt) => (
            <span
              key={belt}
              className={earned.has(belt) ? '' : 'opacity-25 grayscale'}
              title={`${BELT_INFO[belt].label}${earned.has(belt) ? ' — earned' : ' — not yet earned'}`}
            >
              {BELT_INFO[belt].emoji}
            </span>
          ))}
          <span className="ml-2 text-[11px] text-gray-500">
            {earned.size}/{BELT_ORDER.length} belts
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleDownload('md')}
            className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-gray-700"
            title="Download your Belt Record as Markdown — submit this to your instructor"
          >
            Belt record ⬇ MD
          </button>
          <button
            onClick={() => handleDownload('json')}
            className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-gray-700"
            title="Download as JSON — your backup; import it on another device to carry progress"
          >
            JSON
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-[11px] text-gray-400 transition-colors hover:bg-gray-700"
            title="Import a Belt Record JSON from another device"
          >
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {notice && (
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-gray-400">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-gray-600 hover:text-gray-400">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
