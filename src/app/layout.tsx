import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://bunks.com"),
  title: {
    default: "Bunks | Unique Stays & Bunkhouses",
    template: "%s | Bunks",
  },
  description: "Book unique bunkhouses and boutique stays with ease. Experience curated properties in top destinations.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Bunks",
    title: "Bunks | Unique Stays & Bunkhouses",
    description: "Book unique bunkhouses and boutique stays with ease. Experience curated properties in top destinations.",
    images: [
      {
        url: "/og-image.jpg", // We need to ensure this exists or use a fallback
        width: 1200,
        height: 630,
        alt: "Bunks - Unique Stays",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bunks | Unique Stays & Bunkhouses",
    description: "Book unique bunkhouses and boutique stays with ease.",
    images: ["/og-image.jpg"],
  },
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
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body className={`${poppins.className} ${devBodyClassName ?? ""}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
