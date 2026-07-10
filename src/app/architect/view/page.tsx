'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ComparisonView } from '@/components/Architect/ComparisonView';
import { parseRunJson } from '@/lib/architect/export';
import { ArchitectRun } from '@/lib/architect/types';

// Read-only viewer for a shared run. A student exports JSON from a completed
// run; anyone (faculty, peers) opens it here — no key, no state, no editing.
export default function ArchitectViewPage() {
  const [run, setRun] = useState<ArchitectRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadText = (text: string) => {
    const parsed = parseRunJson(text);
    if (parsed) {
      setRun(parsed);
      setError(null);
    } else {
      setError(
        'That does not look like an exported Architect Studio run (expected the JSON downloaded from a completed run).'
      );
    }
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadText(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="font-semibold text-gray-100">
            Architect Studio — shared run (read-only)
          </h1>
          <Link
            href="/architect"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Run it yourself →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {!run ? (
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 space-y-4">
            <p className="text-sm text-gray-300">
              Load an exported run file (the{' '}
              <span className="font-mono">campusmesh-architecture-run.json</span>{' '}
              downloaded at the end of a run) to view it.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={(e) => onFile(e.target.files?.[0])}
              className="block w-full text-sm text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-sky-600"
            />
            <details className="text-sm text-gray-500">
              <summary className="cursor-pointer hover:text-gray-300">
                …or paste the JSON directly
              </summary>
              <textarea
                rows={6}
                placeholder="Paste the exported JSON here…"
                onChange={(e) => {
                  if (e.target.value.trim().startsWith('{')) {
                    loadText(e.target.value);
                  }
                }}
                className="mt-2 w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-xs text-gray-100 placeholder-gray-600 font-mono"
              />
            </details>
            {error && (
              <div className="rounded border border-red-800 bg-red-900/30 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {run.startedAt && <>Started {new Date(run.startedAt).toLocaleString()}</>}
                {run.completedAt && (
                  <> · completed {new Date(run.completedAt).toLocaleString()}</>
                )}
              </div>
              <button
                onClick={() => {
                  setRun(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Load a different run
              </button>
            </div>
            <ComparisonView run={run} />
          </>
        )}
      </main>
    </div>
  );
}
