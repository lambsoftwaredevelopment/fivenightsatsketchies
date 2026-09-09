// WebAudio primitives. One shared noise buffer, every voice gain-ramped at both ends so
// nothing clicks, and a hard voice cap so a busy moment cannot leak nodes.

const RAMP = 0.02;

export function makeNoiseBuffer(ctx, seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

export function distortionCurve(amount) {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 20 * Math.PI / 180) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

// A single oscillator with an attack/decay envelope. Returns when it will be done.
export function tone(ctx, dest, { type = 'sine', freq = 220, to = null, dur = 0.3,
  gain = 0.3, attack = 0.01, when = 0 } = {}) {
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(dest);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
  return dur;
}

// A burst of filtered noise -- the basis of every impact, footstep and breath.
export function noise(ctx, dest, buffer, { dur = 0.3, gain = 0.3, freq = 800,
  q = 1, type = 'bandpass', when = 0, sweepTo = null } = {}) {
  const t0 = ctx.currentTime + when;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t0);
  if (sweepTo !== null) f.frequency.exponentialRampToValueAtTime(Math.max(sweepTo, 1), t0 + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), t0 + RAMP);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(dest);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
  return dur;
}

export { RAMP };
