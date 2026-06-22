import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CTI Admin Dashboard",
  description: "Manage CTI keys and provider API keys",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
