'use client';

import { SelectionCardsData } from '@/lib/practice-dojo/types';

interface SelectionCardsProps {
  data: SelectionCardsData;
  onSelect: (optionId: string, optionTitle: string) => void;
}

export function SelectionCards({ data, onSelect }: SelectionCardsProps) {
  return (
    <div className="my-4">
      {data.prompt && (
        <p className="text-gray-300 text-sm mb-3">{data.prompt}</p>
      )}
      <div className="grid gap-2">
        {data.options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id, option.title)}
            className="w-full p-4 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-purple-500/50 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {option.icon}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-100 group-hover:text-purple-300 transition-colors">
                  {option.title}
                </h4>
                <p className="text-sm text-gray-400 mt-0.5">{option.description}</p>
              </div>
              <svg
                className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0 mt-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
