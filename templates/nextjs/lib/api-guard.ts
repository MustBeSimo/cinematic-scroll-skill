import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

/**
 * Dependency-free guards for the fal.ai API routes.
 *
 * Why this exists: the generate/proxy routes spend your FAL_KEY (each image is
 * real money). Without a gate, a deployed URL is an anonymous billing drain.
 *
 *   - rateLimit:    best-effort per-IP throttle (always on)
 *   - requireBearer / isBearerValid: optional shared-secret gate
 *     (enabled by setting GENERATE_API_SECRET)
 *
 * Rate limiting is in-memory: it holds within a warm Fluid Compute instance but
 * is not a cross-instance guarantee. For hard global limits, back `hits` with a
 * shared store (Upstash / Vercel KV).
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const hits = new Map<string, number[]>();

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/** Returns null if allowed, or a 429 response if the caller is over the limit. */
export function rateLimit(
  req: NextRequest,
  max = MAX_REQUESTS,
  windowMs = WINDOW_MS,
): NextResponse | null {
  const ip = clientIp(req);
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(windowMs / 1000)) } },
    );
  }
  recent.push(now);
  hits.set(ip, recent);
  return null;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** True if `authorization` carries the configured `Bearer <GENERATE_API_SECRET>`. */
export function isBearerValid(authorization: string | null | undefined): boolean {
  const secret = process.env.GENERATE_API_SECRET;
  if (!secret) return false;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  return safeEqual(token, secret);
}

/**
 * Optional shared-secret gate for route handlers.
 *   - GENERATE_API_SECRET unset -> no-op (returns null) so local dev / demos work.
 *   - set                       -> requires `Authorization: Bearer <secret>`.
 * Returns null if allowed, or a 401 response otherwise.
 */
export function requireBearer(req: NextRequest): NextResponse | null {
  if (!process.env.GENERATE_API_SECRET) return null;
  if (isBearerValid(req.headers.get('authorization'))) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
