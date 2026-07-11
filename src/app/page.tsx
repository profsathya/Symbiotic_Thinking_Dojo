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
import { BudgetIndicator } from '@/components/BudgetIndicator';
import { ImportedSession } from '@/lib/export';
import { ACTIVITY_ROUTES, getTopicById, getTopicBySlug } from '@/lib/practice-dojo/topics';
import { PracticeDojoContext, Pathway } from '@/lib/practice-dojo/types';
import { isCtiEnabled } from '@/lib/providers/types';

export default function Home() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isPracticeDojoModalOpen, setIsPracticeDojoModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [pendingTopicSlug, setPendingTopicSlug] = useState<string | null>(null);
  const [keyFromUrlNotice, setKeyFromUrlNotice] = useState(false);

  // API Key management (stored in browser localStorage)
  const { apiKey, isKeySet, setApiKey, clearApiKey, provider, setProvider, hasKeyForProvider, setKeyForProvider } = useApiKey();

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
    onPhaseComplete: () => {
      // The Practice Dojo model emits [NEXT_PHASE] at the end of a turn
      // when the current phase's STAY-UNTIL condition is met. Advance
      // unless we're already on the last phase of the active topic.
      // CRITICAL: only act when a dojo session is actively running.
      // exitSession() leaves topicId / currentPhase intact for resume,
      // so a literal `[NEXT_PHASE]` appearing in an ordinary chat
      // (e.g. the assistant explains the marker) would otherwise
      // corrupt the saved dojo progress.
      if (!isActive) return;
      if (!topicId) return;
      const topic = topicConfig.getTopicWithCustomizations(topicId);
      if (!topic) return;
      if (currentPhaseIndex + 1 < topic.phases.length) {
        practiceDojoState.advancePhase();
      }
    },
  });

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track if we've already processed a ?topic= URL parameter
  const topicUrlProcessedRef = useRef(false);

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

  // Auto-fill CTI API key from URL (?key=...) and/or auto-start a Practice
  // Dojo topic (?topic=slug). Both params are stripped from the visible URL
  // immediately after read. Combined into one effect so a link that supplies
  // both can skip the API-key modal — the URL-supplied key counts as "set"
  // for this render, even though React state hasn't flushed yet.
  useEffect(() => {
    if (!mounted || topicUrlProcessedRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const topicSlug = params.get('topic');
    const urlKey = params.get('key');
    if (!topicSlug && !urlKey) return;

    // Mark as processed so we don't re-trigger on re-renders
    topicUrlProcessedRef.current = true;

    // Strip both params from the visible URL without a reload, so they don't
    // linger in browser history, screenshots, or shared screen-captures.
    const url = new URL(window.location.href);
    url.searchParams.delete('topic');
    url.searchParams.delete('key');
    window.history.replaceState({}, '', url.pathname);

    // Handle URL-supplied CTI key. We accept it only when CTI is enabled in
    // this deployment; otherwise we silently ignore (no useful provider to
    // attach it to). Cheap sanity-check on length to avoid persisting noise.
    let keyApplied = false;
    if (urlKey && isCtiEnabled()) {
      const trimmed = urlKey.trim();
      if (trimmed.length >= 8 && trimmed.length <= 256) {
        setKeyForProvider('cti', trimmed);
        setProvider('cti');
        setKeyFromUrlNotice(true);
        keyApplied = true;
      }
    }

    if (!topicSlug) return;

    // Standalone activities (e.g. ?topic=architect) live on their own routes,
    // not in the chat engine. Any ?key= was already persisted to localStorage
    // above (setKeyForProvider writes synchronously), so the activity page's
    // useApiKey picks it up on mount. No key gate here — Architect Studio's
    // first pass is deliberately AI-free and it explains missing keys itself.
    const activityRoute = ACTIVITY_ROUTES[topicSlug];
    if (activityRoute) {
      window.location.replace(activityRoute);
      return;
    }

    // Validate the slug maps to a real, enabled topic
    const topic = getTopicBySlug(topicSlug);
    if (!topic || !topic.enabled) return;

    // Treat a URL-supplied key as "set" for this render — React state from
    // setKeyForProvider hasn't flushed yet, so isKeySet still reads stale.
    const effectiveKeySet = isKeySet || keyApplied;

    if (!effectiveKeySet) {
      setPendingTopicSlug(topicSlug);
      setIsApiKeyModalOpen(true);
      return;
    }

    // API key is set — start the topic directly with the topic's first
    // pathway (conventionally "guided"). URLs are meant for landing students
    // straight into the activity; if they want a different pathway, they can
    // switch via the normal Practice Dojo menu.
    handleSelectTopic(topic.topicId, topic.pathways[0].id as Pathway);
  }, [mounted, isKeySet, handleSelectTopic, setKeyForProvider, setProvider]);

  // After API key is set, auto-start the pending topic from URL
  useEffect(() => {
    if (!pendingTopicSlug || !isKeySet) return;

    const topic = getTopicBySlug(pendingTopicSlug);
    setPendingTopicSlug(null);
    if (!topic || !topic.enabled) return;

    handleSelectTopic(topic.topicId, topic.pathways[0].id as Pathway);
  }, [pendingTopicSlug, isKeySet, handleSelectTopic]);

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
    // Track interaction for analytics (captures usage even if tab dies without beforeunload)
    stats.trackInteraction(dikw.current, activePartners[0]);
    sendMessage(message);
  }, [isInPracticeDojo, practiceDojoState, sendMessage, stats, dikw.current, activePartners]);

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
        {keyFromUrlNotice && (
          <div className="bg-amber-900/30 border-b border-amber-800/50 px-4 py-2 text-sm text-amber-200 flex items-center justify-between gap-4">
            <span>
              A CTI API key was loaded from your link and saved to this browser. You can change or remove it from API Key settings.
            </span>
            <button
              onClick={() => setKeyFromUrlNotice(false)}
              className="text-amber-300 hover:text-amber-100 text-xs px-2 py-1 rounded border border-amber-700/50 hover:bg-amber-800/30"
            >
              Dismiss
            </button>
          </div>
        )}
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
              {provider === 'cti' && apiKey && (
                <BudgetIndicator apiKey={apiKey} />
              )}
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
