// Lead check (asked by the lead session): what the switch looks like at each
// moment of its toggle at normal speed. Presses the first switch, holds 120ms
// (the anticipation), releases, then pauses every animation at t and draws the
// switch at 4x. Also reads the thumb and fill state at each t.
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const OUT = __dirname;
const TS = [0, 20, 40, 60, 80, 100, 140, 180, 220, 300, 440];
(async () => {
  const b = await chromium.launch();
  const all = {};
  const rows = [];
  for (const style of ['studio', 'desk', 'neutral']) {
    const scheme = style === 'neutral' ? 'light' : 'dark';
    all[style] = [];
    const tiles = [];
    for (const t of TS) {
      const ctx = await b.newContext({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 4 });
      const p = await ctx.newPage();
      await p.goto(`http://127.0.0.1:5190/interactions?focus=switch-stretch&style=${style}&scheme=${scheme}&chrome=0`, { waitUntil: 'networkidle' });
      await p.waitForTimeout(300);
      const sw = p.locator("[data-ds='switch']").first();
      const ctl = sw.locator("[data-part='control']");
      const box = await ctl.boundingBox();
      await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await p.mouse.down();
      await p.waitForTimeout(150);
      await p.mouse.up();
      const info = await p.evaluate((t) => {
        const anims = document.getAnimations();
        anims.forEach((a) => { a.pause(); a.currentTime = t; });
        const q = (s) => document.querySelector(s);
        const thumb = q("[data-ds='switch'] [data-part='thumb']");
        const track = q("[data-ds='switch'] [data-part='track']");
        const fill = track && [...track.children].find((c) => c.getAttribute('data-part') !== 'thumb');
        const cs = (el, pe) => el ? getComputedStyle(el, pe) : null;
        const fb = cs(track, '::before');
        return {
          t,
          checked: q("[data-ds='switch'] [role='switch']")?.getAttribute('aria-checked'),
          anims: anims.map((a) => ({ prop: a.transitionProperty, target: (a.effect.target?.getAttribute?.('data-part') || a.effect.target?.tagName) + (a.effect.pseudoElement || ''), dur: a.effect.getComputedTiming().duration, progress: +(a.effect.getComputedTiming().progress ?? 1).toFixed(3) })),
          thumb: { transform: cs(thumb).transform, bg: cs(thumb).backgroundColor, rect: thumb.getBoundingClientRect().width.toFixed(1) },
          trackBg: cs(track).backgroundColor,
          fillLayer: fill ? { opacity: cs(fill).opacity, transform: cs(fill).transform, bg: cs(fill).backgroundColor } : null,
          trackBefore: fb ? { opacity: fb.opacity, transform: fb.transform, bg: fb.backgroundColor, content: fb.content } : null,
        };
      }, t);
      all[style].push(info);
      const f = `/tmp/claude-0/sw-${style}-${t}.png`;
      await sw.screenshot({ path: f });
      tiles.push(f);
      await ctx.close();
    }
    const row = `/tmp/claude-0/sw-row-${style}.png`;
    const args = ['-v', 'error', '-y'];
    tiles.forEach((f) => args.push('-i', f));
    args.push('-filter_complex', tiles.map((_, i) => `[${i}:v]scale=-1:120[s${i}]`).join(';') + ';' + tiles.map((_, i) => `[s${i}]`).join('') + `hstack=inputs=${tiles.length}`, row);
    execFileSync('ffmpeg', args);
    rows.push(row);
  }
  const args = ['-v', 'error', '-y'];
  rows.forEach((f) => args.push('-i', f));
  args.push('-filter_complex', rows.map((_, i) => `[${i}:v]`).join('') + `vstack=inputs=${rows.length}`, path.join(OUT, 'lead-switch-stretch.frames.png'));
  execFileSync('ffmpeg', args);
  fs.writeFileSync(path.join(OUT, 'lead-switch-stretch.frames.json'), JSON.stringify({ times: TS, note: 'rows studio dark, desk dark, neutral light; columns the times after release', runs: all }, null, 1));
  await b.close();
})();
