'use client';

import { useState } from 'react';
import { DojoConfig, Construct, SparringPartner } from '@/lib/types';
import { ConfigTabs } from './ConfigTabs';
import { PromptEditor } from './PromptEditor';
import { Accordion, AccordionItem } from './Accordion';

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: DojoConfig;
  onUpdateDojoPrompt: (prompt: string) => void;
  onUpdateSenseiPrompt: (prompt: string) => void;
  onUpdateConstructPrompt: (id: Construct, prompt: string) => void;
  onUpdatePartnerPrompt: (id: SparringPartner, prompt: string) => void;
  onResetDojoPrompt: () => void;
  onResetSenseiPrompt: () => void;
  onResetConstructPrompt: (id: Construct) => void;
  onResetPartnerPrompt: (id: SparringPartner) => void;
  onResetAll: () => void;
}

export function ConfigPanel({
  isOpen,
  onClose,
  config,
  onUpdateDojoPrompt,
  onUpdateSenseiPrompt,
  onUpdateConstructPrompt,
  onUpdatePartnerPrompt,
  onResetDojoPrompt,
  onResetSenseiPrompt,
  onResetConstructPrompt,
  onResetPartnerPrompt,
  onResetAll,
}: ConfigPanelProps) {
  const [activeTab, setActiveTab] = useState('dojo');
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());

  const toggleAccordion = (id: string) => {
    setOpenAccordions(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100">
            Dojo Configuration
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={onResetAll}
              className="text-sm px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
            >
              Reset All
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 text-2xl leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Tabs */}
        <ConfigTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dojo' && (
            <PromptEditor
              label="Dojo Philosophy Prompt"
              description="The foundational framework that establishes UMPIRE, 3Cs, and core principles."
              value={config.dojoPrompt}
              onChange={onUpdateDojoPrompt}
              onReset={onResetDojoPrompt}
            />
          )}

          {activeTab === 'sensei' && (
            <PromptEditor
              label="Sensei Behavior Prompt"
              description="Defines how the Sensei guides through questions and metacognitive coaching."
              value={config.senseiPrompt}
              onChange={onUpdateSenseiPrompt}
              onReset={onResetSenseiPrompt}
            />
          )}

          {activeTab === 'constructs' && (
            <Accordion>
              {config.constructs.map(construct => (
                <AccordionItem
                  key={construct.id}
                  title={construct.name}
                  description={construct.description}
                  isOpen={openAccordions.has(construct.id)}
                  onToggle={() => toggleAccordion(construct.id)}
                  onReset={() => onResetConstructPrompt(construct.id)}
                >
                  <textarea
                    value={construct.prompt}
                    onChange={e => onUpdateConstructPrompt(construct.id, e.target.value)}
                    className="w-full h-48 p-3 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {activeTab === 'partners' && (
            <Accordion>
              {config.partners.map(partner => (
                <AccordionItem
                  key={partner.id}
                  title={`${partner.icon} ${partner.name}`}
                  description={partner.description}
                  isOpen={openAccordions.has(partner.id)}
                  onToggle={() => toggleAccordion(partner.id)}
                  onReset={() => onResetPartnerPrompt(partner.id)}
                >
                  <textarea
                    value={partner.prompt}
                    onChange={e => onUpdatePartnerPrompt(partner.id, e.target.value)}
                    className="w-full h-48 p-3 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
