// Types of the recording pack (order R0.9, plan section 3 of
// docs/plan/reset.md, "Recording pack"). A pack is a set of clips for one
// order: each clip is one interaction, in one style, platform, phone frame
// and colour scheme, recorded frame by frame at 60 frames a second on the
// page's own clock and played back at real speed.
import type { Device, PlatformArg } from '../perceive/types';
import type { Step } from '../compare/types';

/** Where a finger lands: an element and a point inside its box. */
export interface Aim {
  /** A CSS selector. */
  selector: string;
  /** Narrows the matches to the ones whose text contains this. */
  text?: string;
  /** Which match, default the first. */
  nth?: number;
  /** The point inside the box, as a share of its width and height; default the centre. */
  at?: { x: number; y: number };
  /** Search the whole document, not only the demo case. Default false. */
  inDocument?: boolean;
}

/**
 * Where a drag goes. `dx`/`dy` in CSS px, or `towards` an attribute that
 * names a direction on an element (a toast's `data-swipe-direction`), so a
 * swipe follows what the platform asks for.
 */
export type Path =
  | { dx: number; dy: number }
  | { towards: { selector: string; attribute: string }; distance: number };

/** One finger stroke: down at a point, optionally moved, held, lifted. */
export interface Stroke {
  aim: Aim;
  /** How long the finger stays down before it moves, or in all for a tap. Default 90. */
  holdMs?: number;
  /** A drag: where it goes. The finger moves once a frame. */
  path?: Path;
  /** How long the move takes, in ms. Default 250. */
  moveMs?: number;
  /** How long the finger rests at the end of a drag before it lifts. Default 0. */
  restMs?: number;
  /** Time after the lift before the next stroke, in ms. Default 900. */
  pauseAfterMs?: number;
}

/** What the source side of a clip records, where a compare pair exists. */
export interface SourceClip {
  /** A pair id in ../compare/pairs. The source screen, its setup and the viewport come from it. */
  pair: string;
  /** Where the finger lands on the source screen. */
  strokes: Stroke[];
}

/** One interaction a clip can show. */
export interface ClipDef {
  id: string;
  /** As a person says it: "Button press". */
  name: string;
  /** The gallery slug of /c/<slug>. */
  slug: string;
  /** The demo case the finger works in. */
  case?: string;
  /** What the finger does, in words, for the caption. */
  does: string;
  /** Taps and steps run before the clip starts (opening the sheet that is then dragged). Not recorded. */
  setup?: (Stroke | Step)[];
  /** Waits for this selector to be visible after the setup. */
  ready?: string;
  strokes: Stroke[];
  /** Why this clip cannot be driven in headless Chromium, when it cannot. The index says so instead of a clip. */
  cannot?: string;
  source?: SourceClip;
}

/** A pack file, ./packs/<order id>.json. */
export interface PackFile {
  order: string;
  title: string;
  /** Clip ids from ./clips.ts. */
  clips: string[];
  styles: string[];
  platforms: PlatformArg[];
  devices: Device[];
  schemes: ('light' | 'dark')[];
  /** Plain words for the index and the sign sheet. */
  note?: string;
  /** A question the owner answers once for the whole pack (the format approval of the sample pack). */
  ask?: string;
  /** Steps for the owner's phone, when the order needs a device check (plan section 3). */
  device?: { needed: boolean; why: string; steps: string[] };
}

/** One frame of a recording: what the finger did and what the screen was. */
export interface FrameInfo {
  /** Frame number from 0; time is index * 1000 / 60 ms. */
  index: number;
  finger: 'up' | 'down';
  /** The finger point in CSS px of the viewport, while down and on the frame it lifts. */
  x: number | null;
  y: number | null;
  /** ms since the finger went down, while it is down. */
  downFor: number | null;
  /** ms since the finger last lifted, while it is up after a stroke. */
  upFor: number | null;
  /** True on the frame the finger went down or lifted. */
  edge: 'down' | 'up' | null;
  /** A hash of the screen pixels, to find when the screen settles. */
  hash: string;
}

/** The moments a contact sheet shows, as frame numbers. */
export interface KeyFrames {
  down: number;
  mid: number;
  up: number;
  settled: number;
}

export interface ClipResult {
  /** File stem: <clip>-<style>-<platform>-<device>-<scheme>. */
  key: string;
  clip: string;
  name: string;
  does: string;
  style: string;
  platform: PlatformArg;
  detected: string | null;
  device: Device;
  deviceName: string;
  scheme: 'light' | 'dark';
  /** Paths relative to the pack folder. */
  video: string | null;
  sheet: string | null;
  /** The source clip beside this one, when a pair exists. */
  source: { pair: string; video: string | null; sheet: string | null; note: string } | null;
  frames: number;
  durationMs: number;
  keyFrames: KeyFrames | null;
  /** When the screen first changed after the first finger down, in ms after it, and whether the finger was still down. */
  firstChange: { afterDownMs: number; whileDown: boolean } | null;
  bytes: { video: number; sheet: number };
  /** Set when the clip could not be recorded honestly. */
  cannot?: string;
  error?: string;
}

export interface PackResult {
  order: string;
  title: string;
  date: string;
  commit: string;
  load: number[];
  cpus: number;
  chromium: string;
  clips: ClipResult[];
  note?: string;
}
