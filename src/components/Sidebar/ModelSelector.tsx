'use client';

import React from 'react';
import { Model } from '@/hooks/useDojoConfig';

interface ModelSelectorProps {
  activeModel: string;
  availableModels: Model[];
  setActiveModel: (modelId: string) => void;
  className?: string;
}

export function ModelSelector({
  activeModel,
  availableModels,
  setActiveModel,
  className,
}: ModelSelectorProps) {
  return (
    <div className={className}>
      <label htmlFor="model-selector" className="block text-sm font-medium text-gray-400 mb-1">
        Model
      </label>
      <select
        id="model-selector"
        value={activeModel}
        onChange={(e) => setActiveModel(e.target.value)}
        className="w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      >
        {availableModels.map(model => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
    </div>
  );
}
