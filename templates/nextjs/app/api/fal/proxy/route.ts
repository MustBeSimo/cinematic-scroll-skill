import { createRouteHandler } from '@fal-ai/server-proxy/nextjs';
import { ALLOWED_FAL_ENDPOINTS } from '@/lib/fal-models';

export const runtime = 'nodejs';

/**
 * fal.ai server proxy — keeps FAL_KEY off the client.
 *
 * Production hardening:
 *   - `allowedEndpoints` restricts which fal models the proxy will forward to,
 *     so a compromised client can't burn your account on arbitrary models.
 *   - In production, set `allowUnauthorizedRequests: false` and provide
 *     `isAuthenticated` to require a session cookie / bearer token.
 *
 * Reference: https://fal.ai/docs/documentation/model-apis/inference/proxy-setup
 */
export const { GET, POST, PUT } = createRouteHandler({
  allowedEndpoints: ALLOWED_FAL_ENDPOINTS.map((id) => `${id}/**`),
  allowUnauthorizedRequests: process.env.NODE_ENV !== 'production',
});
