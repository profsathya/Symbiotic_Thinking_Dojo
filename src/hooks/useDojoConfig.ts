'use client';

import { useState, useCallback } from 'react';
import {
  DojoConfig,
  Construct,
  SparringPartner,
  UmpireStage,
} from '@/lib/types';
import { DEFAULT_DOJO_CONFIG } from '@/lib/prompts';

// Represents an available LLM model
export interface Model {
  id: string; // The unique model ID used by the API
  name: string; // The user-friendly display name
  provider: 'claude' | 'gemini' | 'openai';
  isDefault?: boolean; // To mark the default model
}

// Mapping from simplified provider ID to the actual model name for the API
export const MODEL_ID_MAP: Record<string, string> = {
  claude: 'claude-sonnet-4-5-20250929',
  gemini: 'gemini-2.5-pro',
};

// Simplified list of available models for the user to choose from in the UI
export const AVAILABLE_MODELS: Model[] = [
  { id: 'claude', name: 'Claude', provider: 'claude', isDefault: true },
  { id: 'gemini', name: 'Gemini', provider: 'gemini' },
];

const defaultModelId = AVAILABLE_MODELS.find(m => m.isDefault)?.id || AVAILABLE_MODELS[0].id;

interface UseDojoConfigReturn {
  // Current configuration
  config: DojoConfig;

  // Active selections
  activeConstruct: Construct;
  activePartners: SparringPartner[];
  umpireStage: UmpireStage;
  activeModel: string;
  availableModels: Model[];

  // Selection actions
  setActiveConstruct: (construct: Construct) => void;
  togglePartner: (partner: SparringPartner) => void;
  setUmpireStage: (stage: UmpireStage) => void;
  setActiveModel: (modelId: string) => void;

  // Config modification actions
  updateDojoPrompt: (prompt: string) => void;
  updateSenseiPrompt: (prompt: string) => void;
  updateIkigaiPrompt: (prompt: string) => void;
  updateConstructPrompt: (id: Construct, prompt: string) => void;
  updatePartnerPrompt: (id: SparringPartner, prompt: string) => void;
  updatePartnerName: (id: SparringPartner, name: string) => void;
  updatePartnerDescription: (id: SparringPartner, description: string) => void;
  updateConstructName: (id: Construct, name: string) => void;
  updateConstructDescription: (id: Construct, description: string) => void;

  // Reset actions
  resetToDefaults: () => void;
  resetDojoPrompt: () => void;
  resetSenseiPrompt: () => void;
  resetIkigaiPrompt: () => void;
  resetConstructPrompt: (id: Construct) => void;
  resetPartnerPrompt: (id: SparringPartner) => void;
}

