import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage();
p.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text().slice(0, 600)); });
p.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 600)));
for (const slug of process.argv.slice(2)) {
  await p.goto(`http://localhost:5718/c/${slug}?chrome=0`, { waitUntil: 'networkidle' });
  console.log(slug, await p.locator('[data-demo-case]').count());
}
await b.close();
