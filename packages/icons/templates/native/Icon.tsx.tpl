// React Native icon on react-native-svg. Same props as the React Icon, plus
// color, since native has no currentColor from CSS.
import { createContext, createElement, use, type ComponentType } from 'react';
import { I18nManager } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect, type SvgProps } from 'react-native-svg';
import {
  camelAttrs,
  defaultIconStyle,
  iconSizes,
  isMirrored,
  parseBody,
  resolveIcon,
  resolveIconSize,
  type IconName,
  type IconSize,
  type IconStyle,
} from '@the-system/icons';

/** The active style's icon config. The ThemeProvider sets it. */
export const IconSetContext = createContext<IconStyle>(defaultIconStyle);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const elements: Record<string, ComponentType<any>> = {
  path: Path,
  circle: Circle,
  rect: Rect,
  line: Line,
  polyline: Polyline,
  polygon: Polygon,
  ellipse: Ellipse,
};

export interface IconProps extends Omit<SvgProps, 'width' | 'height' | 'viewBox' | 'children'> {
  name: IconName;
  size?: IconSize;
  /** An icon set id. Overrides the style's set. */
  set?: string;
  /** Gives the icon the image role and this accessible name. Without it the icon is hidden. */
  label?: string;
  color?: string;
}

export function Icon({ name, size, set, label, color, style, ...rest }: IconProps) {
  const active = use(IconSetContext);
  const { set: data, data: glyph } = resolveIcon(name, set !== undefined ? { set } : active);
  const sizeName = resolveIconSize(size);
  const px = iconSizes[sizeName];
  const flip = isMirrored(name) && I18nManager.isRTL;
  return createElement(
    Svg,
    {
      ...camelAttrs(data.attrs),
      ...rest,
      width: px,
      height: px,
      viewBox: glyph.viewBox,
      color,
      testID: rest.testID ?? 'ds-icon',
      accessible: label !== undefined,
      accessibilityRole: label !== undefined ? 'image' : undefined,
      accessibilityLabel: label,
      // Unlabeled icons are hidden on both platforms: importantForAccessibility
      // on Android, accessibilityElementsHidden on iOS.
      importantForAccessibility: label !== undefined ? 'yes' : 'no-hide-descendants',
      accessibilityElementsHidden: label === undefined,
      style: flip ? [{ transform: [{ scaleX: -1 }] }, style] : style,
    },
    parseBody(glyph.body).map(([tag, attrs], i) => {
      const El = elements[tag];
      return El ? createElement(El, { key: i, ...camelAttrs(attrs) }) : null;
    }),
  );
}
