// The state layer of ToggleButton (interaction toggle-pop, round 3, order
// 1.23, proposed), one copy for both frameworks (order 1.29): React's
// ToggleButton.tsx and Angular's toggle-button.ts play this spec through
// `play` from @the-system/motion. When the person turns the button on, the
// layer floods from the press point across the button and fades while the
// on fill crosses in behind it; turning it off, the layer drains back to the
// point, faster. From the keyboard the point is the centre.
import type { MotionSpec } from '../core';

/** The press point, read by the state layer: set on the root by pointer down, the centre for keys. */
const AT = 'circle(var(--_toggle-button-press-radius) at var(--_toggle-button-x, 50%) var(--_toggle-button-y, 50%))';
const FULL = 'circle(150% at var(--_toggle-button-x, 50%) var(--_toggle-button-y, 50%))';
const NONE = 'circle(0% at var(--_toggle-button-x, 50%) var(--_toggle-button-y, 50%))';
const LAYER = 'var(--_toggle-button-layer-opacity)';

/** The state layer's move on a change: a flood from the press point when on, a drain back to it when off. */
export function toggleLayerSpec(on: boolean): MotionSpec {
  if (on) {
    return {
      keyframes: [
        { clipPath: AT, opacity: LAYER },
        { clipPath: FULL, opacity: LAYER, offset: 0.55 },
        { clipPath: FULL, opacity: 0 },
      ],
      duration: 'duration.morph',
      easing: 'ease.out',
      fill: 'none',
      origin: '50% 50%',
    };
  }
  return {
    keyframes: [
      { clipPath: FULL, opacity: LAYER },
      { clipPath: NONE, opacity: LAYER },
    ],
    duration: 'duration.quick',
    easing: 'ease.exit',
    fill: 'none',
    origin: '50% 50%',
  };
}

/** The press point as a share of the box, so it holds at any zoom: "37.5%". */
export function pressShare(n: number): string {
  return `${Math.round(Math.min(1, Math.max(0, n)) * 1000) / 10}%`;
}
