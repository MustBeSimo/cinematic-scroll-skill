#!/usr/bin/env node
/* capture.mjs — CinematicBench passive capture. ONE ordinary page load (+ one reduced-motion
   probe load), a standard 6s scroll, passive observation. Truthful UA, robots.txt honored,
   no auth-bypass, no load-testing. The only network/browser edge of the bench. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BENCH_VERSION } from "./score.mjs";

export const UA = "CinematicBench/1.0 (+https://github.com/MustBeSimo/cinematic-scroll-skill)";
const VIEWPORT = { width: 1440, height: 900 };

export function findBrowser() {
  const candidates = [process.env.CHROME_PATH];
  for (const root of [process.env.PLAYWRIGHT_BROWSERS_PATH, "/opt/pw-browsers", path.join(process.env.HOME || "", ".cache/ms-playwright")]) {
    if (root && fs.existsSync(root)) for (const d of fs.readdirSync(root).sort().reverse()) {
      candidates.push(path.join(root, d, "chrome-linux", "chrome"), path.join(root, d, "chrome-linux64", "chrome"),
        path.join(root, d, "chrome-mac", "Chromium.app/Contents/MacOS/Chromium"),
        path.join(root, d, "chrome-mac-arm64", "Chromium.app/Contents/MacOS/Chromium"));
    }
  }
  candidates.push("/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  return candidates.find((c) => c && fs.existsSync(c));
}

export async function checkRobots(url) {
  try {
    const u = new URL(url);
    const res = await fetch(`${u.origin}/robots.txt`, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { allowed: true, reason: "no robots.txt" };
    const text = await res.text();
    // Parse ALL groups per RFC 9309: consecutive User-agent lines form one group sharing the
    // following rules. Prefer a group whose agent token matches our bot (cinematicbench, case-
    // insensitive substring); otherwise fall back to the `*` group. Fail-open on fetch errors.
    const groups = []; let cur = null, lastWasAgent = false;
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.replace(/#.*$/, "").trim();
      if (!line) { lastWasAgent = false; continue; }
      const [k, ...rest] = line.split(":"); const v = rest.join(":").trim();
      if (/^user-agent$/i.test(k)) {
        if (!lastWasAgent) { cur = { agents: [], disallows: [] }; groups.push(cur); }
        cur.agents.push(v);
        lastWasAgent = true;
      } else {
        lastWasAgent = false;
        if (cur && /^disallow$/i.test(k) && v) cur.disallows.push(v);
      }
    }
    const botGroup = groups.find((g) => g.agents.some((a) => /cinematicbench/i.test(a)));
    const starGroup = groups.find((g) => g.agents.includes("*"));
    const disallows = (botGroup || starGroup || { disallows: [] }).disallows;
    const p = u.pathname || "/";
    const hit = disallows.find((d) => p.startsWith(d));
    return hit ? { allowed: false, reason: `robots.txt disallows ${hit}` } : { allowed: true, reason: "allowed" };
  } catch { return { allowed: true, reason: "robots.txt unreachable (assumed allowed)" }; }
}

const un = (reason, url) => ({ bench_version: BENCH_VERSION, url, viewport: "1440x900", ts: new Date().toISOString(), reachable: false, unmeasurable_reason: reason });

async function dismissConsent(page) {
  const sels = ['[id*="cookie"] button', '[class*="cookie"] button', '[class*="consent"] button', '[id*="consent"] button', 'button:has-text("Accept")', 'button:has-text("Agree")', 'button:has-text("Got it")'];
  for (const s of sels) { try { const b = page.locator(s).first(); if (await b.isVisible({ timeout: 300 })) { await b.click({ timeout: 1000 }); return true; } } catch { /* next */ } }
  return false;
}

/* Motion probes: sample DOM nodes ONCE (PROBE_SAMPLE), store refs on window.__cbSample, then
   re-measure those SAME nodes at a second scroll depth (PROBE_MEASURE). This prevents index
   misalignment from re-querying a live DOM that may have changed between the two depths. */
const PROBE_SAMPLE = `(() => {
  const els = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 8 && r.height > 8; });
  const stride = Math.max(1, Math.floor(els.length / 400));
  window.__cbSample = els.filter((_, i) => i % stride === 0).slice(0, 400);
  return window.__cbSample.map(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    return { docTop: r.top + scrollY, w: Math.round(r.width), h: Math.round(r.height), op: +cs.opacity, tf: cs.transform }; });
})()`;

const PROBE_MEASURE = `(() => {
  if (!window.__cbSample) return [];
  return window.__cbSample.map(e => {
    if (!e.isConnected) return null;
    const r = e.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    const cs = getComputedStyle(e);
    return { docTop: r.top + scrollY, w: Math.round(r.width), h: Math.round(r.height), op: +cs.opacity, tf: cs.transform };
  });
})()`;

