// Explicit browser regression tier: node --test tools/page-proof/runtime.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const execute = promisify(execFile);
const tool = join(dirname(fileURLToPath(import.meta.url)), 'proof.mjs');

test('browser proof fails HTTP errors, overflow and hidden no-JS heading, while clean HTML passes', async t => {
  const out = mkdtempSync(join(tmpdir(), 'cinematic-browser-regression-'));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  const server = createServer((req, res) => {
    if (req.url === '/missing.png') { res.writeHead(404); res.end('missing'); return; }
    res.setHeader('Content-Type', 'text/html');
    const extra = req.url === '/http' ? '<img src="/missing.png" alt="test">' :
      req.url === '/overflow' ? '<div style="width:3000px">overflow</div>' : '';
    const title = req.url === '/hidden' ? '<h1><span style="opacity:0">Invisible title</span></h1>' : '<h1>Readable title</h1>';
    res.end('<!doctype html><meta name="viewport" content="width=device-width"><title>Proof test</title>' + title + extra);
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = 'http://127.0.0.1:' + server.address().port;
  for (const [route, code, kind] of [['clean', 0], ['http', 1, 'http'], ['overflow', 1, 'layout'], ['hidden', 1, 'layout']]) {
    const dir = join(out, route);
    let actual = 0;
    try {
      await execute(process.execPath, [tool, base + '/' + route, '--out', dir, '--wait', '0', '--shots', '0', '--check-layout', '--no-js'], { timeout: 90000 });
    } catch (error) { actual = error.code; }
    assert.equal(actual, code, route + ' exit status');
    const report = JSON.parse(readFileSync(join(dir, 'proof.json'), 'utf8'));
    if (kind) assert.ok(report.errors.some(e => e.kind === kind), route);
    else assert.equal(report.verdict, 'CLEAN');
  }
});
