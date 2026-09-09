// The whole game as a driveable object: scene state machine, event forwarding and
// rendering. Deliberately free of requestAnimationFrame so tests can step it with an
// explicit dt -- main.js is the only part that needs a real animation loop.

import { createGame, stepGame } from './sim/game.js';
import { createInput } from './io/input.js';
import * as storage from './io/storage.js';
import { loadAssets } from './assets/assets.js';
import { initFx } from './render/fx.js';
import { render } from './render/renderer.js';
import { updateOffice, resetOffice } from './render/office.js';
import * as audio from './audio/audio.js';
import { MAX_NIGHT } from './sim/night-config.js';
import {
  VIEW_W, VIEW_H, NIGHT_BTN, MENU_BTN, END_BTN, inRect, hitTest,
} from './ui/layout.js';

export function createApp(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;
  const input = createInput(canvas);

  const app = {
    scene: 'loading',
    sceneT: 0,
    night: 1,
    game: null,
    panX: 0,
    flipT: 0,        // camera flip transition, 1 -> 0
    endPower: 0,
    save: storage.load(),
    muted: false,
  };
  
  function setScene(name) {
    app.scene = name;
    app.sceneT = 0;
    input.setEnabled(name === 'night');
  }
  
  function startNight(n) {
    app.night = n;
    app.game = createGame({ night: n, seed: (Date.now() ^ (n * 7919)) >>> 0 });
    input.resetForNight();
    resetOffice();
    setScene('intro');
  }
  
  // --- Scene input ------------------------------------------------------------
  
  function handleMenuClicks() {
    for (const c of input.drainClicks()) {
      audio.init();
      const nightKey = hitTest(NIGHT_BTN, c.x, c.y);
      if (nightKey) {
        const n = NIGHT_BTN[nightKey].night;
        if (n <= app.save.unlocked) {
          audio.play('buttonClick');
          startNight(n);
        }
        return;
      }
      if (inRect(MENU_BTN.mute, c.x, c.y)) {
        app.muted = !app.muted;
        audio.setMuted(app.muted);
        return;
      }
      if (inRect(MENU_BTN.reset, c.x, c.y)) {
        app.save = storage.reset();
        return;
      }
    }
    for (const a of input.drainActions()) {
      if (a === 'confirm') {
        audio.init();
        startNight(Math.min(app.save.unlocked, MAX_NIGHT));
      }
    }
  }
  
  function handleEndClicks(isWin) {
    for (const c of input.drainClicks()) {
      if (inRect(END_BTN.retry, c.x, c.y)) {
        audio.play('buttonClick');
        if (isWin && app.night < MAX_NIGHT) startNight(app.night + 1);
        else if (isWin) { setScene('menu'); }
        else startNight(app.night);
        return;
      }
      if (inRect(END_BTN.menu, c.x, c.y)) {
        audio.play('buttonClick');
        setScene('menu');
        return;
      }
    }
    input.drainActions();
  }
  
  // --- Event forwarding -------------------------------------------------------
  
  function drainEvents(t) {
    const s = app.game;
    if (!s) return;
    for (const tag of s.events) {
      audio.handleEvent(tag);
      if (tag === 'power.out') audio.setLoop('fan', false);
    }
    s.events.length = 0;
  }
  
  // --- Update -----------------------------------------------------------------
  
  function update(dt) {
    app.sceneT += dt;
    input.update(dt);
    app.panX = input.state.panX;
  
    // UI feedback for camera actions happens outside the sim.
    for (const a of input.drainActions()) {
      if (a === 'cam.up') { app.flipT = 1; audio.play('camFlip'); }
      else if (a === 'cam.down') { app.flipT = 1; audio.play('camFlip'); }
      else if (a === 'cam.switch') { app.flipT = 0.6; audio.play('camSwitch'); }
      else if (a === 'button') audio.play('buttonClick');
    }
    if (app.flipT > 0) app.flipT = Math.max(0, app.flipT - dt * 3.5);
  
    switch (app.scene) {
      case 'menu':
        handleMenuClicks();
        audio.setLoop('fan', false);
        audio.setLoop('hum', false);
        audio.setLoop('hiss', false);
        break;
  
      case 'intro':
        input.drainClicks();
        if (app.sceneT > 2.6) {
          setScene('night');
          audio.setLoop('fan', true);
          audio.setLoop('hum', true);
        }
        break;
  
      case 'night': {
        const s = app.game;
        stepGame(s, dt, input.simInput());
        updateOffice(dt, s);
        drainEvents();
  
        audio.setLoop('hiss', s.cams.up);
        audio.setLoop('fan', !s.cams.up && s.phase === 'playing');
  
        if (s.phase === 'blackout' && s.blackout.sub === 'music') {
          audio.playToreadorLoop(performance.now() / 1000);
        }
        if (s.phase === 'jumpscare') {
          audio.stopToreador();
          audio.setLoop('fan', false);
          audio.setLoop('hiss', false);
          setScene('jumpscare');
        } else if (s.phase === 'win') {
          app.endPower = s.power;
          app.save = storage.recordWin(app.save, app.night, s.power);
          audio.stopToreador();
          audio.setLoop('fan', false);
          audio.setLoop('hiss', false);
          audio.play('cheer');
          setScene('win');
        }
        break;
      }
  
      case 'jumpscare':
        input.drainClicks();
        if (app.sceneT > 1.6) setScene('gameover');
        break;
  
      case 'gameover':
        if (app.sceneT > 0.6) handleEndClicks(false);
        else input.drainClicks();
        break;
  
      case 'win':
        if (app.sceneT > 0.6) handleEndClicks(true);
        else input.drainClicks();
        break;
  
      default:
        break;
    }
  }
  
  function draw(t) {
    if (app.scene === 'loading') {
      ctx.fillStyle = '#07070a';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.fillStyle = '#6a6a7a';
      ctx.font = '18px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('loading…', VIEW_W / 2, VIEW_H / 2);
      ctx.textAlign = 'left';
      return;
    }
    render(ctx, app, t);
  }

  return {
    app,
    input,
    ctx,
    update,
    draw,
    async boot() {
      initFx();
      await loadAssets();
      setScene('menu');
    },
    // Test seam: drive a click in canvas coordinates without a DOM event. Goes through
    // exactly the same handler a real mousedown would.
    clickAt(x, y) {
      input.press(x, y);
    },
  };
}
