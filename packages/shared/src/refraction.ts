// Refraction on the iOS glass (order F2, proposed): the displacement map of a
// rounded rectangle or capsule, the SVG filter that bends the backdrop with
// it, and the probe that says whether this browser may get that filter.
//
// Pure: no framework, no window, no document. The DOM side that mounts the
// filters and keeps them in step with the parts is `refraction-dom.ts`.
//
// How the bend works. `backdrop-filter: url(#id)` runs an SVG filter on what
// is behind the part. `feDisplacementMap` moves each pixel by the map: the
// red channel moves it along x, the green along y, 128 is no move. The map
// here is the normal of a rounded bevel: zero in the middle, strong in a band
// along the edge, pointing inward, so a pixel near the edge shows the content
// a little further in. The content of the band is stretched toward the edge
// and bends round the corners, as through the thick edge of a lens. It points
// inward because Chromium clamps a sample taken outside the part's box to the
// edge pixel, so an outward bend smears one colour (measured in Chromium 153).
// The blue channel carries the glare: a light on the band, strongest on the
// upper leading arc and fainter on the lower trailing one.
//
// Every number in this file is data for the generated map and filter, not a
// style value: CSS reads tokens only, the map is drawn from these.

/** The attribute the probe sets on the document element when the filter may run. */
export const REFRACTION_ATTRIBUTE = 'data-refraction';

/** The private property each glass part gets: `url(#<filter id>)`. Unset, the part keeps the CSS only material. */
export const REFRACTION_PROPERTY = '--_ios-refraction';

/** The prefix of every filter id. */
export const REFRACTION_ID_PREFIX = 'ds-refraction';

/**
 * The glass parts that bend, inside an ios Theme. The same list as
 * `packages/css/src/platform/ios-refraction.css`: the tab bar, the lens of
 * its current tab, its search disc and its accessory, the navigation bar
 * buttons at either end (the back button among them) and their group
 * capsule, the sheet buttons,
 * the menu and the selection menu, the action sheet's panel, the toast
 * banner and the segmented thumb. The held switch thumb is not on it: it
 * grows and stretches while held, and the bend drew a ragged edge on the
 * track's end there (Chromium 153), so it keeps the CSS only band.
 */
export const REFRACTION_PARTS: readonly string[] = [
  "[data-ds='tab-bar']",
  "[data-ds='tab-bar'] > [data-part='item']",
  "[data-ds='tab-bar'] > [data-part='search']",
  "[data-ds='navbar'] > :is([data-part='start'], [data-part='end'], [data-part='menu-button']) :is([data-ds='button'], [data-ds='icon-button'], [data-ds='toggle-button']):not([data-emphasis='solid'], [data-ds='button-group'][data-attached] > *)",
  "[data-ds='navbar'] > :is([data-part='start'], [data-part='end']) > [data-ds='button-group'][data-attached]",
  "[data-ds='tab-bar'] > [data-part='accessory']",
  "[data-ds='navbar'] > [data-part='menu-button']",
  "[data-ds='sheet'] > [data-part='panel'] > [data-part='header'] > [data-part='close']",
  ":is([data-ds='dropdown-menu'], [data-ds='context-menu'], [data-ds='selection-menu'])",
  "[data-ds='action-sheet'] [data-part='panel']",
  "[data-ds='toast']",
  "[data-ds='segmented-control'] > [data-part='indicator']",
];

/** One selector for every part under an ios Theme. */
export const REFRACTION_SELECTOR = REFRACTION_PARTS.map((p) => `[data-platform='ios'] ${p}`).join(', ');

/** The size and corner of one part, in CSS px. */
export interface RefractionShape {
  width: number;
  height: number;
  /** The corner radius; a capsule passes half the height or more. */
  radius: number;
}

