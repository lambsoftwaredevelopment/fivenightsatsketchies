// Generators that produce offscreen canvases for the manifest. Everything here runs
// once at load, so it can afford to be detailed -- the frame loop only ever blits.

import { P } from '../render/palette.js';
import { drawFigure } from '../render/figures.js';
import { FIGURE_SIZE } from './manifest.js';
import { ROOMS, AUDIO_ONLY } from '../sim/map.js';

function noiseSpeckle(ctx, w, h, n, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? '#000' : '#fff';
    ctx.fillRect((Math.random() * w) | 0, (Math.random() * h) | 0, 1, 1);
  }
  ctx.restore();
}

// --- Office layers ----------------------------------------------------------

function officeWall(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, P.wallTop);
  g.addColorStop(1, P.wallBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // horizontal trim, and a floor band at the bottom
  ctx.fillStyle = P.wallTrim;
  ctx.fillRect(0, 150, w, 4);
  ctx.fillRect(0, 618, w, 6);
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 624, w, h - 624);

  // children's drawings taped to the wall, in the two flat stretches
  const spots = [520, 610, 700, 1180, 1270, 1360];
  for (let i = 0; i < spots.length; i++) {
    const x = spots[i];
    const y = 210 + (i % 3) * 14;
    ctx.fillStyle = '#c8c4b0';
    ctx.globalAlpha = 0.18;
    ctx.fillRect(x, y, 62, 78);
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = ['#8a7a4a', '#7a5a6a', '#5a7a6a'][i % 3];
    ctx.fillRect(x + 8, y + 10, 46, 30);
    ctx.fillStyle = '#3a3a44';
    ctx.fillRect(x + 8, y + 48, 46, 4);
    ctx.fillRect(x + 8, y + 58, 32, 4);
    ctx.globalAlpha = 1;
  }

  // "CELEBRATE!" banner over the middle of the room
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#8a2a3a';
  ctx.fillRect(830, 176, 260, 54);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#e8d8a0';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CELEBRATE!', 960, 212);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';

  noiseSpeckle(ctx, w, h, 5000, 0.05);
}

function officeDesk(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  // desk silhouette across the whole panorama
  ctx.fillStyle = P.desk;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, 120);
  ctx.lineTo(240, 104);
  ctx.lineTo(760, 82);
  ctx.lineTo(1160, 82);
  ctx.lineTo(1680, 104);
  ctx.lineTo(w, 120);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  // A lit top edge is what makes the desk read as a surface rather than a shadow.
  ctx.strokeStyle = '#33333f';
  ctx.lineWidth = 3;
  ctx.stroke();
  const lip = ctx.createLinearGradient(0, 82, 0, 150);
  lip.addColorStop(0, 'rgba(120,120,145,0.28)');
  lip.addColorStop(1, 'rgba(120,120,145,0)');
  ctx.fillStyle = lip;
  ctx.beginPath();
  ctx.moveTo(0, 120);
  ctx.lineTo(240, 104);
  ctx.lineTo(760, 82);
  ctx.lineTo(1160, 82);
  ctx.lineTo(1680, 104);
  ctx.lineTo(w, 120);
  ctx.lineTo(w, 168);
  ctx.lineTo(0, 168);
  ctx.closePath();
  ctx.fill();

  // monitor, clutter, a mug
  ctx.fillStyle = '#12121a';
  ctx.fillRect(820, 20, 190, 88);
  ctx.fillStyle = '#1c2430';
  ctx.fillRect(828, 28, 174, 72);
  ctx.fillStyle = '#0e0e14';
  ctx.fillRect(890, 108, 50, 12);
  ctx.fillStyle = '#1a1a24';
  ctx.fillRect(1060, 78, 46, 30);
  ctx.fillRect(700, 86, 70, 22);
  ctx.beginPath();
  ctx.arc(660, 96, 14, 0, Math.PI * 2);
  ctx.fill();
}

