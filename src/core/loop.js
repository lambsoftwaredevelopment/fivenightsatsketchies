// Fixed-timestep game loop. The sim only ever advances in STEP-sized slices so that
// behaviour does not depend on the display refresh rate, and dt is clamped so a
// backgrounded tab cannot fast-forward the player into a jumpscare.

const STEP = 1 / 60;
const MAX_FRAME = 0.05;

export function startLoop({ update, render }) {
  let last = performance.now() / 1000;
  let acc = 0;
  let paused = false;
  let raf = 0;

  function onVisibility() {
    paused = document.hidden;
    if (!paused) last = performance.now() / 1000;
  }
  document.addEventListener('visibilitychange', onVisibility);

  function frame(nowMs) {
    raf = requestAnimationFrame(frame);
    const now = nowMs / 1000;
    let dt = now - last;
    last = now;
    if (paused) return;
    if (dt > MAX_FRAME) dt = MAX_FRAME;

    acc += dt;
    let guard = 0;
    while (acc >= STEP && guard++ < 8) {
      update(STEP);
      acc -= STEP;
    }
    render(now);
  }
  raf = requestAnimationFrame(frame);

  return function stop() {
    cancelAnimationFrame(raf);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

export { STEP };
