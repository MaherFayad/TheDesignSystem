// node toast.mjs <base> <query> > out.txt
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base, query] = process.argv.slice(2);
const log = (...a) => console.log(...a);
const b = await chromium.launch();

const dump = (p, sel) =>
  p.evaluate((sel) => {
    const ids = new Map();
    const norm = (v) => { if (!ids.has(v)) ids.set(v, `ID${ids.size}`); return ids.get(v); };
    const idAttrs = new Set(['id', 'for', 'aria-labelledby', 'aria-describedby', 'aria-controls']);
    const drop = new Set(['data-aria-hidden', 'ng-version']);
    const lines = [];
    const walk = (el, depth) => {
      const attrs = [...el.attributes]
        .filter((a) => !drop.has(a.name) && !(a.name === 'style' && /^pointer-events: (auto|none);$/.test(a.value)))
        .map((a) => [a.name, idAttrs.has(a.name) ? a.value.split(/\s+/).map(norm).join(' ') : a.value])
        .sort((x, y) => x[0].localeCompare(y[0]))
        .map(([k, v]) => `${k}="${v}"`);
      lines.push(`${'  '.repeat(depth)}<${el.tagName.toLowerCase()} ${attrs.join(' ')}>`);
      for (const n of el.childNodes) {
        if (n.nodeType === 1) walk(n, depth + 1);
        else if (n.nodeType === 3 && n.textContent.trim()) lines.push(`${'  '.repeat(depth + 1)}"${n.textContent.trim()}"`);
      }
    };
    for (const el of document.querySelectorAll(sel)) walk(el, 0);
    return lines.join('\n');
  }, sel);

const active = (p) =>
  p.evaluate(() => {
    const a = document.activeElement;
    if (!a) return 'null';
    return `${a.tagName.toLowerCase()} ds=${a.getAttribute('data-ds')} part=${a.getAttribute('data-part')} label=${a.getAttribute('aria-label')} text=${(a.textContent || '').trim().slice(0, 40)}`;
  });
const toasts = (p) => p.evaluate(() => [...document.querySelectorAll('[data-ds=toaster] > [data-ds=toast]')].map((t) => `${t.getAttribute('data-tone')}:${t.getAttribute('data-state')}:${t.querySelector('[data-part=title]')?.textContent.trim()}`));
const live = (p) => p.evaluate(() => [...document.querySelectorAll('[data-toaster-announce]')].map((s) => `${s.getAttribute('data-toaster-announce')}=[${s.textContent}]`).join(' '));

async function page(reduced) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  const errors = [];
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('pageerror', (e) => errors.push(String(e)));
  await p.goto(`${base}/c/toast?chrome=0&${query}`);
  await p.waitForSelector('[data-demo-case]', { state: 'attached' });
  await p.waitForTimeout(500);
  return { p, ctx, errors };
}
const trigger = (p, text) => p.locator('[data-demo-trigger]', { hasText: text }).first();
const until = async (p, fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return Date.now() - t0; await p.waitForTimeout(50); } return -1; };

// 1. layer at rest
{
  const { p, ctx, errors } = await page(true);
  log('== layer at rest');
  log(await dump(p, '[data-toaster-layer]'));
  // 2. show info via keyboard: focus does not move
  const t = trigger(p, /info|Info|description/).first();
  const infoBtn = p.locator('[data-demo-case=variants] [data-demo-trigger]').nth(1);
  await infoBtn.focus();
  const before = await active(p);
  await p.keyboard.press('Enter');
  await p.waitForTimeout(400);
  log('== focus before show:', before);
  log('== focus after show :', await active(p));
  log('== toasts:', JSON.stringify(await toasts(p)));
  log('== live at 400ms:', await live(p));
  log('== layer with one toast');
  log(await dump(p, '[data-toaster-layer]'));
  const gone = await until(p, async () => (await toasts(p)).length === 0, 8000);
  log('== tone toast removed after ms (reduced motion):', gone);
  log('== errors:', JSON.stringify(errors));
  await ctx.close();
}

