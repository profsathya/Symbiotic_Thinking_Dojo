'use client';

import { useState, useRef } from 'react';
import { TopicConfig, PhaseConfig } from '@/lib/practice-dojo/types';
import { getTopicById } from '@/lib/practice-dojo/topics';

interface TopicEditorProps {
  isOpen: boolean;
  onClose: () => void;
  topic: TopicConfig;
  onUpdatePhase: (phaseId: number, field: keyof PhaseConfig, value: string) => void;
  onResetPhase: (phaseId: number) => void;
  onResetTopic: () => void;
  hasPhaseCustomization: (phaseId: number) => boolean;
  hasTopicCustomization: boolean;
  onExport: () => string;
  onImport: (json: string) => { success: boolean; error?: string };
}

export function TopicEditor({
  isOpen,
  onClose,
  topic,
  onUpdatePhase,
  onResetPhase,
  onResetTopic,
  hasPhaseCustomization,
  hasTopicCustomization,
  onExport,
  onImport,
}: TopicEditorProps) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<{ phaseId: number; field: keyof PhaseConfig } | null>(null);
  const [localValue, setLocalValue] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const baseTopic = getTopicById(topic.topicId);

  const handleTogglePhase = (phaseId: number) => {
    if (expandedPhase === phaseId) {
      // Save any pending changes before collapsing
      if (isDirty && editingField && editingField.phaseId === phaseId) {
        onUpdatePhase(editingField.phaseId, editingField.field, localValue);
      }
      setExpandedPhase(null);
      setEditingField(null);
      setIsDirty(false);
    } else {
      // Save any pending changes before switching
      if (isDirty && editingField) {
        onUpdatePhase(editingField.phaseId, editingField.field, localValue);
      }
      setExpandedPhase(phaseId);
      setEditingField(null);
      setIsDirty(false);
    }
  };

  const handleStartEdit = (phaseId: number, field: keyof PhaseConfig, currentValue: string) => {
    // Save any pending changes
    if (isDirty && editingField) {
      onUpdatePhase(editingField.phaseId, editingField.field, localValue);
    }
    setEditingField({ phaseId, field });
    setLocalValue(currentValue);
    setIsDirty(false);
  };

  const handleChange = (value: string) => {
    setLocalValue(value);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (editingField) {
      onUpdatePhase(editingField.phaseId, editingField.field, localValue);
      setIsDirty(false);
    }
  };

  const handleResetField = () => {
    if (editingField && baseTopic) {
      const basePhase = baseTopic.phases.find(p => p.phaseId === editingField.phaseId);
      if (basePhase) {
        const baseValue = basePhase[editingField.field] as string;
        setLocalValue(baseValue);
        onUpdatePhase(editingField.phaseId, editingField.field, baseValue);
        setIsDirty(false);
      }
    }
  };

  const handleExportClick = () => {
    const json = onExport();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dojo-topic-${topic.topicId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setShowImportSuccess(false);

    try {
      const text = await file.text();
      const result = onImport(text);
      if (result.success) {
        setShowImportSuccess(true);
        setTimeout(() => setShowImportSuccess(false), 3000);
      } else {
        setImportError(result.error || 'Import failed');
        setTimeout(() => setImportError(null), 5000);
      }
    } catch {
      setImportError('Failed to read file');
      setTimeout(() => setImportError(null), 5000);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleShareClick = () => {
    const json = onExport();
    const discussionUrl = 'https://github.com/profsathya/Symbiotic_Thinking_Dojo/discussions/new?category=practice-dojo-prompts';

    const template = `## Topic: ${topic.title}

### Why did you make these changes?
<!-- Explain what motivated your modifications -->

### What pedagogical/learning value were you aiming for?
<!-- Describe the learning outcomes you're trying to improve -->

### Did it work to your satisfaction?
<!-- Share your experience - what worked well, what needs more refinement -->

---

<details>
<summary>📋 Click to view/copy the JSON configuration</summary>

\`\`\`json
${json}
\`\`\`

</details>

---
*To use this configuration: Copy the JSON above, save as a .json file, and use Import in the Topic Editor.*`;

    // Copy template to clipboard and open discussions
    navigator.clipboard.writeText(template).then(() => {
      window.open(discussionUrl, '_blank');
    }).catch(() => {
      // If clipboard fails, still open the URL
      window.open(discussionUrl, '_blank');
    });
  };

  const isFieldCustomized = (phaseId: number, field: keyof PhaseConfig): boolean => {
    if (!baseTopic) return false;
    const basePhase = baseTopic.phases.find(p => p.phaseId === phaseId);
    const currentPhase = topic.phases.find(p => p.phaseId === phaseId);
    if (!basePhase || !currentPhase) return false;
    return basePhase[field] !== currentPhase[field];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <span>{topic.icon}</span>
              Edit: {topic.title}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Customize prompts for each phase
            </p>
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

        {/* Action buttons */}
        <div className="px-6 py-3 border-b border-gray-800 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleExportClick}
            className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <button
            onClick={handleImportClick}
            className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
          </button>
          <button
            onClick={handleShareClick}
            className="px-3 py-1.5 text-xs font-medium text-purple-300 bg-purple-900/50 hover:bg-purple-900/70 border border-purple-700/50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share to Community
          </button>

          <div className="flex-1" />

          {hasTopicCustomization && (
            <button
              onClick={onResetTopic}
              className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700/50 rounded-lg transition-colors"
            >
              Reset All to Default
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Status messages */}
        {(importError || showImportSuccess) && (
          <div className={`px-6 py-2 text-xs ${importError ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
            {importError || '✓ Configuration imported successfully'}
          </div>
        )}

        {/* Phases list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {topic.phases.map((phase) => {
            const isExpanded = expandedPhase === phase.phaseId;
            const isCustomized = hasPhaseCustomization(phase.phaseId);

            return (
              <div
                key={phase.phaseId}
                className={`border rounded-lg overflow-hidden ${
                  isCustomized ? 'border-purple-700/50' : 'border-gray-700'
                }`}
              >
                {/* Phase header */}
                <button
                  onClick={() => handleTogglePhase(phase.phaseId)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-800 hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`transform transition-transform text-gray-400 ${isExpanded ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Phase {phase.phaseId}</span>
                        <span className="font-medium text-gray-200">{phase.title}</span>
                        {isCustomized && (
                          <span className="text-xs px-1.5 py-0.5 bg-purple-900/50 text-purple-400 rounded">
                            Customized
                          </span>
                        )}
                        {phase.hasCheckpoint && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-900/50 text-blue-400 rounded">
                            Checkpoint
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{phase.purpose}</p>
                    </div>
                  </div>
                  {isCustomized && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onResetPhase(phase.phaseId);
                      }}
                      className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition-colors"
                    >
                      Reset Phase
                    </span>
                  )}
                </button>

                {/* Phase content */}
                {isExpanded && (
                  <div className="p-4 bg-gray-850 border-t border-gray-700 space-y-4">
                    {/* Purpose field */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          Purpose
                          {isFieldCustomized(phase.phaseId, 'purpose') && (
                            <span className="text-xs text-purple-400">(modified)</span>
                          )}
                        </label>
                        {editingField?.phaseId === phase.phaseId && editingField?.field === 'purpose' ? (
                          <div className="flex gap-2">
                            {isDirty && (
                              <button
                                onClick={handleSave}
                                className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                              >
                                Save
                              </button>
                            )}
                            <button
                              onClick={handleResetField}
                              className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded"
                            >
                              Reset
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(phase.phaseId, 'purpose', phase.purpose)}
                            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      {editingField?.phaseId === phase.phaseId && editingField?.field === 'purpose' ? (
                        <textarea
                          value={localValue}
                          onChange={(e) => handleChange(e.target.value)}
                          className="w-full h-20 p-3 text-sm bg-gray-800 border border-gray-600 rounded-lg text-gray-200 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      ) : (
                        <div className="p-3 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-mono">
                          {phase.purpose}
                        </div>
                      )}
                    </div>

                    {/* Content Guidance field */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          Content Guidance
                          {isFieldCustomized(phase.phaseId, 'contentGuidance') && (
                            <span className="text-xs text-purple-400">(modified)</span>
                          )}
                        </label>
                        {editingField?.phaseId === phase.phaseId && editingField?.field === 'contentGuidance' ? (
                          <div className="flex gap-2">
                            {isDirty && (
                              <button
                                onClick={handleSave}
                                className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                              >
                                Save
                              </button>
                            )}
                            <button
                              onClick={handleResetField}
                              className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded"
                            >
                              Reset
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(phase.phaseId, 'contentGuidance', phase.contentGuidance)}
                            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      {editingField?.phaseId === phase.phaseId && editingField?.field === 'contentGuidance' ? (
                        <textarea
                          value={localValue}
                          onChange={(e) => handleChange(e.target.value)}
                          className="w-full h-64 p-3 text-sm bg-gray-800 border border-gray-600 rounded-lg text-gray-200 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      ) : (
                        <pre className="p-3 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                          {phase.contentGuidance}
                        </pre>
                      )}
                    </div>

                    {/* Checkpoint Criteria field (if applicable) */}
                    {phase.hasCheckpoint && phase.checkpointCriteria && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            Checkpoint Criteria
                            {isFieldCustomized(phase.phaseId, 'checkpointCriteria') && (
                              <span className="text-xs text-purple-400">(modified)</span>
                            )}
                          </label>
                          {editingField?.phaseId === phase.phaseId && editingField?.field === 'checkpointCriteria' ? (
                            <div className="flex gap-2">
                              {isDirty && (
                                <button
                                  onClick={handleSave}
                                  className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                                >
                                  Save
                                </button>
                              )}
                              <button
                                onClick={handleResetField}
                                className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded"
                              >
                                Reset
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(phase.phaseId, 'checkpointCriteria', phase.checkpointCriteria || '')}
                              className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        {editingField?.phaseId === phase.phaseId && editingField?.field === 'checkpointCriteria' ? (
                          <textarea
                            value={localValue}
                            onChange={(e) => handleChange(e.target.value)}
                            className="w-full h-32 p-3 text-sm bg-gray-800 border border-gray-600 rounded-lg text-gray-200 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        ) : (
                          <pre className="p-3 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto">
                            {phase.checkpointCriteria}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
