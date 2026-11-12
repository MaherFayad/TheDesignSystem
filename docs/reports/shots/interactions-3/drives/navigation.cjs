// Drives of the navigation family for the round 3 recorder (order 1.23).
// See ../record.cjs for the api. Each drive presses the items themselves, so
// the sheet shows the pill travel and the ink under it, not the play button.
const STAGE = '[data-interaction-stage]';

/** The centre of the nth element that matches, in frame px. */
async function centre(page, selector, n = 0) {
  const b = await page.locator(selector).nth(n).boundingBox();
  return b ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : null;
}

/** Hover, press and release one item, with a beat marked at the press. */
async function pressAt(a, p, hold = 120, after = 520) {
  if (!p) return;
  await a.hover(p, 8);
  await a.wait(160);
  await a.press(p, hold);
  await a.wait(after);
}

module.exports = {
  'tab-slide': {
    region: STAGE,
    drive: async (a) => {
      const { page } = a;
      // Soft tabs: a long hop, then back one.
      await pressAt(a, await centre(page, "[data-ds='tabs'][data-emphasis='soft'] [role='tab']", 2));
      await pressAt(a, await centre(page, "[data-ds='tabs'][data-emphasis='soft'] [role='tab']", 1));
      // Segmented control and the toggle group.
      await pressAt(a, await centre(page, "[data-ds='segmented-control'] [data-part='item']", 2));
      await pressAt(a, await centre(page, "[data-ds='toggle-group'] [data-part='item']", 0));
      // Keyboard on the ghost tabs.
      await page.locator("[data-ds='tabs'][data-emphasis='ghost'] [role='tab'][data-state='active']").first().focus();
      await a.key('ArrowRight');
      await a.wait(500);
    },
  },
  'nav-current-slide': {
    region: STAGE,
    drive: async (a) => {
      const { page } = a;
      await pressAt(a, await centre(page, "[data-ds='sidebar'] [data-part='item']", 3), 120, 600);
      await pressAt(a, await centre(page, "[data-ds='rail'] [data-part='item']", 0), 120, 600);
      await pressAt(a, a.at, 120, 600);
    },
  },
  'nav-hover-follow': {
    region: STAGE,
    drive: async (a) => {
      const { page } = a;
      const crumbs = page.locator("[data-ds='breadcrumbs'] a");
      const n = await crumbs.count();
      for (let i = 0; i < n; i++) {
        const p = await centre(page, "[data-ds='breadcrumbs'] a", i);
        if (i === 0 && p) await a.hover(p, 8);
        if (i === 1) a.mark();
        if (p) await a.hover(p, 10);
        await a.wait(260);
      }
      const rows = page.locator("[data-ds='sidebar'] [data-part='item']");
      const m = await rows.count();
      for (let i = 0; i < m; i++) {
        const p = await centre(page, "[data-ds='sidebar'] [data-part='item']", i);
        if (i === 1) a.mark();
        if (p) await a.hover(p, 10);
        await a.wait(260);
      }
    },
  },
  'pagination-roll': {
    region: STAGE,
    drive: async (a) => {
      const { page } = a;
      await pressAt(a, await centre(page, "[data-ds='pagination'] [data-part='next']", 0), 140, 700);
      await pressAt(a, await centre(page, "[data-ds='pagination'] [data-part='previous']", 0), 140, 700);
      await pressAt(a, a.at, 140, 800);
    },
  },
  'sidebar-collapse': {
    region: STAGE,
    drive: async (a) => {
      await pressAt(a, a.at, 140, 900);
      await pressAt(a, a.at, 140, 900);
    },
  },
  'stepper-travel': {
    region: STAGE,
    drive: async (a) => {
      await pressAt(a, a.at, 140, 900);
      await pressAt(a, a.at, 140, 900);
      const back = await centre(a.page, `${STAGE} [data-ds='button']`, 1);
      await pressAt(a, back, 140, 900);
    },
  },
  'toc-travel': {
    region: STAGE,
  },
  'dock-lift': {
    region: STAGE,
    drive: async (a) => {
      const { page } = a;
      const sel = "[data-ds='dock'] [data-part='item']";
      const n = await page.locator(sel).count();
      for (let i = 0; i < n; i++) {
        const p = await centre(page, sel, i);
        if (i === 0 && p) await a.hover(p, 8);
        if (i === 1) a.mark();
        if (p) await a.hover(p, 12);
        await a.wait(300);
      }
      await pressAt(a, await centre(page, sel, 2), 160, 600);
    },
  },
  'toolbar-press': {
    region: STAGE,
    drive: async (a) => {
      const { page } = a;
      const sel = "[data-ds='toolbar'] [data-part='item']";
      await pressAt(a, await centre(page, sel, 0), 220, 600);
      await pressAt(a, await centre(page, sel, 3), 220, 600);
      await pressAt(a, await centre(page, sel, 3), 220, 600);
    },
  },
  'language-roll': {
    region: STAGE,
    drive: async (a) => {
      await pressAt(a, a.at, 140, 800);
      await pressAt(a, a.at, 140, 800);
    },
  },
};
