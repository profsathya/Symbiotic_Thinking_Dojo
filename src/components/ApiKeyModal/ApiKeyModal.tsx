'use client';

import { useState, useEffect } from 'react';
import { AIProvider, PROVIDERS, isCtiEnabled, isCommonsEnabled } from '@/lib/providers/types';
import { testApiKey } from '@/lib/providers';
import { fetchCtiBudget, BudgetInfo } from '@/lib/providers';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider: AIProvider;
  currentKey: string | null;
  onSelectProvider: (provider: AIProvider) => void;
  onSaveKey: (key: string) => void;
  onClearKey: () => void;
  hasKeyForProvider: (provider: AIProvider) => boolean;
}

export function ApiKeyModal({
  isOpen,
  onClose,
  currentProvider,
  currentKey,
  onSelectProvider,
  onSaveKey,
  onClearKey,
  hasKeyForProvider,
}: ApiKeyModalProps) {
  const [keyInput, setKeyInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
    budget?: BudgetInfo;
  } | null>(null);
  const [showKey, setShowKey] = useState(false);

  const providerConfig = PROVIDERS[currentProvider];
  const isCti = currentProvider === 'cti';
  const ctiEnabled = isCtiEnabled();
  const commonsEnabled = isCommonsEnabled();

  // Build visible provider list
  // - CTI is hidden unless explicitly enabled via NEXT_PUBLIC_CTI_BACKEND_URL
  // - Commons is hidden unless explicitly enabled via NEXT_PUBLIC_COMMONS_ENABLED
  //   (the /api/chat/commons endpoint remains available for server-to-server
  //   calls from The Commons platform regardless of this UI toggle)
  const visibleProviders = (Object.keys(PROVIDERS) as AIProvider[]).filter(
    (p) => {
      if (p === 'cti') return ctiEnabled;
      if (p === 'commons') return commonsEnabled;
      return true;
    }
  );

  // Reset state when modal opens or provider changes
  useEffect(() => {
    if (isOpen) {
      setKeyInput('');
      setValidationResult(null);
      setShowKey(false);
    }
  }, [isOpen, currentProvider]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleValidateAndSave = async () => {
    if (!keyInput.trim()) return;

    setIsValidating(true);
    setValidationResult(null);

    if (isCti) {
      // For CTI keys, validate via budget endpoint
      try {
        const budget = await fetchCtiBudget(keyInput.trim());
        if (budget.remaining_tokens <= 0) {
          setValidationResult({ valid: false, error: 'Token budget exhausted', budget });
        } else {
          setValidationResult({ valid: true, budget });
          onSaveKey(keyInput.trim());
          setTimeout(() => onClose(), 1500);
        }
      } catch (error) {
        setValidationResult({
          valid: false,
          error: error instanceof Error ? error.message : 'Failed to validate key',
        });
      }
    } else {
      const result = await testApiKey(currentProvider, keyInput.trim());
      setValidationResult(result);

      if (result.valid) {
        onSaveKey(keyInput.trim());
        setTimeout(() => onClose(), 1000);
      }
    }

    setIsValidating(false);
  };

  const handleClear = () => {
    onClearKey();
    setKeyInput('');
    setValidationResult(null);
  };

  if (!isOpen) return null;

  const maskedKey = currentKey
    ? `${currentKey.slice(0, 8)}${'•'.repeat(20)}${currentKey.slice(-4)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-100">API Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="px-6 py-4 space-y-6 overflow-y-auto flex-1">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              AI Provider
            </label>
            <div className={`grid gap-3 ${visibleProviders.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {visibleProviders.map((providerId) => {
                const config = PROVIDERS[providerId];
                const isSelected = currentProvider === providerId;
                const hasKey = hasKeyForProvider(providerId);

                return (
                  <button
                    key={providerId}
                    onClick={() => onSelectProvider(providerId)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-900/30'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${isSelected ? 'text-purple-300' : 'text-gray-200'}`}>
                        {config.name}
                      </span>
                      {hasKey && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{config.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy Notice - different for CTI vs direct providers */}
          {isCti ? (
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-blue-300 mb-1">CTI Program Key</h3>
                  <p className="text-xs text-blue-200/80">
                    Enter the key provided by your CTI program coordinator.
                    Conversations are routed through the program server for token tracking.
                    No conversation content is logged.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-emerald-300 mb-1">Your Privacy is Protected</h3>
                  <p className="text-xs text-emerald-200/80">
                    Your API key is stored <strong>only in your browser</strong> and never sent to our servers.
                    All conversations happen directly between your browser and {providerConfig.name}&apos;s API.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Key Status */}
          {currentKey && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Current {providerConfig.name} Key</span>
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-gray-400 bg-gray-900/50 px-3 py-2 rounded font-mono">
                  {showKey ? currentKey : maskedKey}
                </code>
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleClear}
                  className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  title="Remove key"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* New Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {currentKey ? `Replace with New ${providerConfig.name} Key` : `Enter Your ${providerConfig.name} Key`}
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder={providerConfig.keyPlaceholder}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono text-sm"
            />

            {/* Validation Result */}
            {validationResult && (
              <div className={`mt-2 text-sm flex items-center gap-2 ${validationResult.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                {validationResult.valid ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {validationResult.budget ? (
                      <span>
                        Key valid! Budget: {Math.round(validationResult.budget.remaining_tokens / validationResult.budget.total_budget * 100)}% remaining
                      </span>
                    ) : (
                      'API key is valid! Saving...'
                    )}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {validationResult.error || 'Invalid key'}
                  </>
                )}
              </div>
            )}
          </div>

          {/* How to Get API Key - only for non-CTI providers */}
          {!isCti && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-200 mb-2">How to Get a Free {providerConfig.name} API Key</h3>
              <ol className="text-xs text-gray-400 space-y-2">
                {providerConfig.getKeyInstructions.map((step, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-purple-400 font-medium">{index + 1}.</span>
                    <span>
                      {index === 0 ? (
                        <>
                          Go to{' '}
                          <a
                            href={providerConfig.getKeyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 underline"
                          >
                            {providerConfig.getKeyUrl.replace('https://', '')}
                          </a>
                        </>
                      ) : (
                        step
                      )}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-gray-500 mt-3">
                {providerConfig.freeInfo}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleValidateAndSave}
            disabled={!keyInput.trim() || isValidating}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg transition-colors flex items-center gap-2"
          >
            {isValidating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Validating...
              </>
            ) : (
              'Validate & Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
