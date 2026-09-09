# Five Nights at Sketchy's

A survival horror game in vanilla JavaScript, built in the style of Five Nights at
Freddy's 1. No build step, no bundler, no npm packages, no external assets — all the art
is drawn with Canvas 2D and all the audio is synthesized with WebAudio, so the whole
game is this one directory.

## Run it

ES modules will not load over `file://`, so it needs a server — any static one will do:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. Tests are at <http://localhost:8000/test.html>.

## Controls

| | |
|---|---|
| **A** / **D** | left / right door |
| **Q** / **E** | left / right hall light |
| **Space** | raise or lower the cameras |
| Mouse to the screen edges | turn your head |
| Click | door and light buttons, the camera tab, rooms on the map |

Survive from 12 AM to 6 AM — nine real minutes — on a battery that will not last if you
use it carelessly. **Doors and lights are locked out while the cameras are up.**

## The three of them

Each one is beaten by a *different* action, which is what makes the night a juggling act
rather than one repeated move:

- **Velvet** — comes down the west hall to the left door. Immune to the cameras; the
  door is the only answer. Reaching your door is not instant death: you get one
  door-grace window (5s) to flick the light and react.
- **Fexy** — their timer only advances while you are *not* watching Pirate Cove.
  Neglect them and they sprint; at an open door that is instant death, and a closed
  door costs power. **They punish ignoring the cameras.**
- **Freddy** — cannot move on any frame where the cameras are up *and* showing his
  current room. **He punishes watching too much.** He laughs when he moves, which is the
  only warning you get, and he is the one who comes for you when the power runs out.

At 0% power the doors open, the lights die, and the blackout sequence begins. Reaching
6 AM part-way through it still counts as a win.

## Layout

Dependencies run strictly one way: `sim/` ← `render/` ← `app.js`.

```
index.html            the game            test.html   the test suite
src/
  main.js             bootstrap: wires the app to an animation loop
  app.js              scene state machine, event forwarding, rendering — driveable with
                      an explicit dt, which is what makes it testable
  core/               fixed-timestep loop, seeded PRNG
  sim/                PURE simulation. No document, window, canvas or performance.
    constants.js        every tunable number
    night-config.js     per-night, per-hour AI levels
    animatronics.js     the four behaviour rules
    power.js            drain, blackout
    game.js             createGame / stepGame — the whole reducer
  ui/layout.js        pure geometry, shared by the renderer AND the input layer, so
                      what is drawn and what is clickable cannot drift apart
  render/             office, cameras, figures, CRT effects, HUD, screens
  assets/             the manifest, the procedural generators, the loader
  audio/              synth primitives, named recipes, the audio system
  io/                 input, localStorage save
tests/                harness, sim tests, app integration tests, balance sweeps
```

`sim/` being pure is the load-bearing decision: it lets `tests/balance.test.js`
fast-forward hundreds of nights headlessly, which is the only practical way to tune a
game like this.

## Swapping in real art

Every visual is a manifest entry in `src/assets/manifest.js`, currently marked
`PROCEDURAL` and generated into an offscreen canvas at load. A generated `<canvas>` and
a loaded `<img>` are both valid `drawImage` sources, so replacing the placeholder art
means changing one field per entry:

```js
'fig.velvet.idle': { src: PROCEDURAL, gen: 'figure', ... }
'fig.velvet.idle': { src: 'art/velvet-idle.png' }
```

No call site changes. Entries are deliberately *per layer*, not per screen — a single
flat "office" image could not accommodate the sliding door panel, the spinning fan or
the head-turn pan. Audio works the same way behind `SFX` recipes in `src/audio/sfx.js`.

## Balance

`tests/balance.test.js` runs 60 seeded nights per night-number under three scripted
policies and reports survival and end-of-night power. Current numbers:

| Night | Careful play | Ends with | Camping both doors |
|---|---|---|---|
| 1 | 100% | 68% | 0% — blacks out |
| 2 | 100% | 47% | 0% |
| 3 | 100% | 24% | 0% |
| 4 | 100% | 14% | 0% |
| 5 | 77% | 3% | 0% |

The careful bot is a near-perfect player, so its **end-of-night power** — not its win
rate — is the real difficulty signal: the margin narrows from 68% to 3% across the week.
A third "camera-happy" policy confirms the animatronics can still punish a distracted
player: it dies to a monster, not the battery, on every night after the first.

All the tuning lives in `sim/constants.js` and `sim/night-config.js`, so rebalancing is
a data edit — change a number, reload `test.html`, read the new table.

## Notes

- Verified running in Chrome 66, which is an old floor; `roundRect` is polyfilled.
- The simulation is deterministic given a seed, so any night can be replayed exactly.
- `dt` is clamped and the loop pauses on `visibilitychange`, so a backgrounded tab
  cannot fast-forward you into a jumpscare.
