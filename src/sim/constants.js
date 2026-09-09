// Every tunable number in the game lives here. Retuning balance should be a data edit,
// never a code edit -- see tests/balance.test.js.

// --- Clock -----------------------------------------------------------------
export const SECONDS_PER_HOUR = 90;
export const HOURS = 6;
export const NIGHT_SECONDS = SECONDS_PER_HOUR * HOURS; // 540s == 9:00 real time

// --- Power -----------------------------------------------------------------
// Drain is split so the two halves can be tuned independently: DRAIN_BASE is the
// unavoidable cost of sitting in the office, DRAIN_PER_SYSTEM is what each active
// system adds on top. These are `let` bindings so tests can sweep them -- ES module
// live bindings mean power.js sees any change immediately.
export const POWER_START = 100.0;
export let DRAIN_BASE = 0.030;         // %/s just for being here
export let DRAIN_PER_SYSTEM = 0.068;   // %/s per door / light / camera in use
export const DOOR_TOGGLE_COST = 0.1;   // % per door close, discourages spamming
export const CHICA_DOOR_DRAIN = 0.05;  // extra %/s while she leans on a closed door

export function setTuning(o) {
  if (o.DRAIN_BASE !== undefined) DRAIN_BASE = o.DRAIN_BASE;
  if (o.DRAIN_PER_SYSTEM !== undefined) DRAIN_PER_SYSTEM = o.DRAIN_PER_SYSTEM;
}

// --- Blackout sequence -----------------------------------------------------
export const BLACKOUT_DARK = 5.0;
export const BLACKOUT_MUSIC_MIN = 12.0;
export const BLACKOUT_MUSIC_MAX = 20.0;
export const BLACKOUT_SNAP = 0.5;
export const BLACKOUT_SILENCE_MIN = 2.0;
export const BLACKOUT_SILENCE_MAX = 6.0;

// --- Animatronics ----------------------------------------------------------
export const INTERVAL = {
  freddy: 3.02,
  velvet: 5.0,
  chica: 5.0,
  foxy: 5.0,
};

// How long a character waits at a door before resolving. Deliberately separate from
// their movement interval: cadence down the hall and patience at the door are different
// things, and this window is the player's whole chance to react. Freddy moves fastest,
// so without this he could arrive and kill between two light checks.
export const DOOR_GRACE = {
  freddy: 6.0,
  velvet: 5.0,
  chica: 5.0,
};

export const VELVET_COOLDOWN = 6.0;   // forced pause after being turned away
export const CHICA_COOLDOWN = 6.0;
export const CHICA_RETREAT_CHANCE = 0.5;
export const CHICA_BANG_PERIOD = 2.0;
export const FOXY_RUN_TIME = 2.5;     // sprint window -- long enough to react to the audio cue
export const FOXY_BANG_BASE = 1;
export const FOXY_BANG_MAX = 5;

export const JUMPSCARE_TIME = 1.6;
