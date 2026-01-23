'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Construct, SparringPartner, DojoConfig } from '@/lib/types';
import { ConstructSelector } from './ConstructSelector';
import { PartnerSelector } from './PartnerSelector';
import { parseImportedSession, readFileAsText, ImportedSession } from '@/lib/export';

interface SidebarProps {
  config: DojoConfig;
  activeConstruct: Construct;
  activePartners: SparringPartner[];
  isApiKeySet: boolean;
  onSelectConstruct: (construct: Construct) => void;
  onTogglePartner: (partner: SparringPartner) => void;
  onOpenApiKeySettings: () => void;
  onOpenConfig: () => void;
  onNewSession: () => void;
  onGuidedPractice: () => void;
  onImportSession: (session: ImportedSession) => void;
}

export function Sidebar({
  config,
  activeConstruct,
  activePartners,
  isApiKeySet,
  onSelectConstruct,
  onTogglePartner,
  onOpenApiKeySettings,
  onOpenConfig,
  onNewSession,
  onGuidedPractice,
  onImportSession,
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);

    try {
      const content = await readFileAsText(file);
      const result = parseImportedSession(content);

      if (result.success) {
        onImportSession(result.data);
      } else {
        setImportError(result.error.message);
        setTimeout(() => setImportError(null), 5000);
      }
    } catch {
      setImportError('Failed to read file');
      setTimeout(() => setImportError(null), 5000);
    }

    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800" data-tour="welcome">
        <div className="flex items-center gap-3">
          <Image
            src="/CTI.png"
            alt="CTI Logo"
            width={40}
            height={40}
            className="rounded"
          />
          <div>
            <h1 className="text-base font-bold text-gray-100">Symbiotic Thinking Dojo</h1>
            <span className="text-[10px] font-medium text-amber-500 uppercase tracking-wider">Beta</span>
          </div>
        </div>
      </div>

      {/* API Key Status */}
      <div className="px-4 pt-4">
        <button
          onClick={onOpenApiKeySettings}
          className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-between ${
            isApiKeySet
              ? 'text-emerald-300 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-700/50'
              : 'text-amber-300 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700/50'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            {isApiKeySet ? 'API Key Set' : 'Set API Key'}
          </span>
          {isApiKeySet ? (
            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        {!isApiKeySet && (
          <p className="text-[10px] text-amber-500/80 mt-1.5 text-center">
            Required to start chatting
          </p>
        )}
      </div>

      {/* Practice Dojo */}
      <div className="px-4 pt-4" data-tour="practice-dojo">
        <button
          onClick={onGuidedPractice}
          disabled={!isApiKeySet}
          className="w-full px-3 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 disabled:shadow-none"
        >
          <span>🥋</span>
          Practice Dojo
        </button>
        <p className="text-[10px] text-gray-500 mt-1.5 text-center">
          Guided learning experiences
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div data-tour="constructs">
          <ConstructSelector
            constructs={config.constructs}
            activeConstruct={activeConstruct}
            onSelect={onSelectConstruct}
          />
        </div>

        <div className="border-t border-gray-800 pt-4" data-tour="partners">
          <PartnerSelector
            partners={config.partners}
            activePartners={activePartners}
            onToggle={onTogglePartner}
          />
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Import error message */}
        {importError && (
          <div className="px-3 py-2 text-xs text-red-300 bg-red-900/30 border border-red-700/50 rounded-lg">
            {importError}
          </div>
        )}

        {/* Session buttons row */}
        <div className="flex gap-2">
          <button
            onClick={onNewSession}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            title="Start a new session"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            New
          </button>
          <button
            onClick={handleImportClick}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            title="Import a saved session"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
          </button>
        </div>

        <button
          onClick={onOpenConfig}
          className="w-full px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configure Prompts
        </button>
      </div>
    </aside>
  );
}
