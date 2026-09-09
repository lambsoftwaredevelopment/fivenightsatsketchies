// Mouse and keyboard to intent. All hit-testing goes through ui/layout.js so the
// clickable regions are literally the same rects the renderer draws.

import {
  VIEW_W, VIEW_H, PANO_W, PAN_MAX, PAN_EDGE, PAN_SPEED,
  BTN_L, BTN_R, CAM_TAB, CAM_PANEL, CAM_MAP, inRect, hitTest,
} from '../ui/layout.js';

export function createInput(canvas) {
  const st = {
    mx: VIEW_W / 2,
    my: VIEW_H / 2,
    panX: PAN_MAX / 2,
    doors: { left: false, right: false },
    lights: { left: false, right: false },
    camsUp: false,
    camId: 'CAM1A',
    clicks: [],       // screen-space clicks, drained by the scene
    actions: [],      // semantic actions, drained by main
    enabled: false,   // only true while a night is being played
    keys: new Set(),
  };

  function toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    // The canvas is letterboxed by CSS, so map through its displayed rect.
    const x = ((e.clientX - r.left) / r.width) * VIEW_W;
    const y = ((e.clientY - r.top) / r.height) * VIEW_H;
    return { x, y };
  }

  function panoramaX(screenX) {
    return screenX + st.panX;
  }

  function pressAt(x, y) {
    st.clicks.push({ x, y });
    if (!st.enabled) return;

    // Camera tab and, while up, the floorplan.
    if (inRect(CAM_TAB, x, y)) {
      st.camsUp = !st.camsUp;
      st.actions.push(st.camsUp ? 'cam.up' : 'cam.down');
      return;
    }
    if (st.camsUp) {
      const id = hitTest(CAM_MAP, x, y, CAM_PANEL.x, CAM_PANEL.y);
      if (id && id !== st.camId) {
        st.camId = id;
        st.actions.push('cam.switch');
      }
      return; // doors and lights are unreachable while watching
    }

    const px = panoramaX(x);
    if (inRect(BTN_L.door, px, y)) { st.doors.left = !st.doors.left; st.actions.push('button'); return; }
    if (inRect(BTN_R.door, px, y)) { st.doors.right = !st.doors.right; st.actions.push('button'); return; }
    if (inRect(BTN_L.light, px, y)) { st.lights.left = !st.lights.left; st.lights.right = false; st.actions.push('button'); return; }
    if (inRect(BTN_R.light, px, y)) { st.lights.right = !st.lights.right; st.lights.left = false; st.actions.push('button'); return; }
  }

  canvas.addEventListener('mousemove', (e) => {
    const p = toCanvas(e);
    st.mx = p.x;
    st.my = p.y;
  });

  canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const p = toCanvas(e);
    pressAt(p.x, p.y);
  });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    if (st.keys.has(e.code)) return;
    st.keys.add(e.code);
    if (e.code === 'Space') e.preventDefault();
    if (!st.enabled) {
      if (e.code === 'Space' || e.code === 'Enter') st.actions.push('confirm');
      return;
    }
    switch (e.code) {
      case 'KeyA': st.doors.left = !st.doors.left; st.actions.push('button'); break;
      case 'KeyD': st.doors.right = !st.doors.right; st.actions.push('button'); break;
      case 'KeyQ': st.lights.left = !st.lights.left; st.lights.right = false; st.actions.push('button'); break;
      case 'KeyE': st.lights.right = !st.lights.right; st.lights.left = false; st.actions.push('button'); break;
      case 'Space':
        st.camsUp = !st.camsUp;
        st.actions.push(st.camsUp ? 'cam.up' : 'cam.down');
        break;
      default: break;
    }
  });

  window.addEventListener('keyup', (e) => st.keys.delete(e.code));

  // Mouse near either edge turns the head, proportional to how far past the edge it is.
  function updatePan(dt) {
    let v = 0;
    if (st.mx < PAN_EDGE) v = -(1 - st.mx / PAN_EDGE);
    else if (st.mx > VIEW_W - PAN_EDGE) v = (st.mx - (VIEW_W - PAN_EDGE)) / PAN_EDGE;
    st.panX += v * PAN_SPEED * dt;
    if (st.panX < 0) st.panX = 0;
    if (st.panX > PAN_MAX) st.panX = PAN_MAX;
  }

  return {
    state: st,
    // Same path a real mousedown takes; used by the integration tests.
    press(x, y) {
      pressAt(x, y);
    },
    update(dt) {
      if (st.camsUp) { st.lights.left = false; st.lights.right = false; }
      updatePan(dt);
    },
    // The shape sim/game.js expects.
    simInput() {
      return {
        leftDoor: st.doors.left,
        rightDoor: st.doors.right,
        leftLight: st.lights.left,
        rightLight: st.lights.right,
        camsUp: st.camsUp,
        camId: st.camId,
      };
    },
    setEnabled(v) {
      st.enabled = v;
      if (!v) {
        st.doors.left = st.doors.right = false;
        st.lights.left = st.lights.right = false;
        st.camsUp = false;
      }
    },
    resetForNight() {
      st.doors.left = st.doors.right = false;
      st.lights.left = st.lights.right = false;
      st.camsUp = false;
      st.camId = 'CAM1A';
      st.panX = PAN_MAX / 2;
    },
    drainClicks() {
      const c = st.clicks.slice();
      st.clicks.length = 0;
      return c;
    },
    drainActions() {
      const c = st.actions.slice();
      st.actions.length = 0;
      return c;
    },
  };
}

export { PANO_W };
