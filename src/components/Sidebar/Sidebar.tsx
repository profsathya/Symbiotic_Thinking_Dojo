'use client';

import Image from 'next/image';
import { Construct, SparringPartner, DojoConfig } from '@/lib/types';
import { Model } from '@/hooks/useDojoConfig';
import { ConstructSelector } from './ConstructSelector';
import { PartnerSelector } from './PartnerSelector';
import { ModelSelector } from './ModelSelector';

interface SidebarProps {
  config: DojoConfig;
  activeConstruct: Construct;
  activePartners: SparringPartner[];
  activeModel: string;
  availableModels: Model[];
  onSelectConstruct: (construct: Construct) => void;
  onTogglePartner: (partner: SparringPartner) => void;
  onSelectModel: (modelId: string) => void;
  onOpenConfig: () => void;
  onNewSession: () => void;
  onGuidedPractice: () => void;
}

export function Sidebar({
  config,
  activeConstruct,
  activePartners,
  activeModel,
  availableModels,
  onSelectConstruct,
  onTogglePartner,
  onSelectModel,
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

      {/* Guided Practice */}
      <div className="px-4 pt-4">
        <button
          onClick={onGuidedPractice}
          className="w-full px-3 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
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
        <ModelSelector
          activeModel={activeModel}
          availableModels={availableModels}
          setActiveModel={onSelectModel}
        />

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
