// The highest-value tooling in the project: fast-forward many seeded nights under two
// scripted player policies and report survival rates. Because every number lives in
// sim/constants.js and sim/night-config.js, retuning the game is a data edit driven by
// what this prints.

import { test, ok, note } from './harness.js';
import { createGame, stepGame } from '../src/sim/game.js';
import * as C from '../src/sim/constants.js';

const RUNS = 60;
const DT = 1 / 20; // coarser than the render step; plenty for balance statistics

// A competent player: sweeps the door lights on a cycle, slams a door when something is
// standing there, and checks Pirate Cove often enough to shut Fexy out before they run.
function carefulBot() {
  const b = {
    velvetHold: 0, sketchyHold: 0, fexyAlarm: false,
    camT: 0, lightT: 0, left: false, right: false,
  };
  return (s) => {
    if (b.velvetHold > 0) b.velvetHold -= DT;
    if (b.sketchyHold > 0) b.sketchyHold -= DT;

    const input = {
      leftDoor: false, rightDoor: false,
      leftLight: false, rightLight: false,
      camsUp: false, camId: 'CAM1C',
    };

    b.camT += DT;
    if (b.camT >= 8) {
      // ~1s on Pirate Cove every 8s. Seeing them lean out is the cue to pre-close the
      // left door -- reacting only to the sprint is far too late.
      input.camsUp = true;
      input.camId = 'CAM1C';
      b.fexyAlarm = s.chars.fexy.stage >= 2 || s.chars.fexy.runT !== null;
      if (b.camT >= 9) b.camT = 0;
    } else {
      b.lightT = (b.lightT + DT) % 4;
      if (b.lightT < 0.5) {
        input.leftLight = true;
        if (s.chars.velvet.room === 'DOOR_LEFT') b.velvetHold = 6;
      } else if (b.lightT >= 2 && b.lightT < 2.5) {
        input.rightLight = true;
        if (s.chars.sketchy.room === 'DOOR_RIGHT') b.sketchyHold = 6;
      }
    }

    input.leftDoor = b.velvetHold > 0 || b.fexyAlarm;
    input.rightDoor = b.sketchyHold > 0;
    return input;
  };
}

// The classic beginner mistake: camp both doors and stare at the cameras.
function carelessBot() {
  const b = { t: 0 };
  return () => {
    b.t += DT;
    return {
      leftDoor: true, rightDoor: true,
      leftLight: false, rightLight: false,
      camsUp: (b.t % 10) < 5, camId: 'CAM1C',
    };
  };
}

// A realistic nervous player: spends far more time on the cameras, which means fewer
// light checks and a slower reaction at the doors. This is the policy that shows the
// animatronics can still punish, rather than the night being purely a power puzzle.
function cameraHappyBot() {
  const b = { velvetHold: 0, sketchyHold: 0, fexyAlarm: false, camT: 0, lightT: 0, cam: 0 };
  const CYCLE = ['CAM1C', 'CAM2B', 'CAM4B', 'CAM1C', 'CAM1B', 'CAM4A'];
  return (s) => {
    if (b.velvetHold > 0) b.velvetHold -= DT;
    if (b.sketchyHold > 0) b.sketchyHold -= DT;
    const input = {
      leftDoor: b.velvetHold > 0 || b.fexyAlarm, rightDoor: b.sketchyHold > 0,
      leftLight: false, rightLight: false, camsUp: false, camId: 'CAM1C',
    };

    b.camT += DT;
    if (b.camT < 6) {
      // Six seconds buried in the cameras, cycling rooms -- and blind to the doors.
      input.camsUp = true;
      input.camId = CYCLE[Math.floor(b.camT / 1) % CYCLE.length];
      if (input.camId === 'CAM1C') {
        b.fexyAlarm = s.chars.fexy.stage >= 2 || s.chars.fexy.runT !== null;
      }
      return input;
    }
    if (b.camT >= 10) b.camT = 0;

    b.lightT = (b.lightT + DT) % 4;
    if (b.lightT < 0.5) {
      input.leftLight = true;
      if (s.chars.velvet.room === 'DOOR_LEFT') b.velvetHold = 6;
    } else if (b.lightT >= 2 && b.lightT < 2.5) {
      input.rightLight = true;
      if (s.chars.sketchy.room === 'DOOR_RIGHT') b.sketchyHold = 6;
    }
    input.leftDoor = b.velvetHold > 0 || b.fexyAlarm;
    input.rightDoor = b.sketchyHold > 0;
    return input;
  };
}

