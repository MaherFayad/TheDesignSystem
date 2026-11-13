// Interactions of the actions family (orders 1.21, 1.22 and 1.23). See
// ./types.ts for the shape. Order 1.22 raised each one to a small
// choreography: anticipation, action, overshoot where something lands,
// settle, and the parts that react. Order 1.23 (round 3) makes each one
// specific to what the control is, with the motion ruling's paint
// properties: a press that sinks by size with an inner shade, a glow that
// follows the pointer on a solid fill, results that draw, a copy control
// whose label rolls to "Copied", a close glyph that blooms, a link line that
// wipes in the reading direction. Spring overshoot per style, from the
// tokens: Neutral bouncy 6%, snappy 1.5%, soft none; Desk bouncy 25%, snappy
// 10%, soft 2%; Studio steps (bouncy three, snappy two) and a plain curve.
//
// Every hover look of the family sits behind @media (hover: hover), so a tap
// on a phone never leaves a control stuck in its hover look; every press
// works on touch through :active.
import type { Interaction } from './types';

/** The private properties that turn the press off on each root of the family. */
const pressOff = { '--_button-press-scale': '1', '--_button-press-y': '0px' } as const;
/** The private properties that turn the dip and the sink of an attached segment off. */
const dipOff = { '--_button-part-press': '1', '--_button-press-y': '0px' } as const;

