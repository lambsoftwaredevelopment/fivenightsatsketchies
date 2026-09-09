// Per-night AI levels (0-20). A character advances when rand(1,20) <= level, so the
// level is literally the percent-of-20 chance of moving at each opportunity.
// Bumps are applied at the top of the listed hour and are cumulative.

const NIGHTS = {
  1: {
    base: { sketchy: 0, velvet: 1, fexy: 0 },
    bumps: {
      2: { velvet: 1 },
      3: { velvet: 1 },
      4: { velvet: 1, fexy: 1 },
    },
  },
  2: {
    base: { sketchy: 1, velvet: 3, fexy: 2 },
    bumps: { 3: { velvet: 1 }, 5: { fexy: 1 } },
  },
  3: {
    base: { sketchy: 2, velvet: 5, fexy: 4 },
    bumps: { 4: { sketchy: 1, velvet: 1, fexy: 1 } },
  },
  4: {
    base: { sketchy: 3, velvet: 6, fexy: 5 },
    bumps: {
      3: { sketchy: 1, velvet: 1, fexy: 1 },
      5: { sketchy: 1, velvet: 1, fexy: 1 },
    },
    // Sketchy and Fexy are capped: they are the two who force expensive, unavoidable
    // door time, so letting them run free turns the night into a pure power loss.
    caps: { sketchy: 5, fexy: 6 },
  },
  5: {
    base: { sketchy: 4, velvet: 8, fexy: 6 },
    bumps: {
      2: { sketchy: 1, velvet: 1, fexy: 1 },
      4: { sketchy: 1, velvet: 1, fexy: 1 },
    },
    caps: { sketchy: 6, fexy: 8 },
  },
};

export const MAX_NIGHT = 5;

export function aiLevelsAt(night, hour) {
  const cfg = NIGHTS[Math.min(Math.max(night, 1), MAX_NIGHT)];
  const out = { ...cfg.base };
  for (let h = 1; h <= hour; h++) {
    const bump = cfg.bumps[h];
    if (!bump) continue;
    for (const k of Object.keys(bump)) out[k] += bump[k];
  }
  const caps = cfg.caps || {};
  for (const k of Object.keys(out)) {
    const cap = caps[k] !== undefined ? caps[k] : 20;
    out[k] = Math.min(out[k], cap);
  }
  return out;
}
