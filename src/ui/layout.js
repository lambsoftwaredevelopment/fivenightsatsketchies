// Pure geometry. Both the renderer and the input layer read these rects, so what is
// drawn and what is clickable can never drift apart.

export const VIEW_W = 1280;
export const VIEW_H = 720;

// The office is drawn as a panorama wider than the viewport; panning across it is the
// "head turn" that does most of the work of making the office feel like a place.
export const PANO_W = 1920;
export const PAN_MAX = PANO_W - VIEW_W; // 640
export const PAN_EDGE = 240;            // mouse zone at each edge that drives the pan
export const PAN_SPEED = 900;           // px/s at full deflection

// Panorama-space geometry.
export const DOOR_L = { x: 150, y: 170, w: 300, h: 450 };
export const DOOR_R = { x: 1470, y: 170, w: 300, h: 450 };

export const BTN_L = {
  door: { x: 40, y: 300, w: 70, h: 76 },
  light: { x: 40, y: 388, w: 70, h: 76 },
};
export const BTN_R = {
  door: { x: 1810, y: 300, w: 70, h: 76 },
  light: { x: 1810, y: 388, w: 70, h: 76 },
};

// Screen-space UI.
export const CAM_TAB = { x: 500, y: 686, w: 280, h: 30 };
export const CAM_PANEL = { x: 820, y: 380, w: 440, h: 320 };

// Floorplan, in CAM_PANEL-local coordinates. One table drives both the drawing and the
// click hit-testing.
export const CAM_MAP = {
  CAM1A: { x: 20, y: 24, w: 112, h: 48, label: 'SHOW STAGE' },
  CAM5: { x: 20, y: 80, w: 92, h: 42, label: 'BACKSTAGE' },
  CAM1B: { x: 146, y: 24, w: 122, h: 72, label: 'DINING AREA' },
  CAM1C: { x: 20, y: 130, w: 112, h: 46, label: 'PIRATE COVE' },
  CAM7: { x: 302, y: 24, w: 112, h: 46, label: 'RESTROOMS' },
  CAM6: { x: 302, y: 78, w: 112, h: 46, label: 'KITCHEN' },
  CAM2A: { x: 150, y: 112, w: 52, h: 92, label: 'W HALL' },
  CAM2B: { x: 150, y: 212, w: 52, h: 46, label: 'W CORNER' },
  CAM3: { x: 86, y: 190, w: 56, h: 46, label: 'SUPPLY' },
  CAM4A: { x: 248, y: 112, w: 52, h: 92, label: 'E HALL' },
  CAM4B: { x: 248, y: 212, w: 52, h: 46, label: 'E CORNER' },
};

export const OFFICE_MARKER = { x: 204, y: 266, w: 42, h: 40, label: 'YOU' };

export function inRect(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Returns the id of the first rect in `table` containing the point, or null.
export function hitTest(table, x, y, ox, oy) {
  const dx = ox || 0;
  const dy = oy || 0;
  for (const id of Object.keys(table)) {
    const r = table[id];
    if (inRect({ x: r.x + dx, y: r.y + dy, w: r.w, h: r.h }, x, y)) return id;
  }
  return null;
}

// Screen x of a panorama-space x, given the current pan.
export function toScreen(px, panX) {
  return px - panX;
}

// --- Menu and end-screen buttons (screen space) ------------------------------
export const NIGHT_BTN = {};
for (let n = 1; n <= 5; n++) {
  NIGHT_BTN['night' + n] = { x: 250 + (n - 1) * 160, y: 420, w: 140, h: 92, night: n };
}

export const MENU_BTN = {
  mute: { x: 40, y: 660, w: 120, h: 34, label: 'SOUND' },
  reset: { x: 176, y: 660, w: 168, h: 34, label: 'RESET PROGRESS' },
};

export const END_BTN = {
  retry: { x: 420, y: 470, w: 200, h: 56, label: 'TRY AGAIN' },
  menu: { x: 660, y: 470, w: 200, h: 56, label: 'MAIN MENU' },
};
