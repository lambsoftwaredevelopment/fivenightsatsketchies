import { test, eq, ok, approx, note } from './harness.js';
import { createGame, stepGame } from '../src/sim/game.js';
import { computeUsage } from '../src/sim/power.js';
import { aiLevelsAt } from '../src/sim/night-config.js';
import { nextRoom } from '../src/sim/map.js';
import * as C from '../src/sim/constants.js';

const IDLE = { leftDoor: false, rightDoor: false, leftLight: false, rightLight: false, camsUp: false };

function advance(state, seconds, input, dt) {
  const step = dt || 1 / 60;
  const n = Math.round(seconds / step);
  for (let i = 0; i < n; i++) stepGame(state, step, input || IDLE);
  return state;
}

// Park every character except `keep` so a test can observe one behaviour in isolation.
function isolate(state, keep) {
  for (const k of Object.keys(state.chars)) {
    if (k !== keep) {
      state.chars[k].interval = 1e9;
      state.chars[k].doorGrace = 1e9; // door resolution runs off its own clock
    }
  }
  return state;
}

// --- Power ------------------------------------------------------------------

test('usage counts each active system', () => {
  const s = createGame({});
  eq(computeUsage(s), 1, 'idle');
  s.doors.left = true;
  eq(computeUsage(s), 2, 'one door');
  s.doors.right = true;
  eq(computeUsage(s), 3, 'both doors');
  s.lights.left = true;
  eq(computeUsage(s), 4, 'plus light');
  s.lights.right = true;
  eq(computeUsage(s), 4, 'both lights still count once');
  s.cams.up = true;
  eq(computeUsage(s), 5, 'plus cams');
});

test('idle drain matches the base rate', () => {
  const s = isolate(createGame({ night: 1, seed: 1 }), 'none');
  advance(s, 100);
  approx(s.power, 100 - C.DRAIN_BASE * 100, 0.05);
});

test('sitting still is cheap -- the systems are what cost you', () => {
  const s = isolate(createGame({ night: 1, seed: 1 }), 'none');
  advance(s, C.NIGHT_SECONDS - 1);
  approx(s.power, 100 - C.DRAIN_BASE * (C.NIGHT_SECONDS - 1), 0.2);
  // A whole night of doing nothing costs ~16%, so the budget is spent on defending.
  ok(s.power > 75, 'idle should be affordable, got ' + s.power.toFixed(1));
});

test('holding every system at once cannot last the night', () => {
  const s = isolate(createGame({ night: 1, seed: 1 }), 'none');
  const rate = C.DRAIN_BASE + 4 * C.DRAIN_PER_SYSTEM; // usage 5
  ok(rate * C.NIGHT_SECONDS > 100,
    'usage 5 must exhaust the battery before 6AM, lasts ' + (100 / rate).toFixed(0) + 's');
});

test('closing a door charges the toggle cost', () => {
  const s = isolate(createGame({ night: 1, seed: 1 }), 'none');
  const before = s.power;
  stepGame(s, 1 / 60, { ...IDLE, leftDoor: true });
  const oneStep = (C.DRAIN_BASE + C.DRAIN_PER_SYSTEM) / 60; // usage 2 for one frame
  approx(s.power, before - C.DOOR_TOGGLE_COST - oneStep, 0.001);
});

test('cameras lock out the doors and lights', () => {
  const s = isolate(createGame({ night: 1, seed: 1 }), 'none');
  advance(s, 1, { ...IDLE, leftDoor: true, leftLight: true });
  eq(s.doors.left, true, 'door closed with cams down');
  advance(s, 1, { ...IDLE, leftDoor: true, leftLight: true, camsUp: true });
  eq(s.lights.left, false, 'lights forced off while watching');
});

// --- Doors and death --------------------------------------------------------

test('an open door at the resolving opportunity is fatal', () => {
  const s = isolate(createGame({ night: 1, seed: 7 }), 'velvet');
  s.chars.velvet.room = 'DOOR_LEFT';
  s.chars.velvet.timer = 0;
  advance(s, 5.1, IDLE);
  eq(s.phase, 'jumpscare');
  eq(s.killer, 'velvet');
});

test('a closed door turns Velvet away and buys a cooldown', () => {
  const s = isolate(createGame({ night: 1, seed: 7 }), 'velvet');
  s.chars.velvet.room = 'DOOR_LEFT';
  s.chars.velvet.timer = 0;
  advance(s, 5.1, { ...IDLE, leftDoor: true });
  eq(s.phase, 'playing');
  // He falls back two rooms, not to the far end of the building -- so he will be back.
  eq(s.chars.velvet.room, 'CAM2A');
  ok(s.chars.velvet.cooldown > 0, 'cooldown armed');
});

test('reaching the door is not instant death -- there is a reaction window', () => {
  const s = isolate(createGame({ night: 1, seed: 7 }), 'velvet');
  s.chars.velvet.room = 'DOOR_LEFT';
  s.chars.velvet.timer = 0;
  advance(s, 4.0, IDLE); // door still open, but his opportunity has not come round
  eq(s.phase, 'playing', 'survives the grace window');
});

test('Chica taxes the battery while leaning on a closed door', () => {
  const a = isolate(createGame({ night: 1, seed: 3 }), 'none');
  const b = isolate(createGame({ night: 1, seed: 3 }), 'none');
  b.chars.chica.room = 'DOOR_RIGHT';
  advance(a, 20, { ...IDLE, rightDoor: true });
  advance(b, 20, { ...IDLE, rightDoor: true });
  ok(b.power < a.power - 0.9, 'chica costs extra: ' + a.power.toFixed(2) + ' vs ' + b.power.toFixed(2));
});

