// Recheck of angular-1 Toast B1 in Chromium. The galleries have no page
// with a toast and a dialog together, and the toaster unmounts when the
// gallery changes page (toast-dialog.txt). So, with a Dialog open, this adds
// a stand in toaster layer to the body: <div data-toaster-layer> with a
// button, the attribute isInsideToaster looks for. Control: the same
// markup without the attribute.
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base, query = 'style=studio'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
const out = [];
for (const layer of [true, false]) {
  await p.goto(`${base}/c/dialog?chrome=0&${query}`);
  await p.waitForSelector('[data-demo-trigger=md]');
  await p.waitForTimeout(400);
  await p.locator('[data-demo-trigger=md]').first().click();
  await p.waitForSelector('[role=dialog]');
  await p.waitForTimeout(400);
  await p.evaluate((layer) => {
    const d = document.createElement('div');
    if (layer) d.setAttribute('data-toaster-layer', '');
    d.style.cssText = 'position:fixed;inset-block-end:0;inset-inline-end:0;z-index:2147483647;pointer-events:auto';
    d.innerHTML = '<button id="qa-undo" type="button">Undo</button>';
    document.body.append(d);
  }, layer);
  const s = () => p.evaluate(() => `focus=${document.activeElement?.id || document.activeElement?.tagName + ' "' + document.activeElement?.textContent?.trim().slice(0, 20) + '"'} dialogs=${document.querySelectorAll('[role=dialog]').length}`);
  await p.evaluate(() => document.getElementById('qa-undo').focus());
  await p.waitForTimeout(200);
  out.push(`${layer ? 'with data-toaster-layer' : 'control, no attribute'}: focus() on Undo: ${await s()}`);
  await p.locator('#qa-undo').click();
  await p.waitForTimeout(200);
  out.push(`  pointer click on Undo: ${await s()}`);
  await p.evaluate(() => document.getElementById('qa-undo').focus());
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  out.push(`  Escape with focus on Undo: ${await s()}`);
}
console.log(out.join('\n'));
await b.close();
