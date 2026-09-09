// The whole game as a deterministic reducer. Nothing in this file (or anywhere under
// sim/) may touch document, window, canvas or performance -- that purity is what lets
// tests/balance.test.js fast-forward hundreds of nights headlessly.

import * as C from './constants.js';
import { makeRng } from '../core/rng.js';
import { aiLevelsAt } from './night-config.js';
import { applyDrain, beginBlackout, stepBlackout, computeUsage } from './power.js';
import { stepBonnie, stepChica, stepFreddy, stepFoxy } from './animatronics.js';

export function createGame({ night = 1, seed = 12345 } = {}) {
  const rng = makeRng(seed);
  return {
    night,
    seed,
    rng,
    dt: 0,
    phase: 'playing', // playing | blackout | jumpscare | dead | win
    t: 0,
    hour: 0,
    power: C.POWER_START,
    usage: 1,
    doors: { left: false, right: false },
    lights: { left: false, right: false },
    cams: { up: false, id: 'CAM1A' },
    chars: {
      freddy: { room: 'CAM1A', timer: 0, cooldown: 0, interval: C.INTERVAL.freddy, doorGrace: C.DOOR_GRACE.freddy },
      bonnie: { room: 'CAM1A', timer: 0, cooldown: 0, interval: C.INTERVAL.bonnie, doorGrace: C.DOOR_GRACE.bonnie },
      chica: { room: 'CAM1A', timer: 0, cooldown: 0, bangTimer: 0, interval: C.INTERVAL.chica, doorGrace: C.DOOR_GRACE.chica },
      foxy: { stage: 0, timer: 0, bangs: 0, runT: null, room: 'CAM1C', interval: C.INTERVAL.foxy },
    },
    blackout: null,
    jumpscareT: 0,
    killer: null,
    events: [],
  };
}

// Doors and lights are locked out while the cameras are up. That one rule is the entire
// tension loop: you cannot look and defend at the same time.
function applyInput(state, input) {
  const wasLeft = state.doors.left;
  const wasRight = state.doors.right;

  if (state.cams.up) {
    state.lights.left = false;
    state.lights.right = false;
  } else {
    state.doors.left = !!input.leftDoor;
    state.doors.right = !!input.rightDoor;
    state.lights.left = !!input.leftLight;
    state.lights.right = !!input.rightLight;
  }

  state.cams.up = !!input.camsUp;
  if (input.camId) state.cams.id = input.camId;

  if (!wasLeft && state.doors.left) {
    state.power -= C.DOOR_TOGGLE_COST;
    state.events.push('door.close.left');
  } else if (wasLeft && !state.doors.left) {
    state.events.push('door.open.left');
  }
  if (!wasRight && state.doors.right) {
    state.power -= C.DOOR_TOGGLE_COST;
    state.events.push('door.close.right');
  } else if (wasRight && !state.doors.right) {
    state.events.push('door.open.right');
  }
}

export function stepGame(state, dt, input) {
  state.dt = dt;

  if (state.phase === 'dead' || state.phase === 'win') return state;

  if (state.phase === 'jumpscare') {
    state.jumpscareT += dt;
    if (state.jumpscareT >= C.JUMPSCARE_TIME) state.phase = 'dead';
    return state;
  }

  // The clock keeps running through a blackout, so surviving the dark until 6AM is a
  // genuine (and very tense) way to win.
  state.t += dt;
  const hour = Math.min(C.HOURS, Math.floor(state.t / C.SECONDS_PER_HOUR));
  if (hour !== state.hour) {
    state.hour = hour;
    state.events.push('hour.' + hour);
  }
  if (state.t >= C.NIGHT_SECONDS) {
    state.phase = 'win';
    state.events.push('night.win');
    return state;
  }

  if (state.phase === 'blackout') {
    stepBlackout(state);
    return state;
  }

  applyInput(state, input || {});

  if (applyDrain(state)) {
    beginBlackout(state);
    return state;
  }

  const ai = aiLevelsAt(state.night, state.hour);
  stepFreddy(state, ai.freddy);
  stepBonnie(state, ai.bonnie);
  stepChica(state, ai.chica);
  stepFoxy(state, ai.foxy);

  return state;
}

// 12AM, 1AM ... 5AM. Displayed as "12 AM" through "5 AM".
export function clockLabel(state) {
  const h = state.hour === 0 ? 12 : state.hour;
  return h + ' AM';
}

export { computeUsage };
