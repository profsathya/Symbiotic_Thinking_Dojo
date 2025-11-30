'use client';

interface HelpButtonsProps {
  onOpen: () => void;
}

export function HelpButtons({ onOpen }: HelpButtonsProps) {
  return (
    <button
      onClick={onOpen}
      className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-lg transition-colors flex items-center gap-1.5"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Learn About
    </button>
  );
}
