// Small text helpers shared by the rules.
import type { AllowEntry, Finding } from './types';

/** Maps a string index to a 1 based line and column. */
export function locator(text: string): (index: number) => { line: number; column: number } {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1);
  return (index: number) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if ((starts[mid] ?? 0) <= index) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, column: index - (starts[lo] ?? 0) + 1 };
  };
}

/** Replaces every character of a match with a space, keeping newlines, so offsets stay valid. */
export function blank(match: string): string {
  return match.replace(/[^\n]/g, ' ');
}

/** CSS with block comments blanked out, keeping offsets. */
export function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, blank);
}

/** Blanks the inside of quoted strings and url(...) so value scans skip them. */
export function maskCssStrings(value: string): string {
  return value
    .replace(/(["'])(?:\\.|(?!\1)[^\\])*\1/g, (m) => m[0] + ' '.repeat(Math.max(0, m.length - 2)) + m[0])
    .replace(/\burl\(([^)]*)\)/gi, (m) => 'url(' + ' '.repeat(m.length - 5) + ')');
}

export function extname(path: string): string {
  const slash = path.lastIndexOf('/');
  const dot = path.lastIndexOf('.');
  return dot > slash ? path.slice(dot).toLowerCase() : '';
}

/** Drops findings whose `allowKey` an allow list entry names. */
export function applyAllowlist(findings: Finding[], allow: readonly AllowEntry[]): Finding[] {
  if (allow.length === 0) return findings;
  const keys = new Set(allow.map((e) => e.key));
  return findings.filter((f) => !(f.allowKey && keys.has(f.allowKey)));
}

/** Allow list entries that no finding uses any more. */
export function staleAllowEntries(findings: Finding[], allow: readonly AllowEntry[]): AllowEntry[] {
  const used = new Set(findings.map((f) => f.allowKey).filter(Boolean));
  return allow.filter((e) => !used.has(e.key));
}

/** CSS Color 4 named colors. System colors (Canvas, Highlight) are not here on purpose. */
export const NAMED_COLORS: ReadonlySet<string> = new Set(
  (
    'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown ' +
    'burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan ' +
    'darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred ' +
    'darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink ' +
    'deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold ' +
    'goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush ' +
    'lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey ' +
    'lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime ' +
    'limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen ' +
    'mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin ' +
    'navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise ' +
    'palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue ' +
    'saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow ' +
    'springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'
  ).split(' '),
);

export const HEX_COLOR = /#[0-9a-f]{3,8}\b/gi;
export const COLOR_FUNCTION = /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/gi;

/** True when a string literal (from TS or a template) reads as a color. */
export function looksLikeColor(text: string): boolean {
  const t = text.trim().toLowerCase();
  return /^#[0-9a-f]{3,8}$/.test(t) || /^(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/.test(t) || NAMED_COLORS.has(t);
}