// --- Camera-coupled behaviour ----------------------------------------------

test('watching Pirate Cove freezes Foxy', () => {
  const s = isolate(createGame({ night: 5, seed: 11 }), 'foxy');
  advance(s, 60, { ...IDLE, camsUp: true, camId: 'CAM1C' });
  eq(s.chars.foxy.stage, 0, 'never advanced');
  eq(s.chars.foxy.timer, 0, 'timer held at zero');
});

test('ignoring Pirate Cove lets Foxy out', () => {
  const s = isolate(createGame({ night: 5, seed: 11 }), 'foxy');
  advance(s, 60, { ...IDLE, camsUp: true, camId: 'CAM1A' });
  ok(s.chars.foxy.stage > 0 || s.phase !== 'playing', 'foxy progressed');
});

test('a closed left door costs power but survives Foxy', () => {
  const s = isolate(createGame({ night: 5, seed: 11 }), 'foxy');
  s.chars.foxy.stage = 3;
  s.chars.foxy.runT = C.FOXY_RUN_TIME;
  const before = s.power;
  advance(s, C.FOXY_RUN_TIME + 0.5, { ...IDLE, leftDoor: true });
  eq(s.phase, 'playing', 'survived');
  eq(s.chars.foxy.stage, 0, 'reset to the cove');
  ok(before - s.power >= 2, 'bang drained power');
});

test('Foxy at an open door kills instantly -- no grace window', () => {
  const s = isolate(createGame({ night: 5, seed: 11 }), 'foxy');
  s.chars.foxy.stage = 3;
  s.chars.foxy.runT = C.FOXY_RUN_TIME;
  advance(s, C.FOXY_RUN_TIME + 0.5, IDLE);
  eq(s.phase, 'jumpscare');
  eq(s.killer, 'foxy');
});

test('watching Freddy stops Freddy', () => {
  const s = isolate(createGame({ night: 5, seed: 21 }), 'freddy');
  advance(s, 60, { ...IDLE, camsUp: true, camId: 'CAM1A' });
  eq(s.chars.freddy.room, 'CAM1A', 'pinned while observed');
});

test('looking away lets Freddy move', () => {
  const s = isolate(createGame({ night: 5, seed: 21 }), 'freddy');
  advance(s, 60, { ...IDLE, camsUp: true, camId: 'CAM4A' });
  ok(s.chars.freddy.room !== 'CAM1A', 'moved while unobserved');
});

// --- Blackout ---------------------------------------------------------------

test('running out of power starts the blackout, not an instant death', () => {
  const s = isolate(createGame({ night: 1, seed: 5 }), 'none');
  s.power = 0.01;
  advance(s, 1, IDLE);
  eq(s.phase, 'blackout');
  eq(s.blackout.sub, 'dark');
  eq(s.doors.left, false, 'doors forced open');
});

test('the blackout sequence ends in a jumpscare', () => {
  const s = isolate(createGame({ night: 1, seed: 5 }), 'none');
  s.power = 0.01;
  advance(s, 40, IDLE);
  ok(s.phase === 'jumpscare' || s.phase === 'dead', 'got ' + s.phase);
  eq(s.killer, 'freddy');
});

test('reaching 6AM during the blackout still wins', () => {
  const s = isolate(createGame({ night: 1, seed: 5 }), 'none');
  s.power = 0.01;
  s.t = C.NIGHT_SECONDS - 4;
  advance(s, 6, IDLE);
  eq(s.phase, 'win');
});

// --- Clock and config -------------------------------------------------------

test('surviving to 6AM wins', () => {
  const s = isolate(createGame({ night: 1, seed: 9 }), 'none');
  advance(s, C.NIGHT_SECONDS + 1);
  eq(s.phase, 'win');
});

test('the hour advances every 90 seconds', () => {
  const s = isolate(createGame({ night: 1, seed: 9 }), 'none');
  advance(s, 91);
  eq(s.hour, 1);
  advance(s, 90);
  eq(s.hour, 2);
});

test('AI levels escalate across the night and across nights', () => {
  eq(aiLevelsAt(1, 0).velvet, 1);
  eq(aiLevelsAt(1, 4).velvet, 4, 'velvet ramps on night 1');
  eq(aiLevelsAt(1, 0).freddy, 0, 'freddy is dormant on night 1');
  ok(aiLevelsAt(5, 0).velvet > aiLevelsAt(1, 0).velvet, 'night 5 harder than night 1');
  eq(aiLevelsAt(4, 5).freddy, 5, 'freddy capped on night 4');
  eq(aiLevelsAt(5, 5).freddy, 6, 'freddy capped on night 5');
  eq(aiLevelsAt(5, 5).foxy, 8, 'foxy capped on night 5');
});

test('the room paths lead to the correct doors', () => {
  eq(nextRoom('velvet', 'CAM2B'), 'DOOR_LEFT');
  eq(nextRoom('chica', 'CAM4B'), 'DOOR_RIGHT');
  eq(nextRoom('freddy', 'CAM4B'), 'DOOR_RIGHT');
  eq(nextRoom('velvet', 'DOOR_LEFT'), null, 'the door is the end of the path');
});

test('the same seed replays identically', () => {
  const a = createGame({ night: 4, seed: 424242 });
  const b = createGame({ night: 4, seed: 424242 });
  advance(a, 120, IDLE);
  advance(b, 120, IDLE);
  eq(JSON.stringify(a.chars), JSON.stringify(b.chars));
  approx(a.power, b.power, 1e-9);
});
