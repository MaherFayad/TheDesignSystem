// axe on the list family pages, closed and with one popup open, in one gallery.
// node axe.mjs <base> <query> : prints one line per (page, state) with the violated rules and node counts.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const [base, query = 'style=studio'] = process.argv.slice(2);
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const pages = [
  ['list-box', null],
  ['combobox', ['[data-demo-case=too-many] input[role=combobox]', 'ArrowDown']],
  ['autocomplete', ['[data-demo-case=too-many] input[role=combobox]', 'type:r']],
  ['select', ['[data-demo-case=many] button[data-ds=select]', 'Enter']],
  ['select', ['[data-demo-case=empty] button[data-ds=select]', 'Enter']],
  ['multi-select', ['[data-demo-case=too-many] [data-part=trigger]', 'Enter']],
  ['tag-field', ['input[role=combobox][data-part=control]', 'type:d']],
];
const b0 = await chromium.launch();
const b = await b0.newContext();
const out = {};
for (const [page, open] of pages) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await p.goto(`${base}/c/${page}?${query}`);
  await p.waitForSelector('[data-demo-case]', { state: 'attached' });
  await p.waitForTimeout(500);
  const run = async (state) => {
    const r = await new AxeBuilder({ page: p }).withTags(tags).exclude('[data-gallery-chrome]').analyze();
    const v = r.violations.map((x) => `${x.id}(${x.nodes.length})`).sort();
    const key = `${page} ${state}`;
    out[key] = r.violations.map((x) => ({ id: x.id, nodes: x.nodes.map((n) => n.target.join(' ')).slice(0, 5) }));
    console.log(`${key.padEnd(40)} ${v.join(' ') || 'none'}`);
  };
  if (!open) await run('closed');
  else {
    const el = p.locator(open[0]).first();
    await el.scrollIntoViewIfNeeded();
    await el.focus();
    if (open[1].startsWith('type:')) await p.keyboard.type(open[1].slice(5));
    else await p.keyboard.press(open[1]);
    await p.waitForTimeout(400);
    await run(`open ${open[0].split(' ')[0]}`);
  }
  await p.close();
}
console.error(JSON.stringify(out, null, 1));
await b0.close();
