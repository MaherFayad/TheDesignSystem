// The frames of the iOS test screens (order M10.0, docs/plan/reset-ios-families.md
// section 5). A frame is a drawn device, and a variant of it is one
// orientation in one mode:
//
// - phone: 393 by 852, portrait, full screen.
// - duo-outer: the folding iPhone's outer screen, 466 by 678 full screen, or
//   382 by 580 in Safari.
// - duo-inner: the inner screen, 669 by 951 in portrait and 951 by 669 in
//   landscape.
//
// The folding iPhone's numbers are the point sizes of the /platforms/duo
// page (Duo.tsx, order DU3). Duo.tsx does not export its geometry, so the
// numbers are repeated here; when it does, this file should import them.
// Every rectangle is in points, physical: x from the left edge, y from the top.

/** The frame ids of the URL key `frame`. */
export const FRAME_IDS = ['phone', 'duo-outer', 'duo-inner'] as const;
export type FrameId = (typeof FRAME_IDS)[number];

export const ORIENTS = ['portrait', 'landscape'] as const;
export type Orient = (typeof ORIENTS)[number];

/** full: the app has the whole screen, as a native app. safari: the page Safari gives. */
export const MODES = ['full', 'safari'] as const;
export type Mode = (typeof MODES)[number];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Safe area insets in points, physical sides. */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** One device drawing: a frame in one orientation and one mode. */
export interface FrameVariant {
  /** Unique, used in file names: phone, duo-outer-portrait-full and so on. */
  key: string;
  frame: FrameId;
  orient: Orient;
  mode: Mode;
  /** English, for the gallery and the captions. */
  name: string;
  /** The whole screen in points. */
  w: number;
  h: number;
  /** The rectangle the app draws in: the whole screen, or Safari's page. */
  page: Rect;
  /** The safe area insets the screen sets in full screen mode (zero in Safari). */
  insets: Insets;
  /** The square corner on the hinge side of the outer screen. */
  hinge?: 'left' | 'top';
  /** The camera, a plain shape: a dot on the folding iPhone, a pill on the phone. Centre in points. */
  camera: { x: number; y: number; shape: 'dot' | 'pill'; faint: boolean };
  /** Safari's own chrome, drawn as inert shapes. */
  chrome: { kind: 'bar' | 'column'; rect: Rect }[];
  /** A thin bar at the bottom of the screen, drawn over the app (the phone in full screen). */
  homeBar: boolean;
}

const NONE: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

/*
 * The phone: 393 by 852. The insets are a proposal for a phone with a camera
 * pill at the top: 59 points over the content, 34 under it. The camera pill
 * is our own plain shape, 126 by 37, 11 points from the top.
 */
const phone: FrameVariant = {
  key: 'phone',
  frame: 'phone',
  orient: 'portrait',
  mode: 'full',
  name: 'Phone',
  w: 393,
  h: 852,
  page: { x: 0, y: 0, w: 393, h: 852 },
  insets: { top: 59, right: 0, bottom: 34, left: 0 },
  camera: { x: 196.5, y: 29.5, shape: 'pill', faint: false },
  chrome: [],
  homeBar: true,
};

interface DuoGeometry {
  frame: 'duo-outer' | 'duo-inner';
  orient: Orient;
  name: string;
  w: number;
  h: number;
  hinge?: 'left' | 'top';
  camera: { x: number; y: number; faint: boolean };
  safariPage: Rect;
  safariChrome: { kind: 'bar' | 'column'; rect: Rect }[];
  fullInsets: Insets;
}

