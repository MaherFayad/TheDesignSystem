// Types shared by the perception gate: the interaction catalog, what the
// in-page sampler records on every frame, and what the analysis reports.

export type Gesture = 'tap' | 'hold' | 'long-press' | 'drag';
export type Profile = 'rich' | 'quiet';
export type Device = 'pixel' | 'iphone';
/** The gallery's platform key; `auto` leaves it out so the page detects the device. */
export type PlatformArg = 'auto' | 'web' | 'ios' | 'android' | 'macos';

/** One interaction of the catalog: where it lives, what the finger does and what to watch. */
export interface Interaction {
  /** The id used on the command line, usually the gallery slug. */
  id: string;
  /** The gallery slug of `/c/<slug>`. */
  slug: string;
  /** The component name as a person says it. */
  name: string;
  /** What the finger does, in words, for the report. */
  does: string;
  gesture: Gesture;
  /** How long the finger stays down, in ms. Tap 90, long press 900. */
  holdMs?: number;
  /** For a drag: the step of each move in CSS px along x. */
  dragStep?: number;
  /** One demo case of the page, so other cases do not take the tap. */
  case?: string;
  /** What the finger lands on: a selector, optionally narrowed by its exact text. */
  target: { selector: string; text?: string; nth?: number };
  /** Where the finger lands inside the target, as a share of its box; default the centre. */
  at?: { x: number; y: number };
  /** The component root, as a selector the target is inside; default the closest `[data-ds]`. */
  root?: string;
  /** Surfaces that open from the interaction, searched in the whole document. */
  overlay?: string;
  /**
   * The headline part: `root` for the component root, a selector inside the
   * root, or a selector in the whole document when `headlineIn` is `document`.
   */
  headline: string;
  headlineIn?: 'root' | 'document';
  /** True when the interaction is a press on something pressable, so a held press is measured too. */
  pressable?: boolean;
}

/** What the sampler reads of one element on one frame. Lengths in CSS px. */
export interface Snap {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Own opacity. */
  o: number;
  /** Opacity times every ancestor's opacity. */
  eo: number;
  /** Area inside the viewport times the effective opacity; 0 when hidden. */
  va: number;
  tf: string;
  bg: string;
  c: string;
  bc: string;
  bs: string;
  cp: string;
  f: string;
  bf: string;
  /** 1 when the element paints something itself: a fill, border, shadow, backdrop, text, image or icon. */
  p: number;
}

export interface ElementMeta {
  id: number;
  /** tag/part[role] or tag ds, for the report. */
  desc: string;
  tag: string;
  part: string | null;
  ds: string | null;
  role: string | null;
  group: 'root' | 'overlay';
  /** The nearest tracked ancestor. */
  parent: number | null;
}

export interface Frame {
  /** performance.now() at the frame, in ms. */
  t: number;
  /** The headline element's id on this frame, when it exists. */
  h: number | null;
  els: Record<number, Snap>;
}

export interface AnimationRecord {
  /** The tracked element it runs on, or null. */
  el: number | null;
  target: string;
  type: string;
  name: string;
  props: string[];
  duration: number;
  delay: number;
  easing: string;
  /** The easing of the first keyframe, where CSS animations keep it. */
  keyEasing: string;
  iterations: number;
  firstSeen: number;
}

export interface Recording {
  frames: Frame[];
  meta: Record<number, ElementMeta>;
  events: [string, number][];
  animations: AnimationRecord[];
  viewport: { width: number; height: number };
  scheme: 'light' | 'dark';
  /** True when an ARIA or data state of the component changed (checked, pressed, open); a hover look changes none. */
  stateChanged?: boolean;
}