/** The look of the map. Every field has a default. */
export interface RefractionOptions {
  /** Width of the bending band along the edge, CSS px. Default: a share of the short side, see `refractionBand`. */
  band?: number;
  /** The largest move at the very edge, as a share of the band. Default 0.6: the band is stretched, never folded (see `PROFILE`). */
  depth?: number;
  /** Map pixels per CSS px. Default: see `refractionResolution`. */
  resolution?: number;
}

/** A drawn map: RGB bytes, row by row from the top. */
export interface RefractionMap {
  width: number;
  height: number;
  /** `width * height * 3` bytes: red and green the move, blue the glare. */
  data: Uint8Array;
  /** The `scale` of `feDisplacementMap`: twice the largest move in CSS px (at the widest band). */
  scale: number;
  /** The band the map was drawn with, CSS px. */
  band: number;
}

// The band is 0.36 of the short side, so a 44 high button bends over about
// 16px and a 64 high tab bar over about 23px, and never more than 30px (a
// tall menu keeps a clear middle) or less than 4px. Order G2 widened it from
// 0.3 and 24px: at 1x the bend was too faint to see.
const BAND_SHARE = 0.36;
const BAND_MIN = 4;
const BAND_MAX = 30;
// At the ends of the long side (the caps of a bar or a button) the band is
// wider by this share, as the thick rounded end of a lens bends more than its
// flat sides: the stripes and card edges behind the end caps are where the
// reference shows the bend. It grows with how much the edge faces along the
// long side, so it is continuous round the corner. Never past CAP_LIMIT of
// the half short side, so the middle of a cap is never pinched to a point.
const CAP_BOOST = 0.5;
const CAP_LIMIT = 0.85;
// A bar (order L2): a capsule at least BAR_RATIO times as long as it is
// tall, such as the tab bar, a text button, the selection menu or the toast.
// Its flat sides take a narrow band, so a line of text resting under the
// middle of the bar stays readable (the share of the short side squeezed it
// into a smear in Chromium), and its end caps a wide one, which is where the
// reference shows the bend. The cap band stops at the cap's radius.
const BAR_RATIO = 3;
const BAR_BAND = 12;
const BAR_CAP = 30;
// The profile of the bevel: the move is (1 - depth / band) ^ PROFILE. The
// sampled point never goes backwards (no fold) while PROFILE * DEPTH <= 1:
// the slope at the rim is 1 - PROFILE * DEPTH. 1.6 keeps the start of the
// band smooth (zero slope there, so no line where it begins) and lets the
// move at the rim reach 0.6 of the band.
const PROFILE = 1.6;
const DEPTH = 0.6;
// One map pixel per CSS px; a large part (a tall menu) gets half that, since
// its band is wide and smooth. A small part needs the full count: a coarse
// map scaled up makes a wavy edge on a curve as tight as a switch thumb's.
const RESOLUTION = 1;
const RESOLUTION_LARGE = 0.5;
const LARGE_AREA = 60000;
// The light comes from the upper leading corner, so the glare is strongest on
// that arc (a unit vector, y down) and comes back at a third on the far arc.
const LIGHT_X = -0.53;
const LIGHT_Y = -0.85;
const GLARE_FAR = 0.35;
const GLARE_BASE = 0.3;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** The radius as drawn: never more than half of either side. */
export function refractionRadius(shape: RefractionShape): number {
  return clamp(shape.radius, 0, Math.min(shape.width, shape.height) / 2);
}

/** The default map pixels per CSS px for a shape. */
export function refractionResolution(shape: RefractionShape): number {
  return shape.width * shape.height > LARGE_AREA ? RESOLUTION_LARGE : RESOLUTION;
}

/** True for a bar: a capsule at least three times as long as it is tall (or as wide, for a column). */
export function refractionIsBar(shape: RefractionShape): boolean {
  const short = Math.min(shape.width, shape.height);
  return short > 0 && Math.max(shape.width, shape.height) >= BAR_RATIO * short && refractionRadius(shape) >= short / 2;
}

