import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

/**
 * Public statistics endpoint
 *
 * Returns aggregate anonymous usage statistics.
 * This data is intentionally public and transparent.
 */

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

interface AggregateStats {
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

export default async function handler(req: Request, context: Context) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const store = getStore('dojo-stats');
    const url = new URL(req.url);

    // Optional query params for filtering
    const daysParam = url.searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 30; // Default to last 30 days

    // Get list of dates
    let dateList: string[];
    try {
      dateList = await store.get('_dates', { type: 'json' }) as string[] || [];
    } catch {
      dateList = [];
    }

    // Filter to requested number of days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const filteredDates = dateList.filter(d => d >= cutoffStr);

    // Fetch all daily stats
    const dailyStatsPromises = filteredDates.map(async (date) => {
      try {
        return await store.get(date, { type: 'json' }) as DailyStats;
      } catch {
        return null;
      }
    });

    const dailyStatsResults = await Promise.all(dailyStatsPromises);
    const dailyStats = dailyStatsResults.filter((s): s is DailyStats => s !== null);

    // Compute aggregates
    const aggregate: AggregateStats = {
      totalSessions: 0,
      dateRange: {
        start: filteredDates.length > 0 ? filteredDates[0] : null,
        end: filteredDates.length > 0 ? filteredDates[filteredDates.length - 1] : null,
      },
      messageCounts: { '1-5': 0, '6-10': 0, '11-20': 0, '21+': 0 },
      dikwAverages: { data: 0, information: 0, knowledge: 0, wisdom: 0 },
      partnerUsage: {},
      constructUsage: {},
      practiceDojoUsage: {},
      dailyStats,
    };

    let totalDikwCount = 0;
    const dikwTotals = { data: 0, information: 0, knowledge: 0, wisdom: 0 };

    for (const day of dailyStats) {
      aggregate.totalSessions += day.sessions;

      // Sum message counts
      aggregate.messageCounts['1-5'] += day.messageCounts['1-5'];
      aggregate.messageCounts['6-10'] += day.messageCounts['6-10'];
      aggregate.messageCounts['11-20'] += day.messageCounts['11-20'];
      aggregate.messageCounts['21+'] += day.messageCounts['21+'];

      // Sum DIKW totals
      dikwTotals.data += day.dikwTotals.data;
      dikwTotals.information += day.dikwTotals.information;
      dikwTotals.knowledge += day.dikwTotals.knowledge;
      dikwTotals.wisdom += day.dikwTotals.wisdom;
      totalDikwCount += day.dikwTotals.count;

      // Merge partner usage
      for (const [partner, count] of Object.entries(day.partners)) {
        aggregate.partnerUsage[partner] = (aggregate.partnerUsage[partner] || 0) + count;
      }

      // Merge construct usage
      for (const [construct, count] of Object.entries(day.constructs)) {
        aggregate.constructUsage[construct] = (aggregate.constructUsage[construct] || 0) + count;
      }

      // Merge Practice Dojo usage
      for (const [topic, count] of Object.entries(day.practiceDojoTopics)) {
        aggregate.practiceDojoUsage[topic] = (aggregate.practiceDojoUsage[topic] || 0) + count;
      }
    }

    // Calculate DIKW averages
    if (totalDikwCount > 0) {
      aggregate.dikwAverages = {
        data: Math.round((dikwTotals.data / totalDikwCount) * 10) / 10,
        information: Math.round((dikwTotals.information / totalDikwCount) * 10) / 10,
        knowledge: Math.round((dikwTotals.knowledge / totalDikwCount) * 10) / 10,
        wisdom: Math.round((dikwTotals.wisdom / totalDikwCount) * 10) / 10,
      };
    }

    return new Response(JSON.stringify(aggregate), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
