import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Think it through — Symbiotic Thinking Dojo',
  description: 'A two-minute taste of the Dojo: it helps you think, it does not think for you.',
};

// viewport-fit=cover lets the standalone demo use the full mobile screen and
// makes env(safe-area-inset-*) meaningful, so the header and input can dodge
// notches and the home indicator.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function InspireLayout({ children }: { children: React.ReactNode }) {
  return children;
}
