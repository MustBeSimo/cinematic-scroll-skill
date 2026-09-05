import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs, verify, summarize } from './verify-build.mjs';

const clean = () => ({ status: 0, stdout: 'passed', stderr: '' });
function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'cinematic-verify-test-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  writeFileSync(join(cwd, 'index.html'), '<!doctype html><title>Fixture</title>');
  return cwd;
}

test('targets resolve from the caller, including spaces and absolute paths', t => {
  const cwd = fixture(t);
  for (const target of ['index.html', join(cwd, 'index.html')]) {
    const calls = [];
    const report = verify(parseArgs([target]), { cwd, execute: (cmd, args, options) => { calls.push({ cmd, args, options }); return clean(); } });
    assert.equal(report.ok, true);
    assert.equal(report.target, join(cwd, 'index.html'));
    assert.ok(calls.some(c => c.args.includes(join(cwd, 'index.html'))));
  }
});

test('runtime failures cannot be optional successes, including under strict', t => {
  const cwd = fixture(t);
  for (const extra of [[], ['--strict']]) {
    const report = verify(parseArgs(['index.html', '--runtime', ...extra]), { cwd,
      execute: (cmd, args) => args[0].endsWith('matrix.mjs') ? { status: 1, stderr: 'uncaught exception' } : clean() });
    assert.equal(report.ok, false);
    assert.equal(report.exitCode, 1);
  }
});

test('a missing browser is incomplete, not clean', t => {
  const report = verify(parseArgs(['index.html', '--phase', 'polish']), { cwd: fixture(t),
    execute: (cmd, args) => args[0].endsWith('matrix.mjs') ? { status: 2, stderr: 'no browser' } : clean() });
  assert.equal(report.verdict, 'INCOMPLETE');
  assert.equal(report.exitCode, 2);
  assert.equal(report.steps.at(-1).skipped, true);
});

test('fast polish explicitly remains incomplete', t => {
  const report = verify(parseArgs(['index.html', '--phase', 'polish', '--fast']), { cwd: fixture(t), execute: clean });
  assert.equal(report.ok, false);
  assert.equal(report.exitCode, 2);
});

test('URL targets go to the browser and are never scanned as source files', () => {
  const calls = [];
  const report = verify(parseArgs(['http://localhost:3000/story', '--runtime']), {
    execute: (cmd, args) => { calls.push(args); return clean(); } });
  assert.equal(report.ok, true);
  assert.ok(calls.some(a => a.includes('http://localhost:3000/story')));
  assert.ok(calls.every(a => !a[0].includes('cinematic-doctor')));
});

test('Mode B compilation failure fails even without a local node_modules directory', t => {
  const cwd = fixture(t);
  mkdirSync(join(cwd, 'app space'));
  writeFileSync(join(cwd, 'app space/package.json'), '{"scripts":{"build":"exit 1"}}');
  const calls = [];
  const report = verify(parseArgs(['--mode-b', 'app space']), { cwd,
    execute: (cmd, args, config) => { calls.push({ cmd, args, config }); return cmd === 'npm' && args.includes('build') ? { status: 1, stderr: 'build failed' } : clean(); } });
  assert.equal(report.exitCode, 1);
  assert.equal(calls.find(c => c.cmd === 'npm').config.cwd, resolve(cwd, 'app space'));
});

test('missing target and subprocess failure do not pass', t => {
  assert.equal(verify(parseArgs(['missing.html']), { cwd: fixture(t), execute: clean }).exitCode, 1);
  assert.equal(verify(parseArgs([]), { execute: () => ({ status: null, error: new Error('ENOENT') }) }).exitCode, 1);
});

test('invalid thresholds, phases, missing values and unknown flags are rejected', () => {
  for (const args of [['--min', 'NaN'], ['--min', '101'], ['--min'], ['--phase', 'release'], ['--oops'], ['--phase', 'polish']]) {
    assert.throws(() => parseArgs(args));
  }
});

test('failure takes precedence over skipped evidence', () => {
  assert.equal(summarize([{ ok: false }, { ok: false, skipped: true }]).exitCode, 1);
  assert.equal(summarize([{ ok: false, skipped: true }], true).exitCode, 1);
});
