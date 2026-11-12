// Interactions of the feedback, progress, data display and layout family
// (orders 1.21 and 1.22). See ./types.ts for the shape.
//
// stat-roll and toast-stack are played from the component code through
// useMotion(), so a style's preset reaches them at run time. The CSS rows
// list in `off` the private properties a style recipe sets to turn them off.
import type { Interaction } from './types';

export const contentInteractions = [
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
    id: 'toast-enter',
    components: ['Toast'],
    pattern: 'toast',
    drive: 'css',
    trigger: 'A toast is shown, or closed by its timer, its close button or Escape.',
    feedback:
      'The new toast travels space.xs in from the edge of the toaster and scales up from scale.dialog-enter while it fades in, over duration.toast-enter on ease.out. A closing toast fades and shrinks in place over duration.toast-exit on ease.exit.',
    reduced: 'A fade in and out with no travel or scale. Under reduced motion the toast is there and gone at once.',
    off: {
      "[data-ds='toast']": { '--_toast-enter-y': '0px', '--_toast-enter-scale': '1' },
    },
    status: 'proposed',
  },
  {
    id: 'toast-stack',
    components: ['Toast'],
    pattern: 'drag-drop',
    drive: 'waapi',
    trigger: 'A toast joins the stack or leaves it while other toasts are shown.',
    feedback:
      'The toasts that stay move from where they were to their new place with a transform (a FLIP of the drag-drop settle), over duration.slow on ease.emphasized. Layout never animates and the store never waits; the pause on hover and focus is kept.',
    reduced: 'No motion: the toasts that stay take their new place at once.',
    status: 'proposed',
  },
  {
    id: 'toast-swipe',
    components: ['Toast'],
    pattern: 'toast',
    drive: 'css',
    trigger: 'Drag a toast toward the edge it sits on, then let go.',
    feedback:
      'While dragged the toast follows the finger (the Radix swipe variables, no transition). Let go short of the threshold it springs back over duration.base on ease.emphasized; past it, it travels on out in the swipe direction while it fades, over duration.toast-exit on ease.exit.',
    reduced: 'The toast still follows the finger. Let go, it is back in place at once, or it fades where it was let go.',
    off: {
      "[data-ds='toast']": { '--_toast-duration': '0s', '--_toast-swipe-x': '0%', '--_toast-swipe-y': '0%' },
    },
    status: 'proposed',
  },
] as const satisfies readonly Interaction[];
