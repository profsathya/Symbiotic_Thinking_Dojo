'use client';

import { useState, useEffect } from 'react';
import { useDojoConfig } from '@/hooks/useDojoConfig';
import { useChat } from '@/hooks/useChat';
import { Sidebar } from '@/components/Sidebar';
import { ChatContainer } from '@/components/Chat';
import { StatusPanel } from '@/components/StatusPanel';
import { ConfigPanel } from '@/components/ConfigPanel';
import { HelpButtons, HelpModal } from '@/components/HelpPanel';

export default function Home() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    config,
    activeConstruct,
    activePartners,
    umpireStage,
    activeModel,
    availableModels,
    setActiveConstruct,
    togglePartner,
    setUmpireStage,
    setActiveModel,
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
    dikw,
    isGuidedPractice,
    sendMessage,
    resetChat,
    startGuidedPractice,
  } = useChat({
    config,
    activeConstruct,
    activePartners,
    activeModel,
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
  
  // Reset chat when model changes
  const handleModelChange = (modelId: string) => {
    setActiveModel(modelId);
    resetChat();
  }

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
        activeModel={activeModel}
        availableModels={availableModels}
        onSelectConstruct={handleConstructChange}
        onTogglePartner={togglePartner}
        onSelectModel={handleModelChange}
        onOpenConfig={() => setIsConfigOpen(true)}
        onNewSession={resetChat}
        onGuidedPractice={startGuidedPractice}
      />

      {/* Main Chat Area */}
      <ChatContainer
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSendMessage={sendMessage}
        balance={balance}
        headerContent={
          <HelpButtons onOpen={() => setIsHelpOpen(true)} />
        }
      />

      {/* Status Panel */}
      <StatusPanel
        config={config}
        activeConstruct={activeConstruct}
        activePartners={activePartners}
        umpireStage={umpireStage}
        onUmpireStageChange={setUmpireStage}
        balance={balance}
        dikw={dikw}
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

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
