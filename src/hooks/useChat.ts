'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Message,
  DojoConfig,
  Construct,
  SparringPartner,
  BalanceState,
  INITIAL_BALANCE_STATE,
  BALANCE_MARKER_REGEX,
  DIKWState,
  DIKWLevel,
  INITIAL_DIKW_STATE,
  DIKW_MARKER_REGEX,
  DIKW_MARKER_MAP,
  DIKW_ORDER,
} from '@/lib/types';
import { createWelcomeMessage, composeSystemPrompt } from '@/lib/prompts';
import { streamGeminiChat } from '@/lib/gemini-client';

// Default model for Gemini
const DEFAULT_MODEL = 'gemini-2.5-flash';

interface UseChatOptions {
  config: DojoConfig;
  activeConstruct: Construct;
  activePartners: SparringPartner[];
  apiKey: string | null;
  isGuidedPractice?: boolean;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  balance: BalanceState;
  dikw: DIKWState;
  isGuidedPractice: boolean;
  sendMessage: (content: string) => Promise<void>;
  resetChat: () => void;
  startGuidedPractice: () => void;
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Parse balance marker from content and return the delta value
function parseBalanceMarker(content: string): number | null {
  const match = content.match(BALANCE_MARKER_REGEX);
  if (match) {
    const value = parseInt(match[1], 10);
    if (!isNaN(value) && value >= -3 && value <= 3) {
      return value;
    }
  }
  return null;
}

// Strip balance marker from content for display
function stripBalanceMarker(content: string): string {
  return content.replace(BALANCE_MARKER_REGEX, '').trim();
}

// Update balance state based on new delta
function updateBalanceState(current: BalanceState, delta: number): BalanceState {
  const newScore = Math.max(-10, Math.min(10, current.score + delta));
  const newConsecutiveConsuming = delta < 0 ? current.consecutiveConsuming + 1 : 0;

  return {
    score: newScore,
    lastDelta: delta,
    consecutiveConsuming: newConsecutiveConsuming,
    history: [...current.history, delta],
  };
}

// Parse DIKW marker from content and return the level
function parseDIKWMarker(content: string): DIKWLevel | null {
  const match = content.match(DIKW_MARKER_REGEX);
  if (match) {
    const letter = match[1].toUpperCase();
    if (letter in DIKW_MARKER_MAP) {
      return DIKW_MARKER_MAP[letter];
    }
  }
  return null;
}

// Strip DIKW marker from content for display
function stripDIKWMarker(content: string): string {
  return content.replace(DIKW_MARKER_REGEX, '').trim();
}

// Update DIKW state based on new level
function updateDIKWState(current: DIKWState, newLevel: DIKWLevel): DIKWState {
  const newOrder = DIKW_ORDER[newLevel];
  const highWaterOrder = DIKW_ORDER[current.highWaterMark];

  return {
    current: newLevel,
    highWaterMark: newOrder > highWaterOrder ? newLevel : current.highWaterMark,
    history: [...current.history, newLevel],
  };
}

export function useChat({ config, activeConstruct, activePartners, apiKey }: UseChatOptions): UseChatReturn {
  const [isGuidedPractice, setIsGuidedPractice] = useState(false);

  // Initialize with welcome message
  const getInitialMessages = useCallback((guidedPractice: boolean = false): Message[] => {
    const welcomeContent = createWelcomeMessage(activeConstruct, activePartners, config, { isGuidedPractice: guidedPractice });
    return [
      {
        id: generateId(),
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date(),
        speaker: 'sensei',
      },
    ];
  }, [activeConstruct, activePartners, config]);

  const [messages, setMessages] = useState<Message[]>(() => getInitialMessages(false));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<BalanceState>(INITIAL_BALANCE_STATE);
  const [dikw, setDikw] = useState<DIKWState>(INITIAL_DIKW_STATE);

  // Track if we should abort current request
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Check for API key
    if (!apiKey) {
      setError('Please set your Gemini API key in Settings to start chatting.');
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setError(null);
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      speaker: 'user',
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Create placeholder for assistant response
    const assistantMessageId = generateId();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      speaker: 'sensei',
    };

    setMessages([...updatedMessages, assistantMessage]);

    // Build messages for API (skip initial welcome message)
    const apiMessages = updatedMessages.slice(1).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Compose system prompt
    const systemPrompt = composeSystemPrompt(config, activeConstruct, activePartners, { isGuidedPractice });

    try {
      let accumulatedContent = '';

      await streamGeminiChat({
        apiKey,
        modelName: DEFAULT_MODEL,
        systemPrompt,
        messages: apiMessages,
        signal: abortControllerRef.current.signal,
        onChunk: (chunk) => {
          accumulatedContent += chunk;
          // Strip markers for display during streaming
          let displayContent = stripBalanceMarker(accumulatedContent);
          displayContent = stripDIKWMarker(displayContent);
          setMessages(current =>
            current.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: displayContent }
                : msg
            )
          );
        },
        onComplete: () => {
          // Parse balance marker and update balance state
          const balanceDelta = parseBalanceMarker(accumulatedContent);
          if (balanceDelta !== null) {
            setBalance(current => updateBalanceState(current, balanceDelta));
          }

          // Parse DIKW marker and update DIKW state
          const dikwLevel = parseDIKWMarker(accumulatedContent);
          if (dikwLevel !== null) {
            setDikw(current => updateDIKWState(current, dikwLevel));
          }

          // Strip markers from final content
          let cleanContent = stripBalanceMarker(accumulatedContent);
          cleanContent = stripDIKWMarker(cleanContent);

          // Determine speaker based on content
          const speaker = determineSpeaker(cleanContent, activePartners);
          setMessages(current =>
            current.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: cleanContent, speaker }
                : msg
            )
          );
        },
        onError: (err) => {
          setError(err.message);
          setMessages(current =>
            current.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: `**Error:** ${err.message}`, speaker: 'sensei' }
                : msg
            )
          );
        },
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't show error
        return;
      }
      console.error('Chat error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [messages, config, activeConstruct, activePartners, apiKey, isLoading, isGuidedPractice]);

  const resetChat = useCallback(() => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGuidedPractice(false);
    setMessages(getInitialMessages(false));
    setBalance(INITIAL_BALANCE_STATE);
    setDikw(INITIAL_DIKW_STATE);
    setError(null);
    setIsLoading(false);
  }, [getInitialMessages]);

  const startGuidedPractice = useCallback(() => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGuidedPractice(true);
    setMessages(getInitialMessages(true));
    setBalance(INITIAL_BALANCE_STATE);
    setDikw(INITIAL_DIKW_STATE);
    setError(null);
    setIsLoading(false);
  }, [getInitialMessages]);

  return {
    messages,
    isLoading,
    error,
    balance,
    dikw,
    isGuidedPractice,
    sendMessage,
    resetChat,
    startGuidedPractice,
  };
}

// Helper to determine which persona is speaking based on content
function determineSpeaker(content: string, activePartners: SparringPartner[]): Message['speaker'] {
  const lowerContent = content.toLowerCase();

  // Check for explicit speaker markers
  if (lowerContent.includes('**the framer:**') || lowerContent.includes('the framer:')) {
    return 'framer';
  }
  if (lowerContent.includes('**the auditor:**') || lowerContent.includes('the auditor:')) {
    return 'auditor';
  }
  if (lowerContent.includes('**the connector:**') || lowerContent.includes('the connector:')) {
    return 'connector';
  }
  if (lowerContent.includes('**the challenger:**') || lowerContent.includes('the challenger:')) {
    return 'challenger';
  }

  // Default to sensei
  return 'sensei';
}
