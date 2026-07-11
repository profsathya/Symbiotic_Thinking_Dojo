'use client';

import { useState } from 'react';
import {
  downloadFile,
  runToJson,
  runToMarkdown,
} from '@/lib/architect/export';
import { ArchitectRun } from '@/lib/architect/types';
import { ComparisonView } from './ComparisonView';

interface CompleteScreenProps {
  run: ArchitectRun;
  onReset: () => void;
}

export function CompleteScreen({ run, onReset }: CompleteScreenProps) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Run complete</h1>
        <p className="mt-1 text-sm text-gray-400">
          The full comparison is below: for each decision, your solo call, the
          AI&apos;s delegated call, and the final partnered call — plus your
          synthesis and reflection.
        </p>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h2 className="font-semibold text-gray-200">Share or export</h2>
        <p className="mt-1 text-sm text-gray-400">
          Download the run as JSON to share it — anyone can open it read-only at{' '}
          <span className="font-mono text-gray-300">/architect/view</span>.
          Markdown gives you a document you can paste anywhere.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() =>
              downloadFile(
                'campusmesh-architecture-run.json',
                runToJson(run),
                'application/json'
              )
            }
            className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition-colors"
          >
            Download JSON (shareable)
          </button>
          <button
            onClick={() =>
              downloadFile(
                'campusmesh-architecture-run.md',
                runToMarkdown(run),
                'text/markdown'
              )
            }
            className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 transition-colors"
          >
            Download Markdown
          </button>
        </div>
      </div>

      <ComparisonView run={run} />

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        {!confirmingReset ? (
          <button
            onClick={() => setConfirmingReset(true)}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Start a fresh run (erases this one — export first)
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-red-300">
              This erases the completed run from this browser.
            </span>
            <button
              onClick={onReset}
              className="rounded-lg bg-red-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Erase and start fresh
            </button>
            <button
              onClick={() => setConfirmingReset(false)}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Keep it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
