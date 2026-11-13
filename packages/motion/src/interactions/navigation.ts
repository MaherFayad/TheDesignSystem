// Interactions of the navigation and shared indicator family (orders 1.21
// and 1.22). See ./types.ts for the shape. Order 1.22 moves the round 1 row
// tab-slide into one shared pill (packages/react/src/internal/indicator.ts)
// that every list of this family plays: it slides from the item it leaves
// to the item it reaches, stretches along its travel by up to scale.stretch
// and settles on the snappy spring, measured from boxes so RTL needs
// nothing, and never moves a hit area. Spring overshoot per style, from the
// tokens: Neutral bouncy 6%, snappy 1.5%, soft none; Desk bouncy 25%, snappy
// 10%, soft 2%; Studio steps (bouncy three, snappy two).
import type { Interaction } from './types';

const SLIDE_BEATS = [
  'Action: the pill moves from the box of the item it leaves to the box of the item it reaches on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with a 10% overshoot, Studio 80ms in two steps). The new state is set at once; the pill only draws the way.',
  'Stretch: halfway the pill is longer along its travel by up to scale.stretch (Neutral 1.15, Desk 1.3, Studio 1.08), less for a short hop, then settles to its own size.',
  'Secondary: the label it leaves dips to scale.anticipate and back on ease.out over duration.spring-soft; the label it reaches pops from scale.anticipate past rest on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms, Studio 120ms).',
  'A second change mid travel starts from where the pill is drawn, not from where it was headed.',
] as const;

const SLIDE_STYLES = {
  studio: 'two hard steps, a short stretch',
  desk: 'a long slide that passes the item and swings back',
  neutral: 'a quick slide that lands with no visible swing',
} as const;

