// The office, drawn as a 1920-wide panorama into the 1280 viewport. The pan is the
// "head turn" and does more for the atmosphere than any amount of detail.

import { P } from './palette.js';
import { image } from '../assets/assets.js';
import { drawSprite } from './sprites.js';
import {
  VIEW_W, VIEW_H, DOOR_L, DOOR_R, BTN_L, BTN_R,
} from '../ui/layout.js';

const DOOR_SLIDE = 0.35; // seconds for the panel to travel
const anim = { left: 0, right: 0, fan: 0 };

export function resetOffice() {
  anim.left = 0;
  anim.right = 0;
}

export function updateOffice(dt, state) {
  const step = dt / DOOR_SLIDE;
  anim.left += (state.doors.left ? step : -step);
  anim.right += (state.doors.right ? step : -step);
  anim.left = Math.max(0, Math.min(1, anim.left));
  anim.right = Math.max(0, Math.min(1, anim.right));
  anim.fan += dt * 9;
}

function doorway(ctx, d) {
  ctx.beginPath();
  ctx.moveTo(d.x + 20, d.y + 10);
  ctx.lineTo(d.x + d.w - 20, d.y + 26);
  ctx.lineTo(d.x + d.w - 20, d.y + d.h - 26);
  ctx.lineTo(d.x + 20, d.y + d.h - 10);
  ctx.closePath();
}

function drawLightGlow(ctx, d) {
  ctx.save();
  doorway(ctx, d);
  ctx.clip();
  const g = ctx.createRadialGradient(
    d.x + d.w / 2, d.y + d.h * 0.45, 10,
    d.x + d.w / 2, d.y + d.h * 0.45, d.h * 0.75);
  g.addColorStop(0, 'rgba(255,240,200,0.42)');
  g.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = g;
  ctx.fillRect(d.x, d.y, d.w, d.h);
  ctx.restore();
}

// Whoever is standing at this door right now, or null.
function occupant(state, side) {
  const room = side === 'left' ? 'DOOR_LEFT' : 'DOOR_RIGHT';
  for (const k of ['freddy', 'bonnie', 'chica']) {
    if (state.chars[k].room === room) return k;
  }
  if (side === 'left' && state.chars.foxy.runT !== null) return 'foxy';
  return null;
}

function drawOccupant(ctx, d, who, lit) {
  ctx.save();
  doorway(ctx, d);
  ctx.clip();
  const x = d.x + d.w / 2;
  const y = d.y + d.h - 20;
  const scale = d.h / 300;
  if (!lit) {
    // Barely-there silhouette when the light is off: the shape you half-convince
    // yourself you did not see.
    ctx.globalAlpha = 0.16;
    drawSprite(ctx, who, x, y, scale, 'menace');
  } else {
    drawSprite(ctx, who, x, y, scale, 'menace');
  }
  ctx.restore();
}

function drawDoorPanel(ctx, d, amt) {
  if (amt <= 0.001) return;
  const panel = image('office.doorpanel');
  ctx.save();
  doorway(ctx, d);
  ctx.clip();
  const h = d.h;
  const y = d.y - h * (1 - amt);
  if (panel) ctx.drawImage(panel, d.x + 14, y, d.w - 28, h);
  else { ctx.fillStyle = P.doorPanel; ctx.fillRect(d.x + 14, y, d.w - 28, h); }
  ctx.restore();
}

function drawButtons(ctx, pack, doorOn, lightOn) {
  for (const [key, r] of [['door', pack.door], ['light', pack.light]]) {
    const on = key === 'door' ? doorOn : lightOn;
    ctx.fillStyle = '#1b1b23';
    ctx.beginPath();
    ctx.roundRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12, 8);
    ctx.fill();
    ctx.fillStyle = on ? (key === 'door' ? P.buttonRed : P.buttonOn) : P.buttonOff;
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, 6);
    ctx.fill();
    if (on) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.shadowColor = key === 'door' ? P.buttonRed : P.buttonOn;
      ctx.shadowBlur = 26;
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = on ? '#151519' : '#8a8a98';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(key === 'door' ? 'DOOR' : 'LIGHT', r.x + r.w / 2, r.y + r.h / 2 + 5);
    ctx.textAlign = 'left';
  }
}

function drawFan(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#2a2a34';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#1a1a22';
  ctx.fillRect(-6, 34, 12, 34);
  ctx.fillRect(-20, 66, 40, 8);
  ctx.rotate(anim.fan);
  ctx.fillStyle = 'rgba(140,140,160,0.5)';
  for (let i = 0; i < 3; i++) {
    ctx.rotate((Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.ellipse(0, -20, 9, 20, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#3a3a46';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawOffice(ctx, state, panX, blackoutDim) {
  ctx.save();
  ctx.translate(-panX, 0);

  const wall = image('office.wall');
  if (wall) ctx.drawImage(wall, 0, 0);

  for (const [d, side, amt] of [[DOOR_L, 'left', anim.left], [DOOR_R, 'right', anim.right]]) {
    ctx.fillStyle = P.doorway;
    doorway(ctx, d);
    ctx.fill();

    const lit = side === 'left' ? state.lights.left : state.lights.right;
    if (lit) drawLightGlow(ctx, d);

    const who = occupant(state, side);
    if (who && amt < 0.9) drawOccupant(ctx, d, who, lit);

    drawDoorPanel(ctx, d, amt);

    const frame = image('office.doorframe');
    if (frame) ctx.drawImage(frame, d.x - 20, d.y - 15, d.w + 40, d.h + 30);
  }

  const desk = image('office.desk');
  if (desk) ctx.drawImage(desk, 0, VIEW_H - 300);

  drawFan(ctx, 1180, 470);

  drawButtons(ctx, BTN_L, state.doors.left, state.lights.left);
  drawButtons(ctx, BTN_R, state.doors.right, state.lights.right);

  ctx.restore();

  if (blackoutDim > 0) {
    ctx.fillStyle = 'rgba(0,0,0,' + blackoutDim + ')';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

// Freddy lit in the left doorway during the blackout -- the only thing on screen.
export function drawBlackoutFreddy(ctx, panX, flicker) {
  const d = DOOR_L;
  ctx.save();
  ctx.translate(-panX, 0);
  ctx.save();
  doorway(ctx, d);
  ctx.clip();
  const g = ctx.createRadialGradient(
    d.x + d.w / 2, d.y + d.h * 0.35, 10,
    d.x + d.w / 2, d.y + d.h * 0.35, d.h * 0.6);
  g.addColorStop(0, 'rgba(120,150,255,' + (0.30 * flicker).toFixed(3) + ')');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(d.x, d.y, d.w, d.h);
  ctx.globalAlpha = flicker;
  drawSprite(ctx, 'freddy', d.x + d.w / 2, d.y + d.h - 20, d.h / 250, 'menace');
  ctx.restore();
  ctx.restore();
}

export { anim as officeAnim };
