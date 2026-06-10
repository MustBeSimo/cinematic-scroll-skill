# Security

## Reporting

Found a vulnerability? Open a private report via
[GitHub security advisories](https://github.com/MustBeSimo/cinematic-scroll-skill/security/advisories/new)
rather than a public issue.

## Secrets — the FAL_KEY contract

The fal.ai key is real money (every generation bills). The rules, enforced
across the repo:

- `FAL_KEY` lives **only** in `.env.local` (gitignored — `.env*` is blocked,
  only `*.example` templates are tracked). It is **never** committed and
  **never** referenced from a client component.
- The browser reaches fal.ai only through `/api/fal/proxy`
  (`@fal-ai/server-proxy`), which keeps the key server-side and restricts
  forwarding to the model allowlist in `lib/fal-models.ts`.

## API route hardening (`templates/nextjs`)

| Layer | Where | What it does |
|---|---|---|
| Bearer gate | `lib/api-guard.ts` | `GENERATE_API_SECRET` required on billable routes; comparison is timing-safe; **fails closed** (503 / reject-all) when unset in any production build, including Vercel previews |
| Rate limit | `lib/api-guard.ts` | per-IP throttle with a bounded map (spoofed-IP floods can't grow it unbounded; saturation fails closed with 429) |
| Proxy allowlist | `app/api/fal/proxy/route.ts` | only the models in `ALLOWED_FAL_ENDPOINTS` can be invoked; unauthenticated mode requires the explicit `FAL_PROXY_ALLOW_UNAUTH=true` opt-in (local dev only) |
| Webhook verification | `app/api/fal/webhook/route.ts` | ED25519 signature check against fal's JWKS, ±5 min timestamp window (replay protection), fails closed if keys can't be fetched |

## Subresource Integrity

Every versioned CDN `<script>` in the Mode-A examples, the doctor fixtures,
and the HyperFrames film projects carries an `integrity` (sha384) +
`crossorigin="anonymous"` attribute, with hashes computed from the
corresponding npm tarballs (jsdelivr `/npm/` and unpkg serve npm contents
byte-identical). A compromised CDN cannot inject script into a shipped page.

Known gap: `examples/flagship/index.html` loads three.js as ES modules via an
import map; per-module SRI for a module graph isn't practically expressible
yet (the import-map `integrity` key has limited browser support). For
production use, vendor three.js locally or use the Next.js flagship route
(`templates/nextjs`), which bundles it.

## Generation scripts

`scripts/generate-*.mjs` run locally, write only to fixed
`public/...` paths derived from hardcoded chapter ids, allowlist downloaded
file extensions, and use `execFile` (no shell interpolation).
