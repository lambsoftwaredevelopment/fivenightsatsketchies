// Integration tests: drive the real app -- scene machine, input, rendering and save --
// with an explicit dt. These catch the class of bug the pure-sim tests cannot, such as
// a render layer painting over the thing it was meant to reveal.

import { test, eq, ok, note } from './harness.js';
import { createApp } from '../src/app.js';
import { NIGHT_BTN, END_BTN, CAM_TAB, VIEW_W, VIEW_H } from '../src/ui/layout.js';
import * as C from '../src/sim/constants.js';
import { image } from '../src/assets/assets.js';

const DT = 1 / 30;

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = VIEW_W;
  c.height = VIEW_H;
  return c;
}

// The app is booted once and shared; each test drives it from a known scene.
let shared = null;
export async function bootShared() {
  const g = createApp(makeCanvas());
  await g.boot();
  shared = g;
  return g;
}

function step(g, seconds, draw) {
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) {
    g.update(DT);
    if (draw) g.draw(i * DT);
  }
}

function center(r) {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

test('the app boots to the menu', () => {
  eq(shared.app.scene, 'menu');
});

test('clicking a night runs the intro then starts the night', () => {
  const g = shared;
  const p = center(NIGHT_BTN.night1);
  g.clickAt(p.x, p.y);
  step(g, 0.1);
  eq(g.app.scene, 'intro', 'intro card first');
  step(g, 3.0);
  eq(g.app.scene, 'night', 'then the night itself');
  eq(g.app.game.night, 1);
});

test('a locked night cannot be started', () => {
  const g = createApp(makeCanvas());
  g.app.save = { unlocked: 1, beaten: [], best: {} };
  g.app.scene = 'menu';
  const p = center(NIGHT_BTN.night4);
  g.clickAt(p.x, p.y);
  step(g, 0.2);
  eq(g.app.scene, 'menu', 'night 4 is locked');
});

test('the camera tab raises and lowers the feed', () => {
  const g = shared;
  eq(g.app.scene, 'night', 'still in a night');
  const p = center(CAM_TAB);
  g.clickAt(p.x, p.y);
  step(g, 0.2);
  eq(g.app.game.cams.up, true);
  g.clickAt(p.x, p.y);
  step(g, 0.2);
  eq(g.app.game.cams.up, false);
});

test('every scene renders without throwing', () => {
  const g = shared;
  const s = g.app.game;
  const scenes = ['menu', 'intro', 'night', 'jumpscare', 'gameover', 'win'];
  const saved = g.app.scene;
  for (const sc of scenes) {
    g.app.scene = sc;
    g.app.game.killer = 'velvet';
    g.draw(1.0);
    // and again with the cameras up, which is a different path entirely
    if (sc === 'night') {
      s.cams.up = true;
      for (const id of ['CAM1A', 'CAM1B', 'CAM1C', 'CAM2B', 'CAM6', 'CAM4B']) {
        s.cams.id = id;
        g.draw(1.0);
      }
      s.cams.up = false;
    }
  }
  g.app.scene = saved;
  ok(true, 'all scenes drew');
});

test('the blackout renders and resolves to a jumpscare', () => {
  const g = createApp(makeCanvas());
  g.app.save = { unlocked: 5, beaten: [], best: {} };
  g.app.scene = 'menu';
  g.clickAt(center(NIGHT_BTN.night1).x, center(NIGHT_BTN.night1).y);
  step(g, 3.2);
  eq(g.app.scene, 'night');
  g.app.game.power = 0.05;
  step(g, 2, true);
  eq(g.app.game.phase, 'blackout', 'lights out');
  step(g, 40, true);
  ok(g.app.scene === 'jumpscare' || g.app.scene === 'gameover',
    'ends in a scare, got ' + g.app.scene);
});

test('surviving to 6AM wins, unlocks the next night and records the run', () => {
  const g = createApp(makeCanvas());
  g.app.save = { unlocked: 1, beaten: [], best: {} };
  g.app.scene = 'menu';
  g.clickAt(center(NIGHT_BTN.night1).x, center(NIGHT_BTN.night1).y);
  step(g, 3.2);
  // Jump to the last moments of the night rather than simulating all nine minutes.
  g.app.game.t = C.NIGHT_SECONDS - 1;
  g.app.game.power = 40;
  step(g, 2);
  eq(g.app.scene, 'win');
  eq(g.app.save.unlocked, 2, 'night 2 unlocked');
  ok(g.app.save.beaten.includes(1), 'night 1 recorded as beaten');
  ok(g.app.save.best[1] > 0, 'end power recorded');

  // "NEXT NIGHT" should take us into night 2.
  step(g, 0.8);
  g.clickAt(center(END_BTN.retry).x, center(END_BTN.retry).y);
  step(g, 0.2);
  eq(g.app.night, 2);
});

test('game over offers a retry that restarts the same night', () => {
  const g = createApp(makeCanvas());
  g.app.save = { unlocked: 3, beaten: [1, 2], best: {} };
  g.app.scene = 'menu';
  g.clickAt(center(NIGHT_BTN.night3).x, center(NIGHT_BTN.night3).y);
  step(g, 3.2);
  g.app.game.chars.velvet.room = 'DOOR_LEFT';
  g.app.game.chars.velvet.timer = 0;
  step(g, 5.4); // their door-grace window elapses at 5s with the door open
  eq(g.app.scene, 'jumpscare', 'velvet got in');
  step(g, 2.2);
  eq(g.app.scene, 'gameover');
  step(g, 0.8);
  g.clickAt(center(END_BTN.retry).x, center(END_BTN.retry).y);
  step(g, 0.2);
  eq(g.app.night, 3, 'same night again');
});

// --- Regression guard for the door-frame bug -------------------------------
// The frame plate is drawn ON TOP of the doorway, the light glow and whoever is
// standing there. If its opening is ever filled opaque again, the lit doorway goes
// uniformly black and the game silently stops showing you the thing at your door.
test('a lit doorway with someone in it is not painted over by the frame', () => {
  const g = createApp(makeCanvas());
  g.app.save = { unlocked: 1, beaten: [], best: {} };
  g.app.scene = 'menu';
  g.clickAt(center(NIGHT_BTN.night1).x, center(NIGHT_BTN.night1).y);
  step(g, 3.2);

  const s = g.app.game;
  s.chars.velvet.room = 'DOOR_LEFT';
  g.input.state.panX = 0;
  g.input.state.lights.left = true;
  step(g, 0.6, true);
  g.draw(1.0);

  // Sample well inside the left doorway.
  const d = g.ctx.getImageData(300, 320, 1, 1).data;
  const brightness = d[0] + d[1] + d[2];
  note('doorway sample rgb ' + d[0] + ',' + d[1] + ',' + d[2]);
  ok(brightness > 40, 'lit doorway must not be flat black, got ' + brightness);
});

test('the door frame plate has a transparent opening', () => {
  const frame = image('office.doorframe');
  ok(frame, 'frame asset exists');
  const c = document.createElement('canvas');
  c.width = frame.width;
  c.height = frame.height;
  const cx = c.getContext('2d');
  cx.drawImage(frame, 0, 0);
  const mid = cx.getImageData((frame.width / 2) | 0, (frame.height / 2) | 0, 1, 1).data;
  eq(mid[3], 0, 'centre of the frame plate must be fully transparent');
});
