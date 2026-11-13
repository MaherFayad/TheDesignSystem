// ds-qa review of order 1.22: plays every run of each scenario in each style,
// direction and motion mode, and writes the raw results to a scratch folder.
//   node qa-selection-overlays.measure.cjs <outDir> [ids...]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const L = require('./qa-selection-overlays.lib.cjs');

const outDir = process.argv[2];
const only = process.argv.slice(3);
const ids = only.length ? only : Object.keys(L.scenarios);
const styles = (process.env.STYLES || 'studio,desk,neutral').split(',');
const configs = (process.env.CONFIGS || 'full-ltr,full-rtl,media-ltr,attr-ltr').split(',');
const schemeOf = (s) => process.env.SCHEME || (s === 'neutral' ? 'light' : 'dark');

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  for (const cfg of configs) {
    const [motion, dir] = cfg.split('-');
    for (const style of styles) {
      const ctx = await L.newCtx(browser, { motion });
      const page = await ctx.newPage();
      page.__dir = dir;
      for (const id of ids) {
        const sc = L.scenarios[id];
        const file = path.join(outDir, `${id}.${style}.${cfg}.json`);
        if (fs.existsSync(file) && !process.env.FORCE) continue;
        const res = { id, style, scheme: schemeOf(style), dir, motion, runs: [] };
        try {
          await L.goto(page, { id, style, scheme: schemeOf(style), dir, motion });
          for (const r of sc.runs) {
            try {
              if (r.prep) { await r.prep(page); await L.settle(page); }
              res.runs.push(await L.run(page, r.name, r.act, r));
            } catch (e) {
              res.runs.push({ run: r.name, error: String(e.message || e).slice(0, 300) });
            }
          }
        } catch (e) {
          res.error = String(e.message || e).slice(0, 300);
        }
        fs.writeFileSync(file, JSON.stringify(res, null, 1));
        process.stdout.write(`${id} ${style} ${cfg} ${res.runs.map((r) => r.run + ':' + (r.error ? 'ERR' : r.anims.length)).join(' ')}\n`);
      }
      await ctx.close();
    }
  }
  await browser.close();
})();
