// Scene dispatch. Everything below here reads state and draws; nothing mutates the sim.

import { VIEW_W, VIEW_H } from '../ui/layout.js';
import { drawOffice, drawBlackoutFreddy } from './office.js';
import { drawFeed, drawCamMap, drawCamTab } from './cameras.js';
import { drawHud, drawControlHint } from './hud.js';
import { drawMenu, drawIntro, drawJumpscare, drawGameOver, drawWin } from './screens.js';
import { drawStatic, drawScanlines, drawVignette, drawRefreshBand, tickFx } from './fx.js';

function drawBlackout(ctx, app) {
  const s = app.game;
  const b = s.blackout;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  if (b.sub === 'dark') {
    // Just enough light to make out the desk, and nothing else.
    ctx.save();
    ctx.globalAlpha = 0.10;
    drawOffice(ctx, s, app.panX, 0);
    ctx.restore();
  } else if (b.sub === 'music') {
    ctx.save();
    ctx.globalAlpha = 0.06;
    drawOffice(ctx, s, app.panX, 0);
    ctx.restore();
    // Flickering blue light on his face, with an occasional dropout.
    const flicker = Math.random() < 0.06 ? 0.15 : 0.75 + Math.random() * 0.25;
    drawBlackoutFreddy(ctx, app.panX, flicker);
  }
  // 'snap' and 'silence' stay black on purpose.

  drawStatic(ctx, 0.05);
  drawScanlines(ctx);
  drawVignette(ctx);
}

function drawNight(ctx, app, t) {
  const s = app.game;

  if (s.phase === 'blackout') {
    drawBlackout(ctx, app);
    return;
  }

  if (s.cams.up) {
    drawFeed(ctx, s, s.cams.id, t, app.flipT);
    drawCamMap(ctx, s);
  } else {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    drawOffice(ctx, s, app.panX, 0);
    drawStatic(ctx, 0.035);
    drawRefreshBand(ctx);
    drawScanlines(ctx);
    drawVignette(ctx);
  }

  drawCamTab(ctx, s.cams.up);
  drawHud(ctx, s);
  if (s.t < 12) drawControlHint(ctx);
}

export function render(ctx, app, t) {
  tickFx();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  switch (app.scene) {
    case 'menu':
      drawMenu(ctx, app.save, t, app.muted);
      break;
    case 'intro':
      drawIntro(ctx, app.night, app.sceneT);
      break;
    case 'night':
      drawNight(ctx, app, t);
      break;
    case 'jumpscare':
      drawJumpscare(ctx, app.game.killer, app.sceneT);
      break;
    case 'gameover':
      drawGameOver(ctx, app.night, app.sceneT);
      break;
    case 'win':
      drawWin(ctx, app.night, app.endPower, app.sceneT, app.night >= 5);
      break;
    default:
      break;
  }
}
