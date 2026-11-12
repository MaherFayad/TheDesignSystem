// The motion catalog: the named patterns, one file each in ./patterns.
// A manifest's `motion` field names one of these ids or `none`
// (catalog.test.ts reads every packages/manifest/src/component manifest and
// fails on any other name).
import type { MotionInput, MotionPattern, PatternId } from './core';
import { accordionHeight } from './patterns/accordion-height';
import { chartDraw } from './patterns/chart-draw';
import { dialog } from './patterns/dialog';
import { dragDrop } from './patterns/drag-drop';
import { fade } from './patterns/fade';
import { fadeRise } from './patterns/fade-rise';
import { listStagger } from './patterns/list-stagger';
import { menuScale } from './patterns/menu-scale';
import { numberRoll } from './patterns/number-roll';
import { press } from './patterns/press';
import { sheet } from './patterns/sheet';
import { skeletonShimmer } from './patterns/skeleton-shimmer';
import { spinner } from './patterns/spinner';
import { streamingText } from './patterns/streaming-text';
import { tabIndicator } from './patterns/tab-indicator';
import { thinking } from './patterns/thinking';
import { toast } from './patterns/toast';
import { windowGrowPattern } from './patterns/window-grow';
import { windowMinimizePattern } from './patterns/window-minimize';
import { windowZoomPattern } from './patterns/window-zoom';

export type { ChartDrawInput } from './patterns/chart-draw';
export type { DragDropInput } from './patterns/drag-drop';
export type { ListStaggerInput } from './patterns/list-stagger';
export type { MenuScaleInput } from './patterns/menu-scale';
export type { NumberRollInput } from './patterns/number-roll';
export type { SheetInput, SheetSide } from './patterns/sheet';
export type { TabIndicatorInput } from './patterns/tab-indicator';
export type { ThinkingInput } from './patterns/thinking';
export type { ToastInput } from './patterns/toast';
export { LIST_STAGGER_MAX_STEPS } from './patterns/list-stagger';
export { sheetOffset } from './patterns/sheet';
export { SHIMMER_ITERATIONS } from './patterns/skeleton-shimmer';
export { THINKING_DOT_STEP } from './patterns/thinking';

/** Every pattern of the catalog, by id. */
export const catalog = {
  'fade-rise': fadeRise,
  'menu-scale': menuScale,
  dialog,
  sheet,
  toast,
  'accordion-height': accordionHeight,
  'tab-indicator': tabIndicator,
  'list-stagger': listStagger,
  'drag-drop': dragDrop,
  'window-grow': windowGrowPattern,
  'window-zoom': windowZoomPattern,
  'window-minimize': windowMinimizePattern,
  'skeleton-shimmer': skeletonShimmer,
  spinner,
  'number-roll': numberRoll,
  'chart-draw': chartDraw,
  thinking,
  'streaming-text': streamingText,
  fade,
  press,
} as const satisfies Record<PatternId, MotionPattern<never>>;

export type Catalog = typeof catalog;

/** True when `id` names a pattern of the catalog. */
export function isPatternId(id: string): id is PatternId {
  return Object.hasOwn(catalog, id);
}

/** The pattern for an id, or undefined. */
export function getPattern(id: string): MotionPattern<MotionInput> | undefined {
  return isPatternId(id) ? (catalog[id] as unknown as MotionPattern<MotionInput>) : undefined;
}

export {
  accordionHeight,
  chartDraw,
  dialog as dialogMotion,
  dragDrop,
  fade as fadeMotion,
  fadeRise,
  listStagger,
  menuScale,
  numberRoll,
  press as pressMotion,
  sheet as sheetMotion,
  skeletonShimmer,
  spinner as spinnerMotion,
  streamingText,
  tabIndicator,
  thinking as thinkingMotion,
  toast as toastMotion,
  windowGrowPattern,
  windowMinimizePattern,
  windowZoomPattern,
};
