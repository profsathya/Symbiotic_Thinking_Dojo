'use client';

import { ReactNode } from 'react';
import { Message, BalanceState, recentBalance } from '@/lib/types';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { CountdownTimer } from '@/components/CountdownTimer';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  quotaRetryTime?: Date | null;
  onSendMessage: (message: string) => void;
  balance: BalanceState;
  headerContent?: ReactNode;
  onVisualInteraction?: (action: string, data: Record<string, string>) => void;
  // Best-effort default language for the composer's code-block button.
  defaultCodeLanguage?: string;
}


// Calculate opacity for the overlay. Reads the same recent window as the
// meter — tinting on the cumulative score meant the tint latched on a few
// turns in and then stayed regardless of what happened next.
function getOverlayOpacity(balance: BalanceState): number {
  if (balance.history.length < 2) return 0;

  const { mean } = recentBalance(balance.history);

  if (mean < 0) {
    // Consuming: increase opacity with consecutive consuming
    if (balance.consecutiveConsuming >= 3) {
      return Math.min(0.15, 0.05 + (balance.consecutiveConsuming - 2) * 0.025);
    }
    return Math.min(0.05, Math.abs(mean) * 0.015);
  }

  if (mean >= 1) {
    return Math.min(0.08, mean * 0.025);
  }

  return 0;
}

export function ChatContainer({
  messages,
  isLoading,
  error,
  quotaRetryTime,
  onSendMessage,
  balance,
  headerContent,
  onVisualInteraction,
  defaultCodeLanguage,
}: ChatContainerProps) {
  const overlayOpacity = getOverlayOpacity(balance);
  // Direction comes from the SAME recent window as the opacity. Reading one
  // from the window and the other from the cumulative score let a session tint
  // green while fading in on five negative turns — or carry an opacity with no
  // colour class at all.
  const { mean: recentMean } = recentBalance(balance.history);
  const enoughHistory = balance.history.length >= 2;
  const isConsuming = enoughHistory && recentMean < 0;
  const isCreating = enoughHistory && recentMean >= 1;

  return (
    <div className="flex-1 flex flex-col bg-gray-950 overflow-hidden relative" data-tour="chat">
      {/* Balance-based color overlay */}
      {overlayOpacity > 0 && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
            isConsuming ? 'bg-red-600' : isCreating ? 'bg-green-600' : ''
          }`}
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Header bar with help buttons - overflow-visible to allow tooltips/hints */}
      {headerContent && (
        <div className="relative z-20 flex justify-end px-4 py-2 border-b border-gray-800/50 overflow-visible">
          {headerContent}
        </div>
      )}

      {/* Error banner with optional countdown for quota errors */}
      {error && (
        <div className="px-4 py-3 bg-amber-900/50 border-b border-amber-800 text-amber-200 text-sm relative z-10">
          <div className="flex items-center justify-between gap-4">
            <span>API rate limit reached</span>
            {quotaRetryTime && (
              <span className="flex items-center gap-2">
                <span className="text-amber-300/70">Retry in:</span>
                <CountdownTimer targetTime={quotaRetryTime} />
              </span>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <MessageList messages={messages} isLoading={isLoading} onVisualInteraction={onVisualInteraction} />
      </div>

      {/* Input */}
      <div className="relative z-10">
        <ChatInput onSend={onSendMessage} isLoading={isLoading} defaultCodeLanguage={defaultCodeLanguage} />
      </div>
    </div>
  );
}
