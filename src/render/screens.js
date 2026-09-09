// Menu, night card, jumpscare, death and 6AM screens.

import { P } from './palette.js';
import { drawSprite } from './sprites.js';
import { drawStatic, drawScanlines, drawVignette } from './fx.js';
import { VIEW_W, VIEW_H, NIGHT_BTN, MENU_BTN, END_BTN } from '../ui/layout.js';

function panel(ctx, r, on, accent) {
  ctx.fillStyle = on ? (accent || '#22303a') : '#14141c';
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, 8);
  ctx.fill();
  ctx.strokeStyle = on ? '#4a7f8f' : '#2a2a36';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function centerText(ctx, text, x, y, font, fill) {
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

export function drawMenu(ctx, save, t, muted) {
  ctx.fillStyle = '#06060a';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Sketchy looming out of the bottom-right dark -- clear of the title and the buttons.
  ctx.save();
  // The 'idle' plate, not 'menace': a near-black body at low alpha leaves only the white
  // eyes visible, which reads as an artefact rather than a figure.
  ctx.globalAlpha = 0.30 + Math.sin(t * 0.7) * 0.05;
  drawSprite(ctx, 'sketchy', VIEW_W - 190, VIEW_H + 250, 3.0, 'idle');
  ctx.restore();

  centerText(ctx, 'FIVE NIGHTS', VIEW_W / 2, 150, 'bold 74px Georgia, serif', '#c8c0a8');
  centerText(ctx, "AT SKETCHY'S", VIEW_W / 2, 226, 'bold 74px Georgia, serif', '#c8c0a8');
  centerText(ctx, 'a clone, built in vanilla JavaScript', VIEW_W / 2, 268,
    '16px ui-monospace, monospace', P.textDim);

  centerText(ctx, 'SELECT NIGHT', VIEW_W / 2, 392, 'bold 17px ui-monospace, monospace', P.textDim);

  for (const key of Object.keys(NIGHT_BTN)) {
    const r = NIGHT_BTN[key];
    const unlocked = r.night <= save.unlocked;
    const beaten = save.beaten.includes(r.night);
    panel(ctx, r, unlocked, beaten ? '#1e3a2c' : '#22303a');
    centerText(ctx, String(r.night), r.x + r.w / 2, r.y + 50,
      'bold 40px Georgia, serif', unlocked ? '#e8e4d4' : '#3a3a46');
    centerText(ctx, unlocked ? (beaten ? 'CLEARED' : 'NIGHT') : 'LOCKED',
      r.x + r.w / 2, r.y + 74, '11px ui-monospace, monospace',
      unlocked ? (beaten ? '#7fc79f' : P.textDim) : '#33333f');
    if (beaten && save.best[r.night] !== undefined) {
      centerText(ctx, save.best[r.night].toFixed(0) + '% left', r.x + r.w / 2, r.y + 88,
        '10px ui-monospace, monospace', '#5f9f7f');
    }
  }

  for (const key of Object.keys(MENU_BTN)) {
    const r = MENU_BTN[key];
    panel(ctx, r, false);
    const label = key === 'mute' ? (muted ? 'SOUND: OFF' : 'SOUND: ON') : r.label;
    centerText(ctx, label, r.x + r.w / 2, r.y + 22, '12px ui-monospace, monospace', '#9a9aae');
  }

  drawStatic(ctx, 0.035);
  drawScanlines(ctx);
  drawVignette(ctx);
}

export function drawIntro(ctx, night, t) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const fade = Math.min(1, t * 1.6) * Math.min(1, Math.max(0, (2.6 - t) * 2));
  ctx.save();
  ctx.globalAlpha = fade;
  centerText(ctx, 'Night ' + night, VIEW_W / 2, VIEW_H / 2 - 10, 'bold 62px Georgia, serif', '#d8d4c4');
  centerText(ctx, '12 AM', VIEW_W / 2, VIEW_H / 2 + 34, '24px ui-monospace, monospace', P.textDim);
  ctx.restore();
  drawStatic(ctx, 0.03);
  drawScanlines(ctx);
}

// The face has to FILL the frame -- a small figure on a noise field is not a jumpscare.
// The sprite is scaled hard and offset so the head lands dead centre, then lunges.
export function drawJumpscare(ctx, killer, t) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Head sits ~130 units above the feet in figure space; place it at screen centre.
  const HEAD_UP = 130;
  const lunge = 5.0 + t * 3.2 + Math.sin(t * 52) * 0.28;
  const shake = 38 * Math.max(0.25, 1 - t * 0.5);

  ctx.save();
  ctx.translate(
    VIEW_W / 2 + (Math.random() - 0.5) * shake,
    VIEW_H * 0.46 + (Math.random() - 0.5) * shake,
  );
  // Occasional roll, so it never looks like a static image.
  ctx.rotate((Math.random() - 0.5) * 0.05);
  drawSprite(ctx, killer || 'sketchy', 0, HEAD_UP * lunge, lunge, 'scare');
  ctx.restore();

  // Strobing static and a red wash, both pulsing rather than constant.
  drawStatic(ctx, 0.16 + Math.random() * 0.22);
  ctx.fillStyle = 'rgba(150,0,0,' + (0.10 + Math.random() * 0.16).toFixed(3) + ')';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (Math.random() < 0.12) {
    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  drawScanlines(ctx);
  drawVignette(ctx);
}

export function drawGameOver(ctx, night, t) {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const fade = Math.min(1, t * 0.9);
  ctx.save();
  ctx.globalAlpha = fade;
  centerText(ctx, 'GAME OVER', VIEW_W / 2, 250, 'bold 76px Georgia, serif', '#9a2a2a');
  centerText(ctx, 'Night ' + night, VIEW_W / 2, 300, '20px ui-monospace, monospace', P.textDim);
  for (const key of Object.keys(END_BTN)) {
    const r = END_BTN[key];
    panel(ctx, r, true, '#1c1c26');
    centerText(ctx, END_BTN[key].label, r.x + r.w / 2, r.y + 35,
      'bold 15px ui-monospace, monospace', '#c8c4b8');
  }
  ctx.restore();
  drawStatic(ctx, 0.06);
  drawScanlines(ctx);
  drawVignette(ctx);
}

export function drawWin(ctx, night, endPower, t, isLast) {
  ctx.fillStyle = '#07090c';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const fade = Math.min(1, t * 0.9);
  ctx.save();
  ctx.globalAlpha = fade;
  centerText(ctx, '6 AM', VIEW_W / 2, 220, 'bold 96px Georgia, serif', '#e0d8b8');
  centerText(ctx, isLast ? 'You survived the week.' : 'You made it to morning.',
    VIEW_W / 2, 272, '22px ui-monospace, monospace', '#8fa8a0');
  centerText(ctx, 'Night ' + night + '  ·  ' + endPower.toFixed(0) + '% power remaining',
    VIEW_W / 2, 312, '16px ui-monospace, monospace', P.textDim);
  for (const key of Object.keys(END_BTN)) {
    const r = END_BTN[key];
    const label = key === 'retry' ? (isLast ? 'PLAY AGAIN' : 'NEXT NIGHT') : 'MAIN MENU';
    panel(ctx, r, true, '#16261e');
    centerText(ctx, label, r.x + r.w / 2, r.y + 35,
      'bold 15px ui-monospace, monospace', '#c8d4c4');
  }
  ctx.restore();
  drawScanlines(ctx);
  drawVignette(ctx);
}

export function drawBlackoutScreen(ctx, state, panX) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}
