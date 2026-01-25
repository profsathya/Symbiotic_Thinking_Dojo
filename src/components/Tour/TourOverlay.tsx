'use client';

import { useEffect, useState, useCallback } from 'react';
import { TourStep } from '@/hooks/useTour';

interface TourOverlayProps {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

interface Position {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourOverlay({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: TourOverlayProps) {
  const [targetPosition, setTargetPosition] = useState<Position | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  const updatePosition = useCallback(() => {
    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 8;
      setTargetPosition({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Calculate tooltip position based on step.position
      const tooltipWidth = 360;
      const tooltipHeight = 300; // Increased to fit all content including buttons
      const gap = 16;

      let style: React.CSSProperties = {};

      switch (step.position) {
        case 'top':
          style = {
            bottom: window.innerHeight - rect.top + gap,
            left: rect.left + rect.width / 2 - tooltipWidth / 2,
          };
          break;
        case 'bottom':
          style = {
            top: rect.bottom + gap,
            left: rect.left + rect.width / 2 - tooltipWidth / 2,
          };
          break;
        case 'left':
          style = {
            top: rect.top + rect.height / 2 - tooltipHeight / 2,
            right: window.innerWidth - rect.left + gap,
          };
          break;
        case 'right':
        default:
          style = {
            top: rect.top + rect.height / 2 - tooltipHeight / 2,
            left: rect.right + gap,
          };
          break;
      }

      // Ensure tooltip stays within viewport
      if (style.left !== undefined && typeof style.left === 'number') {
        style.left = Math.max(16, Math.min(style.left, window.innerWidth - tooltipWidth - 16));
      }
      if (style.top !== undefined && typeof style.top === 'number') {
        style.top = Math.max(16, Math.min(style.top, window.innerHeight - tooltipHeight - 16));
      }

      setTooltipStyle(style);
    }
  }, [step.target, step.position]);

  useEffect(() => {
    updatePosition();

    // Update on resize
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [updatePosition]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        onNext();
      } else if (e.key === 'ArrowLeft') {
        onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onSkip]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Semi-transparent backdrop with spotlight cutout - click to close */}
      <svg
        className="absolute inset-0 w-full h-full cursor-pointer"
        onClick={onSkip}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetPosition && (
              <rect
                x={targetPosition.left}
                y={targetPosition.top}
                width={targetPosition.width}
                height={targetPosition.height}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Highlight border around target */}
      {targetPosition && (
        <div
          className="absolute border-2 border-purple-500 rounded-lg pointer-events-none animate-pulse"
          style={{
            top: targetPosition.top,
            left: targetPosition.left,
            width: targetPosition.width,
            height: targetPosition.height,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-5 w-[360px] max-h-[calc(100vh-32px)] overflow-y-auto"
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <span className="text-purple-400">🥋</span>
            {step.title}
          </h3>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-300 mb-3 leading-relaxed">
          {step.content}
        </p>

        {/* Your Part */}
        <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-3 mb-4">
          <p className="text-sm text-purple-200">
            <span className="font-medium text-purple-300">Your part:</span>{' '}
            {step.yourPart}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Skip tour
          </button>

          <div className="flex gap-2">
            {!isFirstStep && (
              <button
                onClick={onPrev}
                className="px-3 py-1.5 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={onNext}
              className="px-4 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
            >
              {isLastStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
