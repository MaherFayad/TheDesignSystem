// Opens every menu trigger in the demo cases and dumps the trigger plus the menu layer(s), normalized like compare-dom.mjs.
// node dump-open.mjs <base> <path> <mode: key|pointer> [sub]
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base, path, mode = 'key', sub] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
await p.goto(base + path);
await p.waitForSelector('[data-demo-case]', { state: 'attached' });
await p.waitForTimeout(400);
const n = await p.locator('[data-demo-case] [aria-haspopup="menu"]').count();
const dump = () =>
  p.evaluate((i) => {
    const ids = new Map();
    const norm = (v) => { if (!ids.has(v)) ids.set(v, `ID${ids.size}`); return ids.get(v); };
    const idAttrs = new Set(['id', 'for', 'aria-labelledby', 'aria-describedby', 'aria-controls']);
    const drop = new Set(['data-aria-hidden', 'ng-version']);
    const lines = [];
    const walk = (el, depth, shallow) => {
      const attrs = [...el.attributes]
        .filter((a) => !drop.has(a.name) && !(a.name === 'style' && /^pointer-events: (auto|none);$/.test(a.value)))
        .map((a) => [a.name, idAttrs.has(a.name) ? a.value.split(/\s+/).map(norm).join(' ') : a.name === 'style' ? a.value.replace(/-?\d+(\.\d+)?px/g, 'Npx') : a.value])
        .sort((x, y) => x[0].localeCompare(y[0]))
        .map(([k, v]) => `${k}="${v}"`);
      lines.push(`${'  '.repeat(depth)}<${el.tagName.toLowerCase()} ${attrs.join(' ')}>`);
      if (shallow) return;
      for (const n of el.childNodes) {
        if (n.nodeType === 1) walk(n, depth + 1);
        else if (n.nodeType === 3 && n.textContent.trim()) lines.push(`${'  '.repeat(depth + 1)}"${n.textContent.trim()}"`);
      }
    };
    const trig = document.querySelectorAll('[data-demo-case] [aria-haspopup="menu"]')[i];
    lines.push('TRIGGER');
    walk(trig, 0, true);
    lines.push('LAYERS');
    for (const el of document.querySelectorAll('[data-menu-layer]')) walk(el, 0);
    const a = document.activeElement;
    lines.push(`ACTIVE ${a?.tagName.toLowerCase()} role=${a?.getAttribute('role')} part=${a?.getAttribute('data-part')} text=${(a?.textContent || '').trim().slice(0, 40)}`);
    return lines.join('\n');
  }, i);
let out = [];
let i; let guard = 0;
for (i = 0; i < n; i++) {
  const t = p.locator('[data-demo-case] [aria-haspopup="menu"]').nth(i);
  if ((await t.getAttribute('aria-disabled')) === 'true') { out.push(`#${i} disabled, skipped`); continue; }
  await t.scrollIntoViewIfNeeded();
  if (mode === 'key') { await t.focus(); await p.keyboard.press('Enter'); } else await t.click();
  await p.waitForSelector('[data-menu-layer] [role=menu]');
  await p.waitForTimeout(250);
  if (sub) {
    const st = p.locator('[data-menu-layer] [data-part="sub-trigger"]').first();
    if (await st.count()) {
      if (mode === 'key') { await st.focus(); await p.keyboard.press(path.includes('dir=rtl') ? 'ArrowLeft' : 'ArrowRight'); } else await st.hover();
      await p.waitForTimeout(400);
    }
  }
  out.push(`#${i}`, await dump());
  await p.keyboard.press('Escape');
  if (sub) await p.keyboard.press('Escape');
  await p.waitForTimeout(250);
  // close anything left
  while (await p.locator('[data-menu-layer]').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); if (++guard > 20) break; }
}
console.log(out.join('\n'));
await b.close();
