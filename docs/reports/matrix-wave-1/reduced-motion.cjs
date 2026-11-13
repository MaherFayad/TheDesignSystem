// Reduced motion probe (order 1.17b, part 9). For every interaction on
// /interactions, in each style, with `prefers-reduced-motion: reduce`
// emulated, it opens the stage alone (`/interactions?focus=<id>`), samples
// `document.getAnimations()` on every frame from the first paint, presses
// the stage's first trigger after 700ms (or plays the drive below), and
// keeps sampling for 1500ms. An animation counts when its active duration is
// over 1ms. It is a mover when a property it animates changes place, size
// or shape (transform, translate, scale, rotate, clip-path, offsets, inset,
// width, height, margin, padding, stroke drawing, background position, or a
// custom property, which may drive any of those); colour, opacity, filter
// and shadow changes are fades. Inline style writes that carry a transform,
// translate, scale or rotate (motion driven from script, outside
// getAnimations) are counted too.
//
//   node docs/reports/matrix-wave-1/reduced-motion.cjs --base http://localhost:5192 \
//     --styles studio,desk,neutral,liquid --out reduced-motion.json [--ids a,b] [--jobs 3]
//     [--motion full]   (the control run: motion on, so the probe must find movers)
//
// Exits 1 when any mover is found.
const { chromium } = require('playwright');
const fs = require('node:fs');

const args = process.argv.slice(2);
const opt = { base: 'http://localhost:5192', styles: 'studio,desk,neutral,liquid', out: 'reduced-motion.json', ids: '', jobs: '3', scheme: 'light', motion: 'reduce' };
for (let i = 0; i < args.length; i += 2) opt[args[i].replace(/^--/, '')] = args[i + 1];

const MOVING = /^(transform|translate|scale|rotate|clip-path|offset|offset-.*|inset|inset-.*|top|left|right|bottom|width|height|min-.*|max-.*|margin.*|padding.*|stroke-dashoffset|stroke-dasharray|background-position.*|--.*|d|x|y|r|cx|cy|grid-template-.*|font-size|letter-spacing|line-height|border-.*-width|border-width|gap|row-gap|column-gap)$/;

// The same drives as the round 3 perf probe, where one press is not the trigger.
const ACTION = {
  'switch-drag': async (page) => {
    const b = await page.locator('[data-interaction-trigger]').first().boundingBox();
    const y = b.y + b.height / 2;
    await page.mouse.move(b.x + 6, y);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(b.x + 6 + ((b.width - 12) * i) / 12, y);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
  },
  'focus-glow': async (page) => {
    await page.keyboard.press('Tab');
  },
};

