'use client';

import { UmpireStage, Construct, SparringPartner, DojoConfig } from '@/lib/types';
import { UmpireTracker } from './UmpireTracker';

interface StatusPanelProps {
  config: DojoConfig;
  activeConstruct: Construct;
  activePartners: SparringPartner[];
  umpireStage: UmpireStage;
  onUmpireStageChange: (stage: UmpireStage) => void;
}

export function StatusPanel({
  config,
  activeConstruct,
  activePartners,
  umpireStage,
  onUmpireStageChange,
}: StatusPanelProps) {
  const construct = config.constructs.find(c => c.id === activeConstruct);
  const partners = config.partners.filter(p => activePartners.includes(p.id));

  return (
    <aside className="w-56 bg-gray-900 border-l border-gray-800 p-4 space-y-6 overflow-y-auto">
      {/* Current Status */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Current Status
        </h3>
        <div className="bg-gray-800 rounded-lg p-3 space-y-2">
          <div>
            <span className="text-xs text-gray-500">Mode</span>
            <p className="text-sm text-gray-200 font-medium">{construct?.name}</p>
          </div>
          {partners.length > 0 && (
            <div>
              <span className="text-xs text-gray-500">Active Partners</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {partners.map(p => (
                  <span
                    key={p.id}
                    className="text-base"
                    title={p.name}
                  >
                    {p.icon}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* UMPIRE Tracker */}
      <UmpireTracker
        currentStage={umpireStage}
        onStageChange={onUmpireStageChange}
      />

      {/* Tips */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Tips
        </h3>
        <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400 space-y-2">
          <p>
            <span className="text-emerald-400">•</span> The Sensei guides through questions, not answers.
          </p>
          <p>
            <span className="text-purple-400">•</span> Activate Sparring Partners to challenge specific aspects of your thinking.
          </p>
          <p>
            <span className="text-blue-400">•</span> Track your UMPIRE stage to stay oriented in the problem-solving process.
          </p>
        </div>
      </div>
    </aside>
  );
}