function simulate(night, seed, makeBot) {
  const s = createGame({ night, seed });
  const bot = makeBot();
  const steps = Math.ceil(C.NIGHT_SECONDS / DT) + 60;
  for (let i = 0; i < steps; i++) {
    if (s.phase === 'win' || s.phase === 'dead') break;
    stepGame(s, DT, bot(s));
    s.events.length = 0;
  }
  return {
    won: s.phase === 'win',
    power: s.power,
    hour: s.hour,
    killer: s.killer,
    byPower: !!s.blackout,
  };
}

function sweep(makeBot, label) {
  const out = [];
  for (let night = 1; night <= 5; night++) {
    let wins = 0;
    let powerSum = 0;
    let byPower = 0;
    let byAnimatronic = 0;
    for (let r = 0; r < RUNS; r++) {
      const res = simulate(night, 1000 + night * 977 + r * 31, makeBot);
      if (res.won) { wins++; powerSum += res.power; }
      else if (res.byPower) byPower++;
      else byAnimatronic++;
    }
    const rate = wins / RUNS;
    const endPower = wins ? powerSum / wins : 0;
    out.push({ rate, endPower, byPower, byAnimatronic });
    note(label + ' night ' + night + ': survived ' + (rate * 100).toFixed(0) + '%' +
      (wins ? ', avg end power ' + endPower.toFixed(1) + '%' : '') +
      ' (lost ' + byPower + ' to the battery, ' + byAnimatronic + ' to an animatronic)');
  }
  return out;
}

test('a skilled player clears the week, with the margin shrinking every night', () => {
  const r = sweep(carefulBot, 'careful');
  ok(r[0].rate >= 0.95, 'night 1 should be forgiving, got ' + (r[0].rate * 100).toFixed(0) + '%');
  ok(r[4].rate > 0.3, 'night 5 must stay winnable for a strong player, got ' +
    (r[4].rate * 100).toFixed(0) + '%');
  // The real difficulty signal is how much battery is left, not just win rate.
  for (let i = 1; i < 5; i++) {
    ok(r[i].endPower < r[i - 1].endPower + 2,
      'night ' + (i + 1) + ' should not leave more slack than night ' + i);
  }
  ok(r[0].endPower > 45, 'night 1 should end comfortably, got ' + r[0].endPower.toFixed(1) + '%');
  ok(r[4].endPower < 15, 'night 5 should end on fumes, got ' + r[4].endPower.toFixed(1) + '%');
});

test('camping both doors runs the battery dry before 6AM', () => {
  const r = sweep(carelessBot, 'careless');
  ok(r[0].rate <= 0.2, 'careless night 1 should fail, got ' + (r[0].rate * 100).toFixed(0) + '%');
  ok(r[0].byPower >= RUNS * 0.5, 'and it should be the battery that kills, not a monster');
});

test('living on the cameras gets you caught at the doors', () => {
  const r = sweep(cameraHappyBot, 'camera-happy');
  const animatronicDeaths = r.reduce((a, x) => a + x.byAnimatronic, 0);
  ok(animatronicDeaths > 0, 'the animatronics must be able to punish a distracted player');
  ok(r[4].rate < r[0].rate, 'later nights punish distraction harder');
});

test('a careless run dies of power loss, not of an animatronic', () => {
  const res = simulate(1, 4242, carelessBot);
  ok(!res.won, 'should not survive');
  ok(res.byPower, 'died in the blackout');
  note('careless night 1 blacked out at hour ' + res.hour);
});
