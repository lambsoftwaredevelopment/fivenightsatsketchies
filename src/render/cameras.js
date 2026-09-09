// Camera feeds. Each room's static geometry is a cached plate from the asset layer, so
// a frame costs one blit plus figures plus the overlay pass.

import { P } from './palette.js';
import { image } from '../assets/assets.js';
import { drawSprite } from './sprites.js';
import { drawStatic, drawScanlines, drawVignette, drawRefreshBand } from './fx.js';
import { ROOMS, AUDIO_ONLY } from '../sim/map.js';
import {
  VIEW_W, VIEW_H, CAM_PANEL, CAM_MAP, OFFICE_MARKER, CAM_TAB,
} from '../ui/layout.js';

// Where a figure stands in a room feed, and how big -- hand-placed so nobody floats and
// nobody ends up behind the camera map panel, which covers the right third of the screen.
const SPOT = {
  CAM1A: [[0.30, 0.60, 0.95], [0.44, 0.60, 0.95], [0.58, 0.60, 0.95]],
  CAM1B: [[0.22, 0.86, 1.15], [0.40, 0.82, 1.05], [0.58, 0.88, 1.2]],
  CAM2A: [[0.42, 0.92, 1.3]],
  CAM2B: [[0.42, 0.95, 1.5]],
  CAM3: [[0.44, 0.90, 1.25]],
  CAM4A: [[0.42, 0.92, 1.3]],
  CAM4B: [[0.42, 0.95, 1.5]],
  CAM5: [[0.40, 0.90, 1.2]],
  CAM7: [[0.28, 0.88, 1.1], [0.48, 0.88, 1.1]],
};

function occupants(state, roomId) {
  const out = [];
  for (const k of ['freddy', 'bonnie', 'chica']) {
    if (state.chars[k].room === roomId) out.push(k);
  }
  return out;
}

function drawFoxyCove(ctx, state, w, h) {
  const f = state.chars.foxy;
  if (f.stage === 0) return; // curtain closed, nothing to see
  ctx.save();
  if (f.stage >= 3 || f.runT !== null) {
    // Gone. The curtain hangs open and the cove is empty -- the worst thing to see.
    ctx.fillStyle = '#05050a';
    ctx.fillRect(w * 0.3, h * 0.12, w * 0.4, h * 0.58);
    ctx.restore();
    return;
  }
  const peek = f.stage === 1;
  ctx.beginPath();
  ctx.rect(w * (peek ? 0.42 : 0.34), h * 0.12, w * (peek ? 0.16 : 0.32), h * 0.62);
  ctx.clip();
  ctx.fillStyle = '#05050a';
  ctx.fillRect(w * 0.3, h * 0.12, w * 0.4, h * 0.6);
  drawSprite(ctx, 'foxy', w * 0.5, h * 0.80, h / 380, 'idle');
  ctx.restore();
}

// The feed itself, scaled from the cached plate to fill the screen.
export function drawFeed(ctx, state, roomId, t, flipT) {
  const plate = image('room.' + roomId);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const yOff = flipT > 0 ? flipT * 120 : 0;
  ctx.save();
  ctx.translate(0, yOff);
  if (plate) ctx.drawImage(plate, 0, 0, VIEW_W, VIEW_H);

  if (!AUDIO_ONLY.has(roomId)) {
    const spots = SPOT[roomId] || [[0.5, 0.9, 1.2]];
    const here = occupants(state, roomId);
    here.forEach((who, i) => {
      const s = spots[i % spots.length];
      drawSprite(ctx, who, VIEW_W * s[0], VIEW_H * s[1], s[2] * 0.9, 'idle');
    });
    if (roomId === 'CAM1C') drawFoxyCove(ctx, state, VIEW_W, VIEW_H);
  }
  ctx.restore();

  // Overlay pass: tint, static, scanlines, then the labels.
  ctx.fillStyle = P.camTint;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawStatic(ctx, AUDIO_ONLY.has(roomId) ? 0.35 : 0.07 + flipT * 0.5);
  drawRefreshBand(ctx);
  drawScanlines(ctx);
  drawVignette(ctx);

  ctx.fillStyle = P.text;
  ctx.font = 'bold 30px ui-monospace, Menlo, monospace';
  ctx.fillText(roomId.replace('CAM', 'CAM '), 44, 62);
  ctx.font = '18px ui-monospace, Menlo, monospace';
  ctx.fillStyle = P.textDim;
  ctx.fillText((ROOMS[roomId] || '').toUpperCase(), 44, 88);

  // 1Hz blinking REC dot, kept clear of the clock in the opposite corner.
  if ((t % 1) < 0.5) {
    ctx.fillStyle = P.rec;
    ctx.beginPath();
    ctx.arc(52, 116, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 15px ui-monospace, monospace';
    ctx.fillText('REC', 68, 122);
  }
}

export function drawCamMap(ctx, state) {
  const p = CAM_PANEL;
  ctx.save();
  ctx.fillStyle = 'rgba(6,10,12,0.86)';
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = P.mapLine;
  ctx.lineWidth = 1;
  ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);

  ctx.font = '10px ui-monospace, Menlo, monospace';
  for (const id of Object.keys(CAM_MAP)) {
    const r = CAM_MAP[id];
    const x = p.x + r.x;
    const y = p.y + r.y;
    const sel = state.cams.id === id;
    ctx.fillStyle = sel ? P.mapSel : P.mapFill;
    ctx.fillRect(x, y, r.w, r.h);
    ctx.strokeStyle = sel ? '#7fe4f2' : P.mapLine;
    ctx.strokeRect(x + 0.5, y + 0.5, r.w - 1, r.h - 1);
    ctx.fillStyle = sel ? '#dffbff' : '#6f9aa2';
    ctx.fillText(id, x + 5, y + 13);
    ctx.fillStyle = sel ? '#9fd8e2' : '#4d7078';
    ctx.fillText(r.label, x + 5, y + 25);
  }

  const o = OFFICE_MARKER;
  ctx.fillStyle = 'rgba(200,80,60,0.25)';
  ctx.fillRect(p.x + o.x, p.y + o.y, o.w, o.h);
  ctx.strokeStyle = '#a8503c';
  ctx.strokeRect(p.x + o.x + 0.5, p.y + o.y + 0.5, o.w - 1, o.h - 1);
  ctx.fillStyle = '#e0a090';
  ctx.fillText(o.label, p.x + o.x + 10, p.y + o.y + 24);
  ctx.restore();
}

export function drawCamTab(ctx, up) {
  const r = CAM_TAB;
  ctx.save();
  ctx.globalAlpha = up ? 0.9 : 0.55;
  ctx.fillStyle = '#14141c';
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, 6);
  ctx.fill();
  ctx.strokeStyle = '#3a3a48';
  ctx.stroke();
  ctx.fillStyle = '#9a9aa8';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(up ? 'CLOSE CAMERAS  [SPACE]' : 'CAMERAS  [SPACE]', r.x + r.w / 2, r.y + 20);
  ctx.textAlign = 'left';
  ctx.restore();
}
