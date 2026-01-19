'use client';

import { InfoBoxData } from '@/lib/practice-dojo/types';

interface InfoBoxProps {
  data: InfoBoxData;
}

const STYLE_CONFIG = {
  reveal: {
    bg: 'bg-purple-900/30',
    border: 'border-purple-700/50',
    icon: '⚡',
    iconColor: 'text-purple-400',
    titleColor: 'text-purple-300',
    contentColor: 'text-purple-200/90',
  },
  insight: {
    bg: 'bg-amber-900/30',
    border: 'border-amber-700/50',
    icon: '💡',
    iconColor: 'text-amber-400',
    titleColor: 'text-amber-300',
    contentColor: 'text-amber-200/90',
  },
  summary: {
    bg: 'bg-emerald-900/30',
    border: 'border-emerald-700/50',
    icon: '📋',
    iconColor: 'text-emerald-400',
    titleColor: 'text-emerald-300',
    contentColor: 'text-emerald-200/90',
  },
  warning: {
    bg: 'bg-red-900/30',
    border: 'border-red-700/50',
    icon: '⚠️',
    iconColor: 'text-red-400',
    titleColor: 'text-red-300',
    contentColor: 'text-red-200/90',
  },
};

export function InfoBox({ data }: InfoBoxProps) {
  const config = STYLE_CONFIG[data.style];

  return (
    <div className={`my-4 rounded-lg border ${config.bg} ${config.border} p-4`}>
      <div className="flex items-start gap-3">
        <span className={`text-xl ${config.iconColor}`}>{config.icon}</span>
        <div className="flex-1 min-w-0">
          {data.title && (
            <h4 className={`font-semibold ${config.titleColor} mb-2`}>{data.title}</h4>
          )}
          <div className={`text-sm ${config.contentColor} whitespace-pre-wrap`}>
            {data.content}
          </div>
        </div>
      </div>
    </div>
  );
}
