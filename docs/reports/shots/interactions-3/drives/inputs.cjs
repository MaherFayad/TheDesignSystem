// Drives of the text inputs and forms family for record.cjs (order 1.23).
// Each drive plays the interaction the way a person would and marks the
// start of each beat the contact sheet shows. See record.cjs for the api.
const STAGE = '[data-interaction-stage]';

const centre = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });
async function box(page, selector, i = 0) {
  return page.locator(selector).nth(i).boundingBox();
}

/** Presses the stage's play button (the trigger) twice, a beat each. */
async function playTwice(a, gap = 1100) {
  await a.hover(a.at, 10);
  await a.wait(200);
  await a.press(a.at, 120);
  await a.wait(gap);
  await a.press(a.at, 120);
  await a.wait(gap);
}

/** Clicks into the first text box of the stage, then types, one beat per key. */
async function typeInto(a, selector, keys, gap = 260) {
  const b = await box(a.page, selector);
  if (!b) return;
  await a.page.mouse.click(b.x + 8, b.y + b.height / 2);
  await a.wait(300);
  for (const k of keys) {
    await a.key(k);
    await a.wait(gap);
  }
}

module.exports = {
  'focus-glow': {
    region: STAGE,
    drive: async (a) => {
      const { page } = a;
      await a.hover(a.at, 10);
      await a.wait(300);
      await a.press(a.at, 100); // focus: ring at once, bloom spreads
      await a.wait(700);
      a.mark(); // tab on: one field blurs, the next blooms
      await page.keyboard.press('Tab');
      await a.wait(700);
      await page.mouse.move(8, 8, { steps: 4 });
      a.mark(); // blur: the halo draws back
      await page.mouse.click(8, 8);
      await a.wait(600);
    },
  },
  'error-shake': { region: STAGE, drive: (a) => playTwice(a) },
  'field-error-enter': { region: STAGE, drive: (a) => playTwice(a) },
  'field-message-enter': { region: STAGE, drive: (a) => playTwice(a) },
  'field-label-focus': {
    region: STAGE,
    drive: async (a) => {
      await a.press(a.at, 100);
      await a.wait(700);
      a.mark();
      await a.page.mouse.click(8, 8);
      await a.wait(600);
    },
  },
  'password-reveal': { region: STAGE, drive: (a) => playTwice(a, 900) },
  'search-clear': { region: STAGE, drive: (a) => playTwice(a, 900) },
  'search-submit': { region: STAGE, drive: (a) => playTwice(a, 900) },
  'otp-fill': {
    region: STAGE,
    drive: async (a) => {
      await typeInto(a, `${STAGE} [data-ds='otp-field']`, ['4', '8', '2']);
      await a.wait(300);
      // A paste lands as one run.
      await a.press(a.at, 100);
      await a.wait(900);
    },
  },
  'otp-caret': {
    region: STAGE,
    drive: async (a) => {
      await typeInto(a, `${STAGE} [data-ds='otp-field']`, ['7', '3', '9'], 420);
      await a.wait(400);
    },
  },
  'otp-complete': { region: STAGE, drive: (a) => playTwice(a, 900) },
  'field-step': {
    region: STAGE,
    drive: async (a) => {
      const b = await box(a.page, `${STAGE} [data-ds='number-field'] input`);
      if (b) await a.page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
      await a.wait(300);
      for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown']) {
        await a.key(k);
        await a.wait(500);
      }
      // The step button.
      const inc = await box(a.page, `${STAGE} [data-ds='number-field'] [data-part='increment']`);
      if (inc) await a.press(centre(inc), 100);
      await a.wait(600);
    },
  },
  'scrub-roll': {
    region: STAGE,
    drive: async (a) => {
      const h = await box(a.page, `${STAGE} [data-ds='scrub-input'] [data-part='handle'], ${STAGE} [data-ds='scrub-input'] [data-part='label']`);
      if (h) {
        const c = centre(h);
        await a.drag(c, { x: c.x + 60, y: c.y }, { steps: 20, holdMs: 200 });
        await a.wait(600);
      }
      await a.press(a.at, 100);
      await a.wait(600);
    },
  },
  'inline-edit-morph': { region: STAGE, drive: (a) => playTwice(a, 1000) },
  'form-summary-enter': { region: STAGE, drive: (a) => playTwice(a, 1000) },
  'form-submit-success': {
    region: STAGE,
    drive: async (a) => {
      await a.hover(a.at, 10);
      await a.wait(200);
      await a.press(a.at, 120);
      await a.wait(500);
      a.mark(); // the tick draws after the ring
      await a.wait(900);
    },
  },
  'wizard-step': { region: STAGE, drive: (a) => playTwice(a, 1000) },
  'wizard-done': {
    region: STAGE,
    drive: async (a) => {
      await a.press(a.at, 120);
      await a.wait(260);
      a.mark();
      await a.wait(900);
    },
  },
  'consent-check': { region: STAGE, drive: (a) => playTwice(a, 900) },
  'rating-fill': {
    region: STAGE,
    drive: async (a) => {
      const stars = `${STAGE} [data-ds='rating'] [role='radio']`;
      for (const i of [3, 1, 4]) {
        const b = await box(a.page, stars, i);
        if (b) await a.press(centre(b), 100);
        await a.wait(700);
      }
    },
  },
  'rating-preview': {
    region: `${STAGE} [data-ds='rating']`,
    drive: async (a) => {
      const stars = `${STAGE} [data-ds='rating'] [role='radio']`;
      const first = await box(a.page, stars, 0);
      const last = await box(a.page, stars, 4);
      const second = await box(a.page, stars, 1);
      if (!first || !last || !second) return;
      await a.page.mouse.move(first.x - 30, first.y + first.height / 2);
      await a.wait(400);
      a.mark(); // the sweep to the fifth star
      await a.page.mouse.move(last.x + last.width / 2, last.y + last.height / 2, { steps: 2 });
      await a.wait(800);
      a.mark(); // back to the second star: the clips past it close
      await a.page.mouse.move(second.x + second.width / 2, second.y + second.height / 2, { steps: 2 });
      await a.wait(700);
      a.mark(); // pick it
      await a.page.mouse.down();
      await a.page.mouse.up();
      await a.wait(700);
    },
  },
  'slider-pull': {
    region: STAGE,
    drive: async (a) => {
      const t = await box(a.page, `${STAGE} [data-ds='slider'] [role='slider']`);
      if (!t) return;
      const c = centre(t);
      a.mark(); // hover: the halo
      await a.page.mouse.move(c.x, c.y, { steps: 6 });
      await a.wait(500);
      a.mark(); // press: the thumb grows
      await a.page.mouse.down();
      await a.wait(400);
      await a.page.mouse.move(c.x + 50, c.y, { steps: 10 });
      await a.wait(200);
      a.mark(); // release: the bouncy settle
      await a.page.mouse.up();
      await a.wait(600);
    },
  },
  'slider-bubble': {
    region: STAGE,
    drive: async (a) => {
      const t = await box(a.page, `${STAGE} [data-ds='slider'] [role='slider']`);
      if (!t) return;
      const c = centre(t);
      await a.drag(c, { x: c.x + 90, y: c.y }, { steps: 24, holdMs: 400 });
      await a.wait(100);
      a.mark();
      await a.wait(600);
    },
  },
  'slider-fill': {
    region: STAGE,
    drive: async (a) => {
      const tr = await box(a.page, `${STAGE} [data-ds='slider'] [data-part='track']`);
      if (!tr) return;
      const y = tr.y + tr.height / 2;
      await a.press({ x: tr.x + tr.width * 0.85, y }, 80); // a press on the track glides
      await a.wait(700);
      await a.press({ x: tr.x + tr.width * 0.15, y }, 80);
      await a.wait(700);
      await a.page.mouse.move(8, 8, { steps: 4 });
      await a.key('End'); // a key glides too
      await a.wait(700);
    },
  },
  'slider-rubber-band': {
    region: STAGE,
    drive: async (a) => {
      const t = await box(a.page, `${STAGE} [data-ds='slider'] [role='slider']`);
      const tr = await box(a.page, `${STAGE} [data-ds='slider'] [data-part='track']`);
      if (!t || !tr) return;
      const c = centre(t);
      a.mark(); // the drag out past the end
      await a.page.mouse.move(c.x, c.y, { steps: 4 });
      await a.page.mouse.down();
      await a.wait(150);
      await a.page.mouse.move(tr.x + tr.width + 90, c.y, { steps: 16 });
      await a.wait(400);
      a.mark(); // release: it springs back
      await a.page.mouse.up();
      await a.wait(700);
    },
  },
  'slider-nudge': {
    region: STAGE,
    drive: async (a) => {
      await a.loc.focus().catch(() => {});
      const t = a.page.locator(`${STAGE} [data-ds='slider'] [role='slider']`).first();
      await t.focus();
      await a.wait(300);
      await a.key('ArrowRight');
      await a.wait(700);
      await a.key('End');
      await a.wait(600);
    },
  },
};
