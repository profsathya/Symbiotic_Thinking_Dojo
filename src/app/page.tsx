'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDojoConfig } from '@/hooks/useDojoConfig';
import { useChat } from '@/hooks/useChat';
import { useApiKey } from '@/hooks/useApiKey';
import { usePracticeDojoState } from '@/hooks/usePracticeDojoState';
import { useTour } from '@/hooks/useTour';
import { useTopicConfig } from '@/hooks/useTopicConfig';
import { useStats } from '@/hooks/useStats';
import { Sidebar } from '@/components/Sidebar';
import { ChatContainer } from '@/components/Chat';
import { StatusPanel } from '@/components/StatusPanel';
import { ConfigPanel } from '@/components/ConfigPanel';
import { HelpButtons, HelpModal } from '@/components/HelpPanel';
import { ExportButton } from '@/components/ExportButton';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { TopicSelectionModal, TopicEditor, ProgressIndicator } from '@/components/PracticeDojo';
import { TourOverlay, TourPrompt } from '@/components/Tour';
import { StatsModal } from '@/components/StatsModal';
import { ImportedSession } from '@/lib/export';
import { getTopicById } from '@/lib/practice-dojo/topics';
import { PracticeDojoContext, Pathway } from '@/lib/practice-dojo/types';

export default function Home() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isPracticeDojoModalOpen, setIsPracticeDojoModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // API Key management (stored in browser localStorage)
  const { apiKey, isKeySet, setApiKey, clearApiKey, provider, setProvider, hasKeyForProvider } = useApiKey();

  // Practice Dojo state management (stored in browser localStorage)
  const practiceDojoState = usePracticeDojoState();

  // Tour state management
  const tour = useTour();

  // Topic configuration (custom prompts)
  const topicConfig = useTopicConfig();

  // Anonymous usage statistics tracking
  const stats = useStats();

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
  // Note: We destructure specific fields to avoid re-computing when unrelated state changes (like savedMessages)
  const { isActive, topicId, pathway, currentPhase: currentPhaseIndex, completedPhases, userChoices, checkpointStatuses, interactionCount } = practiceDojoState.state;

  const practiceDojoContext = useMemo((): PracticeDojoContext | null => {
    // Only compute context when session is actively running
    if (!isActive || !topicId || !pathway) {
      return null;
    }

    // Use customized topic if available, otherwise fall back to base topic
    const topic = topicConfig.getTopicWithCustomizations(topicId) || getTopicById(topicId);
    if (!topic) return null;

    const currentPhase = topic.phases[currentPhaseIndex];
    if (!currentPhase) return null;

    return {
      topic,
      currentPhase,
      pathway,
      completedPhases,
      userChoices,
      checkpointStatuses,
      interactionCount,
    };
    // Note: We use topicConfig.getTopicWithCustomizations specifically to avoid
    // re-running when unrelated topicConfig properties change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, topicId, pathway, currentPhaseIndex, completedPhases, userChoices, checkpointStatuses, interactionCount, topicConfig.getTopicWithCustomizations]);

  const {
    messages,
    isLoading,
    error,
    quotaRetryTime,
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
    provider,
    practiceDojoContext,
  });

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track if we're in the process of exiting Practice Dojo to prevent save overwrite
  const isExitingPracticeDojoRef = useRef(false);

  // Refs for beforeunload tracking (to avoid stale closures)
  const messagesRef = useRef(messages);
  const dikwRef = useRef(dikw);
  const activePartnersRef = useRef(activePartners);
  const activeConstructRef = useRef(activeConstruct);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { dikwRef.current = dikw; }, [dikw]);
  useEffect(() => { activePartnersRef.current = activePartners; }, [activePartners]);
  useEffect(() => { activeConstructRef.current = activeConstruct; }, [activeConstruct]);

  // Track session end when user closes/navigates away from the page
  useEffect(() => {
    const handleUnload = () => {
      if (messagesRef.current.length > 1) {
        stats.trackSessionEndBeacon({
          messageCount: messagesRef.current.length,
          dikwState: dikwRef.current,
          partnersUsed: activePartnersRef.current,
          construct: activeConstructRef.current,
        });
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [stats.trackSessionEndBeacon]);

  // Save messages to Practice Dojo state when in Practice Dojo mode
  // Note: We check isInPracticeDojo (which uses isActive flag) to ensure we only save when
  // actively in a session, not just when there's resumable data from localStorage
  const { isInPracticeDojo } = practiceDojoState;

  useEffect(() => {
    // Don't save during exit (we save explicitly before reset) or if just welcome message
    if (isExitingPracticeDojoRef.current) return;
    // Only save when actively in Practice Dojo (isActive=true) and have meaningful conversation
    if (isInPracticeDojo && practiceDojoContext && messages.length > 1 && !isLoading) {
      const serialized = getSerializedMessages();
      practiceDojoState.saveMessages(serialized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, practiceDojoContext, isLoading, getSerializedMessages, isInPracticeDojo]);

  // Reset chat when construct changes
  const handleConstructChange = (construct: typeof activeConstruct) => {
    // Track session end if there's a meaningful conversation
    if (messages.length > 1) {
      stats.trackSessionEnd({
        messageCount: messages.length,
        dikwState: dikw,
        partnersUsed: activePartners,
        construct: activeConstruct,
      });
    }

    setActiveConstruct(construct);
    resetChat();
    // Exit Practice Dojo if currently in an active session
    if (isInPracticeDojo) {
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
    // Exit Practice Dojo if currently in an active session
    if (isInPracticeDojo) {
      practiceDojoState.exitSession();
    }
  };

  // Handle opening Practice Dojo modal
  const handleOpenPracticeDojo = useCallback(() => {
    setIsPracticeDojoModalOpen(true);
  }, []);

  // Handle selecting a topic in Practice Dojo
  const handleSelectTopic = useCallback((topicId: string, pathway: Pathway) => {
    // Use customized topic if available
    const topic = topicConfig.getTopicWithCustomizations(topicId) || getTopicById(topicId);
    if (!topic) return;

    // Track Practice Dojo started
    stats.trackPracticeDojoStarted(topicId, pathway);

    // Start the Practice Dojo session
    practiceDojoState.startSession(topicId, pathway);

    // Set construct to Learn mode for Practice Dojo
    setActiveConstruct('learn');

    // Start the chat with Practice Dojo welcome
    startPracticeDojo(topic, pathway);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceDojoState, setActiveConstruct, startPracticeDojo, topicConfig.getTopicWithCustomizations, stats.trackPracticeDojoStarted]);

  // Handle opening topic editor
  const handleEditTopic = useCallback((topicId: string) => {
    setEditingTopicId(topicId);
  }, []);

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
    // Set flag to prevent auto-save from overwriting during exit
    isExitingPracticeDojoRef.current = true;

    // Track session end with stats
    if (messages.length > 1) {
      stats.trackSessionEnd({
        messageCount: messages.length,
        dikwState: dikw,
        partnersUsed: activePartners,
        construct: activeConstruct,
      });

      // Save messages explicitly before reset
      const serialized = getSerializedMessages();
      practiceDojoState.saveMessages(serialized);
    }

    // Exit the session and reset chat
    practiceDojoState.exitSession();
    resetChat();

    // Reset flag after a tick to allow cleanup
    setTimeout(() => {
      isExitingPracticeDojoRef.current = false;
    }, 100);
  }, [practiceDojoState, resetChat, messages.length, getSerializedMessages, stats, dikw, activePartners, activeConstruct]);

  // Wrap sendMessage to track interactions in Practice Dojo mode
  const handleSendMessage = useCallback((message: string) => {
    // Increment interaction count when in Practice Dojo mode
    if (isInPracticeDojo) {
      practiceDojoState.incrementInteractionCount();
    }
    sendMessage(message);
  }, [isInPracticeDojo, practiceDojoState, sendMessage]);

  // Handle visual component interactions (e.g., clicking selection cards)
  const handleVisualInteraction = useCallback((action: string, data: Record<string, string>) => {
    if (action === 'select' && data.optionTitle) {
      // Store the user's choice
      if (data.optionId) {
        practiceDojoState.setUserChoice(data.optionId, data.optionTitle);
      }
      // Send the selection as a message (this goes through handleSendMessage)
      handleSendMessage(`I choose: ${data.optionTitle}`);
    }
  }, [practiceDojoState, handleSendMessage]);

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
        {/* Practice Dojo Progress Indicator - only show when session is active */}
        {isInPracticeDojo && currentTopic && (
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
          quotaRetryTime={quotaRetryTime}
          onSendMessage={handleSendMessage}
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
        currentProvider={provider}
        currentKey={apiKey}
        onSelectProvider={setProvider}
        onSaveKey={setApiKey}
        onClearKey={clearApiKey}
        hasKeyForProvider={hasKeyForProvider}
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
        onStartTour={tour.startTour}
        onOpenStats={() => setIsStatsModalOpen(true)}
      />

      {/* Stats Modal */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
      />

      {/* Practice Dojo Topic Selection Modal */}
      <TopicSelectionModal
        isOpen={isPracticeDojoModalOpen}
        onClose={() => setIsPracticeDojoModalOpen(false)}
        onSelectTopic={handleSelectTopic}
        practiceDojoState={practiceDojoState.state}
        onResume={handleResumePracticeDojo}
        onStartFresh={handleStartFresh}
        onEditTopic={handleEditTopic}
        hasTopicCustomization={topicConfig.hasTopicCustomization}
      />

      {/* Topic Editor Modal */}
      {editingTopicId && (
        <TopicEditor
          isOpen={true}
          onClose={() => setEditingTopicId(null)}
          topic={topicConfig.getTopicWithCustomizations(editingTopicId) || getTopicById(editingTopicId)!}
          onUpdatePhase={(phaseId, field, value) =>
            topicConfig.updatePhase(editingTopicId, phaseId, field, value)
          }
          onResetPhase={(phaseId) => topicConfig.resetPhase(editingTopicId, phaseId)}
          onResetTopic={() => topicConfig.resetTopic(editingTopicId)}
          hasPhaseCustomization={(phaseId) =>
            topicConfig.hasPhaseCustomization(editingTopicId, phaseId)
          }
          hasTopicCustomization={topicConfig.hasTopicCustomization(editingTopicId)}
          onExport={() => topicConfig.exportTopic(editingTopicId)}
          onImport={topicConfig.importTopic}
        />
      )}

      {/* Tour components */}
      {tour.shouldShowPrompt && (
        <TourPrompt
          onStartTour={tour.startTour}
          onDismiss={tour.dismissPrompt}
        />
      )}
      {tour.isActive && tour.currentStepData && (
        <TourOverlay
          step={tour.currentStepData}
          currentStep={tour.currentStep!}
          totalSteps={tour.totalSteps}
          onNext={tour.nextStep}
          onPrev={tour.prevStep}
          onSkip={tour.skipTour}
        />
      )}
    </div>
  );
}
