'use client';

import { useEffect, useState } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'philosophy' | 'interface' | 'privacy';

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('philosophy');

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden mx-4">
        {/* Header with Tabs */}
        <div className="border-b border-gray-800">
          <div className="flex items-center justify-between px-6 pt-4 pb-0">
            <h2 className="text-lg font-semibold text-gray-100">Learn About the Dojo</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab buttons */}
          <div className="flex gap-1 px-6 mt-3">
            <button
              onClick={() => setActiveTab('philosophy')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'philosophy'
                  ? 'bg-gray-800 text-gray-100 border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Philosophy
              </span>
            </button>
            <button
              onClick={() => setActiveTab('interface')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'interface'
                  ? 'bg-gray-800 text-gray-100 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Interface
              </span>
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'privacy'
                  ? 'bg-gray-800 text-gray-100 border-b-2 border-emerald-500'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Privacy & Setup
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-160px)]">
          {activeTab === 'philosophy' && <PhilosophyContent />}
          {activeTab === 'interface' && <InterfaceContent />}
          {activeTab === 'privacy' && <PrivacyContent />}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function PhilosophyContent() {
  return (
    <div className="space-y-6 text-gray-300 text-sm">
      <section>
        <h3 className="text-base font-semibold text-gray-100 mb-2">What is the Symbiotic Thinking Dojo?</h3>
        <p>
          The Dojo is a space for developing your thinking skills alongside AI. Rather than having AI do your thinking for you, we help you become a better thinker <em>with</em> AI as your partner.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-100 mb-2">The Personal Stack</h3>
        <p className="mb-3">Three layers that build on each other:</p>
        <div className="space-y-3">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h4 className="font-medium text-amber-400 mb-1">Mindset: Creating vs Consuming</h4>
            <p className="text-gray-400">Are you actively engaging with ideas (creating) or passively accepting answers (consuming)? The goal is a healthy balance, tilted toward creating.</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h4 className="font-medium text-emerald-400 mb-1">Metacognition: UMPIRE + 3Cs</h4>
            <p className="text-gray-400">A structured approach to problem-solving: Understand, Map, Plan, Implement, Review, Evaluate. Each step tied to Context, Choices, and Confirmation.</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h4 className="font-medium text-purple-400 mb-1">Motivation: DIKW Pyramid</h4>
            <p className="text-gray-400">Climb from Data to Information to Knowledge to Wisdom. The higher you go, the more you can apply learning to new, ambiguous situations.</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-100 mb-2">Key Principles</h3>
        <ul className="space-y-2">
          <li className="flex gap-2">
            <span className="text-emerald-500">•</span>
            <span><strong>Judgment over execution</strong> — In the age of AI, your value comes from knowing which problems are worth solving and why.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-500">•</span>
            <span><strong>Questions over answers</strong> — The Sensei guides through questions, helping you discover insights rather than receive them.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-500">•</span>
            <span><strong>Productive struggle</strong> — Some difficulty is necessary for learning. We don't rush to resolve every challenge.</span>
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-100 mb-2">The Sensei & Sparring Partners</h3>
        <p className="mb-2">
          The <strong>Sensei</strong> is your metacognitive coach — asking questions to help you reflect on your own thinking.
        </p>
        <p>
          <strong>Sparring Partners</strong> challenge you from different angles: The Framer helps scope problems, the Auditor checks your reasoning, the Connector links ideas, and the Challenger pushes you deeper.
        </p>
      </section>
    </div>
  );
}

