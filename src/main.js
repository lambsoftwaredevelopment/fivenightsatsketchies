// Bootstrap: wire the app to a real animation loop and show any startup failure on the
// canvas rather than only in the console.

import { startLoop } from './core/loop.js';
import { createApp } from './app.js';
import { VIEW_W, VIEW_H } from './ui/layout.js';

const canvas = document.getElementById('game');
const game = createApp(canvas);

game.boot()
  .then(() => startLoop({ update: game.update, render: game.draw }))
  .catch((e) => {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#100808';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#e08080';
    ctx.font = '16px ui-monospace, monospace';
    ctx.fillText('failed to start: ' + e.message, 40, 60);
    console.error(e);
  });
