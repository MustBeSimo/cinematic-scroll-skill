# page-proof — runtime evidence for a cinematic build

The [doctor](../cinematic-doctor/) grades the **static contract** (taste, perf
budget, a11y, mobile, 3D — 0–100, CI-blockable). `page-proof` answers the
question static analysis can't: **does the page actually run, and what does it
look like?** It opens the page in headless Chromium, scrolls through it,
collects every console error / uncaught exception / failed request, and writes
screenshots at each scroll depth.

Built for agent loops: build → `doctor` (contract) → `page-proof` (runtime +
eyes) → fix → repeat. An agent reads `proof.json` for the verdict and *looks at
the shots* before calling a build done.

```bash
npm i -D playwright-core        # once; any Chrome/Chromium works as the binary
node tools/page-proof/proof.mjs examples/noir/index.html
node tools/page-proof/proof.mjs http://localhost:3000/flagship --wait 8000
```

| Flag | Default | Notes |
|---|---|---|
| `--shots 0,0.33,0.66,1` | 4 depths | scroll fractions to screenshot |
| `--out .page-proof/` | | shots + `proof.json` land here |
| `--wait 1200` | ms | settle per shot — use `6000+` for WebGL under software GL |
| `--viewport 1440x900` | | size; run a second pass at `390x844` for mobile |
| `--browser <path>` | auto | also honors `$CHROME_PATH`; auto-detects Playwright/Puppeteer caches and system Chrome |
| `--mobile` | off | touch + mobile browser context; combine with `--viewport 390x844` |
| `--reduced-motion` | off | emulate the preference before navigation |
| `--no-js` | off | disable page scripts to inspect the static fallback |
| `--check-layout` | off | detect overflow, broken visible images, hidden `[data-proof-essential]` elements, and no readable h1 in static/reduced-motion modes |

**Exit codes:** `0` clean · `1` runtime errors found · `2` couldn't run
(no browser / no playwright-core / launch unavailable). HTTP 4xx/5xx responses
fail, including missing media. Only an intentionally aborted media request
(`ERR_ABORTED`, common during seeking) is advisory. Verify codecs in branded Chrome.

## Final evidence matrix

```bash
npm run proof:matrix -- ./index.html
node tools/page-proof/matrix.mjs http://localhost:3000 --out .page-proof/story --shots 0,0.2,0.5,0.8,1
```

Runs desktop, mobile, desktop reduced motion, mobile reduced motion, and no-JS
profiles in separate browser contexts. Each writes screenshots and a `proof.json`;
the output root contains `matrix.json`. Exit 0 means every profile produced clean
evidence, 1 means a runtime/layout failure, 2 means evidence is missing. A failed
profile cannot be hidden by passing profiles. CLI output links to each report;
inspect its errors and screenshots for the actual cause.

Use `data-proof-essential` only on content that must stay visible at every sampled
depth (for example a persistent CTA); not on intentionally timed reveals. Automated
layout checks are deliberately limited. No-JS screenshots do not automatically
certify content completeness, and emulated mobile Chromium does not certify Safari.
Inspect shots and exercise keyboard, reverse scroll, preference changes, and resize
as required by the build. Choose extra sample depths around the signature moment.

What it has caught in this repo (the reason it exists): a shader precision
mismatch that failed program validation, a CDN-fetched HDR that crashed a whole
scene when unreachable, a float overshoot that crashed the final chapter, and
frame-rate-dependent damping — none visible to static checks.
