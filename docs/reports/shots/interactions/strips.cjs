// Frame strips for every interaction on /interactions, normal and reduced
// motion. For each one: trigger it, pause every running animation at once,
// step them through their timing, screenshot the stage area each step, then
// put the frames side by side with ffmpeg.
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const [base, outDir, only] = process.argv.slice(2);
const STYLE = process.env.STYLE || 'neutral';
const SCHEME = process.env.SCHEME || 'light';
const FRAMES = 6;
// The strip shows the first part of a long loop only (the shimmer).

const card = (id) => `[data-interaction='${id}']`;
const trig = (id, t = '') => `${card(id)} [data-interaction-trigger${t ? `='${t}'` : ''}]`;

// Each action triggers the interaction and leaves it running. `hold` actions
// keep the pointer down while the frames are taken.
// Steps that set the scene before the timed action (not timed).
const preps = {
  'toast-stack': async (p) => { await p.click(trig('toast-stack')); await p.waitForTimeout(500); },
  'copy-swap': async (p) => { await p.context().grantPermissions(['clipboard-read', 'clipboard-write']); },
  'tooltip-rise': async (p) => { await hover(p, trig('tooltip-rise')); await p.waitForTimeout(450); },
  'skeleton-swap': async (p) => { await p.click(trig('skeleton-swap')); await p.waitForTimeout(100); },
};

const actions = {
  'button-press': async (p) => { await hover(p, trig('button-press')); await p.mouse.down(); },
  'copy-swap': async (p) => { await p.click(`${card('copy-swap')} [data-ds='copy-button'] >> nth=0`); },
  'check-draw': async (p) => { await p.click(`${card('check-draw')} [role='checkbox']`); },
  'switch-stretch': async (p) => { await hover(p, `${card('switch-stretch')} [role='switch']`); await p.mouse.down(); await p.waitForTimeout(150); await p.mouse.up(); },
  'rating-fill': async (p) => { await p.click(`${card('rating-fill')} [data-part='item'] >> nth=4`); },
  'focus-glow': async (p) => { await p.focus(`${card('focus-glow')} input`); },
  'error-shake': async (p) => { await p.click(trig('error-shake')); },
  'password-reveal': async (p) => { await p.click(`${card('password-reveal')} [data-ds='icon-button']`); },
  'otp-fill': async (p) => { await p.click(`${card('otp-fill')} input >> nth=0`); await p.keyboard.type('4829', { delay: 30 }); },
  'field-step': async (p) => { await p.focus(`${card('field-step')} input`); await p.keyboard.press('ArrowUp'); },
  'menu-origin': async (p) => { await p.click(trig('menu-origin', 'menu')); },
  'tooltip-rise': async (p) => { await p.waitForFunction(() => document.querySelector("[data-ds='tooltip']"), null, { timeout: 2000 }).catch(() => {}); },
  'toast-enter': async (p) => { await p.click(trig('toast-enter')); },
  'slider-nudge': async (p) => { await p.focus(`${card('slider-nudge')} [role='slider']`); await p.keyboard.press('End'); await p.keyboard.press('ArrowRight'); },
  'toast-stack': async (p) => { await p.click(trig('toast-stack')); },
  'toast-swipe': async (p) => { await p.click(trig('toast-swipe')); await p.waitForTimeout(400); const t = await p.locator("[data-ds='toast']").last().boundingBox(); if (t) { await p.mouse.move(t.x + t.width / 2, t.y + t.height / 2); await p.mouse.down(); await p.mouse.move(t.x + t.width / 2 + 60, t.y + t.height / 2, { steps: 6 }); await p.mouse.up(); } },
  'dialog-spring': async (p) => { await p.click(trig('dialog-spring')); },
  'sheet-spring': async (p) => { await p.click(trig('sheet-spring', 'sheet')); },
  'tab-slide': async (p) => { await p.click(`${card('tab-slide')} [role='tab'] >> nth=2`); },
  'accordion-reveal': async (p) => { await p.click(`${card('accordion-reveal')} [data-part='trigger'] >> nth=1`); },
  'skeleton-swap': async (p) => { await p.click(trig('skeleton-swap')); },
  'list-stagger': async (p) => { await p.click(trig('list-stagger')); },
  'stat-roll': async (p) => { await p.click(trig('stat-roll', 'up')); },
  'slider-pull': async (p) => { await hover(p, `${card('slider-pull')} [role='slider'] >> nth=0`); await p.mouse.down(); },
};

