import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Symbiotic Thinking Dojo",
  description: "An AI-powered practice environment for developing cognitive skills and judgment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-gray-950 font-sans">
        {children}
      </body>
    </html>
  );
}
