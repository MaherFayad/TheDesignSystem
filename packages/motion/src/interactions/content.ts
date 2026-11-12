// Interactions of the content family (order 1.21). See ./types.ts for the shape.
//
// tab-slide, stat-roll, list-stagger and slider-nudge are played from the
// component code through useMotion().play, so a style's preset reaches them
// at run time. accordion-reveal, skeleton-swap and slider-pull are CSS: each
// lists in `off` the private properties a style recipe sets to turn it off.
import type { Interaction } from './types';

export const contentInteractions = [
  {
    id: 'tab-slide',
    components: ['Tabs'],
    pattern: 'tab-indicator',
    drive: 'waapi',
    trigger: 'Choose another tab with a click, a tap or the arrow keys.',
    feedback:
      'The underline or pill slides and stretches from the old tab to the new one, a transform with origin 0 0 measured from both tab boxes, over duration.medium on ease.standard. The label colors and weight change at once.',
    reduced: 'No motion: the indicator appears under the new tab at once.',
    status: 'proposed',
  },
  {
    id: 'accordion-reveal',
    components: ['Accordion'],
    pattern: 'accordion-height',
    drive: 'css',
    trigger: 'Open a section with its header button, Enter or Space.',
    feedback:
      'The section takes its open height at once and clips; its content slides down from above the clip, translateY from -100% of its own height, and fades in, opaque at 60%, over duration.slow on ease.standard. The text never scales and the height never animates. Closing is at once.',
    reduced: 'No motion: the content shows at once.',
    off: { "[data-ds='accordion']": { '--_accordion-duration': '0s' } },
    status: 'proposed',
  },
  {
    id: 'skeleton-swap',
    components: ['Skeleton'],
    pattern: 'skeleton-shimmer',
    drive: 'css',
    trigger: 'A skeleton appears while its content loads.',
    feedback:
      'A band sweeps across the placeholder toward the inline end, linear, over duration.shimmer, three times (4.2s), then the placeholder holds still, so it needs no pause control. The content replaces the skeleton when it is ready.',
    reduced: 'No motion: the band is not drawn and the placeholder stays still.',
    off: { "[data-ds='skeleton']": { '--_skeleton-loops': '0' } },
    status: 'proposed',
  },
  {
    id: 'list-stagger',
    components: ['List'],
    pattern: 'list-stagger',
    drive: 'waapi',
    trigger: 'A list paints its rows for the first time.',
    feedback:
      'Each row fades in and rises by space.s over duration.slow on ease.reveal, one delay.reveal-step after the row before, capped at eight steps. Every row is in the DOM and read at once. It never plays on a re-render, an added row, a reorder or rows hydrated from server HTML.',
    reduced: 'A fade of each row over duration.base with no delay and no rise.',
    status: 'proposed',
  },
  {
    id: 'stat-roll',
    components: ['Stat'],
    pattern: 'number-roll',
    drive: 'waapi',
    trigger: 'The number of a Stat changes after it first paints.',
    feedback:
      'The new number rolls in inside the value clip, from below when it grew and from above when it fell, translateY 100% with a fade, over duration.roll on ease.emphasized. A change less than one roll after the last roll started changes in place.',
    reduced: 'A fade of the new number over duration.base.',
    status: 'proposed',
  },
  {
    id: 'slider-pull',
    components: ['Slider', 'RangeSlider'],
    pattern: 'press',
    drive: 'css',
    trigger: 'Hold a slider thumb, or the track, with a pointer, and let go.',
    feedback:
      'The grabbed thumb scales up from its center to 2 minus scale.window-enter squared (1.15) over duration.base on ease.emphasized, and settles back the same way on release. The value follows the pointer at once.',
    reduced: 'No motion: the thumb keeps its size; the grab cursor and the focus ring carry the state.',
    off: {
      "[data-ds='slider']": { '--_slider-lift': '1' },
      "[data-ds='range-slider']": { '--_slider-lift': '1' },
    },
    status: 'proposed',
  },
  {
    id: 'slider-nudge',
    components: ['Slider', 'RangeSlider'],
    pattern: 'shake',
    drive: 'waapi',
    trigger: 'A key or a drag pushes a thumb past the minimum or the maximum of a horizontal slider.',
    feedback:
      'The thumb nudges space.3xs toward that end and back once (shake, one swing, toward) over duration.base on ease.out, added on top of the lift. A held key nudges once; a drag nudges once each time it goes past the end.',
    reduced: 'No motion: the value stays at its end.',
    status: 'proposed',
  },
] as const satisfies readonly Interaction[];
