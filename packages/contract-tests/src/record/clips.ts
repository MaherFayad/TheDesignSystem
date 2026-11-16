// The interactions a recording pack can show. Each clip names its gallery
// page, the setup that is not recorded (opening the sheet that is then
// dragged), and the finger strokes that are. Targets match the perception
// gate's catalog (../perceive/catalog.ts) where the same interaction is
// there, so a clip and a perceive row show the same control.
import { findInteraction } from '../perceive/catalog';
import type { Aim, ClipDef } from './types';

/** The perceive catalog's target for an interaction, as an aim. */
function aimOf(id: string): { aim: Aim; slug: string; case?: string } {
  const ix = findInteraction(id);
  if (!ix) throw new Error(`No perceive interaction ${id}`);
  return { aim: { selector: ix.target.selector, text: ix.target.text, nth: ix.target.nth, at: ix.at }, slug: ix.slug, case: ix.case };
}

const button = aimOf('button');
const sw = aimOf('switch');
const dialog = aimOf('dialog');
const sheet = aimOf('sheet');
const toast = aimOf('toast');

export const CLIPS: ClipDef[] = [
  {
    id: 'button-press',
    name: 'Button press',
    slug: button.slug,
    case: button.case,
    does: 'Taps the button (finger down 100ms), then presses and holds it for 600ms',
    strokes: [
      { aim: button.aim, holdMs: 100 },
      { aim: button.aim, holdMs: 600 },
    ],
  },
  {
    id: 'switch',
    name: 'Switch',
    slug: sw.slug,
    case: sw.case,
    does: 'Taps a switch that is off (finger down 100ms), then presses and holds it for 600ms',
    strokes: [
      { aim: sw.aim, holdMs: 100 },
      { aim: sw.aim, holdMs: 600 },
    ],
  },
  {
    id: 'dialog-open',
    name: 'Dialog open',
    slug: dialog.slug,
    case: dialog.case,
    does: 'Taps the button that opens a dialog (finger down 100ms)',
    strokes: [{ aim: dialog.aim, holdMs: 100, pauseAfterMs: 1200 }],
  },
  {
    id: 'sheet-drag',
    name: 'Sheet drag',
    slug: sheet.slug,
    case: sheet.case,
    does: 'With the sheet open, puts a finger on its handle, drags it down 260px over 300ms and lets go',
    setup: [{ aim: sheet.aim, holdMs: 100 }],
    ready: '[data-ds="sheet"] [data-part="panel"]',
    strokes: [{ aim: { selector: '[data-ds="sheet"] [data-part="handle"]', inDocument: true }, holdMs: 100, path: { dx: 0, dy: 260 }, moveMs: 300, pauseAfterMs: 1200 }],
  },
  {
    id: 'toast-swipe',
    name: 'Toast swipe',
    slug: toast.slug,
    case: toast.case,
    does: 'With a toast showing, swipes it 180px over 250ms toward the edge the platform sets and lets go',
    setup: [{ aim: toast.aim, holdMs: 100 }],
    ready: '[data-ds="toaster"] [data-ds="toast"]',
    strokes: [
      {
        aim: { selector: '[data-ds="toaster"] [data-ds="toast"]', inDocument: true, at: { x: 0.35, y: 0.5 } },
        holdMs: 100,
        path: { towards: { selector: '[data-ds="toaster"] [data-ds="toast"]', attribute: 'data-swipe-direction' }, distance: 180 },
        moveMs: 250,
        pauseAfterMs: 1000,
      },
    ],
  },
  {
    // Not in the sample pack: it shows a source clip beside ours, from the compare pair fk2-menu-studio.
    id: 'menu-row-press',
    name: 'Menu row press',
    slug: 'dropdown-menu',
    case: 'variants',
    does: 'With the menu open, presses and holds the second row for 600ms, then lets go',
    setup: [{ click: "[data-demo-trigger='md']" }],
    ready: "[data-ds='dropdown-menu'][role='menu']",
    strokes: [{ aim: { selector: "[data-ds='dropdown-menu'][role='menu'] [role='menuitem']", nth: 1, inDocument: true }, holdMs: 600, pauseAfterMs: 900 }],
    source: { pair: 'fk2-menu-studio', strokes: [{ aim: { selector: "[role='menu'] [role='menuitem']", nth: 1, inDocument: true }, holdMs: 600, pauseAfterMs: 900 }] },
  },
];

export function findClip(id: string): ClipDef | undefined {
  return CLIPS.find((c) => c.id === id);
}
