// Draws figures from their cached manifest canvases rather than re-running the vector
// code every frame. This is also what makes the asset indirection real: swap a manifest
// entry to a PNG path and these call sites are unchanged.
//
// Lives in its own module so procedural.js can import figures.js without a cycle
// (assets -> procedural -> figures, and sprites -> assets + figures).

import { image } from '../assets/assets.js';
import { FIGURE_SIZE } from '../assets/manifest.js';
import { drawFigure } from './figures.js';

export function drawSprite(ctx, id, x, y, scale, pose) {
  const src = image('fig.' + id + '.' + (pose || 'idle'));
  if (!src) {
    drawFigure(ctx, id, x, y, scale, pose); // pre-load fallback
    return;
  }
  ctx.drawImage(
    src,
    x - FIGURE_SIZE.footX * scale,
    y - FIGURE_SIZE.footY * scale,
    FIGURE_SIZE.w * scale,
    FIGURE_SIZE.h * scale,
  );
}
