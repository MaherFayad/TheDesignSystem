'use client';
// ColorSwatch: a preview of one colour (order M9.18, proposed). Behavior
// from React Aria `ColorSwatch` (react-aria-components): it parses the
// colour and gives the element role img.
//
// Additions to React Aria:
// - The name comes from packages/shared/src/color.ts ("Blue, dark",
//   "أزرق داكن"), never the hex alone (WCAG 2.2 1.1.1, 1.4.1). React Aria's
//   own Arabic names keep the English word order and a Latin comma, and its
//   Arabic role word for a swatch reads "changing colours", so both the
//   name and aria-roledescription are ours.
// - The colour is data: it is set inline as the custom property
//   --_color-swatch-fill and painted by ColorSwatch.css, which also draws
//   the edge at 3:1 against the surface (1.4.11) and the checkerboard under
//   a see through colour. React Aria's inline background is dropped.
//
// DOM: div [data-ds=color-swatch] role=img aria-roledescription aria-label
import type { ComponentProps, CSSProperties, Ref } from 'react';
import { ColorSwatch as AriaColorSwatch, type Color } from 'react-aria-components';
import { colorName as nameOf, colorWords, type Shape, type Size } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { racOwnProps } from './racProps';

export type ColorSwatchSize = Size;
export type ColorSwatchShape = Shape;

export interface ColorSwatchProps extends Omit<ComponentProps<'div'>, 'color' | 'children' | 'ref' | 'title'> {
  /** The colour: a hex, rgb() or hsl() string, or a React Aria Color. */
  color: string | Color;
  /** The name read for the colour. Default: from the hue and the lightness, in the locale's language. */
  colorName?: string;
  /** Extra words read after the name, such as what the colour is for: "Fill", "لون الخلفية". */
  'aria-label'?: string;
  /** The locale of the default name and the role word. Default the language of the nearest Theme. */
  locale?: string;
  /** The square: size.control xs, sm, md (default) or lg. */
  size?: ColorSwatchSize;
  /** default: a small corner. pill: a circle. square: no corner. */
  shape?: ColorSwatchShape;
  ref?: Ref<HTMLDivElement>;
}

/** The hex of a colour with alpha, for the shared name helper. */
export const hexaOf = (color: Color) => color.toString('hexa');

export function ColorSwatch({
  color,
  colorName,
  locale,
  size = 'md',
  shape = 'default',
  className,
  style,
  ref,
  ...rest
}: ColorSwatchProps) {
  const theme = useTheme();
  const lang = locale ?? theme.lang;
  const words = colorWords(lang);
  return (
    <AriaColorSwatch
      ref={ref}
      color={color}
      aria-label={rest['aria-label']}
      aria-labelledby={rest['aria-labelledby']}
      render={(domProps, { color: parsed }) => {
        const { style: _ariaStyle, ...own } = racOwnProps(domProps as Record<string, unknown>) as ComponentProps<'div'>;
        const name = colorName ?? nameOf(hexaOf(parsed), lang);
        const label = [name, rest['aria-label']].filter(Boolean).join(lang.startsWith('ar') ? '، ' : ', ');
        return (
          <div
            {...rest}
            {...own}
            aria-label={label}
            aria-roledescription={words.swatch}
            className={className}
            style={{ ...style, '--_color-swatch-fill': parsed.toString('css') } as CSSProperties}
            data-ds="color-swatch"
            data-size={size}
            data-shape={shape}
          />
        );
      }}
    />
  );
}
