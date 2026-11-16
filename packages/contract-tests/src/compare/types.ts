// Types of the compare harness (order R0.7, plan section 3 of
// docs/plan/reset.md). A pair file in ./pairs/<id>.json names a source screen,
// a system screen, the regions to crop on each side and the properties to
// probe in each region. pair.schema.json is the same shape as JSON Schema.

/** The source repos the harness can run. */
export type SourceRepo = 'gb' | 'fk2';

/** How big a thing is, which picks the box tolerance (control or part 1px, screen region 2px). */
export type RegionKind = 'control' | 'part' | 'region';

/**
 * One step run on a page before it is probed. Selectors here are Playwright
 * selectors (CSS, or `role=button[name="Share canvas"]`), so a step can name
 * an element by its accessible name.
 */
export interface Step {
  click?: string;
  hover?: string;
  focus?: string;
  /** A key for page.keyboard.press, for example "Escape". */
  press?: string;
  /** Waits until this selector is visible. */
  wait?: string;
  /** Waits this many milliseconds. */
  waitMs?: number;
  /** Sets (value a string) or removes (value null) an attribute on the first match. */
  attr?: { selector: string; name: string; value: string | null };
}

export interface SourceSide {
  repo: SourceRepo;
  /** Path on the source server, for example "/__design?theme=dark&dir=ltr". */
  screen: string;
  /** How a person reaches the same screen in the source, in plain words. */
  how: string;
  /** True when the source screen is assembled by the harness from source parts, not captured from the running app. */
  reconstruction: boolean;
  setup?: Step[];
}

export interface SystemSide {
  /** Path on the React gallery, for example "/c/button?style=desk&scheme=dark&dir=ltr&lang=en&chrome=0". */
  url: string;
  setup?: Step[];
}

/**
 * One probed property. The short form is a property name read on the region
 * root itself. The long form reads it on an element inside the region (a CSS
 * selector relative to the region root on each side), on a pseudo element, or
 * counts matches. A side set to null means the part does not exist there on
 * purpose, and its value reads "absent".
 */
export interface ProbeSpec {
  /** The row name in the table. */
  id: string;
  /** A computed style property, a box metric (width, height, x, y) or "count". */
  property: string;
  source?: string | null;
  system?: string | null;
  /** For example "::backdrop", on both sides or per side. Read with getComputedStyle(el, pseudo). */
  pseudo?: string | { source?: string; system?: string };
  /** Overrides the region kind for the box tolerance of this probe. */
  kind?: RegionKind;
}

export interface PixelSpec {
  /** Paints the boxes of text runs, images, SVG, canvas and video on both crops before the diff. Default true. */
  maskText?: boolean;
  /** Extra selectors (relative to the region root) to mask on each side. */
  mask?: { source?: string[]; system?: string[] };
  /** A glass region: its pixels are not compared at all (blur differs on a software GPU); its CSS is. */
  glass?: boolean;
}

export interface Region {
  id: string;
  kind: RegionKind;
  /** CSS selector of the region root on the source page. The first visible match counts, or the nth with `nth`. */
  source: string;
  system: string;
  nth?: { source?: number; system?: number };
  probes: (string | ProbeSpec)[];
  /** False leaves the region out of the sheet (a full screen scrim, say). Default true. */
  crop?: boolean;
  /** Compare pixels of the two crops (template regions). */
  pixels?: PixelSpec;
}

export interface Allowed {
  region: string;
  /** The probe id (the property name for the short form). */
  probe: string;
  reason: string;
}

export interface Tolerance {
  /** Box size and position of a control or part, px. */
  controlBox: number;
  /** Box size and position of a screen region, px. */
  regionBox: number;
  /** Colour difference, Delta E 2000 after compositing on black and on white. */
  deltaE: number;
  /** Radius and border width: equal, within float noise, px. */
  lengthEqual: number;
  /** Line height, px. */
  lineHeight: number;
  /** Letter spacing, em. */
  letterSpacingEm: number;
  /** Duration: the larger of these two. */
  durationMs: number;
  durationRatio: number;
  /** Travel, px. */
  travel: number;
  /** Scale. */
  scale: number;
  /** Easing: each control point. */
  easing: number;
  /** Share of a region's pixels that may differ. */
  pixelShare: number;
  /** pixelmatch threshold. */
  pixelThreshold: number;
}

export interface PairFile {
  id: string;
  title: string;
  /** The audit finding this pair answers. */
  audit: { file: string; shot: string; finding: string };
  source: SourceSide;
  system: SystemSide;
  viewport: { width: number; height: number };
  scheme: 'dark' | 'light';
  /** Default "no-preference": animations run, and the harness waits for them to end before probing. */
  reducedMotion?: 'reduce' | 'no-preference';
  tolerance: { profile: 'default'; tighten?: Partial<Tolerance> };
  regions: Region[];
  allowed: Allowed[];
}

export type Status = 'pass' | 'fail' | 'allowed';

export interface Row {
  region: string;
  probe: string;
  property: string;
  source: string;
  system: string;
  difference: string;
  tolerance: string;
  status: Status;
  note?: string;
}

/** What the page probe returns for one side of one region. */
export interface SideProbe {
  found: boolean;
  rect: { x: number; y: number; width: number; height: number };
  values: Record<string, string>;
}
