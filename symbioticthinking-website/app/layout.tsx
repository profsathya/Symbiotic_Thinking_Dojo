import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Symbiotic Thinking | AI-Powered Learning That Builds Human Capability",
  description: "The Symbiotic Thinking Dojo trains judgment and superagency through structured practice with AI. Build real cognitive skills, not just get answers.",
  keywords: ["AI education", "metacognition", "critical thinking", "AI literacy", "learning with AI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

function Navigation() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🥋</span>
            <span className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
              Symbiotic Thinking
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/learners" className="text-gray-600 hover:text-emerald-600 transition-colors">
              For Learners
            </Link>
            <Link href="/educators" className="text-gray-600 hover:text-emerald-600 transition-colors">
              For Educators
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-emerald-600 transition-colors">
              About
            </Link>
            <Link href="/support" className="text-gray-600 hover:text-emerald-600 transition-colors">
              Support
            </Link>
          </div>

          {/* CTA */}
          <a
            href="https://dojo.symbioticthinking.ai"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium transition-colors"
          >
            Enter the Dojo
          </a>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden flex gap-4 mt-4 pb-2 overflow-x-auto">
          <Link href="/learners" className="text-sm text-gray-600 hover:text-emerald-600 whitespace-nowrap">
            For Learners
          </Link>
          <Link href="/educators" className="text-sm text-gray-600 hover:text-emerald-600 whitespace-nowrap">
            For Educators
          </Link>
          <Link href="/about" className="text-sm text-gray-600 hover:text-emerald-600 whitespace-nowrap">
            About
          </Link>
          <Link href="/support" className="text-sm text-gray-600 hover:text-emerald-600 whitespace-nowrap">
            Support
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🥋</span>
              <span className="font-semibold text-white">Symbiotic Thinking</span>
            </div>
            <p className="text-gray-400 text-sm max-w-md">
              Building human capability in an age of AI abundance. The Dojo trains judgment and superagency — ensuring AI amplifies your thinking rather than replacing it.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-3">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/learners" className="hover:text-emerald-400 transition-colors">For Learners</Link></li>
              <li><Link href="/educators" className="hover:text-emerald-400 transition-colors">For Educators</Link></li>
              <li><Link href="/about" className="hover:text-emerald-400 transition-colors">About</Link></li>
              <li><Link href="/support" className="hover:text-emerald-400 transition-colors">Support This Effort</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-3">Connect</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://dojo.symbioticthinking.ai" className="hover:text-emerald-400 transition-colors">
                  Enter the Dojo
                </a>
              </li>
              <li>
                <a href="https://github.com/profsathya/Symbiotic_Thinking_Dojo" className="hover:text-emerald-400 transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://computingtalentinitiative.org" className="hover:text-emerald-400 transition-colors">
                  Computing Talent Initiative
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Symbiotic Thinking. Open source under MIT License.</p>
        </div>
      </div>
    </footer>
  );
}
