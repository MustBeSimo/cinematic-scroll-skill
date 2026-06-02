import { createRouteHandler } from '@fal-ai/server-proxy/nextjs';
import { ALLOWED_FAL_ENDPOINTS } from '@/lib/fal-models';
import { isBearerValid } from '@/lib/api-guard';

export const runtime = 'nodejs';

/**
 * fal.ai server proxy — keeps FAL_KEY off the client.
 *
 * Auth model:
 *   - `allowedEndpoints` restricts WHICH fal models the proxy will forward to,
 *     so a compromised client can't burn your account on arbitrary models.
 *   - `isAuthenticated` restricts WHO may reach it: by default the proxy requires
 *     `Authorization: Bearer <GENERATE_API_SECRET>` in EVERY environment.
 *
 * Previously this was keyed on `NODE_ENV !== 'production'`, which left Vercel
 * preview/staging URLs (publicly reachable, built with NODE_ENV=production but
 * often missing the secret) as open, billable fal proxies. Now it is secure by
 * default; to intentionally run an open proxy (pure local dev), set
 * FAL_PROXY_ALLOW_UNAUTH=true.
 *
 * Reference: https://fal.ai/docs/model-endpoints/server-side
 */
const allowUnauthenticated = process.env.FAL_PROXY_ALLOW_UNAUTH === 'true';

export const { GET, POST, PUT } = createRouteHandler({
  allowedEndpoints: ALLOWED_FAL_ENDPOINTS.map((id) => `${id}/**`),
  allowUnauthorizedRequests: allowUnauthenticated,
  // `behavior` is inferred from @fal-ai/server-proxy (its getHeader returns a
  // HeaderValue that may be string | string[] | undefined) — don't hand-annotate
  // it as `string | null`, which is narrower and fails the typecheck.
  async isAuthenticated(behavior) {
    if (allowUnauthenticated) return true;
    const auth = behavior.getHeader('authorization');
    return isBearerValid(Array.isArray(auth) ? auth[0] : auth);
  },
});
