// The folding iPhone checks of the contract suite (order DU4 of
// docs/plan/reset-duo.md). They run only with run.ts --device, once per device
// profile (one Playwright project each, src/fold.ts); a run without --device
// defines no test here.
//
// - The profile took effect on the gallery page: size, safe areas, posture
//   and fold, read from matchMedia and env().
// - Reflow (WCAG 1.4.10) at the profile's size: no sideways scroll, every
//   style, en ltr and ar rtl. With --device duo-outer this is the outer
//   screen's Safari width, 382 by 580.
// - The side column checks of order DU2, on the gallery's Duo screen.
import { expect, test, type Page } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyAndCheck, duoProfile, readDuo, type DuoProfile } from './fold';
import { demoPath, discoverStyles, kebabCase, loadManifests, readyComponents, reflowMatrix, type Axes } from './lib';
import { appliedAxes, reflowAndTitles } from './page';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const framework = process.env.DS_FRAMEWORK ?? 'react';
const only = (process.env.DS_COMPONENT ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const onlyStyles = (process.env.DS_STYLES ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const allStyles = discoverStyles(repo);
const styles = onlyStyles.length ? allStyles.filter((s) => onlyStyles.includes(s.id)) : allStyles;
// The device is an iPhone: the reflow runs on ios unless --platform names another.
const platform = process.env.DS_PLATFORM || 'ios';
const routes = process.env.DS_ROUTES ? (JSON.parse(process.env.DS_ROUTES) as Record<string, boolean>) : undefined;
const components = process.env.DS_DEVICE ? readyComponents(loadManifests(repo), framework, only).filter((m) => !routes || routes[kebabCase(m.name)] !== false) : [];

/** The profile of the running project. Fails when the project is not a device profile. */
function profile(): DuoProfile {
  const p = duoProfile(test.info().project.name);
  if (!p) throw new Error(`project "${test.info().project.name}" is not a device profile`);
  return p;
}

/** Opens a demo, applies the profile and fails when it did not take effect. */
async function openOn(page: Page, kebab: string, axes: Axes, p: DuoProfile): Promise<void> {
  const path = demoPath(kebab, axes);
  await page.goto(path);
  const found = await page
    .locator('[data-demo-case]')
    .first()
    .waitFor({ state: 'attached', timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!found, `no [data-demo-case] at ${path}`);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const { findings } = await applyAndCheck(page, p);
  expect(findings, `device profile ${p.name} on ${path}`).toEqual([]);
}

test.describe.configure({ mode: 'parallel' });

const first = components[0];
if (first) {
  test(`duo profile: size, safe areas, posture and fold take effect on the gallery page`, async ({ page }) => {
    const p = profile();
    await openOn(page, kebabCase(first.name), { platform, dir: 'ltr', lang: 'en' }, p);
    const r = await page.evaluate(readDuo);
    test.info().annotations.push({ type: 'note', description: `${p.name}: ${r.width} by ${r.height} at ${r.dpr}x, safe area ${JSON.stringify(r.safeArea)}, segments ${JSON.stringify(r.segments)}, posture ${r.postureMedia}` });
    const applied = await page.evaluate(appliedAxes);
    expect(applied.platform, 'the page applies ios on the device profile').toBe(platform);
  });
}

for (const m of components) {
  const kebab = kebabCase(m.name);
  const name = m.name;

  for (const axes of reflowMatrix(styles, [platform])) {
    test(`${name}: no sideways scroll at the device size, ${axes.style} ${axes.platform} ${axes.lang} ${axes.dir}`, async ({ page }) => {
      const p = profile();
      await openOn(page, kebab, axes, p);
      const r = await page.evaluate(reflowAndTitles);
      const failures = r.overflow > 1 ? [`page scrolls sideways by ${r.overflow}px at ${p.viewport.width} by ${p.viewport.height} (${p.name})`, ...r.wide] : [];
      expect(failures, `${name} reflow on ${p.name} at ${page.url()}`).toEqual([]);
    });
  }
}

// The side column of order DU2 (plan section 5, platform/ios-shell.css). These
// open the gallery's Duo screen (/platforms/duo/screen), a PageShell with a
// Navbar, a TabBar and a Sheet, at the profile's size, with placement left on
// auto, so they prove the auto rule as well as the column: the column when the
// shell is at least 440 wide and at most 700 tall, the bottom bar otherwise.
// The column sits on the physical right in both reading directions.

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The gallery frame and mode that stand for a profile. */
function screenQuery(p: DuoProfile, dir: 'ltr' | 'rtl', view: 'settings' | 'sheet' = 'settings'): string {
  const fold = p.mode === 'folded' ? 'folded-' : '';
  const orient = p.mode === 'split' ? 'portrait' : p.orientation;
  const q = new URLSearchParams({
    style: 'liquid',
    scheme: 'light',
    platform: 'ios',
    chrome: '0',
    dir,
    lang: dir === 'rtl' ? 'ar' : 'en',
    frame: `${p.screen}-${fold}${orient}`,
    mode: p.mode === 'safari' || p.mode === 'split' ? 'safari' : 'full',
    view,
  });
  return `/platforms/duo/screen?${q.toString()}`;
}

/** Whether auto gives the side column at this size (plan 5.1). */
function sideAt(width: number, height: number): boolean {
  return width >= 440 && height <= 700;
}

async function openScreen(page: Page, p: DuoProfile, dir: 'ltr' | 'rtl', view: 'settings' | 'sheet' = 'settings'): Promise<void> {
  const path = screenQuery(p, dir, view);
  await page.goto(path);
  const found = await page
    .locator("[data-ds='page-shell'] [data-ds='tab-bar']")
    .first()
    .waitFor({ state: 'visible', timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!found, `no Duo screen at ${path}`);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const { findings } = await applyAndCheck(page, p);
  expect(findings, `device profile ${p.name} on ${path}`).toEqual([]);
  if (view === 'sheet') await page.locator("[data-ds='sheet'] > [data-part='panel']").first().waitFor({ state: 'visible', timeout: 10_000 });
  // Let entry motion settle before reading boxes.
  await page.waitForTimeout(600);
}

async function box(page: Page, selector: string): Promise<Box> {
  return page.locator(selector).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
}

const TAB = "[data-ds='page-shell'] [data-ds='tab-bar']";
const END = "[data-ds='page-shell'] [data-ds='navbar'] > [data-part='end']";

const du2: Record<string, { title: string; run: (page: Page, p: DuoProfile) => Promise<void> }[]> = {
  TabBar: [
    {
      title: 'takes the side column at the physical right on the side profiles under auto, in English and Arabic',
      run: async (page, p) => {
        test.skip(!sideAt(p.viewport.width, p.viewport.height), `${p.name} keeps the bottom bar`);
        for (const dir of ['ltr', 'rtl'] as const) {
          await openScreen(page, p, dir);
          const tab = await box(page, TAB);
          const { width, height } = p.viewport;
          expect(tab.h, `${dir}: the tab bar is a column, taller than wide`).toBeGreaterThan(tab.w);
          expect(tab.x + tab.w, `${dir}: the tab bar is in the column at the right edge`).toBeGreaterThan(width - 84);
          expect(tab.x, `${dir}: the tab bar is in the column at the right edge`).toBeGreaterThanOrEqual(width - Math.max(84, p.safeArea.right) - 1);
          // In landscape the camera's end of the column (the side inset) stays clear under the bar.
          expect(tab.y + tab.h, `${dir}: the tab bar sits at the bottom of the column`).toBeGreaterThanOrEqual(height - Math.max(84, p.safeArea.right, p.safeArea.left, p.safeArea.bottom) - 1);
        }
      },
    },
    {
      title: 'stays a bottom capsule on duo-outer-portrait-safari, duo-inner-portrait-safari and duo-inner-split-safari',
      run: async (page, p) => {
        test.skip(sideAt(p.viewport.width, p.viewport.height), `${p.name} takes the column`);
        await openScreen(page, p, 'ltr');
        const tab = await box(page, TAB);
        expect(tab.w, 'the tab bar is a row, wider than tall').toBeGreaterThan(tab.h);
        expect(tab.y + tab.h, 'the tab bar sits at the bottom').toBeGreaterThan(p.viewport.height - 60);
        const placement = await page.locator(TAB).first().getAttribute('data-placement');
        expect(placement, 'auto stamps nothing').toBeNull();
      },
    },
    {
      title: 'column items are 48 by 48, inside the screen and clear of its edge',
      run: async (page, p) => {
        test.skip(!sideAt(p.viewport.width, p.viewport.height), `${p.name} keeps the bottom bar`);
        for (const dir of ['ltr', 'rtl'] as const) {
          await openScreen(page, p, dir);
          const items = await page.locator(`${TAB} > [data-part='item']`).evaluateAll((els) =>
            els.map((el) => {
              const r = el.getBoundingClientRect();
              const label = el.querySelector("[data-part='item-label']");
              return { x: r.x, y: r.y, w: r.width, h: r.height, name: el.textContent ?? '', labelDisplay: label ? getComputedStyle(label).display : 'none' };
            }),
          );
          expect(items.length).toBeGreaterThan(0);
          for (const it of items) {
            expect(it.w, `${dir} ${it.name}: 48 wide`).toBeGreaterThanOrEqual(48);
            expect(it.h, `${dir} ${it.name}: 48 tall`).toBeGreaterThanOrEqual(48);
            expect(it.x + it.w, `${dir} ${it.name}: 12 or more from the right edge`).toBeLessThanOrEqual(p.viewport.width - 12);
            expect(it.labelDisplay, `${dir} ${it.name}: the label is hidden from view, not removed`).not.toBe('none');
          }
          // Each item's name still carries its label.
          const names = await page.locator(`${TAB} > [data-part='item']`).evaluateAll((els) => els.map((el) => (el.textContent ?? '').trim()));
          for (const n of names) expect(n.length, 'the item keeps its label as its name').toBeGreaterThan(0);
          // The scroll box of the bar may be shorter than the bar on a short shell; every item is reached by scrolling it, never cut off.
          const scroll = await page.locator(TAB).first().evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight, oy: getComputedStyle(el).overflowY }));
          if (scroll.sh > scroll.ch + 1) expect(scroll.oy, 'a column too short for its tabs scrolls').toBe('auto');
        }
      },
    },
  ],
  Navbar: [
    {
      title: 'actions join the side column, title stays at the top of the content',
      run: async (page, p) => {
        test.skip(!sideAt(p.viewport.width, p.viewport.height), `${p.name} keeps the top bar`);
        for (const dir of ['ltr', 'rtl'] as const) {
          await openScreen(page, p, dir);
          const end = await box(page, END);
          const tab = await box(page, TAB);
          const brand = await box(page, "[data-ds='page-shell'] [data-ds='navbar'] > [data-part='brand']");
          const { width } = p.viewport;
          expect(end.h, `${dir}: the actions are a column`).toBeGreaterThan(end.w);
          expect(end.x, `${dir}: the actions are in the column at the right`).toBeGreaterThanOrEqual(width - Math.max(84, p.safeArea.right) - 1);
          expect(end.y + end.h, `${dir}: the actions sit above the tab bar`).toBeLessThanOrEqual(tab.y);
          expect(brand.y, `${dir}: the title stays at the top`).toBeLessThan(120);
          expect(brand.x + brand.w, `${dir}: the title stays beside the column`).toBeLessThanOrEqual(width - 84);
          const buttons = await page.locator(`${END} > *`).evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => ({ w: r.width, h: r.height })));
          for (const b of buttons) {
            expect(b.w).toBeGreaterThanOrEqual(48);
            expect(b.h).toBeGreaterThanOrEqual(48);
          }
        }
      },
    },
  ],
  PageShell: [
    {
      title: 'content and scroll padding at the column side, nothing runs under it, focus never lands under it',
      run: async (page, p) => {
        test.skip(!sideAt(p.viewport.width, p.viewport.height), `${p.name} keeps the bottom bar`);
        for (const dir of ['ltr', 'rtl'] as const) {
          await openScreen(page, p, dir);
          const main = await box(page, "[data-ds='page-shell'] > [data-part='main']");
          const tab = await box(page, TAB);
          const end = await box(page, END);
          const columnStart = Math.min(tab.x, end.x);
          expect(main.x + main.w, `${dir}: main stops before the column`).toBeLessThanOrEqual(columnStart + 0.5);
          // WCAG 2.4.11: move focus through main; no focused control is under the column.
          const hidden = await page.evaluate(
            ({ columnStart }) => {
              const out: string[] = [];
              const main = document.querySelector("[data-ds='page-shell'] > [data-part='main']");
              if (!main) return ['no main'];
              const els = Array.from(main.querySelectorAll<HTMLElement>('a[href], button, input, [tabindex]:not([tabindex="-1"])')).filter(
                (el) => !el.closest("[data-ds='tab-bar'], [data-ds='navbar'] > [data-part='end']") && el.getClientRects().length > 0,
              );
              for (const el of els) {
                el.focus();
                const r = el.getBoundingClientRect();
                if (r.right > columnStart + 0.5) out.push(`${el.tagName} ${el.textContent?.trim().slice(0, 30)} ends at ${Math.round(r.right)}, column starts at ${Math.round(columnStart)}`);
              }
              return out;
            },
            { columnStart },
          );
          expect(hidden, `${dir}: focus under the column`).toEqual([]);
        }
      },
    },
    {
      title: 'on a 256 tall landscape shell the column never covers or clips a control (WCAG 1.4.10)',
      run: async (page, p) => {
        test.skip(p.name !== 'duo-outer-landscape-safari', 'one short landscape profile is enough');
        await page.setViewportSize({ width: p.viewport.width, height: 256 });
        await openScreen(page, { ...p, viewport: { width: p.viewport.width, height: 256 } }, 'ltr');
        const tab = await box(page, TAB);
        const end = await box(page, END);
        expect(end.y + end.h, 'the actions and the tab bar do not overlap').toBeLessThanOrEqual(tab.y + 0.5);
        expect(tab.y + tab.h, 'the tab bar stays on the screen').toBeLessThanOrEqual(256 + 0.5);
        const scroll = await page.locator(TAB).first().evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight, oy: getComputedStyle(el).overflowY }));
        if (scroll.sh > scroll.ch + 1) expect(scroll.oy, 'the column scrolls instead of clipping').toBe('auto');
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, 'no sideways scroll').toBeLessThanOrEqual(1);
      },
    },
  ],
  Sheet: [
    {
      title: 'sits 8 in from the screen edges on the device sizes, a card in inner landscape, off the fold when folded',
      run: async (page, p) => {
        const { width, height } = p.viewport;
        for (const dir of ['ltr', 'rtl'] as const) {
          await openScreen(page, p, dir, 'sheet');
          const panel = await box(page, "[data-ds='sheet'] > [data-part='panel']");
          if (width <= 440) {
            // A phone sized page (Safari on the outer screen, a split window): the M1 sheet, edge to edge.
            expect(panel.x, `${dir}: edge to edge at ${width}`).toBeLessThanOrEqual(0.5);
            continue;
          }
          const card = width >= 768 && height > 500 && height <= 700;
          const outer = height <= 700 && !card;
          const left = outer ? 0 : dir === 'ltr' ? p.safeArea.left : p.safeArea.left;
          const right = outer ? 0 : p.safeArea.right;
          expect(height - (panel.y + panel.h), `${dir}: 8 or the bottom inset above the bottom edge`).toBeGreaterThanOrEqual(Math.max(8, p.safeArea.bottom) - 0.5);
          expect(panel.x, `${dir}: 8 in from the left edge`).toBeGreaterThanOrEqual(8 + left - 0.5);
          expect(panel.x + panel.w, `${dir}: 8 in from the right edge`).toBeLessThanOrEqual(width - 8 - right + 0.5);
          if (p.fold?.orientation === 'vertical') {
            const bandStart = p.fold.offset;
            const bandEnd = p.fold.offset + p.fold.mask;
            const clear = panel.x + panel.w <= bandStart || panel.x >= bandEnd;
            expect(clear, `${dir}: the card keeps off the fold band (${bandStart} to ${bandEnd}), at ${Math.round(panel.x)} to ${Math.round(panel.x + panel.w)}`).toBe(true);
          } else if (p.fold?.orientation === 'horizontal') {
            expect(panel.y, `${dir}: the sheet stays in the bottom segment`).toBeGreaterThanOrEqual(p.fold.offset + p.fold.mask - 0.5);
          } else if (card) {
            expect(panel.w, `${dir}: a card, not the full width`).toBeLessThanOrEqual(width * 0.75);
          } else if (!outer) {
            expect(panel.x, `${dir}: full width less 8`).toBeLessThanOrEqual(8 + left + 0.5);
          }
          if (outer) {
            // Its own small column: close at the right, at the top of the panel.
            const close = await box(page, "[data-ds='sheet'] > [data-part='panel'] > [data-part='header'] > [data-part='close']");
            expect(close.x + close.w, `${dir}: close is in the sheet's column at the right`).toBeGreaterThan(panel.x + panel.w - 84);
            expect(close.w, `${dir}: close is 48`).toBeGreaterThanOrEqual(48);
          }
        }
      },
    },
  ],
};
for (const m of components) {
  for (const t of du2[m.name] ?? []) {
    test(`${m.name}: duo ${t.title}`, async ({ page }) => {
      await t.run(page, profile());
    });
  }
}
