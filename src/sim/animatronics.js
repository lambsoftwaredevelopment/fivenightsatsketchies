// The four behaviour rules. Each character is countered by a *different* player action,
// which is what turns the night into a juggling act instead of one repeated move:
//   Bonnie -- the door.            Chica  -- the door, but she taxes your battery.
//   Foxy   -- watching him.        Freddy -- NOT watching him.

import * as C from './constants.js';
import { nextRoom, prevRoom } from './map.js';

// A movement opportunity succeeds when rand(1,20) <= aiLevel.
export function rollMove(state, aiLevel) {
  return state.rng.int(1, 20) <= aiLevel;
}

// A repelled character falls back only a couple of rooms, not to the far end of the
// building. They return quickly, so holding them off is a recurring cost rather than a
// one-off -- which is what keeps the battery, not detection, as the real constraint.
function backOff(key, room, steps) {
  let r = room;
  for (let i = 0; i < steps; i++) {
    const p = prevRoom(key, r);
    if (!p) break;
    r = p;
  }
  return r;
}

function doorOpen(state, room) {
  return room === 'DOOR_LEFT' ? !state.doors.left : !state.doors.right;
}

function kill(state, who) {
  state.killer = who;
  state.phase = 'jumpscare';
  state.jumpscareT = 0;
  state.events.push('jumpscare.' + who);
}

// --- Shared hall-walker logic ----------------------------------------------
// Reaching a door is not instant death. The character waits there until their *next*
// opportunity, which is the window the player has to flick the light and react.
function stepWalker(state, key, ai, onRetreat) {
  const c = state.chars[key];

  if (c.cooldown > 0) {
    c.cooldown -= state.dt;
    return;
  }

  const atDoor = c.room === 'DOOR_LEFT' || c.room === 'DOOR_RIGHT';
  const limit = atDoor ? c.doorGrace : c.interval;

  c.timer += state.dt;
  if (c.timer < limit) return;
  c.timer -= limit;

  if (atDoor) {
    if (doorOpen(state, c.room)) {
      kill(state, key);
    } else {
      onRetreat(c);
    }
    return;
  }

  if (rollMove(state, ai)) {
    const dest = nextRoom(key, c.room);
    if (dest) {
      c.room = dest;
      state.events.push(key + '.move');
      if (dest === 'DOOR_LEFT' || dest === 'DOOR_RIGHT') {
        state.events.push(key + '.atdoor');
      }
    }
  }
}

// --- Bonnie -----------------------------------------------------------------
// Immune to cameras; beaten purely by the left door. Always retreats when blocked.
export function stepBonnie(state, ai) {
  stepWalker(state, 'bonnie', ai, (c) => {
    c.room = backOff('bonnie', c.room, 2);
    c.cooldown = C.BONNIE_COOLDOWN;
    state.events.push('bonnie.retreat');
  });
}

// --- Chica ------------------------------------------------------------------
// Same door logic, but she only leaves half the time -- so she squats at a closed door
// and bleeds your battery. She is the reason a "just hold both doors" run dies early.
export function stepChica(state, ai) {
  const c = state.chars.chica;

  if (c.room === 'DOOR_RIGHT' && state.doors.right) {
    c.bangTimer += state.dt;
    if (c.bangTimer >= C.CHICA_BANG_PERIOD) {
      c.bangTimer -= C.CHICA_BANG_PERIOD;
      state.events.push('chica.bang');
    }
  } else {
    c.bangTimer = 0;
  }

  stepWalker(state, 'chica', ai, (ch) => {
    if (state.rng.chance(C.CHICA_RETREAT_CHANCE)) {
      ch.room = backOff('chica', ch.room, 2);
      ch.cooldown = C.CHICA_COOLDOWN;
      state.events.push('chica.retreat');
    }
    // Otherwise she stays put and keeps draining.
  });
}

// --- Freddy -----------------------------------------------------------------
// Only moves while unobserved: any frame where the cameras are up AND showing his
// current room, his roll is skipped entirely. He laughs on every successful move,
// which is the only warning the player gets.
export function stepFreddy(state, ai) {
  const c = state.chars.freddy;
  const watched = state.cams.up && state.cams.id === c.room;
  if (watched) {
    c.timer = 0;
    return;
  }
  const before = c.room;
  stepWalker(state, 'freddy', ai, (f) => {
    const back = prevRoom('freddy', f.room);
    if (back) f.room = back;
    state.events.push('freddy.retreat');
  });
  if (c.room !== before) state.events.push('freddy.laugh');
}

// --- Foxy -------------------------------------------------------------------
// His timer only advances while you are NOT looking at Pirate Cove. Watching resets it.
// Once he sprints there is no grace window -- he is the punishment for camera neglect.
export function stepFoxy(state, ai) {
  const f = state.chars.foxy;

  if (f.runT !== null) {
    f.runT -= state.dt;
    if (f.runT <= 0) {
      f.runT = null;
      if (!state.doors.left) {
        kill(state, 'foxy');
      } else {
        f.bangs++;
        const cost = Math.min(C.FOXY_BANG_BASE + f.bangs, C.FOXY_BANG_MAX);
        state.power = Math.max(0, state.power - cost);
        f.stage = 0;
        f.timer = 0;
        state.events.push('foxy.bang');
      }
    }
    return;
  }

  const watched = state.cams.up && state.cams.id === 'CAM1C';
  if (watched) {
    f.timer = 0;
    return;
  }

  f.timer += state.dt;
  if (f.timer < f.interval) return;
  f.timer -= f.interval;

  if (!rollMove(state, ai)) return;

  f.stage++;
  state.events.push('foxy.stage');
  if (f.stage >= 3) {
    f.runT = C.FOXY_RUN_TIME;
    state.events.push('foxy.run');
  }
}
