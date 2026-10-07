import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Guide PDFs are private (see src/data/guides.ts); bundle them with the route that serves them.
  outputFileTracingIncludes: {
    "/api/guides/[slug]/[kind]": ["./private/guides/**"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "static1.cafe-encore.com",
      },
    ],
  },
  // Guest chat is gone; links to the old inbox in past emails open the trip page instead.
  async redirects() {
    return [
      { source: "/my-trips/inbox", destination: "/my-trips/essential", permanent: true },
      { source: "/my-trips/:ref/inbox", destination: "/my-trips/:ref/essential", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