export function useDojoConfig(): UseDojoConfigReturn {
  // Configuration state
  const [config, setConfig] = useState<DojoConfig>(DEFAULT_DOJO_CONFIG);

  // Active selections
  const [activeConstruct, setActiveConstruct] = useState<Construct>('learn');
  const [activePartners, setActivePartners] = useState<SparringPartner[]>([]);
  const [umpireStage, setUmpireStage] = useState<UmpireStage>('understand');
  const [activeModel, setActiveModel] = useState<string>(defaultModelId);

  // Toggle a sparring partner on/off
  const togglePartner = useCallback((partner: SparringPartner) => {
    setActivePartners(current =>
      current.includes(partner)
        ? current.filter(p => p !== partner)
        : [...current, partner]
    );
  }, []);

  // Update Dojo philosophy prompt
  const updateDojoPrompt = useCallback((prompt: string) => {
    setConfig(current => ({ ...current, dojoPrompt: prompt }));
  }, []);

  // Update Sensei prompt
  const updateSenseiPrompt = useCallback((prompt: string) => {
    setConfig(current => ({ ...current, senseiPrompt: prompt }));
  }, []);

  // Update Ikigai prompt
  const updateIkigaiPrompt = useCallback((prompt: string) => {
    setConfig(current => ({ ...current, ikigaiPrompt: prompt }));
  }, []);

  // Update a construct's prompt
  const updateConstructPrompt = useCallback((id: Construct, prompt: string) => {
    setConfig(current => ({
      ...current,
      constructs: current.constructs.map(c =>
        c.id === id ? { ...c, prompt } : c
      ),
    }));
  }, []);

  // Update a construct's name
  const updateConstructName = useCallback((id: Construct, name: string) => {
    setConfig(current => ({
      ...current,
      constructs: current.constructs.map(c =>
        c.id === id ? { ...c, name } : c
      ),
    }));
  }, []);

  // Update a construct's description
  const updateConstructDescription = useCallback((id: Construct, description: string) => {
    setConfig(current => ({
      ...current,
      constructs: current.constructs.map(c =>
        c.id === id ? { ...c, description } : c
      ),
    }));
  }, []);

  // Update a partner's prompt
  const updatePartnerPrompt = useCallback((id: SparringPartner, prompt: string) => {
    setConfig(current => ({
      ...current,
      partners: current.partners.map(p =>
        p.id === id ? { ...p, prompt } : p
      ),
    }));
  }, []);

  // Update a partner's name
  const updatePartnerName = useCallback((id: SparringPartner, name: string) => {
    setConfig(current => ({
      ...current,
      partners: current.partners.map(p =>
        p.id === id ? { ...p, name } : p
      ),
    }));
  }, []);

  // Update a partner's description
  const updatePartnerDescription = useCallback((id: SparringPartner, description: string) => {
    setConfig(current => ({
      ...current,
      partners: current.partners.map(p =>
        p.id === id ? { ...p, description } : p
      ),
    }));
  }, []);

  // Reset all to defaults
  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_DOJO_CONFIG);
  }, []);

  // Reset individual prompts
  const resetDojoPrompt = useCallback(() => {
    setConfig(current => ({
      ...current,
      dojoPrompt: DEFAULT_DOJO_CONFIG.dojoPrompt,
    }));
  }, []);

  const resetSenseiPrompt = useCallback(() => {
    setConfig(current => ({
      ...current,
      senseiPrompt: DEFAULT_DOJO_CONFIG.senseiPrompt,
    }));
  }, []);

  const resetIkigaiPrompt = useCallback(() => {
    setConfig(current => ({
      ...current,
      ikigaiPrompt: DEFAULT_DOJO_CONFIG.ikigaiPrompt,
    }));
  }, []);

  const resetConstructPrompt = useCallback((id: Construct) => {
    const defaultConstruct = DEFAULT_DOJO_CONFIG.constructs.find(c => c.id === id);
    if (defaultConstruct) {
      setConfig(current => ({
        ...current,
        constructs: current.constructs.map(c =>
          c.id === id ? { ...defaultConstruct } : c
        ),
      }));
    }
  }, []);

  const resetPartnerPrompt = useCallback((id: SparringPartner) => {
    const defaultPartner = DEFAULT_DOJO_CONFIG.partners.find(p => p.id === id);
    if (defaultPartner) {
      setConfig(current => ({
        ...current,
        partners: current.partners.map(p =>
          p.id === id ? { ...defaultPartner } : p
        ),
      }));
    }
  }, []);

  return {
    config,
    activeConstruct,
    activePartners,
    umpireStage,
    activeModel,
    availableModels: AVAILABLE_MODELS,
    setActiveConstruct,
    togglePartner,
    setUmpireStage,
    setActiveModel,
    updateDojoPrompt,
    updateSenseiPrompt,
    updateIkigaiPrompt,
    updateConstructPrompt,
    updatePartnerPrompt,
    updatePartnerName,
    updatePartnerDescription,
    updateConstructName,
    updateConstructDescription,
    resetToDefaults,
    resetDojoPrompt,
    resetSenseiPrompt,
    resetIkigaiPrompt,
    resetConstructPrompt,
    resetPartnerPrompt,
  };
}
