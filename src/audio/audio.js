// The AudioContext starts suspended until a user gesture, so nothing here may be
// assumed to exist before the first click. Loops (the fan, the room hum) are created
// exactly ONCE and gated by gain rather than restarted, which is what stops the node
// leaks and boundary pops that plague synthesized ambience.

import { makeNoiseBuffer } from './synth.js';
import { SFX, TOREADOR_LEN } from './sfx.js';

const MAX_VOICES = 12;

const a = {
  ctx: null,
  bus: null,
  master: null,
  noiseBuf: null,
  loops: {},
  voices: 0,
  muted: false,
  toreadorUntil: 0,
};

export function init() {
  if (a.ctx) {
    if (a.ctx.state === 'suspended') a.ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    a.ctx = new AC();
    a.master = a.ctx.createGain();
    a.master.gain.value = 0.9;
    a.master.connect(a.ctx.destination);
    a.bus = a.ctx.createGain();
    a.bus.gain.value = 1;
    a.bus.connect(a.master);
    a.noiseBuf = makeNoiseBuffer(a.ctx, 2);
    buildLoops();
  } catch (e) {
    // No audio device, or the context was refused. Play on in silence.
    a.ctx = null;
    console.warn('audio unavailable:', e && e.message);
  }
}

function buildLoops() {
  // Office fan: a narrow noise band plus a low hum, started once and left running.
  const src = a.ctx.createBufferSource();
  src.buffer = a.noiseBuf;
  src.loop = true;
  const f = a.ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 420;
  f.Q.value = 1.2;
  const g = a.ctx.createGain();
  g.gain.value = 0;
  src.connect(f).connect(g).connect(a.master);
  src.start();

  const hum = a.ctx.createOscillator();
  const humG = a.ctx.createGain();
  hum.type = 'sine';
  hum.frequency.value = 58;
  humG.gain.value = 0;
  hum.connect(humG).connect(a.master);
  hum.start();

  a.loops.fan = { gain: g, level: 0.05 };
  a.loops.hum = { gain: humG, level: 0.035 };

  // Camera feed hiss.
  const hsrc = a.ctx.createBufferSource();
  hsrc.buffer = a.noiseBuf;
  hsrc.loop = true;
  const hf = a.ctx.createBiquadFilter();
  hf.type = 'highpass';
  hf.frequency.value = 2200;
  const hg = a.ctx.createGain();
  hg.gain.value = 0;
  hsrc.connect(hf).connect(hg).connect(a.master);
  hsrc.start();
  a.loops.hiss = { gain: hg, level: 0.05 };
}

// Gate a loop on or off with a short ramp -- never start/stop the source.
export function setLoop(name, on) {
  const l = a.loops[name];
  if (!l || !a.ctx) return;
  const target = on && !a.muted ? l.level : 0;
  l.gain.gain.cancelScheduledValues(a.ctx.currentTime);
  l.gain.gain.setTargetAtTime(target, a.ctx.currentTime, 0.05);
}

export function play(name) {
  if (!a.ctx || a.muted) return 0;
  const fn = SFX[name];
  if (!fn) return 0;
  if (a.voices >= MAX_VOICES) return 0;
  a.voices++;
  const dur = fn(a) || 0.5;
  setTimeout(() => { a.voices = Math.max(0, a.voices - 1); }, Math.min(dur, 3) * 1000);
  return dur;
}

// The march is long; only restart it once the previous pass has finished.
export function playToreadorLoop(now) {
  if (!a.ctx || a.muted) return;
  if (now < a.toreadorUntil) return;
  SFX.toreador(a);
  a.toreadorUntil = now + TOREADOR_LEN;
}

export function stopToreador() {
  a.toreadorUntil = 0;
}

export function setMuted(m) {
  a.muted = m;
  if (a.master && a.ctx) {
    a.master.gain.setTargetAtTime(m ? 0 : 0.9, a.ctx.currentTime, 0.05);
  }
}

export function isMuted() {
  return a.muted;
}

export function ready() {
  return !!a.ctx;
}

// Every sim event tag that should make a noise, in one table.
const EVENT_SFX = {
  'door.close.left': 'doorSlam',
  'door.close.right': 'doorSlam',
  'door.open.left': 'doorOpen',
  'door.open.right': 'doorOpen',
  'velvet.move': 'footstep',
  'freddy.laugh': 'freddyLaugh',
  'fexy.run': 'fexyRun',
  'fexy.bang': 'fexyBang',
  'power.out': 'powerDown',
  'night.win': 'chime6am',
};

export function handleEvent(tag) {
  if (tag.startsWith('jumpscare.')) return play('scream');
  const name = EVENT_SFX[tag];
  if (name) return play(name);
  return 0;
}
