'use client';

import { useState, useEffect } from 'react';
import { useStats } from '@/hooks/useStats';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Partner display names mapping
const PARTNER_NAMES: Record<string, string> = {
  optimist: 'Optimist',
  pessimist: 'Pessimist',
  historian: 'Historian',
  futurist: 'Futurist',
  economist: 'Economist',
  ethicist: 'Ethicist',
  innovator: 'Innovator',
  pragmatist: 'Pragmatist',
};

// Construct display names
const CONSTRUCT_NAMES: Record<string, string> = {
  learn: 'Learn',
  decide: 'Decide',
  create: 'Create',
  reflect: 'Reflect',
  debug: 'Debug',
};

// Practice Dojo topic names
const TOPIC_NAMES: Record<string, string> = {
  'symbiotic-thinking': 'Symbiotic Thinking',
  'ikigai': 'Ikigai Discovery',
  'introductory-programming': 'Intro to Programming',
  'cst-395': 'CST 395',
  'cst-349': 'CST 349',
};

export function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const { stats, isLoading, error, isEnabled, fetchStats } = useStats();
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (isOpen && isEnabled) {
      fetchStats(days);
    }
  }, [isOpen, isEnabled, days, fetchStats]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Usage Statistics</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!isEnabled ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">Stats tracking is not configured for this instance.</p>
              <p className="text-gray-500 text-sm">
                To enable stats, set the <code className="bg-gray-800 px-2 py-1 rounded">NEXT_PUBLIC_STATS_API_URL</code> environment variable.
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-400">Loading statistics...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-2">Error loading statistics</p>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Time range selector */}
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">Time range:</span>
                <div className="flex gap-2">
                  {[7, 30, 90].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDays(d)}
                      className={`px-3 py-1 rounded text-sm ${
                        days === d
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {d} days
                    </button>
                  ))}
                </div>
              </div>

              {/* Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Total Sessions"
                  value={stats.totalSessions.toString()}
                  color="emerald"
                />
                <StatCard
                  label="Avg Data Level"
                  value={stats.dikwAverages.data.toFixed(1)}
                  color="blue"
                />
                <StatCard
                  label="Avg Knowledge"
                  value={stats.dikwAverages.knowledge.toFixed(1)}
                  color="purple"
                />
                <StatCard
                  label="Avg Wisdom"
                  value={stats.dikwAverages.wisdom.toFixed(1)}
                  color="amber"
                />
              </div>

              {/* Conversation Length Distribution */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Conversation Length</h3>
                <div className="grid grid-cols-4 gap-2">
                  <DistributionBar
                    label="1-5"
                    value={stats.messageCounts['1-5']}
                    total={stats.totalSessions}
                    color="bg-emerald-500"
                  />
                  <DistributionBar
                    label="6-10"
                    value={stats.messageCounts['6-10']}
                    total={stats.totalSessions}
                    color="bg-blue-500"
                  />
                  <DistributionBar
                    label="11-20"
                    value={stats.messageCounts['11-20']}
                    total={stats.totalSessions}
                    color="bg-purple-500"
                  />
                  <DistributionBar
                    label="21+"
                    value={stats.messageCounts['21+']}
                    total={stats.totalSessions}
                    color="bg-amber-500"
                  />
                </div>
              </div>

              {/* Partner Usage */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Sparring Partner Usage</h3>
                <div className="space-y-2">
                  {Object.entries(stats.partnerUsage)
                    .sort((a, b) => b[1] - a[1])
                    .map(([partner, count]) => (
                      <UsageBar
                        key={partner}
                        label={PARTNER_NAMES[partner] || partner}
                        value={count}
                        maxValue={Math.max(...Object.values(stats.partnerUsage))}
                        color="bg-cyan-500"
                      />
                    ))}
                  {Object.keys(stats.partnerUsage).length === 0 && (
                    <p className="text-gray-500 text-sm">No partner usage data yet</p>
                  )}
                </div>
              </div>

              {/* Construct Usage */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Construct Usage</h3>
                <div className="space-y-2">
                  {Object.entries(stats.constructUsage)
                    .sort((a, b) => b[1] - a[1])
                    .map(([construct, count]) => (
                      <UsageBar
                        key={construct}
                        label={CONSTRUCT_NAMES[construct] || construct}
                        value={count}
                        maxValue={Math.max(...Object.values(stats.constructUsage))}
                        color="bg-violet-500"
                      />
                    ))}
                  {Object.keys(stats.constructUsage).length === 0 && (
                    <p className="text-gray-500 text-sm">No construct usage data yet</p>
                  )}
                </div>
              </div>

              {/* Practice Dojo Usage */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Practice Dojo Topics</h3>
                <div className="space-y-2">
                  {Object.entries(stats.practiceDojoUsage)
                    .sort((a, b) => b[1] - a[1])
                    .map(([topic, count]) => {
                      const [topicId, pathway] = topic.split(':');
                      const label = TOPIC_NAMES[topicId] || topicId;
                      const fullLabel = pathway ? `${label} (${pathway})` : label;
                      return (
                        <UsageBar
                          key={topic}
                          label={fullLabel}
                          value={count}
                          maxValue={Math.max(...Object.values(stats.practiceDojoUsage))}
                          color="bg-rose-500"
                        />
                      );
                    })}
                  {Object.keys(stats.practiceDojoUsage).length === 0 && (
                    <p className="text-gray-500 text-sm">No Practice Dojo usage data yet</p>
                  )}
                </div>
              </div>

              {/* Data Range Info */}
              <div className="text-center text-gray-500 text-sm">
                {stats.dateRange.start && stats.dateRange.end ? (
                  <p>Data from {stats.dateRange.start} to {stats.dateRange.end}</p>
                ) : (
                  <p>No data available for the selected period</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-center">
          <p className="text-gray-500 text-xs">
            All statistics are anonymous and aggregate. No personally identifiable information is collected.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper components
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses: Record<string, string> = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 text-center">
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function DistributionBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="text-center">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="h-16 bg-gray-700 rounded relative flex items-end justify-center">
        <div
          className={`${color} w-full rounded transition-all duration-300`}
          style={{ height: `${Math.max(percentage, 2)}%` }}
        />
        <span className="absolute bottom-1 text-xs font-medium text-white">
          {value}
        </span>
      </div>
      <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(0)}%</div>
    </div>
  );
}

function UsageBar({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs text-gray-300 truncate">{label}</div>
      <div className="flex-1 h-4 bg-gray-700 rounded overflow-hidden">
        <div
          className={`${color} h-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="w-10 text-xs text-gray-400 text-right">{value}</div>
    </div>
  );
}
