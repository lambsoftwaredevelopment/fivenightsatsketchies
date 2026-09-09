// Seeded PRNG (mulberry32). Deterministic and serializable so that any night can be
// replayed exactly -- essential for the balance tests.

export function makeRng(seed) {
  let s = seed >>> 0;
  const rng = {
    next() {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    // Inclusive integer range, matching FNAF's rand(1,20) idiom.
    int(lo, hi) {
      return lo + Math.floor(rng.next() * (hi - lo + 1));
    },
    range(lo, hi) {
      return lo + rng.next() * (hi - lo);
    },
    chance(p) {
      return rng.next() < p;
    },
    get state() {
      return s;
    },
    set state(v) {
      s = v >>> 0;
    },
  };
  return rng;
}