function sampler() {
  window.__rm = { anims: new Map(), writes: [] };
  const key = (a) => {
    const t = a.effect && a.effect.target;
    const who = t ? `${t.tagName.toLowerCase()}${t.getAttribute('data-ds') ? `[data-ds=${t.getAttribute('data-ds')}]` : ''}${t.getAttribute('data-part') ? `[data-part=${t.getAttribute('data-part')}]` : ''}${a.effect.pseudoElement || ''}` : 'no target';
    let props = [];
    try {
      props = a.transitionProperty ? [a.transitionProperty] : [...new Set(a.effect.getKeyframes().flatMap((k) => Object.keys(k)))].filter((p) => !['offset', 'easing', 'composite', 'computedOffset'].includes(p));
    } catch {}
    const kind = a.transitionProperty ? 'transition' : a.animationName ? `animation ${a.animationName}` : 'script';
    return { id: `${kind}|${who}|${props.join(',')}`, who, kind, props };
  };
  const tick = () => {
    for (const a of document.getAnimations()) {
      let dur = 0;
      try {
        dur = a.effect.getComputedTiming().activeDuration;
      } catch {}
      if (!(dur > 1) || a.playState !== 'running') continue;
      const k = key(a);
      const prev = window.__rm.anims.get(k.id);
      window.__rm.anims.set(k.id, { ...k, durationMs: Math.round(Math.max(dur, prev ? prev.durationMs : 0)), frames: (prev ? prev.frames : 0) + 1 });
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  new MutationObserver((list) => {
    for (const m of list) {
      const v = (m.target.getAttribute && m.target.getAttribute('style')) || '';
      const pick = (s) => (s || '').split(';').filter((d) => /^\s*(transform|translate|scale|rotate)\s*:/.test(d)).join(';').trim();
      if (m.target.closest && m.target.closest('[data-gallery="pointer-dot"]')) continue; // the gallery's pointer marker, not the stage
      const now = pick(v);
      if (now && now !== pick(m.oldValue)) window.__rm.writes.push(`${m.target.tagName.toLowerCase()}${m.target.getAttribute('data-ds') ? `[data-ds=${m.target.getAttribute('data-ds')}]` : ''}${m.target.getAttribute('data-part') ? `[data-part=${m.target.getAttribute('data-part')}]` : ''}${m.target.getAttribute('data-gallery') ? `[data-gallery=${m.target.getAttribute('data-gallery')}]` : ''} ${now.slice(0, 60)}`);
    }
  }).observe(document, { attributes: true, attributeFilter: ['style'], attributeOldValue: true, subtree: true });
}

async function one(browser, style, id) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: opt.motion === 'full' ? 'no-preference' : 'reduce' });
  const page = await ctx.newPage();
  await page.addInitScript(sampler);
  try {
    await page.goto(`${opt.base}/interactions?focus=${id}&style=${style}&scheme=${opt.scheme}&chrome=0`, { waitUntil: 'load' });
    await page.waitForSelector('[data-interaction-stage]', { timeout: 15000 });
    await page.waitForTimeout(700);
    let action = 'press';
    try {
      if (ACTION[id]) await ACTION[id](page);
      else if (await page.locator('[data-interaction-trigger]').count()) await page.locator('[data-interaction-trigger]').first().click({ timeout: 4000 });
      else action = 'first paint only';
    } catch (e) {
      action = `trigger failed: ${e.message.split('\n')[0]}`;
    }
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => ({ anims: [...window.__rm.anims.values()], writes: [...new Set(window.__rm.writes)] }));
    const movers = r.anims.filter((a) => a.props.some((p) => MOVING.test(p)) || a.props.length === 0);
    const fades = r.anims.filter((a) => !movers.includes(a));
    return { id, style, action, movers, fades, styleWrites: r.writes };
  } catch (e) {
    return { id, style, error: e.message.split('\n')[0] };
  } finally {
    await ctx.close();
  }
}

(async () => {
  const browser = await chromium.launch();
  let ids = opt.ids ? opt.ids.split(',') : [];
  if (!ids.length) {
    const p = await browser.newPage();
    await p.goto(`${opt.base}/interactions?chrome=0`);
    await p.waitForSelector('article[data-interaction]');
    ids = await p.$$eval('article[data-interaction]', (els) => els.map((e) => e.getAttribute('data-interaction')));
    await p.close();
  }
  const jobs = [];
  for (const style of opt.styles.split(',')) for (const id of ids) jobs.push([style, id]);
  const rows = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Number(opt.jobs) }, async () => {
      while (next < jobs.length) {
        const [style, id] = jobs[next++];
        const row = await one(browser, style, id);
        rows.push(row);
        if (row.error || row.movers.length || row.styleWrites.length) console.log(JSON.stringify({ id, style, error: row.error, movers: row.movers && row.movers.map((m) => `${m.kind} ${m.who} ${m.props.join(',')} ${m.durationMs}ms`), styleWrites: row.styleWrites }));
      }
    }),
  );
  rows.sort((a, b) => (a.id + a.style).localeCompare(b.id + b.style));
  const movers = rows.filter((r) => r.movers && r.movers.length);
  fs.writeFileSync(opt.out, `${JSON.stringify({ base: opt.base, scheme: opt.scheme, reducedMotion: opt.motion === 'full' ? 'no-preference' : 'reduce', interactions: ids.length, styles: opt.styles.split(','), runs: rows.length, withMovers: movers.length, errors: rows.filter((r) => r.error).length, rows }, null, 2)}\n`);
  console.log(`${rows.length} runs, ${ids.length} interactions, ${movers.length} with a mover, ${rows.filter((r) => r.error).length} errors`);
  await browser.close();
  process.exit(movers.length ? 1 : 0);
})();
