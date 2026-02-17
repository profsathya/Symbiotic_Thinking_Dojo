import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

/**
 * Anonymous usage statistics tracking endpoint
 *
 * Tracks aggregate counters only - no personally identifiable information.
 * Data stored:
 * - Daily session counts
 * - Conversation length distribution (buckets: 1-5, 6-10, 11-20, 21+)
 * - DIKW level distribution
 * - Sparring partner usage counts
 * - Practice Dojo topic usage
 * - Construct usage (Learn, Decide, Create, etc.)
 */

interface TrackEvent {
  type: 'session_end' | 'partner_invoked' | 'practice_dojo_started';
  data: {
    // For session_end
    messageCount?: number;
    dikwLevels?: { data: number; information: number; knowledge: number; wisdom: number };
    partnersUsed?: string[];
    construct?: string;

    // For partner_invoked
    partnerId?: string;

    // For practice_dojo_started
    topicId?: string;
    pathway?: string;
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
    count: number; // For computing averages
  };
  partners: Record<string, number>;
  constructs: Record<string, number>;
  practiceDojoTopics: Record<string, number>;
}

function getMessageCountBucket(count: number): keyof DailyStats['messageCounts'] {
  if (count <= 5) return '1-5';
  if (count <= 10) return '6-10';
  if (count <= 20) return '11-20';
  return '21+';
}

function getDateKey(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function createEmptyDailyStats(date: string): DailyStats {
  return {
    date,
    sessions: 0,
    messageCounts: { '1-5': 0, '6-10': 0, '11-20': 0, '21+': 0 },
    dikwTotals: { data: 0, information: 0, knowledge: 0, wisdom: 0, count: 0 },
    partners: {},
    constructs: {},
    practiceDojoTopics: {},
  };
}

export default async function handler(req: Request, context: Context) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const event: TrackEvent = await req.json();
    const store = getStore('dojo-stats');
    const dateKey = getDateKey();

    // Get or create daily stats
    let dailyStats: DailyStats;
    try {
      const existing = await store.get(dateKey, { type: 'json' });
      dailyStats = existing as DailyStats || createEmptyDailyStats(dateKey);
    } catch {
      dailyStats = createEmptyDailyStats(dateKey);
    }

    // Process the event
    switch (event.type) {
      case 'session_end': {
        dailyStats.sessions++;

        // Track message count distribution
        if (event.data.messageCount) {
          const bucket = getMessageCountBucket(event.data.messageCount);
          dailyStats.messageCounts[bucket]++;
        }

        // Track DIKW levels
        if (event.data.dikwLevels) {
          dailyStats.dikwTotals.data += event.data.dikwLevels.data;
          dailyStats.dikwTotals.information += event.data.dikwLevels.information;
          dailyStats.dikwTotals.knowledge += event.data.dikwLevels.knowledge;
          dailyStats.dikwTotals.wisdom += event.data.dikwLevels.wisdom;
          dailyStats.dikwTotals.count++;
        }

        // Track partners used in session
        if (event.data.partnersUsed) {
          for (const partner of event.data.partnersUsed) {
            dailyStats.partners[partner] = (dailyStats.partners[partner] || 0) + 1;
          }
        }

        // Track construct used
        if (event.data.construct) {
          dailyStats.constructs[event.data.construct] =
            (dailyStats.constructs[event.data.construct] || 0) + 1;
        }
        break;
      }

      case 'partner_invoked': {
        if (event.data.partnerId) {
          dailyStats.partners[event.data.partnerId] =
            (dailyStats.partners[event.data.partnerId] || 0) + 1;
        }
        break;
      }

      case 'practice_dojo_started': {
        if (event.data.topicId) {
          const key = event.data.pathway
            ? `${event.data.topicId}:${event.data.pathway}`
            : event.data.topicId;
          dailyStats.practiceDojoTopics[key] =
            (dailyStats.practiceDojoTopics[key] || 0) + 1;
        }
        break;
      }
    }

    // Save updated stats
    await store.setJSON(dateKey, dailyStats);

    // Also update the list of dates we have data for
    let dateList: string[];
    try {
      dateList = await store.get('_dates', { type: 'json' }) as string[] || [];
    } catch {
      dateList = [];
    }

    if (!dateList.includes(dateKey)) {
      dateList.push(dateKey);
      dateList.sort(); // Keep sorted
      await store.setJSON('_dates', dateList);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error tracking stats:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