async function hover(p, sel) {
  const b = await p.locator(sel).first().boundingBox();
  if (!b) throw new Error(`no element ${sel}`);
  await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
}

async function strip(browser, id, reduced) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 640 }, deviceScaleFactor: 1, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  await p.goto(`${base}/interactions?style=${STYLE}&scheme=${SCHEME}&chrome=0`, { waitUntil: 'networkidle' });
  const c = p.locator(card(id));
  if ((await c.count()) === 0) { await ctx.close(); return 'no card'; }
  // Put the stage near the top so overlays opened from it stay in view.
  await c.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 160));
  await p.waitForTimeout(300);
  const act = actions[id];
  if (!act) { await ctx.close(); return 'no action'; }
  const dir = path.join(outDir, 'frames', STYLE, id);
  fs.mkdirSync(dir, { recursive: true });
  const tag = reduced ? 'reduced' : 'normal';
  // Animations already on the page (a shimmer, a first paint stagger) are
  // finished or cancelled, so only what the action starts is timed.
  await p.evaluate(() => { window.__old = new Set(); for (const a of document.getAnimations()) { try { a.finish(); } catch { a.cancel(); } window.__old.add(a); } });
  if (preps[id]) await preps[id](p);
  const box = await c.locator('[data-interaction-stage]').boundingBox();
  const wide = ['dialog-spring', 'sheet-spring', 'toast-enter', 'toast-stack', 'toast-swipe'].includes(id);
  const below = id === 'menu-origin' ? 150 : 0;
  const above = id === 'tooltip-rise' ? 60 : 8;
  const clip = wide || !box ? undefined : { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - above), width: Math.min(900, box.width + 16), height: Math.min(640, box.height + 8 + above + below) };
  const clipBox = { value: clip };
  let skipBefore = false;
  const shot = (f) => p.screenshot({ path: f, clip: clipBox.value });
  await shot(path.join(dir, `${tag}-0-before.png`));
  await act(p);
  if (id.startsWith('toast')) {
    // The before frame of a toast has no toast; keep it at the same size as the rest.
    const tb = await p.locator("[data-ds='toaster']").boundingBox().catch(() => null);
    if (tb) skipBefore = true;
    if (tb) clipBox.value = { x: Math.max(0, tb.x - 16), y: Math.max(0, tb.y + tb.height - 260), width: Math.min(900 - Math.max(0, tb.x - 16), tb.width + 32), height: 260 };
  }
  const ends = await p.evaluate(() => {
    const anims = document.getAnimations().filter((a) => !window.__old.has(a));
    for (const a of document.getAnimations()) a.pause();
    window.__new = anims;
    return anims.map((a) => {
      const t = a.effect.getComputedTiming();
      const one = t.delay + t.duration;
      return Number.isFinite(t.endTime) ? t.endTime : one;
    });
  });
  const end = Math.min(Math.max(0, ...ends.filter((e) => Number.isFinite(e))), 1500);
  const files = skipBefore ? [] : [path.join(dir, `${tag}-0-before.png`)];
  for (let i = 0; i <= FRAMES; i++) {
    const t = (end * i) / FRAMES;
    await p.evaluate((t) => { for (const a of window.__new) a.currentTime = t; }, t);
    await p.waitForTimeout(40);
    const f = path.join(dir, `${tag}-${i + 1}-${Math.round(t)}ms.png`);
    await shot(f);
    files.push(f);
  }
  await p.evaluate(() => { for (const a of document.getAnimations()) a.play(); });
  await p.mouse.up().catch(() => {});
  await ctx.close();
  const stripFile = path.join(outDir, `${id}.${STYLE}.${tag}.png`);
  const inputs = files.flatMap((f) => ['-i', f]);
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', `${files.map((_, i) => `[${i}:v]scale='min(iw,450)':-2,pad=iw+4:ih:0:0:gray[v${i}]`).join(';')};${files.map((_, i) => `[v${i}]`).join('')}hstack=inputs=${files.length}`, stripFile]);
  return `${files.length} frames, ${Math.round(end)}ms`;
}

(async () => {
  const browser = await chromium.launch();
  const ids = only ? only.split(',') : Object.keys(actions);
  for (const id of ids) {
    for (const reduced of [false, true]) {
      try { console.log(id, reduced ? 'reduced' : 'normal', await strip(browser, id, reduced)); } catch (e) { console.log(id, reduced ? 'reduced' : 'normal', 'FAIL', e.message.split('\n')[0]); }
    }
  }
  await browser.close();
})();
