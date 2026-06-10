import type { NextConfig } from 'next';

/**
 * Baseline security response headers for the deployed app (defense-in-depth).
 *
 * A strict Content-Security-Policy is intentionally left out: GSAP/Framer Motion
 * and Next.js inject inline styles/scripts, so a wrong CSP silently breaks the
 * page. Add one deliberately (with nonces) once your asset origins are settled —
 * a starting point is commented below.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // {
  //   key: 'Content-Security-Policy',
  //   value: "default-src 'self'; img-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'",
  // },
];

const nextConfig: NextConfig = {
  // R3F v9 + React 19: Strict Mode double-mounts the Canvas in dev, causing
  // "createRoot() on a container that already has a root" — disable until
  // @react-three/fiber resolves the dev-mode cleanup race (production unaffected).
  reactStrictMode: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
