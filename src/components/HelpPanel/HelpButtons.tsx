'use client';

interface HelpButtonsProps {
  onOpenPhilosophy: () => void;
  onOpenInterface: () => void;
}

export function HelpButtons({ onOpenPhilosophy, onOpenInterface }: HelpButtonsProps) {
  return (
    <div className="fixed top-4 right-4 z-40 flex gap-2">
      <button
        onClick={onOpenPhilosophy}
        className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800/90 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors flex items-center gap-1.5 backdrop-blur-sm"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        Philosophy
      </button>
      <button
        onClick={onOpenInterface}
        className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800/90 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors flex items-center gap-1.5 backdrop-blur-sm"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Interface
      </button>
    </div>
  );
}
