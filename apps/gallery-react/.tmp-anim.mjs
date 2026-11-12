import { chromium } from 'playwright';
const [base, id] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: process.env.REDUCE ? 'reduce' : 'no-preference' });
await p.goto(`${base}/interactions?focus=${id}`);
await p.waitForSelector('[data-interaction-stage]', { state: 'attached' });
await p.waitForTimeout(1200);
const stage = '[data-interaction-stage]';
const center = async (sel) => { const r = await p.locator(sel).first().boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
const acts = {
  'check-draw': async () => p.locator(`${stage} [role=checkbox]`).first().click(),
  'radio-pop': async () => p.locator(`${stage} [role=radio]`).nth(1).click(),
  'radio-card-lift': async () => p.locator(`${stage} [role=radio]`).first().click(),
  'slider-pull': async () => { const c = await center(`${stage} [role=slider]`); await p.mouse.move(c.x, c.y); await p.mouse.down(); },
  'slider-bubble': async () => { const c = await center(`${stage} [role=slider]`); await p.mouse.move(c.x, c.y); await p.mouse.down(); await p.waitForTimeout(400); await p.mouse.move(c.x + 30, c.y, { steps: 1 }); },
  'slider-nudge': async () => { await p.locator(`${stage} [role=slider]`).first().focus(); await p.keyboard.press('ArrowRight'); },
  'picker-chevron-turn': async () => p.locator(`${stage} [data-ds=select]`).first().click(),
  'menu-rows': async () => p.locator(`${stage} [data-ds=select]`).first().click(),
  'picker-value-roll': async () => { await p.locator(`${stage} [data-ds=select]`).first().click(); await p.waitForTimeout(900); await p.getByRole('option', { name: 'Cherry' }).click(); },
  'row-glide': async () => { await p.locator(`${stage} [role=option]`).first().focus(); await p.waitForTimeout(500); await p.keyboard.press('ArrowDown'); },
  'collection-flip': async () => { await p.locator(`${stage} input[data-part=control]`).fill('Brand'); await p.keyboard.press('Enter'); },
  'filter-count-roll': async () => p.locator(`${stage} [data-ds=chip]`).nth(1).click(),
  'chip-check-pop': async () => p.locator(`${stage} [data-ds=chip]`).nth(1).click(),
};
await acts[id]();
await p.waitForTimeout(16);
const out = await p.evaluate(() => document.getAnimations().map((a) => {
  const e = a.effect; const t = e?.target; const tm = e?.getTiming?.() ?? {};
  const kf = e?.getKeyframes?.() ?? [];
  const props = [...new Set(kf.flatMap((k) => Object.keys(k).filter((x) => !['offset', 'easing', 'composite', 'computedOffset'].includes(x))))].sort();
  const name = a.constructor.name === 'CSSTransition' ? `transition:${a.transitionProperty}` : a.constructor.name === 'CSSAnimation' ? `css:${a.animationName}` : `waapi:${a.id}`;
  const tdesc = t ? `${t.tagName.toLowerCase()}${t.getAttribute('data-part') ? '[' + t.getAttribute('data-part') + ']' : ''}${t.getAttribute('data-ds') ? '{' + t.getAttribute('data-ds') + '}' : ''}` : '';
  return `${name} ${tdesc} props=${props.join(',')} dur=${Math.round(tm.duration)} ease=${tm.easing} delay=${Math.round(tm.delay)}`;
}).sort());
console.log(out.join('\n'));
await b.close();