/** The default band width for a shape, CSS px: on a bar the band of its flat sides. */
export function refractionBand(shape: RefractionShape): number {
  const short = Math.min(shape.width, shape.height);
  if (refractionIsBar(shape)) return clamp(Math.min(BAR_BAND, short * BAND_SHARE), BAND_MIN, BAND_MAX);
  return clamp(short * BAND_SHARE, BAND_MIN, BAND_MAX);
}

/** The widest the band gets on a shape (at the end of a cap), CSS px: the map's moves are a share of this. */
export function refractionReach(shape: RefractionShape, band: number): number {
  const short = Math.min(shape.width, shape.height);
  if (refractionIsBar(shape)) return Math.max(band, Math.min(BAR_CAP, short / 2));
  return Math.min(band * (1 + CAP_BOOST), Math.max(band, (CAP_LIMIT * short) / 2));
}

/** What the map holds at one point: the inward move (each in -1 to 1, a share of the largest move) and the glare (0 to 1). */
export interface RefractionSample {
  dx: number;
  dy: number;
  glare: number;
}

/**
 * The map at one point (x, y) of a shape, in CSS px from its top left corner.
 * Outside the shape, and inside it past the band, there is no move and no glare.
 * `band` is the band along the flat sides; at the ends of the long side it is
 * wider (`CAP_BOOST`, or on a bar up to its cap band).
 */
export function refractionAt(shape: RefractionShape, band: number, x: number, y: number): RefractionSample {
  const r = refractionRadius(shape);
  const hw = shape.width / 2;
  const hh = shape.height / 2;
  const px = x - hw;
  const py = y - hh;
  const qx = Math.abs(px) - (hw - r);
  const qy = Math.abs(py) - (hh - r);
  // The signed distance to the rounded rectangle (negative inside) and its outward normal.
  let dist: number;
  let nx: number;
  let ny: number;
  if (qx > 0 && qy > 0) {
    const len = Math.hypot(qx, qy);
    dist = len - r;
    nx = qx / len;
    ny = qy / len;
  } else if (qx > qy) {
    dist = qx - r;
    nx = 1;
    ny = 0;
  } else {
    dist = qy - r;
    nx = 0;
    ny = 1;
  }
  nx *= px < 0 ? -1 : 1;
  ny *= py < 0 ? -1 : 1;
  const depth = -dist;
  // How much the edge here faces along the long side: 1 on the end of a cap, 0 on a flat side.
  const along = shape.width >= shape.height ? Math.abs(nx) : Math.abs(ny);
  const reach = refractionReach(shape, band);
  // A bar goes from its flat band to its cap band; any other shape widens by CAP_BOOST, up to its reach.
  const local = refractionIsBar(shape) ? band + (reach - band) * along : Math.min(band * (1 + CAP_BOOST * along), reach);
  if (depth < 0 || depth >= local || local <= 0) return { dx: 0, dy: 0, glare: 0 };
  const edge = 1 - depth / local;
  // The bevel: the move grows with a power of the nearness to the edge, so
  // the middle of the part is untouched and the bend is strongest at the rim.
  // It is a share of the widest band, so a wider band at a cap moves further.
  const move = edge ** PROFILE * (local / reach);
  const facing = nx * LIGHT_X + ny * LIGHT_Y;
  const glare = edge * edge * edge * (GLARE_BASE + (1 - GLARE_BASE) * Math.max(0, facing) + GLARE_FAR * Math.max(0, -facing));
  return { dx: clamp(-nx * move, -1, 1), dy: clamp(-ny * move, -1, 1), glare: clamp(glare, 0, 1) };
}

