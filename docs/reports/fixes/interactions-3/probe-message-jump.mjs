// Review N12 probe: when a field message or the form summary enters, the
// control after it does not jump. Per style and stage, the drawn top of the
// watched control is read before the trigger, on the first frame after it
// (in a ResizeObserver made after the click: observers run in the order they
// were made, after layout and before paint, so this reads the first painted
// frame after the component's own observer), and once settled. "jump" is the
// first frame's move, in CSS px; it passes at 2px or less. "settled" is the
// final move (the layout change itself, so the glide reaches it).
// Usage: node probe-message-jump.mjs [baseUrl] [out.json]
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5184';
const out = process.argv[3] ?? new URL('./message-jump.json', import.meta.url).pathname;
// [stage, the control after the message]
const stages = [
  ['field-message-enter', '[data-interaction-trigger]'],
  ['field-error-enter', '[data-interaction-trigger]'],
  ['form-summary-enter', '[data-ds=form] > [data-part=actions]'],
];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
const rows = [];
for (const style of ['studio', 'desk', 'neutral', 'liquid'])
  for (const [stage, watched] of stages) {
    await page.goto(`${base}/interactions?focus=${stage}&style=${style}&scheme=light&chrome=0`);
    await page.waitForSelector(watched);
    await page.waitForTimeout(500);
    const m = await page.evaluate(
      ([watched]) =>
        new Promise((done) => {
          const el = document.querySelector(watched);
          const trigger = document.querySelector('[data-interaction-trigger]');
          const zoom = el.getBoundingClientRect().width / el.offsetWidth || 1;
          const top = () => el.getBoundingClientRect().top / zoom;
          const before = top();
          trigger.click();
          const ro = new ResizeObserver(() => {
            ro.disconnect();
            const first = top();
            setTimeout(() => done({ jump: Math.round((first - before) * 10) / 10, settled: Math.round((top() - before) * 10) / 10 }), 900);
          });
          ro.observe(document.body);
        }),
      [watched],
    );
    rows.push({ style, stage, ...m, pass: Math.abs(m.jump) <= 2 });
  }
await browser.close();
const failed = rows.filter((r) => !r.pass);
writeFileSync(out, `${JSON.stringify({ base, total: rows.length, failed: failed.length, rows }, null, 1)}\n`);
console.log(`${rows.length - failed.length} of ${rows.length} pass`);
for (const r of rows) console.log(r.pass ? 'pass' : 'FAIL', r.style, r.stage, 'jump', r.jump, 'settled', r.settled);
process.exit(failed.length ? 1 : 0);
