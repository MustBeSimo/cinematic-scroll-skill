// hq-capture.mjs — high-quality, FLUID scroll capture for the (vanilla) themed sites.
//   • deviceScaleFactor 2  → text/vectors render at 2× then record crisp at 1080
//   • requestAnimationFrame window.scrollTo  → buttery 60fps scroll (no wheel chop)
//   • crf 16 H.264         → near-lossless
// Output: video/public/footage/hq/<out>.mp4  (1920×1080)
//
//   node tools/promo/hq-capture.mjs examples/clinical-noir/index.html clinical-noir [scrollSec] [holdMs]
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import http from 'node:http';
import {execFileSync} from 'node:child_process';

const exe = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const W = 1920, H = 1080;
const [, , rel, outName, scrollSecArg, holdArg, capArg, tailArg] = process.argv;
if (!rel || !outName) { console.error('usage: hq-capture.mjs <rel-path> <out> [scrollSec] [holdMs] [capVh] [tailSec]'); process.exit(2); }
const scrollSec = Number(scrollSecArg ?? 6.5), holdMs = Number(holdArg ?? 1700), capVh = Number(capArg ?? 2.7), tailSec = Number(tailArg ?? 0);

const root = process.cwd();
const outDir = path.resolve(root, 'video/public/footage/hq');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `hq-${outName}-`));

const MIME = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.mp4':'video/mp4','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf'};
const server = http.createServer((req, res) => {
  try {
    const p = path.normalize(path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404).end(); return; }
    res.writeHead(200, {'content-type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream'});
    fs.createReadStream(p).pipe(res);
  } catch { res.writeHead(500).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/${rel.split(path.sep).map(encodeURIComponent).join('/')}`;

const {chromium} = await import('playwright-core');
const b = await chromium.launch({executablePath: exe, args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb', '--hide-scrollbars']});
const ctx = await b.newContext({viewport: {width: W, height: H}, deviceScaleFactor: 2, recordVideo: {dir: tmp, size: {width: W, height: H}}, reducedMotion: 'no-preference'});
const p = await ctx.newPage();
await p.goto(url, {waitUntil: 'networkidle', timeout: 60000});
await p.waitForTimeout(holdMs);

// Force lazy media to load IN PLACE (no scroll jump in the recording) so the page is its
// true full height before we measure & scroll — otherwise scrollHeight is short and the
// scroll overshoots past the rich hero/chapters into the sparse footer.
await p.evaluate(() => {
  document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
  // force scroll-reveal content fully visible — during a fast capture scroll the reveal
  // transitions can't keep up, leaving content faint/half-revealed (looks broken).
  const st = document.createElement('style');
  st.textContent = '.reveal{opacity:1!important;transform:none!important;transition:none!important} html{scroll-behavior:auto}';
  document.head.appendChild(st);
});
await p.waitForTimeout(1300);

// buttery rAF scroll over the RICH TOP only (hero → image chapters), never the sparse footer
const dbg = await p.evaluate(async ({ms, capVh}) => {
  const full = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight;
  const max = Math.min(full, window.innerHeight * capVh);   // cap (2.7 = rich top; large = full page)
  const t0 = performance.now();
  await new Promise((res) => {
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = k < 0.15 ? (k / 0.15) * 0.12 * k / 0.15 : k > 0.85 ? 1 - (1 - k) / 0.15 * 0.12 * (1 - k) / 0.15 : k; // gentle ease in/out, ~linear middle
      window.scrollTo(0, e * max);
      if (k < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
  return {full, max, vh: window.innerHeight};
}, {ms: scrollSec * 1000, capVh});
console.log(`  [${outName}] full=${Math.round(dbg.full)} capped=${Math.round(dbg.max)} vh=${dbg.vh}`);
await p.waitForTimeout(500);
await ctx.close(); await b.close(); server.close();

const webm = fs.readdirSync(tmp).find((f) => f.endsWith('.webm'));
fs.mkdirSync(outDir, {recursive: true});
const out = path.join(outDir, `${outName}.mp4`);
// tailSec > 0 → keep only the last N seconds (the pure scroll motion, no static lead-in/hold)
const inArgs = tailSec > 0 ? ['-sseof', `-${tailSec}`, '-i', path.join(tmp, webm)] : ['-i', path.join(tmp, webm)];
execFileSync('ffmpeg', ['-y', ...inArgs, '-vf', `scale=${W}:${H}:flags=lanczos,fps=30`, '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', out], {stdio: 'ignore'});
fs.rmSync(tmp, {recursive: true, force: true});
console.log(`✓ hq ${outName} → ${(fs.statSync(out).size / 1e6).toFixed(2)}MB`);
