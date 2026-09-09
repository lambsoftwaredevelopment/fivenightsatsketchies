// Power economy. Usage level 1 is the free-standing cost of simply being in the office;
// every active system adds one. Doing nothing for a whole night already costs ~48.6%,
// which is what makes the battery feel like a real budget.

import * as C from './constants.js';

export function computeUsage(state) {
  let u = 1;
  if (state.doors.left) u++;
  if (state.doors.right) u++;
  if (state.lights.left || state.lights.right) u++;
  if (state.cams.up) u++;
  return u;
}

export function applyDrain(state) {
  state.usage = computeUsage(state);
  const rate = C.DRAIN_BASE + (state.usage - 1) * C.DRAIN_PER_SYSTEM;

  state.power -= rate * state.dt;
  if (state.power <= 0) {
    state.power = 0;
    return true; // caller triggers the blackout
  }
  return false;
}

export function beginBlackout(state) {
  state.phase = 'blackout';
  state.doors.left = false;
  state.doors.right = false;
  state.lights.left = false;
  state.lights.right = false;
  state.cams.up = false;
  state.blackout = {
    t: 0,
    sub: 'dark',
    musicLen: state.rng.range(C.BLACKOUT_MUSIC_MIN, C.BLACKOUT_MUSIC_MAX),
    silenceLen: state.rng.range(C.BLACKOUT_SILENCE_MIN, C.BLACKOUT_SILENCE_MAX),
  };
  state.events.push('power.out');
}

// Dark -> Freddy lit in the left doorway with the toreador march -> snap to black and
// silence -> jumpscare. Reaching 6AM part-way through still counts as a win.
export function stepBlackout(state) {
  const b = state.blackout;
  b.t += state.dt;

  if (b.sub === 'dark' && b.t >= C.BLACKOUT_DARK) {
    b.sub = 'music';
    b.t = 0;
    state.events.push('freddy.toreador');
  } else if (b.sub === 'music' && b.t >= b.musicLen) {
    b.sub = 'snap';
    b.t = 0;
    state.events.push('blackout.snap');
  } else if (b.sub === 'snap' && b.t >= C.BLACKOUT_SNAP) {
    b.sub = 'silence';
    b.t = 0;
  } else if (b.sub === 'silence' && b.t >= b.silenceLen) {
    state.killer = 'freddy';
    state.phase = 'jumpscare';
    state.jumpscareT = 0;
    state.events.push('jumpscare.freddy');
  }
}
