'use client';

import { Construct, ConstructConfig } from '@/lib/types';

interface ConstructSelectorProps {
  constructs: ConstructConfig[];
  activeConstruct: Construct;
  onSelect: (construct: Construct) => void;
}

export function ConstructSelector({
  constructs,
  activeConstruct,
  onSelect,
}: ConstructSelectorProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Construct
      </h3>
      <div className="space-y-1">
        {constructs.map(construct => (
          <button
            key={construct.id}
            onClick={() => onSelect(construct.id)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              activeConstruct === construct.id
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  activeConstruct === construct.id ? 'bg-blue-400' : 'bg-gray-600'
                }`}
              />
              <span className="text-sm font-medium">{construct.name}</span>
            </div>
            <p className="text-xs text-gray-500 ml-4 mt-0.5">
              {construct.description.split('.')[0]}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
