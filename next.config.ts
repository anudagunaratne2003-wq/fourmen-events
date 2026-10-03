import type { NextConfig } from "next";

/** Browser security headers for every page. */
const securityHeaders = [
  // Nobody may show this site inside a frame, so admin buttons cannot be "clickjacked".
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  // Browsers must trust the declared file type instead of guessing (stops some upload-based attacks).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites only learn our domain, never full addresses such as /account/bookings/<id>.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site never needs the camera, microphone or location.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Always use HTTPS once a visitor has been here (ignored on http://localhost).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
