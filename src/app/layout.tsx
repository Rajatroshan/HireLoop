import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cold Mail - Bulk Email Sender",
  description:
    "A Gmail-like bulk email sender built with Next.js and TypeScript",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gmail-bg">{children}</body>
    </html>
  );
}
