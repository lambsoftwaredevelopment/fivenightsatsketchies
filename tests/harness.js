// Minimal assertion harness. There is no npm on this machine, so the suite is a plain
// page: tests/run.js imports the suites and calls run(), which prints into the DOM and
// stamps document.title so a headless browser can read the result.

const tests = [];
let current = null;

export function test(name, fn) {
  tests.push({ name, fn });
}

export function ok(cond, msg) {
  if (!cond) throw new Error(msg || 'expected truthy');
}

export function eq(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error((msg || 'eq') + ': expected ' + JSON.stringify(expected) +
      ', got ' + JSON.stringify(actual));
  }
}

export function approx(actual, expected, tol, msg) {
  if (Math.abs(actual - expected) > (tol === undefined ? 1e-6 : tol)) {
    throw new Error((msg || 'approx') + ': expected ~' + expected + ', got ' + actual);
  }
}

export function note(msg) {
  if (current) current.notes.push(msg);
}

export function run(target) {
  const lines = [];
  let pass = 0;
  let fail = 0;

  for (const t of tests) {
    current = { notes: [] };
    try {
      t.fn();
      pass++;
      lines.push('PASS  ' + t.name);
    } catch (e) {
      fail++;
      lines.push('FAIL  ' + t.name);
      lines.push('        ' + (e && e.message ? e.message : String(e)));
    }
    for (const n of current.notes) lines.push('        . ' + n);
    current = null;
  }

  const summary = (fail === 0 ? 'ALL PASS' : 'FAILURES') + '  ' + pass + '/' + (pass + fail);
  lines.push('');
  lines.push(summary);

  if (typeof document !== 'undefined') {
    document.title = (fail === 0 ? 'PASS ' : 'FAIL ') + pass + '/' + (pass + fail);
    const el = target || document.getElementById('out');
    if (el) el.textContent = lines.join('\n');
  }
  return { pass, fail, lines };
}
