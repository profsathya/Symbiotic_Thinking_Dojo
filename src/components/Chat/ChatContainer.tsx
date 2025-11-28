'use client';

import { ReactNode } from 'react';
import { Message, BalanceState } from '@/lib/types';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  balance: BalanceState;
  headerContent?: ReactNode;
}

// Calculate background hue based on balance state
function getBalanceHue(balance: BalanceState): string {
  // Only show color after some history has accumulated
  if (balance.history.length < 2) {
    return 'bg-gray-950';
  }

  // Consuming (negative): red hue, increases with consecutive consuming
  if (balance.score < 0) {
    // Start subtle, intensify after 3+ consecutive consuming interactions
    const intensity = balance.consecutiveConsuming >= 3
      ? Math.min(0.15, 0.05 + (balance.consecutiveConsuming - 2) * 0.025)
      : Math.min(0.05, Math.abs(balance.score) * 0.005);

    if (intensity > 0.02) {
      // Using rgba overlay effect
      return `bg-gray-950 before:absolute before:inset-0 before:bg-red-600 before:pointer-events-none`;
    }
  }

  // Creating (positive): green hue
  if (balance.score > 2) {
    return `bg-gray-950 before:absolute before:inset-0 before:bg-green-600 before:pointer-events-none`;
  }

  return 'bg-gray-950';
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
  onSendMessage,
  balance,
  headerContent,
}: ChatContainerProps) {
  const overlayOpacity = getOverlayOpacity(balance);
  const isConsuming = balance.score < 0 && balance.history.length >= 2;
  const isCreating = balance.score > 2 && balance.history.length >= 2;

  return (
    <div className="flex-1 flex flex-col bg-gray-950 overflow-hidden relative">
      {/* Balance-based color overlay */}
      {overlayOpacity > 0 && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
            isConsuming ? 'bg-red-600' : isCreating ? 'bg-green-600' : ''
          }`}
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Header bar with help buttons */}
      {headerContent && (
        <div className="relative z-10 flex justify-end px-4 py-2 border-b border-gray-800/50">
          {headerContent}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-red-900/50 border-b border-red-800 text-red-200 text-sm relative z-10">
          Error: {error}
        </div>
      )}

      {/* Messages */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      {/* Input */}
      <div className="relative z-10">
        <ChatInput onSend={onSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