/** Draws the map of a shape. */
export function buildRefractionMap(shape: RefractionShape, options: RefractionOptions = {}): RefractionMap {
  const band = options.band ?? refractionBand(shape);
  const depth = clamp(options.depth ?? DEPTH, 0, 1);
  const res = options.resolution ?? refractionResolution(shape);
  const width = Math.max(1, Math.ceil(shape.width * res));
  const height = Math.max(1, Math.ceil(shape.height * res));
  const sx = shape.width / width;
  const sy = shape.height / height;
  const data = new Uint8Array(width * height * 3);
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const s = refractionAt(shape, band, (i + 0.5) * sx, (j + 0.5) * sy);
      const o = (j * width + i) * 3;
      data[o] = Math.round(127.5 + 127.5 * s.dx);
      data[o + 1] = Math.round(127.5 + 127.5 * s.dy);
      data[o + 2] = Math.round(255 * s.glare);
    }
  }
  // feDisplacementMap moves by scale * (channel - 0.5), so a full channel moves by scale / 2.
  return { width, height, data, scale: 2 * depth * refractionReach(shape, band), band };
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Base 64 of bytes, without a platform helper (no `btoa`, no `Buffer`). */
export function toBase64(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i]! << 16) | (bytes[i + 1]! << 8) | bytes[i + 2]!;
    out += B64[(n >> 18) & 63]! + B64[(n >> 12) & 63]! + B64[(n >> 6) & 63]! + B64[n & 63]!;
  }
  const rest = bytes.length - i;
  if (rest === 1) {
    const n = bytes[i]! << 16;
    out += B64[(n >> 18) & 63]! + B64[(n >> 12) & 63]! + '==';
  } else if (rest === 2) {
    const n = (bytes[i]! << 16) | (bytes[i + 1]! << 8);
    out += B64[(n >> 18) & 63]! + B64[(n >> 12) & 63]! + B64[(n >> 6) & 63]! + '=';
  }
  return out;
}

/**
 * The map as an uncompressed 24 bit BMP: a 54 byte header and the rows from
 * the top (a negative height), each padded to 4 bytes, blue green red. BMP
 * needs no compressor and no canvas, so the map is drawn the same way in a
 * test and in the page, and the browser reads its bytes as they are.
 */
export function encodeBmp(map: Pick<RefractionMap, 'width' | 'height' | 'data'>): Uint8Array {
  const row = Math.ceil((map.width * 3) / 4) * 4;
  const size = 54 + row * map.height;
  const out = new Uint8Array(size);
  const view = new DataView(out.buffer);
  out[0] = 0x42; // B
  out[1] = 0x4d; // M
  view.setUint32(2, size, true);
  view.setUint32(10, 54, true); // pixel data offset
  view.setUint32(14, 40, true); // info header size
  view.setInt32(18, map.width, true);
  view.setInt32(22, -map.height, true); // top down
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 24, true); // bits per pixel
  view.setUint32(34, row * map.height, true);
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const s = (y * map.width + x) * 3;
      const d = 54 + y * row + x * 3;
      out[d] = map.data[s + 2]!;
      out[d + 1] = map.data[s + 1]!;
      out[d + 2] = map.data[s]!;
    }
  }
  return out;
}

/** The map as a data URL for `feImage`. */
export function refractionMapUrl(map: RefractionMap): string {
  return `data:image/bmp;base64,${toBase64(encodeBmp(map))}`;
}

/** Whole CSS px of a shape, as the filters are keyed and drawn. */
export function refractionKey(shape: RefractionShape): string {
  const w = Math.round(shape.width);
  const h = Math.round(shape.height);
  const r = Math.round(refractionRadius({ width: w, height: h, radius: shape.radius }));
  return `${w}x${h}r${r}`;
}

/** The filter id for a shape. Parts of the same size and corner share one filter. */
export function refractionId(shape: RefractionShape): string {
  return `${REFRACTION_ID_PREFIX}-${refractionKey(shape)}`;
}

/** One SVG element of a filter, as data: the DOM side creates it. */
export interface FilterNode {
  tag: 'filter' | 'feImage' | 'feDisplacementMap' | 'feColorMatrix' | 'feComposite';
  attrs: Record<string, string>;
  children?: FilterNode[];
}

