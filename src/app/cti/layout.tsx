import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Talk to the Sensei about this poster — CTI at INSPIRE 2026',
  description:
    'Human Value that Grows with AI Capability. Pick the box you are looking at; the Sensei asks what you took from it, then goes one layer deeper with you.',
};

// viewport-fit=cover makes env(safe-area-inset-*) meaningful, so the header
// and the composer can dodge notches and the home indicator.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function CtiPosterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Jost, the poster's typeface. Loaded at run time (not next/font) so
          the build needs no network; the font stack falls back if it fails. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* This font belongs to this one page, which is what the rule warns about. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&display=swap"
        precedence="default"
      />
      {children}
    </>
  );
}
