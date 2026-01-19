'use client';

import { CheckpointPromptData } from '@/lib/practice-dojo/types';

interface CheckpointPromptProps {
  data: CheckpointPromptData;
}

export function CheckpointPrompt({ data }: CheckpointPromptProps) {
  return (
    <div className="my-4 rounded-lg border-2 border-cyan-600/50 bg-cyan-900/20 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600/30 flex items-center justify-center">
          <span className="text-cyan-300 text-sm">✓</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
            Checkpoint
          </h4>
          <p className="text-sm text-gray-200 font-medium">{data.question}</p>
          {data.hint && (
            <p className="text-xs text-cyan-300/70 mt-2 italic">
              💡 {data.hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
