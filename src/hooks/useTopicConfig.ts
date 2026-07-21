'use client';

import { useState, useEffect, useCallback } from 'react';
import { TopicConfig, PhaseConfig } from '@/lib/practice-dojo/types';
import { getTopicById } from '@/lib/practice-dojo/topics';

const STORAGE_KEY = 'dojo_custom_topics';

// What we store per topic - just the customized phases
export interface CustomTopicConfig {
  topicId: string;
  phases: Record<number, Partial<PhaseConfig>>; // phaseId -> customized fields
  lastModified: string;
}

interface CustomTopicsState {
  topics: Record<string, CustomTopicConfig>;
}

export function useTopicConfig() {
  const [customTopics, setCustomTopics] = useState<CustomTopicsState>({ topics: {} });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCustomTopics(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load custom topics:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customTopics));
      } catch (e) {
        console.error('Failed to save custom topics:', e);
      }
    }
  }, [customTopics, isLoaded]);

  // Get a topic with custom overrides applied
  const getTopicWithCustomizations = useCallback((topicId: string): TopicConfig | null => {
    const baseTopic = getTopicById(topicId);
    if (!baseTopic) return null;

    const customConfig = customTopics.topics[topicId];
    if (!customConfig) return baseTopic;

    // Apply customizations to phases
    const customizedPhases = baseTopic.phases.map(phase => {
      const customPhase = customConfig.phases[phase.phaseId];
      if (!customPhase) return phase;
      return { ...phase, ...customPhase };
    });

    return { ...baseTopic, phases: customizedPhases };
  }, [customTopics]);

  // Update a specific phase's field
  const updatePhase = useCallback((
    topicId: string,
    phaseId: number,
    field: keyof PhaseConfig,
    value: string
  ) => {
    setCustomTopics(prev => {
      const existingTopic = prev.topics[topicId] || {
        topicId,
        phases: {},
        lastModified: new Date().toISOString(),
      };

      return {
        topics: {
          ...prev.topics,
          [topicId]: {
            ...existingTopic,
            phases: {
              ...existingTopic.phases,
              [phaseId]: {
                ...existingTopic.phases[phaseId],
                [field]: value,
              },
            },
            lastModified: new Date().toISOString(),
          },
        },
      };
    });
  }, []);

  // Reset a specific phase to default
  const resetPhase = useCallback((topicId: string, phaseId: number) => {
    setCustomTopics(prev => {
      const existingTopic = prev.topics[topicId];
      if (!existingTopic) return prev;

      const newPhases = { ...existingTopic.phases };
      delete newPhases[phaseId];

      // If no more customizations, remove the topic entirely
      if (Object.keys(newPhases).length === 0) {
        const { [topicId]: _, ...remaining } = prev.topics;
        return { topics: remaining };
      }

      return {
        topics: {
          ...prev.topics,
          [topicId]: {
            ...existingTopic,
            phases: newPhases,
            lastModified: new Date().toISOString(),
          },
        },
      };
    });
  }, []);

  // Reset entire topic to default
  const resetTopic = useCallback((topicId: string) => {
    setCustomTopics(prev => {
      const { [topicId]: _, ...remaining } = prev.topics;
      return { topics: remaining };
    });
  }, []);

  // Check if a phase has customizations
  const hasPhaseCustomization = useCallback((topicId: string, phaseId: number): boolean => {
    return !!(customTopics.topics[topicId]?.phases[phaseId]);
  }, [customTopics]);

  // Check if topic has any customizations
  const hasTopicCustomization = useCallback((topicId: string): boolean => {
    const topic = customTopics.topics[topicId];
    return !!(topic && Object.keys(topic.phases).length > 0);
  }, [customTopics]);

  // Export topic config as JSON
  const exportTopic = useCallback((topicId: string): string => {
    const topic = getTopicWithCustomizations(topicId);
    if (!topic) return '';

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      topic: {
        topicId: topic.topicId,
        title: topic.title,
        phases: topic.phases.map(p => ({
          phaseId: p.phaseId,
          title: p.title,
          purpose: p.purpose,
          contentGuidance: p.contentGuidance,
          checkpointCriteria: p.checkpointCriteria,
        })),
      },
    };

    return JSON.stringify(exportData, null, 2);
  }, [getTopicWithCustomizations]);

  // Import topic config from JSON
  const importTopic = useCallback((jsonString: string): { success: boolean; error?: string } => {
    try {
      const data = JSON.parse(jsonString);

      if (!data.version || !data.topic || !data.topic.topicId) {
        return { success: false, error: 'Invalid format: missing required fields' };
      }

      const baseTopic = getTopicById(data.topic.topicId);
      if (!baseTopic) {
        return { success: false, error: `Unknown topic: ${data.topic.topicId}` };
      }

      // Build customizations by comparing to base
      const phases: Record<number, Partial<PhaseConfig>> = {};

      for (const importedPhase of data.topic.phases) {
        const basePhase = baseTopic.phases.find(p => p.phaseId === importedPhase.phaseId);
        if (!basePhase) continue;

        const customizations: Partial<PhaseConfig> = {};
        if (importedPhase.purpose !== basePhase.purpose) {
          customizations.purpose = importedPhase.purpose;
        }
        if (importedPhase.contentGuidance !== basePhase.contentGuidance) {
          customizations.contentGuidance = importedPhase.contentGuidance;
        }
        if (importedPhase.checkpointCriteria !== basePhase.checkpointCriteria) {
          customizations.checkpointCriteria = importedPhase.checkpointCriteria;
        }

        if (Object.keys(customizations).length > 0) {
          phases[importedPhase.phaseId] = customizations;
        }
      }

      if (Object.keys(phases).length > 0) {
        setCustomTopics(prev => ({
          topics: {
            ...prev.topics,
            [data.topic.topicId]: {
              topicId: data.topic.topicId,
              phases,
              lastModified: new Date().toISOString(),
            },
          },
        }));
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Invalid JSON format' };
    }
  }, []);

  return {
    isLoaded,
    getTopicWithCustomizations,
    updatePhase,
    resetPhase,
    resetTopic,
    hasPhaseCustomization,
    hasTopicCustomization,
    exportTopic,
    importTopic,
  };
}