function InterfaceContent() {
  return (
    <div className="space-y-6 text-gray-300 text-sm">
      <section>
        <h3 className="text-base font-semibold text-gray-100 mb-2">Left Panel: Your Controls</h3>
        <div className="space-y-3">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h4 className="font-medium text-purple-400 mb-1">Guided Practice</h4>
            <p className="text-gray-400">Start an Ikigai discovery session — a guided journey to explore your interests, strengths, and purpose.</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h4 className="font-medium text-blue-400 mb-1">Constructs (Learn / Learn+Solve / Learn+Solve+Build)</h4>
            <p className="text-gray-400">Choose your engagement level. "Learn" for exploration, "Learn+Solve" for working through problems, "Learn+Solve+Build" for creating something real.</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h4 className="font-medium text-amber-400 mb-1">Sparring Partners</h4>
            <p className="text-gray-400">Toggle partners on/off. Each brings a different perspective to challenge and deepen your thinking.</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-100 mb-2">Right Panel: Your Progress</h3>
        <div className="space-y-3">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h4 className="font-medium text-purple-400 mb-1">DIKW Pyramid</h4>
            <p className="text-gray-400">Shows the depth of your current conversation. The marker shows where you are now; climb higher by asking "why" and "what if" questions.</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h4 className="font-medium text-emerald-400 mb-1">UMPIRE Cycle</h4>
            <p className="text-gray-400">Track your problem-solving stage. Click any stage to indicate where you are. Notice the loop arrows — iteration is expected!</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h4 className="font-medium text-amber-400 mb-1">Creating-Consuming Balance</h4>
            <p className="text-gray-400">Visual indicator of your engagement style. If it tilts too far toward "consuming," the Sensei may gently prompt you to engage more actively.</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-100 mb-2">Center: The Conversation</h3>
        <p>
          This is where you interact with the Sensei and any active Sparring Partners. The background color subtly shifts based on your Creating-Consuming balance — a gentle visual cue about your engagement.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-100 mb-2">Tips for Getting Started</h3>
        <ul className="space-y-2">
          <li className="flex gap-2">
            <span className="text-emerald-500">1.</span>
            <span>Try <strong>Guided Practice</strong> first if you're not sure what to work on.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-500">2.</span>
            <span>Start in <strong>Learn</strong> mode to explore ideas without pressure.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-500">3.</span>
            <span>Add a <strong>Sparring Partner</strong> when you want to be challenged.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-500">4.</span>
            <span>Watch the <strong>DIKW Pyramid</strong> — try to climb it by asking deeper questions.</span>
          </li>
        </ul>
      </section>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="space-y-6 text-gray-300 text-sm">
      {/* Privacy Notice */}
      <section>
        <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-4 mb-4">
          <div className="flex gap-3">
            <svg className="w-6 h-6 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <h3 className="text-base font-semibold text-emerald-300 mb-1">Your Privacy is Protected</h3>
              <p className="text-emerald-200/80">
                This app is designed with <strong>privacy-first architecture</strong>. Your conversations go directly from your browser to Google&apos;s Gemini API — our servers never see your messages or API key.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-100 mb-3">How It Works</h3>
        <div className="space-y-3">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h4 className="font-medium text-purple-400 mb-1">1. Your API Key Stays Local</h4>
            <p className="text-gray-400">Your Gemini API key is stored in your browser&apos;s localStorage. It never leaves your device or passes through our servers.</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h4 className="font-medium text-blue-400 mb-1">2. Direct Connection to Google</h4>
            <p className="text-gray-400">When you chat, your messages go directly from your browser to Google&apos;s Gemini API. We have zero access to your conversation content.</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h4 className="font-medium text-emerald-400 mb-1">3. Nothing Stored on Our End</h4>
            <p className="text-gray-400">We don&apos;t store messages, API keys, or any personal data. The only thing we serve is the app code itself.</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-100 mb-3">Getting Started</h3>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h4 className="font-medium text-gray-200 mb-3">Get a Free Gemini API Key</h4>
          <ol className="space-y-2 text-gray-400">
            <li className="flex gap-2">
              <span className="text-purple-400 font-medium">1.</span>
              <span>
                Go to{' '}
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  Google AI Studio
                </a>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-400 font-medium">2.</span>
              <span>Sign in with your Google account</span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-400 font-medium">3.</span>
              <span>Click &quot;Create API Key&quot;</span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-400 font-medium">4.</span>
              <span>Copy the key and paste it into the &quot;Set API Key&quot; button in the sidebar</span>
            </li>
          </ol>
          <p className="text-xs text-gray-500 mt-3 border-t border-gray-700 pt-3">
            The free tier includes generous usage limits (~15 requests/min, ~1M tokens/day) — more than enough for personal learning.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-100 mb-2">What Google Sees</h3>
        <p className="text-gray-400">
          When you use the Dojo, your conversations are sent to Google&apos;s Gemini API under your own API key. Google&apos;s{' '}
          <a
            href="https://ai.google.dev/gemini-api/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            API terms
          </a>
          {' '}apply to that data. We recommend reviewing their privacy practices if you have concerns.
        </p>
      </section>
    </div>
  );
}
