// Interactions of the selection family (order 1.21). See ./types.ts for the shape.
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
    id: 'switch-stretch',
    components: ['Switch'],
    pattern: 'press',
    drive: 'css',
    trigger: 'The person presses the switch with the pointer or Space, then releases it to toggle.',
    feedback:
      'While pressed the thumb widens toward the side it will travel to, its trailing edge still, over duration.instant on ease.out. On the toggle it slides to the other side over duration.medium on ease.emphasized and settles back to its width.',
    reduced: 'The thumb jumps to the other side and does not stretch.',
    off: {
      "[data-ds='switch']": {
        '--_switch-stretch': '1',
        '--_switch-duration': 'var(--ds-duration-base)',
        '--_switch-ease': 'var(--ds-ease-default)',
      },
    },
    status: 'proposed',
  },
  {
    id: 'rating-fill',
    components: ['Rating'],
    pattern: 'pop',
    drive: 'waapi',
    trigger: 'The person picks a score by click, an arrow key, Home or End.',
    feedback:
      'The stars from the first to the chosen one pop in a short run: each lands from about 94% and transparent over duration.medium on ease.emphasized, one half delay.reveal-step after the one before, capped at POP_MAX_STEPS. A new pick cancels the run. The hover preview stays instant.',
    reduced: 'The stars fade in together, or change at once.',
    status: 'proposed',
  },
] as const satisfies readonly Interaction[];
