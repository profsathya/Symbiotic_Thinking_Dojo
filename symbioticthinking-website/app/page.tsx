import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-purple-50" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Learn to think <span className="text-emerald-600">with</span> AI,
              <br />not <span className="text-gray-400">let it</span> think for you
            </h1>
            <p className="mt-6 text-xl text-gray-600 leading-relaxed">
              The Symbiotic Thinking Dojo is an AI-powered practice environment that builds your
              judgment, metacognition, and problem-solving skills. AI becomes your thinking partner,
              not your replacement.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="https://dojo.symbioticthinking.ai"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center gap-2"
              >
                Enter the Dojo
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <Link
                href="/about"
                className="bg-white hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg border border-gray-300 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900">The Problem with Most AI Tools</h2>
            <p className="mt-4 text-lg text-gray-600">
              When AI does the thinking for you, you lose the skills that matter most.
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-2 gap-8">
            {/* Problem side */}
            <div className="bg-red-50 rounded-2xl p-8 border border-red-100">
              <h3 className="text-xl font-semibold text-red-800 mb-6">The Dependency Trap</h3>
              <ul className="space-y-4">
                {[
                  "Accept AI outputs without critical evaluation",
                  "Skip the productive struggle that builds understanding",
                  "Develop dependency instead of capability",
                  "Lose metacognitive skills that make you valuable",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-red-700">
                    <svg className="w-6 h-6 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution side */}
            <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-100">
              <h3 className="text-xl font-semibold text-emerald-800 mb-6">The Symbiotic Approach</h3>
              <ul className="space-y-4">
                {[
                  "Build judgment — know which problems are worth solving",
                  "Develop metacognition — awareness of your thinking",
                  "Create transferable skills that compound",
                  "Maintain agency — you remain the decision-maker",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-emerald-700">
                    <svg className="w-6 h-6 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900">How the Dojo Works</h2>
            <p className="mt-4 text-lg text-gray-600">
              Practice with AI that challenges you to think better, not just get answers faster.
            </p>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {/* Sensei */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl mb-6">
                🥋
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">The Sensei</h3>
              <p className="text-gray-600">
                Your metacognitive coach guides through questions, not answers.
                Helps you stay aware of your thinking process without doing the thinking for you.
              </p>
            </div>

            {/* Sparring Partners */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-2xl mb-6">
                ⚔️
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sparring Partners</h3>
              <p className="text-gray-600">
                Five AI personas that challenge different aspects of your thinking:
                The Framer, Auditor, Connector, Challenger, and Reflector.
              </p>
            </div>

            {/* Frameworks */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mb-6">
                📊
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Progress Tracking</h3>
              <p className="text-gray-600">
                Visual feedback on your engagement: DIKW Pyramid, UMPIRE Cycle,
                and Creating-Consuming Balance help you see your growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Privacy First
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Your conversations stay private
              </h2>
              <p className="text-gray-300 text-lg mb-6">
                The Dojo uses a client-side architecture. Your API key and conversations
                never pass through our servers — they go directly from your browser to the AI.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  API key stored only in your browser
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Zero server-side data storage
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Open source — verify it yourself
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to train your thinking?
          </h2>
          <p className="text-xl text-emerald-100 mb-10">
            The Dojo is free to use. Bring your own API key and start practicing.
          </p>
          <a
            href="https://dojo.symbioticthinking.ai"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-emerald-700 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            Enter the Dojo
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}
