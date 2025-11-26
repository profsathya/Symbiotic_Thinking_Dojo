'use client';

import { Message } from '@/lib/types';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
}

export function ChatContainer({
  messages,
  isLoading,
  error,
  onSendMessage,
}: ChatContainerProps) {
  return (
    <div className="flex-1 flex flex-col bg-gray-950 overflow-hidden">
      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-red-900/50 border-b border-red-800 text-red-200 text-sm">
          Error: {error}
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input */}
      <ChatInput onSend={onSendMessage} isLoading={isLoading} />
    </div>
  );
}
