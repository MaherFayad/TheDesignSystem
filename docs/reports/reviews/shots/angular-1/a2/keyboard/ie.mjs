import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base] = process.argv.slice(2);
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await p.goto(`${base}/c/inline-edit?chrome=0&style=desk`); await p.waitForSelector('[data-demo-case]', { state: 'attached' }); await p.waitForTimeout(500);
await p.evaluate(() => {
  const r = document.querySelector('[data-ds=inline-edit][data-state=viewing]:not([data-disabled])'); r.setAttribute('data-qa', '');
  window.__log = [];
  new MutationObserver((m) => m.forEach((x) => x.attributeName === 'data-state' && window.__log.push('state ' + r.getAttribute('data-state') + ' active=' + document.activeElement.tagName))).observe(r, { attributes: true });
  for (const t of ['focusout', 'blur', 'focusin']) r.addEventListener(t, (e) => window.__log.push(`${t} target=${e.target.tagName}/${e.target.getAttribute('data-part')} related=${e.relatedTarget?.tagName ?? null} connected=${e.target.isConnected}`), true);
});
await p.focus('[data-qa] [data-part=display]');
await p.keyboard.press('Enter'); await p.waitForTimeout(300);
console.log((await p.evaluate(() => window.__log)).join('\n'));
console.log(await p.evaluate(() => navigator.userAgent));
await b.close();
