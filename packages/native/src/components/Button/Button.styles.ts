// Button and IconButton styles for React Native: a port of
// packages/css/src/components/Button.css and IconButton.css onto the theme
// objects of @the-system/tokens/native. Every number and color comes from the
// theme. The CSS private properties (--_button-bg and friends) become the
// fields of `ButtonColors`, set in the same order as the CSS cascade, and the
// states swap them the same way: hover takes the -hover colors, press the
// -active ones.
//
// Conversions, from the header of packages/tokens/dist/native/types.ts:
// - radius.control is an em token. CSS resolves 1em on the button's own font
//   size, so it is scaled from the 16px base to the label size here.
// - lineHeight = fontSize * leading.
// - Fluid space and font sizes are the max of their clamp (the token
//   contract). On a narrow web viewport the CSS clamp gives less.
import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import type { Emphasis, Shape, Size, Tone } from '@the-system/shared';
import type { Theme } from '@the-system/tokens/native';
import type { NativeRecipe, RegisteredRecipe } from '../../theme/recipes';
import type { Dir, Platform } from '../../theme/types';
import { emAt, lineHeightOf, touchTargetOf } from '../../theme/units';

export type ButtonSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export type ButtonTone = Extract<Tone, 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'>;
export type ButtonEmphasis = Extract<Emphasis, 'solid' | 'soft' | 'outline' | 'ghost' | 'link'>;
export type ButtonShape = Extract<Shape, 'default' | 'pill' | 'square'>;

/** Everything the styles depend on. Part of the cache key. */
export interface ButtonVariants {
  /** `button` or `icon-button`: the same look, IconButton is a square with no padding. */
  kind: 'button' | 'icon-button';
  size: ButtonSize;
  tone: ButtonTone;
  emphasis: ButtonEmphasis;
  shape: ButtonShape;
  fullWidth: boolean;
  wrap: boolean;
  /** lang is Arabic: the Arabic family and leading, no letter spacing, small text one step up. */
  arabic: boolean;
  platform: Platform;
  dir: Dir;
}

/** The parts a recipe may adjust. */
export type ButtonPart = 'root' | 'rootHover' | 'rootPressed' | 'label' | 'slot' | 'spinner';

/** A style pack recipe for Button and IconButton. */
export type ButtonRecipe = NativeRecipe<ButtonPart, ButtonVariants>;

/** The colors of one tone by emphasis: the --_button-* properties of Button.css. */
export interface ButtonColors {
  bg: string;
  fg: string;
  border: string;
  bgHover: string;
  fgHover: string;
  borderHover: string;
  bgActive: string;
  fgActive: string;
  decoration: string;
}

/** CSS `transparent`. A keyword, not a design value. */
const TRANSPARENT = 'transparent';

type StateTone = 'danger' | 'success' | 'warning' | 'info';

/**
 * The colors for a tone and an emphasis, in the order of the Button.css
 * cascade. Pure, so the tests can check it against the token values.
 */
