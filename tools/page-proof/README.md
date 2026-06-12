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

**Exit codes:** `0` clean · `1` runtime errors found · `2` couldn't run
(no browser / no playwright-core). **Media advisories:** open-source Chromium
ships no H.264, so an `.mp4` abort is reported as `media`, not a failure —
verify videos in branded Chrome.

What it has caught in this repo (the reason it exists): a shader precision
mismatch that failed program validation, a CDN-fetched HDR that crashed a whole
scene when unreachable, a float overshoot that crashed the final chapter, and
frame-rate-dependent damping — none visible to static checks.
