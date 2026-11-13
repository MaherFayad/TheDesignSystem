// Drives of the actions family for the round 3 recorder (order 1.23). See the
// header of ../record.cjs for the api. Each drive marks the start of every
// beat the contact sheet should show (at most five bands of twelve frames,
// 40 ms apart). Stages that show a row wrap it in [data-stage-region].
const ROW = '[data-stage-region]';

/** The centre of the nth match of a selector. */
async function centre(page, selector, n = 0) {
  const b = await page.locator(selector).nth(n).boundingBox();
  return b ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : null;
}

/** Moves the pointer away from every control, to the corner of the frame. */
async function away(a, steps = 10) {
  await a.page.mouse.move(8, 532, { steps });
}

module.exports = {
  // Press each size in turn: the sink and the shade grow from sm to lg.
  'button-press': {
    region: ROW,
    drive: async (a) => {
      const n = await a.page.locator('[data-stage-press]').count();
      for (let i = 0; i < n; i++) {
        const p = await centre(a.page, '[data-stage-press]', i);
        if (!p) continue;
        await a.hover(p, 6);
        await a.wait(250);
        await a.press(p, 260);
        await a.wait(450);
      }
      await away(a);
      await a.wait(300);
    },
  },

  // Enter from the start edge, sweep across the face, press, then leave.
  'button-glow': {
    region: ROW,
    drive: async (a) => {
      const b = await a.loc.boundingBox();
      if (!b) return;
      const y = b.y + b.height / 2;
      await a.hover({ x: b.x - 20, y }, 4);
      a.mark();
      await a.hover({ x: b.x + b.width * 0.15, y }, 6);
      await a.hover({ x: b.x + b.width * 0.85, y: b.y + b.height * 0.3 }, 24);
      a.mark();
      await a.hover({ x: b.x + b.width * 0.3, y: b.y + b.height * 0.75 }, 24);
      await a.wait(200);
      await a.press({ x: b.x + b.width * 0.3, y: b.y + b.height * 0.75 }, 260);
      await a.wait(300);
      a.mark();
      await away(a, 6);
      await a.wait(600);
    },
  },

  // Press each segment: the pressed key sinks, the neighbors stay up.
  'segment-press': {
    region: ROW,
    drive: async (a) => {
      for (let i = 0; i < 3; i++) {
        const p = await centre(a.page, '[data-stage-press]', i);
        if (!p) continue;
        await a.hover(p, 6);
        await a.wait(150);
        await a.press(p, 260);
        await a.wait(400);
      }
      const act = await centre(a.page, "[data-ds='split-button'] > [data-part='action']");
      if (act) {
        await a.hover(act, 6);
        await a.press(act, 260);
        await a.wait(500);
      }
    },
  },

  // Press, then catch the way back after the load.
  'button-loading': {
    drive: async (a) => {
      await a.hover(a.at, 10);
      await a.wait(300);
      await a.press(a.at, 140);
      await a.wait(1150);
      a.mark();
      await a.wait(900);
      await away(a);
      await a.wait(300);
    },
  },

  // Rest, press and load, the check draws, back; then the error mark and the shake, back.
  'button-result': {
    region: ROW,
    drive: async (a) => {
      for (let turn = 0; turn < 2; turn++) {
        await a.hover(a.at, 8);
        await a.wait(200);
        if (turn === 0) await a.press(a.at, 160);
        else {
          await a.page.mouse.down();
          await a.wait(160);
          await a.page.mouse.up();
        }
        await a.wait(1000);
        a.mark();
        await away(a, 4);
        await a.wait(1850);
        if (turn === 0) a.mark();
        await a.wait(700);
      }
    },
  },

  // Copy: the glyph closes, the check wipes in, the word rolls; then the way back.
  'copy-swap': {
    region: ROW,
    drive: async (a) => {
      await a.hover(a.at, 10);
      await a.wait(300);
      await a.press(a.at, 140);
      await a.wait(600);
      await away(a, 6);
      await a.wait(1150);
      a.mark();
      await a.wait(900);
      // A second copy, then a quick third: the check draws again each time.
      await a.press(a.at, 120);
      await a.wait(260);
      await a.press(a.at, 120);
      await a.wait(2600);
    },
  },

  // The bubble of the icon only form rises, holds and rises away.
  'copy-bubble': {
    region: ROW,
    drive: async (a) => {
      await a.hover(a.at, 10);
      await a.wait(300);
      await a.press(a.at, 140);
      await a.wait(500);
      await away(a, 6);
      await a.wait(1250);
      a.mark();
      await a.wait(900);
      const lg = await centre(a.page, "[data-ds='copy-button']", 1);
      if (lg) {
        await a.press(lg, 140);
        await a.wait(2600);
      }
    },
  },

  // Hover blooms and turns, press pinches, leave closes; then the small sizes.
  'close-turn': {
    region: ROW,
    drive: async (a) => {
      await a.hover({ x: a.at.x, y: a.at.y + 60 }, 4);
      await a.wait(200);
      a.mark();
      await a.hover(a.at, 6);
      await a.wait(500);
      await a.press(a.at, 300);
      await a.wait(400);
      a.mark();
      await away(a, 4);
      await a.wait(500);
      const sm = await centre(a.page, "[data-ds='close-button']", 1);
      if (sm) {
        a.mark();
        await a.hover(sm, 6);
        await a.wait(500);
        await away(a, 4);
        await a.wait(400);
      }
    },
  },

  // Hover the chevron, hold it (it pulls down), the menu opens and it flips; Escape flips it back.
  'split-chevron': {
    drive: async (a) => {
      const t = await centre(a.page, "[data-ds='split-button'] > [data-part='trigger']");
      if (!t) return;
      await a.hover({ x: t.x, y: t.y + 50 }, 4);
      a.mark();
      await a.hover(t, 8);
      await a.wait(400);
      await a.press(t, 260);
      await a.wait(700);
      a.mark();
      await a.page.keyboard.press('Escape');
      await a.wait(700);
      await away(a);
      await a.wait(300);
    },
  },

  // Hover lifts, press opens the menu and the plus turns; Escape turns it back; then the label shows.
  'fab-morph': {
    region: ROW,
    drive: async (a) => {
      await a.hover({ x: a.at.x, y: a.at.y + 70 }, 4);
      a.mark();
      await a.hover(a.at, 8);
      await a.wait(400);
      await a.press(a.at, 200);
      await a.wait(700);
      a.mark();
      await a.page.keyboard.press('Escape');
      await a.wait(700);
      const t = await centre(a.page, '[data-stage-extend]');
      if (t) {
        await a.hover(t, 8);
        await a.press(t, 120);
        await a.wait(800);
        await a.press(t, 120);
        await a.wait(500);
      }
    },
  },

  // Draw and erase in English, then in Arabic, where the line runs right to left.
  'link-underline': {
    region: ROW,
    drive: async (a) => {
      await a.hover({ x: a.at.x, y: a.at.y + 60 }, 4);
      a.mark();
      await a.hover(a.at, 6);
      await a.wait(500);
      a.mark();
      await a.hover({ x: a.at.x, y: a.at.y + 60 }, 3);
      await a.wait(500);
      const ar = await centre(a.page, '[data-stage-ar]');
      if (ar) {
        await a.hover({ x: ar.x, y: ar.y + 60 }, 4);
        a.mark();
        await a.hover(ar, 6);
        await a.wait(500);
        a.mark();
        await a.hover({ x: ar.x, y: ar.y + 60 }, 3);
        await a.wait(500);
      }
    },
  },
};