export function buttonColors(theme: Theme, tone: ButtonTone, emphasis: ButtonEmphasis): ButtonColors {
  const c = theme.color;
  // The root defaults: neutral soft, the source's secondary button.
  const out: ButtonColors = {
    bg: c.bg['overlay-10'],
    fg: theme.button.text.secondary,
    border: TRANSPARENT,
    bgHover: c.bg['overlay-20'],
    fgHover: c.text.default,
    borderHover: TRANSPARENT,
    bgActive: c.bg['overlay-30'],
    fgActive: c.text.bright,
    decoration: c.border.control,
  };

  if (tone === 'neutral') {
    if (emphasis === 'solid') {
      Object.assign(out, {
        bg: c.bg['overlay-20'],
        fg: c.text.default,
        bgHover: c.bg['overlay-30'],
        fgHover: c.text.bright,
        bgActive: c.bg['overlay-20'],
      });
    } else if (emphasis === 'outline') {
      Object.assign(out, {
        bg: TRANSPARENT,
        fg: c.text.default,
        border: c.border.control,
        borderHover: c.border['control-hover'],
        bgHover: c.bg['overlay-5'],
        bgActive: c.bg['overlay-10'],
      });
    } else if (emphasis === 'ghost') {
      Object.assign(out, {
        bg: TRANSPARENT,
        fg: c.text.muted,
        bgHover: c.bg['overlay-10'],
        bgActive: c.bg['overlay-20'],
        fgActive: c.text.default,
      });
    }
  } else if (tone === 'accent') {
    if (emphasis === 'solid') {
      // The primary action: yellow with ink text in Desk, the neutral fill in Studio.
      Object.assign(out, {
        bg: c.primary.fill,
        fg: c.primary.text,
        border: c.primary.border,
        borderHover: c.primary.border,
        bgHover: c.primary['fill-hover'],
        fgHover: c.primary.text,
        bgActive: c.primary['fill-pressed'],
        fgActive: c.primary.text,
        decoration: c.primary.border,
      });
    } else {
      // The lighter accents: the primary tint and the primary text for a plain surface.
      Object.assign(out, {
        bg: c.primary.tint,
        fg: c.primary['on-surface'],
        bgHover: c.primary['tint-hover'],
        fgHover: c.primary['on-surface'],
        bgActive: c.primary['tint-hover'],
        fgActive: c.primary['on-surface'],
        decoration: c.primary.border,
      });
      if (emphasis === 'outline') {
        Object.assign(out, {
          bg: TRANSPARENT,
          border: c.primary.border,
          borderHover: c.primary.border,
          bgHover: c.primary.tint,
        });
      } else if (emphasis === 'ghost') {
        Object.assign(out, { bg: TRANSPARENT, bgHover: c.primary.tint });
      }
    }
  } else {
    const s = c.state[tone as StateTone];
    if (emphasis === 'solid') {
      Object.assign(out, {
        bg: s.solid,
        fg: s['on-solid'],
        bgHover: s['solid-hover'],
        fgHover: s['on-solid'],
        bgActive: s['solid-hover'],
        fgActive: s['on-solid'],
      });
    } else if (emphasis === 'soft') {
      Object.assign(out, {
        bg: s['tint-10'],
        fg: s['on-tint'],
        bgHover: s['tint-20'],
        fgHover: s['on-tint'],
        bgActive: s['tint-20'],
        fgActive: s['on-tint'],
      });
    } else if (emphasis === 'outline' || emphasis === 'ghost') {
      Object.assign(out, {
        bg: TRANSPARENT,
        fg: s.text,
        bgHover: s['tint-10'],
        fgHover: s['on-tint'],
        bgActive: s['tint-20'],
        fgActive: s['on-tint'],
      });
      if (emphasis === 'outline') Object.assign(out, { border: s.border, borderHover: s.border });
    }
  }

  // Link: no fill, the link color, always underlined. Later in the CSS than the tone rules.
  if (emphasis === 'link') {
    Object.assign(out, {
      bg: TRANSPARENT,
      bgHover: TRANSPARENT,
      bgActive: TRANSPARENT,
      fg: c.text.link,
      fgHover: c.text.bright,
      fgActive: c.text.bright,
    });
    if (tone === 'accent') {
      Object.assign(out, { fg: c.primary['on-surface'], fgHover: c.primary['on-surface'], fgActive: c.primary['on-surface'] });
    } else if (tone !== 'neutral') {
      const text = c.state[tone as StateTone].text;
      Object.assign(out, { fg: text, fgHover: text, fgActive: text, decoration: text });
    }
  }
  return out;
}

/** The box numbers of a size: the --_button-height, -padding-inline, -gap and -font-size of Button.css. */
export interface ButtonMetrics {
  height: number;
  paddingInline: number;
  gap: number;
  fontSize: number;
  lineHeight: number;
  radius: number;
  minWidth: number;
  minHeight: number;
}

export function buttonMetrics(theme: Theme, v: ButtonVariants): ButtonMetrics {
  const { size, space, font, radius } = theme;
  const height = size.control[v.size];
  let paddingInline = space.xl;
  let gap = space['2xs'];
  let fontSize = font.size.s;
  if (v.size === 'xs') paddingInline = space.xs;
  if (v.size === 'sm') paddingInline = space.s;
  if (v.size === 'lg') {
    paddingInline = space['2xl'];
    gap = space.xs;
    fontSize = font.size.m;
  }
  // Arabic small text is one step up (base.css moves s to m, Button.css moves lg from m to l).
  if (v.arabic) fontSize = v.size === 'lg' ? font.size.l : font.size.m;

  // radius.control is 1em: scale it from the build's 16px base to this font size.
  let r = emAt(radius.control, fontSize);
  if (v.size === 'xs') r = radius.field;
  if (v.shape === 'pill') r = radius.pill;
  if (v.shape === 'square') r = radius.sm;

  const link = v.kind === 'button' && v.emphasis === 'link';
  if (link) {
    paddingInline = 0;
    r = radius.xs;
  }
  if (v.kind === 'icon-button') paddingInline = 0;

  const targetMin = size['target-min'];
  const leading = v.arabic ? font.leading.arabic.tight : font.leading.tight;
  return {
    height,
    paddingInline,
    gap,
    fontSize,
    lineHeight: lineHeightOf(fontSize, leading),
    radius: r,
    minWidth: link ? targetMin : Math.max(height, targetMin),
    minHeight: link ? targetMin : height,
  };
}

/** What a Button renders with: the sheet, the colors for icons and the spinner, and the touch slop. */
export interface ButtonStyles {
  styles: {
    root: ViewStyle;
    rootHover: ViewStyle;
    rootPressed: ViewStyle;
    rootDisabled: ViewStyle;
    label: TextStyle;
    labelHover: TextStyle;
    labelPressed: TextStyle;
    slot: ViewStyle;
    hidden: ViewStyle;
    spinner: ViewStyle;
    mirror: ViewStyle;
    unmirror: ViewStyle;
  };
  colors: ButtonColors;
  metrics: ButtonMetrics;
  /** Extends the touch area to 44 (iOS) or 48 (Android) at every size. 0 on the web. */
  hitSlop: { top: number; bottom: number; left: number; right: number };
  /** The spinner size: size.icon.sm, as on the web. */
  spinnerSize: number;
  /** The icon size name for slot icons: md (16), as on the web. */
  iconSize: 'md';
}

