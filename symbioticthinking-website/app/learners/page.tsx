import { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Learners | Symbiotic Thinking",
  description: "Build superagency and critical thinking skills with AI. The Dojo helps you develop judgment that compounds over time.",
};

export default function LearnersPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-50 via-white to-emerald-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              For Learners
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Build skills that AI can&apos;t replace
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              The Dojo doesn&apos;t give you answers — it helps you become the kind of thinker who
              asks better questions, makes better decisions, and creates real value.
            </p>
          </div>
        </div>
      </section>

      {/* Why This Matters */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Why This Matters for Your Future</h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">The Old Value Proposition</h3>
              <p className="text-gray-600 mb-4">
                &quot;I can code / write / analyze / research.&quot;
              </p>
              <p className="text-gray-500">
                These execution skills are increasingly commoditized by AI. Anyone with access
                to the same tools can produce similar outputs.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-emerald-700 mb-4">The New Value Proposition</h3>
              <p className="text-gray-600 mb-4">
                &quot;I know which problems are worth solving, and I can lead the solution.&quot;
              </p>
              <p className="text-gray-500">
                Judgment, critical thinking, and metacognition — the skills that let you
                direct AI rather than be directed by it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Develop */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What You&apos;ll Develop</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            The Dojo trains specific cognitive skills through structured practice.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🎯",
                title: "Problem Framing",
                description: "Learn to define problems precisely before jumping to solutions. Understand why this matters more than execution speed."
              },
              {
                icon: "🔍",
                title: "Critical Evaluation",
                description: "Develop the habit of questioning AI outputs. Know when to accept, when to push back, and when to dig deeper."
              },
              {
                icon: "🧠",
                title: "Metacognition",
                description: "Build awareness of your own thinking process. Recognize when you're being passive vs. actively engaged."
              },
              {
                icon: "🔗",
                title: "Cross-Domain Thinking",
                description: "Connect ideas across different fields. See patterns that others miss by drawing on diverse knowledge."
              },
              {
                icon: "⚖️",
                title: "Decision Making",
                description: "Practice the 3Cs: Context, Choices, Confirmation. Make decisions you can defend and verify."
              },
              {
                icon: "📈",
                title: "Knowledge Depth",
                description: "Move beyond surface-level data to genuine understanding. Climb the DIKW pyramid from information to wisdom."
              }
            ].map((skill, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="text-3xl mb-4">{skill.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{skill.title}</h3>
                <p className="text-gray-600 text-sm">{skill.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">How the Dojo Works</h2>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex gap-8 items-start">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Bring Your Challenge</h3>
                <p className="text-gray-600">
                  Come with a real problem you&apos;re working on — a project, an assignment, a question
                  you&apos;re exploring. The Dojo works best with authentic challenges.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-8 items-start">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Engage the Sensei & Partners</h3>
                <p className="text-gray-600">
                  The Sensei guides your thinking with questions. Sparring Partners challenge
                  specific aspects — framing, reasoning, connections, assumptions, and reflection.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-8 items-start">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Track Your Growth</h3>
                <p className="text-gray-600">
                  Visual indicators show your engagement level, knowledge depth, and problem-solving
                  stage. Use The Reflector to generate summaries of your learning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to start training?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            The Dojo is free. You just need a Google AI API key (also free).
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://dojo.symbioticthinking.ai"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-emerald-700 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Enter the Dojo
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Get Free API Key
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