function doorFrame(ctx, w, h) {
  // The opening stays TRANSPARENT -- this plate is drawn on top of the doorway, the
  // light glow and whoever is standing in it, so anything opaque here erases them.
  ctx.clearRect(0, 0, w, h);

  // hatched steel frame bars
  ctx.fillStyle = P.frame;
  ctx.fillRect(0, 0, 22, h);
  ctx.fillRect(w - 22, 14, 22, h - 28);
  ctx.fillStyle = P.frameLit;
  for (let y = 6; y < h; y += 16) {
    ctx.fillRect(3, y, 16, 5);
    ctx.fillRect(w - 19, y + 8, 16, 5);
  }
  ctx.fillStyle = P.frame;
  ctx.fillRect(0, 0, w, 14);
  ctx.fillRect(0, h - 14, w, 14);
}

function doorPanel(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, '#33333d');
  g.addColorStop(0.5, P.doorPanel);
  g.addColorStop(1, '#2b2b34');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = P.doorRivet;
  for (let y = 24; y < h; y += 46) {
    for (let x = 22; x < w; x += 46) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#1a1a22';
  ctx.fillRect(0, h - 12, w, 12);
  ctx.fillRect(0, 0, w, 8);
}

// --- Figures ----------------------------------------------------------------

function figure(ctx, w, h, args) {
  ctx.clearRect(0, 0, w, h);
  drawFigure(ctx, args.id, FIGURE_SIZE.footX, FIGURE_SIZE.footY, 1, args.pose);
}

// --- Camera rooms -----------------------------------------------------------

function roomShell(ctx, w, h, floorCol, wallCol) {
  ctx.fillStyle = wallCol;
  ctx.fillRect(0, 0, w, h);
  // perspective floor
  ctx.fillStyle = floorCol;
  ctx.beginPath();
  ctx.moveTo(-40, h);
  ctx.lineTo(w * 0.22, h * 0.56);
  ctx.lineTo(w * 0.78, h * 0.56);
  ctx.lineTo(w + 40, h);
  ctx.closePath();
  ctx.fill();
  // floor tile lines, converging
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 2;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(w / 2 + i * (w / 6), h);
    ctx.lineTo(w / 2 + i * 40, h * 0.56);
    ctx.stroke();
  }
  // wall banding
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  ctx.fillRect(0, h * 0.5, w, 6);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, w, h * 0.16);
}

function hallway(ctx, w, h, mirrored) {
  roomShell(ctx, w, h, '#14141a', '#0d0d13');
  // receding wall panels to sell depth
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let i = 0; i < 4; i++) {
    const t = i / 4;
    const x = mirrored ? w * (0.06 + t * 0.18) : w * (0.94 - t * 0.18);
    const wd = 30 - i * 5;
    const hh = h * (0.42 - t * 0.07);
    ctx.fillRect(x - wd / 2, h * 0.28 + t * h * 0.06, wd, hh);
  }
  // doorway at the far end
  ctx.fillStyle = '#05050a';
  ctx.fillRect(w * 0.44, h * 0.34, w * 0.12, h * 0.24);
}

