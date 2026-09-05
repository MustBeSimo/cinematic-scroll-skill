#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function parseArgs(args) {
  const command = args[0];
  if (!['query', 'score'].includes(command)) throw new Error('Usage: cli.mjs query --query <brief-or-url> | score --url <build-url> (--target-url <url> | --grammar <json> | --target-brand <slug> | --brief <text>)');
  const allowed = new Set(['base-url', 'out', 'timeout', ...(command === 'query' ? ['query'] : ['url', 'target-url', 'grammar', 'target-brand', 'brief', 'min'])]);
  const options = { command, 'base-url': 'https://www.tastehq.w230.net', timeout: 60000, min: 0.75 };
  const seen = new Set();
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i].slice(2);
    if (!args[i].startsWith('--') || !allowed.has(key) || seen.has(key) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Invalid or duplicate option: ' + args[i]);
    seen.add(key);
    options[key] = args[i + 1];
  }
  options.timeout = Number(options.timeout);
  options.min = Number(options.min);
  if (!Number.isFinite(options.timeout) || options.timeout <= 0 || options.timeout > 120000) throw new Error('--timeout must be 1–120000 ms');
  if (!Number.isFinite(options.min) || options.min < 0 || options.min > 1) throw new Error('--min is a fidelity fraction from 0 to 1');
  for (const key of ['base-url', 'url', 'target-url']) {
    if (options[key]) {
      const url = new URL(options[key]);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error(key + ' must be an HTTP(S) URL without credentials');
    }
  }
  if (command === 'query' && !options.query?.trim()) throw new Error('--query is required');
  if (command === 'score') {
    if (!options.url || ['target-url', 'grammar', 'target-brand', 'brief'].filter(k => options[k]).length !== 1) throw new Error('Score requires --url and exactly one target');
  }
  return options;
}

export function buildRequest(options) {
  if (options.command === 'query') return { query: options.query };
  const body = { url: options.url };
  if (options['target-url']) body.target_url = options['target-url'];
  if (options['target-brand']) body.target_brand = options['target-brand'];
  if (options.brief) body.brief = options.brief;
  if (options.grammar) {
    const input = JSON.parse(readFileSync(resolve(options.grammar), 'utf8'));
    const grammar = input.grammar ?? input;
    if (!grammar || Array.isArray(grammar) || typeof grammar !== 'object' || !Object.keys(grammar).length) throw new Error('Grammar must be a nonempty JSON object (flat or nested)');
    body.target_grammar = grammar;
  }
  return body;
}

export function assess(command, response, min = 0.75) {
  if (!response || typeof response !== 'object' || Array.isArray(response) || response.error) throw new Error(response?.error || 'Invalid TasteHQ response');
  if (command === 'query') {
    const resolved = Boolean(response.resolved_target) && Array.isArray(response.axes) && response.axes.length > 0;
    return { verdict: resolved ? 'RESOLVED' : 'UNRESOLVED', exitCode: resolved ? 0 : 2 };
  }
  // API score is explicitly 0–100; do not guess units from a small value such as 1.
  if (typeof response.score !== 'number' || !Number.isFinite(response.score) || response.score < 0 || response.score > 100) throw new Error('TasteHQ score must be a number from 0 to 100');
  const fidelity = response.score / 100;
  const blocked = Boolean(response.blocked_by?.length) || response.gates?.some(g => g.outcome === 'fail' && g.action === 'reject');
  const failed = fidelity < min || blocked;
  const incomplete = response.verdict_capped_by_coverage === true;
  return { verdict: failed ? 'FAIL' : incomplete ? 'INCOMPLETE' : 'PASS',
    exitCode: failed ? 1 : incomplete ? 2 : 0, fidelity, minFidelity: min };
}

export async function request(options, fetcher = fetch) {
  const body = buildRequest(options);
  const base = options['base-url'].replace(/\/$/, '');
  const response = await fetcher(base + '/api/' + options.command, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(options.timeout),
  });
  if (!response.ok) throw new Error('TasteHQ HTTP ' + response.status);
  const data = await response.json();
  return { ...assess(options.command, data, options.min), endpoint: base + '/api/' + options.command,
    request: body, response: data };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = await request(options);
    if (options.out) {
      const file = resolve(options.out);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
    }
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.exitCode;
  } catch (error) {
    console.error('tastehq: unverified — ' + error.message);
    process.exitCode = 2;
  }
}
