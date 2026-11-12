// Interactions of the overlays family (order 1.21). See ./types.ts for the shape.
//
// Every CSS row reads its motion from private properties on the component
// root (packages/css/src/components: DropdownMenu.css, Popover.css,
// Tooltip.css, Toast.css, Dialog.css), so `off` turns the travel or the
// scale off and leaves a fade, or nothing where the motion only moves.
import type { Interaction } from './types';

export const overlaysInteractions = [
  {
    id: 'menu-origin',
    components: ['DropdownMenu', 'ContextMenu', 'Menubar', 'Popover'],
    pattern: 'menu-scale',
    drive: 'css',
    trigger: 'Open a menu or a popover from its trigger, then close it.',
    feedback:
      'The surface scales up from scale.menu-enter out of the side of its trigger (the Radix transform origin) while it fades in, over duration.base on ease.emphasized. It closes the same way, faster, over duration.quick on ease.exit, and takes no pointer while it leaves.',
    reduced: 'A fade in and out, with no scale. Under reduced motion the menu is there and gone at once.',
    off: {
      "[data-ds='dropdown-menu']": { '--_menu-enter-scale': '1' },
      "[data-ds='context-menu']": { '--_menu-enter-scale': '1' },
      "[data-ds='popover']": { '--_popover-enter-scale': '1' },
    },
    status: 'proposed',
  },
  {
    id: 'tooltip-rise',
    components: ['Tooltip'],
    pattern: 'fade-rise',
    drive: 'css',
    trigger: 'Rest the pointer on a control with a tooltip, or focus it, then move on to the next one.',
    feedback:
      'After the open delay the tooltip travels space.xs from its trigger side (data-side) into place while it fades in, over duration.base on ease.out. Moving to another trigger inside the skip delay opens the next one at once (data-state instant-open). Closing plays the travel backward over duration.quick on ease.exit.',
    reduced: 'A fade with no travel. Under reduced motion the tooltip is there and gone at once.',
    off: {
      "[data-ds='tooltip']": { '--_tooltip-shift': '0px' },
    },
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
  {
    id: 'dialog-spring',
    components: ['Dialog', 'AlertDialog'],
    pattern: 'dialog',
    drive: 'css',
    trigger: 'Open a dialog, then close it.',
    feedback:
      'The panel rises space.2xs and scales up from scale.dialog-enter while it fades in, over duration.base on ease.emphasized, the nearest curve to spring.sheet until an ease.spring token exists; the backdrop fades. It closes over duration.base on ease.exit, and nothing waits for it.',
    reduced: 'The panel and the backdrop fade in and out with no travel or scale. Under reduced motion they are there and gone at once.',
    off: {
      "[data-ds='dialog']": { '--_dialog-enter-y': '0px', '--_dialog-enter-scale': '1' },
      "[data-ds='alert-dialog']": { '--_dialog-enter-y': '0px', '--_dialog-enter-scale': '1' },
    },
    status: 'proposed',
  },
  {
    id: 'sheet-spring',
    components: ['Sheet', 'Drawer'],
    pattern: 'sheet',
    drive: 'css',
    trigger: 'Open a sheet or a drawer, close it, or drag a sheet by its handle and let go.',
    feedback:
      'The panel slides in its own size from its edge (a drawer from its side, mirrored in right to left layouts; a sheet from the block end) over duration.slow on ease.emphasized, the nearest curve to spring.sheet. A sheet let go short of closing settles back over duration.base on the same ease. Closing slides out over duration.base on ease.exit.',
    reduced: 'The panel fades in and out where it rests, with no slide, and a released sheet is back in place at once.',
    off: {
      "[data-ds='sheet']": { '--_dialog-slide': '0%', '--_dialog-enter-opacity': '0', '--_dialog-drag-duration': '0s' },
      "[data-ds='drawer']": { '--_dialog-slide': '0%', '--_dialog-enter-opacity': '0' },
    },
    status: 'proposed',
  },
] as const satisfies readonly Interaction[];
