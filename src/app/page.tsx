'use client';

import { useState, useEffect } from 'react';
import { useDojoConfig } from '@/hooks/useDojoConfig';
import { useChat } from '@/hooks/useChat';
import { Sidebar } from '@/components/Sidebar';
import { ChatContainer } from '@/components/Chat';
import { StatusPanel } from '@/components/StatusPanel';
import { ConfigPanel } from '@/components/ConfigPanel';

export default function Home() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    config,
    activeConstruct,
    activePartners,
    umpireStage,
    setActiveConstruct,
    togglePartner,
    setUmpireStage,
    updateDojoPrompt,
    updateSenseiPrompt,
    updateConstructPrompt,
    updatePartnerPrompt,
    resetToDefaults,
    resetDojoPrompt,
    resetSenseiPrompt,
    resetConstructPrompt,
    resetPartnerPrompt,
  } = useDojoConfig();

  const {
    messages,
    isLoading,
    error,
    balance,
    sendMessage,
    resetChat,
  } = useChat({
    config,
    activeConstruct,
    activePartners,
  });

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset chat when construct changes
  const handleConstructChange = (construct: typeof activeConstruct) => {
    setActiveConstruct(construct);
    resetChat();
  };

  // Check if user has started a conversation (more than just the welcome message)
  const hasStartedConversation = messages.length > 1;

  if (!mounted) {
    return (
      <div className="flex h-screen bg-gray-950 items-center justify-center">
        <div className="text-gray-400">Loading Dojo...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <Sidebar
        config={config}
        activeConstruct={activeConstruct}
        activePartners={activePartners}
        onSelectConstruct={handleConstructChange}
        onTogglePartner={togglePartner}
        onOpenConfig={() => setIsConfigOpen(true)}
        onNewSession={resetChat}
      />

      {/* Main Chat Area */}
      <ChatContainer
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSendMessage={sendMessage}
        balance={balance}
      />

      {/* Status Panel */}
      <StatusPanel
        config={config}
        activeConstruct={activeConstruct}
        activePartners={activePartners}
        umpireStage={umpireStage}
        onUmpireStageChange={setUmpireStage}
        balance={balance}
        hasStartedConversation={hasStartedConversation}
      />

      {/* Configuration Modal */}
      <ConfigPanel
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onUpdateDojoPrompt={updateDojoPrompt}
        onUpdateSenseiPrompt={updateSenseiPrompt}
        onUpdateConstructPrompt={updateConstructPrompt}
        onUpdatePartnerPrompt={updatePartnerPrompt}
        onResetDojoPrompt={resetDojoPrompt}
        onResetSenseiPrompt={resetSenseiPrompt}
        onResetConstructPrompt={resetConstructPrompt}
        onResetPartnerPrompt={resetPartnerPrompt}
        onResetAll={resetToDefaults}
      />
    </div>
  );
}
