// Named recipes. Each one is a short arrangement of the synth primitives -- no audio
// files anywhere, which keeps the whole game a single dependency-free directory.

import { tone, noise } from './synth.js';

// Freddy's toreador march, as a repeating motif rather than the real melody.
const TOREADOR = [
  [523, 0.22], [523, 0.22], [587, 0.22], [659, 0.44],
  [587, 0.22], [523, 0.22], [494, 0.44],
  [523, 0.22], [587, 0.22], [659, 0.22], [698, 0.44], [659, 0.66],
];

export const SFX = {
  doorSlam(a) {
    noise(a.ctx, a.bus, a.noiseBuf, { dur: 0.5, gain: 0.5, freq: 160, q: 0.7, sweepTo: 60 });
    tone(a.ctx, a.bus, { type: 'square', freq: 90, to: 40, dur: 0.35, gain: 0.28 });
  },
  doorOpen(a) {
    noise(a.ctx, a.bus, a.noiseBuf, { dur: 0.4, gain: 0.32, freq: 220, q: 0.8, sweepTo: 500 });
  },
  buttonClick(a) {
    tone(a.ctx, a.bus, { type: 'square', freq: 900, to: 500, dur: 0.05, gain: 0.12 });
  },
  camFlip(a) {
    noise(a.ctx, a.bus, a.noiseBuf, { dur: 0.35, gain: 0.4, freq: 2600, q: 0.5, sweepTo: 700 });
    tone(a.ctx, a.bus, { type: 'square', freq: 130, to: 70, dur: 0.14, gain: 0.14 });
  },
  camSwitch(a) {
    noise(a.ctx, a.bus, a.noiseBuf, { dur: 0.16, gain: 0.3, freq: 3200, q: 0.4 });
  },
  footstep(a) {
    noise(a.ctx, a.bus, a.noiseBuf, { dur: 0.16, gain: 0.22, freq: 260, q: 1.4, sweepTo: 120 });
  },
  chicaBang(a) {
    noise(a.ctx, a.bus, a.noiseBuf, { dur: 0.3, gain: 0.4, freq: 190, q: 1.1, sweepTo: 80 });
    tone(a.ctx, a.bus, { type: 'triangle', freq: 140, to: 60, dur: 0.24, gain: 0.2 });
  },
  foxyBang(a) {
    for (let i = 0; i < 3; i++) {
      noise(a.ctx, a.bus, a.noiseBuf, {
        dur: 0.22, gain: 0.5, freq: 210, q: 1.2, sweepTo: 70, when: i * 0.13,
      });
    }
  },
  foxyRun(a) {
    for (let i = 0; i < 9; i++) {
      noise(a.ctx, a.bus, a.noiseBuf, {
        dur: 0.1, gain: 0.3, freq: 320, q: 2, sweepTo: 140, when: i * 0.11,
      });
    }
  },
  freddyLaugh(a) {
    // A descending stutter -- unmistakable, and the only warning he gives.
    for (let i = 0; i < 7; i++) {
      tone(a.ctx, a.bus, {
        type: 'sawtooth', freq: 300 - i * 22, to: 200 - i * 16,
        dur: 0.12, gain: 0.1, when: i * 0.115,
      });
    }
  },
  scream(a) {
    noise(a.ctx, a.bus, a.noiseBuf, { dur: 1.2, gain: 0.85, freq: 1400, q: 0.4, sweepTo: 260 });
    tone(a.ctx, a.bus, { type: 'sawtooth', freq: 900, to: 90, dur: 1.1, gain: 0.4 });
    tone(a.ctx, a.bus, { type: 'square', freq: 1330, to: 120, dur: 1.0, gain: 0.25 });
  },
  powerDown(a) {
    tone(a.ctx, a.bus, { type: 'sawtooth', freq: 320, to: 30, dur: 1.8, gain: 0.3 });
    noise(a.ctx, a.bus, a.noiseBuf, { dur: 1.6, gain: 0.2, freq: 700, q: 0.5, sweepTo: 60 });
  },
  chime6am(a) {
    [523, 659, 784, 1047].forEach((f, i) => {
      tone(a.ctx, a.bus, { type: 'sine', freq: f, dur: 0.9, gain: 0.22, when: i * 0.16 });
    });
  },
  cheer(a) {
    noise(a.ctx, a.bus, a.noiseBuf, { dur: 2.2, gain: 0.14, freq: 1600, q: 0.3, type: 'bandpass' });
  },
  toreador(a) {
    let t = 0;
    for (const [f, d] of TOREADOR) {
      tone(a.ctx, a.bus, { type: 'square', freq: f, dur: d * 0.9, gain: 0.09, when: t });
      tone(a.ctx, a.bus, { type: 'triangle', freq: f / 2, dur: d * 0.9, gain: 0.05, when: t });
      t += d;
    }
    return t;
  },
};

export const TOREADOR_LEN = TOREADOR.reduce((a, x) => a + x[1], 0);
