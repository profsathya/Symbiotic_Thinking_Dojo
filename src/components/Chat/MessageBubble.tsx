'use client';

import { Message, Speaker } from '@/lib/types';

interface MessageBubbleProps {
  message: Message;
}

const SPEAKER_STYLES: Record<Speaker, { bg: string; border: string; label: string; icon: string }> = {
  user: {
    bg: 'bg-blue-600/20',
    border: 'border-blue-500/30',
    label: 'You',
    icon: '👤',
  },
  sensei: {
    bg: 'bg-emerald-600/20',
    border: 'border-emerald-500/30',
    label: 'Sensei',
    icon: '🥋',
  },
  framer: {
    bg: 'bg-amber-600/20',
    border: 'border-amber-500/30',
    label: 'The Framer',
    icon: '🖼️',
  },
  auditor: {
    bg: 'bg-cyan-600/20',
    border: 'border-cyan-500/30',
    label: 'The Auditor',
    icon: '📋',
  },
  connector: {
    bg: 'bg-violet-600/20',
    border: 'border-violet-500/30',
    label: 'The Connector',
    icon: '🔗',
  },
  challenger: {
    bg: 'bg-red-600/20',
    border: 'border-red-500/30',
    label: 'The Challenger',
    icon: '⚔️',
  },
  reflector: {
    bg: 'bg-rose-600/20',
    border: 'border-rose-500/30',
    label: 'The Reflector',
    icon: '🪞',
  },
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const speaker = message.speaker || (message.role === 'user' ? 'user' : 'sensei');
  const style = SPEAKER_STYLES[speaker];
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 border ${style.bg} ${style.border}`}
      >
        {/* Speaker label */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">{style.icon}</span>
          <span className="text-xs font-semibold text-gray-400">{style.label}</span>
        </div>

        {/* Message content */}
        <div className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed prose prose-invert prose-sm max-w-none">
          {formatMessageContent(message.content)}
        </div>

        {/* Timestamp */}
        <div className="mt-2 text-xs text-gray-500">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

// Basic markdown-like formatting
function formatMessageContent(content: string): React.ReactNode {
  // Split by bold markers
  const parts = content.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-gray-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