export const navigationInteractions = [
  {
    id: 'tab-slide',
    components: ['Tabs', 'SegmentedControl', 'ToggleGroup'],
    pattern: 'tab-indicator',
    drive: 'waapi',
    trigger: 'Choose another tab, segment or single choice item with a click, a tap or the arrow keys.',
    feedback: 'The shared pill slides from the old item to the new one and stretches along its travel (a transform with the center origin, measured from both boxes). Round 3: the label colour crosses with clip-path, so the text under the pill takes the selected colour exactly where the pill is: each label gets an aria-hidden twin in the selected colour (part label-ink), cut to the pill box keyframe for keyframe with the slide, and the label the pill reaches holds the rest colour under it. The dip and pop of the labels of round 2 are gone. Weight changes at once.',
    beats: [
      'Press: the item takes its hover fill at once; the value changes on the press (Radix), so the pill never waits for release.',
      'Action: the pill moves from the box of the item it leaves to the box of the item it reaches on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with a 10% overshoot, Studio 80ms in two steps).',
      'Stretch: at 45% of the run the pill is longer along its travel by up to scale.stretch (Neutral 1.15, Desk 1.3, Studio 1.08), less for a short hop, then settles to its own size.',
      'Ink: over the same run, on the same easing and keyframes, the twins of every label are cut with clip-path inset() to the pill along the travel axis, so a label half under the pill is half in each colour; the twins are removed when the run ends.',
      'Back: a second change mid travel starts from where the pill is drawn; the twins of the first change are removed first.',
    ],
    styles: SLIDE_STYLES,
    reduced: 'No motion: the pill and the selected colour are on the new item at once; no twin is drawn.',
    round: 3,
    status: 'proposed',
  },
  {
    id: 'nav-current-slide',
    components: ['Navbar', 'Sidebar', 'Rail'],
    pattern: 'tab-indicator',
    drive: 'waapi',
    trigger: 'Another link becomes the current page (a client side route change, or a click in the stage).',
    feedback: 'The current mark (the bar under a Navbar link, the edge bar of a Sidebar or Rail item, each the item ::before) slides from the old current item along the bar or the column and stretches on the way. Round 3: in the Navbar the link text takes the current colour where the bar is, with the ink twins of tab-slide (no visible change when the style draws current and rest links in one colour). The Sidebar label and the Rail icon of the new item pop, the old one dips. Two items marked current at once do not slide between each other.',
    beats: SLIDE_BEATS,
    styles: SLIDE_STYLES,
    reduced: 'No motion: the bar appears on the new item at once.',
    round: 3,
    status: 'proposed',
  },
  {
    id: 'nav-hover-follow',
    components: ['Breadcrumbs', 'Navbar', 'Sidebar', 'Rail'],
    pattern: 'tab-indicator',
    drive: 'waapi',
    trigger: 'Move the pointer from one step, link or item to the next.',
    feedback:
      'The hover pill (Breadcrumbs: a new pill on the link ::before; Navbar, Sidebar and Rail: their hover veil) fades in on hover, and when the pointer came from a neighbour within duration.slow it slides from that neighbour and stretches, so one pill seems to follow the pointer. ' +
      'In Breadcrumbs the separator after the hovered step nudges toward the next step by distance.nudge on the snappy spring (CSS). Touch does nothing.',
    beats: [
      'Action: the pill fades in over duration.fast (CSS) while it slides from the neighbour on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms in two steps).',
      'Stretch: halfway it is longer along the travel by up to scale.stretch.',
      'Secondary: the Breadcrumbs separator leans toward the next step by distance.nudge (Neutral 2px, Desk 3px, Studio 1px) on the snappy spring, and back when the pointer leaves.',
    ],
    styles: {
      studio: 'a stepped hop and a 1px lean',
      desk: 'a long follow with a swing and a 3px lean',
      neutral: 'a quick follow and a 2px lean',
    },
    reduced: 'The pill fades in place; nothing slides and the separator stays still.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'pagination-roll',
    components: ['Pagination'],
    pattern: 'number-roll',
    drive: 'waapi',
    primitive: 'digit-roll',
    trigger: 'Press a page number, previous, next, first or last.',
    feedback:
      'The page changes at once. The pressed arrow winds up: its icon draws back by distance.nudge and goes forward by distance.shift, then home. ' +
      'Each page slot whose number changed rolls digit by digit (rollDigits, up for a later page, down for an earlier one) in an aria-hidden host; the page keeps its aria-label. ' +
      'The current fill (an aria-hidden span inside the page part) slides to the new current slot when it moves, and the number it reaches pops.',
    beats: [
      'Anticipation: the arrow icon draws back by distance.nudge (Neutral 2px, Desk 3px, Studio 1px) in the first quarter, against its direction.',
      'Action: the page changes on the click; the icon goes forward by distance.shift and home on ease.out over duration.spring-bouncy (Neutral 220ms, Desk 440ms, Studio 120ms).',
      'Secondary: the numbers that changed roll one column at a time from the last digit, delay.stagger apart (Neutral 24ms, Desk 45ms, Studio 0ms), on ease.spring-snappy over duration.spring-snappy.',
      'Overshoot and settle: the current fill slides with the shared pill when its slot moves (the first and the last pages), and the number it reaches pops on the bouncy spring.',
    ],
    styles: {
      studio: 'digits fade in place (its number-roll preset is reduced), the arrow ticks 1px',
      desk: 'digits roll with a swing, the arrow winds up 3px',
      neutral: 'a quick roll and a small wind up',
    },
    reduced: 'The new numbers fade in; nothing travels.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'sidebar-collapse',
    components: ['Sidebar', 'Rail'],
    pattern: 'fade-rise',
    drive: 'waapi',
    primitive: 'stagger',
    trigger: 'Collapse or expand the Sidebar with its toggle; show or hide the Rail labels (hideLabels).',
    feedback: 'The width changes at once (layout never animates). Round 3, expand: the panel is uncovered from its collapsed width to its new width with clip-path on the soft spring, so it reads as a panel opening, and each label, count and group title wipes in from the inline start with clip-path, delay.stagger apart after two steps, capped at six. Collapse: the icons pop from scale.anticipate. In the Rail the icons travel to their new places (flipPlay) and the labels rise in after them.',
    beats: [
      'Action: the panel takes its new width at once.',
      'Expand: the panel clip opens from inset(the width it gained) at the inline end to none on ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms, Studio 100ms).',
      'Secondary, expand: the labels wipe in from the inline start (clip-path inset from 100% at the inline end to none) on the soft spring, delay.stagger apart (24, 45, 0ms) starting two steps late, capped at six steps.',
      'Secondary, collapse: the icons pop from scale.anticipate past rest on the bouncy spring. Rail: the icons travel on the snappy spring.',
    ],
    styles: {
      studio: 'labels land together, stepped',
      desk: 'labels ripple in one by one',
      neutral: 'a short ripple',
    },
    reduced: 'The labels fade in with no travel and no delay; the panel is not clipped and the icons do not move.',
    round: 3,
    status: 'proposed',
  },
  {
    id: 'stepper-travel',
    components: ['Stepper'],
    pattern: 'tab-indicator',
    drive: 'waapi',
    trigger: 'Move to another step (next, back, or a reachable step title).',
    feedback: 'A ring (the indicator ::after, drawn only while it travels) slides from the old current indicator to the new one in the direction of the change, stretches along the way and fades as it lands. The new current indicator pops. The connector fill grows or shrinks on the soft spring (CSS). Round 3: a step that turns complete draws its check with stroke-dashoffset, the short stroke first.',
    beats: [
      'Action: the ring travels on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms), stretched by up to scale.stretch, from opacity 1 to 0 as it lands.',
      'Overshoot and settle: the new current indicator pops from scale.anticipate on the bouncy spring.',
      'Secondary: the connector after a step that turns complete fills on ease.spring-soft over duration.spring-soft; going back it empties the same way.',
      'Done: the check of each step that turned complete draws from its end to its start (stroke-dasharray 24, stroke-dashoffset from -24 to 0 in its 24 unit box) on ease.out over duration.spring-soft; going back the check is simply gone.',
    ],
    styles: {
      studio: 'a stepped hop',
      desk: 'a long travel and a swinging pop',
      neutral: 'a quick travel',
    },
    reduced: 'Nothing travels; the current step and the fill change at once.',
    round: 3,
    status: 'proposed',
  },
  {
    id: 'toc-travel',
    components: ['TableOfContents'],
    pattern: 'tab-indicator',
    drive: 'waapi',
    trigger: 'Scroll to another section, or choose a link.',
    feedback: 'Round 3 (review N18): the bar travels from where it is drawn to the active link and stretches on the way, as one Web Animations run (translateY and scaleY from its top edge); the CSS no longer transitions it, so it never jumps. A change mid travel starts from where the bar is drawn.',
    beats: [
      'Action: the bar moves from its drawn top and size to the active link on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with a 10% overshoot, Studio 80ms in two steps).',
      'Stretch: at 45% of the run it is longer by scale.stretch over the mean of both sizes, centred on the midpoint, then settles to the size of the link.',
    ],
    styles: {
      studio: 'a stepped move',
      desk: 'a long move that passes the link and swings back',
      neutral: 'a quick move',
    },
    reduced: 'The bar jumps to the active link.',
    round: 3,
    status: 'proposed',
  },
  {
    id: 'tab-bar-pop',
    components: ['TabBar'],
    pattern: 'pop',
    drive: 'css',
    trigger: 'A destination becomes current (or the bar mounts on a new page).',
    feedback: 'The icon and its pill pop from scale.anticipate past rest and settle; the label rises by distance.nudge a stagger step later. Colors and weight change at once.',
    beats: [
      'Overshoot and settle: the icon box pops on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms with a 6% overshoot, Desk 440ms with 25%, Studio 120ms in three steps).',
      'Secondary: the label rises by distance.nudge on the same spring, delay.stagger later.',
    ],
    styles: {
      studio: 'no pop: its pop preset is reduced, so the recipe sets the duration to 0ms',
      desk: 'a big bouncy pop',
      neutral: 'a small pop',
    },
    reduced: 'Nothing moves. Round 3 (review B2): the reduced rules carry [data-active], so they win over the motion rules, and the root sets --_tab-bar-duration and --_tab-bar-stagger to 0s under the media query and the page setting.',
    off: { "[data-ds='tab-bar']": { '--_tab-bar-duration': '0ms', '--_tab-bar-stagger': '0s' } },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'dock-lift',
    components: ['Dock'],
    pattern: 'pop',
    drive: 'css',
    trigger: 'Hover a tile or focus it; an item becomes current.',
    feedback:
      'The hovered tile lifts toward the pointer by --_dock-lift and grows to --_dock-scale on the bouncy spring; the next tile on each side follows at half the lift, the one after at a quarter. The current tile pops when it becomes current.',
    beats: [
      'Action: the tile lifts (base distance.lift and scale.lift; Desk magnifies to 1.25 and lifts space.xs) on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms with a 25% overshoot, Studio 120ms).',
      'Secondary: the neighbours lift by half and a quarter, so the row swells around the pointer.',
      'Overshoot and settle: a tile that becomes current pops from scale.anticipate past rest, added to its hover transform.',
    ],
    styles: {
      studio: 'no lift and no pop (its lift tokens are 0 and its pop preset is reduced)',
      desk: 'the magnify with a swing; neighbours swell',
      neutral: 'a 2px lift and a small pop',
    },
    reduced: 'No lift, no magnify, no pop.',
    off: { "[data-ds='dock']": { '--_dock-duration': '0ms', '--_dock-scale': '1', '--_dock-neighbor-scale': '1', '--_dock-lift': '0px' } },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'toolbar-press',
    components: ['Toolbar'],
    pattern: 'press',
    drive: 'css',
    trigger: 'Press a toolbar item; turn a toggle item on.',
    feedback:
      "On top of Button's press, a pressed item dips its parts to scale.anticipate (Button's --_button-part-press) and springs back on release. A toggle item that turns on pops its icon from scale.anticipate past rest.",
    beats: [
      'Anticipation: the item dips to scale.press and its icon gathers to scale.anticipate while held (duration.instant).',
      'Overshoot and settle: on release both spring back on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms, Studio 120ms).',
      'Secondary: an item that turns on pops its icon on the same spring.',
    ],
    styles: {
      studio: 'a stepped tick',
      desk: 'a deep gather and a swinging release',
      neutral: 'a light tap',
    },
    reduced: 'No scale; the on fill carries the state. Round 3 (review B2): the reduced rule carries the on state and wins by order; the root sets --_toolbar-duration to 0s.',
    off: { "[data-ds='toolbar']": { '--_toolbar-duration': '0ms' }, "[data-ds='toolbar'] [data-part='item']": { '--_button-part-press': '1' } },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'language-roll',
    components: ['LanguageSwitch'],
    pattern: 'swap',
    drive: 'waapi',
    trigger: 'The current language changes in place (a client side switch).',
    feedback:
      'The menu trigger rolls its name: the old name rolls up and out in an aria-hidden copy while the new one rolls in from below. In the link pair the name it leaves dips and the name it reaches pops.',
    beats: [
      'Action: both names roll a full line on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms in two steps), fading as they go.',
      'Secondary, the pair: the leaving name dips to scale.anticipate, the reached name pops past rest on the bouncy spring.',
    ],
    styles: {
      studio: 'a stepped flip',
      desk: 'a roll with a swing',
      neutral: 'a quick roll',
    },
    reduced: 'The new name fades in.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'skip-link-slide',
    components: ['SkipLink'],
    pattern: 'fade-rise',
    drive: 'css',
    trigger: 'Tab to the skip link.',
    feedback: 'The link is drawn at once with its focus ring, and slides down into place from distance.enter above, passing its place and settling. The ring never fades or scales.',
    beats: [
      'Action: drawn at once, ring included.',
      'Overshoot and settle: it slides by distance.enter (Neutral 6px, Desk 12px, Studio 4px) on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms, Studio 120ms in three steps).',
    ],
    styles: {
      studio: 'a short stepped drop',
      desk: 'a long drop with a bounce',
      neutral: 'a small drop',
    },
    reduced: 'It appears in place.',
    off: { "[data-ds='skip-link']": { '--_skip-link-enter-y': '0px' } },
    round: 2,
    status: 'proposed',
  },
] as const satisfies readonly Interaction[];
