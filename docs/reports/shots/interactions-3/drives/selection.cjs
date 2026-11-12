// Drives of the selection family (order 1.23): menus, pickers, lists, chips
// and filters. Each drive marks the beats the contact sheet should show (at
// most five bands of twelve frames, 40 ms apart). See ../record.cjs for the api.
// Popper overlays (menus, picker lists) land away from their trigger when the
// recorder draws the page with CSS zoom above 1 (the positioning reads zoomed
// boxes and applies them again), so their drives crop the whole frame at zoom 1.
const WHOLE = 'body';

const centre = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

/** The centre of the nth match of a selector, or null. */
async function spot(page, selector, n = 0) {
  const all = page.locator(selector);
  if ((await all.count()) <= n) return null;
  const b = await all.nth(n).boundingBox();
  return b ? centre(b) : null;
}

/** Moves the pointer onto the nth row, slowly enough to read as a hover. */
async function hoverRow(a, selector, n, steps = 8) {
  const p = await spot(a.page, selector, n);
  if (p) await a.hover(p, steps);
}

const MENU_ROWS = "[role='menu'] :is([role='menuitem'], [role='menuitemcheckbox'], [role='menuitemradio'])";

/** Open a menu from its trigger, hover down the rows, then the keys, then close. */
async function menuMarker(a) {
  const { page, at } = a;
  await a.hover(at, 10);
  await a.wait(200);
  // Opening: the surface opens from the trigger side, the rows arrive.
  await a.press(at, 90);
  await a.wait(600);
  // Highlight row moving (pointer): first row, then a long hop down.
  await hoverRow(a, MENU_ROWS, 0, 6);
  await a.wait(400);
  a.mark();
  await hoverRow(a, MENU_ROWS, 3, 4);
  await a.wait(500);
  await hoverRow(a, MENU_ROWS, 4, 4);
  await a.wait(300);
  await hoverRow(a, MENU_ROWS, 1, 4);
  await a.wait(500);
  // Highlight row moving (keys): the marker keeps up.
  await a.key('ArrowDown');
  await a.wait(140);
  await page.keyboard.press('ArrowDown');
  await a.wait(140);
  await page.keyboard.press('ArrowDown');
  await a.wait(500);
  await a.key('Home');
  await a.wait(500);
  // Closing: faster than the entrance.
  await a.key('Escape');
  await a.wait(600);
}

/** A picker: open with the pointer, hover across rows, arrow keys, pick with Enter. */
async function pickerDrive(a) {
  const { page, at } = a;
  await a.hover(at, 10);
  await a.wait(200);
  await a.press(at, 90);
  await a.wait(500);
  await hoverRow(a, "[role='option']", 1, 6);
  await a.wait(300);
  a.mark();
  await hoverRow(a, "[role='option']", 4, 4);
  await a.wait(500);
  await a.key('ArrowUp');
  await a.wait(140);
  await page.keyboard.press('ArrowUp');
  await a.wait(500);
  // Picked: the list closes, the value rolls.
  await a.key('Enter');
  await a.wait(700);
}

