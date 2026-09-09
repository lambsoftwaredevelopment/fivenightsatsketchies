// CRT effects. Everything expensive is pre-rendered once into offscreen canvases at
// load; the per-frame cost is a handful of drawImage calls and never per-pixel work.

import { VIEW_W, VIEW_H } from '../ui/layout.js';

const NOISE_TILES = 8;
const TILE = 256;

let noise = [];
let scanlines = null;
let vignette = null;
let band = null;
let frame = 0;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function initFx() {
  noise = [];
  for (let i = 0; i < NOISE_TILES; i++) {
    const c = makeCanvas(TILE, TILE);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(TILE, TILE);
    const d = img.data;
    for (let p = 0; p < d.length; p += 4) {
      const v = (Math.random() * 255) | 0;
      d[p] = v; d[p + 1] = v; d[p + 2] = v; d[p + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    noise.push(c);
  }

  scanlines = makeCanvas(VIEW_W, VIEW_H + 4);
  const s = scanlines.getContext('2d');
  s.fillStyle = 'rgba(0,0,0,0.15)';
  for (let y = 0; y < VIEW_H + 4; y += 3) s.fillRect(0, y, VIEW_W, 1);

  vignette = makeCanvas(VIEW_W, VIEW_H);
  const v = vignette.getContext('2d');
  const g = v.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.25,
    VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.72)');
  v.fillStyle = g;
  v.fillRect(0, 0, VIEW_W, VIEW_H);

  band = makeCanvas(VIEW_W, 60);
  const b = band.getContext('2d');
  const bg = b.createLinearGradient(0, 0, 0, 60);
  bg.addColorStop(0, 'rgba(255,255,255,0)');
  bg.addColorStop(0.5, 'rgba(255,255,255,0.9)');
  bg.addColorStop(1, 'rgba(255,255,255,0)');
  b.fillStyle = bg;
  b.fillRect(0, 0, VIEW_W, 60);
}

export function tickFx() {
  frame++;
}

// Tiled noise at a random offset. 15 draws, no per-pixel work.
export function drawStatic(ctx, alpha, w, h) {
  if (!noise.length) return;
  const W = w || VIEW_W;
  const H = h || VIEW_H;
  const tile = noise[frame % NOISE_TILES];
  ctx.save();
  ctx.globalAlpha = alpha;
  const ox = -((Math.random() * TILE) | 0);
  const oy = -((Math.random() * TILE) | 0);
  for (let x = ox; x < W; x += TILE) {
    for (let y = oy; y < H; y += TILE) ctx.drawImage(tile, x, y);
  }
  ctx.restore();
}

export function drawScanlines(ctx) {
  if (!scanlines) return;
  const off = -((frame * 0.3) % 3);
  ctx.drawImage(scanlines, 0, off);
}

export function drawVignette(ctx) {
  if (vignette) ctx.drawImage(vignette, 0, 0);
}

// A slow bright band drifting down the screen -- the cheapest possible "this is a CRT".
export function drawRefreshBand(ctx) {
  if (!band) return;
  const y = ((frame * 1.4) % (VIEW_H + 120)) - 60;
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.drawImage(band, 0, y);
  ctx.restore();
}

export function drawFlicker(ctx, strength) {
  ctx.save();
  ctx.globalAlpha = strength * (0.3 + Math.random() * 0.7);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
}
