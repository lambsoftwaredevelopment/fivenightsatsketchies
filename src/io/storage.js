// Progress lives in localStorage. Any failure here (private mode, blocked site data)
// must degrade to "night 1, nothing unlocked" rather than break the game.

const KEY = 'fnafclone.save.v1';
const DEFAULTS = { unlocked: 1, beaten: [], best: {} };

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const v = JSON.parse(raw);
    return {
      unlocked: Math.min(Math.max(v.unlocked | 0, 1), 5),
      beaten: Array.isArray(v.beaten) ? v.beaten : [],
      best: v.best && typeof v.best === 'object' ? v.best : {},
    };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    /* storage unavailable -- progress just will not persist */
  }
}

export function recordWin(state, night, endPower) {
  const s = { ...state };
  if (!s.beaten.includes(night)) s.beaten = s.beaten.concat(night);
  s.unlocked = Math.max(s.unlocked, Math.min(night + 1, 5));
  const prev = s.best[night];
  if (prev === undefined || endPower > prev) s.best = { ...s.best, [night]: endPower };
  save(s);
  return s;
}

export function reset() {
  save({ ...DEFAULTS });
  return { ...DEFAULTS };
}
