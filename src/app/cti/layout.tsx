import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';

export const metadata: Metadata = {
  title: "Talk to Sensei about CTI's Human Value Framework",
  description: "Talk to Sensei about CTI's Human Value Framework",
};

// viewport-fit=cover makes env(safe-area-inset-*) meaningful, so the header
// and the composer can dodge notches and the home indicator.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Jost, the poster's typeface, served from this app (latin subset, from the
// @fontsource/jost package; SIL Open Font License, see fonts/LICENSE). It is
// self-hosted on purpose: docs/PRIVACY.md promises the Dojo contacts no third
// party except the answering AI provider, so a visit to /cti must not fetch
// a stylesheet or font files from Google.
const jost = localFont({
  src: [
    { path: './fonts/jost-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/jost-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/jost-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/jost-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-jost',
  display: 'swap',
});

export default function CtiPosterLayout({ children }: { children: React.ReactNode }) {
  // display: contents keeps this wrapper out of the page's layout; it only
  // carries the font variable down to the page.
  return (
    <div className={jost.variable} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}
