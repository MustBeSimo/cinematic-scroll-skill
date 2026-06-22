#!/usr/bin/env node
/**
 * assemble-reel2.mjs <16x9|9x16|1x1> — promo reel v2: REAL scroll motion, HARD CUTS.
 *
 * Each world is a smooth scroll-through clip encoded from its scrollY frame sequence
 * (.promo/seq/<slug>-{L|P}/f-####.png) with a system-name label. Title + 11 worlds + end
 * are joined with hard cuts (concat) — no crossfades, so no overlapping text. Cards reuse
 * the token-CSS captures (.promo/cards/{title,end}-{L|P|S}/shot-000.png).
 *
 * Output: .promo/<orient>-reel2.mp4   (silent, h264/yuv420p/+faststart).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ORIENT = process.argv[2] || "16x9";
const DIMS = { "16x9": [1920, 1080], "9x16": [1080, 1920], "1x1": [1080, 1080] }[ORIENT];
if (!DIMS) { console.error("orient must be 16x9 | 9x16 | 1x1"); process.exit(1); }
const [W, H] = DIMS;
const worldSet = ORIENT === "9x16" ? "P" : "L";          // 1x1 crops from landscape
const cardSet = { "16x9": "L", "9x16": "P", "1x1": "S" }[ORIENT];
const FONT = "/System/Library/Fonts/Supplemental/Arial.ttf";
const FPS = 30, DTITLE = 2.4, DEND = 3.0;

const ORDER = [
  ["symmetric-monument", "SYMMETRIC MONUMENT"], ["clinical-noir", "CLINICAL NOIR"],
  ["storybook-geometry", "STORYBOOK GEOMETRY"], ["temporal-monument", "TEMPORAL MONUMENT"],
  ["botanical-editorial", "BOTANICAL EDITORIAL"], ["liquid-chrome", "LIQUID CHROME"],
  ["warm-scrapbook", "WARM SCRAPBOOK"], ["data-cinematic", "DATA CINEMATIC"],
  ["naturalistic-drift", "NATURALISTIC DRIFT"], ["brutalist-kinetic", "BRUTALIST KINETIC"],
  ["atmospheric-sublime", "ATMOSPHERIC SUBLIME"],
];

const clipsDir = join(ROOT, ".promo/clips2", ORIENT);
mkdirSync(clipsDir, { recursive: true });
const run = (args, label) => { const r = spawnSync("ffmpeg", args, { encoding: "utf8" }); if (r.status !== 0) { console.error(`✗ ${label}\n` + (r.stderr || "").split("\n").slice(-8).join("\n")); process.exit(1); } };

const fs_ = Math.round(W * 0.021), pad = Math.round(W * 0.033);
const label = (name) => `drawtext=fontfile=${FONT}:text='${name}':fontcolor=white@0.97:fontsize=${fs_}:` +
  `box=1:boxcolor=black@0.45:boxborderw=${Math.round(fs_ * 0.55)}:x=${pad}:y=h-th-${pad}`;
const cropVF = ORIENT === "1x1" ? `crop=1080:1080:${Math.round((1920 - 1080) / 2)}:0,` : "";

// world clips from frame sequences
const clips = [];
ORDER.forEach(([slug, name], i) => {
  const seq = join(ROOT, ".promo/seq", `${slug}-${worldSet}`);
  if (!existsSync(seq) || !readdirSync(seq).some((f) => f.startsWith("f-"))) { console.error(`missing frames: ${seq}`); process.exit(1); }
  const out = join(clipsDir, `${String(i + 1).padStart(2, "0")}-${slug}.mp4`);
  run(["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(seq, "f-%04d.png"),
    "-vf", `${cropVF}scale=${W}:${H},${label(name)},format=yuv420p`,
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", out], `world ${slug}`);
  clips.push(out);
  process.stdout.write(`  world ${i + 1}/11 ${slug}\r`);
});

// card clips (still hold)
const cardClip = (which, dur) => {
  const src = join(ROOT, ".promo/cards", `${which}-${cardSet}`, "shot-000.png");
  if (!existsSync(src)) { console.error(`missing card: ${src}`); process.exit(1); }
  const out = join(clipsDir, `${which}.mp4`);
  run(["-y", "-loglevel", "error", "-loop", "1", "-i", src, "-t", String(dur), "-r", String(FPS),
    "-vf", `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},format=yuv420p`,
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", out], `card ${which}`);
  return out;
};
const titleClip = cardClip("title", DTITLE);
const endClip = cardClip("end", DEND);
console.log("\n  built title + 11 worlds + end");

// hard-cut concat: title, worlds…, end
const seqClips = [titleClip, ...clips, endClip];
const inputs = seqClips.flatMap((c) => ["-i", c]);
const concat = seqClips.map((_, i) => `[${i}:v]`).join("") + `concat=n=${seqClips.length}:v=1[v]`;
const outFile = join(ROOT, ".promo", `${ORIENT}-reel2.mp4`);
run(["-y", "-loglevel", "error", ...inputs, "-filter_complex", concat, "-map", "[v]",
  "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart", outFile], "concat");
const dur = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nk=1:nw=1", outFile], { encoding: "utf8" }).stdout.trim();
console.log(`✓ ${ORIENT} reel2 → ${outFile.replace(ROOT + "/", "")}  (${Number(dur).toFixed(1)}s)`);
