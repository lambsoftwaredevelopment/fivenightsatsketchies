// The four silhouettes. They are normally seen dark and low-contrast down a hallway, so
// each gets exactly ONE unmistakable shape cue rather than fine detail:
//   Sketchy -- top hat and bow tie. Fexy   -- pointed muzzle, eyepatch, hook.
// Drawn in a unit space 200 tall with the origin at the feet, then scaled by the caller.

import { FIG } from './palette.js';

// roundRect is recent; keep the art working on older engines.
if (typeof CanvasRenderingContext2D !== 'undefined' &&
    !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const k = Math.min(r, w / 2, h / 2);
    this.moveTo(x + k, y);
    this.arcTo(x + w, y, x + w, y + h, k);
    this.arcTo(x + w, y + h, x, y + h, k);
    this.arcTo(x, y + h, x, y, k);
    this.arcTo(x, y, x + w, y, k);
    this.closePath();
    return this;
  };
}

function eyes(ctx, x, y, r, pose, accent) {
  const glow = pose === 'menace' || pose === 'scare';
  ctx.fillStyle = glow ? '#fff' : '#e8e8d0';
  ctx.beginPath();
  ctx.arc(x - r * 1.6, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 1.6, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (!glow) {
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(x - r * 1.6, y, r * 0.45, 0, Math.PI * 2);
    ctx.arc(x + r * 1.6, y, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(x - r * 1.6, y, r * 0.3, 0, Math.PI * 2);
    ctx.arc(x + r * 1.6, y, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function teeth(ctx, x, y, w, n) {
  ctx.fillStyle = '#e8e4d0';
  const tw = w / n;
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + i * tw, y);
    ctx.lineTo(x - w / 2 + (i + 0.5) * tw, y + tw * 1.1);
    ctx.lineTo(x - w / 2 + (i + 1) * tw, y);
    ctx.closePath();
    ctx.fill();
  }
}

function velvet(ctx, pose) {
  const c = FIG.velvet;
  const dark = pose === 'menace';
  ctx.fillStyle = dark ? '#15121f' : c.body;
  // ears -- the whole point of their silhouette
  ctx.fillRect(-29, -214, 18, 94);
  ctx.fillRect(11, -214, 18, 94);
  ctx.fillStyle = dark ? '#221c33' : c.dark;
  ctx.fillRect(-25, -207, 10, 78);
  ctx.fillRect(15, -207, 10, 78);
  // head + narrow body
  ctx.fillStyle = dark ? '#15121f' : c.body;
  ctx.beginPath();
  ctx.roundRect(-30, -132, 60, 54, 12);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-34, -84, 68, 62, 10);
  ctx.fill();
  ctx.fillRect(-30, -24, 22, 24);
  ctx.fillRect(8, -24, 22, 24);
  ctx.fillStyle = c.accent;
  ctx.fillRect(-12, -80, 24, 9); // bow tie
  eyes(ctx, 0, -112, 6.5, pose, '#c04a6a');
  if (pose === 'scare') teeth(ctx, 0, -96, 34, 6);
}

function sketchy(ctx, pose) {
  const c = FIG.sketchy;
  const dark = pose === 'menace';
  ctx.fillStyle = dark ? '#17110c' : c.body;
  // broadest of the four
  ctx.beginPath();
  ctx.roundRect(-46, -94, 92, 72, 14);
  ctx.fill();
  ctx.fillRect(-40, -24, 28, 24);
  ctx.fillRect(12, -24, 28, 24);
  ctx.beginPath();
  ctx.arc(0, -126, 36, 0, Math.PI * 2);
  ctx.fill();
  // small round ears
  ctx.beginPath();
  ctx.arc(-30, -154, 12, 0, Math.PI * 2);
  ctx.arc(30, -154, 12, 0, Math.PI * 2);
  ctx.fill();
  // muzzle
  ctx.fillStyle = dark ? '#241a12' : c.dark;
  ctx.beginPath();
  ctx.ellipse(0, -108, 22, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#14100c';
  ctx.beginPath();
  ctx.ellipse(0, -116, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // top hat -- their cue
  ctx.fillStyle = c.accent;
  ctx.beginPath();
  ctx.ellipse(0, -158, 40, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-22, -196, 44, 40);
  ctx.fillRect(-22, -166, 44, 7);
  ctx.fillRect(-12, -84, 24, 9); // bow tie
  eyes(ctx, 0, -134, 6.5, pose, '#7ad0e0');
  if (pose === 'scare') teeth(ctx, 0, -104, 36, 6);
}

function fexy(ctx, pose) {
  const c = FIG.fexy;
  const dark = pose === 'menace';
  ctx.fillStyle = dark ? '#1d0e0c' : c.body;
  // lean frame
  ctx.beginPath();
  ctx.roundRect(-28, -96, 56, 74, 10);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -126, 28, 0, Math.PI * 2);
  ctx.fill();
  // pointed muzzle
  ctx.beginPath();
  ctx.moveTo(-6, -134);
  ctx.lineTo(-56, -112);
  ctx.lineTo(-6, -104);
  ctx.closePath();
  ctx.fill();
  // ears
  ctx.beginPath();
  ctx.moveTo(-22, -146);
  ctx.lineTo(-16, -172);
  ctx.lineTo(-6, -148);
  ctx.closePath();
  ctx.moveTo(22, -146);
  ctx.lineTo(16, -172);
  ctx.lineTo(6, -148);
  ctx.closePath();
  ctx.fill();
  // torn legs -- endoskeleton showing through
  ctx.fillStyle = c.accent;
  ctx.fillRect(-20, -24, 8, 24);
  ctx.fillRect(12, -24, 8, 24);
  ctx.fillStyle = dark ? '#1d0e0c' : c.body;
  ctx.fillRect(-24, -26, 16, 12);
  ctx.fillRect(8, -26, 16, 12);
  // eyepatch and hook
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(2, -138, 20, 12);
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(38, -44, 13, Math.PI * 0.6, Math.PI * 1.9);
  ctx.stroke();
  ctx.fillStyle = '#e8e8d0';
  ctx.beginPath();
  ctx.arc(-12, -132, 5.5, 0, Math.PI * 2);
  ctx.fill();
  if (pose !== 'idle') {
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-12, -132, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (pose === 'scare') teeth(ctx, -20, -112, 34, 7);
}

const DRAW = { sketchy, velvet, fexy };

export function drawFigure(ctx, id, x, y, scale, pose) {
  const fn = DRAW[id];
  if (!fn) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  fn(ctx, pose || 'idle');
  ctx.restore();
}

export const FIGURE_IDS = Object.keys(DRAW);
