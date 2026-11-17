/**
 * Colour helpers for the colour controls (order M9.18, proposed). Pure, shared
 * by every framework.
 *
 * - Names. A colour is never named by its hex alone (WCAG 2.2 1.1.1, 1.4.1):
 *   `colorName` gives a short name from the hue and the lightness, "Blue,
 *   dark" in English and "أزرق غامق" in Arabic. React Aria has names of its
 *   own, but in Arabic they keep the English word order ("ساطع أزرق سماوي",
 *   the adjective first) and a Latin comma, and the role words are wrong, so
 *   the system names colours here.
 * - Contrast. `colorContrast` is the WCAG contrast of two colours, and
 *   `colorSwatchEdgeNeeded` says whether a swatch alone fails 3:1 against the
 *   surface it sits on (1.4.11), the reason every swatch draws an edge.
 * - The grid palette. `colorSwatchGrid` is the system's own 12 by 10 grid: a
 *   row of greys, then nine rows from dark to light over twelve hues, made in
 *   OKLCH so each row reads as one lightness. No value is taken from a kit.
 * - Locales. `colorLocale` adds `-u-nu-latn`, so digits stay Western in
 *   Arabic, as `dateLocale` does for dates.
 *
 * Every export starts with `color` so the shared barrel never meets a name
 * from another file.
 */

/** A colour in sRGB, each channel 0 to 255, and alpha 0 to 1. */
export interface ColorRgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** A colour in OKLCH: lightness 0 to 1, chroma 0 to about 0.4, hue 0 to 360. */
export interface ColorOklch {
  l: number;
  c: number;
  h: number;
}

/** The languages the built in words come in. */
export type ColorLanguage = 'en' | 'ar';

/** The channels a colour slider or field can edit (React Aria's names). */
export type ColorChannelName = 'hue' | 'saturation' | 'brightness' | 'lightness' | 'red' | 'green' | 'blue' | 'alpha';

/** The language of a locale tag: ar for any Arabic tag, en otherwise. */
export function colorLanguage(locale: string | undefined): ColorLanguage {
  try {
    return new Intl.Locale(locale || 'en').language === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

/**
 * The locale for the colour controls: the given tag with Western digits set
 * (`-u-nu-latn`). `ar-SA` gives `ar-SA-u-nu-latn`. An invalid tag gives `en`.
 */
export function colorLocale(locale: string | undefined): string {
  try {
    return new Intl.Locale(locale || 'en', { numberingSystem: 'latn' }).toString();
  } catch {
    return new Intl.Locale('en', { numberingSystem: 'latn' }).toString();
  }
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const HEX = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i;

/**
 * Reads a hex colour (#rgb, #rgba, #rrggbb, #rrggbbaa, the # optional) or an
 * rgb() or rgba() string. Returns null for anything else.
 */
export function colorParse(text: string): ColorRgba | null {
  const value = text.trim();
  const hex = HEX.exec(value);
  if (hex) {
    let digits = hex[1]!;
    if (digits.length <= 4) digits = [...digits].map((d) => d + d).join('');
    const n = (i: number) => parseInt(digits.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: digits.length === 8 ? Math.round((n(6) / 255) * 1000) / 1000 : 1 };
  }
  const rgb = RGB.exec(value);
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4]);
    return { r: clamp(Math.round(+rgb[1]!), 0, 255), g: clamp(Math.round(+rgb[2]!), 0, 255), b: clamp(Math.round(+rgb[3]!), 0, 255), a: clamp(alpha, 0, 1) };
  }
  return null;
}

const hex2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');

/** A colour as #rrggbb, or #rrggbbaa when it is not opaque. */
export function colorToHex(color: ColorRgba): string {
  const base = `#${hex2(color.r)}${hex2(color.g)}${hex2(color.b)}`;
  return color.a >= 1 ? base : `${base}${hex2(color.a * 255)}`;
}

const toLinear = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (v: number) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

/** WCAG relative luminance of an opaque colour, 0 to 1. */
export function colorLuminance(color: ColorRgba): number {
  return 0.2126 * toLinear(color.r) + 0.7152 * toLinear(color.g) + 0.0722 * toLinear(color.b);
}

