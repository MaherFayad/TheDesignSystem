// Interactions of the overlays family (orders 1.21 to 1.23): popovers,
// tooltips, dialogs, sheets, toasts, the notification center, lightbox, tour
// and windows. Menus moved to selection.ts in order 1.23. See
// ./types.ts for the shape. Order 1.22 raises each one to a small
// choreography: the surface comes out of its trigger on a spring, its parts
// arrive one stagger step apart, the exit is faster than the entrance and
// never staggers, and the highlight or the spotlight travels instead of
// jumping. Spring overshoot per style, from the tokens: Neutral bouncy 6%,
// snappy 1.5%, soft none; Desk bouncy 25%, snappy 10%, soft 2%; Studio steps.
//
// Every CSS row reads its motion from private properties on the component
// root (packages/css/src/components: DropdownMenu.css, Popover.css,
// HoverCard.css, Tooltip.css, Dialog.css, CommandPalette.css, Lightbox.css,
// Tour.css, WindowControls.css), so `off` turns the travel and the scale off
// and leaves a fade, or nothing where the motion only moves. Focus moves
// into every overlay at once: a part that holds focus never waits for its
// stagger step.
import type { Interaction } from './types';

/** The private properties that turn the dialog travel off. */
const dialogOff = { '--_dialog-enter-y': '0px', '--_dialog-enter-scale': '1', '--_dialog-shift': '0px' } as const;

