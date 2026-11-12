'use client';
import { createElement, use, useMemo, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { Direction } from 'radix-ui';
import { IconSetContext } from '@the-system/icons/react';
import { ThemeContext } from './context';
import { iconStyleFor } from './icons';
import { attributesOf, resolveTheme } from './resolve';
import type { ThemeAxesInput } from './types';

/** Elements a Theme may render as. Default `div`. */
export type ThemeElement = 'div' | 'section' | 'main' | 'article' | 'aside' | 'header' | 'footer' | 'nav' | 'span';

export interface ThemeProps
  extends ThemeAxesInput, Omit<HTMLAttributes<HTMLElement>, 'style' | 'dir' | 'lang' | 'children'> {
  /** The element to render. Default `div`. */
  as?: ThemeElement;
  /**
   * Inline styles for the Theme element. `style` is the style axis (studio,
   * desk and so on), so inline styles pass through under this name.
   */
  css?: CSSProperties;
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
}

/**
 * Stamps every runtime axis on its own element: `data-ds="theme"`,
 * `data-style`, `data-scheme`, `data-density`, `data-contrast`,
 * `data-platform`, `data-glass`, `dir` and `lang`. An axis that is not passed
 * comes from the nearest parent Theme, and at the root from the defaults in
 * `resolveTheme` (style studio, scheme and density from its style.json).
 *
 * It also wires the Radix direction provider and the icon set of the active
 * style, and gives `useTheme` and `useOptionalPart` their data. The token CSS
 * and `base.css` key on these attributes, so a Theme paints its own
 * background and text color. Nest a Theme to change any axis for a subtree.
 *
 * No window access: safe to render on the server.
 */
export function Theme({
  style,
  scheme,
  density,
  contrast,
  platform,
  glass,
  dir,
  lang,
  as = 'div',
  css,
  children,
  ...rest
}: ThemeProps) {
  const parent = use(ThemeContext);
  const value = useMemo(
    () => resolveTheme({ style, scheme, density, contrast, platform, glass, dir, lang }, parent),
    [style, scheme, density, contrast, platform, glass, dir, lang, parent],
  );
  return createElement(
    as,
    { ...rest, ...attributesOf(value), style: css },
    <ThemeContext value={value}>
      <Direction.Provider dir={value.dir}>
        <IconSetContext value={iconStyleFor(value.styleData)}>{children}</IconSetContext>
      </Direction.Provider>
    </ThemeContext>,
  );
}