/** A colour laid over a backdrop, by its alpha. */
export function colorOver(color: ColorRgba, backdrop: ColorRgba): ColorRgba {
  const a = color.a;
  return { r: color.r * a + backdrop.r * (1 - a), g: color.g * a + backdrop.g * (1 - a), b: color.b * a + backdrop.b * (1 - a), a: 1 };
}

/**
 * The WCAG contrast ratio of two colours, 1 to 21. A see through colour is
 * laid over the other first. Strings are read with `colorParse`; an
 * unreadable string counts as black.
 */
export function colorContrast(a: ColorRgba | string, b: ColorRgba | string): number {
  const read = (c: ColorRgba | string) => (typeof c === 'string' ? colorParse(c) ?? { r: 0, g: 0, b: 0, a: 1 } : c);
  const bg = read(b);
  const solidBg = bg.a < 1 ? colorOver(bg, { r: 255, g: 255, b: 255, a: 1 }) : bg;
  const fg = colorOver(read(a), solidBg);
  const x = colorLuminance(fg);
  const y = colorLuminance(solidBg);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/**
 * True when a swatch alone is under 3:1 against its surface (WCAG 2.2
 * 1.4.11), so its edge is what shows where it ends. The system draws the
 * edge on every swatch in any case (a token at 3:1), because the surface is
 * a token the consumer does not see; this tells a test or a tool why.
 */
export function colorSwatchEdgeNeeded(swatch: ColorRgba | string, surface: ColorRgba | string, min = 3): boolean {
  return colorContrast(swatch, surface) < min;
}

/** sRGB to OKLCH (Björn Ottosson's OKLab, in polar form). Alpha is dropped. */
export function colorToOklch(color: ColorRgba): ColorOklch {
  const r = toLinear(color.r);
  const g = toLinear(color.g);
  const b = toLinear(color.b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(A, B);
  const h = (Math.atan2(B, A) * 180) / Math.PI;
  return { l: L, c, h: c < 1e-4 ? 0 : (h + 360) % 360 };
}

/** OKLCH to linear sRGB, unclamped, so a caller can test the gamut. */
function oklchToLinear({ l, c, h }: ColorOklch): [number, number, number] {
  const A = c * Math.cos((h * Math.PI) / 180);
  const B = c * Math.sin((h * Math.PI) / 180);
  const l1 = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m1 = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s1 = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l1 - 3.3077115913 * m1 + 0.2309699292 * s1,
    -1.2684380046 * l1 + 2.6097574011 * m1 - 0.3413193965 * s1,
    -0.0041960863 * l1 - 0.7034186147 * m1 + 1.707614701 * s1,
  ];
}

const inGamut = (rgb: [number, number, number]) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** The largest chroma at a lightness and hue that sRGB can show. */
function maxChroma(l: number, h: number): number {
  let lo = 0;
  let hi = 0.4;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinear({ l, c: mid, h }))) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** OKLCH to sRGB. A colour out of gamut keeps its lightness and hue and loses chroma until it fits. */
export function colorFromOklch(color: ColorOklch, alpha = 1): ColorRgba {
  const c = Math.min(color.c, maxChroma(clamp(color.l, 0, 1), color.h));
  const [r, g, b] = oklchToLinear({ l: clamp(color.l, 0, 1), c, h: color.h });
  return { r: Math.round(fromLinear(clamp(r, 0, 1))), g: Math.round(fromLinear(clamp(g, 0, 1))), b: Math.round(fromLinear(clamp(b, 0, 1))), a: alpha };
}

/** The lightness where a hue reaches its most vivid colour, and that chroma. Cached per whole degree. */
const cusps = new Map<number, { l: number; c: number }>();
function cusp(h: number): { l: number; c: number } {
  const key = Math.round(h) % 360;
  const hit = cusps.get(key);
  if (hit) return hit;
  let best = { l: 0.5, c: 0 };
  for (let l = 0.2; l <= 0.99; l += 0.01) {
    const c = maxChroma(l, key);
    if (c > best.c) best = { l, c };
  }
  cusps.set(key, best);
  return best;
}

/** The hue families the names use. */
export type ColorFamily =
  | 'red'
  | 'orange'
  | 'brown'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'grey'
  | 'white'
  | 'black';

