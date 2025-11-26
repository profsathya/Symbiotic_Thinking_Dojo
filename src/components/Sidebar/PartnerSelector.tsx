'use client';

import { SparringPartner, PartnerConfig } from '@/lib/types';

interface PartnerSelectorProps {
  partners: PartnerConfig[];
  activePartners: SparringPartner[];
  onToggle: (partner: SparringPartner) => void;
}

export function PartnerSelector({
  partners,
  activePartners,
  onToggle,
}: PartnerSelectorProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Sparring Partners
      </h3>
      <div className="space-y-1">
        {partners.map(partner => {
          const isActive = activePartners.includes(partner.id);
          return (
            <button
              key={partner.id}
              onClick={() => onToggle(partner.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
              title={partner.description}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                    isActive
                      ? 'bg-purple-600 border-purple-500'
                      : 'border-gray-600'
                  }`}
                >
                  {isActive && '✓'}
                </span>
                <span className="text-base">{partner.icon}</span>
                <span className="text-sm font-medium">{partner.name}</span>
              </div>
            </button>
          );
        })}
      </div>
      {activePartners.length > 0 && (
        <p className="text-xs text-gray-500 px-3">
          {activePartners.length} partner{activePartners.length > 1 ? 's' : ''} active
        </p>
      )}
    </div>
  );
}
