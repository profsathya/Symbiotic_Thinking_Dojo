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
import { createWelcomeMessage, composeSystemPrompt, createPracticeDojoWelcome } from '@/lib/prompts';
import { streamGeminiChat, QuotaExceededError } from '@/lib/gemini-client';
import { parseMentions } from '@/lib/mentions';
import { ImportedSession } from '@/lib/export';
import { PracticeDojoContext, TopicConfig, Pathway, SerializedMessage } from '@/lib/practice-dojo/types';

// Default model for Gemini
const DEFAULT_MODEL = 'gemini-2.5-flash';

interface UseChatOptions {
  config: DojoConfig;
  activeConstruct: Construct;
  activePartners: SparringPartner[];
  apiKey: string | null;
  isGuidedPractice?: boolean;
  practiceDojoContext?: PracticeDojoContext | null;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  quotaRetryTime: Date | null;
  balance: BalanceState;
  dikw: DIKWState;
  isGuidedPractice: boolean;
  isImportedSession: boolean;
  sendMessage: (content: string) => Promise<void>;
  resetChat: () => void;
  startGuidedPractice: () => void;
  startPracticeDojo: (topic: TopicConfig, pathway: Pathway) => void;
  importSession: (session: ImportedSession) => void;
  getSerializedMessages: () => SerializedMessage[];
  restoreMessages: (serializedMessages: SerializedMessage[]) => void;
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Check if a response contains interactive elements (dojo-visual blocks)
function hasInteractiveElements(content: string): boolean {
  // Check for dojo-visual JSON code blocks
  if (content.includes('```dojo-visual')) {
    return true;
  }
  // Check for HTML-like elements with data-action (legacy support)
  if (/data-action\s*=/.test(content)) {
    return true;
  }
  return false;
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

export function useChat({ config, activeConstruct, activePartners, apiKey, practiceDojoContext }: UseChatOptions): UseChatReturn {
  const [isGuidedPractice, setIsGuidedPractice] = useState(false);
  const [isImportedSession, setIsImportedSession] = useState(false);

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
  const [quotaRetryTime, setQuotaRetryTime] = useState<Date | null>(null);
  const [balance, setBalance] = useState<BalanceState>(INITIAL_BALANCE_STATE);
  const [dikw, setDikw] = useState<DIKWState>(INITIAL_DIKW_STATE);
  const [consecutiveTextOnlyResponses, setConsecutiveTextOnlyResponses] = useState(0);

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
    setQuotaRetryTime(null);
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

    // Parse @ mentions from the user's message
    const { mentionedPartners } = parseMentions(content);

    // Build messages for API (skip initial welcome message)
    const apiMessages = updatedMessages.slice(1).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Compose system prompt with mentioned partners and practice dojo context
    const systemPrompt = composeSystemPrompt(config, activeConstruct, activePartners, {
      isGuidedPractice,
      mentionedPartners,
      practiceDojoContext: practiceDojoContext || undefined,
      consecutiveTextOnlyResponses,
    });

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

          // Track consecutive text-only responses for interactive element encouragement
          if (hasInteractiveElements(cleanContent)) {
            // Response has interactive elements, reset counter
            setConsecutiveTextOnlyResponses(0);
          } else {
            // Text-only response, increment counter
            setConsecutiveTextOnlyResponses(prev => prev + 1);
          }

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
          // If it's a quota error with retry time (but NOT a daily limit), show countdown
          if (err instanceof QuotaExceededError && err.retryAfterSeconds && !err.isDailyLimit) {
            const retryTime = new Date(Date.now() + err.retryAfterSeconds * 1000);
            setQuotaRetryTime(retryTime);
          } else {
            setQuotaRetryTime(null);
          }
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
  }, [messages, config, activeConstruct, activePartners, apiKey, isLoading, isGuidedPractice, practiceDojoContext]);

  const resetChat = useCallback(() => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGuidedPractice(false);
    setIsImportedSession(false);
    setMessages(getInitialMessages(false));
    setBalance(INITIAL_BALANCE_STATE);
    setDikw(INITIAL_DIKW_STATE);
    setError(null);
    setQuotaRetryTime(null);
    setConsecutiveTextOnlyResponses(0);
    setIsLoading(false);
  }, [getInitialMessages]);

  const startGuidedPractice = useCallback(() => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGuidedPractice(true);
    setIsImportedSession(false);
    setMessages(getInitialMessages(true));
    setBalance(INITIAL_BALANCE_STATE);
    setDikw(INITIAL_DIKW_STATE);
    setError(null);
    setQuotaRetryTime(null);
    setConsecutiveTextOnlyResponses(0);
    setIsLoading(false);
  }, [getInitialMessages]);

  const startPracticeDojo = useCallback((topic: TopicConfig, pathway: Pathway) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create welcome message for Practice Dojo
    const welcomeContent = createPracticeDojoWelcome(topic, pathway);
    const welcomeMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: welcomeContent,
      timestamp: new Date(),
      speaker: 'sensei',
    };

    setIsGuidedPractice(false);
    setIsImportedSession(false);
    setMessages([welcomeMessage]);
    setBalance(INITIAL_BALANCE_STATE);
    setDikw(INITIAL_DIKW_STATE);
    setError(null);
    setQuotaRetryTime(null);
    setConsecutiveTextOnlyResponses(0);
    setIsLoading(false);
  }, []);

  const importSession = useCallback((session: ImportedSession) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Add a system message indicating this is an imported session
    const importNotice: Message = {
      id: generateId(),
      role: 'assistant',
      content: `📂 **Imported Session**\n\nThis session was originally started on ${session.originalStartedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}.\n\nYou can continue the conversation from where you left off, or use \`@reflector\` to review what was discussed.`,
      timestamp: new Date(),
      speaker: 'sensei',
    };

    setIsGuidedPractice(false);
    setIsImportedSession(true);
    setMessages([...session.messages, importNotice]);
    setBalance(session.balance);
    setDikw(session.dikw);
    setError(null);
    setQuotaRetryTime(null);
    setConsecutiveTextOnlyResponses(0);
    setIsLoading(false);
  }, []);

  // Get serialized messages for Practice Dojo persistence
  const getSerializedMessages = useCallback((): SerializedMessage[] => {
    return messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      speaker: msg.speaker,
    }));
  }, [messages]);

  // Restore messages from serialized format (for Practice Dojo resume)
  const restoreMessages = useCallback((serializedMessages: SerializedMessage[]) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Convert serialized messages back to Message objects
    const restoredMessages: Message[] = serializedMessages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      speaker: msg.speaker as Message['speaker'],
    }));

    setIsGuidedPractice(false);
    setIsImportedSession(false);
    setMessages(restoredMessages);
    setError(null);
    setQuotaRetryTime(null);
    setConsecutiveTextOnlyResponses(0);
    setIsLoading(false);
    // Note: We don't reset balance/dikw as they should be calculated from the conversation
  }, []);

  return {
    messages,
    isLoading,
    error,
    quotaRetryTime,
    balance,
    dikw,
    isGuidedPractice,
    isImportedSession,
    sendMessage,
    resetChat,
    startGuidedPractice,
    startPracticeDojo,
    importSession,
    getSerializedMessages,
    restoreMessages,
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
  if (lowerContent.includes('**the reflector:**') || lowerContent.includes('the reflector:')) {
    return 'reflector';
  }

  // Default to sensei
  return 'sensei';
}
