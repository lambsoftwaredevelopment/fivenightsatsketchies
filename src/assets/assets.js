// Resolves manifest ids to drawable sources. PROCEDURAL entries are generated into
// offscreen canvases at load; a path entry would be fetched as an <img>. Both are valid
// drawImage sources, so call sites never care which one they got.

import { MANIFEST, PROCEDURAL } from './manifest.js';
import { GENERATORS } from './procedural.js';

const cache = new Map();
let ready = false;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('failed to load ' + src));
    img.src = src;
  });
}

export async function loadAssets() {
  const pending = [];
  for (const id of Object.keys(MANIFEST)) {
    const e = MANIFEST[id];
    if (e.src === PROCEDURAL) {
      const gen = GENERATORS[e.gen];
      if (!gen) throw new Error('no generator "' + e.gen + '" for ' + id);
      const c = makeCanvas(e.w, e.h);
      gen(c.getContext('2d'), e.w, e.h, e.args || {});
      cache.set(id, c);
    } else {
      pending.push(loadImage(e.src).then((img) => cache.set(id, img)));
    }
  }
  await Promise.all(pending);
  ready = true;
}

export function image(id) {
  const v = cache.get(id);
  if (!v && ready) console.warn('missing asset', id);
  return v || null;
}

export function assetsReady() {
  return ready;
}
