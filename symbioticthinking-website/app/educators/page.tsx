import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For Educators | Symbiotic Thinking",
  description: "Help your students develop critical thinking and metacognitive skills with AI. Privacy-first design means you never see their conversations.",
};

export default function EducatorsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              For Educators
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Teach thinking, not just content
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              The Dojo gives your students a structured environment to practice metacognition
              and critical thinking with AI — while respecting their privacy.
            </p>
          </div>
        </div>
      </section>

      {/* The Challenge */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">The Challenge You&apos;re Facing</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border-l-4 border-red-400 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI as a Shortcut</h3>
              <p className="text-gray-600">
                Students use AI to get answers without engaging with the material.
                Learning suffers even as outputs improve.
              </p>
            </div>

            <div className="border-l-4 border-red-400 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hard to Assess Process</h3>
              <p className="text-gray-600">
                You can evaluate final work, but it&apos;s difficult to see whether students
                actually thought through problems or just accepted AI suggestions.
              </p>
            </div>

            <div className="border-l-4 border-red-400 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills That Transfer</h3>
              <p className="text-gray-600">
                Content knowledge fades. You want students to develop thinking skills
                they&apos;ll use for the rest of their careers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Dojo Helps */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How the Dojo Helps</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            The Dojo creates friction where friction helps learning, while still letting
            students leverage AI&apos;s capabilities.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 border border-gray-100">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-xl mb-4">
                🥋
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Structured Metacognition</h3>
              <p className="text-gray-600 mb-4">
                The Sensei guides students through their thinking process with questions.
                Students practice awareness of how they&apos;re approaching problems.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  UMPIRE framework for problem-solving stages
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  3Cs checkpoint for decisions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  DIKW pyramid for knowledge depth
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-xl mb-4">
                ⚔️
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Cognitive Challenges</h3>
              <p className="text-gray-600 mb-4">
                Sparring Partners challenge different aspects of thinking — ensuring students
                can&apos;t passively accept AI outputs.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">✓</span>
                  The Framer: Problem definition
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">✓</span>
                  The Auditor: Decision rigor
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">✓</span>
                  The Challenger: Assumption testing
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">✓</span>
                  The Reflector: Self-assessment
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl mb-4">
                📊
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Process Visibility</h3>
              <p className="text-gray-600 mb-4">
                Students can generate summaries of their sessions with The Reflector,
                capturing their thinking process for review.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">✓</span>
                  Goal achievement self-assessment
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">✓</span>
                  Creating-Consuming balance
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">✓</span>
                  Strengths and growth areas
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-100">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-xl mb-4">
                🔒
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Privacy by Design</h3>
              <p className="text-gray-600 mb-4">
                Students&apos; conversations stay private. You can ask them to share summaries,
                but you never have access to their raw conversations.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  Client-side architecture
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  Students use their own API keys
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  No server-side data storage
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Using with Students */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Using the Dojo with Students</h2>

          <div className="space-y-8 max-w-3xl">
            <div className="flex gap-6">
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Students Get Free API Keys</h3>
                <p className="text-gray-600">
                  Each student creates a free Google AI API key at{" "}
                  <a href="https://aistudio.google.com/apikey" className="text-emerald-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    Google AI Studio
                  </a>. The free tier is generous enough for coursework.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Assign Challenges</h3>
                <p className="text-gray-600">
                  Direct students to use the Dojo for specific assignments. You can suggest
                  which Sparring Partners to activate or which construct to use.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Summaries</h3>
                <p className="text-gray-600">
                  Ask students to use @reflector at the end of sessions and share the
                  generated summary. This gives you insight into their process without
                  accessing raw conversations.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Assess Thinking, Not Just Output</h3>
                <p className="text-gray-600">
                  Use summaries to evaluate metacognitive engagement, not just final deliverables.
                  Did they frame the problem well? Consider alternatives? Verify their reasoning?
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to try it with your students?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            The Dojo is free and open source. Test it yourself, then share with your class.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://dojo.symbioticthinking.ai"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-blue-700 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Try the Dojo
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Give Feedback
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
