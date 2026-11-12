// Liquid draws icons from the line set (lucide-static, ISC): line glyphs with
// round caps and joins, the icons dial of the plan. The set already draws
// round caps, so no map entry is needed. Add one only when a glyph of the same
// set reads better for this style.
import type { IconStyle } from '@the-system/icons';

const icons: IconStyle<'line'> = { set: 'line' };

export default icons;
