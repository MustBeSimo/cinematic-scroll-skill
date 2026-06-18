/* ============================================================================
   lib/scorecard.mjs — weighting, normalization, and pretty terminal output.

   Each check returns { category, score (0-100), findings:[{level,msg,line?}] }
   or { category, score:null, na:true } when it does not apply (e.g. no 3D
   detected → the threed category is excluded and its weight is redistributed
   across the remaining categories).

   No color libraries — plain ANSI escapes, and they auto-disable when stdout is
   not a TTY or NO_COLOR is set, so the JSON pipeline and CI logs stay clean.
   ========================================================================== */

/** Default weights. They need not sum to 100 — we normalize over whatever
    categories actually applied. Taste + performance dominate because that is
    this project's whole differentiator (craft over slop). */
export const WEIGHTS = {
  taste: 30,
  performance: 25,
  a11y: 20,
  mobile: 15,
  tokens: 12,
  threed: 10,
};

const useColor =
  process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== 'dumb';

const C = {
  reset: useColor ? '\x1b[0m' : '',
  bold: useColor ? '\x1b[1m' : '',
  dim: useColor ? '\x1b[2m' : '',
  red: useColor ? '\x1b[31m' : '',
  green: useColor ? '\x1b[32m' : '',
  yellow: useColor ? '\x1b[33m' : '',
  cyan: useColor ? '\x1b[36m' : '',
  gray: useColor ? '\x1b[90m' : '',
};

const LEVEL_TAG = {
  error: `${C.red}✗ error${C.reset}`,
  warn: `${C.yellow}! warn ${C.reset}`,
  info: `${C.gray}· info ${C.reset}`,
  pass: `${C.green}✓ pass ${C.reset}`,
};

/**
 * Aggregate raw category results into a weighted, normalized total.
 * @param {Array} results  per-category { category, score, na?, findings }
 * @returns {{ total, categories, naCategories, weights }}
 */
export function aggregate(results) {
  const applied = results.filter((r) => !r.na && typeof r.score === 'number');
  const naCategories = results.filter((r) => r.na).map((r) => r.category);

  const totalWeight = applied.reduce(
    (sum, r) => sum + (WEIGHTS[r.category] ?? 0),
    0,
  );

  const categories = applied.map((r) => {
    const rawWeight = WEIGHTS[r.category] ?? 0;
    const normWeight = totalWeight ? rawWeight / totalWeight : 0;
    return {
      category: r.category,
      score: Math.round(r.score),
      weight: rawWeight,
      normalizedWeight: +(normWeight * 100).toFixed(1),
      contribution: +(r.score * normWeight).toFixed(2),
      findings: r.findings ?? [],
    };
  });

  const total = Math.round(
    categories.reduce((sum, c) => sum + c.contribution, 0),
  );

  return { total, categories, naCategories };
}

function bar(score) {
  const width = 20;
  const filled = Math.round((score / 100) * width);
  const color = score >= 80 ? C.green : score >= 60 ? C.yellow : C.red;
  return `${color}${'█'.repeat(filled)}${C.gray}${'░'.repeat(width - filled)}${C.reset}`;
}

function pad(str, n) {
  const len = str.replace(/\x1b\[[0-9;]*m/g, '').length;
  return str + ' '.repeat(Math.max(0, n - len));
}

/**
 * Render the full scorecard to a string (caller prints it).
 * @param {string} file       what was scored
 * @param {object} agg        result of aggregate()
 * @param {number} threshold  pass/fail line
 */
export function renderScorecard(file, agg, threshold) {
  const lines = [];
  const pass = agg.total >= threshold;

  lines.push('');
  lines.push(`${C.bold}${C.cyan}  cinematic-doctor${C.reset} ${C.dim}— quality gate for cinematic-scroll builds${C.reset}`);
  lines.push(`${C.gray}  ${file}${C.reset}`);
  lines.push('');

  for (const c of agg.categories) {
    const head = `${C.bold}${pad(c.category, 13)}${C.reset}`;
    lines.push(
      `  ${head} ${bar(c.score)} ${pad(String(c.score), 3)} ${C.gray}/100  (weight ${c.normalizedWeight}%)${C.reset}`,
    );
    for (const f of c.findings) {
      const tag = LEVEL_TAG[f.level] ?? f.level;
      const loc = f.line ? ` ${C.gray}(line ${f.line})${C.reset}` : '';
      lines.push(`      ${tag} ${f.msg}${loc}`);
    }
  }

  if (agg.naCategories.length) {
    lines.push('');
    lines.push(`  ${C.gray}N/A (excluded, weight redistributed): ${agg.naCategories.join(', ')}${C.reset}`);
  }

  lines.push('');
  lines.push(`  ${C.dim}${'─'.repeat(54)}${C.reset}`);
  const verdict = pass
    ? `${C.green}${C.bold}PASS${C.reset}`
    : `${C.red}${C.bold}FAIL${C.reset}`;
  const totalColor = pass ? C.green : C.red;
  lines.push(
    `  ${C.bold}TOTAL${C.reset}        ${bar(agg.total)} ${totalColor}${C.bold}${pad(String(agg.total), 3)}${C.reset} ${C.gray}/100${C.reset}   ${verdict} ${C.gray}(threshold ${threshold})${C.reset}`,
  );
  lines.push('');

  return lines.join('\n');
}

/** Build the JSON report object (no ANSI, stable shape). */
export function buildReport(file, agg, threshold) {
  return {
    tool: 'cinematic-doctor',
    version: 1,
    generatedAt: new Date().toISOString(),
    file,
    threshold,
    total: agg.total,
    pass: agg.total >= threshold,
    naCategories: agg.naCategories,
    categories: agg.categories.map((c) => ({
      category: c.category,
      score: c.score,
      weight: c.weight,
      normalizedWeight: c.normalizedWeight,
      contribution: c.contribution,
      findings: c.findings,
    })),
  };
}
