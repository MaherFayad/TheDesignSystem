// Drives of the feedback family for the round 3 recorder (order 1.23).
// See ../record.cjs for the api. Most stages are driven by a play button;
// the crop holds the whole stage so the sheet shows the component, not the
// button. Hover, drag and keyboard stages have their own drive.
const STAGE = '[data-interaction-stage]';

/** Presses the play button `times` times, a beat marked at each press. */
function presses(times, after = 900) {
  return async (a) => {
    for (let i = 0; i < times; i++) {
      // A short press: the change lands early in the band.
      await a.press(a.at, 40);
      await a.wait(after);
    }
  };
}

const staged = (times, after) => ({ region: STAGE, drive: presses(times, after) });

module.exports = {
  'alert-entrance': staged(3, 900),
  'alert-dismiss': staged(2, 900),
  'state-illustration': staged(2, 1000),
  'error-state-details': staged(3, 700),
  'accordion-reveal': {
    region: STAGE,
    drive: async (a) => {
      await a.hover(a.at, 10);
      a.mark();
      await a.wait(500);
      await a.press(a.at, 120);
      await a.wait(800);
      await a.press(a.at, 120);
      await a.wait(600);
      await a.press(a.at, 120);
      await a.wait(800);
    },
  },
  'skeleton-swap': staged(3, 1200),
  'stat-roll': staged(3, 800),
  'progress-spring': staged(2, 900),
  'progress-celebrate': {
    region: STAGE,
    drive: async (a) => {
      await a.press(a.at, 120);
      await a.wait(700);
      // 60 to 100: the completion beat.
      await a.press(a.at, 120);
      await a.wait(1000);
    },
  },
  'meter-fill': staged(2, 1000),
  'avatar-status': staged(2, 1600),
  'status-pulse': staged(1, 2400),
  'avatar-group-change': staged(3, 900),
  'badge-count': staged(3, 800),
  'card-lift': {
    region: STAGE,
    drive: async (a) => {
      // Offsets from the centre of the card, in frame px (the page is zoomed, so boxes are not used).
      const p = (fx, fy) => ({ x: a.at.x + (fx - 0.5) * 300, y: a.at.y + (fy - 0.5) * 120 });
      await a.hover(p(-0.2, 0.5), 4);
      a.mark();
      await a.hover(p(0.2, 0.4), 10);
      await a.wait(300);
      a.mark();
      await a.hover(p(0.85, 0.7), 24);
      await a.wait(300);
      a.mark();
      await a.press(p(0.5, 0.5), 160);
      await a.wait(300);
      a.mark();
      await a.hover(p(1.3, 0.5), 8);
      await a.wait(500);
    },
  },
  'spinner-loop': staged(2, 900),
  'kbd-press': staged(2, 900),
  'handle-grip': {
    region: STAGE,
    drive: async (a) => {
      await a.hover(a.at, 10);
      a.mark();
      await a.wait(500);
      await a.drag(a.at, { x: a.at.x + 60, y: a.at.y }, { steps: 16, holdMs: 200 });
      await a.wait(600);
    },
  },
  'split-view-pane': staged(2, 900),
};
