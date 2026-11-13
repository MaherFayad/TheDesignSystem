// Final QA probe, order 1.29: Popover open after Escape race (React). Opens each trigger of the
// variants case in turn as the contract suite does, logs popover adds, removes, state and focus.
//   node final.popover-race.cjs <base> <cpu rate> <reps>   (prints JSON, a miss carries the log)
// Opens each Popover trigger in turn, as the contract suite does (mark seen, click, poll for a new root, Escape, poll for close).
const { chromium } = require('playwright');
const [base, rate, reps] = [process.argv[2], Number(process.argv[3] || 1), Number(process.argv[4] || 2)];
(async () => {
  const b = await chromium.launch();
  const out = [];
  for (const style of ['studio', 'desk', 'neutral', 'liquid']) for (let r = 0; r < reps; r++) {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    await p.goto(`${base}/c/popover?style=${style}&scheme=dark&dir=ltr&lang=en&chrome=0`, { waitUntil: 'networkidle' });
    await p.evaluate(() => { window.__log = []; const t0 = performance.now(); const L = (s) => window.__log.push(Math.round(performance.now() - t0) + ' ' + s); new MutationObserver((ms) => { for (const m of ms) { for (const n of m.addedNodes) if (n.nodeType === 1 && (n.matches('[data-ds=popover]') || n.querySelector?.('[data-ds=popover]'))) L('add popover'); for (const n of m.removedNodes) if (n.nodeType === 1 && (n.matches('[data-ds=popover]') || n.querySelector?.('[data-ds=popover]'))) L('remove popover'); if (m.type === 'attributes' && m.target.matches('[data-ds=popover]')) L('popover state ' + m.target.getAttribute('data-state')); } }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state'] }); document.addEventListener('focusin', (e) => L('focus ' + (e.target.getAttribute('data-demo-trigger') || e.target.getAttribute('data-ds') || e.target.tagName)), true); document.addEventListener('click', (e) => L('click ' + (e.target.closest('[data-demo-trigger]')?.getAttribute('data-demo-trigger') || e.target.tagName)), true); });
    if (rate > 1) { const c = await p.context().newCDPSession(p); await c.send('Emulation.setCPUThrottlingRate', { rate }); }
    const sel = '[data-demo-case="variants"] [data-demo-trigger]';
    const n = await p.locator(sel).count();
    for (let i = 0; i < n; i++) {
      await p.evaluate(() => document.querySelectorAll('[data-ds=popover]').forEach((e) => (e.__seen = true)));
      const t0 = Date.now();
      await p.locator(sel).nth(i).click();
      let ms = -1, info = null;
      while (Date.now() - t0 < 5000) {
        const k = await p.evaluate(() => [...document.querySelectorAll('[data-ds=popover]')].filter((e) => !e.__seen && e.getAttribute('data-state') !== 'closed').length);
        if (k > 0) { ms = Date.now() - t0; break; }
      }
      if (ms < 0) info = await p.evaluate(() => ({ roots: [...document.querySelectorAll('[data-ds=popover]')].map((e) => `${e.__seen ? 'seen' : 'new'}:${e.getAttribute('data-state')}`), active: document.activeElement?.outerHTML.slice(0, 120), log: window.__log.slice(-14), expanded: [...document.querySelectorAll('[data-demo-case="variants"] [data-demo-trigger]')].map((t) => t.getAttribute('aria-expanded')) }));
      const label = (await p.locator(sel).nth(i).textContent()).trim();
      out.push({ style, rep: r, i: i + 1, label, openMs: ms, info });
      await p.keyboard.press('Escape');
      const t1 = Date.now();
      while (Date.now() - t1 < 3000) {
        const k = await p.evaluate(() => [...document.querySelectorAll('[data-ds=popover]')].filter((e) => !e.__seen && e.getAttribute('data-state') !== 'closed').length);
        if (k === 0) break;
      }
    }
    await p.close();
  }
  const miss = out.filter((o) => o.openMs < 0);
  console.log(JSON.stringify({ base, cpuRate: rate, opens: out.length, misses: miss.length, maxOpenMs: Math.max(...out.map((o) => o.openMs)), miss }, null, 1));
  await b.close();
})();