/** One element's change over the recording. Times in ms after pointerdown. */
export interface Track {
  id: number;
  desc: string;
  part: string | null;
  group: 'root' | 'overlay';
  parent: number | null;
  /** Ids merged into this track when a part was replaced by a new node at the same place. */
  merged: number[];
  existedBefore: boolean;
  existsAtEnd: boolean;
  /** Changing before the finger landed (a spinner, a running entrance): left out of the verdict. */
  preMoving: boolean;
  changed: boolean;
  start: number | null;
  end: number | null;
  /** From the first change to 90 percent of the largest change. */
  inMs: number | null;
  totalMs: number | null;
  /** Largest move of the centre from where it rests or ends. */
  travel: number;
  /** Largest move of the start edge (left in a left to right page), which a slide that also stretches moves further. */
  edgeTravel: number;
  /** The same, measured against the nearest tracked ancestor, so a move it only inherits is not counted. */
  ownTravel: number;
  /** Largest change of the drawn width or height, in px. */
  sizeChange: number;
  scaleMin: number;
  scaleMax: number;
  opacityMin: number;
  opacityMax: number;
  /** Largest colour difference (Delta E 2000) of fill, text or border from rest or end. */
  colourDelta: number;
  /** The same for the fill only. */
  fillDelta: number;
  ownStyleChanged: boolean;
  clipChanged: boolean;
  filterChanged: boolean;
  shadowChanged: boolean;
  /** The largest visible area it reached, in px squared. */
  areaMax: number;
  /** Whole change in one frame: a jump, an appearance or a disappearance. */
  cut: null | { kind: 'jump' | 'appear' | 'disappear' | 'colour'; at: number; size: number };
  /** A one frame change that came with a dropped frame (a gap of 50ms or more): load, not design. */
  dropped: null | { at: number; gapMs: number };
  animations: AnimationRecord[];
}

export interface Measured {
  pointerdown: number | null;
  pointerup: number | null;
  click: number | null;
  /** How long the finger was down as the page saw it (pointerup less pointerdown); under load it can differ from the gesture asked. */
  fingerMs: number | null;
  /** Time from pointerdown to the first visual change anywhere in the component or what it opened. */
  latency: number | null;
  /** True when the first change came at or after the finger lifted. */
  startsAtRelease: boolean;
  /** True when the first change came after the click and no state changed: emulated hover. */
  afterClick: boolean;
  /** Frames 50ms or more apart after the finger landed. */
  droppedFrames: number;
  frameMs: number;
  frames: number;
  headline: Track | null;
  /** The main change of the headline, in ms: its first animation, else the frames. */
  mainMs: number | null;
  mainSource: 'animation' | 'frames' | null;
  mainEasing: string | null;
  /** Share of the component's area whose fill changes visibly. */
  fillShare: number;
  /** Share of the control's area whose content fades in or out by itself (the headline and its parts). */
  fadeShare: number;
  /** How long the longest of those fades takes, in ms. */
  fadeMs: number;
  secondaries: Track[];
  cuts: Track[];
  /** Changes that carry meaning and finish under 150ms or move under 3px. */
  tooShortOrSmall: { track: Track; why: string }[];
  tracks: Track[];
  rootArea: number;
}

export interface Check {
  id: string;
  label: string;
  pass: boolean;
  measured: string;
  limit: string;
}

/** A hold of the finger: how long the press look stays on while the finger is down. */
export interface HoldResult {
  holdMs: number;
  /** First change after pointerdown, or null when nothing changed while held. */
  onAfter: number | null;
  /** How long a change from rest was shown while the finger was down, in ms. */
  shownMs: number;
  /** The part of the hold, after the first 32ms, that showed the press. */
  share: number;
}

export interface InteractionResult {
  id: string;
  name: string;
  does: string;
  style: string;
  platform: string;
  detectedPlatform: string | null;
  device: Device;
  profile: Profile;
  gesture: Gesture;
  holdMs: number;
  measured: Measured | null;
  hold: HoldResult | null;
  checks: Check[];
  pass: boolean;
  /** The audit's word for it: fine, invisible or wrong. */
  call: 'fine' | 'invisible' | 'wrong' | null;
  callWhy: string;
  /** Plain sentences a person can picture. */
  sentences: string[];
  error?: string;
}
