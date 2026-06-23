/* ============================================================================
   checks/threed.mjs — conditional WebGL / 3D resilience.

   ONLY runs when WebGL / Three.js / <model-viewer> is detected. If no 3D is
   present the category is N/A (score:null, na:true) and the scorecard drops it,
   redistributing its weight across the remaining categories.

   When 3D IS present, requires (grounded in performance-budget §2/§8 +
   COMPATIBILITY/MODELS conventions in this repo):
     • a webglcontextlost handler — GPU contexts WILL be lost (tab backgrounded,
       driver reset); without a handler the scene goes black forever;
     • a visible fallback — a <canvas> sibling / <noscript> / CSS fallback /
       poster so non-WebGL and reduced-motion users still see something;
     • a Draco/compression OR pixelRatio cap hint — keep GPU memory + payload in
       budget (§2 layer/VRAM, §5 asset budget);
     • XR feature-detection — navigator.xr / isSessionSupported() guarding any
       requestSession() so an AR/VR entry never throws on unsupported devices.
   ========================================================================== */

export function analyze(doc) {
  const js = doc.jsText;
  const markup = doc.markup;
  const all = doc.cssJs;

  // ── detection ─────────────────────────────────────────────────────────
  const detectors = [
    /getContext\(\s*['"]webgl2?['"]/i,
    /\bWebGLRenderer\b/i,
    /\bTHREE\.\w/,
    /three\.module|three\/build|cdn[^"']*three/i,
    /import\s+\*\s+as\s+THREE/i,
    /<model-viewer\b/i,
    /\bnew\s+Renderer\b/,
    /\bbabylon\b|\bBABYLON\./i,
  ];
  const detected = detectors.some((re) => re.test(all) || re.test(markup));

  if (!detected) {
    return { category: 'threed', score: null, na: true, findings: [] };
  }

  const findings = [];
  let score = 100;

  // ── 1. webglcontextlost handler ───────────────────────────────────────
  const ctxLost = /webglcontextlost|['"]webglcontextlost['"]|onwebglcontextlost/i;
  if (!ctxLost.test(all)) {
    score -= 28;
    findings.push({
      level: 'error',
      msg: 'no webglcontextlost handler — a lost GPU context (tab backgrounded, driver reset) leaves the scene black forever (budget §8)',
    });
  } else {
    findings.push({
      level: 'pass',
      msg: 'webglcontextlost handler present',
      line: doc.lineOf(ctxLost, 'js') ?? doc.lineOf(ctxLost, 'markup'),
    });
  }

  // ── 2. visible fallback element ───────────────────────────────────────
  const canvasCount = (markup.match(/<canvas\b/gi) || []).length;
  const hasNoscript = /<noscript\b/i.test(markup);
  const hasModelViewerFallback = /<model-viewer\b[\s\S]*?>[\s\S]*?<\/model-viewer>/i.test(markup) &&
    /slot\s*=\s*['"](poster|error)['"]/i.test(markup);
  const cssFallback = /no-?webgl|webgl-fallback|\.fallback\b|poster/i.test(all);
  const hasFallback = canvasCount >= 2 || hasNoscript || hasModelViewerFallback || cssFallback;
  if (!hasFallback) {
    score -= 22;
    findings.push({
      level: 'error',
      msg: 'no visible 3D fallback — add a <noscript>, a poster image, a CSS .fallback, or a sibling element so non-WebGL / reduced-motion users see something',
    });
  } else {
    findings.push({
      level: 'pass',
      msg: 'a 3D fallback path exists (noscript / poster / CSS fallback / sibling)',
    });
  }

  // ── 3. Draco/compression OR pixelRatio cap hint ───────────────────────
  const draco = /DRACOLoader|dracoLoader|\.drc\b|KTX2Loader|MeshoptDecoder|setDecoderPath/i.test(all);
  const dprCap =
    /setPixelRatio\s*\(\s*Math\.min/i.test(js) ||
    /Math\.min\([^)]*devicePixelRatio/i.test(js) ||
    /pixelRatio\s*[:=]\s*Math\.min/i.test(js);
  if (!draco && !dprCap) {
    score -= 18;
    findings.push({
      level: 'warn',
      msg: 'no Draco/Ktx2/meshopt compression and no capped pixelRatio — large GPU payload risk; cap setPixelRatio(Math.min(dpr,2)) and/or compress meshes (budget §2/§5)',
    });
  } else {
    findings.push({
      level: 'pass',
      msg: `GPU budget hint present (${[draco && 'compression', dprCap && 'pixelRatio cap'].filter(Boolean).join(' + ')})`,
    });
  }

  // ── 3b. real-time light budget — many lights multiply per-fragment cost ─
  const lightRe = /new\s+THREE\.(?:Spot|Point|Directional|Rect(?:Area)?)Light\b/g;
  const lightCount = (js.match(lightRe) || []).length;
  // a light constructor inside a loop body = a dynamic-light count that scales
  // with geometry (one spotlight per painting, etc.) — the worst fps offender,
  // and invisible to a flat count (one textual occurrence makes N lights).
  let lightInLoop = false;
  for (let m; (m = lightRe.exec(js)); ) {
    if (/\b(?:for|while)\s*\(|\.forEach\s*\(/.test(js.slice(Math.max(0, m.index - 220), m.index))) { lightInLoop = true; break; }
  }
  if (lightInLoop) {
    score -= 12;
    findings.push({
      level: 'warn',
      msg: 'a real-time light is constructed inside a loop — the dynamic-light count scales with your geometry (e.g. one spotlight per object) and tanks fps; light the scene with emissive materials + a scene.environment (IBL) and keep ~2–4 fixed lights (budget §9)',
    });
  } else if (lightCount > 8) {
    score -= 10;
    findings.push({
      level: 'warn',
      msg: `${lightCount} real-time lights — each adds per-fragment cost on every lit mesh and tanks fps; prefer emissive materials + a scene.environment (IBL) and keep ~2–4 dynamic lights (budget §9)`,
    });
  } else if (lightCount > 0) {
    findings.push({ level: 'pass', msg: `real-time light budget ok (${lightCount} dynamic light${lightCount === 1 ? '' : 's'} + cheap ambient/hemi)` });
  }

  // ── 3c. pixelRatio cap VALUE — Retina/high-DPI is the #1 cause of 3D jank ─
  const dprNum = js.match(/setPixelRatio\([^)]*Math\.min\([^,]*,\s*([0-9.]+)\s*\)/i);
  const mobileAwareDpr =
    /Math\.min\([^)]*devicePixelRatio[^)]*,\s*(?:isMobile|isTouch|isPhone|coarse)[^)]*\?/i.test(js) ||
    /isMobile\s*\?\s*[0-9.]+\s*:\s*[0-9.]+/.test(js);
  if (dprNum && parseFloat(dprNum[1]) >= 2 && !mobileAwareDpr) {
    score -= 8;
    findings.push({
      level: 'warn',
      msg: `pixelRatio capped at ${dprNum[1]} with no lower mobile cap — on a Retina/4K screen that renders ${dprNum[1]}× the pixels and is the most common cause of 3D scroll jank; cap ≤ 1.5 desktop / ≤ 1 mobile for continuously-rendering scenes (budget §9)`,
    });
  } else if (dprCap && (mobileAwareDpr || (dprNum && parseFloat(dprNum[1]) < 2))) {
    findings.push({ level: 'pass', msg: 'pixelRatio cap is conservative (mobile-aware / ≤ 1.5) — keeps high-DPI displays in budget' });
  }

  // ── 4. XR feature-detection before requestSession ─────────────────────
  const requestsSession = /requestSession\s*\(/i.test(js);
  if (requestsSession) {
    const guarded = /navigator\.xr|isSessionSupported\s*\(/i.test(js);
    if (!guarded) {
      score -= 18;
      findings.push({
        level: 'error',
        msg: 'requestSession() called without navigator.xr / isSessionSupported() feature-detection — will throw on devices without WebXR',
        line: doc.lineOf(/requestSession\s*\(/i, 'js'),
      });
    } else {
      findings.push({
        level: 'pass',
        msg: 'XR session is feature-detected (navigator.xr / isSessionSupported) before requestSession',
      });
    }
  } else {
    findings.push({ level: 'info', msg: 'no WebXR requestSession — XR feature-detection N/A' });
  }

  return {
    category: 'threed',
    score: Math.max(0, Math.round(score)),
    findings,
  };
}
