'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, Construct, SparringPartner, BalanceState, DIKWState } from '@/lib/types';
import {
  exportSessionAsJSON,
  exportSessionAsMarkdown,
  downloadFile,
  generateFilename,
} from '@/lib/export';

interface ExportButtonProps {
  messages: Message[];
  construct: Construct;
  activePartners: SparringPartner[];
  balance: BalanceState;
  dikw: DIKWState;
  disabled?: boolean;
}

export function ExportButton({
  messages,
  construct,
  activePartners,
  balance,
  dikw,
  disabled = false,
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [error, setError] = useState<string | null>(null);

  const handleExportMarkdown = () => {
    console.log('[Export] Starting Markdown export...');
    console.log('[Export] Messages count:', messages.length);
    setError(null);
    setShowHint(false);

    try {
      const content = exportSessionAsMarkdown(messages, construct, activePartners, balance, dikw);
      const filename = generateFilename(construct, 'md');
      console.log('[Export] Generated filename:', filename);
      console.log('[Export] Content length:', content.length);
      const success = downloadFile(content, filename, 'text/markdown');
      console.log('[Export] Download initiated, success:', success);
      setIsOpen(false);
      if (success) {
        console.log('[Export] Setting showHint to true');
        setShowHint(true);
        setTimeout(() => setShowHint(false), 5000);
      } else {
        setError('Download failed. Check browser console for details.');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('[Export] Error during export:', err);
      setIsOpen(false);
      setError('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleExportJSON = () => {
    console.log('[Export] Starting JSON export...');
    console.log('[Export] Messages count:', messages.length);
    setError(null);
    setShowHint(false);

    try {
      const content = exportSessionAsJSON(messages, construct, activePartners, balance, dikw);
      const filename = generateFilename(construct, 'json');
      console.log('[Export] Generated filename:', filename);
      console.log('[Export] Content length:', content.length);
      const success = downloadFile(content, filename, 'application/json');
      console.log('[Export] Download initiated, success:', success);
      setIsOpen(false);
      if (success) {
        console.log('[Export] Setting showHint to true');
        setShowHint(true);
        setTimeout(() => setShowHint(false), 5000);
      } else {
        setError('Download failed. Check browser console for details.');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('[Export] Error during export:', err);
      setIsOpen(false);
      setError('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Don't show if there's nothing meaningful to export
  const hasContent = messages.length > 1;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Save session locally"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Save Session
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-700">
            <p className="text-xs text-gray-400">Export your session to save locally</p>
          </div>

          <div className="p-1">
            <button
              onClick={handleExportMarkdown}
              className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700/50 rounded-md flex items-start gap-3 transition-colors"
            >
              <svg className="w-4 h-4 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <div className="font-medium">Save as Markdown</div>
                <div className="text-xs text-gray-400">Human-readable format for notes or sharing</div>
              </div>
            </button>

            <button
              onClick={handleExportJSON}
              className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700/50 rounded-md flex items-start gap-3 transition-colors"
            >
              <svg className="w-4 h-4 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="font-medium">Save as JSON</div>
                <div className="text-xs text-gray-400">Full data for importing later</div>
              </div>
            </button>
          </div>

          <div className="p-2 border-t border-gray-700 bg-gray-800/50">
            <p className="text-xs text-gray-500">
              💡 Tip: Use <span className="text-amber-400">@reflector</span> first to summarize your insights
            </p>
          </div>
        </div>
      )}

      {/* Success hint after export - positioned below the button */}
      {showHint && (
        <div className="absolute right-0 top-full mt-1 px-3 py-2 bg-green-900/90 border border-green-700 rounded-lg text-xs text-green-200 whitespace-nowrap z-[100] shadow-lg animate-pulse">
          ✓ Session saved to your downloads
        </div>
      )}

      {/* Error message - positioned below the button */}
      {error && (
        <div className="absolute right-0 top-full mt-1 px-3 py-2 bg-red-900/90 border border-red-700 rounded-lg text-xs text-red-200 whitespace-nowrap z-[100] shadow-lg">
          ✗ {error}
        </div>
      )}
    </div>
  );
}
