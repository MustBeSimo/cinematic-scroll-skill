#!/usr/bin/env node
/**
 * gen-theme-heroes.mjs — generate one rich, cinematic hero image per v2.4.0 theme
 * via fal.ai (same fal.run pattern as templates/nextjs/scripts/generate-chapter-assets.mjs).
 *
 *   node tools/promo/gen-theme-heroes.mjs --dry-run        # print prompts only
 *   node tools/promo/gen-theme-heroes.mjs                  # generate all 11
 *   node tools/promo/gen-theme-heroes.mjs --only clinical-noir,liquid-chrome
 *
 * Needs FAL_KEY (key_id:key_secret) in .env.local (repo root) or the shell env.
 * Output: .promo/heroes/<slug>.jpg  (1920×1080-ish, then placed into example sites).
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const onlyIdx = args.indexOf("--only");
const only = onlyIdx !== -1 && args[onlyIdx + 1] ? args[onlyIdx + 1].split(",") : null;
const MODEL = process.env.FAL_IMAGE_MODEL || "fal-ai/flux-2-pro";

// load FAL_KEY from .env.local if not in shell env
let FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY && existsSync(join(ROOT, ".env.local"))) {
  const m = readFileSync(join(ROOT, ".env.local"), "utf8").match(/^\s*FAL_KEY\s*=\s*(.+?)\s*$/m);
  if (m) FAL_KEY = m[1].replace(/^["']|["']$/g, "");
}

const SUFFIX = "Cinematic 16:9 hero image, photographic, high detail, dramatic light, no text, no words, no watermark, no logo.";
const THEMES = [
  ["symmetric-monument", "A monumental symmetric classical interior — vast desaturated travertine and stone, perfect central vanishing-point symmetry, one arterial-red vertical banner as the only colour, solemn and grand."],
  ["clinical-noir", "A cold clinical noir corridor at night — brushed steel and ash-grey surfaces, a single warm amber light raking across, deep chiaroscuro shadow, editorial, shallow depth of field."],
  ["storybook-geometry", "Bold hard-edged geometric shapes floating in space — pastel butter-yellow, dusty rose and clean cream, flat playful Bauhaus-storybook composition, crisp, bright, friendly."],
  ["temporal-monument", "A colossal monument rising in deep chiaroscuro blackness — cold steel highlights, tungsten-gold practical lights glowing far below, Gotham-noir atmosphere, immense vertical scale, rain-slick."],
  ["atmospheric-sublime", "A vast sublime landscape drowned in haze — warm dust meeting cold steel-blue light, immense empty negative space, a single tiny distant figure, painterly and atmospheric."],
  ["warm-scrapbook", "An intimate sun-faded summer scrapbook still life — terracotta, cream and warm paper, hand-placed overlapping photographs, soft grain, nostalgic and affectionate."],
  ["naturalistic-drift", "Soft observational nature photography — gentle golden morning light drifting through green foliage, sage and warm beige, quiet, organic, unscripted, filmic."],
  ["brutalist-kinetic", "Raw brutalist concrete architecture — exposed board-formed structure, hard mechanical geometry, one blazing safety-orange element, high contrast, gritty industrial."],
  ["liquid-chrome", "Molten liquid chrome flowing in near-black space — iridescent metallic surface, chrome-cyan reflections and ripples, glossy premium studio render, futuristic and cold."],
  ["botanical-editorial", "A fine-press botanical editorial still life — pressed leaves and stems on warm uncoated paper, deep leaf-green, soft diffused natural light, elegant, literary, calm."],
  ["data-cinematic", "A darkened mission-control room — deep navy, glowing signal-green data visualisations and luminous readouts floating, precise, cinematic, atmospheric sci-fi."],
];

const list = THEMES.filter(([slug]) => !only || only.includes(slug));
const outDir = join(ROOT, ".promo/heroes");
mkdirSync(outDir, { recursive: true });

if (!FAL_KEY && !dryRun) { console.error("✗ FAL_KEY missing — add it to .env.local (repo root) or the shell env."); process.exit(1); }

for (const [slug, scene] of list) {
  const prompt = `${scene} ${SUFFIX}`;
  if (dryRun) { console.log(`\n● ${slug}\n${prompt}`); continue; }
  process.stdout.write(`  generating ${slug} … `);
  try {
    const resp = await fetch(`https://fal.run/${MODEL}`, {
      method: "POST",
      headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, image_size: { width: 1920, height: 1080 }, num_images: 1 }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status} ${(await resp.text()).slice(0, 160)}`);
    const data = await resp.json();
    const url = data?.images?.[0]?.url;
    if (!url) throw new Error(`no image url (${JSON.stringify(data).slice(0, 160)})`);
    const bin = Buffer.from(await (await fetch(url)).arrayBuffer());
    writeFileSync(join(outDir, `${slug}.jpg`), bin);
    console.log(`✓ ${(bin.length / 1024).toFixed(0)}KB`);
  } catch (e) { console.log(`✗ ${e.message}`); }
}
if (!dryRun) console.log(`\nheroes → ${outDir.replace(ROOT + "/", "")}`);
