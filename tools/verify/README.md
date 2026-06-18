# verify-build

One command, one exit code, one report — composes every gate so a phase is proven in a single
call instead of remembering five tools.

```bash
npm run verify -- examples/atelier/index.html            # static contract + doctor
npm run verify -- examples/atelier/index.html --runtime  # + page-proof (needs a browser)
npm run verify -- --fast                                  # static contract only
node tools/verify/verify-build.mjs <dir> --mode-b templates/nextjs --phase polish
```

## What runs

| Step | When | Gate |
|------|------|------|
| `tokens:check` · `themes:check` · `links:check` | always | the design contract is sound |
| `doctor --min N` | a target html is given | taste/perf/a11y/mobile/3D ≥ N (80 build, 85 polish) |
| `page-proof` | `--runtime` (auto for `--phase polish`) | headless run, console errors, scroll shots — **optional** (SKIP without a browser) |
| `mode-b typecheck` + `next build` | `--mode-b <dir>` | Mode B compiles — **optional** (SKIP without `node_modules`) |

## Exit codes

- **0** — every *required* step passed. Optional steps that can't run (no browser / no
  `node_modules`) report `○ SKIP` and don't fail the build.
- **1** — a required step failed (or any optional step failed under `--strict`).

`--json` prints the machine report; `--report <path>` also writes it. This is the gate Phase 12
wires into CI.
