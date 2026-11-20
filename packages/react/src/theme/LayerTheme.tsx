'use client';
// LayerTheme: the Theme at the top of every portal (order C5, item 2).
//
// An overlay portaled to <body> sits outside every Theme element, where the
// token selectors would not reach it. So each portal starts with a Theme
// that copies every axis of the Theme the overlay is rendered in. That
// Theme stamps the platform again, and the token CSS gives every platform
// element its own --ds-inset-safe-* from env(): an override on the Theme the
// overlay is rendered in (a drawn device frame that says where its camera
// cutout and side column are) would not reach the overlay. LayerTheme reads
// the four computed inset tokens where the overlay comes from, after mount
// on every resize (a turn of the device) and when the source's inline style
// changes, and writes them on its own
// element, so a sheet, a dialog, a menu or a popover keeps clear of the
// same safe area as the page under it. In a real browser the values are the
// same env() values the portal would read itself; in a test DOM there are
// none and nothing is written.
//
// Where it reads: the element given as `insetsFrom` (the Toaster's hidden
// anchor, order S1), else the element of the nearest Theme
// (ThemeElementContext, which every Theme provides). A portal inside a
// portal (a menu in a dialog) reads the outer LayerTheme, which carries the
// copied values inline. Order S1 made this for the Toaster; this file is
// the one helper every portal now uses.
//
// Direction and language (order C6, item 1): the portal Theme stamps `dir`
// and `lang` of the nearest Theme, so an Arabic overlay reads right to left
// and a screen reader speaks it in Arabic. With no Theme above the overlay
// it takes them from the document element (`<html dir lang>`) and follows a
// change there; on the server and before mount it stamps the defaults. A
// change on the nearest Theme reaches the portal through the Theme context.
import { use, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { ThemeContext, ThemeElementContext } from './context';
import { useTheme } from './hooks';
import { Theme, type ThemeProps } from './Theme';

/** The safe area tokens a portal Theme copies from where its overlay comes from. */
export const SAFE_AREA_TOKENS = ['--ds-inset-safe-top', '--ds-inset-safe-bottom', '--ds-inset-safe-start', '--ds-inset-safe-end'] as const;

/** The computed safe area tokens at an element, or undefined when it has none (a test DOM). */
export function readSafeArea(el: Element): Record<string, string> | undefined {
  const computed = el.ownerDocument.defaultView?.getComputedStyle(el);
  if (!computed) return undefined;
  const out: Record<string, string> = {};
  for (const name of SAFE_AREA_TOKENS) {
    const value = computed.getPropertyValue(name).trim();
    if (value) out[name] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

const sameSafeArea = (a: Record<string, string> | undefined, b: Record<string, string> | undefined) =>
  a === b || (a !== undefined && b !== undefined && SAFE_AREA_TOKENS.every((n) => a[n] === b[n]));

/**
 * The safe area tokens at `from` (else at the nearest Theme element), as
 * inline style for a portal Theme. Read after mount, on every resize and
 * when the source's inline style changes; undefined until then and where
 * the DOM computes none.
 */
export function useSafeAreaStyle(from?: Element | null): CSSProperties | undefined {
  const themeElement = use(ThemeElementContext);
  const [insets, setInsets] = useState<Record<string, string> | undefined>(undefined);
  const stop = useRef<(() => void) | null>(null);
  // Reads the source and follows resizes. Returns false while the source is not there yet.
  const start = useCallback(() => {
    if (stop.current) return true;
    const source = from ?? themeElement?.current ?? null;
    if (!source) return false;
    const read = () => {
      const next = readSafeArea(source);
      setInsets((prev) => (sameSafeArea(prev, next) ? prev : next));
    };
    read();
    const view = source.ownerDocument.defaultView;
    view?.addEventListener('resize', read);
    // The source may be another layer that writes its own copy a moment later (a layer inside a dialog), or a
    // frame Theme whose override changes (a turn of a drawn device): follow its inline style too.
    const watch = view && typeof view.MutationObserver === 'function' ? new view.MutationObserver(read) : null;
    watch?.observe(source, { attributes: true, attributeFilter: ['style'] });
    stop.current = () => {
      view?.removeEventListener('resize', read);
      watch?.disconnect();
    };
    return true;
  }, [from, themeElement]);
  const end = useCallback(() => {
    stop.current?.();
    stop.current = null;
  }, []);
  // Before paint, so a portal that mounts after the page never shows a frame without the insets.
  useLayoutEffect(() => {
    start();
    return end;
  }, [start, end]);
  // A layer rendered in place, inside its own Theme, runs its layout effect before that Theme's
  // element is attached; by the passive effects every element of the commit is.
  useEffect(() => {
    start();
  }, [start]);
  return insets as CSSProperties | undefined;
}

/** The `dir` and `lang` of the document element, as "dir|lang"; empty parts where an attribute is missing. */
function documentLocaleSnapshot(): string {
  if (typeof document === 'undefined') return '|';
  const html = document.documentElement;
  return `${html.getAttribute('dir') ?? ''}|${html.getAttribute('lang') ?? ''}`;
}

const serverLocaleSnapshot = (): string => '|';

function subscribeDocumentLocale(onChange: () => void): () => void {
  if (typeof document === 'undefined' || typeof MutationObserver !== 'function') return () => {};
  const watch = new MutationObserver(onChange);
  watch.observe(document.documentElement, { attributes: true, attributeFilter: ['dir', 'lang'] });
  return () => watch.disconnect();
}

const noopSubscribe = () => () => {};

/**
 * The `dir` and `lang` a portal Theme stamps: those of the nearest Theme,
 * else those of the document element, followed as they change. Undefined
 * parts fall back to the Theme defaults.
 */
export function useLayerLocale(): { dir: 'ltr' | 'rtl' | undefined; lang: string | undefined } {
  const parent = use(ThemeContext);
  const inTheme = parent !== null;
  const snapshot = useSyncExternalStore(inTheme ? noopSubscribe : subscribeDocumentLocale, inTheme ? serverLocaleSnapshot : documentLocaleSnapshot, serverLocaleSnapshot);
  if (parent) return { dir: parent.dir, lang: parent.lang };
  const [rawDir = '', rawLang = ''] = snapshot.split('|');
  const dir = rawDir.toLowerCase() === 'rtl' ? 'rtl' : rawDir.toLowerCase() === 'ltr' ? 'ltr' : undefined;
  return { dir, lang: rawLang || undefined };
}

export interface LayerThemeProps extends Omit<ThemeProps, 'style' | 'scheme' | 'density' | 'contrast' | 'platform' | 'glass' | 'dir' | 'lang' | 'as'> {
  /** Where the safe area is read. Default: the element of the nearest Theme. */
  insetsFrom?: Element | null;
  children?: ReactNode;
}

/**
 * The Theme a portal starts with: every axis of the current Theme, its
 * `dir` and `lang` (of the document element when there is no Theme), and
 * the safe area tokens of where the overlay comes from. Pass the layer marker
 * (`data-dialog-layer`, `data-menu-layer` and so on) as a prop.
 */
export function LayerTheme({ insetsFrom, css, children, ...rest }: LayerThemeProps) {
  const theme = useTheme();
  const insets = useSafeAreaStyle(insetsFrom);
  const locale = useLayerLocale();
  return (
    <Theme
      {...rest}
      style={theme.style}
      scheme={theme.scheme}
      density={theme.density}
      contrast={theme.contrast}
      platform={theme.platform}
      glass={theme.glass}
      dir={locale.dir}
      lang={locale.lang}
      css={insets || css ? { ...insets, ...css } : undefined}
    >
      {children}
    </Theme>
  );
}
