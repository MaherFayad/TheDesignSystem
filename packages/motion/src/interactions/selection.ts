// Interactions of the menus, lists and collections family (orders 1.21 to
// 1.23): menus, pickers, list boxes, the command palette, lists, chips and
// filters. Checkbox and radio moved to toggles.ts and the slider to fields.ts
// in order 1.23. See ./types.ts for the shape.
import type { Interaction } from './types';

/** The private properties that turn the menu travel off on a menu root. */
const menuOff = { '--_menu-enter-scale': '1', '--_menu-shift': '0px', '--_menu-item-shift': '0px' } as const;

export const selectionInteractions = [
  {
    id: 'picker-chevron-turn',
    components: ['Select', 'Combobox', 'MultiSelect'],
    pattern: 'swap',
    drive: 'css',
    trigger: 'The list of a picker opens or closes.',
    feedback: 'The chevron of the trigger turns half a turn while the list is open and back when it closes, on the snappy spring.',
    beats: ['Action and overshoot: the icon turns to 180deg on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms in steps), a little past and back.'],
    styles: { neutral: 'a quick turn', desk: 'a longer turn with a small overshoot', studio: 'a cut in steps' },
    reduced: 'The icon turns at once.',
    off: {
      "[data-ds='select']": { '--_select-turn': '0deg' },
      "[data-ds='combobox']": { '--_combobox-turn': '0deg' },
      "[data-ds='multi-select']": { '--_multi-select-turn': '0deg' },
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'menu-rows',
    components: ['Select', 'Combobox', 'Autocomplete', 'MultiSelect', 'TagField'],
    pattern: 'list-stagger',
    drive: 'waapi',
    primitive: 'stagger',
    trigger: 'The list of a picker opens.',
    feedback:
      'After the surface scales in, the rows rise by distance.enter and fade in one delay.stagger apart, starting one step after the surface, with every delay inside the 120ms stagger budget (stepsWithin), and each row at full opacity early in its run (readableEnter), so every row reads at full contrast within about 200ms. Every row is in the DOM and can be picked from the first frame. Results that change while it stays open do not stagger.',
    beats: [
      'Action: the popup surface scales in (menu-scale, unchanged).',
      'Secondary: row n rises from distance.enter (6, 12, 4px) and fades in on ease.spring-soft over duration.spring-soft (220, 340, 100ms), after n plus 1 delay.stagger (24, 45, 0ms), the steps capped so the last delay stays within 120ms; it is at full opacity by READABLE_AT of its run.',
    ],
    styles: { neutral: 'a short cascade', desk: 'a slow cascade', studio: 'all rows at once, a short rise' },
    reduced: 'The rows fade in together with no delay.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'picker-value-roll',
    components: ['Select'],
    pattern: 'swap',
    drive: 'waapi',
    primitive: 'stagger',
    trigger: 'A new value is picked in a Select.',
    feedback: 'The chosen label rolls up into the trigger from below while it fades in, clipped by the value part. Not on first paint.',
    beats: ['Action and overshoot: the label rises from distance.enter on ease.spring-snappy over duration.spring-snappy (180, 300, 80ms) and fades in, a little past its place and back.'],
    styles: { neutral: 'a short roll', desk: 'a taller roll', studio: 'a cut in steps' },
    reduced: 'The new label fades in.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'row-glide',
    components: ['ListBox', 'Select', 'Combobox', 'Autocomplete', 'MultiSelect', 'TagField', 'List'],
    pattern: 'tab-indicator',
    drive: 'waapi',
    primitive: 'flip',
    trigger: 'The lit row changes: the pointer or the arrow keys move the highlight of a list or a picker, or the pointer moves between linked rows of a List.',
    feedback:
      'The fill of the new row travels from where the old row was lit and stretches along its travel, so the highlight follows the pointer and the keys. Only a decorative layer inside the row moves: the rows, the hit areas and the focus ring stay still, and the new row is lit from the first frame.',
    beats: [
      'Action: the layer travels from the old row on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms in steps).',
      'Overshoot: it stretches to scale.stretch on the block axis at the middle of the travel (1.15, 1.3, 1.08) and settles a little past its row.',
    ],
    styles: { neutral: 'a short glide', desk: 'a stretchy glide', studio: 'a hop in steps' },
    reduced: 'The fill moves at once.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'collection-flip',
    components: ['List', 'TagField', 'MultiSelect', 'FilterBar', 'Chip'],
    pattern: 'drag-drop',
    drive: 'waapi',
    primitive: 'flip',
    trigger: 'Items of a collection are added, removed or moved: List rows, TagField tags, the tags of a MultiSelect trigger, the chips and parts of a FilterBar.',
    feedback:
      'Items that change place travel from their old box; a new item rises and pops in; a removed item is drawn once more in its old place by an inert clone that shrinks out, while the rest close the gap. Focus moves first, as the anatomy rule asks. A first paint plays nothing.',
    beats: [
      'Action: moved items travel on ease.spring-snappy over duration.spring-snappy (180, 300, 80ms).',
      'Overshoot: new items rise from distance.shift and grow from scale.enter on ease.spring-bouncy over duration.spring-bouncy (220, 440, 120ms), one delay.stagger apart.',
      'Exit: a removed item shrinks to scale.enter and fades over duration.quick (100ms) on ease.exit, faster than an entrance.',
    ],
    styles: { neutral: 'short moves', desk: 'bouncy pops and long moves', studio: 'hops in steps' },
    reduced: 'Nothing travels; new items fade in, removed items fade out.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'chip-check-pop',
    components: ['Chip', 'FilterBar'],
    pattern: 'swap',
    drive: 'waapi',
    primitive: 'icon-morph',
    trigger: 'A pressable chip is selected or cleared.',
    feedback: 'The glyph of the chip (the check when selected) turns in from minus 45 degrees, grows past its size and settles; the chips after it make room (collection-flip in a FilterBar). The press itself is the button press.',
    beats: ['Action and overshoot: the glyph turns in and grows from scale.morph on ease.spring-bouncy over duration.spring-bouncy (220, 440, 120ms).'],
    styles: { neutral: 'a small turn', desk: 'a bouncy turn', studio: 'a cut in steps' },
    reduced: 'The glyph fades in.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'filter-count-roll',
    components: ['FilterBar'],
    pattern: 'number-roll',
    drive: 'waapi',
    primitive: 'digit-roll',
    trigger: 'The active filter count or the result count of a FilterBar changes.',
    feedback: 'The count text rolls digit by digit, up when the number grows and down when it falls, in an aria-hidden copy; the real text sits beside it visually hidden, and the polite announcement is unchanged.',
    beats: ['Action: each changed character rolls in its own column on ease.spring-snappy over duration.spring-snappy (180, 300, 80ms), columns one delay.stagger apart from the last.'],
    styles: { neutral: 'a short roll', desk: 'a rippling roll', studio: 'hard flips' },
    reduced: 'The changed characters fade in.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'list-stagger',
    components: ['List'],
    pattern: 'list-stagger',
    drive: 'waapi',
    trigger: 'A list paints its rows for the first time.',
    feedback:
      'Each row rises by space.s over duration.slow on ease.reveal, one delay.stagger after the row before, capped at three steps (Neutral 72ms, Desk 135ms, Studio 0ms); each row is at full opacity by 30% of its run, so every row reads at full contrast within about 200ms. Every row is in the DOM and read at once. It never plays on a re-render, an added row, a reorder or rows hydrated from server HTML.',
    reduced: 'A fade of each row over duration.base with no delay and no rise.',
    status: 'proposed',
  },
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
] as const satisfies readonly Interaction[];
