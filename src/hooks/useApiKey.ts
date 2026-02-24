'use client';

import { useState, useEffect, useCallback } from 'react';
import { AIProvider } from '@/lib/providers/types';

const STORAGE_KEY_PREFIX = 'dojo_api_key_';
const PROVIDER_STORAGE_KEY = 'dojo_active_provider';

// Legacy key for migration
const LEGACY_GEMINI_KEY = 'dojo_gemini_api_key';

const ALL_PROVIDERS: AIProvider[] = ['gemini', 'groq', 'cti'];

interface UseApiKeyReturn {
  // Current active provider
  provider: AIProvider;
  setProvider: (provider: AIProvider) => void;

  // API key for current provider
  apiKey: string | null;
  isKeySet: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;

  // Get key for a specific provider (for checking if configured)
  getKeyForProvider: (provider: AIProvider) => string | null;
  hasKeyForProvider: (provider: AIProvider) => boolean;
}

export function useApiKey(): UseApiKeyReturn {
  const [provider, setProviderState] = useState<AIProvider>('gemini');
  const [keys, setKeys] = useState<Record<AIProvider, string | null>>({
    gemini: null,
    groq: null,
    cti: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      // Migrate legacy Gemini key if exists
      const legacyKey = localStorage.getItem(LEGACY_GEMINI_KEY);
      if (legacyKey) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}gemini`, legacyKey);
        localStorage.removeItem(LEGACY_GEMINI_KEY);
      }

      // Load provider preference
      const storedProvider = localStorage.getItem(PROVIDER_STORAGE_KEY) as AIProvider | null;
      if (storedProvider && ALL_PROVIDERS.includes(storedProvider)) {
        setProviderState(storedProvider);
      }

      // Load keys for all providers
      const loadedKeys: Record<AIProvider, string | null> = {
        gemini: localStorage.getItem(`${STORAGE_KEY_PREFIX}gemini`),
        groq: localStorage.getItem(`${STORAGE_KEY_PREFIX}groq`),
        cti: localStorage.getItem(`${STORAGE_KEY_PREFIX}cti`),
      };
      setKeys(loadedKeys);
    } catch (e) {
      console.warn('Failed to load API keys from localStorage:', e);
    }
    setIsLoaded(true);
  }, []);

  // Set active provider
  const setProvider = useCallback((newProvider: AIProvider) => {
    try {
      localStorage.setItem(PROVIDER_STORAGE_KEY, newProvider);
      setProviderState(newProvider);
    } catch (e) {
      console.warn('Failed to save provider preference:', e);
    }
  }, []);

  // Set API key for current provider
  const setApiKey = useCallback((key: string) => {
    try {
      if (key.trim()) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${provider}`, key.trim());
        setKeys(current => ({ ...current, [provider]: key.trim() }));
      }
    } catch (e) {
      console.warn('Failed to save API key to localStorage:', e);
    }
  }, [provider]);

  // Clear API key for current provider
  const clearApiKey = useCallback(() => {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${provider}`);
      setKeys(current => ({ ...current, [provider]: null }));
    } catch (e) {
      console.warn('Failed to clear API key from localStorage:', e);
    }
  }, [provider]);

  // Get key for a specific provider
  const getKeyForProvider = useCallback((p: AIProvider): string | null => {
    return keys[p];
  }, [keys]);

  // Check if a provider has a key configured
  const hasKeyForProvider = useCallback((p: AIProvider): boolean => {
    const key = keys[p];
    return key !== null && key.length > 0;
  }, [keys]);

  // Current provider's API key
  const apiKey = keys[provider];

  return {
    provider,
    setProvider,
    apiKey,
    isKeySet: isLoaded && apiKey !== null && apiKey.length > 0,
    setApiKey,
    clearApiKey,
    getKeyForProvider,
    hasKeyForProvider,
  };
}
