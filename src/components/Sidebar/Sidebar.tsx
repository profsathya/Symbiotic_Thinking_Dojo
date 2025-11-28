'use client';

import Image from 'next/image';
import { Construct, SparringPartner, DojoConfig } from '@/lib/types';
import { ConstructSelector } from './ConstructSelector';
import { PartnerSelector } from './PartnerSelector';

interface SidebarProps {
  config: DojoConfig;
  activeConstruct: Construct;
  activePartners: SparringPartner[];
  onSelectConstruct: (construct: Construct) => void;
  onTogglePartner: (partner: SparringPartner) => void;
  onOpenConfig: () => void;
  onNewSession: () => void;
}

export function Sidebar({
  config,
  activeConstruct,
  activePartners,
  onSelectConstruct,
  onTogglePartner,
  onOpenConfig,
  onNewSession,
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
          </div>
        </div>
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