function variantKey(v: ButtonVariants): string {
  return [v.kind, v.size, v.tone, v.emphasis, v.shape, v.fullWidth, v.wrap, v.arabic, v.platform, v.dir].join('|');
}

const cache = new WeakMap<Theme, Map<string, ButtonStyles>>();

/**
 * The styles of one Button for a theme object and its variants, with the
 * style pack recipe applied when there is one. Memoized per theme object,
 * variant key and recipe, so a Button re-renders with the same objects.
 */
export function createButtonStyles(
  theme: Theme,
  variants: ButtonVariants,
  recipe?: RegisteredRecipe<ButtonPart, ButtonVariants>,
): ButtonStyles {
  let byKey = cache.get(theme);
  if (!byKey) {
    byKey = new Map();
    cache.set(theme, byKey);
  }
  const key = `${variantKey(variants)}|${recipe?.id ?? ''}`;
  const hit = byKey.get(key);
  if (hit) return hit;

  const colors = buttonColors(theme, variants.tone, variants.emphasis);
  const m = buttonMetrics(theme, variants);
  const link = variants.kind === 'button' && variants.emphasis === 'link';
  const family = variants.arabic ? theme.font.family.arabic : theme.font.family.sans;

  const base: Record<ButtonPart, Record<string, unknown>> = {
    root: {
      direction: variants.dir,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      // No cross axis alignment of its own: the parent row or column decides,
      // as a web flex row does with an inline-flex button.
      ...(variants.fullWidth ? { alignSelf: 'stretch' } : {}),
      flexShrink: variants.kind === 'icon-button' ? 0 : 1,
      maxWidth: '100%',
      gap: m.gap,
      minHeight: m.minHeight,
      minWidth: m.minWidth,
      ...(variants.kind === 'icon-button' ? { width: m.minWidth } : {}),
      ...(variants.fullWidth ? { width: '100%' } : {}),
      paddingStart: m.paddingInline,
      paddingEnd: m.paddingInline,
      ...(variants.wrap && !link ? { paddingVertical: theme.space['2xs'] } : {}),
      borderWidth: theme.border.width.default,
      borderColor: colors.border,
      borderRadius: m.radius,
      backgroundColor: colors.bg,
    },
    rootHover: { backgroundColor: colors.bgHover, borderColor: colors.borderHover },
    rootPressed: { backgroundColor: colors.bgActive, borderColor: colors.borderHover },
    label: {
      color: colors.fg,
      ...(family !== undefined ? { fontFamily: family } : {}),
      fontSize: m.fontSize,
      fontWeight: String(theme.font.weight.bold) as TextStyle['fontWeight'],
      lineHeight: m.lineHeight,
      letterSpacing: variants.arabic ? 0 : emAt(theme.font.tracking.none, m.fontSize),
      textAlign: 'center',
      writingDirection: variants.dir,
      flexShrink: 1,
      includeFontPadding: false,
      ...(link
        ? {
            textDecorationLine: 'underline',
            textDecorationStyle: 'solid',
            textDecorationColor: colors.decoration,
          }
        : {}),
    },
    slot: { flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
    spinner: { position: 'absolute', top: 0, bottom: 0, start: 0, end: 0, alignItems: 'center', justifyContent: 'center' },
  };

  const adjust = recipe?.recipe(base, theme, variants) ?? {};
  const part = (name: ButtonPart) => ({ ...base[name], ...(adjust[name] ?? {}) });

  const touch = touchTargetOf(theme, variants.platform);
  const vertical = Math.max(0, (touch - m.minHeight) / 2);
  const horizontal = Math.max(0, (touch - m.minWidth) / 2);

  const styles = StyleSheet.create({
    root: part('root') as ViewStyle,
    rootHover: part('rootHover') as ViewStyle,
    rootPressed: part('rootPressed') as ViewStyle,
    // Disabled keeps its place and its focus, dims and stops reacting.
    rootDisabled: { opacity: theme.opacity.disabled },
    label: part('label') as TextStyle,
    labelHover: { color: colors.fgHover, ...(link ? { textDecorationColor: colors.fgHover } : {}) },
    labelPressed: { color: colors.fgActive },
    slot: part('slot') as ViewStyle,
    // Loading: the content stays in flow under the spinner, so the width holds.
    hidden: { opacity: 0 },
    spinner: part('spinner') as ViewStyle,
    // Directional icons in a right to left box. -1 is a reflection, not a size.
    mirror: { transform: [{ scaleX: -1 }] },
    unmirror: { transform: [{ scaleX: 1 }] },
  });

  const out: ButtonStyles = {
    styles,
    colors,
    metrics: m,
    hitSlop: { top: vertical, bottom: vertical, left: horizontal, right: horizontal },
    spinnerSize: theme.size.icon.sm,
    iconSize: 'md',
  };
  byKey.set(key, out);
  return out;
}
