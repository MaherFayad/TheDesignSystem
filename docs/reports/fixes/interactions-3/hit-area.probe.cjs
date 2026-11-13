// Hit area probe for order 1.29 (review B10, WCAG 2.5.8). On a phone viewport
// (390 by 844, touch), for the button family on iOS (44pt) and Android
// (48dp): every visible root drawn smaller than the target on an axis is
// hit tested 1px inside the target area on that axis (both ends), with
// elementFromPoint. A point passes when it lands on the root or inside it;
// a point that lands on another control is "claimed" (the spacing case, not
// a dead area); anything else is dead. It also reads the glow layer
// (::before) of each root: the glow must keep the control's box.
//
//   node hit-area.probe.cjs --out <file.json> [--base <url>] [--style neutral]
// Run it on a production build (vite build, vite preview): a dev server
// reloads demos while other files change, which shows as skipped roots.
// Exit code 1 when a point is dead or a glow is larger than its control.
const { chromium } = require('playwright');
const fs = require('fs');

const args = process.argv.slice(2);
const opt = { out: 'hit-area.json', base: 'http://127.0.0.1:5182', style: 'neutral' };
for (let i = 0; i < args.length; i += 2) opt[args[i].replace(/^--/, '')] = args[i + 1];

const COMPONENTS = [
  ['button', 'button'],
  ['icon-button', 'icon-button'],
  ['close-button', 'close-button'],
  ['copy-button', 'copy-button'],
  ['toggle-button', 'toggle-button'],
  ['floating-action-button', 'floating-action-button'],
];
const PLATFORMS = [
  ['ios', 44],
  ['android', 48],
];

(async () => {
  const browser = await chromium.launch();
  const rows = [];
  let failed = false;
  for (const [platform, target] of PLATFORMS) {
    for (const [slug, ds] of COMPONENTS) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      await page.goto(`${opt.base}/c/${slug}?platform=${platform}&style=${opt.style}&scheme=light`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      const row = await page.evaluate(
        async ({ ds, target }) => {
          const roots = [...document.querySelectorAll(`[data-ds='${ds}']`)].filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
          });
          const out = { roots: roots.length, skipped: 0, small: 0, points: 0, pass: 0, claimed: 0, dead: 0, glowGrows: 0, deadExamples: [], claimedExamples: [] };
          const name = (el) => `${el.getAttribute('data-ds')}${el.getAttribute('data-part') ? `[${el.getAttribute('data-part')}]` : ''} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}"`;
          for (const root of roots) {
            root.scrollIntoView({ block: 'center', inline: 'center' });
            await new Promise((r) => requestAnimationFrame(() => r()));
            const r = root.getBoundingClientRect();
            // A root that left the page or folded away while scrolling (a demo that re-rendered) is not measured.
            if (!root.isConnected || r.width < 1 || r.height < 1) {
              out.skipped += 1;
              continue;
            }
            // The glow layer keeps the control's box (review B10: it must not grow with the hit inset).
            const before = getComputedStyle(root, '::before');
            if (before.content !== 'none' && before.display !== 'none') {
              const bw = Number.parseFloat(before.width);
              const bh = Number.parseFloat(before.height);
              if (bw > root.offsetWidth + 0.5 || bh > root.offsetHeight + 0.5) out.glowGrows += 1;
            }
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const pts = [];
            if (r.height < target - 0.5) pts.push([cx, cy - target / 2 + 1], [cx, cy + target / 2 - 1]);
            if (r.width < target - 0.5) pts.push([cx - target / 2 + 1, cy], [cx + target / 2 - 1, cy]);
            if (!pts.length) continue;
            out.small += 1;
            for (const [x, y] of pts) {
              if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
              out.points += 1;
              const hit = document.elementFromPoint(x, y);
              if (hit && (hit === root || root.contains(hit))) out.pass += 1;
              else if (hit && hit.closest('button, a, [role=button], input, [tabindex]')) {
                out.claimed += 1;
                if (out.claimedExamples.length < 3) out.claimedExamples.push(`${name(root)} at ${Math.round(x)},${Math.round(y)} -> ${hit.tagName.toLowerCase()}${hit.getAttribute('data-ds') ? `[${hit.getAttribute('data-ds')}]` : ''}`);
              } else {
                out.dead += 1;
                if (out.deadExamples.length < 3) out.deadExamples.push(`${name(root)} ${Math.round(r.width)}x${Math.round(r.height)} at ${Math.round(x)},${Math.round(y)} -> ${hit ? hit.tagName.toLowerCase() + (hit.getAttribute('data-part') ? `[${hit.getAttribute('data-part')}]` : '') : 'nothing'}`);
              }
            }
          }
          return out;
        },
        { ds, target },
      );
      const platformAttr = await page.evaluate(() => document.documentElement.getAttribute('data-platform') || document.querySelector('[data-platform]')?.getAttribute('data-platform') || null);
      rows.push({ component: slug, platform, target, dataPlatform: platformAttr, ...row });
      if (row.dead > 0 || row.glowGrows > 0) failed = true;
      console.log(`${platform} ${slug}: small ${row.small}, points ${row.points}, pass ${row.pass}, claimed ${row.claimed}, dead ${row.dead}, glow grows ${row.glowGrows}`);
      await ctx.close();
    }
  }
  fs.writeFileSync(opt.out, JSON.stringify({ viewport: '390x844 touch', base: opt.base, style: opt.style, rule: '1px inside the target area on each axis the control is shorter on', rows }, null, 2) + '\n');
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
