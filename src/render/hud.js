// Power bar, usage pips, clock, night label. Deliberately plain and always legible --
// the player checks these under pressure.

import { P } from './palette.js';
import { VIEW_W } from '../ui/layout.js';
import { HOURS, SECONDS_PER_HOUR } from '../sim/constants.js';

function barColor(power) {
  if (power <= 15) return P.hudBarCrit;
  if (power <= 35) return P.hudBarLow;
  return P.hudBar;
}

export function drawHud(ctx, state) {
  ctx.save();
  ctx.font = '15px ui-monospace, Menlo, monospace';

  // --- Power, bottom-left
  ctx.fillStyle = P.textDim;
  ctx.fillText('POWER LEFT:', 40, 630);
  ctx.fillStyle = barColor(state.power);
  ctx.font = 'bold 21px ui-monospace, Menlo, monospace';
  ctx.fillText(Math.max(0, state.power).toFixed(0) + '%', 168, 632);

  const bw = 190;
  ctx.fillStyle = '#1a1a22';
  ctx.fillRect(40, 642, bw, 12);
  ctx.fillStyle = barColor(state.power);
  ctx.fillRect(40, 642, bw * Math.max(0, Math.min(1, state.power / 100)), 12);

  // --- Usage pips
  ctx.font = '15px ui-monospace, Menlo, monospace';
  ctx.fillStyle = P.textDim;
  ctx.fillText('USAGE:', 40, 686);
  for (let i = 0; i < 5; i++) {
    const on = i < state.usage;
    ctx.fillStyle = on
      ? (state.usage >= 4 ? P.hudBarCrit : state.usage === 3 ? P.hudBarLow : P.hudBar)
      : '#1e1e26';
    ctx.fillRect(110 + i * 20, 672, 15, 18);
  }

  // --- Clock, top-right
  ctx.textAlign = 'right';
  ctx.fillStyle = P.text;
  ctx.font = 'bold 40px Georgia, serif';
  const h = state.hour === 0 ? 12 : state.hour;
  ctx.fillText(h + ' AM', VIEW_W - 40, 74);
  ctx.font = '16px ui-monospace, Menlo, monospace';
  ctx.fillStyle = P.textDim;
  ctx.fillText('Night ' + state.night, VIEW_W - 40, 100);

  // A thin progress line for the hour, so the clock feels like it is moving.
  const frac = (state.t % SECONDS_PER_HOUR) / SECONDS_PER_HOUR;
  ctx.fillStyle = '#1e1e26';
  ctx.fillRect(VIEW_W - 160, 112, 120, 4);
  ctx.fillStyle = P.textDim;
  ctx.fillRect(VIEW_W - 160, 112, 120 * frac, 4);
  ctx.textAlign = 'left';

  ctx.restore();
}

export function drawControlHint(ctx) {
  ctx.save();
  ctx.font = '12px ui-monospace, Menlo, monospace';
  ctx.fillStyle = 'rgba(150,150,170,0.45)';
  ctx.textAlign = 'center';
  ctx.fillText('A / D doors     Q / E lights     SPACE cameras     move mouse to edges to look around',
    640, 668);
  ctx.textAlign = 'left';
  ctx.restore();
}

export { HOURS };
