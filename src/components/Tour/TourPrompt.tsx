'use client';

import { useState, useEffect } from 'react';

interface TourPromptProps {
  onStartTour: () => void;
  onDismiss: () => void;
}

export function TourPrompt({ onStartTour, onDismiss }: TourPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Animate in after a short delay
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const handleStartTour = () => {
    setIsExiting(true);
    setTimeout(() => {
      onStartTour();
    }, 300);
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isVisible && !isExiting
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 max-w-[280px]">
        {/* Pulsing indicator */}
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
          </span>
        </div>

        {/* Content */}
        <div className="flex items-start gap-3">
          <span className="text-2xl">🥋</span>
          <div>
            <h3 className="text-sm font-semibold text-gray-100 mb-1">
              New here?
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Take a quick tour to learn how the Dojo can help you think better with AI.
            </p>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleStartTour}
                className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
              >
                Take a 2-min tour
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
