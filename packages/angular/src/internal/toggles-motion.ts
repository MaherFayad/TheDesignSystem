// Motion helpers of the toggles family that React keeps in a component file.
// Framework free: copied from packages/react/src/components/ToggleButton/
// ToggleButton.tsx (round 3, order 1.23) so both frameworks play the same
// spec. A lead change would move it into packages/motion.
import type { MotionSpec } from '@the-system/motion';

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