/* The same numbers as Duo.tsx: outerPortrait, outerLandscape, innerPortrait, innerLandscape. */
const duo: readonly DuoGeometry[] = [
  {
    frame: 'duo-outer',
    orient: 'portrait',
    name: 'Folding iPhone, outer screen',
    w: 466,
    h: 678,
    hinge: 'left',
    camera: { x: 424, y: 46, faint: false },
    safariPage: { x: 0, y: 60, w: 382, h: 580 },
    safariChrome: [
      { kind: 'bar', rect: { x: 0, y: 0, w: 382, h: 60 } },
      { kind: 'bar', rect: { x: 0, y: 640, w: 382, h: 38 } },
      { kind: 'column', rect: { x: 382, y: 0, w: 84, h: 678 } },
    ],
    fullInsets: { top: 0, right: 84, bottom: 0, left: 0 },
  },
  {
    frame: 'duo-outer',
    orient: 'landscape',
    name: 'Folding iPhone, outer screen',
    w: 678,
    h: 466,
    hinge: 'top',
    camera: { x: 636, y: 420, faint: false },
    safariPage: { x: 0, y: 60, w: 594, h: 368 },
    safariChrome: [
      { kind: 'bar', rect: { x: 0, y: 0, w: 594, h: 60 } },
      { kind: 'bar', rect: { x: 0, y: 428, w: 594, h: 38 } },
      { kind: 'column', rect: { x: 594, y: 0, w: 84, h: 466 } },
    ],
    fullInsets: { top: 0, right: 84, bottom: 0, left: 0 },
  },
  {
    frame: 'duo-inner',
    orient: 'portrait',
    name: 'Folding iPhone, inner screen',
    w: 669,
    h: 951,
    camera: { x: 602, y: 42, faint: true },
    safariPage: { x: 0, y: 84, w: 669, h: 867 },
    safariChrome: [{ kind: 'bar', rect: { x: 0, y: 0, w: 669, h: 84 } }],
    fullInsets: { top: 24, right: 0, bottom: 20, left: 0 },
  },
  {
    frame: 'duo-inner',
    orient: 'landscape',
    name: 'Folding iPhone, inner screen',
    w: 951,
    h: 669,
    camera: { x: 909, y: 60, faint: true },
    safariPage: { x: 0, y: 84, w: 951, h: 585 },
    safariChrome: [{ kind: 'bar', rect: { x: 0, y: 0, w: 951, h: 84 } }],
    fullInsets: { top: 0, right: 84, bottom: 20, left: 0 },
  },
];

function duoVariant(g: DuoGeometry, mode: Mode): FrameVariant {
  const full = mode === 'full';
  return {
    key: `${g.frame}-${g.orient}-${mode}`,
    frame: g.frame,
    orient: g.orient,
    mode,
    name: `${g.name}, ${g.orient}, ${full ? 'full screen' : 'in Safari'}`,
    w: g.w,
    h: g.h,
    page: full ? { x: 0, y: 0, w: g.w, h: g.h } : g.safariPage,
    insets: full ? g.fullInsets : NONE,
    hinge: g.hinge,
    camera: { ...g.camera, shape: 'dot' },
    chrome: full ? [] : g.safariChrome,
    homeBar: false,
  };
}

/** Every variant the host can draw. */
export const VARIANTS: readonly FrameVariant[] = [phone, ...duo.flatMap((g) => MODES.map((m) => duoVariant(g, m)))];

/**
 * The set every screen is shown in when the URL names no frame, and the set
 * the capture script saves: the phone, the outer screen full screen and in
 * Safari, the inner screen in portrait and in landscape (plan section 5).
 */
export const DEFAULT_VARIANT_KEYS = ['phone', 'duo-outer-portrait-full', 'duo-outer-portrait-safari', 'duo-inner-portrait-full', 'duo-inner-landscape-full'] as const;

export const DEFAULT_VARIANTS: readonly FrameVariant[] = DEFAULT_VARIANT_KEYS.map((k) => variantByKey(k) ?? phone);

export function variantByKey(key: string): FrameVariant | undefined {
  return VARIANTS.find((v) => v.key === key);
}

function oneOf<T extends string>(value: string | null, values: readonly T[]): T | undefined {
  return values.includes(value as T) ? (value as T) : undefined;
}

/**
 * The variant the URL keys ask for: `frame`, then `orient` (default
 * portrait) and `mode` (default full). The phone has one variant, so
 * `orient` and `mode` are ignored there. No `frame`: undefined.
 */
export function readVariant(params: URLSearchParams): FrameVariant | undefined {
  const frame = oneOf(params.get('frame'), FRAME_IDS);
  if (!frame) return undefined;
  if (frame === 'phone') return phone;
  const orient = oneOf(params.get('orient'), ORIENTS) ?? 'portrait';
  const mode = oneOf(params.get('mode'), MODES) ?? 'full';
  return VARIANTS.find((v) => v.frame === frame && v.orient === orient && v.mode === mode) ?? phone;
}

/** The URL keys of a variant, in the order of the route. */
export function variantQuery(v: FrameVariant): Record<string, string> {
  return v.frame === 'phone' ? { frame: 'phone' } : { frame: v.frame, orient: v.orient, mode: v.mode };
}
