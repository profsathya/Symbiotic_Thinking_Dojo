'use client';

import { useState, useCallback } from 'react';
import { DIKWState, DIKWLevel } from '@/lib/types';

// Configure the stats API URL - can be overridden via environment variable
const STATS_API_URL = process.env.NEXT_PUBLIC_STATS_API_URL || '';

// Telemetry is strictly opt-in: no event leaves the browser unless the user
// has explicitly granted consent. Unset means "not asked yet" — treated the
// same as denied for sending, but it's what tells the UI to show the ask.
const CONSENT_STORAGE_KEY = 'dojo-telemetry-consent';

export type TelemetryConsent = 'granted' | 'denied' | null;

function readStoredConsent(): TelemetryConsent {
  if (typeof window === 'undefined') return null;
  try {
    const value = localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

// Read at call time (not captured at hook init) so every tracking function
// respects a consent change made in another tab or earlier in the session.
function hasConsent(): boolean {
  return readStoredConsent() === 'granted';
}

// Convert DIKWLevel to numeric score
function dikwLevelToScore(level: DIKWLevel): number {
  switch (level) {
    case 'data': return 1;
    case 'information': return 2;
    case 'knowledge': return 3;
    case 'wisdom': return 4;
    default: return 0;
  }
}

// Convert DIKWState to numeric scores (track how much time spent at each level)
function dikwStateToScores(state: DIKWState): { data: number; information: number; knowledge: number; wisdom: number } {
  // Count occurrences of each level in history
  const counts = { data: 0, information: 0, knowledge: 0, wisdom: 0 };
  for (const level of state.history) {
    counts[level]++;
  }
  // If no history, use current level
  if (state.history.length === 0) {
    counts[state.current] = 1;
  }
  return counts;
}

interface TrackEvent {
  type: 'session_end' | 'partner_invoked' | 'practice_dojo_started' | 'interaction';
  data: {
    messageCount?: number;
    dikwLevels?: { data: number; information: number; knowledge: number; wisdom: number };
    partnersUsed?: string[];
    construct?: string;
    partnerId?: string;
    topicId?: string;
    pathway?: string;
    dikwLevel?: DIKWLevel;
  };
}

interface DailyStats {
  date: string;
  sessions: number;
  messageCounts: {
    '1-5': number;
    '6-10': number;
    '11-20': number;
    '21+': number;
  };
  dikwTotals: {
    data: number;
    information: number;
    knowledge: number;
    wisdom: number;
    count: number;
  };
  partners: Record<string, number>;
  constructs: Record<string, number>;
  practiceDojoTopics: Record<string, number>;
}

export interface AggregateStats {
  totalSessions: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  messageCounts: {
    '1-5': number;
    '6-10': number;
    '11-20': number;
    '21+': number;
  };
  dikwAverages: {
    data: number;
    information: number;
    knowledge: number;
    wisdom: number;
  };
  partnerUsage: Record<string, number>;
  constructUsage: Record<string, number>;
  practiceDojoUsage: Record<string, number>;
  dailyStats: DailyStats[];
}

export function useStats() {
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Whether the stats API is configured at all (build-time constant)
  const isEnabled = !!STATS_API_URL;

  // Consent state mirrors localStorage; null = not asked yet. Lazy
  // initializer so the stored answer is picked up without an effect.
  const [consent, setConsentState] = useState<TelemetryConsent>(() => readStoredConsent());

  const setConsent = useCallback((value: 'granted' | 'denied') => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, value);
    } catch {
      // Storage unavailable — the in-memory state still governs this session.
    }
    setConsentState(value);
  }, []);

  // Track an event
  const trackEvent = useCallback(async (event: TrackEvent) => {
    if (!STATS_API_URL || !hasConsent()) {
      // Stats API not configured or user hasn't opted in — send nothing.
      return;
    }

    try {
      await fetch(`${STATS_API_URL}/.netlify/functions/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (err) {
      // Silently fail - stats tracking should not affect user experience
      console.debug('Stats tracking failed:', err);
    }
  }, []);

  // Track session end
  const trackSessionEnd = useCallback((data: {
    messageCount: number;
    dikwState: DIKWState;
    partnersUsed: string[];
    construct: string;
  }) => {
    trackEvent({
      type: 'session_end',
      data: {
        messageCount: data.messageCount,
        dikwLevels: dikwStateToScores(data.dikwState),
        partnersUsed: data.partnersUsed,
        construct: data.construct,
      },
    });
  }, [trackEvent]);

  // Track session end using sendBeacon (for page unload)
  const trackSessionEndBeacon = useCallback((data: {
    messageCount: number;
    dikwState: DIKWState;
    partnersUsed: string[];
    construct: string;
  }) => {
    if (!STATS_API_URL || !hasConsent()) return;

    const payload = JSON.stringify({
      type: 'session_end',
      data: {
        messageCount: data.messageCount,
        dikwLevels: dikwStateToScores(data.dikwState),
        partnersUsed: data.partnersUsed,
        construct: data.construct,
      },
    });

    navigator.sendBeacon(
      `${STATS_API_URL}/.netlify/functions/track`,
      payload
    );
  }, []);

  // Track partner invocation
  const trackPartnerInvoked = useCallback((partnerId: string) => {
    trackEvent({
      type: 'partner_invoked',
      data: { partnerId },
    });
  }, [trackEvent]);

  // Track user interaction (message sent)
  const trackInteraction = useCallback((dikwLevel: DIKWLevel, partnerId?: string) => {
    trackEvent({
      type: 'interaction',
      data: { dikwLevel, partnerId },
    });
  }, [trackEvent]);

  // Track Practice Dojo started
  const trackPracticeDojoStarted = useCallback((topicId: string, pathway: string) => {
    trackEvent({
      type: 'practice_dojo_started',
      data: { topicId, pathway },
    });
  }, [trackEvent]);

  // Fetch aggregate stats
  const fetchStats = useCallback(async (days: number = 30) => {
    if (!STATS_API_URL) {
      setError('Stats API not configured');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${STATS_API_URL}/.netlify/functions/stats?days=${days}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data: AggregateStats = await response.json();
      setStats(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    stats,
    isLoading,
    error,
    isEnabled,

    // Consent (null = not asked yet; nothing is sent unless 'granted')
    consent,
    setConsent,

    // Tracking functions
    trackSessionEnd,
    trackSessionEndBeacon,
    trackPartnerInvoked,
    trackInteraction,
    trackPracticeDojoStarted,

    // Fetching
    fetchStats,
  };
}