export const buttonsInteractions = [
  {
    id: 'button-press',
    components: ['Button', 'IconButton', 'ToggleButton', 'CopyButton', 'CloseButton', 'FloatingActionButton'],
    pattern: 'press',
    drive: 'css',
    trigger: 'Pointer or finger down on the control, or Space or Enter held down while it has focus, then the release.',
    feedback:
      'A press you can feel through the box: the control dips to scale.press, its content sinks by a depth that grows with its size, and an inner shade comes in along the top edge, as if the face were pushed in. ' +
      'On release everything springs back on the bouncy spring and the shade fades. Space and the pointer press through :active in Button.css; Enter plays the press pattern from ButtonRoot, since the browser draws no :active for it. ' +
      'Never on a disabled or loading control. Works the same on touch.',
    beats: [
      'Rest: the face at scale 1, the content at rest, no shade.',
      'Press (anticipation): over duration.instant on ease.out the root dips to scale.press (0.97), the parts sink by --_button-press-y (xs and sm 1px, md distance.nudge 2px, lg and the FloatingActionButton distance.nudge plus 1px) and the ::after shade (inset 0 depth, blur twice the depth, color.bg.scrim-20) fades in.',
      'Action: the click runs on release, at once; nothing waits for the motion.',
      'Release (overshoot and settle): the root springs back on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms passing rest by 6% of the dip, Desk 440ms by 25%, Studio 120ms in three steps); the parts rise on the snappy spring and the shade fades over the same time.',
      'A rapid second press starts from wherever the spring is: the transitions pick up the live values.',
    ],
    styles: {
      studio: 'a shallow press and a release in hard steps',
      desk: 'a deep press that swings back past rest',
      neutral: 'a press that sinks by size and settles quietly',
    },
    reduced: 'No scale and no sink. The pressed fill and the still inner shade carry the state.',
    off: {
      "[data-ds='button']": pressOff,
      "[data-ds='icon-button']": pressOff,
      "[data-ds='toggle-button']": pressOff,
      "[data-ds='copy-button']": pressOff,
      "[data-ds='close-button']": pressOff,
      "[data-ds='floating-action-button']": pressOff,
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'button-glow',
    components: ['Button', 'IconButton', 'ToggleButton', 'CopyButton', 'FloatingActionButton'],
    pattern: 'press',
    drive: 'css',
    trigger: 'The pointer moves over a solid button, or a finger presses it.',
    feedback:
      'A soft round highlight in the fill sits under the pointer and follows it across the face, so the fill reads as a lit surface. ButtonRoot writes the pointer place as a share of the box into two private properties on pointermove and pointerdown; no render runs per move. ' +
      'It shows at 80% of --_button-glow while the pointer is over the button and fully while it is pressed, so a tap lights up under the finger.',
    beats: [
      'Hover: the ::before glow (a radial gradient of the fill text color, mixed thin, one and a half button heights across) fades in over duration.morph on ease.out at the pointer.',
      'Move: the glow centre follows --_button-glow-x and -y at once, frame by frame.',
      'Press: it brightens to full strength over duration.instant with the press.',
      'Leave: it fades out over duration.morph where the pointer left it.',
    ],
    styles: {
      studio: 'the same thin highlight; a flat style may set --_button-glow to 0',
      desk: 'a highlight that reads as light on the yellow fill',
      neutral: 'a faint highlight',
    },
    reduced: 'No glow. The hover fill carries the state.',
    off: {
      "[data-ds='button']": { '--_button-glow': '0' },
      "[data-ds='icon-button']": { '--_button-glow': '0' },
      "[data-ds='toggle-button']": { '--_button-glow': '0' },
      "[data-ds='copy-button']": { '--_button-glow': '0' },
      "[data-ds='floating-action-button']": { '--_button-glow': '0' },
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'segment-press',
    components: ['ButtonGroup', 'SplitButton'],
    pattern: 'press',
    drive: 'css',
    trigger: 'Pointer or finger down, or Space held, on one segment of an attached ButtonGroup or on either half of a SplitButton, then the release.',
    feedback:
      'The pressed segment is a key pushed into the row: its box and the seam stay still, its parts (icon, start, label, end) dip to scale.anticipate and sink by the press depth, and the inner shade comes in on that segment only. The neighbor does not move.',
    beats: [
      "Press: the parts of the pressed segment dip to scale.anticipate (Neutral 0.95, Desk 0.9, Studio 0.97) and sink by --_button-press-y over duration.instant on ease.out; Button's inner shade fades in over the same time.",
      'Action: the click runs on release, at once.',
      'Release (overshoot): the key comes back up with a bounce: the parts rise on ease.spring-bouncy over duration.spring-bouncy (--_button-group-release-ease and -release-duration; Neutral 220ms passing rest by 6%, Desk 440ms by 25%, Studio 120ms in three steps) and the shade fades. The box, the seam and the neighbor stay still.',
    ],
    styles: {
      studio: 'the parts shrink a hair and snap back in steps',
      desk: 'a deep dip and a key that bounces back past rest',
      neutral: 'a small dip, a one key sink and a short bounce',
    },
    reduced: 'No dip and no sink, every duration of the segment 0s in its own CSS. The pressed fill and the still shade carry the state.',
    off: {
      "[data-ds='button-group'][data-attached] > *": dipOff,
      "[data-ds='split-button'] > *": dipOff,
    },
    round: 3,
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
      'Idle to loading and back as one morph in a button whose width never changes: the label stays in the flow at opacity 0 under the spinner. aria-busy, the status, the spinner and the blocked activation change at once; the morph only decorates.',
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
    id: 'button-result',
    components: ['Button'],
    pattern: 'swap',
    drive: 'css',
    trigger: 'The caller sets result to success or error when an action ends (often right after loading), and clears it to go back.',
    feedback:
      'The ending of the action is drawn in the button: the label rolls up and out, and a check draws itself stroke by stroke (success) or a cross draws in two strokes (error), at the size of the icons. An error also shakes the button once. ' +
      'When the caller clears result, the glyph shrinks away and the label drops back in. The width holds; the status says resultLabel once.',
    beats: [
      'Out: the start, label and end parts roll up by --_button-roll (distance.shift) and fade over duration.quick on ease.exit.',
      'Land: one delay.stagger step later the result part grows from scale.morph on ease.spring-bouncy over duration.spring-bouncy and fades in over duration.fast.',
      'Draw: one stagger step in, each stroke draws with stroke-dashoffset from 1 to 0 (pathLength 1) over duration.morph on ease.out: the check from its short stroke to its long one; the error cross one stroke, then the other one duration.morph later.',
      'Error: the button shakes along the inline axis by --_button-shake (distance.nudge) over duration.celebrate: out, back past rest, half out, rest. Two swings, far under three flashes a second.',
      'Back: the glyph shrinks to scale.morph and fades over duration.quick; the parts drop in from above on the snappy spring.',
    ],
    styles: {
      studio: 'a quick draw, no swing',
      desk: 'a long draw and a shake that swings',
      neutral: 'a short draw and a small shake',
    },
    reduced: 'No roll, no shake, no draw: the glyph shows whole and the label fades.',
    off: {
      "[data-ds='button']": { '--_button-roll': '0px', '--_button-shake': '0px', '--_button-draw': '0' },
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'copy-swap',
    components: ['CopyButton'],
    pattern: 'swap',
    drive: 'css',
    trigger: 'A copy succeeds or fails, and the result ends after delay.feedback.',
    feedback:
      'The icon turns into the word: the copy glyph closes into its centre, the check wipes in along its strokes in the success color, and the label rolls from the action name to "Copied" like a counter. ' +
      'After a failure the warning pops in, the label rolls to "Could not copy" and the button shakes once. After the hold everything rolls on back to the name. ' +
      'The three words sit in one grid cell, so the button keeps the width of the widest and never changes size. The clipboard write, the state and the status are never delayed; the status says the result once per copy.',
    beats: [
      'Close: the copy glyph closes into its centre (clip-path circle 75% to 0), turns by --_copy-button-turn (minus 45 degrees) and shrinks to scale.morph over duration.quick on ease.exit.',
      'Draw: one delay.stagger step later the check wipes in from its inline start edge (clip-path inset) over duration.morph on ease.out while it grows from scale.morph on ease.spring-bouncy over duration.spring-bouncy; the icon color eases to the success text color over duration.morph.',
      'Roll: the name rolls up and out of the button over duration.quick on ease.exit; one stagger step later "Copied" rolls up into place from below the button on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms passing its place by 10%), whole in opacity by a third of the way.',
      'Failure: the warning pops in from scale.morph on the bouncy spring, the label rolls to "Could not copy", and the button shakes once (distance.nudge over duration.celebrate).',
      'Back: after delay.feedback the check is erased toward its end edge and the warning shrinks over duration.quick; the copy glyph opens on the snappy spring one stagger step later; the result word rolls up and out and the name rolls up from below.',
      'A second copy restarts the hold, draws the check again and says the result again.',
    ],
    styles: {
      studio: 'the glyphs and words cut over in steps',
      desk: 'a long roll that swings past its place and a full shake',
      neutral: 'a short wipe and roll',
    },
    reduced: 'No roll, turn, wipe or shake: CopyButton.css sets its own durations to 0s, so each state shows at once. The status still says the result.',
    off: {
      "[data-ds='copy-button']": { '--_copy-button-motion': '0' },
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'copy-bubble',
    components: ['CopyButton'],
    pattern: 'fade-rise',
    drive: 'css',
    trigger: 'A copy succeeds or fails in the icon only form, and the result ends after delay.feedback.',
    feedback:
      'With no room for the word in the button, a small bubble rises above it with the result word ("Copied", or "Could not copy"), stays while the check shows, and keeps rising as it fades when the result ends. It is aria-hidden: the status inside the button says the result.',
    beats: [
      'Rise: one delay.stagger step after the copy the bubble rises by --_copy-button-rise (distance.enter) from scale.enter into place on ease.spring-snappy over duration.spring-snappy, whole in opacity by 40% of the way.',
      'Hold: it stays while the button shows the result (delay.feedback).',
      'Leave: it rises another --_copy-button-rise as it fades over duration.base on ease.exit.',
      'A second copy replays the rise.',
    ],
    styles: {
      studio: 'a bubble that cuts in',
      desk: 'a long rise that swings past its place',
      neutral: 'a short rise',
    },
    reduced: 'The bubble shows and goes at once, in place.',
    off: {
      "[data-ds='copy-button']": { '--_copy-button-motion': '0' },
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'button-nudge',
    components: ['Button'],
    pattern: 'press',
    drive: 'css',
    trigger: 'The pointer rests on a button with an end icon, or the keyboard focuses it.',
    feedback:
      'The end part (an arrow, a chevron) moves distance.nudge toward the inline end, the way the action goes, on the snappy spring, and springs back when the pointer leaves. It flips in right to left text. Only the decorative part moves: the target stays under the pointer. Hover only where the device can hover.',
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
    trigger: 'The pointer rests on a close button, the keyboard focuses it, or a finger presses it.',
    feedback:
      'A round fill opens from the cross like a bloom while the cross turns a quarter turn on the snappy spring. A press pinches the cross and the button dips; release springs the cross back. The fill closes back into the centre when the pointer leaves. A cross looks the same after a quarter turn, so a quick pass never leaves it crooked.',
    beats: [
      'Hover: the ::before fill opens from the centre (clip-path circle 0 to 75%) on ease.spring-snappy over duration.spring-snappy while the glyph turns a quarter turn on the same spring (Neutral 180ms, Desk 300ms passing the turn by 10%, Studio 80ms in two steps).',
      'Press: the glyph pinches to --_close-button-pinch (scale.anticipate) over duration.instant and the button dips (button-press); the pressed fill shows at once.',
      'Release: the glyph springs back to full size on the snappy spring.',
      'Leave: the fill closes into the centre over duration.quick on ease.exit and the glyph turns back.',
    ],
    styles: {
      studio: 'a two step bloom and turn',
      desk: 'a bloom and a turn that swing past and back',
      neutral: 'a short bloom and a quiet turn',
    },
    reduced: 'CloseButton.css sets its durations to 0s: the fill shows whole at once; the glyph neither turns nor pinches.',
    off: {
      "[data-ds='close-button']": { '--_close-button-turn': '0deg', '--_close-button-pinch': '1' },
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'split-chevron',
    components: ['SplitButton'],
    pattern: 'menu-scale',
    drive: 'css',
    trigger: 'The pointer rests on the closed trigger of a SplitButton, a press on it opens the menu, or the menu closes.',
    feedback:
      'The chevron points the way the menu comes: it drops a little on hover, drops further while the trigger is held, as if pulling the menu out, then flips half a turn to point up as the menu opens, passing its mark and settling. It turns back on close.',
    beats: [
      'Hover (anticipation): the chevron drops distance.nudge toward the menu on ease.spring-snappy (hover capable devices only).',
      'Press: it drops --_split-button-drop-press (distance.shift) over duration.instant while the trigger is held; the trigger keeps its box.',
      'Open: it flips half a turn from that low point on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms in two steps) while the menu scales in from the trigger (menu-scale), and rises back to its line.',
      'Settle and close: it passes the half turn by the spring overshoot (Desk 10%) and settles pointing up; close turns it back the same way.',
    ],
    styles: {
      studio: 'a two step flip',
      desk: 'a deep pull and a flip that swings past and back',
      neutral: 'a short pull and flip with almost no swing',
    },
    reduced: 'SplitButton.css sets its durations to 0s: the chevron points up at once and does not drop.',
    off: {
      "[data-ds='split-button'] > [data-part='trigger']": {
        '--_button-motion': '0',
        '--_split-button-drop': '0px',
      },
      "[data-ds='split-button']": {
        '--_split-button-drop-press': '0px',
      },
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'fab-morph',
    components: ['FloatingActionButton'],
    pattern: 'swap',
    drive: 'css',
    trigger: 'The pointer rests on a floating action button, a press on it opens a menu or a popover (aria-expanded), or its extended label appears.',
    feedback:
      'The button floats: it rises a little under the pointer with its glow following, comes down and in when pressed, and the plus turns an eighth of a turn into a close mark while its panel is open. The extended label is unveiled from behind the icon in reading order. The width changes at once.',
    beats: [
      'Hover: the button rises by --_floating-action-button-lift (distance.lift) on the bouncy spring; the glow follows the pointer (button-glow). Hover capable devices only.',
      'Press: it comes down to scale.press, the icon sinks and the shade comes in (button-press).',
      'Open: the plus turns an eighth of a turn on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms in two steps), passing the eighth by the spring overshoot and settling as a close mark; it turns back on close.',
      'Extended label: its clip opens from the icon side to the inline end over duration.morph on ease.out while it slides from distance.shift behind the icon on the snappy spring and fades in over duration.fast.',
    ],
    styles: {
      studio: 'no lift, a two step turn and a short cut in',
      desk: 'a lift and a turn that swing, and a long reveal',
      neutral: 'a small lift, a short turn and a short reveal',
    },
    reduced: 'FloatingActionButton.css sets its durations to 0s: no lift and no slide. The plus shows as a close mark at once; the label shows at once.',
    off: {
      "[data-ds='floating-action-button']": {
        '--_floating-action-button-turn': '0deg',
        '--_floating-action-button-enter-x': '0px',
        '--_floating-action-button-lift': '0px',
        '--_floating-action-button-reveal': 'inset(0)',
      },
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'link-underline',
    components: ['Link'],
    pattern: 'chart-draw',
    drive: 'css',
    trigger: 'The pointer rests on a standalone link, the keyboard focuses it, or a finger presses it; the pointer rests on an external link.',
    feedback:
      'A second, stronger line draws over the thin rest underline from the inline start, so it runs right to left in Arabic, and is erased toward the inline end, faster, when the state ends: the line runs on in the reading direction and leaves the way it came. Drawn with clip-path, so its rounded ends never stretch. The text eases to its hover color and the external icon nudges toward where it leads. The rest underline never goes.',
    beats: [
      'Draw: the line clip opens from inset at the inline start to the whole label over duration.morph on ease.out (Neutral 200ms, Desk 320ms, Studio 100ms); the text color eases to the hover color over duration.morph.',
      'Erase: the clip closes toward the inline end over duration.quick on ease.exit, about half the draw.',
      'Secondary: the external icon moves distance.nudge up and toward the inline end on ease.spring-snappy over duration.spring-snappy.',
      'Press: while held, the drawn line grows heavier from its foot (scaleY to --_link-press-weight, 1.5) over duration.instant and springs back on ease.spring-snappy on release, so a tap answers under the finger.',
      'A hover in the middle of the erase starts a fresh draw from the start edge.',
    ],
    styles: {
      studio: 'a quick draw',
      desk: 'a long draw and a swinging icon',
      neutral: 'a short draw',
    },
    reduced: 'Link.css sets its own durations to 0s: the line shows and goes at once, no press weight, the icon stays still.',
    off: {
      "[data-ds='link']": {
        '--_link-motion': '0',
        '--_link-shift': '0px',
      },
    },
    round: 3,
    status: 'proposed',
  },
] as const satisfies readonly Interaction[];