/** How light a colour is, next to the most vivid colour of its hue. */
export type ColorShade = 'very-dark' | 'dark' | 'base' | 'light' | 'very-light';

/** Hue ranges in OKLCH degrees, start inclusive. Pink wraps past 360. */
const FAMILIES: readonly [number, ColorFamily][] = [
  [12, 'red'],
  [38, 'orange'],
  [80, 'yellow'],
  [118, 'green'],
  [165, 'teal'],
  [190, 'cyan'],
  [235, 'blue'],
  [282, 'purple'],
  [335, 'pink'],
];

function hueFamily(h: number): ColorFamily {
  let family: ColorFamily = 'pink';
  for (const [start, name] of FAMILIES) if (h >= start) family = name;
  return h < FAMILIES[0]![0] ? 'pink' : family;
}

/** Chroma under this reads as a grey; a very light tint keeps its hue down to the second value. */
const GREY_CHROMA = 0.025;
const GREY_CHROMA_PALE = 0.012;

/**
 * The family and shade of a colour, from its OKLCH hue, lightness and
 * chroma. A colour with almost no chroma is white, black or a grey. A dark
 * orange is brown.
 */
export function colorDescribe(color: ColorRgba | string): { family: ColorFamily; shade: ColorShade } {
  const rgba = typeof color === 'string' ? colorParse(color) : color;
  if (!rgba) return { family: 'black', shade: 'base' };
  const { l, c, h } = colorToOklch(rgba);
  if (c < (l > 0.9 ? GREY_CHROMA_PALE : GREY_CHROMA)) {
    if (l >= 0.97) return { family: 'white', shade: 'base' };
    if (l <= 0.16) return { family: 'black', shade: 'base' };
    const shade: ColorShade = l < 0.35 ? 'very-dark' : l < 0.52 ? 'dark' : l < 0.72 ? 'base' : l < 0.87 ? 'light' : 'very-light';
    return { family: 'grey', shade };
  }
  let family = hueFamily(h);
  const top = cusp(h);
  const d = l - top.l;
  const vivid = c / top.c;
  let shade: ColorShade = 'base';
  if (l < 0.33) shade = 'very-dark';
  else if (l < Math.min(top.l - 0.12, 0.62)) shade = 'dark';
  else if (l > 0.9 && vivid < 0.4) shade = 'very-light';
  else if (l > Math.max(top.l + 0.05, 0.7) || (l > 0.8 && vivid < 0.6)) shade = 'light';
  if (family === 'orange' && l < 0.55) {
    family = 'brown';
    if (shade === 'dark' && l >= 0.45) shade = 'base';
  }
  return { family, shade };
}

const FAMILY_WORDS: Record<ColorLanguage, Record<ColorFamily, string>> = {
  en: {
    red: 'Red',
    orange: 'Orange',
    brown: 'Brown',
    yellow: 'Yellow',
    green: 'Green',
    teal: 'Teal',
    cyan: 'Cyan',
    blue: 'Blue',
    purple: 'Purple',
    pink: 'Pink',
    grey: 'Grey',
    white: 'White',
    black: 'Black',
  },
  ar: {
    red: 'أحمر',
    orange: 'برتقالي',
    brown: 'بني',
    yellow: 'أصفر',
    green: 'أخضر',
    teal: 'فيروزي',
    cyan: 'سماوي',
    blue: 'أزرق',
    purple: 'بنفسجي',
    pink: 'وردي',
    grey: 'رمادي',
    white: 'أبيض',
    black: 'أسود',
  },
};

const SHADE_WORDS: Record<ColorLanguage, Record<ColorShade, string>> = {
  en: { 'very-dark': 'very dark', dark: 'dark', base: '', light: 'light', 'very-light': 'very light' },
  ar: { 'very-dark': 'غامق جدا', dark: 'غامق', base: '', light: 'فاتح', 'very-light': 'فاتح جدا' },
};

/**
 * The name of a colour for people and screen readers, from its hue and
 * lightness: "Blue, dark" and "أزرق غامق". A see through colour adds how
 * see through it is, with Western digits: "Blue, dark, 40% transparent",
 * "أزرق غامق، شفافية 40%". A fully see through colour is "Transparent",
 * "شفاف". Pass a locale or a language (en, ar, ar-SA).
 */
