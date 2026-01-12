import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support This Effort | Symbiotic Thinking",
  description: "Help us build AI-native education tools. Share feedback, contribute experiences, or support our development.",
};

export default function SupportPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 via-white to-emerald-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Support This Effort
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              The Symbiotic Thinking Dojo is a research and education project. Your feedback,
              experiences, and support help us build better tools for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* Ways to Help */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Ways to Contribute</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feedback */}
            <div className="bg-gray-50 rounded-xl p-8">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl mb-4">
                💬
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Share Feedback</h3>
              <p className="text-gray-600 mb-6">
                Tell us what&apos;s working, what&apos;s confusing, and what you wish the Dojo could do.
                Your input directly shapes development.
              </p>
              <a
                href="mailto:snarayanan@computingtalentinitiative.org?subject=Symbiotic Thinking Dojo Feedback"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Send Feedback
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            </div>

            {/* Share Experience */}
            <div className="bg-gray-50 rounded-xl p-8">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-xl mb-4">
                📤
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Share Your Experience</h3>
              <p className="text-gray-600 mb-6">
                Voluntarily share your Dojo session summaries to help us understand how the tool
                is being used and how to improve it.
              </p>
              <div className="inline-flex items-center gap-2 text-gray-400 font-medium">
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded">Coming Soon</span>
                Upload Portal
              </div>
            </div>

            {/* Code */}
            <div className="bg-gray-50 rounded-xl p-8">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-xl mb-4">
                💻
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Contribute Code</h3>
              <p className="text-gray-600 mb-6">
                The Dojo is open source. Submit bug fixes, suggest features, or help build
                new Sparring Partners.
              </p>
              <a
                href="https://github.com/profsathya/Symbiotic_Thinking_Dojo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                View on GitHub
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stakeholders */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Who&apos;s Building This</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            The Symbiotic Thinking Dojo is developed by the Computing Talent Initiative at
            California State University, Monterey Bay.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
            <div className="bg-white rounded-xl p-8 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Computing Talent Initiative</h3>
              <p className="text-gray-600 mb-4">
                A research institute focused on reimagining computing education for the AI age.
                We develop pedagogical frameworks, build educational tools, and study how students
                can best learn to work with AI.
              </p>
              <a
                href="https://computingtalentinitiative.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                computingtalentinitiative.org →
              </a>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Project Lead</h3>
              <p className="text-gray-600 mb-4">
                Dr. Sathya Narayanan, Professor of Computer Science and Director of the
                Computing Talent Initiative at CSUMB.
              </p>
              <a
                href="mailto:snarayanan@computingtalentinitiative.org"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                snarayanan@computingtalentinitiative.org
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Funding */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Supporting Development</h2>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 mb-8">
              <h3 className="text-xl font-semibold text-amber-800 mb-4">Why Funding Matters</h3>
              <p className="text-gray-700 mb-4">
                The Symbiotic Thinking Dojo is part of a larger effort to develop
                <strong> AI-Native Solution Engineering</strong> curriculum — teaching students
                to build with AI while maintaining strong fundamentals and critical thinking.
              </p>
              <p className="text-gray-700">
                Funding supports continued development, user research, classroom pilots, and
                expansion of the toolset beyond the Dojo.
              </p>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-4">What We&apos;re Building Toward</h3>
            <ul className="space-y-3 text-gray-600 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Additional Sparring Partners for specialized domains (writing, coding, research)</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Instructor dashboard for classroom deployment</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Research studies on metacognitive skill development</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Full AI-Native Solution Engineering curriculum</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Broader testing and refinement across diverse student populations</span>
              </li>
            </ul>

            <div className="bg-gray-100 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-2">Interested in supporting this work?</h4>
              <p className="text-gray-600 mb-4">
                Whether you represent a foundation, institution, or are an individual who
                believes in this mission, we&apos;d love to connect.
              </p>
              <a
                href="mailto:snarayanan@computingtalentinitiative.org?subject=Supporting Symbiotic Thinking Development"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Get in Touch
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Requests */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Have an Idea?</h2>
          <p className="text-xl text-gray-300 mb-8">
            We&apos;re actively developing the Dojo. If you have feature requests or ideas,
            we want to hear them.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/profsathya/Symbiotic_Thinking_Dojo/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Submit on GitHub
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <a
              href="mailto:snarayanan@computingtalentinitiative.org?subject=Feature Idea for Symbiotic Thinking Dojo"
              className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Email Us
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
