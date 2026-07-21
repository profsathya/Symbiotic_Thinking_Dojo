'use client';

import { ReactNode } from 'react';
import { Message, BalanceState } from '@/lib/types';
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


// Calculate opacity for the overlay
function getOverlayOpacity(balance: BalanceState): number {
  if (balance.history.length < 2) return 0;

  if (balance.score < 0) {
    // Consuming: increase opacity with consecutive consuming
    if (balance.consecutiveConsuming >= 3) {
      return Math.min(0.15, 0.05 + (balance.consecutiveConsuming - 2) * 0.025);
    }
    return Math.min(0.05, Math.abs(balance.score) * 0.005);
  }

  if (balance.score > 2) {
    return Math.min(0.08, balance.score * 0.01);
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
  const isConsuming = balance.score < 0 && balance.history.length >= 2;
  const isCreating = balance.score > 2 && balance.history.length >= 2;

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
