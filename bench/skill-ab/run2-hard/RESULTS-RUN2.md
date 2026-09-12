# Run 2 — hard brief (Meridian Vessel): results

Three builds, one attempt each, `claude-sonnet-5`, isolated sessions, 40-turn / $6 caps.
Skill under test: v2.7.6 + verbatim-copy rule (`6babe60`). Blind labels in `blind/`;
mapping in `blind-map.json` / `REVEAL-RUN2.md`.

## The kit was broken — by the evaluator, equally for all three arms

1. three r182 splits its build into `three.module.js` + `three.core.js`; the kit shipped only
   the first. The library could not load in any arm.
2. `kit/assets/vessel.glb` is Draco-compressed; the kit has no DRACOLoader/decoder. Even with
   (1) fixed, the model cannot load in any arm.

Consequence: **no build could render 3D**, so run 2 cannot compare 3D craft or scroll
choreography. What it does test — and what the brief demanded anyway — is behaviour when
the library and model fail: poster, no uncaught errors, no-JS, reduced-motion, no-WebGL.
Both defects are real-world failure modes; they just weren't the planned ones.

## Raw measurements (as delivered; probe = independent Playwright script, page-proof = repo tool)

| Measure | A · ordinary prompt | B · expert prompt | C · skill |
| --- | --- | --- | --- |
| Finished within 40 turns | yes (38) | **no** (cap hit) | **no** (cap hit) |
| Turns · wall · cost | 38 · 677 s · $1.11 | 41 · 748 s · $1.58 | 41 · 1035 s · $2.00 |
| Files | index.html, poster.svg | index.html, main.js, styles.css | index.html |
| Copy verbatim (9 phrases) | 9/9 | 9/9 | 9/9 |
| Invented headings | none (Form/Glaze/Studio) | copy fragments as headings | none |
| External hosts | 0 | 0 | 0 |
| Uncaught errors, any mode (4 modes × 2 widths) | 0 | 0 | 0 |
| Poster shown when library fails (as delivered) | yes | yes | yes |
| No-JS / reduced-motion / no-WebGL: copy readable, no overflow, no clipped text | all pass | all pass | all pass |
| Model file removed: still no uncaught error, poster stays | yes | yes | yes |
| Console noise with broken kit | 404 ×2 | 404 ×2 + optional RGBELoader 404 | 404 ×2 |
| Agent noticed `three.core.js` missing during its own testing | yes | yes | yes |
| Agent noticed the Draco problem | no | no | no |
| With `three.core.js` added by evaluator: 3D renders? | no (Draco) | no (Draco) | no (Draco; logs a clear warning) |
| page-proof matrix (repo tool) | FAIL (404s) | FAIL (404s) | FAIL (404s) |
| Doctor (skill's rubric, biased) | 83 | 82 | 96 |

Noisy: single samples of turns/time/cost; hero "blankness" std-dev was uninformative because
every hero is a poster. A's "clipped text" hit is its off-screen skip link (false positive).

## Reading
- **Resilience: tie.** All three degraded correctly under every failure we could inject.
  The skill's fallback contracts did not produce a more resilient page than a plain prompt
  on this brief — the plain prompt's build was the only one that finished under the cap.
- **Copy rule: fixed.** The skill build kept all copy verbatim and invented no headings
  (run 1's defect). But A also did, so the rule's effect can't be isolated here.
- **Cost: C ≈ 1.8× A again**, and C did not finish (the skill's verify loop consumed the
  turns — it was still iterating on page-proof failures caused by the kit).
- **Detection: tie.** Every agent found the missing core file in its own browser test;
  none found the Draco dependency. The skill's tools did not add detection the others lacked.
- **3D craft: not measured.** Requires a corrected kit (core file + uncompressed GLB or the
  Draco decoder). That would be a third run, outside the three-build cap.

Author-rated blind comparison: `blind/filmstrip-*.png`, pages in `blind/X|Y|Z`. Not
independent.
