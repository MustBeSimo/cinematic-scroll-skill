import test from 'node:test';
import assert from 'node:assert/strict';
import { damp, proximityToRect, createQualityGovernor, seededRandom } from './core.mjs';

test('damping produces the same motion at 30, 60 and 120Hz', () => {
  const samples = [30, 60, 120].map(hz => {
    let value = 0;
    for (let i = 0; i < hz; i++) value = damp(value, 100, 8, 1 / hz);
    return value;
  });
  assert.ok(Math.max(...samples) - Math.min(...samples) < 1e-10);
});
test('proximity respects the full target and has bounded falloff', () => {
  const rect = { left: 10, top: 10, right: 210, bottom: 110, width: 200, height: 100 };
  assert.equal(proximityToRect(200, 100, rect).amount, 1);
  assert.equal(proximityToRect(330, 100, rect).amount, 0);
  assert.equal(proximityToRect(270, 100, rect).amount, 0.5);
  assert.equal(proximityToRect(110, 60, rect).x, 0);
});
test('quality falls after two bad windows and rises only after five stable seconds', () => {
  const q = createQualityGovernor();
  assert.equal(q.sample(30), 'balanced');
  assert.equal(q.sample(30), 'low');
  for (let i = 0; i < 4; i++) assert.equal(q.sample(60), 'low');
  assert.equal(q.sample(60), 'balanced');
});
test('quality locks low after three direction reversals', () => {
  const q = createQualityGovernor();
  q.sample(30); q.sample(30);
  for (let i = 0; i < 5; i++) q.sample(60);
  q.sample(30); q.sample(30);
  for (let i = 0; i < 5; i++) q.sample(60);
  assert.equal(q.locked, true);
  assert.equal(q.tier, 'low');
  for (let i = 0; i < 20; i++) q.sample(120);
  assert.equal(q.tier, 'low');
});
test('procedural geometry can be reproduced without random hydration changes', () => {
  const a = seededRandom(42), b = seededRandom(42), c = seededRandom(12);
  const seq = Array.from({ length: 20 }, a);
  assert.deepEqual(seq, Array.from({ length: 20 }, b));
  assert.notDeepEqual(seq, Array.from({ length: 20 }, c));
  assert.ok(seq.every(n => n >= 0 && n < 1));
});
