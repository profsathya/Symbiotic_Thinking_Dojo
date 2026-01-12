import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | Symbiotic Thinking",
  description: "Learn about the philosophy behind Symbiotic Thinking and the team building tools for human capability in the age of AI.",
};

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 via-white to-purple-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Building human capability in the age of AI
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              We believe AI should make humans more capable, not more dependent.
              Every tool we build asks: does this develop human skill, or just get to an answer faster?
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Our Philosophy</h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">The Problem We See</h3>
              <p className="text-gray-600 mb-4">
                AI is incredibly powerful at generating outputs. But when we use it as a shortcut
                to skip thinking, we hollow out the very skills that make us valuable.
              </p>
              <p className="text-gray-600">
                The pattern is seductive: ask AI, get answer, move on. But each time we do this,
                we miss an opportunity to develop judgment, build understanding, and strengthen
                our ability to navigate novel situations.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-emerald-700 mb-4">Our Approach</h3>
              <p className="text-gray-600 mb-4">
                We design AI interactions that make you think harder, not less. The Dojo creates
                &quot;productive friction&quot; — challenges that force active engagement while
                still leveraging AI&apos;s capabilities.
              </p>
              <p className="text-gray-600">
                The goal is symbiosis: humans and AI each contributing what they do best.
                AI brings knowledge and pattern-matching; you bring judgment, creativity,
                and accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Design Principles</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: "🎯",
                title: "Judgment over Execution",
                description: "In the age of AI, knowing what to do matters more than doing it fast. We optimize for decision quality, not speed."
              },
              {
                icon: "❓",
                title: "Questions over Answers",
                description: "The Sensei guides through inquiry. Good questions develop thinking; quick answers can short-circuit it."
              },
              {
                icon: "💪",
                title: "Productive Struggle",
                description: "Some difficulty is necessary for learning. We don't rush to resolve every challenge — we help you work through them."
              },
              {
                icon: "🧠",
                title: "Metacognitive Awareness",
                description: "Thinking about your thinking. The Dojo makes cognitive processes visible so you can improve them."
              }
            ].map((principle, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="text-3xl mb-4">{principle.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{principle.title}</h3>
                <p className="text-gray-600 text-sm">{principle.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Who We Are</h2>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl">
            {/* Sathya */}
            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Dr. Sathya Narayanan</h3>
              <p className="text-emerald-600 font-medium mb-4">
                Professor of Computer Science & Director
              </p>
              <p className="text-gray-600 mb-4">
                Professor of Computer Science at California State University, Monterey Bay.
                Director of the Computing Talent Initiative, focused on developing
                AI-native approaches to computing education.
              </p>
              <a
                href="mailto:snarayanan@computingtalentinitiative.org"
                className="text-emerald-600 hover:text-emerald-700 text-sm"
              >
                snarayanan@computingtalentinitiative.org
              </a>
            </div>

            {/* CTI */}
            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Computing Talent Initiative</h3>
              <p className="text-emerald-600 font-medium mb-4">
                California State University, Monterey Bay
              </p>
              <p className="text-gray-600 mb-4">
                An institute dedicated to reimagining computing education for the AI age.
                We research and build tools that develop human capability rather than replace it.
              </p>
              <a
                href="https://computingtalentinitiative.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700 text-sm"
              >
                computingtalentinitiative.org →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Transparency</h2>

          <div className="max-w-3xl space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Open Source</h3>
              <p className="text-gray-600 mb-2">
                The Dojo is fully open source under the MIT license. You can inspect every line
                of code, verify our privacy claims, and contribute improvements.
              </p>
              <a
                href="https://github.com/profsathya/Symbiotic_Thinking_Dojo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700 text-sm"
              >
                View on GitHub →
              </a>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy Architecture</h3>
              <p className="text-gray-600 mb-2">
                We designed the Dojo so we literally cannot access your conversations.
                Your API key stays in your browser. Messages go directly to Google&apos;s API.
                Our servers only serve the application code.
              </p>
              <Link href="/" className="text-emerald-600 hover:text-emerald-700 text-sm">
                Learn about our privacy architecture →
              </Link>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Hidden Agenda</h3>
              <p className="text-gray-600">
                We&apos;re not building this to collect data, train models, or drive ad revenue.
                We&apos;re educators who believe AI literacy is one of the most important skills
                for the coming decades, and we want to give students the right tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Want to contribute or connect?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            We&apos;re building this in the open and welcome collaborators.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/profsathya/Symbiotic_Thinking_Dojo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-emerald-700 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              GitHub
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Support This Effort
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
