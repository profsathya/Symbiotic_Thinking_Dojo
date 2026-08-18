'use client';

import { useState } from 'react';
import { PrioritiesRecord } from '@/lib/practice-dojo/types';
import {
  prioritiesRecordToJson,
  prioritiesRecordToMarkdown,
} from '@/lib/practice-dojo/priorities-record';
import { downloadFile, copyToClipboard } from '@/lib/export';

interface RecordStripProps {
  // Every record still in this browser, oldest first. More than one means the
  // student has run the activity before; earlier runs stay downloadable.
  records: PrioritiesRecord[];
  // False when the newest record predates the conversation on screen, so the
  // strip can say which one it is instead of implying it is today's.
  fromThisSession: boolean;
}

/**
 * "What Are My Priorities?" — the conversation record strip.
 *
 * Deliberately quiet: no numbers, no summary, no marks. It says where the
 * record lives and hands over the exports, and shows nothing about what the
 * conversation contained — the Sensei's whole stance is that it mirrors,
 * never scores, and a strip that displayed findings would undo that.
 *
 * Copy is first among the exports because that is the path students actually
 * take: the record goes into a text box in the LMS, and download → find the
 * file → open → select all → copy is the step most likely to lose a
 * submission outright.
 */
export function RecordStrip({ records, fromThisSession }: RecordStripProps) {
  const [notice, setNotice] = useState<string | null>(null);
  // Which run the buttons act on: the newest by default, or an earlier one
  // the student picked from the list.
  const [selected, setSelected] = useState<number | null>(null);

  const record = records.length > 0 ? records[selected ?? records.length - 1] : null;
  const viewingOlder = selected !== null && selected !== records.length - 1;
  const stamp = record?.at.slice(0, 10) ?? '';

  const handleCopy = async () => {
    if (!record) return;
    const ok = await copyToClipboard(prioritiesRecordToMarkdown(record));
    setNotice(ok ? 'Record copied — paste it where your instructor asked.' : 'Copy failed. Download it instead.');
  };

  const handleDownload = (format: 'md' | 'json') => {
    if (!record) return;
    if (format === 'md') {
      downloadFile(prioritiesRecordToMarkdown(record), `my-priorities-${stamp}.md`, 'text/markdown');
    } else {
      downloadFile(prioritiesRecordToJson(record), `my-priorities-${stamp}.json`, 'application/json');
    }
  };

  const status = !record
    ? 'When this conversation closes, a record of it is saved here for you to download.'
    : viewingOlder || !fromThisSession
      ? `Showing your record from ${stamp}. It stays in this browser — new runs are added, never overwritten.`
      : 'Your record is saved in this browser. Nothing is sent anywhere — copy or download it to hand it in.';

  return (
    <div className="border-b border-gray-800 bg-gray-900/60 px-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-gray-500">{status}</span>

        <div className="flex items-center gap-1.5">
          {/* Earlier runs stay reachable: a second conversation must not cost
              the student the record from their first. */}
          {records.length > 1 && (
            <select
              value={selected ?? records.length - 1}
              onChange={(e) => setSelected(Number(e.target.value))}
              className="rounded border border-gray-700 bg-gray-800 px-1.5 py-1 text-[11px] text-gray-300"
              aria-label="Which conversation record"
            >
              {records.map((r, i) => (
                <option key={`${r.at}-${i}`} value={i}>
                  {r.at.slice(0, 10)}
                  {i === records.length - 1 ? ' (latest)' : ''}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleCopy}
            disabled={!record}
            className="rounded border border-emerald-800 bg-emerald-900/40 px-2 py-1 text-[11px] text-emerald-200 transition-colors hover:bg-emerald-900/70 disabled:cursor-not-allowed disabled:opacity-40"
            title={record ? 'Copy your record — paste it straight into your submission' : 'Available once the conversation closes'}
          >
            Copy my record
          </button>
          <button
            onClick={() => handleDownload('md')}
            disabled={!record}
            className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            title={record ? 'Download as Markdown' : 'Available once the conversation closes'}
          >
            ⬇ MD
          </button>
          <button
            onClick={() => handleDownload('json')}
            disabled={!record}
            className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            title={record ? 'Download as JSON — the complete record, including the notes the Sensei wrote' : 'Available once the conversation closes'}
          >
            JSON
          </button>
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