export const overlaysInteractions = [
  {
    id: 'popover-spring',
    components: ['Popover', 'HoverCard'],
    pattern: 'menu-scale',
    drive: 'css',
    trigger: 'Open a popover from its trigger, or rest the pointer on a link with a hover card, then close it.',
    feedback:
      'A small surface that lands: it travels distance.shift out of its trigger side and grows from scale.enter while it fades in, on the bouncy spring, passing its size a little and settling. ' +
      'The title, the body and the footer (in a hover card, each piece of the preview) then rise distance.shift one delay.stagger step apart. A part with focus is there at once. ' +
      'Closing is faster, all at once, and takes no pointer.',
    beats: [
      'Action: the surface travels distance.shift and grows from scale.enter (Neutral 0.97, Desk 0.9, Studio 1) on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms, Studio 120ms in three steps).',
      'Overshoot: it passes its size (Neutral 6% of the way, Desk 25%) and settles.',
      'Stagger: title, body and footer rise distance.shift on ease.spring-soft over duration.spring-soft, at one, two and three delay.stagger steps (Neutral 24ms apart, Desk 45ms, Studio together).',
      'Exit: over duration.quick (a hover card duration.fast) on ease.exit, all at once.',
    ],
    styles: {
      studio: 'a three step cut',
      desk: 'a bouncy landing with the parts cascading in',
      neutral: 'a light landing',
    },
    reduced: 'A fade with no travel, scale or stagger. Under reduced motion it is there and gone at once.',
    off: {
      "[data-ds='popover']": { '--_popover-enter-scale': '1', '--_popover-shift': '0px', '--_popover-item-shift': '0px' },
      "[data-ds='hover-card']": { '--_hover-card-enter-scale': '1', '--_hover-card-shift': '0px', '--_hover-card-item-shift': '0px' },
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'tooltip-rise',
    components: ['Tooltip'],
    pattern: 'fade-rise',
    drive: 'css',
    trigger: 'Rest the pointer on a control with a tooltip, or focus it.',
    feedback:
      'After the open delay the tooltip travels distance.shift from its trigger side (data-side) into place and grows from scale.enter while it fades in, on the snappy spring. The shortcut follows one delay.stagger step later. Closing plays the travel backward, faster, over duration.quick on ease.exit.',
    beats: [
      'Action: the tooltip travels distance.shift and grows from scale.enter on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms passing its place by 10%, Studio 80ms in two steps).',
      'Stagger: the shortcut rises distance.shift one delay.stagger step later on the soft spring.',
      'Exit: back toward the trigger over duration.quick (100ms) on ease.exit.',
    ],
    styles: {
      studio: 'a two step pop',
      desk: 'a springy rise with the shortcut a beat later',
      neutral: 'a short rise',
    },
    reduced: 'A fade with no travel. Under reduced motion the tooltip is there and gone at once.',
    off: {
      "[data-ds='tooltip']": { '--_tooltip-shift': '0px', '--_tooltip-enter-scale': '1' },
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'tooltip-follow',
    components: ['Tooltip'],
    pattern: 'tab-indicator',
    drive: 'waapi',
    primitive: 'flip',
    trigger: 'With a tooltip open, move the pointer (or Tab) to the next control of the same toolbar inside the skip delay.',
    feedback:
      'Instead of a fade out and a fade in, the tooltip seems to move: the new one opens at once (data-state instant-open), starts where the last one was drawn and slides to its own place on the snappy spring (flipPlay, translate only), and the last one is hidden at once. ' +
      'The new tooltip describes its trigger from its first frame.',
    beats: [
      'Action: the next tooltip is open at once and the last one is hidden.',
      'Travel: it slides from the old place to the new one on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with a 10% swing, Studio 80ms in two steps).',
      'Settle: it rests over its trigger; a run along a toolbar reads as one tooltip following the pointer.',
    ],
    styles: {
      studio: 'a two step hop',
      desk: 'a glide that swings a little past the next control',
      neutral: 'a short glide',
    },
    reduced: 'No slide: the next tooltip is there at once and the last one goes, as in round 1.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'dialog-spring',
    components: ['Dialog', 'AlertDialog'],
    pattern: 'dialog',
    drive: 'css',
    trigger: 'Open a dialog, then close it.',
    feedback:
      'The backdrop fades in while the panel rises distance.enter and grows from scale.dialog-enter on the soft spring, at full opacity within the first third of the rise, so the control that takes focus is readable almost at once. ' +
      'The parts then arrive one delay.stagger step apart: the title (and the AlertDialog icon, which pops from scale.morph on the bouncy spring), the description, the body, the footer. A part that holds focus is there at once. ' +
      'Closing is faster (duration.quick on ease.exit), all at once, and nothing waits for it.',
    beats: [
      'Action: the panel rises distance.enter (Neutral 6px, Desk 12px, Studio 4px) and grows from scale.dialog-enter (0.98) on ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms with a 2% overshoot, Studio 100ms in steps); its opacity is full at a third of that.',
      'Stagger: title at one step, description at two, body at three, footer at four (Neutral 24ms a step, Desk 45ms, Studio 0ms), each rising distance.shift on the soft spring.',
      'React: the AlertDialog icon pops from scale.morph (Neutral 0.5, Desk 0.3, Studio 0.8) on ease.spring-bouncy over duration.spring-bouncy, passing its size and settling.',
      'Exit: panel and backdrop over duration.quick (100ms) on ease.exit, all at once.',
    ],
    styles: {
      studio: 'a quick stepped rise, the parts together',
      desk: 'a long soft rise with a cascade and a bouncing icon',
      neutral: 'a short soft rise with a quick cascade',
    },
    reduced: 'The panel and the backdrop fade in and out with no travel, scale or stagger. Under reduced motion they are there and gone at once.',
    off: {
      "[data-ds='dialog']": dialogOff,
      "[data-ds='alert-dialog']": dialogOff,
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'sheet-spring',
    components: ['Sheet', 'Drawer'],
    pattern: 'sheet',
    drive: 'css',
    trigger: 'Open a sheet or a drawer, close it, or drag a sheet by its handle and let go.',
    feedback:
      'The panel slides in its own size from its edge (a drawer from its side, mirrored in right to left layouts; a sheet from the block end) on the soft spring, with no fade, so the focused control is readable at once. ' +
      'Its header, body and footer then rise one delay.stagger step apart. A sheet let go short of closing settles back on the same spring. Closing slides out faster, over duration.quick on ease.exit.',
    beats: [
      'Action: the panel slides from its edge on ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms passing its place by 2%, Studio 100ms in steps).',
      'Stagger: header (or title) at one step, description at two, body at three, footer at four, each rising distance.shift on the soft spring.',
      'Settle: a released sheet springs back to rest on the soft spring.',
      'Exit: the panel slides out over duration.quick (100ms) on ease.exit, all at once.',
    ],
    styles: {
      studio: 'a quick stepped slide',
      desk: 'a long slide that settles past its edge and back',
      neutral: 'a short soft slide',
    },
    reduced: 'The panel fades in and out where it rests, with no slide or stagger, and a released sheet is back in place at once.',
    off: {
      "[data-ds='sheet']": { '--_dialog-slide': '0%', '--_dialog-enter-opacity': '0', '--_dialog-drag-duration': '0s', '--_dialog-shift': '0px' },
      "[data-ds='drawer']": { '--_dialog-slide': '0%', '--_dialog-enter-opacity': '0', '--_dialog-shift': '0px' },
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'lightbox-zoom',
    components: ['Lightbox'],
    pattern: 'window-grow',
    drive: 'waapi',
    primitive: 'flip',
    trigger: 'Press a thumbnail that opens the viewer, then close the viewer.',
    feedback:
      'The image grows out of the thumbnail into its place (flipPlay with scale, on the soft spring) while the panel and the backdrop fade in, the panel at full opacity within the first third. The toolbar, the arrows and the caption then rise one delay.stagger step apart; a part with focus is there at once. ' +
      'On close the image shrinks back into the thumbnail over duration.base on ease.exit while the panel holds, then fades: faster than it came. An image that is still loading grows once it has a size.',
    beats: [
      'Action: the image travels and grows from the thumbnail box on ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms with a 2% overshoot, Studio 100ms in steps).',
      'Stagger: toolbar at one step, arrows at two, caption at three, each rising distance.shift on the soft spring.',
      'Exit: the image shrinks back into the thumbnail over duration.base (120ms) on ease.exit; the panel holds for half of that and fades.',
    ],
    styles: {
      studio: 'the panel fades, the image zooms in steps',
      desk: 'a long zoom that settles',
      neutral: 'a short zoom',
    },
    reduced: 'The viewer fades in and out; the image does not travel.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'tour-spotlight',
    components: ['Tour'],
    pattern: 'menu-scale',
    drive: 'waapi',
    primitive: 'flip',
    trigger: 'Start a tour, then press Next or Back.',
    feedback:
      'On open the ring closes in on its target (it shrinks from scale.pop and fades in on the snappy spring) and the panel lands on the bouncy spring, its title, body and footer staggered. ' +
      'On each step the ring travels from the old target to the new one (flipPlay of its box, on the snappy spring) and the panel follows one delay.stagger step later on the soft spring, while the new title, body and footer rise in order. Focus moves to the panel at once.',
    beats: [
      'Action: the ring moves and resizes to the new target on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with a 10% overshoot, Studio 80ms in two steps).',
      'Follow: the panel moves one delay.stagger step later on ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms, Studio 100ms).',
      'Stagger: title, body and footer rise distance.shift one step apart after the panel.',
      'Exit: ring and panel go over duration.fast, all at once.',
    ],
    styles: {
      studio: 'stepped moves, the panel right behind the ring',
      desk: 'a springy ring with the panel trailing a beat',
      neutral: 'a short glide and a light trail',
    },
    reduced: 'No travel: the ring and the panel are at the new target at once; the new text fades in.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'window-settle',
    components: ['Window'],
    pattern: 'window-grow',
    drive: 'waapi',
    trigger: 'Open a window, zoom it, minimize and restore it, close it.',
    feedback:
      'The Desk window motion (grow out of the origin, zoom with a FLIP, fall into the dock, shrink back on close) keeps its timing and gains a settle, added on top of it (composite add): a window that lands (open, zoom, restore) swells to scale.lift near the end and settles; one that leaves (close, minimize) gathers to scale.lift for a moment before it shrinks.',
    beats: [
      'Anticipation (close, minimize): the window swells to scale.lift (Desk 1.03) over duration.quick on ease.exit while the shrink starts.',
      'Action: the window pattern as before (duration.window-open, -zoom, -close, -minimize).',
      'Overshoot and settle (open, zoom, restore): at 55% of the pattern the window swells to scale.lift and settles over duration.spring-bouncy (Desk 440ms) on ease.out.',
    ],
    styles: {
      studio: 'none: Studio windows fade',
      desk: 'a landing swell and a gather before leaving',
      neutral: 'none: Neutral windows fade',
    },
    reduced: 'The window fades; no settle.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'window-lights',
    components: ['WindowControls', 'TitleBar'],
    pattern: 'pop',
    drive: 'css',
    trigger: 'Move the pointer over the lights of a window or a title bar, or Tab into them; press one.',
    feedback:
      'The colors come in at once and each glyph pops in from scale.morph on the bouncy spring, close, minimize and zoom one delay.stagger step apart. Leaving fades the glyphs out together, faster. A press dips the 12px dot to scale.anticipate inside its unmoving 24px target and springs back.',
    beats: [
      'Action: the colors fade in over duration.fast.',
      'Stagger and overshoot: the glyphs grow from scale.morph on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms passing their size by 25%, Studio 120ms in three steps), one delay.stagger step apart.',
      'Press: the dot dips to scale.anticipate on the snappy spring and springs back on release.',
      'Exit: the glyphs shrink and fade together over duration.fast on ease.exit.',
    ],
    styles: {
      studio: 'none: the pop preset of Studio is reduced, so the glyphs show at once',
      desk: 'glyphs that pop one after another',
      neutral: 'a quick pop',
    },
    reduced: 'The colors and glyphs are there at once; no dip.',
    off: {
      "[data-ds='window-controls']": { '--_window-controls-enter-scale': '1', '--_window-controls-press-scale': '1' },
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'toast-enter',
    components: ['Toast'],
    pattern: 'toast',
    drive: 'css',
    trigger: 'A toast is shown, or closed by its timer, its close button or Escape.',
    feedback:
      'The new toast springs in from the edge of the toaster and its icon pops a beat later; a closing toast fades and shrinks faster than it came.',
    beats: [
      'Action: the toast travels space.xs in from the edge and grows from scale.enter while it fades in, on ease.spring-bouncy over duration.spring-bouncy, landing past its place in Desk.',
      'Overshoot: one delay.stagger later the icon pops from scale.morph on the bouncy spring and settles.',
      'Exit: a closing toast fades and shrinks to scale.enter over duration.toast-exit on ease.exit, faster than the entrance.',
    ],
    styles: { studio: 'a stepped arrival, icon with the card', desk: 'a springy arrival and a bouncing icon', neutral: 'a short spring, a small pop' },
    reduced: 'No motion: the toast is there and gone at once.',
    off: {
      "[data-ds='toast']": { '--_toast-enter-y': '0px', '--_toast-enter-scale': '1', '--_toast-icon-enter-scale': '1' },
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'toast-stack',
    components: ['Toast'],
    pattern: 'drag-drop',
    drive: 'waapi',
    primitive: 'flip',
    trigger: 'A toast joins the stack or leaves it while other toasts are shown.',
    feedback:
      'The toasts that stay move from where they were to their new place with a transform on a spring (flipPlay). Layout never animates and the store never waits; the pause on hover and focus is kept.',
    beats: [
      'Secondary: each toast that has to make room travels from its old place on ease.spring-snappy over duration.spring-snappy (180, 300, 80ms), past its place in Desk; a move still in flight starts from where the toast is drawn.',
    ],
    styles: { studio: 'stepped moves', desk: 'springy room making', neutral: 'a quick slide' },
    reduced: 'No motion: the toasts that stay take their new place at once.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'toast-swipe',
    components: ['Toast'],
    pattern: 'toast',
    drive: 'css',
    trigger: 'Drag a toast toward the edge it sits on, then let go.',
    feedback:
      'While dragged the toast follows the finger. Let go short of the threshold it springs back on the snappy spring; past it, it travels on out in the swipe direction while it fades.',
    beats: [
      'Action: the toast follows the finger (the Radix swipe variables, no transition).',
      'Settle: let go short, it springs back on ease.spring-snappy over duration.spring-snappy; past the threshold it travels on out over duration.toast-exit on ease.exit.',
    ],
    styles: { studio: 'a stepped return', desk: 'a return that swings past its place', neutral: 'a quick return' },
    reduced: 'The toast still follows the finger. Let go, it is back in place at once, or it is gone where it was let go.',
    off: {
      "[data-ds='toast']": { '--_toast-duration': '0s', '--_toast-swipe-x': '0%', '--_toast-swipe-y': '0%' },
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'notification-change',
    components: ['NotificationCenter'],
    pattern: 'drag-drop',
    drive: 'waapi',
    primitive: 'flip',
    trigger: 'A notification is added or removed, or the unread count changes.',
    feedback: 'New entries pop in, removed entries shrink away, the rest slide to their new place, and the unread count rolls and pops.',
    beats: [
      'Action: a new entry rises distance.shift and grows from scale.enter while it fades in, on ease.spring-bouncy over duration.spring-bouncy; several new entries start one delay.stagger apart (flipPlay enter).',
      'Exit: a removed entry comes back as a ghost that shrinks to scale.enter and fades over duration.quick (flipExit).',
      'Secondary: the entries and group labels that stay travel from their old place on the snappy spring.',
      'Secondary: the number in the unread count rolls digit by digit (rollDigits; the words stay whole) and the count pill pops to scale.pop over duration.celebrate.',
    ],
    styles: { studio: 'stepped moves, no pop', desk: 'bouncy entries and a big pop', neutral: 'short slides and a small pop' },
    reduced: 'New entries fade in; the rest take their place at once; the new count fades in.',
    round: 2,
    status: 'proposed',
  },
] as const satisfies readonly Interaction[];