// The glare: the blue channel of the map becomes white with that alpha, then
// brightens what is under it in proportion (k1) and adds a little light (k3),
// so dark content is lifted less than light content, as glass does.
const GLARE_GAIN = 0.65;
const GLARE_ADD = 0.1;

/**
 * The filter for a shape, as data. User space units in CSS px of the part's
 * own box (its layout box, before any transform), the map stretched over it,
 * sRGB so the channel values are used as written.
 */
export function refractionFilter(shape: RefractionShape, options: RefractionOptions = {}): { id: string; node: FilterNode; map: RefractionMap; href: string } {
  const w = Math.round(shape.width);
  const h = Math.round(shape.height);
  const exact = { width: w, height: h, radius: shape.radius };
  const map = buildRefractionMap(exact, options);
  const href = refractionMapUrl(map);
  const id = refractionId(exact);
  const size = { x: '0', y: '0', width: String(w), height: String(h) };
  const node: FilterNode = {
    tag: 'filter',
    attrs: { id, ...size, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' },
    children: [
      { tag: 'feImage', attrs: { href, ...size, preserveAspectRatio: 'none', result: 'map' } },
      { tag: 'feDisplacementMap', attrs: { in: 'SourceGraphic', in2: 'map', scale: String(map.scale), xChannelSelector: 'R', yChannelSelector: 'G', result: 'bent' } },
      { tag: 'feColorMatrix', attrs: { in: 'map', type: 'matrix', values: '0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 1 0 0', result: 'glare' } },
      { tag: 'feComposite', attrs: { in: 'bent', in2: 'glare', operator: 'arithmetic', k1: String(GLARE_GAIN), k2: '1', k3: String(GLARE_ADD), k4: '0' } },
    ],
  };
  return { id, node, map, href };
}

/**
 * What the probe reads. Every field is optional, so a test or a server can
 * pass a partial record; the shapes match `CSS` and `navigator`.
 */
export interface RefractionEnv {
  css?: { supports?: ((property: string, value: string) => boolean) | null; paintWorklet?: unknown } | null;
  navigator?: { userAgentData?: unknown } | null;
}

/**
 * True when this browser paints an SVG filter in `backdrop-filter`, which only
 * Chromium does. Safari parses `backdrop-filter: url(#id)` and paints nothing
 * for it (WebKit bug 245510), and Firefox does not run SVG filters there
 * (Mozilla bug 1808785), so `@supports` cannot tell them apart. The probe asks
 * for two things only Chromium's engine has, read as objects and never from
 * the user agent string:
 *
 * - `CSS.paintWorklet`, the CSS paint API: Chromium 65 and later; not in
 *   Safari, Safari on iOS (every browser there) or Firefox.
 * - `navigator.userAgentData`, the client hints object: Chromium 90 and
 *   later; not in Safari, Safari on iOS or Firefox.
 *
 * and that `backdrop-filter` takes a `url()` at all. A browser that gains one
 * of the two without the filter still fails the other; a browser that lacks
 * either keeps the CSS only glass, which is the safe side.
 */
export function refractionSupported(env: RefractionEnv | null | undefined): boolean {
  const css = env?.css;
  if (!css || typeof css.supports !== 'function') return false;
  if (!('paintWorklet' in css) || css.paintWorklet == null) return false;
  const data = env?.navigator?.userAgentData;
  if (typeof data !== 'object' || data === null) return false;
  try {
    return css.supports('backdrop-filter', 'url(#a)');
  } catch {
    return false;
  }
}

/** Reads the probe's inputs from a window. Call it after mount, never at module scope. Without one it gives `{}`, which probes false. */
export function refractionEnvOf(win: unknown): RefractionEnv {
  if (typeof win !== 'object' || win === null) return {};
  const w = win as { CSS?: RefractionEnv['css']; navigator?: RefractionEnv['navigator'] };
  return { css: w.CSS ?? null, navigator: w.navigator ?? null };
}
