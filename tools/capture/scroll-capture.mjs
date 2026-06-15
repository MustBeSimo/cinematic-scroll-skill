// scroll-capture.mjs — record a smooth, image-rich scroll-through of a
// self-contained example page into a reel-ready 1920×1080 H.264 clip.
//
// Generalizes the old _cap_noir.mjs: parametrized page + output, a longer hero
// hold, a full deep scroll (so image-rich sections below the fold are actually
// captured — fixes "renders only text"), and an in-script webm→mp4 convert.
//
// Usage:
//   node tools/capture/scroll-capture.mjs <example-rel-path> <out-name> [holdMs] [scrollSec]
// Example:
//   node tools/capture/scroll-capture.mjs examples/noir/index.html noir 1800 14
//
// Output: video/public/footage/<out-name>.mp4  (overwrites in place)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {execFileSync} from 'node:child_process';

const exe = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const W = 1920, H = 1080;

const [, , rel, outName, holdMsArg, scrollSecArg] = process.argv;
if (!rel || !outName) {
  console.error('usage: scroll-capture.mjs <example-rel-path> <out-name> [holdMs] [scrollSec]');
  process.exit(2);
}
const holdMs = Number(holdMsArg ?? 1800);
const scrollSec = Number(scrollSecArg ?? 14);

const root = process.cwd(); // always invoked from the repo root
const footageDir = path.resolve(root, 'video/public/footage');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `cap-${outName}-`));

// Serve the repo over a tiny static HTTP server and load the page over http://.
// file:// blocks local ES-module imports via CORS (origin "null"), which leaves
// JS-built pages like examples/studio (imports ./chapters.js into #app) empty —
// the page never grows past the viewport, so the deep scroll captures nothing.
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};
const server = http.createServer((req, res) => {
  try {
    const reqPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const filePath = path.normalize(path.join(root, reqPath));
    if (!filePath.startsWith(root)) { res.writeHead(403).end(); return; }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { res.writeHead(404).end(); return; }
    res.writeHead(200, {'content-type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream'});
    fs.createReadStream(filePath).pipe(res);
  } catch { res.writeHead(500).end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const pageUrl = `http://127.0.0.1:${port}/${rel.split(path.sep).map(encodeURIComponent).join('/')}`;

const {chromium} = await import('playwright-core');
const b = await chromium.launch({executablePath: exe, args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb']});
const ctx = await b.newContext({viewport: {width: W, height: H}, recordVideo: {dir: tmpDir, size: {width: W, height: H}}, deviceScaleFactor: 1});
const p = await ctx.newPage();
await p.goto(pageUrl, {waitUntil: 'networkidle', timeout: 60000});

// let any preloader / hero animation settle, then hold on the hero
await p.waitForTimeout(holdMs);
await p.mouse.move(W / 2, H / 2);

// deep, smooth scroll all the way down over ~scrollSec seconds
const max = await p.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
const ticks = Math.max(120, Math.round(scrollSec * 12));   // ~12 wheel ticks/sec
const per = Math.max(1, Math.ceil(max / ticks));
const dwell = Math.round((scrollSec * 1000) / ticks);
for (let i = 0; i < ticks; i++) {
  await p.mouse.wheel(0, per);
  await p.waitForTimeout(dwell);
}
await p.waitForTimeout(900);                                // settle at the bottom
const yEnd = await p.evaluate(() => window.scrollY);
await ctx.close();
await b.close();
server.close();

const webm = fs.readdirSync(tmpDir).find((f) => f.endsWith('.webm'));
if (!webm) { console.error('no webm produced'); process.exit(1); }
const webmPath = path.join(tmpDir, webm);

fs.mkdirSync(footageDir, {recursive: true});
const outPath = path.join(footageDir, `${outName}.mp4`);
// re-encode to reel-standard H.264 / yuv420p, scaled/padded to exactly 1920×1080
execFileSync('ffmpeg', [
  '-y', '-i', webmPath,
  '-vf', `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=white,fps=30`,
  '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart',
  outPath,
], {stdio: 'inherit'});

fs.rmSync(tmpDir, {recursive: true, force: true});
const sz = fs.statSync(outPath).size;
console.log(`done — ${outName}: scrolled y=${yEnd}/${max}, wrote ${outPath} (${(sz / 1e6).toFixed(2)} MB)`);
if (sz < 300_000) console.log(`WARN: ${outName}.mp4 is small (${sz}B) — page may be text-only / under-rendered.`);
