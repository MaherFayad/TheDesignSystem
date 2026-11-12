// Interactions of the buttons family (order 1.21). See ./types.ts for the shape.
import type { Interaction } from './types';

/** The private property that turns the press off on each root of the family. */
const pressOff = { '--_button-press-scale': '1' } as const;

export const buttonsInteractions = [
  {
    id: 'button-press',
    components: ['Button', 'IconButton', 'ToggleButton', 'CopyButton'],
    pattern: 'press',
    drive: 'css',
    trigger: 'Pointer down on the control, or Space or Enter held down while it has focus.',
    feedback:
      'The control scales to scale.press from its center over duration.instant on ease.out, and returns the same way on release. ' +
      'Space and the pointer press through :active in Button.css; Enter plays the press pattern from ButtonRoot, since the browser draws no :active for it. ' +
      'A toggle takes its new state on release with no overshoot. Never on a disabled or loading control.',
    reduced: 'No scale. The pressed color carries the state.',
    off: {
      "[data-ds='button']": pressOff,
      "[data-ds='icon-button']": pressOff,
      "[data-ds='toggle-button']": pressOff,
      "[data-ds='copy-button']": pressOff,
    },
    status: 'proposed',
  },
  {
    id: 'copy-swap',
    components: ['CopyButton'],
    pattern: 'swap',
    drive: 'waapi',
    trigger: 'A copy succeeds or fails, and the result ends after delay.feedback.',
    feedback:
      'The copy icon rolls up and out by space.xs on ease.exit while the check (or the warning) rolls in from below on ease.emphasized, ' +
      'both at once over duration.base. The return to idle rolls the other way. The clipboard write, the state and the status are never delayed. ' +
      'The visible label does not change: the status says the result.',
    reduced: 'The old icon fades out while the new one fades in, over duration.base.',
    status: 'proposed',
  },
] as const satisfies readonly Interaction[];
