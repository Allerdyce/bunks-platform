import type { Metadata } from "next";
import { DM_Sans, Lora } from "next/font/google";
import "./globals.css";

const bodyFont = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const editorialFont = Lora({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--font-editorial", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://bunks.com"),
  title: {
    default: "Bunks | Repeat Stays & Savings",
    template: "%s | Bunks",
  },
  description: "Book unique bunkhouses and boutique stays. Experience curated properties in top destinations.",
  applicationName: "Bunks",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Bunks",
    title: {
      default: "Bunks | Repeat Stays & Savings",
      template: "%s | Bunks",
    },
    description: "Book unique bunkhouses and boutique stays. Experience curated properties in top destinations.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Bunks - Unique Stays",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "Bunks | Repeat Stays & Savings",
      template: "%s | Bunks",
    },
    description: "Book unique bunkhouses and boutique stays.",
    images: ["/og-image.jpg"],
    creator: "@bunks",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: "/site.webmanifest",
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
  const devBodyClassName = process.env.NODE_ENV === "development" ? "__text_mode_READY__" : undefined;

  return (
    <html lang="en" className={`${bodyFont.variable} ${editorialFont.variable}`} suppressHydrationWarning>
      <body className={`${bodyFont.className} ${devBodyClassName ?? ""}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
