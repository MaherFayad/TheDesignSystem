// Drives of the overlays family for the round 3 recorder (order 1.23). See
// the header of ../record.cjs for the api. Each drive marks the start of the
// beats the contact sheet should show.

const TOASTS = "[data-ds='toaster'] > [data-ds='toast'][data-state='open']";

/** The centre of the front (newest open) toast, or null. */
async function frontToast(page) {
  const all = page.locator(TOASTS);
  const n = await all.count();
  if (!n) return null;
  const b = await all.nth(n - 1).boundingBox();
  return b ? { x: b.x + b.width / 2, y: b.y + b.height / 2, box: b } : null;
}

/**
 * Moves the page's toaster onto the stage's dock (the room under the
 * trigger), so the clip holds the trigger and the toasts at a large zoom.
 * The recorder draws the page with CSS zoom, so the offsets are corrected
 * by measuring once.
 */
async function dockToaster(page) {
  await page.evaluate(() => {
    const dock = document.querySelector('[data-toast-dock]');
    const toaster = document.querySelector("[data-ds='toaster']");
    if (!dock || !toaster) return;
    const d = dock.getBoundingClientRect();
    const place = (x, y, w) => {
      toaster.style.setProperty('inset', 'auto');
      toaster.style.setProperty('inset-inline-start', `${x}px`);
      toaster.style.setProperty('inset-block-end', `${y}px`);
      toaster.style.setProperty('inline-size', `${w}px`);
      toaster.style.setProperty('margin', '0');
    };
    // First guess in CSS px, then scale by what the page drew.
    const z = Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    place(d.left / z, (window.innerHeight - d.bottom) / z, d.width / z);
    const t = toaster.getBoundingClientRect();
    const k = t.width > 0 ? d.width / t.width : 1;
    if (Math.abs(k - 1) > 0.02) place((d.left / z) * k, ((window.innerHeight - d.bottom) / z) * k, (d.width / z) * k);
  });
}

/** Moves the pointer off every overlay, to the frame's corner. */
async function away(a) {
  await a.page.mouse.move(8, 8, { steps: 8 });
}

const TOAST_REGION = { region: '[data-toast-stage]', noOverlay: true };

