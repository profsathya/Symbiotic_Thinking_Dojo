'use client';

import { useState } from 'react';
import { CuriosityRecord } from '@/lib/practice-dojo/types';
import {
  buildRecordBundle,
  recordBundleToJson,
} from '@/lib/practice-dojo/curiosity-record';

interface CuriosityRecordBarProps {
  records: CuriosityRecord[];
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
 * The manual export path for Map Your Curiosity session records.
 *
 * The record itself is internal — it is never rendered in the conversation
 * and this bar never displays its contents. It only offers the file, and only
 * once a session has actually produced one. That keeps the student's side
 * honest (they have a file to submit, and can read it if they choose) without
 * turning the conversation into something that visibly grades them.
 *
 * Server-side collection is a separate path, behind
 * NEXT_PUBLIC_CURIOSITY_RECORD_SYNC and off by default.
 */
export function CuriosityRecordBar({ records }: CuriosityRecordBarProps) {
  const [downloaded, setDownloaded] = useState(false);

  if (records.length === 0) return null;

  const handleDownload = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const bundle = buildRecordBundle(records, new Date().toISOString());
    triggerDownload(
      `curiosity-record-${stamp}.json`,
      recordBundleToJson(bundle),
      'application/json'
    );
    setDownloaded(true);
  };

  return (
    <div className="border-b border-gray-800 bg-gray-900/60 px-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-gray-400">
          {downloaded
            ? 'Saved to your downloads.'
            : 'Your session record is ready to send to your instructor.'}
        </span>
        <button
          onClick={handleDownload}
          className="rounded border border-gray-700 px-3 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-800 hover:text-gray-100"
        >
          Download session record
        </button>
      </div>
    </div>
  );
}