export function colorName(color: ColorRgba | string, locale: string | undefined = 'en'): string {
  const lang = colorLanguage(locale);
  const rgba = typeof color === 'string' ? colorParse(color) : color;
  if (!rgba) return '';
  if (rgba.a <= 0) return lang === 'ar' ? 'شفاف' : 'Transparent';
  const { family, shade } = colorDescribe(rgba);
  const word = FAMILY_WORDS[lang][family];
  const shadeWord = SHADE_WORDS[lang][shade];
  const clear = Math.round((1 - rgba.a) * 100);
  if (lang === 'ar') {
    const base = shadeWord ? `${word} ${shadeWord}` : word;
    return clear > 0 ? `${base}، شفافية ${clear}%` : base;
  }
  const parts = [word];
  if (shadeWord) parts.push(shadeWord);
  if (clear > 0) parts.push(`${clear}% transparent`);
  return parts.join(', ');
}

/** The built in words of the colour controls, nouns in Arabic. */
export interface ColorWords {
  /** The role a swatch reads as: "colour swatch", "عينة لون". */
  swatch: string;
  /** The default name of a swatch picker: "Colours", "الألوان". */
  swatches: string;
  /** The add button of a row of saved swatches. */
  add: string;
  /** The name of a hex field. */
  hex: string;
  /** Channel names, for slider and field labels. */
  channels: Record<ColorChannelName, string>;
}

const WORDS: Record<ColorLanguage, ColorWords> = {
  en: {
    swatch: 'colour swatch',
    swatches: 'Colours',
    add: 'Add colour',
    hex: 'Hex',
    channels: {
      hue: 'Hue',
      saturation: 'Saturation',
      brightness: 'Brightness',
      lightness: 'Lightness',
      red: 'Red',
      green: 'Green',
      blue: 'Blue',
      alpha: 'Opacity',
    },
  },
  ar: {
    swatch: 'عينة لون',
    swatches: 'الألوان',
    add: 'إضافة لون',
    hex: 'رمز اللون',
    channels: {
      hue: 'درجة اللون',
      saturation: 'التشبع',
      brightness: 'السطوع',
      lightness: 'الإضاءة',
      red: 'الأحمر',
      green: 'الأخضر',
      blue: 'الأزرق',
      alpha: 'العتامة',
    },
  },
};

/** The built in words for a locale or a language. */
export function colorWords(locale: string | undefined): ColorWords {
  return WORDS[colorLanguage(locale)];
}

/** Hue of each grid column in OKLCH degrees, in the order of the colour map: cyan through blue, purple, red, orange and yellow to green. */
export const COLOR_GRID_HUES: readonly number[] = [222, 258, 285, 310, 350, 25, 40, 58, 78, 102, 124, 145];

/** Lightness of each colour row, dark to light. */
const GRID_LIGHTNESS: readonly number[] = [0.3, 0.39, 0.48, 0.57, 0.66, 0.75, 0.83, 0.89, 0.945];

/** How much of the most chroma a row takes: full in the middle rows, pale at the light end. */
const GRID_VIVID: readonly number[] = [0.8, 0.9, 1, 1, 1, 0.95, 0.85, 0.7, 0.5];

/**
 * The system's own grid palette: 10 rows of 12 colours as #rrggbb. Row 0 is
 * white to black in even steps; rows 1 to 9 run from dark to light over the
 * twelve hues of `COLOR_GRID_HUES`, each row one OKLCH lightness. The same
 * every call.
 */
export function colorSwatchGrid(): string[][] {
  const greys: string[] = [];
  for (let i = 0; i < 12; i += 1) {
    const v = 255 - (255 * i) / 11;
    greys.push(colorToHex({ r: v, g: v, b: v, a: 1 }));
  }
  const rows = [greys];
  GRID_LIGHTNESS.forEach((l, row) => {
    rows.push(COLOR_GRID_HUES.map((h) => colorToHex(colorFromOklch({ l, c: maxChroma(l, h) * GRID_VIVID[row]!, h }))));
  });
  return rows;
}
