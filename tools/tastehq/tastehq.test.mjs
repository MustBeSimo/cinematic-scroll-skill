import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assess, buildRequest, parseArgs, request } from './cli.mjs';

test('0–100 scores convert to fidelity without guessing units', () => {
  assert.equal(assess('score', { score: 75 }, 0.75).exitCode, 0);
  assert.equal(assess('score', { score: 74 }, 0.75).exitCode, 1);
  assert.equal(assess('score', { score: 1 }, 0.75).fidelity, 0.01);
});
test('invalid score payloads cannot pass', () => {
  for (const score of [null, '95', -1, 101, NaN, undefined]) assert.throws(() => assess('score', { score }));
  assert.throws(() => assess('score', { error: 'unreachable' }));
});
test('coverage cap and rejection gates prevent certification', () => {
  assert.equal(assess('score', { score: 98, verdict_capped_by_coverage: true }).exitCode, 2);
  assert.equal(assess('score', { score: 98, blocked_by: ['required-axis'] }).exitCode, 1);
  assert.equal(assess('score', { score: 98, gates: [{ outcome: 'fail', action: 'reject' }] }).exitCode, 1);
});
test('query with no resolved grammar is explicitly unresolved', () => {
  assert.equal(assess('query', { resolved_target: null, axes: [] }).exitCode, 2);
  assert.equal(assess('query', { resolved_target: { slug: 'a' }, axes: [{ axis: 'type.pairing', value: 'serif/sans' }] }).exitCode, 0);
});
test('one explicit scoring target is required', () => {
  for (const args of [[], ['score', '--url', 'https://example.com'], ['query', '--query', ''],
    ['score', '--url', 'https://example.com', '--brief', 'blue', '--target-brand', 'a'],
    ['score', '--url', 'https://example.com', '--brief', 'blue', '--min', '75']]) assert.throws(() => parseArgs(args));
});
test('nested grammar is sent unchanged, including required brand axes', t => {
  const dir = mkdtempSync(join(tmpdir(), 'cinematic-taste-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, 'grammar.json');
  const grammar = { palette: { strategy: 'duotone' }, type: { pairing: 'serif/sans' } };
  writeFileSync(file, JSON.stringify({ grammar }));
  const body = buildRequest(parseArgs(['score', '--url', 'https://example.com', '--grammar', file]));
  assert.deepEqual(body, { url: 'https://example.com', target_grammar: grammar });
});
test('request preserves API evidence and sends the actual contract fields', async () => {
  const options = parseArgs(['score', '--url', 'https://preview.example', '--target-url', 'https://brand.example']);
  const response = { score: 69, fixes: [{ axis: 'palette.strategy', action: 'use duotone' }], audit: { judge: 'test' } };
  const result = await request(options, async (url, init) => {
    assert.equal(url, 'https://www.tastehq.w230.net/api/score');
    assert.deepEqual(JSON.parse(init.body), { url: 'https://preview.example', target_url: 'https://brand.example' });
    assert.ok(init.signal);
    return { ok: true, json: async () => response };
  });
  assert.equal(result.exitCode, 1);
  assert.deepEqual(result.response, response);
});
test('HTTP, JSON and network errors do not become successful reports', async () => {
  const options = parseArgs(['query', '--query', 'editorial blue']);
  await assert.rejects(request(options, async () => ({ ok: false, status: 503 })), /503/);
  await assert.rejects(request(options, async () => ({ ok: true, json: async () => { throw new Error('invalid JSON'); } })), /invalid JSON/);
  await assert.rejects(request(options, async () => { throw new Error('offline'); }), /offline/);
});
