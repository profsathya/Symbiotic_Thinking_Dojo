'use client';

import Image from 'next/image';
import { Construct, SparringPartner, DojoConfig } from '@/lib/types';
import { ConstructSelector } from './ConstructSelector';
import { PartnerSelector } from './PartnerSelector';

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
}: SidebarProps) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
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

      {/* Guided Practice */}
      <div className="px-4 pt-4">
        <button
          onClick={onGuidedPractice}
          disabled={!isApiKeySet}
          className="w-full px-3 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 disabled:shadow-none"
        >
          <span>🧭</span>
          Guided Practice
        </button>
        <p className="text-[10px] text-gray-500 mt-1.5 text-center">
          Discover your ikigai through reflection
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <ConstructSelector
          constructs={config.constructs}
          activeConstruct={activeConstruct}
          onSelect={onSelectConstruct}
        />

        <div className="border-t border-gray-800 pt-4">
          <PartnerSelector
            partners={config.partners}
            activePartners={activePartners}
            onToggle={onTogglePartner}
          />
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <button
          onClick={onNewSession}
          className="w-full px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>↻</span>
          New Session
        </button>
        <button
          onClick={onOpenConfig}
          className="w-full px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>⚙</span>
          Configure Prompts
        </button>
      </div>
    </aside>
  );
}
