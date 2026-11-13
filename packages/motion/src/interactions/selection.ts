// Interactions of the menus, lists and collections family (orders 1.21 to
// 1.23): menus, pickers, list boxes, the command palette, lists, chips and
// filters. Checkbox and radio moved to toggles.ts and the slider to fields.ts
// in order 1.23. See ./types.ts for the shape.
import type { Interaction } from './types';

/** The private properties that turn the menu travel, the scale and the clip reveal off on a menu root. */
const menuOff = { '--_menu-enter-scale': '1', '--_menu-shift': '0px', '--_menu-item-shift': '0px', '--_menu-clip-from': 'var(--_menu-clip-to)' } as const;
/** The same for a picker popup, which has no staggered row insides in CSS. */
const popupOff = { '--_menu-enter-scale': '1', '--_menu-shift': '0px', '--_menu-clip-from': 'var(--_menu-clip-to)' } as const;

export const selectionInteractions = [
  {
    id: 'picker-chevron-turn',
    components: ['Select', 'Combobox', 'MultiSelect'],
    pattern: 'swap',
    drive: 'css',
    trigger: 'The list of a picker opens or closes.',
    feedback: 'The chevron of the trigger flips on its block axis while the list is open and back when it closes, on the snappy spring, so it never shows a sideways shape (order 1.29; a half turn where cos() is missing).',
    beats: ['Action and overshoot: the icon scales on the block axis to the cosine of the open angle (-1 at 180deg) on ease.spring-snappy over duration.spring-snappy (Neutral 158ms, Desk 300ms, Studio 70ms in steps).'],
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
    // Order 1.23: played with the surface (menu-scale), so a style that keeps the menu entrance keeps the cascade.
    pattern: 'menu-scale',
    drive: 'waapi',
    primitive: 'stagger',
    trigger: 'The list of a picker opens.',
    feedback:
      'Every row fades in with the surface, on the snappy spring with no delay (full opacity at 40 percent), so no empty card shows; only the rise by distance.enter is staggered, one delay.stagger apart starting one step after the surface, with every delay inside the 120ms stagger budget (stepsWithin) (order 1.29). Every row is in the DOM and can be picked from the first frame, and the highlight marker is on the lit row at once. Results that change while it stays open play combobox-results instead.',
    beats: [
      'Action: the popup surface opens from the field (menu-origin).',
      'Secondary: every row fades in over duration.spring-snappy with no delay; row n rises from distance.enter (4, 12, 0px) on ease.spring-soft over duration.spring-soft (200, 340, 100ms), after n plus 1 delay.stagger (24, 45, 0ms), the steps capped so the last delay stays within 120ms.',
    ],
    styles: { neutral: 'a short cascade', desk: 'a slow cascade', studio: 'all rows at once, a short rise' },
    reduced: 'The rows fade in together with no delay.',
    round: 3,
    status: 'proposed',
  },
  {
    id: 'picker-value-roll',
    components: ['Select'],
    pattern: 'swap',
    drive: 'waapi',
    trigger: 'A new value is picked in a Select, with the pointer or the keys.',
    feedback:
      'The value of the trigger rolls like a drum: the old label, drawn once more by an inert aria-hidden copy, leaves one line up and fades, while the new label comes up from one line below. A clip-path that moves against the travel keeps both inside the value box. The new label is the real text from the first frame and the list has already closed. Not on first paint. A second pick while it rolls starts from where the label is.',
    beats: [
      'Anticipation: none; the list closes at once (Radix Select has no exit).',
      'Exit: the old label rises one line (translateY minus 100%) and fades over duration.quick (100ms) on ease.exit, clipped by the value box.',
      'Action and overshoot: the new label rises from one line below to its place on ease.spring-snappy over duration.spring-snappy (158, 300, 70ms), a little past and back.',
    ],
    styles: { neutral: 'a short drum roll', desk: 'a taller roll that swings past', studio: 'a cut in steps' },
    reduced: 'The new label fades in; the old one is gone at once.',
    round: 3,
    status: 'proposed',
  },
  {
    id: 'row-glide',
    components: ['List'],
    pattern: 'tab-indicator',
    drive: 'waapi',
    primitive: 'flip',
    trigger: 'The pointer moves between linked rows of a List.',
    feedback:
      'The fill of the new row travels from where the old row was lit and stretches along its travel, so the hover follows the pointer. Only a decorative layer inside the row moves: the rows, the hit areas and the focus ring stay still, and the new row is lit from the first frame. Order 1.23: the option lists and the pickers moved to highlight-marker.',
    beats: [
      'Action: the layer travels from the old row on ease.spring-snappy over duration.spring-snappy (Neutral 158ms, Desk 300ms, Studio 70ms in steps).',
      'Overshoot: it stretches to scale.stretch on the block axis at the middle of the travel (1.15, 1.3, 1.08) and settles a little past its row.',
    ],
    styles: { neutral: 'a short glide', desk: 'a stretchy glide', studio: 'a hop in steps' },
    reduced: 'The fill moves at once.',
    round: 3,
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
      'Action: moved items travel on ease.spring-snappy over duration.spring-snappy (158, 300, 70ms).',
      'Overshoot: new items rise from distance.shift and grow from scale.enter on ease.spring-bouncy over duration.spring-bouncy (200, 380, 120ms), one delay.stagger apart.',
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
    feedback:
      'Selecting: the check is drawn in the icon part (a stroked check draws from its short arm with stroke-dashoffset, a filled pixel check wipes in with clip-path in steps) while it pops from 0.6 past its size and back, and the label slides over to make room instead of jumping; the chips after it make room (collection-flip in a FilterBar). Clearing: the start glyph turns back in from minus 45 degrees, or the label slides back. The pressed state, aria-pressed and the fill change at once; the press itself is the button press.',
    beats: [
      'Action: the fill and aria-pressed change at once.',
      'Draw: the check draws over duration.spring-snappy (158, 300, 70ms) on ease.out.',
      'Overshoot: the check grows from 0.6 past its size on ease.spring-bouncy over duration.spring-bouncy (200, 380, 120ms).',
      'React: the label slides from its old place on ease.spring-snappy over duration.spring-snappy.',
    ],
    styles: { neutral: 'a quick draw and a small pop', desk: 'a slower draw and a bouncy pop', studio: 'a pixel wipe in steps' },
    reduced: 'The check fades in; the label is at its place at once.',
    round: 3,
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
    beats: ['Action: each changed character rolls in its own column on ease.spring-snappy over duration.spring-snappy (158, 300, 70ms), columns one delay.stagger apart from the last.'],
    styles: { neutral: 'a short roll', desk: 'a rippling roll', studio: 'hard flips' },
    reduced: 'The changed characters fade in.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'list-stagger',
    components: ['List'],
    // Order 1.23: played by the stagger primitive with the fade-rise pattern, so Neutral and Studio differ.
    pattern: 'fade-rise',
    drive: 'waapi',
    primitive: 'stagger',
    trigger: 'A list paints its rows for the first time.',
    feedback:
      'Each row rises by distance.enter and fades in on the soft spring, one delay.stagger after the row before, the steps kept inside the 120ms stagger budget; each row is at full opacity early in its run, so every row reads at full contrast within about 200ms. Every row is in the DOM and read at once. It never plays on a re-render, an added row (collection-flip plays then), a reorder or rows hydrated from server HTML.',
    beats: [
      'Action: row n rises from distance.enter (4, 12, 0px) and fades in on ease.spring-soft over duration.spring-soft (200, 340, 100ms), after n delay.stagger (24, 45, 0ms), capped within 120ms.',
      'Settle: the soft spring lands each row without a bounce.',
    ],
    styles: { neutral: 'a short cascade', desk: 'a slow cascade', studio: 'the rows rise together, a short lift' },
    reduced: 'A fade of the rows over duration.base with no delay and no rise.',
    round: 3,
    status: 'proposed',
  },
  {
    id: 'menu-origin',
    components: ['DropdownMenu', 'ContextMenu', 'Menubar', 'Select', 'Combobox', 'Autocomplete', 'MultiSelect', 'TagField'],
    pattern: 'menu-scale',
    drive: 'css',
    trigger: 'Open a menu or a picker list from its trigger (a press, a right click, a title of the menu bar, a field, or the keys), then close it.',
    feedback:
      'The surface comes out of its trigger side, read from the Radix side and origin: it travels distance.shift from the trigger, grows from scale.menu-enter out of the trigger corner, fades in, and a clip-path opens it from the trigger edge (the top edge for a list below its trigger, the inline start edge for a submenu), on the snappy spring. ' +
      'Then the inside of each menu row (icon, text, shortcut, chevron), the labels and the separators rise distance.shift one delay.stagger step apart, capped at six steps; they fade with the surface and never on their own, so the last row is readable when the surface is (order 1.29); picker rows play menu-rows. ' +
      'The row itself, the highlight marker and the focus ring are there from the first frame. Closing is faster and all at once: the real content leaves the DOM at once (a press on the trigger reopens at once, review B6) and an inert aria-hidden copy plays the exit: the clip closes back toward the trigger while it shrinks and fades. ' +
      'In right to left layouts the menu grows from the corner at its trigger (the Radix origin is mirrored in DropdownMenu.css). Radix Select has no exit presence: its list leaves at once.',
    beats: [
      'Closed: nothing drawn.',
      'Opening: the surface travels distance.shift (Neutral 4px, Desk 6px, Studio 0px) out of the trigger side, grows from scale.menu-enter (0.97), fades in (full by 40%) and is revealed by the clip from the trigger edge, on ease.spring-snappy over duration.spring-snappy (Neutral 158ms with a 1.5% overshoot, Desk 300ms with 10%, Studio 70ms in two steps). The clip keeps --_menu-clip-room around the box for the shadow.',
      'Stagger: the inside of each row, each label and each separator rises distance.shift and fades in on ease.spring-soft over duration.spring-soft (Neutral 200ms, Desk 340ms, Studio 100ms), the first one step after the surface and each next one delay.stagger later (Neutral 24ms, Desk 45ms, Studio 0ms), capped at six steps: all readable within 200ms in Neutral.',
      'Open: the surface passes its size a little (Neutral and Desk) and settles while the last rows land.',
      'Closing: the clip closes toward the trigger while the surface shrinks back and fades over duration.quick (100ms) on ease.exit, all at once, about half the time of the entrance.',
    ],
    styles: {
      studio: 'a quick cut in two steps, the rows together',
      desk: 'a springy drop from the title with rows that cascade',
      neutral: 'a short drop and a quick cascade',
    },
    reduced: 'A fade in and out, with no travel, scale, clip or stagger. Under reduced motion the menu is there and gone at once.',
    off: {
      "[data-ds='dropdown-menu']": menuOff,
      "[data-ds='context-menu']": menuOff,
      "[data-ds='select']": popupOff,
      "[data-ds='combobox']": popupOff,
      "[data-ds='autocomplete']": popupOff,
      "[data-ds='multi-select']": popupOff,
      "[data-ds='tag-field']": popupOff,
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'menu-row-slide',
    components: ['Menubar'],
    pattern: 'tab-indicator',
    drive: 'waapi',
    trigger: 'Move along the titles of a menu bar with the arrow keys, or open the next menu with the pointer.',
    feedback:
      'The open fill of a menu bar title (its ::after) slides from title to title on the snappy spring. The open state, the text color and the focus ring change at once; only the decorative fill travels. A second move while the fill travels hands over from where it is. Order 1.23: the rows inside the menus moved to highlight-marker.',
    beats: [
      'Action: the new title is open at once (data-state, the focus ring).',
      'Travel: the fill moves from the old title to the new one on ease.spring-snappy over duration.spring-snappy (Neutral 158ms, Desk 300ms passing the title by 10% and coming back, Studio 70ms in two steps).',
    ],
    styles: {
      studio: 'a two step hop from title to title',
      desk: 'a fill that glides and swings a little past each title',
      neutral: 'a short glide',
    },
    reduced: 'No slide: the fill is on the new title at once.',
    round: 3,
    status: 'proposed',
  },
  {
    id: 'menu-submenu-nudge',
    components: ['DropdownMenu', 'ContextMenu', 'Menubar'],
    pattern: 'pop',
    drive: 'css',
    trigger: 'Light a row that opens a submenu with the pointer or the arrow keys, or open its submenu.',
    feedback:
      'The chevron at the end of the row leans distance.shift toward its submenu on the bouncy spring, mirrored in right to left layouts, and comes back over duration.quick when the row goes dark. The submenu then opens from that side with menu-origin.',
    beats: [
      'Action: the chevron moves distance.nudge (Neutral 2px, Desk 3px, Studio 0px) toward the submenu on ease.spring-bouncy over duration.spring-bouncy (Neutral 200ms, Desk 380ms passing its place by 25%, Studio 120ms in three steps).',
      'React: the submenu opens from its trigger side, its rows staggered.',
      'Exit: the chevron comes back over duration.quick on ease.exit.',
    ],
    styles: {
      studio: 'none: the pop preset of Studio is reduced, so the chevron stays still',
      desk: 'a bouncy lean toward the submenu',
      neutral: 'a small lean',
    },
    reduced: 'The chevron stays still: --_menu-nudge and its durations are 0 under reduced motion (review B2, B3).',
    off: {
      "[data-ds='dropdown-menu']": { '--_menu-nudge': '0px' },
      "[data-ds='context-menu']": { '--_menu-nudge': '0px' },
    },
    round: 3,
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
      'Action: the panel rises and grows on ease.spring-snappy over duration.spring-snappy (Neutral 158ms, Desk 300ms with a 10% overshoot, Studio 70ms in two steps).',
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
    // Order 1.23: fade-rise, so Neutral and Studio play the cascade their stagger step allows, not a plain fade.
    pattern: 'fade-rise',
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
      studio: 'the rows rise together, a short lift',
      desk: 'a visible cascade and rows that swing into place',
      neutral: 'a short cascade',
    },
    reduced: 'The new rows fade in with no delay; rows that stay jump to their place.',
    round: 3,
    status: 'proposed',
  },
  {
    id: 'command-palette-row-slide',
    components: ['CommandPalette'],
    pattern: 'tab-indicator',
    drive: 'css',
    trigger: 'Press ArrowDown or ArrowUp in the search box, or move the pointer over the results, or type so the lit row moves.',
    feedback:
      'The palette plays highlight-marker: one aria-hidden marker in the list draws the lit fill and slides to the new row, on the snappy spring for the pointer and over duration.fast for the keys, and follows the lit row when a new query moves it. The active descendant, the text color and the announcement change at once.',
    beats: [
      'Action: the new row is the active descendant at once.',
      'Travel: the marker moves on ease.spring-snappy over duration.spring-snappy (Neutral 158ms, Desk 300ms with a 10% swing, Studio 70ms in two steps), or over duration.fast (80ms) for the keys.',
    ],
    styles: {
      studio: 'a two step hop',
      desk: 'a glide that swings past the row a little',
      neutral: 'a short glide',
    },
    reduced: 'No slide: the marker is on the new row at once.',
    off: { "[data-ds='command-palette']": { '--_command-palette-highlight-duration': '0ms' } },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'highlight-marker',
    components: ['DropdownMenu', 'ContextMenu', 'Menubar', 'Select', 'Combobox', 'Autocomplete', 'MultiSelect', 'TagField', 'ListBox'],
    pattern: 'tab-indicator',
    drive: 'css',
    trigger: 'Move the pointer down the rows of an open menu or list, or press the arrow keys, Home or End; in a picker, type so the lit row moves.',
    feedback:
      'Every list holds one aria-hidden marker, the highlight part, as its last child. It draws the fill of the lit row and is placed with transform at that row, so the fill slides from row to row while the rows, their hit areas, their text and their focus ring stay still. ' +
      'The first time a row lights in a list that just opened, the marker jumps there with no motion and shows. With the pointer it slides on the snappy spring; with the keys it slides over duration.fast, so it never lags behind the keys. When the rows change under it (a filter), it follows the lit row to its new place. When nothing is lit it fades out. ' +
      'A destructive menu row lights in its own color. A ListBox alone also follows the pointer with the hover color. The lit state itself (data-highlighted, aria-activedescendant, focus) changes at once.',
    beats: [
      'Closed: no marker.',
      'Open, first lit row: the marker jumps to the row at once and fades in over duration.fast (80ms).',
      'Highlighted row moving, pointer: transform travels on ease.spring-snappy over duration.spring-snappy (Neutral 158ms with a small overshoot, Desk 300ms passing the row and back, Studio 70ms in two steps).',
      'Highlighted row moving, keys: the same travel over duration.fast (80ms), so a held arrow key reads as a marker that keeps up.',
      'Picked: the check of the row draws (check-draw-pick) and a picker closes (menu-origin closing).',
      'Nothing lit: the marker fades out over duration.fast.',
    ],
    styles: { neutral: 'a short glide', desk: 'a glide that swings a little past each row', studio: 'a two step hop' },
    reduced: 'The marker jumps to the lit row with no travel.',
    off: {
      "[data-ds='dropdown-menu']": { '--_menu-highlight-duration': '0ms' },
      "[data-ds='context-menu']": { '--_menu-highlight-duration': '0ms' },
      "[data-ds='select']": { '--_select-highlight-duration': '0ms' },
      "[data-ds='list-box']": { '--_list-box-highlight-duration': '0ms' },
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'check-draw-pick',
    components: ['ListBox', 'MultiSelect', 'TagField', 'Combobox', 'DropdownMenu', 'ContextMenu', 'Menubar', 'Chip'],
    pattern: 'swap',
    drive: 'waapi',
    trigger: 'Choose an option so its check appears: an option of a ListBox or a MultiSelect, or a checkbox item of a menu that stays open.',
    feedback:
      'The check of the row just chosen draws itself: a stroked glyph (the line icon set) draws from its short arm to the tip of its long arm with stroke-dashoffset, a filled glyph (the pixel set) is wiped in from the inline start with clip-path, in four steps. It lands with a pop from 0.6 past its size and back. aria-selected and aria-checked change at once. A check that is there when a list opens does not draw.',
    beats: [
      'Picked: the selected state changes at once.',
      'Draw: the stroke (or the wipe) runs over duration.spring-snappy (158, 300, 70ms) on ease.out.',
      'Overshoot: the glyph grows from 0.6 past its size on ease.spring-bouncy over duration.spring-bouncy (200, 380, 120ms).',
    ],
    styles: { neutral: 'a quick draw', desk: 'a slower draw with a bouncy landing', studio: 'a pixel wipe in steps' },
    reduced: 'The check fades in over duration.base.',
    round: 3,
    status: 'proposed',
  },
  {
    id: 'combobox-results',
    components: ['Combobox', 'Autocomplete', 'MultiSelect', 'TagField'],
    pattern: 'drag-drop',
    drive: 'waapi',
    primitive: 'flip',
    trigger: 'Type in a picker so its results change while the list stays open.',
    feedback:
      'The rows that stay slide from their old place to the new one, the new rows rise and pop in one short delay.stagger step apart, and the highlight marker follows the lit row to its new place. Typing is never held back: the list renders at once and only its drawing moves. A first paint plays nothing, and a scroll of the list is not read as a move.',
    beats: [
      'Action: the new results render at once; the lit row is lit at once.',
      'React: rows that stay travel on ease.spring-snappy over duration.spring-snappy (158, 300, 70ms).',
      'Stagger: new rows rise distance.shift and grow from scale.enter on ease.spring-bouncy over duration.spring-bouncy, one delay.stagger apart (24, 45, 0ms).',
      'Follow: the highlight marker slides to the lit row (highlight-marker).',
    ],
    styles: { neutral: 'short moves on ease out', desk: 'bouncy pops and long moves', studio: 'hops in steps' },
    reduced: 'Nothing travels; new rows fade in.',
    round: 3,
    status: 'proposed',
  },
] as const satisfies readonly Interaction[];
