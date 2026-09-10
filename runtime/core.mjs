/** Pure motion math shared by browser and React adapters. Times are seconds. */
export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const damp = (current, target, rate, dt) => current + (target - current) * (1 - Math.exp(-rate * Math.max(0, dt)));

/** Distance to the target rectangle, not its centre: large targets stay usable. */
export function proximityToRect(x, y, rect, radius = 120) {
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  const distance = Math.hypot(dx, dy);
  const amount = radius > 0 ? clamp(1 - distance / radius) : Number(distance === 0);
  return {
    distance, amount: amount * amount * (3 - 2 * amount),
    x: clamp((x - rect.left) / Math.max(1, rect.width), 0, 1) * 2 - 1,
    y: clamp((y - rect.top) / Math.max(1, rect.height), 0, 1) * 2 - 1,
  };
}

export const QUALITY = Object.freeze({
  high: Object.freeze({ dpr: 1.5, particles: 1, shadowSize: 1024, post: 'full', marchSteps: 64 }),
  balanced: Object.freeze({ dpr: 1.25, particles: 0.5, shadowSize: 512, post: 'bloom', marchSteps: 48 }),
  low: Object.freeze({ dpr: 1, particles: 0.25, shadowSize: 0, post: 'none', marchSteps: 32 }),
  static: Object.freeze({ dpr: 1, particles: 0, shadowSize: 0, post: 'none', marchSteps: 0 }),
});

/** Feed one measured, active one-second frame window. Idle gaps are not samples. */
export function createQualityGovernor({ initial = 'balanced', lowFps = 45, highFps = 58 } = {}) {
  const tiers = ['low', 'balanced', 'high'];
  if (!tiers.includes(initial)) throw new TypeError('Initial quality must be low, balanced, or high');
  let index = tiers.indexOf(initial), bad = 0, stable = 0, reversals = 0, direction = 0, locked = false;
  return {
    get tier() { return tiers[index]; },
    get locked() { return locked; },
    sample(fps, seconds = 1) {
      if (locked || !Number.isFinite(fps) || fps <= 0 || seconds <= 0) return tiers[index];
      bad = fps < lowFps ? bad + 1 : 0;
      stable = fps >= highFps ? stable + seconds : 0;
      const next = bad >= 2 ? Math.max(0, index - 1) : stable >= 5 ? Math.min(2, index + 1) : index;
      if (next !== index) {
        const move = Math.sign(next - index);
        if (direction && move !== direction) reversals++;
        direction = move; index = next; bad = stable = 0;
        if (reversals >= 3) { locked = true; index = 0; }
      }
      return tiers[index];
    },
  };
}

export function seededRandom(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let x = state;
    x = Math.imul(x ^ x >>> 15, x | 1);
    x ^= x + Math.imul(x ^ x >>> 7, x | 61);
    return ((x ^ x >>> 14) >>> 0) / 4294967296;
  };
}
