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
} from '@/lib/types';
import { createWelcomeMessage } from '@/lib/prompts';

interface UseChatOptions {
  config: DojoConfig;
  activeConstruct: Construct;
  activePartners: SparringPartner[];
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  balance: BalanceState;
  sendMessage: (content: string) => Promise<void>;
  resetChat: () => void;
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

export function useChat({ config, activeConstruct, activePartners }: UseChatOptions): UseChatReturn {
  // Initialize with welcome message
  const getInitialMessages = useCallback((): Message[] => {
    const welcomeContent = createWelcomeMessage(activeConstruct, activePartners, config);
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

  const [messages, setMessages] = useState<Message[]>(getInitialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<BalanceState>(INITIAL_BALANCE_STATE);

  // Track if we should abort current request
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

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
      speaker: 'sensei', // Default, could be updated based on content
    };

    setMessages([...updatedMessages, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          config,
          activeConstruct,
          activePartners,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulatedContent += data.content;
                // Strip balance marker for display during streaming
                const displayContent = stripBalanceMarker(accumulatedContent);
                setMessages(current =>
                  current.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: displayContent }
                      : msg
                  )
                );
              }
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      }

      // Parse balance marker and update balance state
      const balanceDelta = parseBalanceMarker(accumulatedContent);
      if (balanceDelta !== null) {
        setBalance(current => updateBalanceState(current, balanceDelta));
      }

      // Strip balance marker from final content
      const cleanContent = stripBalanceMarker(accumulatedContent);

      // Determine speaker based on content
      const speaker = determineSpeaker(cleanContent, activePartners);
      setMessages(current =>
        current.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: cleanContent, speaker }
            : msg
        )
      );

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't show error
        return;
      }
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Remove the empty assistant message on error
      setMessages(current => current.filter(msg => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
    }
  }, [messages, config, activeConstruct, activePartners, isLoading]);

  const resetChat = useCallback(() => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages(getInitialMessages());
    setBalance(INITIAL_BALANCE_STATE);
    setError(null);
    setIsLoading(false);
  }, [getInitialMessages]);

  return {
    messages,
    isLoading,
    error,
    balance,
    sendMessage,
    resetChat,
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
