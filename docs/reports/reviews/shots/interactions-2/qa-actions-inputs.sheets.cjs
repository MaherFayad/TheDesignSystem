// ds-qa review of order 1.22: contact sheets for the actions and inputs
// families. One row per style (Studio dark, Desk dark, Neutral light, LTR,
// full motion), eight frames after the trigger. The animations are slowed
// through CDP while the trigger runs, then paused and seeked frame by frame
// (document.getAnimations(), currentTime), so the frames are on the
// animation's own clock, not the wall clock of a loaded machine.
// node qa-actions-inputs.sheets.cjs <id ...|actions|inputs>
const fs = require('fs');
const path = require('path');
const { chromium } = require('/home/user/TheDesignSystem/node_modules/playwright');
const L = require('./qa-actions-inputs.lib.cjs');

const FRAMES = [0, 40, 80, 130, 180, 240, 320, 440];

async function rowFor(browser, id, style, scheme) {
  const spec = L.SPECS[id];
  const { ctx, page } = await L.open(browser, { id, style, scheme, dir: 'ltr', motion: 'full' });
  try {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Animation.enable');
    if (spec.held) {
      await spec.held.act(page);
      await page.waitForTimeout(200);
      await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.05 });
      await page.mouse.up();
    } else {
      await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.05 });
      await spec.act(page);
    }
    await page.waitForTimeout(60);
    const box = await page.evaluate(() => {
      const anims = document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Infinity);
      anims.forEach((a) => a.pause());
      const r = document.querySelector('[data-interaction-stage]').getBoundingClientRect();
      // Include an open menu below the stage.
      let bottom = r.bottom;
      for (const m of document.querySelectorAll('[role=menu]')) bottom = Math.max(bottom, m.getBoundingClientRect().bottom);
      return { x: Math.max(0, r.left - 24), y: Math.max(0, r.top - 24), width: Math.min(960, r.width + 48), height: Math.min(540, bottom - r.top + 48) };
    });
    await page.waitForTimeout(80);
    await page.evaluate(() => {
      const anims = document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Infinity);
      anims.forEach((a) => a.pause());
      const t0 = Math.min(...anims.map((a) => (a.startTime === null ? Infinity : a.startTime)));
      window.__sheet = anims.map((a) => ({ a, off: a.startTime === null || !Number.isFinite(t0) ? 0 : a.startTime - t0 }));
    });
    const shots = [];
    for (const t of FRAMES) {
      await page.evaluate((t) => { for (const { a, off } of window.__sheet) { try { a.currentTime = Math.max(0, t - off); } catch { /* */ } } }, t);
      await page.waitForTimeout(40);
      shots.push((await page.screenshot({ clip: box, animations: 'allow' })).toString('base64'));
    }
    const count = await page.evaluate(() => window.__sheet.length);
    return { shots, box, count };
  } finally {
    await ctx.close();
  }
}

async function sheet(browser, id) {
  const rows = [];
  for (const { style, scheme } of L.STYLES) rows.push({ style, ...(await rowFor(browser, id, style, scheme)) });
  const w = Math.max(...rows.map((r) => r.box.width));
  const scale = Math.min(1, 230 / w);
  const ctx = await browser.newContext({ viewport: { width: 1900, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const html = `<html><body style="margin:0;background:#888;font:12px sans-serif;color:#111"><div id=s style="display:inline-block;padding:6px">
  <div style="margin:2px 0 6px">${id}: frames at ${FRAMES.join(', ')} ms after the trigger, on the animation clock. Rows: Studio dark, Desk dark, Neutral light (LTR, full motion).</div>
  ${rows.map((r) => `<div style="display:flex;gap:4px;align-items:flex-start;margin-bottom:4px"><div style="width:58px">${r.style}<br>${r.count} anims</div>${r.shots.map((s, i) => `<figure style="margin:0"><img src="data:image/png;base64,${s}" style="width:${Math.round(r.box.width * scale)}px;display:block"><figcaption>${FRAMES[i]}ms</figcaption></figure>`).join('')}</div>`).join('')}
  </div></body></html>`;
  await page.setContent(html);
  await page.locator('#s').screenshot({ path: path.join(__dirname, `${id}.sheet.png`) });
  await ctx.close();
}

(async () => {
  let ids = process.argv.slice(2);
  if (ids.length === 1 && (ids[0] === 'actions' || ids[0] === 'inputs')) ids = Object.keys(L.SPECS).filter((k) => L.SPECS[k].family === ids[0]);
  const browser = await chromium.launch();
  for (const id of ids) {
    try { await sheet(browser, id); console.log(id, 'sheet'); } catch (e) { console.log(id, 'FAILED', e.message.slice(0, 200)); }
  }
  await browser.close();
})();