module.exports = {
  // The default path, with the toaster on the dock: press, wait, press again.
  'toast-enter': {
    ...TOAST_REGION,
    drive: async (a) => {
      await dockToaster(a.page);
      await a.hover(a.at, 10);
      await a.press(a.at, 100);
      await away(a);
      await a.wait(1200);
      await a.press(a.at, 100);
      await away(a);
      await a.wait(1200);
    },
  },

  // Three presses: each new toast pushes the others back into the stack.
  'toast-stack': {
    ...TOAST_REGION,
    drive: async (a) => {
      await dockToaster(a.page);
      await a.hover(a.at, 10);
      await a.wait(300);
      for (let i = 0; i < 3; i++) {
        await a.press(a.at, 100);
        await away(a);
        await a.wait(900);
        await a.hover(a.at, 6);
      }
      await away(a);
      await a.wait(600);
    },
  },

  // Three toasts at once, then the pointer rests on the stack (it opens into a list) and leaves (it folds back).
  'toast-expand': {
    ...TOAST_REGION,
    drive: async (a) => {
      await dockToaster(a.page);
      await a.press(a.at, 100);
      await away(a);
      await a.wait(900);
      const f = await frontToast(a.page);
      if (!f) return;
      await a.page.mouse.move(f.x, f.box.y + f.box.height - 12, { steps: 4 });
      a.mark();
      await a.page.mouse.move(f.x, f.y, { steps: 4 });
      await a.wait(900);
      a.mark();
      await away(a);
      await a.wait(900);
    },
  },

  // One toast: the wrong way (rubber band), a short drag let go (spring back), then a flick (it leaves).
  'toast-swipe': {
    ...TOAST_REGION,
    drive: async (a) => {
      await dockToaster(a.page);
      await a.press(a.at, 100);
      await away(a);
      await a.wait(800);
      const f = await frontToast(a.page);
      if (!f) return;
      const from = { x: f.box.x + f.box.width * 0.4, y: f.y };
      const page = a.page;
      // Rubber band: pull 120px the wrong way, hold, let go.
      await page.mouse.move(from.x, from.y, { steps: 4 });
      a.mark();
      await page.mouse.down();
      await page.mouse.move(from.x - 160, from.y, { steps: 16 });
      await a.wait(250);
      await page.mouse.up();
      await a.wait(600);
      // Short drag toward the edge, stop, let go: it springs back.
      await page.mouse.move(from.x, from.y, { steps: 4 });
      a.mark();
      await page.mouse.down();
      await page.mouse.move(from.x + 36, from.y, { steps: 10 });
      await a.wait(200);
      await page.mouse.up();
      await a.wait(700);
      // A flick: short and fast, it leaves.
      await page.mouse.move(from.x, from.y, { steps: 4 });
      a.mark();
      await page.mouse.down();
      await page.mouse.move(from.x + 54, from.y, { steps: 2 });
      await page.mouse.up();
      await away(a);
      await a.wait(800);
    },
  },

  // The progress line runs, stops while the pointer rests on the toast, and runs on.
  'toast-timer': {
    ...TOAST_REGION,
    drive: async (a) => {
      await dockToaster(a.page);
      await a.press(a.at, 100);
      await away(a);
      a.mark();
      await a.wait(1200);
      const f = await frontToast(a.page);
      if (!f) return;
      await a.page.mouse.move(f.x, f.y, { steps: 6 });
      a.mark();
      await a.wait(1500);
      a.mark();
      await away(a);
      await a.wait(1500);
    },
  },

  // The alert dialog opens; presses on the backdrop are refused and the panel nudges; Escape cancels.
  'dialog-refuse': {
    drive: async (a) => {
      await a.hover(a.at, 10);
      await a.press(a.at, 100);
      await a.wait(900);
      const panel = await a.page.locator("[data-ds='alert-dialog'] > [data-part='panel']").boundingBox();
      if (!panel) return;
      const outside = { x: panel.x + panel.width / 2, y: Math.max(4, panel.y - 24) };
      await a.press(outside, 80);
      await a.wait(700);
      await a.press(outside, 80);
      await a.wait(700);
      await a.key('Escape');
      await a.wait(600);
    },
  },

  // The pointer runs along the toolbar: one tooltip seems to follow it.
  'tooltip-follow': {
    drive: async (a) => {
      const page = a.page;
      const stage = page.locator('[data-interaction-stage] [data-ds="icon-button"]');
      const n = await stage.count();
      const boxes = [];
      for (let i = 0; i < n; i++) boxes.push(await stage.nth(i).boundingBox());
      const first = boxes[0];
      if (!first) return;
      await a.hover({ x: first.x + first.width / 2, y: first.y + first.height / 2 }, 10);
      a.mark();
      await a.wait(1000);
      for (const b of boxes.slice(1)) {
        if (!b) continue;
        a.mark();
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
        await a.wait(500);
      }
      await away(a);
      await a.wait(500);
    },
  },

  // The tour starts, then Next twice: the ring travels and the panel follows.
  'tour-spotlight': {
    drive: async (a) => {
      await a.press(a.at, 100);
      await a.wait(900);
      for (let i = 0; i < 2; i++) {
        const next = a.page.locator("[data-ds='tour'] [data-part='next'], [data-ds='tour'] [data-part='footer'] [data-ds='button']").last();
        const b = await next.boundingBox().catch(() => null);
        if (!b) break;
        await a.press({ x: b.x + b.width / 2, y: b.y + b.height / 2 }, 80);
        await a.wait(900);
      }
      await a.key('Escape');
      await a.wait(500);
    },
  },
};
