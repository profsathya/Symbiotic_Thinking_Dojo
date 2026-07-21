'use client';

import { useState } from 'react';

interface PromptEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
  description?: string;
}

export function PromptEditor({
  label,
  value,
  onChange,
  onReset,
  description,
}: PromptEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isDirty, setIsDirty] = useState(false);

  // Re-sync the draft when the upstream value changes (e.g. after a reset) —
  // done during render (React's "adjust state when props change" pattern)
  // rather than in an effect.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setLocalValue(value);
    setIsDirty(false);
  }

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    setIsDirty(true);
  };

  const handleSave = () => {
    onChange(localValue);
    setIsDirty(false);
  };

  const handleReset = () => {
    onReset();
    setIsDirty(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-200">{label}</label>
        <div className="flex gap-2">
          {isDirty && (
            <button
              onClick={handleSave}
              className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              Save
            </button>
          )}
          <button
            onClick={handleReset}
            className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      {description && (
        <p className="text-xs text-gray-400">{description}</p>
      )}
      <textarea
        value={localValue}
        onChange={e => handleChange(e.target.value)}
        className="w-full h-64 p-3 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Enter prompt..."
      />
    </div>
  );
}