function room(ctx, w, h, args) {
  const id = args.id;

  if (AUDIO_ONLY.has(id)) {
    // Kitchen: the camera is broken. Pure static, which is why she is only ever a sound.
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);
    noiseSpeckle(ctx, w, h, 60000, 0.55);
    ctx.fillStyle = 'rgba(200,200,200,0.5)';
    ctx.font = 'bold 30px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AUDIO ONLY', w / 2, h / 2);
    ctx.textAlign = 'left';
    return;
  }

  switch (id) {
    case 'CAM1A': { // Show Stage
      roomShell(ctx, w, h, '#181420', '#100c16');
      ctx.fillStyle = '#241832';
      ctx.fillRect(w * 0.16, h * 0.46, w * 0.68, h * 0.14);
      // curtain backdrop
      ctx.fillStyle = '#2e1830';
      for (let x = w * 0.16; x < w * 0.84; x += 26) {
        ctx.fillRect(x, h * 0.12, 16, h * 0.34);
      }
      // three spotlight cones
      for (const cx of [0.32, 0.5, 0.68]) {
        const g = ctx.createLinearGradient(w * cx, h * 0.08, w * cx, h * 0.6);
        g.addColorStop(0, 'rgba(255,240,190,0.16)');
        g.addColorStop(1, 'rgba(255,240,190,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(w * cx - 12, h * 0.08);
        ctx.lineTo(w * cx - 90, h * 0.6);
        ctx.lineTo(w * cx + 90, h * 0.6);
        ctx.lineTo(w * cx + 12, h * 0.08);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'CAM1B': { // Dining Area
      roomShell(ctx, w, h, '#15151c', '#0c0c12');
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 2;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          const cx = w * (0.18 + c * 0.21);
          const cy = h * (0.64 + r * 0.13);
          const rw = 44 + r * 16;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rw, rw * 0.36, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      break;
    }
    case 'CAM1C': { // Pirate Cove
      roomShell(ctx, w, h, '#141018', '#0b0810');
      // purple striped curtain, drawn closed; Foxy's stage is layered on at draw time
      ctx.fillStyle = '#3a1f52';
      ctx.fillRect(w * 0.2, h * 0.1, w * 0.6, h * 0.62);
      ctx.fillStyle = '#4a2a66';
      for (let x = w * 0.2; x < w * 0.8; x += 34) ctx.fillRect(x, h * 0.1, 17, h * 0.62);
      ctx.fillStyle = '#d8d0b0';
      ctx.fillRect(w * 0.36, h * 0.74, w * 0.28, h * 0.09);
      ctx.fillStyle = '#201810';
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('OUT OF ORDER', w * 0.5, h * 0.80);
      ctx.textAlign = 'left';
      break;
    }
    case 'CAM2A': hallway(ctx, w, h, false); break;
    case 'CAM2B':
      hallway(ctx, w, h, false);
      ctx.fillStyle = 'rgba(255,240,200,0.05)';
      ctx.fillRect(w * 0.3, h * 0.2, w * 0.4, h * 0.6);
      break;
    case 'CAM4A': hallway(ctx, w, h, true); break;
    case 'CAM4B':
      hallway(ctx, w, h, true);
      ctx.fillStyle = 'rgba(255,240,200,0.05)';
      ctx.fillRect(w * 0.3, h * 0.2, w * 0.4, h * 0.6);
      break;
    case 'CAM3': { // Supply Closet -- tight and shallow
      ctx.fillStyle = '#0c0c11';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#16161e';
      ctx.fillRect(w * 0.2, h * 0.14, w * 0.6, h * 0.72);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 4; i++) ctx.fillRect(w * 0.22, h * (0.22 + i * 0.16), w * 0.56, 8);
      break;
    }
    case 'CAM5': { // Backstage -- spare heads on the bench
      roomShell(ctx, w, h, '#131319', '#0b0b10');
      ctx.fillStyle = '#1a1a22';
      ctx.fillRect(w * 0.12, h * 0.58, w * 0.76, 14);
      for (let i = 0; i < 4; i++) {
        const cx = w * (0.22 + i * 0.19);
        ctx.fillStyle = '#2a2028';
        ctx.beginPath();
        ctx.arc(cx, h * 0.5, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0a0a0c';
        ctx.beginPath();
        ctx.arc(cx - 9, h * 0.48, 5, 0, Math.PI * 2);
        ctx.arc(cx + 9, h * 0.48, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'CAM7': { // Restrooms
      roomShell(ctx, w, h, '#14161a', '#0c0e11');
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(w * 0.16, h * 0.2, w * 0.2, h * 0.34);
      ctx.fillRect(w * 0.64, h * 0.2, w * 0.2, h * 0.34);
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RESTROOMS', w * 0.5, h * 0.16);
      ctx.textAlign = 'left';
      break;
    }
    default:
      roomShell(ctx, w, h, '#14141a', '#0c0c12');
  }

  // A faint room label baked into the plate.
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.font = '16px ui-monospace, monospace';
  ctx.fillText(ROOMS[id] || id, 18, h - 18);
  noiseSpeckle(ctx, w, h, 3000, 0.06);
}

export const GENERATORS = {
  officeWall, officeDesk, doorFrame, doorPanel, figure, room,
};
