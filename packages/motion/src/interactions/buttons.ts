// Interactions of the actions and toggles family (orders 1.21 and 1.22). See
// ./types.ts for the shape. Order 1.22 raises each one to a small
// choreography: anticipation, action, overshoot where something lands,
// settle, and the parts that react. Spring overshoot per style, from the
// tokens: Neutral bouncy 6%, snappy 1.5%, soft none; Desk bouncy 25%, snappy
// 10%, soft 2%; Studio steps (bouncy three, snappy two) and a plain curve.
import type { Interaction } from './types';

/** The private property that turns the press off on each root of the family. */
const pressOff = { '--_button-press-scale': '1' } as const;
/** The private property that turns the dip of an attached segment off. */
const dipOff = { '--_button-part-press': '1' } as const;

export const buttonsInteractions = [
  {
    id: 'button-press',
    components: ['Button', 'IconButton', 'ToggleButton', 'CopyButton', 'CloseButton', 'FloatingActionButton'],
    pattern: 'press',
    drive: 'css',
    trigger: 'Pointer down on the control, or Space or Enter held down while it has focus, then the release.',
    feedback:
      'The control dips to scale.press from its center over duration.instant on ease.out, and on release springs back on the bouncy spring, passing rest a little and settling. ' +
      'Space and the pointer press through :active in Button.css; Enter plays the press pattern from ButtonRoot, since the browser draws no :active for it. ' +
      'Never on a disabled or loading control.',
    beats: [
      'Anticipation: the control dips to scale.press (0.97) over duration.instant on ease.out (Neutral and Desk 70ms, Studio 70ms) while it is held.',
      'Action: the click runs on release, at once; nothing waits for the motion.',
      'Overshoot and settle: the control springs back on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms passing rest by 6% of the dip, Desk 440ms passing it by 25%, Studio 120ms in three steps).',
      'A rapid second press starts from wherever the spring is: the transition picks up the live value.',
    ],
    styles: {
      studio: 'a short dip and a release in three hard steps',
      desk: 'a long release that passes rest and swings back',
      neutral: 'a short dip and a quiet settle',
    },
    reduced: 'No scale. The pressed color carries the state.',
    off: {
      "[data-ds='button']": pressOff,
      "[data-ds='icon-button']": pressOff,
      "[data-ds='toggle-button']": pressOff,
      "[data-ds='copy-button']": pressOff,
      "[data-ds='close-button']": pressOff,
      "[data-ds='floating-action-button']": pressOff,
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'segment-press',
    components: ['ButtonGroup', 'SplitButton'],
    pattern: 'press',
    drive: 'css',
    trigger: 'Pointer down or Space held on one segment of an attached ButtonGroup, or on either half of a SplitButton, then the release.',
    feedback:
      'The pressed segment answers and its neighbor does not move: the segment keeps its box, so no seam opens, and its parts (icon, start, label, end) dip to scale.anticipate, then spring back on the snappy spring on release.',
    beats: [
      'Anticipation: the parts of the pressed segment dip to scale.anticipate (Neutral 0.95, Desk 0.9, Studio 0.97) on ease.spring-snappy over duration.spring-snappy.',
      'Action: the click runs on release, at once.',
      'Settle: the parts spring back on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms passing rest by 10%, Studio 80ms in two steps). The box, the seam and the neighbor stay still.',
    ],
    styles: {
      studio: 'the parts shrink a hair and snap back in two steps',
      desk: 'a deep dip that swings back past rest',
      neutral: 'a small dip and a quiet return',
    },
    reduced: 'No dip. The pressed color carries the state.',
    off: {
      "[data-ds='button-group'][data-attached] > *": dipOff,
      "[data-ds='split-button'] > *": dipOff,
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'button-loading',
    components: ['Button', 'IconButton', 'FloatingActionButton', 'SplitButton'],
    pattern: 'swap',
    drive: 'waapi',
    primitive: 'button-morph',
    trigger: 'The loading prop turns on when an action starts, and off when it ends.',
    feedback:
      'Idle to loading and back as one morph in a button whose width never changes. aria-busy, the status, the spinner and the blocked activation change at once; the morph only decorates.',
    beats: [
      'Anticipation: the button dips to scale.anticipate and springs back on ease.spring-snappy over duration.spring-snappy.',
      'Action: the label (or the icon of an icon only button) rolls up and out by distance.shift over duration.quick on ease.exit.',
      'Overshoot: one delay.stagger step later the spinner grows in from scale.morph on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms passing its size by 25%, Studio 120ms in three steps).',
      'Back to idle: the spinner shrinks to scale.morph and fades over duration.quick; one stagger step later the label rolls back in from above on ease.spring-soft over duration.spring-soft. The leaving spinner stays only for its exit and rests at opacity 0.',
    ],
    styles: {
      studio: 'parts cut in and out together in steps, no dip to speak of',
      desk: 'a deep dip, a long roll and a spinner that swells past its size',
      neutral: 'a light dip and a short roll',
    },
    reduced: 'The label and the spinner cross fade over duration.base. The button does not move.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'copy-swap',
    components: ['CopyButton'],
    pattern: 'swap',
    drive: 'waapi',
    primitive: 'button-morph',
    trigger: 'A copy succeeds or fails, and the result ends after delay.feedback.',
    feedback:
      'The copy icon rolls out and the result glyph arrives as one morph: the check turns in with overshoot and the button swells once; the warning pops in and the button shakes once. ' +
      'The return to idle rolls the copy icon back in from above. The clipboard write, the state and the status are never delayed. ' +
      'The visible label does not change: it is the accessible name, and the status says the result.',
    beats: [
      'Action: the copy icon rolls up and out by distance.shift over duration.quick on ease.exit.',
      'Overshoot: one delay.stagger step later the check turns in from minus 45 degrees and scale.morph, passing its size on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms by 6%, Desk 440ms by 25%, Studio 120ms in three steps).',
      'Secondary: the button swells to scale.pop and back over duration.celebrate on ease.out (Neutral 1.05 over 220ms, Desk 1.14 over 480ms, Studio none). After a failure the warning pops in the same way and the button shakes once along the inline axis by distance.nudge instead.',
      'Back to idle: the result glyph rolls down and out, and one stagger step later the copy icon rolls in from above on ease.spring-soft over duration.spring-soft.',
    ],
    styles: {
      studio: 'the glyphs cut over in steps, no swell',
      desk: 'a long turn of the check past its size and a full swell',
      neutral: 'a short turn and a light swell',
    },
    reduced: 'The old icon fades out while the new one fades in, over duration.base. The button does not move.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'button-nudge',
    components: ['Button'],
    pattern: 'press',
    drive: 'css',
    trigger: 'The pointer rests on a button with an end icon, or the keyboard focuses it.',
    feedback:
      'The end part (an arrow, a chevron) moves distance.nudge toward the inline end, the way the action goes, on the snappy spring, and springs back when the pointer leaves. It flips in right to left text. Only the decorative part moves: the target stays under the pointer.',
    beats: [
      'Action: the end part moves distance.nudge (Neutral 2px, Desk 3px, Studio 1px) toward the inline end on ease.spring-snappy over duration.spring-snappy.',
      'Overshoot and settle: it passes the mark by the spring overshoot (Desk 10%) and settles; leaving plays the same spring back.',
    ],
    styles: {
      studio: 'a one pixel step',
      desk: 'a three pixel nudge that swings',
      neutral: 'a two pixel nudge',
    },
    reduced: 'The end part stays still. The hover color carries the state.',
    off: {
      "[data-ds='button']": { '--_button-shift': '0px' },
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'close-turn',
    components: ['CloseButton'],
    pattern: 'press',
    drive: 'css',
    trigger: 'The pointer rests on a close button, or the keyboard focuses it.',
    feedback:
      'The close glyph turns a quarter turn on the snappy spring, passes its mark a little and settles, and turns back when the pointer leaves. A cross looks the same after a quarter turn, so a quick pass never leaves it crooked.',
    beats: [
      'Action: the glyph turns a quarter turn on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms in two steps).',
      'Overshoot and settle: it passes the quarter turn by the spring overshoot (Desk 10%, Neutral 1.5%) and settles square.',
      'With the press: pointer down dips the whole button (button-press).',
    ],
    styles: {
      studio: 'a two step turn',
      desk: 'a turn that swings past square and back',
      neutral: 'a short quiet turn',
    },
    reduced: 'The glyph does not turn. The hover fill carries the state.',
    off: {
      "[data-ds='close-button']": { '--_close-button-turn': '0deg' },
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'split-chevron',
    components: ['SplitButton'],
    pattern: 'menu-scale',
    drive: 'css',
    trigger: 'The menu of a SplitButton opens or closes, or the pointer rests on its closed trigger.',
    feedback:
      'The chevron turns half a turn to point up while the menu is open, on the snappy spring, passing its mark a little and settling; it turns back on close. On hover while closed it drops distance.nudge toward the menu and springs back.',
    beats: [
      'Anticipation: on hover the chevron drops distance.nudge toward the menu on ease.spring-snappy.',
      'Action: on open it turns half a turn on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms in two steps) while the menu scales in from the trigger (menu-scale).',
      'Overshoot and settle: it passes the half turn by the spring overshoot (Desk 10%) and settles pointing up. Close turns it back the same way.',
    ],
    styles: {
      studio: 'a two step flip',
      desk: 'a flip that swings past and back',
      neutral: 'a short flip with almost no swing',
    },
    reduced: 'The chevron points up at once and does not drop on hover.',
    off: {
      "[data-ds='split-button'] > [data-part='trigger']": {
        '--_button-motion': '0',
        '--_split-button-drop': '0px',
      },
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'fab-morph',
    components: ['FloatingActionButton'],
    pattern: 'swap',
    drive: 'css',
    trigger: 'A floating action button with a plus icon opens a menu or a popover (aria-expanded), or its extended label appears.',
    feedback:
      'Plus to close: the plus turns an eighth of a turn into a close mark on the snappy spring and turns back when the panel closes. The extended label slides out from behind the icon by distance.shift and fades in when it appears; the width changes at once.',
    beats: [
      'Action: on open the plus turns an eighth of a turn on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms in two steps), with the press of the button before it (button-press).',
      'Overshoot and settle: it passes the eighth by the spring overshoot (Desk 10%) and settles as a close mark.',
      'Extended label: it slides from distance.shift behind the icon to rest on ease.spring-snappy and fades in over duration.fast.',
    ],
    styles: {
      studio: 'a two step turn and a short cut in',
      desk: 'a turn that swings and a long slide',
      neutral: 'a short turn and a short slide',
    },
    reduced: 'The plus shows as a close mark at once; the label shows at once.',
    off: {
      "[data-ds='floating-action-button']": {
        '--_floating-action-button-turn': '0deg',
        '--_floating-action-button-enter-x': '0px',
      },
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'link-underline',
    components: ['Link'],
    pattern: 'chart-draw',
    drive: 'css',
    trigger: 'The pointer rests on a standalone link, or the keyboard focuses it; the pointer rests on an external link.',
    feedback:
      'A second, stronger line draws over the thin rest underline from the inline start, so it runs right to left in Arabic, and retreats toward the inline end, faster, when the pointer leaves. The external icon nudges up and toward where it leads. The rest underline never goes: the link never relies on color alone.',
    beats: [
      'Action: the line scales from 0 to the label width with its origin at the inline start over duration.morph on ease.out (Neutral 200ms, Desk 320ms, Studio 100ms).',
      'Exit: it scales back to 0 with its origin at the inline end over duration.quick on ease.exit, about two thirds of the draw.',
      'Secondary: the external icon moves distance.nudge up and toward the inline end on ease.spring-snappy over duration.spring-snappy.',
    ],
    styles: {
      studio: 'a quick draw',
      desk: 'a long draw and a swinging icon',
      neutral: 'a short draw',
    },
    reduced: 'The line shows and goes at once; the icon stays still.',
    off: {
      "[data-ds='link']": {
        '--_link-motion': '0',
        '--_link-shift': '0px',
      },
    },
    round: 2,
    status: 'proposed',
  },
] as const satisfies readonly Interaction[];
