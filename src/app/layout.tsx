import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bunks",
  description: "Book unique bunkhouses and boutique stays with ease.",
  icons: {
    icon: "/favicon-32x32.png",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "android-chrome", url: "/android-chrome-192x192.png" },
      { rel: "android-chrome", url: "/android-chrome-512x512.png" },
    ],
  },
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
