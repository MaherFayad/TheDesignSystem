// Interactions of the overlays and menus family (orders 1.21 and 1.22). See
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

/** The private properties that turn the menu travel off on a menu root. */
const menuOff = { '--_menu-enter-scale': '1', '--_menu-shift': '0px', '--_menu-item-shift': '0px' } as const;
/** The private properties that turn the dialog travel off. */
const dialogOff = { '--_dialog-enter-y': '0px', '--_dialog-enter-scale': '1', '--_dialog-shift': '0px' } as const;

export const overlaysInteractions = [
  {
    id: 'menu-origin',
    components: ['DropdownMenu', 'ContextMenu', 'Menubar'],
    pattern: 'menu-scale',
    drive: 'css',
    trigger: 'Open a menu from its trigger (a press, a right click, a title of the menu bar, or the keys), then close it.',
    feedback:
      'The menu comes out of its trigger side: it travels distance.shift from the trigger and grows from scale.menu-enter out of the trigger corner while it fades in, on the snappy spring. ' +
      'Then the inside of each row (icon, text, shortcut, chevron), the labels and the separators rise distance.shift one delay.stagger step apart, capped at six steps. ' +
      'The row itself, its lit fill and its focus ring are there from the first frame. Closing is faster and all at once, and takes no pointer. ' +
      'In right to left layouts the menu grows from the corner at its trigger (the Radix origin is mirrored in DropdownMenu.css).',
    beats: [
      'Action: the surface travels distance.shift (Neutral 4px, Desk 6px, Studio 2px) out of the trigger side and grows from scale.menu-enter (0.97) while it fades in, on ease.spring-snappy over duration.spring-snappy (Neutral 180ms with a 1.5% overshoot, Desk 300ms with 10%, Studio 80ms in two steps).',
      'Stagger: the inside of each row, each label and each separator rises distance.shift and fades in on ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms, Studio 100ms), the first one step after the surface and each next one delay.stagger later (Neutral 24ms, Desk 45ms, Studio 0ms: Studio rows land together), capped at six steps.',
      'Settle: the surface passes its size a little (Neutral and Desk) and settles while the last rows land.',
      'Exit: the surface shrinks back toward the trigger and fades over duration.quick (100ms) on ease.exit, all at once, faster than it came.',
    ],
    styles: {
      studio: 'a quick cut in two steps, the rows together',
      desk: 'a springy drop from the title with rows that cascade',
      neutral: 'a short drop and a quick cascade',
    },
    reduced: 'A fade in and out, with no travel, scale or stagger. Under reduced motion the menu is there and gone at once.',
    off: {
      "[data-ds='dropdown-menu']": menuOff,
      "[data-ds='context-menu']": menuOff,
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'menu-row-slide',
    components: ['DropdownMenu', 'ContextMenu', 'Menubar'],
    pattern: 'tab-indicator',
    drive: 'waapi',
    trigger: 'Move the pointer down the rows of an open menu, or press the arrow keys; along a menu bar, move between the titles.',
    feedback:
      'The lit fill of a row (its ::after) starts where the last lit row was drawn and slides to the new row on the snappy spring, stretching or shrinking to its height. ' +
      'The highlight itself, the text color and the focus ring change at once; only the decorative fill travels. A hop over a separator or the menu padding still slides. ' +
      'On a menu bar the open fill slides from title to title when the arrow keys move along the row or the pointer opens the next menu. ' +
      'A second move while the fill travels hands over from where it is.',
    beats: [
      'Action: the new row lights at once (text color, focus ring, data-highlighted).',
      'Travel: the fill moves from the old row to the new one on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms passing the row by 10% and coming back, Studio 80ms in two steps).',
      'Settle: the fill rests on the row; a rapid run of rows reads as one fill gliding under the pointer.',
    ],
    styles: {
      studio: 'a two step hop from row to row',
      desk: 'a fill that glides and swings a little past each row',
      neutral: 'a short glide',
    },
    reduced: 'No slide: the fill is on the new row at once.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'menu-submenu-nudge',
    components: ['DropdownMenu', 'ContextMenu', 'Menubar'],
    pattern: 'pop',
    drive: 'css',
    trigger: 'Light a row that opens a submenu with the pointer or the arrow keys, or open its submenu.',
    feedback:
      'The chevron at the end of the row leans distance.nudge toward its submenu on the bouncy spring, mirrored in right to left layouts, and comes back over duration.quick when the row goes dark. The submenu then opens from that side with menu-origin.',
    beats: [
      'Action: the chevron moves distance.nudge (Neutral 2px, Desk 3px, Studio 1px) toward the submenu on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms passing its place by 25%, Studio 120ms in three steps).',
      'React: the submenu opens from its trigger side, its rows staggered.',
      'Exit: the chevron comes back over duration.quick on ease.exit.',
    ],
    styles: {
      studio: 'none: the pop preset of Studio is reduced, so the chevron stays still',
      desk: 'a bouncy lean toward the submenu',
      neutral: 'a small lean',
    },
    reduced: 'The chevron stays still.',
    off: {
      "[data-ds='dropdown-menu']": { '--_menu-nudge': '0px' },
      "[data-ds='context-menu']": { '--_menu-nudge': '0px' },
    },
    round: 2,
    status: 'proposed',
  },
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
    id: 'command-palette-open',
    components: ['CommandPalette'],
    pattern: 'dialog',
    drive: 'css',
    trigger: 'Open the command palette with its trigger or Mod+K, then close it.',
    feedback:
      'The backdrop fades and the panel rises distance.enter and grows from scale.dialog-enter on the snappy spring, at full opacity within the first third, so the search box, which has focus, is readable at once. The footer of key hints follows one delay.stagger step later. Closing is faster and all at once.',
    beats: [
      'Action: the panel rises and grows on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with a 10% overshoot, Studio 80ms in two steps).',
      'Stagger: the result rows follow (command-palette-results), the key hints one step after the panel.',
      'Exit: over duration.quick on ease.exit, all at once.',
    ],
    styles: {
      studio: 'a two step cut',
      desk: 'a springy rise',
      neutral: 'a short rise',
    },
    reduced: 'A fade with no travel. Under reduced motion it is there and gone at once.',
    off: {
      "[data-ds='command-palette']": { '--_command-palette-enter-y': '0px', '--_command-palette-enter-scale': '1', '--_command-palette-shift': '0px' },
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'command-palette-results',
    components: ['CommandPalette'],
    pattern: 'list-stagger',
    drive: 'waapi',
    primitive: 'stagger',
    trigger: 'Open the palette, or type in its search box.',
    feedback:
      'On open the rows of results rise one delay.stagger step apart after the panel (staggerGroup, capped at eight rows and six steps). On each new list the rows that stay slide from their old place to the new one (flipPlay on the snappy spring) and the new rows rise in order. ' +
      'The lit row is there at once: it shows where the arrow keys are. Typing is never held back: the list renders at once and only its drawing moves; a fast run of keys restarts the stagger from where each row is.',
    beats: [
      'Action: the list is rendered and the lit row is there at once.',
      'Stagger: the other new rows rise distance.enter and fade in on ease.spring-soft over duration.spring-soft, one delay.stagger step apart (Neutral 24ms, Desk 45ms, Studio together), at most six steps.',
      'React: rows that stay slide to their new place on ease.spring-snappy over duration.spring-snappy.',
    ],
    styles: {
      studio: 'played reduced by the list-stagger preset: a fade',
      desk: 'a visible cascade and rows that swing into place',
      neutral: 'played reduced by the list-stagger preset: a fade',
    },
    reduced: 'The new rows fade in with no delay; rows that stay jump to their place.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'command-palette-row-slide',
    components: ['CommandPalette'],
    pattern: 'tab-indicator',
    drive: 'waapi',
    trigger: 'Press ArrowDown or ArrowUp in the search box, or move the pointer over the results.',
    feedback:
      'The lit fill of a row (its ::after) slides from the old row to the new one on the snappy spring, as in the menus (menu-row-slide). The active descendant, the text color and the announcement change at once.',
    beats: [
      'Action: the new row is the active descendant at once.',
      'Travel: the fill moves on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with a 10% swing, Studio 80ms in two steps).',
    ],
    styles: {
      studio: 'a two step hop',
      desk: 'a glide that swings past the row a little',
      neutral: 'a short glide',
    },
    reduced: 'No slide: the fill is on the new row at once.',
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
] as const satisfies readonly Interaction[];
