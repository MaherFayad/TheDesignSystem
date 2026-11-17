'use client';
import { createElement, use, useEffect, useMemo, useSyncExternalStore, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { Direction } from 'radix-ui';
import { acquireRefraction, refractionEnvOf, refractionSupported } from '@the-system/shared';
import { IconSetContext } from '@the-system/icons/react';
import { ThemeContext } from './context';
import { useDevicePlatform } from './hooks';
import { iconStyleFor } from './icons';
import { attributesOf, resolveTheme } from './resolve';
import type { ThemeInput } from './types';

const noopSubscribe = () => () => {};
const clientRefraction = (): boolean => refractionSupported(refractionEnvOf(typeof window === 'undefined' ? undefined : window));
const serverRefraction = (): boolean => false;

/** Elements a Theme may render as. Default `div`. */
export type ThemeElement = 'div' | 'section' | 'main' | 'article' | 'aside' | 'header' | 'footer' | 'nav' | 'span';

export interface ThemeProps
  extends ThemeInput, Omit<HTMLAttributes<HTMLElement>, 'style' | 'dir' | 'lang' | 'children'> {
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
 * Platform: `platform="auto"`, and a root Theme with no `platform`, follow
 * the device (`ios`, `android`, else `web`; never `macos`). The server render
 * stamps `web` and the detected value is stamped once on mount. An app that
 * wants no detection passes `platform="web"`.
 *
 * Refraction (order F2, proposed): a root Theme on `ios` asks the probe
 * whether this browser paints an SVG filter behind an element (Chromium only)
 * and, when it does, mounts the filters once after mount and sets
 * `data-refraction="true"` on the document element, which turns the bending
 * glass on in `ios-refraction.css`. The server render and the hydrating
 * render probe false, so the CSS only glass paints first and the filter
 * replaces it once its maps are decoded.
 *
 * It also wires the Radix direction provider and the icon set of the active
 * style, and gives `useTheme` and `useOptionalPart` their data. The token CSS
 * and `base.css` key on these attributes, so a Theme paints its own
 * background and text color. Nest a Theme to change any axis for a subtree.
 *
 * No window access at render on the server: safe to render there.
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
  const device = useDevicePlatform();
  const value = useMemo(
    () => resolveTheme({ style, scheme, density, contrast, platform, glass, dir, lang }, parent, { platform: device }),
    [style, scheme, density, contrast, platform, glass, dir, lang, parent, device],
  );
  const refraction = useSyncExternalStore(noopSubscribe, clientRefraction, serverRefraction);
  const isRoot = parent === null;
  useEffect(() => {
    if (!isRoot || !refraction || value.platform !== 'ios') return undefined;
    return acquireRefraction(document);
  }, [isRoot, refraction, value.platform, value.style]);
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
