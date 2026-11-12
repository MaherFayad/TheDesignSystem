// Measures the height of every preview the docs embed and writes
// src/data/preview-heights.json. The Preview component reserves that height
// before the iframe loads, so the page does not shift when it arrives.
// docs.js still sizes each frame to its content once loaded; the file only
// sets the starting height. Run it after a demo changes a lot:
//
//   npm run build:site -w @the-system/docs
//   npm run serve:site -w @the-system/docs          (in another shell)
//   npx tsx apps/docs/scripts/measure-previews.ts   (SITE_URL, default http://localhost:4400)
//
// Heights are measured at the content width of a desktop page (830px), in
// Neutral light, English.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Page } from '@playwright/test';
import { componentCases, hasGalleryRoute } from './cases.ts';
import { readManifests, slugOf } from './manifests.ts';

const site = (process.env.SITE_URL ?? 'http://localhost:4400').replace(/\/+$/, '');
const out = join(import.meta.dirname, '..', 'src', 'data', 'preview-heights.json');

const HIDE = `[data-gallery='demo-title'],[data-demo='case']>[data-demo='title']{display:none}
html,body,#root,[data-gallery='root']{min-block-size:0;block-size:auto;background:transparent}
[data-gallery='stage']{padding:clamp(16px,3vw,28px)}`;

interface Job {
  key: string;
  url: string;
  width: number;
}

const jobs: Job[] = [];
const q = (extra: Record<string, string>) =>
  new URLSearchParams({ chrome: '0', style: 'neutral', scheme: 'light', platform: 'web', density: 'default', dir: 'ltr', lang: 'en', ...extra }).toString();
for (const m of readManifests()) {
  if (!hasGalleryRoute(m)) continue;
  const slug = slugOf(m.name);
  for (const c of componentCases(m)) jobs.push({ key: `${slug}/${c.id}`, url: `${site}/gallery/c/${slug}?${q({ case: c.id })}`, width: 830 });
}
jobs.push({ key: 'home/form/one', url: `${site}/gallery/c/form?${q({ case: 'one' })}`, width: 340 });
for (const p of ['web', 'ios', 'android']) jobs.push({ key: `platform/rail/${p}`, url: `${site}/gallery/c/rail?${q({ case: 'many', platform: p })}`, width: 340 });

async function measure(page: Page, job: Job): Promise<number | undefined> {
  await page.setViewportSize({ width: job.width, height: 800 });
  await page.goto(job.url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: HIDE });
  await page.waitForTimeout(150);
  const h = await page.evaluate(() => {
    const stage = document.querySelector("[data-gallery='stage']") ?? document.body;
    return Math.ceil(stage.getBoundingClientRect().height);
  });
  return h > 40 ? Math.min(h, 2400) : undefined;
}

const browser = await chromium.launch();
const heights: Record<string, number> = {};
let next = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    const page = await browser.newPage();
    while (next < jobs.length) {
      const job = jobs[next++]!;
      try {
        const h = await measure(page, job);
        if (h) heights[job.key] = h;
      } catch (e) {
        console.warn(`measure: ${job.key} failed: ${(e as Error).message.split('\n')[0]}`);
      }
    }
    await page.close();
  }),
);
await browser.close();
const sorted = Object.fromEntries(Object.entries(heights).sort(([a], [b]) => a.localeCompare(b, 'en')));
writeFileSync(out, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`measure: ${Object.keys(sorted).length} of ${jobs.length} previews measured into ${out}`);
