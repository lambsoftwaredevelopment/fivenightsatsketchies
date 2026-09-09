import { run } from './harness.js';
import { bootShared } from './app.test.js';
import './sim.test.js';
import './balance.test.js';

// The app tests need assets generated before any test runs.
bootShared().then(() => run()).catch((e) => {
  document.title = 'FAIL boot';
  document.getElementById('out').textContent = 'boot failed: ' + (e.stack || e.message);
});
