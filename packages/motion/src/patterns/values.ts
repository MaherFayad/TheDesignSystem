// Token values as CSS for the web keyframes: the live variable with the base
// value as the fallback. Private to the catalog.
import { cssToken } from '../core';
import { scaleValue, spacePx, type ScaleName, type SpaceName } from '../tokens';

/** A space token as a CSS length, for example `var(--ds-space-xs, 6px)`. */
export const space = (name: SpaceName): string => cssToken(name, `${spacePx[name]}px`);
/** A space token as a negative CSS length. */
export const negSpace = (name: SpaceName): string => `calc(-1 * ${space(name)})`;
/** A scale token as a CSS number, for example `var(--ds-scale-press, 0.97)`. */
export const scale = (name: ScaleName): string => cssToken(name, scaleValue[name]);
