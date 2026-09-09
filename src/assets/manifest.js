// The swap point for real art. Every entry is currently PROCEDURAL, meaning it is drawn
// in code into an offscreen canvas at load. Because a generated <canvas> and a loaded
// <img> are both valid drawImage sources, dropping in real sprites later is a one-line
// change per entry -- `src: PROCEDURAL` becomes `src: 'art/velvet-idle.png'` -- and no
// call site changes.
//
// Entries are deliberately PER LAYER, not per screen: a single flat "office" image
// could not accommodate the sliding door panel, the spinning fan or the pan.

export const PROCEDURAL = Symbol('procedural');

const FIG_W = 220;
const FIG_H = 264;
const ROOM_W = 960;
const ROOM_H = 540;

function figures() {
  const out = {};
  for (const id of ['freddy', 'velvet', 'chica', 'fexy']) {
    for (const pose of ['idle', 'menace', 'scare']) {
      out['fig.' + id + '.' + pose] = {
        src: PROCEDURAL, gen: 'figure', w: FIG_W, h: FIG_H, args: { id, pose },
      };
    }
  }
  return out;
}

function rooms() {
  const ids = ['CAM1A', 'CAM1B', 'CAM1C', 'CAM2A', 'CAM2B', 'CAM3',
    'CAM4A', 'CAM4B', 'CAM5', 'CAM6', 'CAM7'];
  const out = {};
  for (const id of ids) {
    out['room.' + id] = { src: PROCEDURAL, gen: 'room', w: ROOM_W, h: ROOM_H, args: { id } };
  }
  return out;
}

export const MANIFEST = {
  'office.wall': { src: PROCEDURAL, gen: 'officeWall', w: 1920, h: 720 },
  'office.desk': { src: PROCEDURAL, gen: 'officeDesk', w: 1920, h: 300 },
  'office.doorframe': { src: PROCEDURAL, gen: 'doorFrame', w: 340, h: 480 },
  'office.doorpanel': { src: PROCEDURAL, gen: 'doorPanel', w: 300, h: 450 },
  ...figures(),
  ...rooms(),
};

export const FIGURE_SIZE = { w: FIG_W, h: FIG_H, footX: FIG_W / 2, footY: FIG_H - 32 };
export const ROOM_SIZE = { w: ROOM_W, h: ROOM_H };
