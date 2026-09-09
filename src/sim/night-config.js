// Per-night AI levels (0-20). A character advances when rand(1,20) <= level, so the
// level is literally the percent-of-20 chance of moving at each opportunity.
// Bumps are applied at the top of the listed hour and are cumulative.

const NIGHTS = {
  1: {
    base: { freddy: 0, velvet: 1, chica: 0, foxy: 0 },
    bumps: {
      2: { velvet: 1 },
      3: { velvet: 1, chica: 1 },
      4: { velvet: 1, chica: 1, foxy: 1 },
    },
  },
  2: {
    base: { freddy: 1, velvet: 3, chica: 2, foxy: 2 },
    bumps: { 3: { velvet: 1, chica: 1 }, 5: { foxy: 1 } },
  },
  3: {
    base: { freddy: 2, velvet: 5, chica: 4, foxy: 4 },
    bumps: { 4: { freddy: 1, velvet: 1, chica: 1, foxy: 1 } },
  },
  4: {
    base: { freddy: 3, velvet: 6, chica: 5, foxy: 5 },
    bumps: {
      3: { freddy: 1, velvet: 1, chica: 1, foxy: 1 },
      5: { freddy: 1, velvet: 1, chica: 1, foxy: 1 },
    },
    // Freddy and Foxy are capped: they are the two who force expensive, unavoidable
    // door time, so letting them run free turns the night into a pure power loss.
    caps: { freddy: 5, foxy: 6 },
  },
  5: {
    base: { freddy: 4, velvet: 8, chica: 7, foxy: 6 },
    bumps: {
      2: { freddy: 1, velvet: 1, chica: 1, foxy: 1 },
      4: { freddy: 1, velvet: 1, chica: 1, foxy: 1 },
    },
    caps: { freddy: 6, foxy: 8 },
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