module.exports = {
  'highlight-marker': { region: WHOLE, drive: menuMarker },

  'menu-origin': {
    region: WHOLE,
    drive: async (a) => {
      const { page, at } = a;
      await a.hover(at, 10);
      await a.wait(300);
      await a.press(at, 90);
      await a.wait(700);
      await a.key('Escape');
      await a.wait(600);
      // The context menu: from the pointer corner.
      const area = await spot(page, '[data-interaction-stage] [tabindex="0"]');
      if (area) {
        await a.hover(area, 8);
        await a.wait(200);
        a.mark();
        await page.mouse.click(area.x, area.y, { button: 'right' });
        await a.wait(700);
        await a.key('Escape');
        await a.wait(500);
      }
    },
  },

  'menu-submenu-nudge': {
    region: WHOLE,
    drive: async (a) => {
      const { page, at } = a;
      await a.press(at, 90);
      await a.wait(500);
      await hoverRow(a, MENU_ROWS, 0, 6);
      await a.wait(300);
      // Light the sub-trigger: the chevron leans, then the submenu opens from that side.
      a.mark();
      await hoverRow(a, MENU_ROWS, 1, 4);
      await a.wait(700);
      await a.key('ArrowRight');
      await a.wait(600);
      await a.key('ArrowLeft');
      await a.wait(400);
      await page.keyboard.press('ArrowUp');
      await a.wait(500);
      await page.keyboard.press('Escape');
      await a.wait(400);
    },
  },

  'menu-row-slide': {
    region: WHOLE,
    drive: async (a) => {
      const { page, at } = a;
      await a.press(at, 90);
      await a.wait(600);
      a.mark();
      await page.keyboard.press('ArrowRight');
      await a.wait(600);
      a.mark();
      await page.keyboard.press('ArrowRight');
      await a.wait(600);
      // The pointer opens the first menu again.
      a.mark();
      await a.hover(at, 6);
      await a.wait(600);
      await page.keyboard.press('Escape');
      await a.wait(400);
    },
  },

  'picker-value-roll': {
    // The beat is in the trigger: kept large; the list may land off the crop.
    drive: async (a) => {
      const { page, at } = a;
      await a.press(at, 90);
      await a.wait(500);
      await page.keyboard.press('ArrowDown');
      await a.wait(200);
      await page.keyboard.press('ArrowDown');
      await a.wait(300);
      a.mark();
      await page.keyboard.press('Enter');
      await a.wait(700);
      await a.press(at, 90);
      await a.wait(500);
      await page.keyboard.press('ArrowUp');
      await a.wait(300);
      a.mark();
      await page.keyboard.press('Enter');
      await a.wait(700);
    },
  },

  'picker-chevron-turn': { region: WHOLE, drive: pickerDrive },
  'menu-rows': { region: WHOLE, drive: pickerDrive },

  'check-draw-pick': {
    drive: async (a) => {
      const { page } = a;
      await hoverRow(a, "[role='option']", 0, 8);
      await a.wait(300);
      // The marker follows the pointer with the hover color.
      a.mark();
      await hoverRow(a, "[role='option']", 2, 4);
      await a.wait(400);
      // Picked: the check draws.
      const p = await spot(page, "[role='option']", 2);
      if (p) await a.press(p, 90);
      await a.wait(500);
      const q = await spot(page, "[role='option']", 3);
      if (q) await a.press(q, 90);
      await a.wait(500);
      // Keys: the marker keeps up, Space toggles.
      await a.key('ArrowDown');
      await a.wait(200);
      await page.keyboard.press('Space');
      await a.wait(600);
    },
  },

  'combobox-results': {
    region: WHOLE,
    drive: async (a) => {
      const { page, at } = a;
      await a.press(at, 90);
      await a.wait(500);
      await page.keyboard.press('ArrowDown');
      await a.wait(200);
      await page.keyboard.press('ArrowDown');
      await a.wait(300);
      // Results update: rows that stay slide, new ones rise, the marker follows.
      a.mark();
      await page.keyboard.type('m', { delay: 0 });
      await a.wait(600);
      a.mark();
      await page.keyboard.type('e', { delay: 0 });
      await a.wait(600);
      a.mark();
      await page.keyboard.press('Backspace');
      await a.wait(200);
      await page.keyboard.press('Backspace');
      await a.wait(600);
      await page.keyboard.press('Escape');
      await a.wait(300);
    },
  },

  'command-palette-row-slide': {
    drive: async (a) => {
      const { page, at } = a;
      await a.press(at, 90);
      await a.wait(700);
      a.mark();
      await page.keyboard.press('ArrowDown');
      await a.wait(140);
      await page.keyboard.press('ArrowDown');
      await a.wait(500);
      await hoverRow(a, "[role='listbox'] [role='option']", 5, 6);
      await a.wait(200);
      a.mark();
      await hoverRow(a, "[role='listbox'] [role='option']", 1, 4);
      await a.wait(600);
      await page.keyboard.press('Escape');
      await a.wait(500);
    },
  },

  'command-palette-results': {
    drive: async (a) => {
      const { page, at } = a;
      await a.press(at, 90);
      await a.wait(700);
      a.mark();
      await page.keyboard.type('bo', { delay: 60 });
      await a.wait(600);
      a.mark();
      await page.keyboard.press('Backspace');
      await page.keyboard.press('Backspace');
      await a.wait(600);
      await page.keyboard.press('Escape');
      await a.wait(500);
    },
  },

  'command-palette-open': {
    drive: async (a) => {
      const { page, at } = a;
      await a.press(at, 90);
      await a.wait(800);
      await a.key('Escape');
      await a.wait(600);
    },
  },

  'row-glide': {
    drive: async (a) => {
      const rows = "[data-part='item'][data-linked]";
      await hoverRow(a, rows, 0, 8);
      await a.wait(300);
      a.mark();
      await hoverRow(a, rows, 2, 4);
      await a.wait(500);
      a.mark();
      await hoverRow(a, rows, 1, 4);
      await a.wait(500);
    },
  },

  'collection-flip': {
    drive: async (a) => {
      const { page, at } = a;
      await a.press(at, 90);
      await a.wait(700);
      const remove = await spot(page, "[data-interaction-stage] button:has-text('Remove the first')");
      if (remove) await a.press(remove, 90);
      await a.wait(700);
      const reverse = await spot(page, "[data-interaction-stage] button:has-text('Reverse the order')");
      if (reverse) await a.press(reverse, 90);
      await a.wait(700);
      // TagField: remove a tag with its button.
      const x = await spot(page, "[data-interaction-stage] [data-ds='tag-field'] button");
      if (x) await a.press(x, 90);
      await a.wait(700);
    },
  },

  'filter-count-roll': {
    drive: async (a) => {
      const { page } = a;
      for (let i = 0; i < 3; i++) {
        const c = await spot(page, "[data-interaction-stage] [data-ds='chip']", i);
        if (c) await a.press(c, 90);
        await a.wait(600);
      }
      const c = await spot(page, "[data-interaction-stage] [data-ds='chip']", 0);
      if (c) await a.press(c, 90);
      await a.wait(600);
    },
  },

  'chip-check-pop': {
    drive: async (a) => {
      const { page, at } = a;
      await a.hover(at, 10);
      await a.wait(300);
      await a.press(at, 90);
      await a.wait(700);
      await a.press(at, 90);
      await a.wait(700);
      const other = await spot(page, "[data-interaction-stage] [data-ds='chip']", 2);
      if (other) await a.press(other, 90);
      await a.wait(700);
    },
  },
};
