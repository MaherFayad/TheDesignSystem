// Interactions of the selection controls and lists family (orders 1.21 and
// 1.22). See ./types.ts for the shape.
import type { Interaction } from './types';

export const selectionInteractions = [
  {
    id: 'check-draw',
    components: ['Checkbox'],
    pattern: 'fade',
    drive: 'css',
    trigger: 'The person checks a box, or it turns indeterminate, by click, Space or a click on its label.',
    feedback:
      'The fill shows at once and the check or the dash draws in from the inline start edge over duration.medium on ease.out: a clip slides in while the mark inside slides the other way, so only the visible window grows. Unchecking fades the mark out over duration.fast on ease.out. A box checked on first paint draws nothing.',
    reduced: 'The mark appears and leaves at once, with the fill.',
    off: { "[data-ds='checkbox']": { '--_checkbox-duration': '0s', '--_checkbox-duration-out': '0s' } },
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
] as const satisfies readonly Interaction[];
