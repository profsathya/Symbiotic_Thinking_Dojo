'use client';

import { useState, useCallback } from 'react';
import { AIProvider, isCommonsEnabled, isCtiEnabled } from '@/lib/providers/types';

const STORAGE_KEY_PREFIX = 'dojo_api_key_';
const PROVIDER_STORAGE_KEY = 'dojo_active_provider';

// Legacy key for migration
const LEGACY_GEMINI_KEY = 'dojo_gemini_api_key';

const ALL_PROVIDERS: AIProvider[] = ['gemini', 'groq', 'cti', 'commons'];

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

  // Set a key for a specific provider (used by URL-param auto-fill flow)
  setKeyForProvider: (provider: AIProvider, key: string) => void;
}

// Read the persisted provider preference. Resets to 'gemini' when the stored
// provider is disabled via env var (prevents users from remaining on
// Commons/CTI after they've been hidden). Runs in a lazy initializer — the
// server (no window) just gets the default.
function loadStoredProvider(): AIProvider {
  if (typeof window === 'undefined') return 'gemini';
  try {
    const storedProvider = localStorage.getItem(PROVIDER_STORAGE_KEY) as AIProvider | null;
    if (storedProvider && ALL_PROVIDERS.includes(storedProvider)) {
      const isDisabled =
        (storedProvider === 'commons' && !isCommonsEnabled()) ||
        (storedProvider === 'cti' && !isCtiEnabled());
      if (isDisabled) {
        localStorage.setItem(PROVIDER_STORAGE_KEY, 'gemini');
        return 'gemini';
      }
      return storedProvider;
    }
  } catch (e) {
    console.warn('Failed to load provider preference from localStorage:', e);
  }
  return 'gemini';
}

// Read all persisted keys, migrating the legacy Gemini key first (the
// migration is idempotent, so a double-invoked initializer is harmless).
function loadStoredKeys(): Record<AIProvider, string | null> {
  const empty: Record<AIProvider, string | null> = {
    gemini: null,
    groq: null,
    cti: null,
    commons: 'commons', // Commons doesn't need a key — always "set"
  };
  if (typeof window === 'undefined') return { ...empty, commons: null };
  try {
    const legacyKey = localStorage.getItem(LEGACY_GEMINI_KEY);
    if (legacyKey) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}gemini`, legacyKey);
      localStorage.removeItem(LEGACY_GEMINI_KEY);
    }

    return {
      gemini: localStorage.getItem(`${STORAGE_KEY_PREFIX}gemini`),
      groq: localStorage.getItem(`${STORAGE_KEY_PREFIX}groq`),
      cti: localStorage.getItem(`${STORAGE_KEY_PREFIX}cti`),
      commons: 'commons',
    };
  } catch (e) {
    console.warn('Failed to load API keys from localStorage:', e);
    return { ...empty, commons: null };
  }
}

export function useApiKey(): UseApiKeyReturn {
  const [provider, setProviderState] = useState<AIProvider>(loadStoredProvider);
  const [keys, setKeys] = useState<Record<AIProvider, string | null>>(loadStoredKeys);
  // With lazy initializers the client is loaded from the first render; only
  // the server (no localStorage) reports not-loaded.
  const [isLoaded] = useState(() => typeof window !== 'undefined');

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

  // Set a key for a specific provider (independent of which provider is active).
  // Used by the URL-param auto-fill flow so a shared link can drop a key into
  // the CTI slot without first switching the active provider.
  const setKeyForProvider = useCallback((p: AIProvider, key: string) => {
    const trimmed = key.trim();
    if (!trimmed) return;
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${p}`, trimmed);
      setKeys(current => ({ ...current, [p]: trimmed }));
    } catch (e) {
      console.warn('Failed to save API key to localStorage:', e);
    }
  }, []);

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
    setKeyForProvider,
  };
}
