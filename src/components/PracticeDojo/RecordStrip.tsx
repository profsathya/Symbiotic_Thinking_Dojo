'use client';

import { PrioritiesRecord } from '@/lib/practice-dojo/types';
import {
  prioritiesRecordToJson,
  prioritiesRecordToMarkdown,
} from '@/lib/practice-dojo/priorities-record';
import { downloadFile } from '@/lib/export';

interface RecordStripProps {
  // The record from this conversation, once the Sensei has closed it out.
  // null while the conversation is still running.
  record: PrioritiesRecord | null;
}

/**
 * "What Are My Priorities?" — the conversation record strip.
 *
 * Deliberately quiet: no numbers, no summary, no marks. It says where the
 * record lives and hands over the two downloads, and shows nothing about what
 * the conversation contained — the Sensei's whole stance is that it mirrors,
 * never scores, and a strip that displayed findings would undo that.
 */
export function RecordStrip({ record }: RecordStripProps) {
  const handleDownload = (format: 'md' | 'json') => {
    if (!record) return;
    const stamp = record.at.slice(0, 10);
    if (format === 'md') {
      downloadFile(
        prioritiesRecordToMarkdown(record),
        `my-priorities-${stamp}.md`,
        'text/markdown'
      );
    } else {
      downloadFile(
        prioritiesRecordToJson(record),
        `my-priorities-${stamp}.json`,
        'application/json'
      );
    }
  };

  return (
    <div className="border-b border-gray-800 bg-gray-900/60 px-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-gray-500">
          {record
            ? 'Your record is saved in this browser. Nothing is sent anywhere — download it if you want to keep or share it.'
            : 'When this conversation closes, a record of it is saved here for you to download.'}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleDownload('md')}
            disabled={!record}
            className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            title={
              record
                ? 'Download your record as Markdown — readable, and yours to hand in if you choose'
                : 'Available once the conversation closes'
            }
          >
            My record ⬇ MD
          </button>
          <button
            onClick={() => handleDownload('json')}
            disabled={!record}
            className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            title={
              record
                ? 'Download as JSON — the complete record, including the notes the Sensei wrote'
                : 'Available once the conversation closes'
            }
          >
            JSON
          </button>
        </div>
      </div>
    </div>
  );
}
