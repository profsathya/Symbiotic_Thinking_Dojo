'use client';

import { useState, ReactNode } from 'react';

interface AccordionItemProps {
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  onReset?: () => void;
}

export function AccordionItem({
  title,
  description,
  isOpen,
  onToggle,
  children,
  onReset,
}: AccordionItemProps) {
  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-800 hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span
            className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}
          >
            ▶
          </span>
          <div className="text-left">
            <span className="font-medium text-gray-200">{title}</span>
            {description && (
              <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {onReset && (
          <span
            onClick={e => {
              e.stopPropagation();
              onReset();
            }}
            className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition-colors"
          >
            Reset
          </span>
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-850 border-t border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}

interface AccordionProps {
  children: ReactNode;
}

export function Accordion({ children }: AccordionProps) {
  return <div className="space-y-2">{children}</div>;
}
