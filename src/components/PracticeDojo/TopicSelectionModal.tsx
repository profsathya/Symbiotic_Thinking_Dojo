'use client';

import { useState, useEffect } from 'react';
import { TopicConfig, Pathway, PracticeDojoState } from '@/lib/practice-dojo/types';
import { getTopicsOrganizedByCategory } from '@/lib/practice-dojo/topics';

interface TopicSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topicId: string, pathway: Pathway) => void;
  practiceDojoState: PracticeDojoState;
  onResume: () => void;
  onStartFresh: () => void;
  onEditTopic?: (topicId: string) => void;
  hasTopicCustomization?: (topicId: string) => boolean;
}

export function TopicSelectionModal({
  isOpen,
  onClose,
  onSelectTopic,
  practiceDojoState,
  onResume,
  onStartFresh,
  onEditTopic,
  hasTopicCustomization,
}: TopicSelectionModalProps) {
  const [selectedTopic, setSelectedTopic] = useState<TopicConfig | null>(null);
  const [showPathwaySelection, setShowPathwaySelection] = useState(false);

  const topics = getTopicsOrganizedByCategory();

  // Check if there's a resumeable session (must not be currently active)
  const hasResumeableSession = !practiceDojoState.isActive && practiceDojoState.topicId !== null && practiceDojoState.sessionStarted !== null;
  const resumeTopicId = practiceDojoState.topicId;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTopic(null);
      setShowPathwaySelection(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPathwaySelection) {
          setShowPathwaySelection(false);
          setSelectedTopic(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose, showPathwaySelection]);

  const handleTopicClick = (topic: TopicConfig) => {
    if (!topic.enabled) return;

    // Check if this is the resumeable topic
    if (topic.topicId === resumeTopicId && hasResumeableSession) {
      // Show resume dialog instead
      setSelectedTopic(topic);
      return;
    }

    // If topic has only one pathway, skip pathway selection and start directly
    if (topic.pathways.length === 1) {
      onSelectTopic(topic.topicId, topic.pathways[0].id);
      onClose();
      return;
    }

    setSelectedTopic(topic);
    setShowPathwaySelection(true);
  };

  const handlePathwaySelect = (pathway: Pathway) => {
    if (selectedTopic) {
      onSelectTopic(selectedTopic.topicId, pathway);
      onClose();
    }
  };

  const handleBack = () => {
    setShowPathwaySelection(false);
    setSelectedTopic(null);
  };

  if (!isOpen) return null;

  const renderTopicCard = (topic: TopicConfig, isResumeable: boolean = false) => {
    const isCompleted = practiceDojoState.completedTopics.includes(topic.topicId);
    // Only show edit button for symbiotic-thinking for now
    const canEdit = topic.topicId === 'symbiotic-thinking' && onEditTopic;
    const isCustomized = hasTopicCustomization?.(topic.topicId);

    return (
      <div
        key={topic.topicId}
        className={`w-full text-left p-4 rounded-lg border transition-all ${
          topic.enabled
            ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
            : 'bg-gray-900/30 border-gray-800 opacity-60'
        } ${isResumeable ? 'ring-2 ring-purple-500/50' : ''} ${isCustomized ? 'border-purple-700/50' : ''}`}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => handleTopicClick(topic)}
            disabled={!topic.enabled}
            className="flex-1 text-left cursor-pointer disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{topic.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-semibold ${topic.enabled ? 'text-gray-100' : 'text-gray-500'}`}>
                    {topic.title}
                  </h3>
                  {isCompleted && (
                    <span className="text-xs px-2 py-0.5 bg-emerald-900/50 text-emerald-400 rounded-full">
                      ✓ Completed
                    </span>
                  )}
                  {isResumeable && !isCompleted && (
                    <span className="text-xs px-2 py-0.5 bg-purple-900/50 text-purple-400 rounded-full">
                      In Progress
                    </span>
                  )}
                  {isCustomized && (
                    <span className="text-xs px-2 py-0.5 bg-purple-900/50 text-purple-400 rounded-full">
                      Customized
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1 ${topic.enabled ? 'text-gray-400' : 'text-gray-600'}`}>
                  {topic.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {topic.estimatedTime}
                  </span>
                  {!topic.enabled && (
                    <span className="text-xs text-amber-500/80">Coming soon</span>
                  )}
                </div>
              </div>
            </div>
          </button>

          {/* Edit button */}
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditTopic(topic.topicId);
              }}
              className="px-2 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
              title="Edit prompts"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
        </div>
      </div>
    );
  };

  // Resume dialog for in-progress topic
  if (selectedTopic && hasResumeableSession && selectedTopic.topicId === resumeTopicId && !showPathwaySelection) {
    const currentPhaseTitle = selectedTopic.phases[practiceDojoState.currentPhase]?.title || 'Unknown';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />
        <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden mx-4">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-gray-100">Continue Your Session?</h2>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-4">
              <p className="text-sm text-purple-200">
                You have an in-progress session:
              </p>
              <p className="text-sm text-gray-300 mt-2">
                <strong>{selectedTopic.title}</strong>
                <br />
                Phase {practiceDojoState.currentPhase + 1}: {currentPhaseTitle}
              </p>
            </div>

            <p className="text-sm text-gray-400">
              Would you like to continue where you left off, or start fresh?
            </p>
          </div>

          <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
            <button
              onClick={() => {
                onResume();
                onClose();
              }}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
            >
              Continue Session
            </button>
            <button
              onClick={() => {
                onStartFresh();
                setShowPathwaySelection(true);
              }}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pathway selection screen
  if (showPathwaySelection && selectedTopic) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />
        <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden mx-4">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-100">{selectedTopic.title}</h2>
                <p className="text-xs text-gray-400">Choose your learning path</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-4 space-y-3">
            {selectedTopic.pathways.map((pathway) => (
              <button
                key={pathway.id}
                onClick={() => handlePathwaySelect(pathway.id)}
                className="w-full p-4 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-600 transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{pathway.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-100">{pathway.title}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">{pathway.description}</p>
                    <span className="text-xs text-gray-500 mt-1 inline-block">
                      {pathway.estimatedTime}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main topic selection screen
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">🥋 Practice Dojo</h2>
            <p className="text-xs text-gray-400 mt-0.5">Guided learning experiences</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6 overflow-y-auto flex-1">
          {/* Foundations */}
          {topics.foundations.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Foundations
              </h3>
              <div className="space-y-2">
                {topics.foundations.map((topic) =>
                  renderTopicCard(topic, topic.topicId === resumeTopicId)
                )}
              </div>
            </div>
          )}

          {/* Courses */}
          {topics.course.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Course Topics
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Understand your course structure, goals, and how to succeed
              </p>
              <div className="space-y-2">
                {topics.course.map((topic) =>
                  renderTopicCard(topic, topic.topicId === resumeTopicId)
                )}
              </div>
            </div>
          )}

          {/* General */}
          {topics.general.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                General Subjects
              </h3>
              <div className="space-y-2">
                {topics.general.map((topic) =>
                  renderTopicCard(topic, topic.topicId === resumeTopicId)
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
