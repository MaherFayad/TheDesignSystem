// window-zoom: a FLIP between two frames of a window (zoom to fill and
// back). Moved from window.ts with the same values. Reduced: no motion.
import { between, definePattern, usableRect } from '../core';
import { durationMs, easeBezier } from '../tokens';
import { asSpec, TOP_START, type WindowMotionInput, type WindowMotionSpec } from './window-shared';

/** Call after the frame changed: the window is at `to` and is drawn over its old frame `from` first. */
export function windowZoom({ from, to, reduced = false }: WindowMotionInput = {}): WindowMotionSpec {
  const base = { name: 'window-zoom', duration: 'duration.window-zoom', easing: 'ease.window', fill: 'none', origin: TOP_START } as const;
  if (reduced || !usableRect(from) || !usableRect(to)) return { ...base, keyframes: [] };
  return { ...base, keyframes: [{ transform: between(from, to) }, { transform: 'none' }] };
}

export const windowZoomPattern = definePattern<WindowMotionInput>({
  id: 'window-zoom',
  tokens: ['duration.window-zoom', 'ease.window'],
  spec: (input) => asSpec(windowZoom({ ...input, reduced: false })),
  reduced: (input) => asSpec(windowZoom({ ...input, reduced: true })),
  native: {
    duration: durationMs['duration.window-zoom'],
    easing: easeBezier['ease.window'],
    reducedDuration: 0,
  },
});