// 3. danger and action stay; layer dump with action toast
{
  const { p, ctx } = await page(true);
  await p.locator('[data-demo-case=error] [data-demo-trigger]').click();
  await p.locator('[data-demo-case=variants] [data-demo-trigger]', { hasText: 'action' }).click();
  await p.waitForTimeout(300);
  log('== live after danger + action:', await live(p));
  log('== layer with danger + action');
  log(await dump(p, '[data-toaster-layer]'));
  await p.mouse.move(5, 5);
  await p.waitForTimeout(8000);
  log('== after 8s:', JSON.stringify(await toasts(p)));
  // F8 / Tab / Escape
  await p.locator('body').click({ position: { x: 5, y: 5 } });
  await p.keyboard.press('F8');
  await p.waitForTimeout(100);
  log('== F8 ->', await active(p));
  for (let i = 0; i < 6; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(50); log(`== Tab ${i + 1} ->`, await active(p)); }
  await p.keyboard.press('F8');
  await p.keyboard.press('Tab');
  await p.waitForTimeout(50);
  log('== F8 Tab ->', await active(p));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  log('== after Escape focus ->', await active(p), JSON.stringify(await toasts(p)));
  // Escape outside the toaster does nothing
  await p.locator('[data-demo-case=one] [data-demo-trigger]').focus();
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  log('== Escape outside ->', JSON.stringify(await toasts(p)));
  // close button by keyboard
  await p.keyboard.press('F8');
  await p.keyboard.press('Tab');
  await p.keyboard.press('Tab');
  await p.keyboard.press('Tab');
  log('== on ->', await active(p));
  await p.keyboard.press('Enter');
  await p.waitForTimeout(300);
  log('== after Enter ->', await active(p), JSON.stringify(await toasts(p)));
  await ctx.close();
}

// 4. pause on hover and focus, motion on
{
  const { p, ctx } = await page(false);
  await p.locator('[data-demo-case=one] [data-demo-trigger]').click();
  await p.waitForTimeout(300);
  const box = await p.locator('[data-ds=toaster] > [data-ds=toast]').first().boundingBox();
  await p.mouse.move(box.x + 20, box.y + 10);
  await p.waitForTimeout(6000);
  log('== hovered 6s:', JSON.stringify(await toasts(p)));
  await p.mouse.move(5, 5);
  const t1 = await until(p, async () => (await toasts(p)).length === 0, 8000);
  log('== removed after leave ms:', t1);
  await p.locator('[data-demo-case=one] [data-demo-trigger]').click();
  await p.mouse.move(5, 5);
  await p.keyboard.press('F8');
  await p.keyboard.press('Tab');
  log('== focused ->', await active(p));
  await p.waitForTimeout(6000);
  log('== focused 6s:', JSON.stringify(await toasts(p)));
  await p.locator('[data-demo-case=one] [data-demo-trigger]').focus();
  const t2 = await until(p, async () => (await toasts(p)).length === 0, 8000);
  log('== removed after blur ms:', t2);
  // close with motion on: exit and removal
  await p.locator('[data-demo-case=error] [data-demo-trigger]').click();
  await p.waitForTimeout(400);
  const t0 = Date.now();
  await p.locator('[data-ds=toaster] [data-part=close]').first().click();
  const t3 = await until(p, async () => (await toasts(p)).length === 0, 3000);
  log('== motion close removed ms:', t3 >= 0 ? (t3 < 1000 ? '<1000' : t3) : -1);
  await ctx.close();
}
// 5. reduced motion close: removal immediate
{
  const { p, ctx } = await page(true);
  await p.locator('[data-demo-case=error] [data-demo-trigger]').click();
  await p.waitForTimeout(300);
  await p.locator('[data-ds=toaster] [data-part=close]').first().click();
  const t = await until(p, async () => (await toasts(p)).length === 0, 3000);
  log('== reduced close removed ms <200:', t >= 0 && t < 200);
  await ctx.close();
}
await b.close();
