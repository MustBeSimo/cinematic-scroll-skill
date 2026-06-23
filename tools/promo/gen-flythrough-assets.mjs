/**
 * gen-flythrough-assets.mjs — generate fal.ai assets for the three scroll
 * fly-through examples (gallery / jungle / aureus): equirectangular environment
 * panoramas (used as Three.js IBL / shader reflections) + gallery artwork.
 *
 *   node tools/promo/gen-flythrough-assets.mjs --dry-run     # print prompts only
 *   node tools/promo/gen-flythrough-assets.mjs               # generate all
 *   node tools/promo/gen-flythrough-assets.mjs gallery       # one page only
 *
 * Reads FAL_KEY from the shell env or .env.local (repo root). The key is never
 * printed and never leaves this process. Calls the synchronous fal.run endpoint
 * directly (same pattern as templates/nextjs/scripts/generate-chapter-assets.mjs)
 * and downloads each image locally so the pages work offline / off the fal CDN.
 */
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const MODEL = process.env.FAL_IMAGE_MODEL || "fal-ai/flux-2-pro";
const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const only = argv.find((a) => !a.startsWith("--"));

// ── load FAL_KEY ────────────────────────────────────────────────────────────
let FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY && existsSync(join(ROOT, ".env.local"))) {
  const m = (await readFile(join(ROOT, ".env.local"), "utf8")).match(/^\s*FAL_KEY\s*=\s*(.+?)\s*$/m);
  if (m) FAL_KEY = m[1].replace(/^["']|["']$/g, "");
}
if (!FAL_KEY && !dryRun) {
  console.error("✗ FAL_KEY missing — add it to .env.local (repo root) or the shell env.");
  process.exit(1);
}

const NEG =
  "no people, no humans, no text, no watermark, no logo, no signature, no caption, no letters";

// equirectangular panoramas: 2:1, used as scene.environment (IBL) + reflections
const ENV = (subject) =>
  `equirectangular 360 panorama, seamless HDRI environment map, ${subject}, high dynamic range, even exposure, no horizon distortion, ${NEG}, photorealistic`;

// flat artwork that fills the canvas (the gold frame is real geometry on the page)
const ART = (subject) =>
  `museum-quality framed artwork, flat painting filling the entire canvas edge to edge, ${subject}, gallery wall art, rich texture, dramatic gallery lighting, ${NEG}`;

const JOBS = {
  gallery: [
    { out: "env.jpg", w: 2048, h: 1024, prompt: ENV("the luminous interior of a grand neoclassical art museum atrium, warm cream travertine and marble, soft golden daylight from a high glass roof, polished stone floor, brass trim, airy and bright") },
    { out: "art-1.jpg", w: 1024, h: 1536, prompt: ART("a sweeping abstract golden landscape, warm brass amber and bronze, luminous impasto oil") },
    { out: "art-2.jpg", w: 1024, h: 1536, prompt: ART("a dramatic chiaroscuro study of a sunlit marble colonnade and archway, warm gold light and deep shadow, old-master oil") },
    { out: "art-3.jpg", w: 1024, h: 1536, prompt: ART("a minimal geometric modern composition in brass gold and deep slate blue, clean color-field") },
    { out: "art-4.jpg", w: 1024, h: 1536, prompt: ART("a luminous still life of brass and copper vessels on dark cloth, dutch-master oil") },
    { out: "art-5.jpg", w: 1024, h: 1536, prompt: ART("an abstract expressionist canvas of gold leaf, amber and charcoal sweeps, museum quality") },
    { out: "art-6.jpg", w: 1024, h: 1536, prompt: ART("a serene tonal golden-hour landscape, misty hills bathed in warm light, atmospheric oil") },
  ],
  jungle: [
    { out: "env.jpg", w: 2048, h: 1024, prompt: ENV("a lush sunlit tropical rainforest canopy, brilliant emerald and lime foliage, golden god-rays streaming through the leaves, bright vivid daylight, humid glow") },
    { out: "backdrop.jpg", w: 1536, h: 1024, prompt: `a dense sunlit jungle canopy with golden light shafts and glowing green leaves, deep atmospheric perspective, vivid, ${NEG}, painterly photoreal` },
  ],
  aureus: [
    { out: "env.jpg", w: 2048, h: 1024, prompt: ENV("a luxurious dark luxe studio, sweeping cyan and warm-gold rim lights, glossy black surfaces, soft volumetric highlights, dramatic reflective showroom for liquid chrome") },
  ],
};

function buildInput(prompt, w, h) {
  if (MODEL.startsWith("fal-ai/flux")) {
    return { prompt, image_size: { width: w, height: h }, output_format: "jpeg", enable_safety_checker: true, safety_tolerance: "2" };
  }
  // gemini / imagen fall back to nearest aspect preset
  const ar = w > h ? (w / h > 1.6 ? "16:9" : "4:3") : "2:3";
  return { prompt, aspect_ratio: ar, output_format: "jpeg", num_images: 1 };
}

async function run(page, jobs) {
  const dir = join(ROOT, "examples", `${page}-flythrough`, "assets");
  if (!dryRun) await mkdir(dir, { recursive: true });
  for (const j of jobs) {
    console.log(`\n─── ${page}/${j.out}  (${j.w}×${j.h}) ───`);
    if (dryRun) { console.log(j.prompt); continue; }
    const started = Date.now();
    const resp = await fetch(`https://fal.run/${MODEL}`, {
      method: "POST",
      headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(buildInput(j.prompt, j.w, j.h)),
    });
    if (!resp.ok) { console.error(`  ✗ HTTP ${resp.status}: ${(await resp.text()).slice(0, 240)}`); continue; }
    const data = await resp.json();
    const url = data?.images?.[0]?.url;
    if (!url) { console.error(`  ✗ no image url: ${JSON.stringify(data).slice(0, 200)}`); continue; }
    const bin = await fetch(url).then((r) => r.arrayBuffer());
    await writeFile(join(dir, j.out), Buffer.from(bin));
    console.log(`  ok ${((Date.now() - started) / 1000).toFixed(1)}s → examples/${page}-flythrough/assets/${j.out} (${(bin.byteLength / 1024).toFixed(0)} KB)`);
  }
}

const pages = only ? [only] : Object.keys(JOBS);
console.log(`model: ${MODEL} · pages: ${pages.join(", ")}${dryRun ? " · DRY RUN" : ""}`);
for (const p of pages) { if (JOBS[p]) await run(p, JOBS[p]); else console.error(`unknown page: ${p}`); }
console.log("\ndone.");
