#!/usr/bin/env node
/**
 * capture-walkthrough-frames.mjs — extract key scroll positions from a
 * cinematic-scroll site as high-res PNG stills for HeyGen video backgrounds.
 *
 * Captures frames at evenly-spaced scroll percentages (default: 0%, 25%, 50%,
 * 75%, 100%) so the avatar can "walk through" the page. Each frame is a
 * 1920×1080 screenshot suitable for HeyGen background images.
 *
 *   node tools/heygen/capture-walkthrough-frames.mjs <page-path-or-url> [--out .heygen/frames] [--count 5]
 *
 * Examples:
 *   node tools/heygen/capture-walkthrough-frames.mjs examples/noir/index.html
 *   node tools/heygen/capture-walkthrough-frames.mjs https://deployed-site.vercel.app --count 8
 *   node tools/heygen/capture-walkthrough-frames.mjs examples/vanta/index.html --out .heygen/frames/vanta
 *
 * Output: <out>/<slug>-frame-00.png, ..., <slug>-frame-04.png
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const W = 1920,
  H = 1080;

const args = process.argv.slice(2);
const flagIdx = (f) => args.indexOf(f);

const outIdx = flagIdx("--out");
const outDir = outIdx !== -1 ? args.splice(outIdx, 2)[1] : null;

const countIdx = flagIdx("--count");
const frameCount = countIdx !== -1 ? Number(args.splice(countIdx, 2)[1]) : 5;

const target = args[0];
if (!target) {
  console.error(
    "usage: capture-walkthrough-frames.mjs <page-path-or-url> [--out dir] [--count N]"
  );
  process.exit(2);
}

const isUrl = target.startsWith("http://") || target.startsWith("https://");
const slug = isUrl
  ? new URL(target).hostname.replace(/\./g, "-")
  : path.basename(path.dirname(target)) || path.basename(target, ".html");

const framesDir = path.resolve(ROOT, outDir || `.heygen/frames/${slug}`);
fs.mkdirSync(framesDir, { recursive: true });

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".glb": "model/gltf-binary",
};

let pageUrl = target;
let server = null;

if (!isUrl) {
  server = http.createServer((req, res) => {
    try {
      const reqPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
      const filePath = path.normalize(path.join(ROOT, reqPath));
      if (!filePath.startsWith(ROOT)) {
        res.writeHead(403).end();
        return;
      }
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, {
        "content-type":
          MIME[path.extname(filePath).toLowerCase()] ||
          "application/octet-stream",
      });
      fs.createReadStream(filePath).pipe(res);
    } catch {
      res.writeHead(500).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  pageUrl = `http://127.0.0.1:${port}/${target
    .split(path.sep)
    .map(encodeURIComponent)
    .join("/")}`;
}

const exe =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const { chromium } = await import("playwright-core");
const browser = await chromium.launch({
  executablePath: exe,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-color-profile=srgb"],
});
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
await page.goto(pageUrl, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2000);

const maxScroll = await page.evaluate(
  () => document.documentElement.scrollHeight - window.innerHeight
);

const frames = [];
for (let i = 0; i < frameCount; i++) {
  const pct = frameCount === 1 ? 0 : i / (frameCount - 1);
  const y = Math.round(pct * maxScroll);

  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
  await page.waitForTimeout(600);

  const fname = `${slug}-frame-${String(i).padStart(2, "0")}.png`;
  const fpath = path.join(framesDir, fname);
  await page.screenshot({ path: fpath, type: "png" });
  frames.push({ index: i, scrollPct: Math.round(pct * 100), path: fpath });
  process.stdout.write(`  captured frame ${i} (scroll ${Math.round(pct * 100)}%)\n`);
}

await ctx.close();
await browser.close();
if (server) server.close();

const manifest = {
  slug,
  source: target,
  resolution: `${W}x${H}`,
  frameCount,
  maxScroll,
  frames,
};
const manifestPath = path.join(framesDir, "manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`\n✓ ${frameCount} frames → ${framesDir}`);
console.log(`  manifest: ${manifestPath}`);