export async function capture(url, { budgetMs = 90000 } = {}) {
  const exe = findBrowser();
  if (!exe) { const e = new Error("no Chrome/Chromium found — set $CHROME_PATH"); e.env = true; throw e; }
  let chromium;
  try { ({ chromium } = await import("playwright-core")); }
  catch { const e = new Error("playwright-core not installed — run: npm i -D playwright-core"); e.env = true; throw e; }

  const robots = await checkRobots(url);
  if (!robots.allowed) return un(robots.reason, url);

  let browser;
  try {
    browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  } catch (err) {
    const e = new Error(`browser failed to launch: ${String(err.message).slice(0, 120)}`);
    e.env = true;
    throw e;
  }
  const deadline = Date.now() + budgetMs;
  const left = () => deadline - Date.now();
  try {
    const page = await browser.newPage({ viewport: VIEWPORT, userAgent: UA });
    page.setDefaultTimeout(15000);
    let errors = 0, failedRequests = 0;
    page.on("console", (m) => { if (m.type() === "error") errors++; });
    page.on("pageerror", () => errors++);
    page.on("requestfailed", (r) => { if (!/\.(mp4|webm|m4v)/i.test(r.url())) failedRequests++; });

    try { await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 }); }
    catch (e) { return un(`navigation failed: ${String(e.message).slice(0, 120)}`, url); }
    await page.waitForTimeout(2500);
    if (left() <= 0) return un("budget exceeded", url);   // check 1: after navigation+settle

    await dismissConsent(page);
    if (left() <= 0) return un("budget exceeded", url);   // check 2: after consent dismissal

    // CLS observer for the whole session
    await page.evaluate(`window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });`);

    const dims = await page.evaluate(`({ docHeight: document.documentElement.scrollHeight, vh: innerHeight,
      sections: document.querySelectorAll('section, [class*="section" i], main > div').length,
      hasCanvas: !!document.querySelector("canvas") })`);
    const bodyText = await page.evaluate(`document.body.innerText.length`);
    if (dims.docHeight < dims.vh * 0.5 || bodyText < 80) return un("page rendered empty (likely bot-wall)", url);

    // scroll-jack probe: command a scroll, poll scrollY every 250ms for up to 3s to allow
    // smooth-scrolling libs (Lenis, GSAP ScrollSmoother) to converge; record maxY seen.
    // Flag only when the document essentially never moved (wrapper-hijacked scroll).
    await page.evaluate(`window.scrollTo(0, 0.4 * (document.documentElement.scrollHeight - innerHeight))`);
    const expectY = await page.evaluate(`0.4 * (document.documentElement.scrollHeight - innerHeight)`);
    let maxY = 0;
    for (let poll = 0; poll < 12; poll++) {
      await page.waitForTimeout(250);
      const curY = await page.evaluate(`scrollY`);
      if (curY > maxY) maxY = curY;
    }
    const scrollJack = dims.docHeight > dims.vh * 1.5 && maxY < 0.1 * expectY;
    if (left() <= 0) return un("budget exceeded", url);   // check 3: after scroll-jack probe

    // Reset scroll and settle before motion sampling
    await page.evaluate(`window.scrollTo(0, 0)`);
    await page.waitForTimeout(300);

    // two-depth motion sampling (document space): sample nodes ONCE (PROBE_SAMPLE at depth 1),
    // then re-measure those SAME stored nodes (PROBE_MEASURE at depth 2). Null entries in s2
    // indicate nodes that became disconnected or hidden; skip them and track count separately.
    await page.evaluate(`window.scrollTo(0, 0.25 * (document.documentElement.scrollHeight - innerHeight))`);
    await page.waitForTimeout(800);
    const s1 = await page.evaluate(PROBE_SAMPLE); const y1 = await page.evaluate(`scrollY`);
    await page.evaluate(`window.scrollTo(0, 0.55 * (document.documentElement.scrollHeight - innerHeight))`);
    await page.waitForTimeout(800);
    const s2 = await page.evaluate(PROBE_MEASURE); const y2 = await page.evaluate(`scrollY`);
    const dScroll = Math.max(1, y2 - y1);
    let changed = 0, layoutChanged = 0, skipped = 0; const buckets = new Set();
    const n = Math.min(s1.length, s2.length);
    for (let i = 0; i < n; i++) {
      const a = s1[i], b = s2[i];
      if (a === null || b === null) { skipped++; continue; }
      const dDoc = b.docTop - a.docTop;                     // movement in document space
      const moved = Math.abs(dDoc) > 4, faded = Math.abs(b.op - a.op) > 0.05, tfd = a.tf !== b.tf;
      if (moved || faded || tfd) {
        changed++;
        if (Math.abs(b.w - a.w) > 4 || Math.abs(b.h - a.h) > 4) layoutChanged++;
        if (moved) buckets.add(Math.round((dDoc / dScroll) * 10) / 10);
      }
    }
    const sampled = Math.max(1, n - skipped);
    if (left() <= 0) return un("budget exceeded", url);   // check 4: after motion sampling

    // WAAPI/CSS animations + stagger
    const anim = await page.evaluate(`(() => { const as = document.getAnimations ? document.getAnimations() : [];
      const delays = new Set(as.map(a => (a.effect && a.effect.getTiming ? a.effect.getTiming().delay : 0)).filter(d => d > 0));
      return { count: as.length, stagger: delays.size >= 2 }; })()`);

    // fps: page-proof's steady 6s rAF scroll rig
    if (left() <= 0) return un("budget exceeded", url);   // check 5: before fps rig
    await page.evaluate(`window.scrollTo(0, 0)`); await page.waitForTimeout(500);
    const fps = await page.evaluate(`new Promise(resolve => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const t0 = performance.now(); let last = t0; const deltas = [];
      function frame(now) { deltas.push(now - last); last = now;
        const p = Math.min(1, (now - t0) / 6000); window.scrollTo(0, p * max);
        if (p < 1) requestAnimationFrame(frame); else { deltas.shift();
          const avgMs = deltas.reduce((a, b) => a + b, 0) / Math.max(1, deltas.length);
          resolve({ avg: Math.round(1000 / avgMs), droppedPct: Math.round(deltas.filter(d => d > 34).length / Math.max(1, deltas.length) * 100), samples: deltas.length }); } }
      requestAnimationFrame(frame); })`);
    const clsProxy = Math.round((await page.evaluate(`window.__cls || 0`)) * 1000) / 1000;

    // a11y probes: focus, contrast sample, motion toggle
    await page.keyboard.press("Tab");
    const focusVisible = await page.evaluate(`(() => { const e = document.activeElement; if (!e || e === document.body) return false;
      const cs = getComputedStyle(e); return cs.outlineStyle !== 'none' || cs.boxShadow !== 'none'; })()`);
    const contrastFailures = await page.evaluate(`(() => {
      const lum = (c) => { const [r,g,b] = c.match(/\\d+(\\.\\d+)?/g).slice(0,3).map(Number).map(v => { v /= 255; return v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }); return 0.2126*r+0.7152*g+0.0722*b; };
      let fails = 0, checked = 0;
      for (const e of document.querySelectorAll('p, a, li, span, h1, h2, h3, h4, button')) {
        if (checked >= 150) break; const cs = getComputedStyle(e);
        if (!e.innerText || !e.innerText.trim() || parseFloat(cs.fontSize) >= 24) continue;
        let bg = null, n = e; while (n && n !== document.documentElement) { const b = getComputedStyle(n).backgroundColor;
          if (b && !/rgba?\\(0, 0, 0, 0\\)|transparent/.test(b) && !/rgba\\(.*, 0\\)/.test(b)) { bg = b; break; } n = n.parentElement; }
        if (!bg) continue; checked++;
        const l1 = lum(cs.color), l2 = lum(bg);
        if ((Math.max(l1,l2)+0.05) / (Math.min(l1,l2)+0.05) < 4.5) fails++;
      } return fails; })()`);
    const motionToggle = await page.evaluate(`!!document.querySelector('[aria-label*="motion" i], [aria-label*="animation" i], [class*="reduce-motion" i]')`);
    const pinnedRanges = await page.evaluate(`(() => { let n = 0, seen = 0;
      for (const e of document.querySelectorAll('body *')) { if (++seen > 3000) break;
        const p = getComputedStyle(e).position; if (p === 'sticky') n++; } return Math.min(n, 20); })()`);
    await page.close();

    // reduced-motion probe: second load with the media feature emulated
    let reducedMotionHonored = changed === 0 && anim.count === 0; // trivially honored when static
    if (!reducedMotionHonored && Date.now() < deadline) {
      const p2 = await browser.newPage({ viewport: VIEWPORT, userAgent: UA });
      p2.setDefaultTimeout(15000);
      try {
        await p2.emulateMedia({ reducedMotion: "reduce" });
        await p2.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
        await p2.waitForTimeout(2500);
        const rAnim = await p2.evaluate(`document.getAnimations ? document.getAnimations().filter(a => a.playState === 'running').length : 0`);
        reducedMotionHonored = rAnim <= Math.max(1, anim.count * 0.3);
      } catch { reducedMotionHonored = false; } finally { await p2.close(); }
    }

    return {
      bench_version: BENCH_VERSION, url, viewport: "1440x900", ts: new Date().toISOString(),
      reachable: true, unmeasurable_reason: null,
      fps, scroll: { docHeight: dims.docHeight, viewportHeight: dims.vh, sections: dims.sections, pinnedRanges, scrollJack, hasCanvas: dims.hasCanvas },
      motion: { changedNodes: changed, animatedNodes: anim.count, changedRatio: Math.round((changed / sampled) * 100) / 100, transformOpacityOnly: changed ? Math.round((1 - layoutChanged / changed) * 100) / 100 : 1, parallaxLayers: Math.max(0, buckets.size - 1), entranceStagger: anim.stagger },
      stability: { clsProxy },
      a11y: { reducedMotionHonored, focusVisible, contrastFailures, motionToggle },
      console: { errors, failedRequests },
    };
  } catch (e) { return un(`capture failed: ${String(e.message).slice(0, 120)}`, url); }
  finally { await browser.close(); }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) { console.error("capture.mjs is a library — use tools/bench/cli.mjs"); process.exit(2); }
