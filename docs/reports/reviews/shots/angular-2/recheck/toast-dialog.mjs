// Recheck of angular-1 Toast B1, live: a toast with an action above an
// open Dialog. The toast is made on /c/toast, the gallery then moves to
// /c/dialog in the same document (pushState plus popstate, as its own links
// do), so the toaster keeps the toast while a dialog opens. Then F8, Tab,
// a pointer press on the action, Escape.
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base, query = 'style=studio'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
const out = [];
const where = () => p.evaluate(() => {
  const a = document.activeElement;
  const inToaster = !!a?.closest('[data-ds=toaster], [data-ds=toast], ol, [aria-label*="Notifications"]');
  const inDialog = !!a?.closest('[role=dialog],[role=alertdialog]');
  return `focus=${a?.tagName}${a?.getAttribute('data-part') ? '/' + a.getAttribute('data-part') : ''} "${(a?.textContent ?? '').trim().slice(0, 24)}" inDialog=${inDialog} inToaster=${inToaster} dialogs=${document.querySelectorAll('[role=dialog],[role=alertdialog]').length} toasts=${document.querySelectorAll('[data-ds=toast]').length}`;
});
await p.goto(`${base}/c/toast?chrome=0&${query}`);
await p.waitForSelector('[data-demo-case]', { state: 'attached' });
await p.waitForTimeout(500);
await p.getByRole('button', { name: 'Show toast with action' }).first().click();
await p.waitForTimeout(500);
out.push(`toast made: ${await where()}`);
await p.evaluate((q) => { history.pushState({}, '', `/c/dialog?chrome=0&${q}`); dispatchEvent(new PopStateEvent('popstate')); }, query);
await p.waitForSelector('[data-demo-trigger=md]', { timeout: 10000 });
await p.waitForTimeout(500);
out.push(`after moving to /c/dialog: ${await where()}`);
await p.locator('[data-demo-trigger=md]').first().click();
await p.waitForSelector('[role=dialog]');
await p.waitForTimeout(500);
out.push(`dialog open: ${await where()}`);
await p.keyboard.press('F8'); await p.waitForTimeout(300);
out.push(`F8: ${await where()}`);
await p.keyboard.press('Tab'); await p.waitForTimeout(200);
out.push(`Tab: ${await where()}`);
await p.keyboard.press('Tab'); await p.waitForTimeout(200);
out.push(`Tab: ${await where()}`);
const action = p.locator('[data-ds=toast] [data-part=action]').first();
if (await action.count()) {
  await action.focus(); await p.waitForTimeout(200);
  out.push(`focus() on the toast action: ${await where()}`);
  await p.locator('[role=dialog] button').first().focus();
  await action.click(); await p.waitForTimeout(400);
  out.push(`pointer click on the toast action: ${await where()}`);
}
await p.locator('[role=dialog] button').first().focus().catch(() => {});
await p.keyboard.press('Escape'); await p.waitForTimeout(400);
out.push(`Escape from inside the dialog: ${await where()}`);
console.log(out.join('\n'));
await b.close();
