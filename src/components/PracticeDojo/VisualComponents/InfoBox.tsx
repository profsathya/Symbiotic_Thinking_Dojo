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
  // `aside` is a quiet research-note variant: muted, narrower, set to the side
  // so it can be glanced at without breaking flow.
  if (data.style === 'aside') {
    return (
      <aside className="my-3 ml-auto max-w-md border-l-2 border-slate-500/50 bg-slate-800/40 px-3 py-2 text-slate-300/80">
        <div className="flex items-start gap-2">
          <span className="text-xs text-slate-400 mt-0.5">🔬</span>
          <div className="flex-1 min-w-0">
            {data.title && (
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-1">
                {data.title}
              </div>
            )}
            <div className="text-xs italic whitespace-pre-wrap leading-relaxed">
              {data.content}
            </div>
          </div>
        </div>
      </aside>
    );
  }

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
