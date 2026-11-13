// Drives of the toggles family for the round 3 recorder (order 1.23):
// Switch, Checkbox, CheckboxGroup, RadioGroup, RadioCard and ToggleButton.
// See ../record.cjs for the api. A band is twelve frames 40 ms apart, so each
// beat is marked just before the motion it should show, and a press is held
// long enough for the pressed state to read before the release.
const STAGE = '[data-interaction-stage]';

/** The centre of the nth element that matches, in frame px. */
async function centre(page, selector, n = 0) {
  const b = await page.locator(selector).nth(n).boundingBox();
  return b ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : null;
}

/** Hover, then a press held for `hold` ms, with the beat marked at the press. */
async function pressAt(a, p, hold = 200, after = 560) {
  if (!p) return;
  await a.hover(p, 8);
  await a.wait(180);
  await a.press(p, hold);
  await a.wait(after);
}

/** The thumb of the first switch in the stage, in frame px. */
async function thumb(page) {
  return centre(page, `${STAGE} [data-ds='switch'] [data-part='thumb']`);
}

module.exports = {
  'switch-stretch': {
    drive: async (a) => {
      const { page, at } = a;
      // Hover: the thumb leans.
      a.mark();
      await a.hover(at, 10);
      await a.wait(420);
      // Press held, then release: grow, stretch, travel, sweep.
      await a.press(at, 260);
      await a.wait(600);
      // Back to off.
      await a.press(at, 260);
      await a.wait(600);
      // Keyboard on.
      await page.mouse.move(8, 8, { steps: 4 });
      await a.loc.focus();
      await a.wait(200);
      await a.key('Space');
      await a.wait(700);
    },
  },
  'switch-drag': {
    drive: async (a) => {
      const { page, at } = a;
      const t = await thumb(page);
      if (!t) return;
      const box = await a.loc.boundingBox();
      const end = { x: box.x + box.width + box.width * 0.35, y: t.y };
      // Drag on, slowly, past the end: the rubber band, then the spring back to the end.
      await a.drag(t, end, { steps: 16, holdMs: 200 });
      await a.wait(700);
      // Drag back a little and let go: it springs back on.
      const on = await thumb(page);
      await a.drag(on, { x: on.x - box.width * 0.18, y: on.y }, { steps: 8, holdMs: 160 });
      await a.wait(700);
      // A short flick off: velocity wins over position.
      const on2 = await thumb(page);
      a.mark();
      await page.mouse.move(on2.x, on2.y, { steps: 4 });
      await page.mouse.down();
      await a.wait(80);
      await page.mouse.move(on2.x - box.width * 0.3, on2.y, { steps: 2 });
      await page.mouse.up();
      await a.wait(700);
      // A tap still toggles.
      await a.press(at, 120);
      await a.wait(700);
    },
  },
  'check-draw': {
    // The single box, drawn large; the select all cascade is in check-mixed.
    drive: async (a) => {
      const { page, at } = a;
      a.mark();
      await a.hover(at, 10);
      await a.wait(420);
      // Check: dip, fill from the centre, the check draws.
      await a.press(at, 220);
      await a.wait(600);
      // Uncheck: the check undraws, faster.
      await a.press(at, 220);
      await a.wait(600);
      // Keyboard.
      await page.mouse.move(8, 8, { steps: 4 });
      await a.loc.focus();
      await a.wait(200);
      await a.key('Space');
      await a.wait(700);
    },
  },
  'check-mixed': {
    region: STAGE,
    drive: async (a) => {
      const { page } = a;
      const item = (n) => centre(page, `${STAGE} [data-ds='checkbox']:not([data-part='select-all']) [data-part='control']`, n);
      const all = () => centre(page, `${STAGE} [data-part='select-all'] [data-part='control']`);
      // One item: select all turns mixed (the dash draws).
      await pressAt(a, await item(0), 160, 560);
      // Select all: the dash bends into a check while the rest cascade in.
      await pressAt(a, await all(), 160, 640);
      // One item off: the check folds back into a dash.
      await pressAt(a, await item(1), 160, 560);
      // Off again: the dash collapses to its centre.
      await pressAt(a, await all(), 160, 400);
      await pressAt(a, await all(), 160, 560);
    },
  },
  'radio-pop': {
    region: STAGE,
    drive: async (a) => {
      const { page } = a;
      const control = (n) => centre(page, `${STAGE} [data-ds='radio-group'] [data-part='control']`, n);
      await pressAt(a, await control(1), 200, 560);
      await pressAt(a, await control(2), 200, 560);
      await pressAt(a, await control(0), 200, 560);
      await page.mouse.move(8, 8, { steps: 4 });
      await page.locator(`${STAGE} [data-ds='radio-group'] [role='radio'][data-state='checked']`).first().focus();
      await a.wait(200);
      await a.key('ArrowDown');
      await a.wait(600);
    },
  },
  'radio-card-lift': {
    region: STAGE,
    drive: async (a) => {
      const { page } = a;
      const card = (n) => centre(page, `${STAGE} [data-ds='radio-card'] [data-part='item']`, n);
      await pressAt(a, await card(0), 220, 640);
      await pressAt(a, await card(1), 220, 640);
      await page.mouse.move(8, 8, { steps: 4 });
      await page.locator(`${STAGE} [data-ds='radio-card'] [role='radio'][data-state='checked']`).first().focus();
      await a.wait(200);
      await a.key('ArrowLeft');
      await a.wait(640);
    },
  },
  'toggle-pop': {
    region: STAGE,
    drive: async (a) => {
      const { page, at } = a;
      // Hover, press held off centre, release on: the fill floods from the press point.
      a.mark();
      await a.hover(at, 10);
      await a.wait(420);
      await a.press({ x: at.x - 14, y: at.y + 2 }, 260);
      await a.wait(600);
      // Off: the fill drains back to the press point.
      await a.press({ x: at.x + 10, y: at.y }, 200);
      await a.wait(600);
      // The icon toggle.
      await pressAt(a, await centre(page, `${STAGE} [data-ds='toggle-button']`, 1), 220, 600);
      // Keyboard, from the centre.
      await page.mouse.move(8, 8, { steps: 4 });
      await a.loc.focus();
      await a.wait(200);
      await a.key('Space');
      await a.wait(700);
    },
  },
};
