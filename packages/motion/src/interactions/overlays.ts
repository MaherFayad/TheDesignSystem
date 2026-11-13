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
// Order 1.23 (round 3) makes each one specific to what the overlay is: a
// popover, a hover card and a tooltip unfold out of their trigger (a larger
// scale along the axis away from it), a dialog's backdrop blurs the page in
// and its parts read within 200ms, a refused outside press nudges the panel,
// and toasts stack with depth, open into a list on hover or focus, swipe
// away with a rubber band and a flick, and show their time left on a line
// that pauses with the store.
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
const dialogOff = { '--_dialog-enter-y': '0px', '--_dialog-enter-scale': '1', '--_dialog-shift': '0px', '--_dialog-backdrop-blur': '0px' } as const;

export const overlaysInteractions = [
  {
    id: 'popover-spring',
    components: ['Popover', 'HoverCard'],
    pattern: 'menu-scale',
    drive: 'css',
    trigger: 'Open a popover from its trigger, or rest the pointer on a link with a hover card, then close it.',
    feedback:
      'A small surface that unfolds out of its trigger: it travels distance.shift out of its trigger side (data-side) and grows out of the Radix transform origin, more along the axis away from the trigger (scale.enter times scale.anticipate) than across it (scale.enter), while it fades in, on the bouncy spring, passing its size a little and settling. ' +
      'The title, the body and the footer (in a hover card, each piece of the preview) then rise distance.shift one delay.stagger step apart. A part with focus is there at once. ' +
      'Closing is faster, all at once, and takes no pointer.',
    beats: [
      'Action: the surface travels distance.shift and unfolds from scale.enter across and scale.enter times scale.anticipate along (Neutral 0.97 by 0.92) out of the trigger side, on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms, Studio 120ms in three steps).',
      'Overshoot: it passes its size (Neutral 6% of the way, Desk 25%) and settles.',
      'Stagger: title, body and footer rise distance.shift on ease.spring-soft over duration.spring-soft, at one, two and three delay.stagger steps (Neutral 24ms apart, Desk 45ms, Studio together).',
      'Exit: it folds back into the trigger the same way over duration.quick (a hover card duration.fast) on ease.exit, all at once, and lets the pointer through.',
    ],
    styles: {
      studio: 'a three step cut',
      desk: 'a bouncy landing with the parts cascading in',
      neutral: 'a light landing',
    },
    reduced: 'A fade with no travel, scale or stagger. Under reduced motion it is there and gone at once.',
    off: {
      "[data-ds='popover']": { '--_popover-enter-scale': '1', '--_popover-enter-stretch': '1', '--_popover-shift': '0px', '--_popover-item-shift': '0px' },
      "[data-ds='hover-card']": { '--_hover-card-enter-scale': '1', '--_hover-card-enter-stretch': '1', '--_hover-card-shift': '0px', '--_hover-card-item-shift': '0px' },
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'tooltip-rise',
    components: ['Tooltip'],
    pattern: 'fade-rise',
    drive: 'css',
    trigger: 'Rest the pointer on a control with a tooltip, or focus it.',
    feedback:
      'After the open delay the tooltip travels distance.shift from its trigger side (data-side) into place and unfolds out of the trigger, more along the axis away from it than across, while it fades in, on the snappy spring. The shortcut follows one delay.stagger step later. Closing plays the travel backward, faster, over duration.quick on ease.exit.',
    beats: [
      'Action: the tooltip travels distance.shift and unfolds from scale.enter across and scale.enter times scale.anticipate along on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms passing its place by 10%, Studio 80ms in two steps).',
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
      "[data-ds='tooltip']": { '--_tooltip-shift': '0px', '--_tooltip-enter-scale': '1', '--_tooltip-enter-stretch': '1' },
    },
    round: 3,
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
      'The backdrop fades in and the page behind it goes out of focus: its backdrop-filter blur grows from nothing to --_dialog-backdrop-blur (blur.backdrop) over the panel\'s rise. The panel rises distance.enter and grows from scale.dialog-enter on the soft spring, at full opacity within the first third of the rise, so the control that takes focus is readable almost at once. ' +
      'The parts then arrive one delay.stagger step apart: the title (and the AlertDialog icon, which pops from scale.morph on the bouncy spring), the description, the body, the footer. Each is readable duration.fast after its start and the last starts by duration.base, so the whole panel reads within 200ms; the rise settles after. A part that holds focus is there at once. ' +
      'Closing is faster (duration.quick on ease.exit), all at once: the blur goes with the backdrop, and nothing waits for it. State machine: closed, opening, open, closing (refused is the row dialog-refuse).',
    beats: [
      'Action: the panel rises distance.enter (Neutral 6px, Desk 12px, Studio 4px) and grows from scale.dialog-enter (0.98) on ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms with a 2% overshoot, Studio 100ms in steps); its opacity is full at a third of that.',
      'Secondary: the backdrop blur grows from 0 to blur.backdrop (Neutral 8px) and the scrim reaches full opacity at a third, over the same run.',
      'Stagger: title at one step, description at two, body at three, footer at four (Neutral 24ms a step, Desk 45ms capped at duration.base 120ms, Studio 0ms); each fades in over duration.fast (80ms) on ease.out and rises distance.shift on the soft spring, so the last part reads by 200ms.',
      'React: the AlertDialog icon pops from scale.morph (Neutral 0.5, Desk 0.3, Studio 0.8) on ease.spring-bouncy over duration.spring-bouncy, passing its size and settling.',
      'Exit: panel and backdrop over duration.quick (100ms) on ease.exit, all at once; the blur falls back to 0 with the backdrop.',
    ],
    styles: {
      studio: 'a quick stepped rise, the parts together',
      desk: 'a long soft rise with a cascade and a bouncing icon',
      neutral: 'a short soft rise with a quick cascade',
    },
    reduced: 'The panel and the backdrop fade in and out with no travel, scale, blur or stagger. Under reduced motion they are there and gone at once. Without backdrop-filter, under reduced transparency and under more contrast the backdrop is a solid scrim with no blur.',
    off: {
      "[data-ds='dialog']": dialogOff,
      "[data-ds='alert-dialog']": dialogOff,
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'dialog-refuse',
    components: ['AlertDialog', 'Dialog', 'Sheet', 'Drawer'],
    pattern: 'shake',
    drive: 'waapi',
    trigger: 'Press the backdrop of an alert dialog, or of a dialog set to dismissible false; or press Escape on a dialog set to dismissible false.',
    feedback:
      'The dialog does not close, and says so: the panel nudges along the inline axis, out by --_dialog-refuse-shift (space.m), back past its place, a smaller swing and rest, inside duration.roll on ease.out (the shape of the catalog pattern shake, played on the panel with the Web Animations API under the style mode of useMotion). No color or light changes, so it is no flash. A second refusal cancels the first nudge and plays again, so a burst of presses never stacks or leaves the panel off its place. State machine: open, refused, open.',
    beats: [
      'Action: the panel swings --_dialog-refuse-shift (space.m) toward the inline end, then back past its place by 0.7 of that, on ease.out.',
      'Settle: a 0.35 swing and rest, all inside duration.roll (300ms).',
    ],
    styles: {
      studio: 'the same two swings, Studio timing',
      desk: 'the same two swings, Desk timing',
      neutral: 'two short swings',
    },
    reduced: 'No motion: the dialog stays open and still; its own actions are the way out.',
    round: 3,
    status: 'proposed',
  },
  {
    id: 'sheet-spring',
    components: ['Sheet', 'Drawer'],
    pattern: 'sheet',
    drive: 'css',
    trigger: 'Open a sheet or a drawer, close it, or drag a sheet by its handle and let go.',
    feedback:
      'The panel slides in its own size from its edge (a drawer from its side, mirrored in right to left layouts; a sheet from the block end) on the soft spring, with no fade, so the focused control is readable at once, while the backdrop blurs the page in as a dialog does. ' +
      'Its header, body and footer then rise one delay.stagger step apart. A sheet let go short of closing settles back on the same spring. Closing slides out faster, over duration.quick on ease.exit.',
    beats: [
      'Action: the panel slides from its edge on ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms passing its place by 2%, Studio 100ms in steps).',
      'Secondary: the backdrop blur grows from 0 to blur.backdrop over the slide.',
      'Stagger: header (or title) at one step, description at two, body at three, footer at four, each readable after duration.fast and rising distance.shift on the soft spring; all of it reads within 200ms.',
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
      "[data-ds='sheet']": { '--_dialog-slide': '0%', '--_dialog-enter-opacity': '0', '--_dialog-drag-duration': '0s', '--_dialog-shift': '0px', '--_dialog-backdrop-blur': '0px' },
      "[data-ds='drawer']": { '--_dialog-slide': '0%', '--_dialog-enter-opacity': '0', '--_dialog-shift': '0px', '--_dialog-backdrop-blur': '0px' },
    },
    round: 3,
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
      'The new toast comes in from its own edge, a full toast height (up from below at the bottom, down from above at the top), on the bouncy spring, readable by a third of the run, and pushes the one that was in front back into the stack. One delay.stagger later its icon pops from scale.morph. A closing toast fades and shrinks faster than it came, and the one behind it comes forward. State machine: entering, then stacked or in front.',
    beats: [
      'Action: the toast travels its own height in from the edge (--_toast-enter-y, 100%) and grows from scale.enter while it fades in, on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms landing past its place, Studio 120ms in steps); full opacity at 30%.',
      'Secondary: the toast that was in front steps back one place in the stack on the snappy spring (row toast-stack).',
      'Overshoot: one delay.stagger later the icon pops from scale.morph on the bouncy spring and settles.',
      'Exit: a closing toast fades and shrinks to scale.enter over duration.toast-exit (120ms) on ease.exit, faster than the entrance.',
    ],
    styles: { studio: 'a stepped arrival, icon with the card', desk: 'a springy arrival and a bouncing icon', neutral: 'a short spring from the edge, a small pop' },
    reduced: 'No motion: the toast is there and gone at once.',
    off: {
      "[data-ds='toast']": { '--_toast-enter-y': '0px', '--_toast-enter-scale': '1', '--_toast-icon-enter-scale': '1' },
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'toast-stack',
    components: ['Toast'],
    pattern: 'toast',
    drive: 'css',
    trigger: 'Show a second and a third toast while the first is still there.',
    feedback:
      'The toasts stack with depth instead of making a column: the newest is in front, and each older one sits behind it, its edge peeking --_toast-peek (space.s) past the one in front, a step smaller (--_toast-depth, 1 minus scale.anticipate) and clipped to the strip that shows, so nothing shows through a glass toast. A toast that joins pushes the others back a step; a toast that leaves brings them forward. From the fourth back a toast is hidden. ' +
      'Toaster.tsx measures the toasts and writes their place (stack.ts); Toast.css draws it with translate, scale and clip-path and transitions them on the snappy spring. Layout never animates and the store never waits. State machine: in front, stacked, hidden.',
    beats: [
      'Action: the toasts behind move one --_toast-peek step away from the edge, shrink one --_toast-depth step and clip to their strip, on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms passing their place, Studio 80ms in two steps).',
      'Secondary: the new toast enters in front (row toast-enter).',
      'Settle: a toast that leaves takes nothing with it: the ones behind come forward on the same spring.',
    ],
    styles: { studio: 'stepped moves', desk: 'springy room making', neutral: 'a quick step back' },
    reduced: 'No motion: the toasts take their places in the stack at once.',
    off: {
      "[data-ds='toast']": { '--_toast-stack-duration': '0s' },
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'toast-expand',
    components: ['Toast'],
    pattern: 'toast',
    drive: 'css',
    trigger: 'With two or more toasts shown, rest the pointer on the stack, or move focus into it (F8, then Tab); then move away.',
    feedback:
      'The stack opens into a list: each toast behind the front one travels to its own place (the toasts in front of it plus the gaps), grows back to full size and unclips, so all of them can be read and reached. The front toast never moves under the pointer. The list takes the pointer in its gaps too, so moving from one toast to the next keeps it open. Leaving it, pointer and focus, folds it back into the stack. While it is open the timers are paused. State machine: stacked, expanded, stacked.',
    beats: [
      'Action: the toasts behind travel out to their places in the list and unclip from their strip to the full card on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with a swing past, Studio 80ms in two steps).',
      'Secondary: the progress lines stop where they are (row toast-timer).',
      'Exit: on leave they fold back to their strips on the same spring.',
    ],
    styles: { studio: 'a stepped fan out', desk: 'a springy fan out that swings past', neutral: 'a quick fan out' },
    reduced: 'No motion: the list is open at once and folds at once; the pause is the same.',
    off: {
      "[data-ds='toast']": { '--_toast-stack-duration': '0s' },
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'toast-swipe',
    components: ['Toast'],
    pattern: 'toast',
    drive: 'css',
    trigger: 'Drag a toast toward the edge it sits on and let go, or flick it; or drag it the other way.',
    feedback:
      'While dragged toward its edge the toast follows the finger one to one. Dragged the other way it gives a little and no more (a rubber band that never passes 24px), so it is clear that way does nothing. Let go past 50px, or flung toward the edge faster than 0.3px a millisecond over its last 100ms, it travels on out in the swipe direction while it fades; let go short, it springs back. The Toaster runs the swipe itself (swipe.ts): Radix clamps to one way and reads distance only. The close button is the button path (WCAG 2.5.7). State machine: rest, swiping, back to rest or leaving.',
    beats: [
      'Action: the toast follows the finger (data-swipe move, no transition); the wrong way, the rubber band.',
      'Settle: let go short, it springs back on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms swinging past, Studio 80ms).',
      'Exit: past the distance or on a flick it travels a toast width further and fades over duration.toast-exit (120ms) on ease.exit; the toast behind comes forward.',
    ],
    styles: { studio: 'a stepped return', desk: 'a return that swings past its place', neutral: 'a quick return' },
    reduced: 'The toast still follows the finger. Let go, it is back in place at once, or it is gone where it was let go.',
    off: {
      "[data-ds='toast']": { '--_toast-duration': '0s', '--_toast-swipe-x': '0%', '--_toast-swipe-y': '0%' },
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'toast-timer',
    components: ['Toast'],
    pattern: 'toast',
    drive: 'css',
    trigger: 'Show a toast that closes by itself, then rest the pointer on it, focus it, or leave the window, and come back.',
    feedback:
      'A line on the toast\'s block end edge shows the time it has left: it shrinks toward the inline start, linear, over the toast\'s own duration (4s, 6s for a warning, or what the app configured). It stops while the toaster is paused, which is exactly when the toast store pauses its timer (pointer over the toasts, focus inside them, window blurred, tab hidden), and runs on from where it stopped. A repeat or an update starts the line again with the timer. The toast never closes while paused (WCAG 2.2.1). Danger toasts and toasts with an action stay until closed and have no line.',
    beats: [
      'Action: the progress part scales from 1 to 0 along the inline axis over the toast duration (--_toast-life), linear.',
      'Pause: animation-play-state paused under data-paused on the toaster, at once.',
      'Restart: a new version of the toast mounts a new line.',
    ],
    styles: { studio: 'a thin line in the tone', desk: 'a thin line in the tone', neutral: 'a thin line in the tone' },
    reduced: 'The timer runs and pauses the same; the line is not drawn.',
    off: {
      "[data-ds='toast']": { '--_toast-progress-thickness': '0px' },
    },
    round: 3,
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
