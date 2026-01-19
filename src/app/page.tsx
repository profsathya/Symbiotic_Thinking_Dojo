'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDojoConfig } from '@/hooks/useDojoConfig';
import { useChat } from '@/hooks/useChat';
import { useApiKey } from '@/hooks/useApiKey';
import { usePracticeDojoState } from '@/hooks/usePracticeDojoState';
import { Sidebar } from '@/components/Sidebar';
import { ChatContainer } from '@/components/Chat';
import { StatusPanel } from '@/components/StatusPanel';
import { ConfigPanel } from '@/components/ConfigPanel';
import { HelpButtons, HelpModal } from '@/components/HelpPanel';
import { ExportButton } from '@/components/ExportButton';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { TopicSelectionModal, ProgressIndicator } from '@/components/PracticeDojo';
import { ImportedSession } from '@/lib/export';
import { getTopicById } from '@/lib/practice-dojo/topics';
import { PracticeDojoContext, Pathway } from '@/lib/practice-dojo/types';

export default function Home() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isPracticeDojoModalOpen, setIsPracticeDojoModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // API Key management (stored in browser localStorage)
  const { apiKey, isKeySet, setApiKey, clearApiKey } = useApiKey();

  // Practice Dojo state management (stored in browser localStorage)
  const practiceDojoState = usePracticeDojoState();

  const {
    config,
    activeConstruct,
    activePartners,
    umpireStage,
    setActiveConstruct,
    setActivePartners,
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

  // Compute Practice Dojo context if in Practice Dojo mode
  const practiceDojoContext = useMemo((): PracticeDojoContext | null => {
    if (!practiceDojoState.state.topicId || !practiceDojoState.state.pathway) {
      return null;
    }

    const topic = getTopicById(practiceDojoState.state.topicId);
    if (!topic) return null;

    const currentPhase = topic.phases[practiceDojoState.state.currentPhase];
    if (!currentPhase) return null;

    return {
      topic,
      currentPhase,
      pathway: practiceDojoState.state.pathway,
      completedPhases: practiceDojoState.state.completedPhases,
      userChoices: practiceDojoState.state.userChoices,
      checkpointStatuses: practiceDojoState.state.checkpointStatuses,
    };
  }, [practiceDojoState.state]);

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
    startPracticeDojo,
    importSession,
    getSerializedMessages,
    restoreMessages,
  } = useChat({
    config,
    activeConstruct,
    activePartners,
    apiKey,
    practiceDojoContext,
  });

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Save messages to Practice Dojo state when in Practice Dojo mode
  useEffect(() => {
    if (practiceDojoContext && messages.length > 0 && !isLoading) {
      const serialized = getSerializedMessages();
      practiceDojoState.saveMessages(serialized);
    }
  }, [messages, practiceDojoContext, isLoading, getSerializedMessages, practiceDojoState]);

  // Reset chat when construct changes
  const handleConstructChange = (construct: typeof activeConstruct) => {
    setActiveConstruct(construct);
    resetChat();
    // Exit Practice Dojo if changing constructs
    if (practiceDojoContext) {
      practiceDojoState.exitSession();
    }
  };

  // Handle importing a session - restores construct, partners, and chat state
  const handleImportSession = (session: ImportedSession) => {
    // Update construct and partners to match the imported session
    setActiveConstruct(session.construct);
    setActivePartners(session.activePartners);
    // Import the chat messages and metrics
    importSession(session);
    // Exit Practice Dojo if importing a session
    if (practiceDojoContext) {
      practiceDojoState.exitSession();
    }
  };

  // Handle opening Practice Dojo modal
  const handleOpenPracticeDojo = useCallback(() => {
    setIsPracticeDojoModalOpen(true);
  }, []);

  // Handle selecting a topic in Practice Dojo
  const handleSelectTopic = useCallback((topicId: string, pathway: Pathway) => {
    const topic = getTopicById(topicId);
    if (!topic) return;

    // Start the Practice Dojo session
    practiceDojoState.startSession(topicId, pathway);

    // Set construct to Learn mode for Practice Dojo
    setActiveConstruct('learn');

    // Start the chat with Practice Dojo welcome
    startPracticeDojo(topic, pathway);
  }, [practiceDojoState, setActiveConstruct, startPracticeDojo]);

  // Handle resuming Practice Dojo session
  const handleResumePracticeDojo = useCallback(() => {
    // First, get saved messages before resuming
    const savedMessages = practiceDojoState.getSavedMessages();

    // Resume the Practice Dojo session state
    practiceDojoState.resumeSession();

    // Restore chat messages if available
    if (savedMessages && savedMessages.length > 0) {
      restoreMessages(savedMessages);
    }
  }, [practiceDojoState, restoreMessages]);

  // Handle starting fresh in Practice Dojo
  const handleStartFresh = useCallback(() => {
    practiceDojoState.clearSavedMessages();
    practiceDojoState.resetSession();
  }, [practiceDojoState]);

  // Handle exiting Practice Dojo
  const handleExitPracticeDojo = useCallback(() => {
    // Note: We don't clear saved messages on exit so user can resume later
    // Messages are only cleared when starting fresh or completing the topic
    practiceDojoState.exitSession();
    resetChat();
  }, [practiceDojoState, resetChat]);

  // Handle visual component interactions (e.g., clicking selection cards)
  const handleVisualInteraction = useCallback((action: string, data: Record<string, string>) => {
    if (action === 'select' && data.optionTitle) {
      // Store the user's choice
      if (data.optionId) {
        practiceDojoState.setUserChoice(data.optionId, data.optionTitle);
      }
      // Send the selection as a message
      sendMessage(`I choose: ${data.optionTitle}`);
    }
  }, [practiceDojoState, sendMessage]);

  // Check if user has started a conversation (more than just the welcome message)
  const hasStartedConversation = messages.length > 1;

  // Get current topic for Progress Indicator
  const currentTopic = practiceDojoContext?.topic || null;

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
        isApiKeySet={isKeySet}
        onSelectConstruct={handleConstructChange}
        onTogglePartner={togglePartner}
        onOpenApiKeySettings={() => setIsApiKeyModalOpen(true)}
        onOpenConfig={() => setIsConfigOpen(true)}
        onNewSession={resetChat}
        onGuidedPractice={handleOpenPracticeDojo}
        onImportSession={handleImportSession}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Practice Dojo Progress Indicator */}
        {currentTopic && practiceDojoContext && (
          <ProgressIndicator
            topic={currentTopic}
            currentPhase={practiceDojoState.state.currentPhase}
            completedPhases={practiceDojoState.state.completedPhases}
            onExit={handleExitPracticeDojo}
          />
        )}

        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          error={error}
          onSendMessage={sendMessage}
          balance={balance}
          onVisualInteraction={handleVisualInteraction}
          headerContent={
            <div className="flex items-center gap-2">
              <ExportButton
                messages={messages}
                construct={activeConstruct}
                activePartners={activePartners}
                balance={balance}
                dikw={dikw}
                disabled={isLoading}
              />
              <HelpButtons onOpen={() => setIsHelpOpen(true)} />
            </div>
          }
        />
      </div>

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

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        currentKey={apiKey}
        onSaveKey={setApiKey}
        onClearKey={clearApiKey}
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

      {/* Practice Dojo Topic Selection Modal */}
      <TopicSelectionModal
        isOpen={isPracticeDojoModalOpen}
        onClose={() => setIsPracticeDojoModalOpen(false)}
        onSelectTopic={handleSelectTopic}
        practiceDojoState={practiceDojoState.state}
        onResume={handleResumePracticeDojo}
        onStartFresh={handleStartFresh}
      />
    </div>
  );
}
