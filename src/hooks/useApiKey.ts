'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'dojo_gemini_api_key';

interface UseApiKeyReturn {
  apiKey: string | null;
  isKeySet: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
}

export function useApiKey(): UseApiKeyReturn {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    try {
      const storedKey = localStorage.getItem(STORAGE_KEY);
      if (storedKey) {
        setApiKeyState(storedKey);
      }
    } catch (e) {
      console.warn('Failed to load API key from localStorage:', e);
    }
    setIsLoaded(true);
  }, []);

  const setApiKey = useCallback((key: string) => {
    try {
      if (key.trim()) {
        localStorage.setItem(STORAGE_KEY, key.trim());
        setApiKeyState(key.trim());
      }
    } catch (e) {
      console.warn('Failed to save API key to localStorage:', e);
    }
  }, []);

  const clearApiKey = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setApiKeyState(null);
    } catch (e) {
      console.warn('Failed to clear API key from localStorage:', e);
    }
  }, []);

  return {
    apiKey,
    isKeySet: isLoaded && apiKey !== null && apiKey.length > 0,
    setApiKey,
    clearApiKey,
  };
}
