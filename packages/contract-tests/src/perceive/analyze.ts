// Turns a recording (every frame of every tracked element) into numbers a
// person can picture: when the first visible change came after the finger
// landed, how far the headline part moved, how much it grew or shrank, how
// long its main change took, which other elements reacted, and which changes
// happened in a single frame (a cut). Pure functions; the unit tests feed them
// synthetic recordings.
import { differenceCiede2000, parse, rgb } from 'culori';
import type { AnimationRecord, ElementMeta, Frame, HoldResult, Measured, Recording, Snap, Track } from './types';

/** Smallest changes the sampler counts, below what rounding of a drawn box gives. */
export const EPS = { px: 0.25, opacity: 0.01, area: 0.02 } as const;

/** Thresholds the analysis itself uses (the profiles hold the pass limits). */
export const NOTICE = {
  /** A secondary element reacts when it moves or resizes this much, in px. */
  movePx: 3,
  /** Or changes its own opacity this much. */
  opacity: 0.3,
  /** Or changes colour by this Delta E 2000. */
  colour: 10,
  /** And its change lasts this long; a one frame cut is not read as a reaction. */
  minMs: 50,
  /** A jump or an appearance in one frame counts as a cut from this size up. */
  jumpPx: 8,
  cutArea: 400,
  /** A change that carries meaning: anything at least this visible. */
  visibleColour: 5,
  visibleOpacity: 0.1,
  visiblePx: 0.5,
} as const;

const deCache = new Map<string, number>();
const de = differenceCiede2000();

/** Delta E 2000 between two CSS colours, each composited on the page backdrop. */
export function colourDistance(a: string, b: string, scheme: 'light' | 'dark' = 'light'): number {
  if (a === b) return 0;
  const key = `${scheme}|${a}|${b}`;
  const hit = deCache.get(key);
  if (hit !== undefined) return hit;
  const back = scheme === 'dark' ? 0 : 1;
  const flat = (s: string) => {
    const c = parse(s);
    if (!c) return null;
    const v = rgb(c);
    if (!v) return null;
    const al = v.alpha ?? 1;
    return { mode: 'rgb' as const, r: v.r * al + back * (1 - al), g: v.g * al + back * (1 - al), b: v.b * al + back * (1 - al) };
  };
  const x = flat(a);
  const y = flat(b);
  const d = x && y ? de(x, y) : a === b ? 0 : 100;
  deCache.set(key, d);
  return d;
}

const centre = (s: Snap) => ({ x: s.x + s.w / 2, y: s.y + s.h / 2 });
const shown = (s: Snap | undefined): s is Snap => !!s && (s.w > 0 || s.h > 0);
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const STYLE_KEYS = ['tf', 'o', 'bg', 'c', 'bc', 'bs', 'cp', 'f', 'bf'] as const;

/** True when two snapshots of one element differ visibly. */
export function snapDiffers(a: Snap | undefined, b: Snap | undefined): boolean {
  if (!a && !b) return false;
  if (!a || !b) {
    const one = (a ?? b) as Snap;
    return one.va > 0 && one.p !== 0;
  }
  if (Math.max(a.va, b.va) <= 0) return false;
  if (a.p === 0 && b.p === 0) return false;
  if (Math.abs(a.x - b.x) > EPS.px || Math.abs(a.y - b.y) > EPS.px || Math.abs(a.w - b.w) > EPS.px || Math.abs(a.h - b.h) > EPS.px) return true;
  if (Math.abs(a.eo - b.eo) > EPS.opacity) return true;
  const big = Math.max(a.va, b.va);
  if (big > 0 && Math.abs(a.va - b.va) / big > EPS.area) return true;
  return STYLE_KEYS.some((k) => k !== 'o' && a[k] !== b[k]);
}

function median(xs: number[]): number {
  if (xs.length === 0) return 16.7;
  const s = [...xs].sort((p, q) => p - q);
  return s[Math.floor(s.length / 2)] ?? 16.7;
}

export function eventTime(rec: Recording, type: string): number | null {
  const e = rec.events.find(([t]) => t === type);
  return e ? e[1] : null;
}

/** The moment the finger landed: pointerdown, else touchstart, else the first frame. */
export function fingerDown(rec: Recording): number {
  return eventTime(rec, 'pointerdown') ?? eventTime(rec, 'touchstart') ?? rec.frames[0]?.t ?? 0;
}

/**
 * Series of snapshots per element, one entry per frame. A part that React
 * replaced by a new node at the same moment (same tag, part, ds and role;
 * the old one gone on the frame the new one appears) continues the old
 * series, so a slide done by moving a fresh node still reads as one move.
 */
export function buildSeries(rec: Recording): { series: Map<number, (Snap | undefined)[]>; merged: Map<number, number[]> } {
  const n = rec.frames.length;
  const first = new Map<number, number>();
  const last = new Map<number, number>();
  rec.frames.forEach((f, i) => {
    for (const k of Object.keys(f.els)) {
      const id = Number(k);
      if (!first.has(id)) first.set(id, i);
      last.set(id, i);
    }
  });
  const sig = (m: ElementMeta | undefined) => (m ? `${m.tag}|${m.part}|${m.ds}|${m.role}` : '');
  const owner = new Map<number, number>();
  const merged = new Map<number, number[]>();
  const ids = [...first.keys()].sort((a, b) => (first.get(a) ?? 0) - (first.get(b) ?? 0) || a - b);
  const taken = new Set<number>();
  for (const id of ids) {
    const f = first.get(id) ?? 0;
    let into = id;
    if (f > 0) {
      const m = rec.meta[id];
      const cand = ids.find((o) => o !== id && !taken.has(o) && owner.get(o) === o && last.get(o) === f - 1 && sig(rec.meta[o]) === sig(m) && (m?.part ?? null) !== null);
      if (cand !== undefined) {
        into = cand;
        taken.add(cand);
        merged.get(cand)?.push(id);
      }
    }
    owner.set(id, into);
    if (into === id) merged.set(id, []);
  }
  const series = new Map<number, (Snap | undefined)[]>();
  for (const id of ids) {
    const o = owner.get(id) ?? id;
    if (!series.has(o)) series.set(o, new Array<Snap | undefined>(n).fill(undefined));
  }
  rec.frames.forEach((f, i) => {
    for (const [k, s] of Object.entries(f.els)) {
      const o = owner.get(Number(k)) ?? Number(k);
      const arr = series.get(o);
      if (arr) arr[i] = s;
    }
  });
  // Follow chains: a merged id that later merged again.
  for (const [o, list] of merged) {
    for (const id of [...list]) for (const more of merged.get(id) ?? []) list.push(more);
    merged.set(o, list);
  }
  return { series, merged };
}

interface TrackInput {
  id: number;
  meta: ElementMeta | undefined;
  s: (Snap | undefined)[];
  parentSeries: (Snap | undefined)[] | null;
  frames: Frame[];
  t0: number;
  frameMs: number;
  scheme: 'light' | 'dark';
  animations: AnimationRecord[];
  /** Animations of the tracked ancestors: an element carried in by an animating parent does not cut. */
  ancestorAnimations?: AnimationRecord[];
  merged: number[];
}

/** A frame step this long means the page dropped frames. */
export const DROPPED_MS = 50;

export function buildTrack(inp: TrackInput): Track {
  const { s, frames, t0, frameMs, scheme } = inp;
  const n = frames.length;
  const iDown = Math.max(0, frames.findIndex((f) => f.t >= t0));
  const before = iDown > 0 ? iDown - 1 : 0;
  const rest = s[before];
  const end = s[n - 1];
  const existedBefore = iDown > 0 && !!rest && rest.va > 0;
  const existsAtEnd = !!end && end.va > 0;
  let preMoving = false;
  for (let i = 1; i < iDown; i += 1) if (snapDiffers(s[i - 1], s[i])) preMoving = true;
  const changes: number[] = [];
  for (let i = Math.max(1, iDown); i < n; i += 1) if (snapDiffers(s[i - 1], s[i])) changes.push(i);
  const restC = shown(rest) && existedBefore ? centre(rest) : null;
  const endC = shown(end) && existsAtEnd ? centre(end) : null;
  const refW = shown(end) && existsAtEnd && end.w > 0 ? end.w : shown(rest) ? rest.w : 0;
  const parentRef = (() => {
    const ps = inp.parentSeries;
    if (!ps) return null;
    const pe = ps[n - 1];
    const pr = ps[before];
    return shown(pe) && pe.w > 0 ? pe.w : shown(pr) ? pr.w : null;
  })();
  const relCentre = (i: number) => {
    const me = s[i];
    if (!shown(me)) return null;
    const c = centre(me);
    const ps = inp.parentSeries;
    if (!ps || !parentRef) return c;
    const p = ps[i];
    if (!shown(p)) return null;
    const k = p.w > 0 ? p.w / parentRef : 1;
    return { x: (c.x - p.x) / k, y: (c.y - p.y) / k };
  };
  const relEdge = (i: number) => {
    const me = s[i];
    if (!shown(me)) return null;
    const ps = inp.parentSeries;
    if (!ps || !parentRef) return { x: me.x, y: me.y };
    const p = ps[i];
    if (!shown(p)) return null;
    const k = p.w > 0 ? p.w / parentRef : 1;
    return { x: (me.x - p.x) / k, y: (me.y - p.y) / k };
  };
  const relRest = existedBefore ? relCentre(before) : null;
  const relEnd = existsAtEnd ? relCentre(n - 1) : null;

  let travel = 0;
  let edgeTravel = 0;
  let ownTravel = 0;
  let sizeChange = 0;
  let scaleMin = 1;
  let scaleMax = 1;
  let opacityMin = Infinity;
  let opacityMax = -Infinity;
  let colourDelta = 0;
  let fillDelta = 0;
  let areaMax = 0;
  const style = { own: false, clip: false, filter: false, shadow: false };
  const from = Math.max(0, iDown - 1);
  for (let i = from; i < n; i += 1) {
    const v = s[i];
    if (!v) continue;
    areaMax = Math.max(areaMax, v.va);
    if (!shown(v)) continue;
    const c = centre(v);
    if (restC) travel = Math.max(travel, dist(c, restC));
    if (endC) travel = Math.max(travel, dist(c, endC));
    if (restC && rest) edgeTravel = Math.max(edgeTravel, Math.hypot(v.x - rest.x, v.y - rest.y));
    if (endC && end) edgeTravel = Math.max(edgeTravel, Math.hypot(v.x - end.x, v.y - end.y));
    const rc = relCentre(i);
    if (rc && relRest) ownTravel = Math.max(ownTravel, dist(rc, relRest));
    if (rc && relEnd) ownTravel = Math.max(ownTravel, dist(rc, relEnd));
    for (const ref of [existedBefore ? rest : undefined, existsAtEnd ? end : undefined]) {
      if (!shown(ref)) continue;
      sizeChange = Math.max(sizeChange, Math.abs(v.w - ref.w), Math.abs(v.h - ref.h));
    }
    if (refW > 0) {
      scaleMin = Math.min(scaleMin, v.w / refW);
      scaleMax = Math.max(scaleMax, v.w / refW);
    }
    if (v.va > 0) {
      opacityMin = Math.min(opacityMin, v.eo);
      opacityMax = Math.max(opacityMax, v.eo);
    }
    for (const ref of [rest, end]) {
      if (!ref) continue;
      const fd = colourDistance(v.bg, ref.bg, scheme);
      fillDelta = Math.max(fillDelta, fd);
      colourDelta = Math.max(colourDelta, fd, colourDistance(v.c, ref.c, scheme), colourDistance(v.bc, ref.bc, scheme));
      if (v.tf !== ref.tf || v.o !== ref.o || v.bg !== ref.bg || v.c !== ref.c || v.bc !== ref.bc || v.bs !== ref.bs || v.cp !== ref.cp || v.f !== ref.f || v.bf !== ref.bf) style.own = true;
      if (v.cp !== ref.cp) style.clip = true;
      if (v.f !== ref.f || v.bf !== ref.bf) style.filter = true;
      if (v.bs !== ref.bs) style.shadow = true;
    }
  }
  if (!existedBefore && existsAtEnd && end) ownTravel = Math.max(ownTravel, travel);
  if (opacityMin === Infinity) {
    opacityMin = 1;
    opacityMax = 1;
  }

  // Progress of the change on every frame, 0 at rest and 1 at the largest change.
  const deltaFrom = (v: Snap | undefined, ref: Snap | undefined): number[] => {
    if (!v && !ref) return [0, 0, 0, 0];
    if (!v || !ref) return [0, 0, 1, 0];
    const g = shown(v) && shown(ref) ? dist(centre(v), centre(ref)) : 0;
    const z = shown(v) && shown(ref) ? Math.max(Math.abs(v.w - ref.w), Math.abs(v.h - ref.h)) : 0;
    const big = Math.max(v.va, ref.va, 1);
    const a = Math.abs(v.va - ref.va) / big;
    const k = Math.max(colourDistance(v.bg, ref.bg, scheme), colourDistance(v.c, ref.c, scheme), colourDistance(v.bc, ref.bc, scheme));
    return [g, z, a, k];
  };
  const restRef = existedBefore ? rest : undefined;
  const endRef = existsAtEnd ? end : undefined;
  const fromRest = s.map((v) => deltaFrom(v, restRef));
  const toEnd = s.map((v) => deltaFrom(v, endRef));
  const maxes = [0, 1, 2, 3].map((j) => Math.max(0, ...fromRest.slice(from).map((d) => d[j] ?? 0), ...toEnd.slice(from).map((d) => d[j] ?? 0)));
  const norm = (d: number[]) => Math.max(0, ...d.map((v, j) => ((maxes[j] ?? 0) > 0 ? v / (maxes[j] ?? 1) : 0)));
  const oneWay = norm(deltaFrom(restRef, endRef)) >= 0.5;

  let inMs: number | null = null;
  const start = changes.length > 0 ? (frames[changes[0] ?? 0]?.t ?? t0) - t0 : null;
  const endT = changes.length > 0 ? (frames[changes[changes.length - 1] ?? 0]?.t ?? t0) - t0 : null;
  if (changes.length > 0) {
    const i0 = changes[0] ?? 0;
    for (let i = i0; i < n; i += 1) {
      const reached = oneWay ? norm(toEnd[i] ?? []) <= 0.1 : norm(fromRest[i] ?? []) >= 0.9;
      if (reached) {
        inMs = Math.round((frames[i]?.t ?? 0) - (frames[i0]?.t ?? 0) + frameMs);
        break;
      }
    }
  }

  // Cuts: the whole change in one frame.
  let cut: Track['cut'] = null;
  let dropped: Track['dropped'] = null;
  const near = [...inp.animations, ...(inp.ancestorAnimations ?? [])];
  const animatedAt = (time: number) => near.some((an) => an.iterations !== 0 && an.duration > 0 && an.firstSeen - 2 * frameMs <= time && time <= an.firstSeen + an.delay + an.duration + frameMs);
  for (const i of changes) {
    const a = s[i - 1];
    const b = s[i];
    const t = (frames[i]?.t ?? 0) - t0;
    if ((a?.p ?? 0) === 0 && (b?.p ?? 0) === 0) continue;
    if (animatedAt(frames[i]?.t ?? 0) || animatedAt(frames[i - 1]?.t ?? 0)) continue;
    // A cut with no animation behind it stays a cut even when the frame came late; the gap is noted.
    const gap = (frames[i]?.t ?? 0) - (frames[i - 1]?.t ?? 0);
    if (gap >= DROPPED_MS && !dropped) dropped = { at: Math.round(t), gapMs: Math.round(gap) };
    const aVa = a?.va ?? 0;
    const bVa = b?.va ?? 0;
    // Shown means drawn at all (in or out of the viewport): sliding into view is not an appearance.
    const drawn = (v: Snap | undefined) => !!v && v.w > 0 && v.h > 0 && v.eo >= 0.1;
    if (areaMax >= NOTICE.cutArea && !drawn(a) && drawn(b) && bVa >= 0.9 * areaMax) {
      cut = { kind: 'appear', at: t, size: Math.round(Math.sqrt(areaMax)) };
      break;
    }
    if (existedBefore && rest && rest.va >= NOTICE.cutArea && drawn(a) && aVa >= 0.9 * rest.va && !drawn(b)) {
      cut = { kind: 'disappear', at: t, size: Math.round(Math.sqrt(rest.va)) };
      break;
    }
    // A jump moves the box: its start edge shifts against the painting parent. A box that only grows from its start edge does not jump.
    const ra = relEdge(i - 1);
    const rb = relEdge(i);
    if (ra && rb && ownTravel >= NOTICE.jumpPx && dist(ra, rb) >= NOTICE.jumpPx && dist(ra, rb) >= 0.9 * ownTravel) {
      cut = { kind: 'jump', at: t, size: Math.round(dist(ra, rb) * 10) / 10 };
      break;
    }
  }
  if (!cut && colourDelta >= NOTICE.colour) {
    for (const i of changes) {
      const a = s[i - 1];
      const b = s[i];
      if (!a || !b || !end) continue;
      const step = Math.max(colourDistance(a.bg, b.bg, scheme), colourDistance(a.c, b.c, scheme), colourDistance(a.bc, b.bc, scheme));
      if (step >= 0.9 * colourDelta) {
        cut = { kind: 'colour', at: (frames[i]?.t ?? 0) - t0, size: Math.round(step) };
        break;
      }
    }
  }

  const m = inp.meta;
  return {
    id: inp.id,
    desc: m?.desc ?? `element ${inp.id}`,
    part: m?.part ?? null,
    group: m?.group ?? 'root',
    parent: m?.parent ?? null,
    merged: inp.merged,
    existedBefore,
    existsAtEnd,
    preMoving,
    changed: changes.length > 0,
    start: start === null ? null : Math.round(start),
    end: endT === null ? null : Math.round(endT),
    inMs,
    totalMs: start !== null && endT !== null ? Math.round(endT - start + frameMs) : null,
    travel: Math.round(travel * 10) / 10,
    edgeTravel: Math.round(edgeTravel * 10) / 10,
    ownTravel: Math.round(ownTravel * 10) / 10,
    sizeChange: Math.round(sizeChange * 10) / 10,
    scaleMin: Math.round(scaleMin * 1000) / 1000,
    scaleMax: Math.round(scaleMax * 1000) / 1000,
    opacityMin: Math.round(opacityMin * 100) / 100,
    opacityMax: Math.round(opacityMax * 100) / 100,
    colourDelta: Math.round(colourDelta * 10) / 10,
    fillDelta: Math.round(fillDelta * 10) / 10,
    ownStyleChanged: style.own,
    clipChanged: style.clip,
    filterChanged: style.filter,
    shadowChanged: style.shadow,
    areaMax: Math.round(areaMax),
    cut,
    dropped,
    animations: inp.animations,
  };
}

/** The first finite animation that started on a track after the finger landed. */
export function mainAnimation(track: Track, t0: number, frameMs: number): AnimationRecord | null {
  const list = track.animations
    .filter((a) => a.iterations >= 0 && a.duration > 0 && a.firstSeen >= t0 - frameMs)
    .sort((a, b) => a.firstSeen - b.firstSeen || b.duration + b.delay - (a.duration + a.delay));
  return list[0] ?? null;
}

/** The easing a person sees: CSS animations keep it on the keyframes. */
export function easingOf(a: AnimationRecord): string {
  if (a.type === 'CSSAnimation' && a.keyEasing) return a.keyEasing;
  if ((a.easing === 'linear' || a.easing === '') && a.keyEasing) return a.keyEasing;
  return a.easing || 'linear';
}

/** How long a track's change takes: its first animation, else the frames. */
export function changeMs(track: Track, t0: number, frameMs: number): { ms: number | null; source: 'animation' | 'frames' | null; easing: string | null } {
  const a = mainAnimation(track, t0, frameMs);
  if (a) return { ms: Math.round(a.duration + a.delay), source: 'animation', easing: easingOf(a) };
  if (track.cut) return { ms: 0, source: 'frames', easing: null };
  if (track.inMs !== null) return { ms: track.inMs, source: 'frames', easing: null };
  return { ms: null, source: null, easing: null };
}

function isInside(id: number, ancestor: number, tracks: Map<number, Track>, meta: Record<number, ElementMeta>): boolean {
  let p = meta[id]?.parent ?? tracks.get(id)?.parent ?? null;
  let guard = 0;
  while (p !== null && guard < 100) {
    if (p === ancestor) return true;
    p = meta[p]?.parent ?? null;
    guard += 1;
  }
  return false;
}

/** True when a track shows a change a person could see at all. */
export function visibleChange(t: Track): boolean {
  return t.ownTravel >= NOTICE.visiblePx || t.sizeChange >= NOTICE.visiblePx || t.colourDelta >= NOTICE.visibleColour || t.opacityMax - t.opacityMin >= NOTICE.visibleOpacity || t.clipChanged || t.filterChanged || t.shadowChanged || (!t.existedBefore && t.existsAtEnd) || (t.existedBefore && !t.existsAtEnd);
}

/** True when a track's own change (not one it inherits) is large enough to count as a reaction. */
export function noticeableOwn(t: Track): boolean {
  if (t.ownTravel >= NOTICE.movePx) return true;
  if (t.ownStyleChanged && t.sizeChange >= NOTICE.movePx) return true;
  if (t.ownStyleChanged && t.opacityMax - t.opacityMin >= NOTICE.opacity) return true;
  if (t.colourDelta >= NOTICE.colour) return true;
  if ((t.existedBefore !== t.existsAtEnd) && t.areaMax >= 100) return true;
  return false;
}

export function analyze(rec: Recording, opts: { gesture?: string } = {}): Measured {
  const frames = rec.frames;
  const t0 = fingerDown(rec);
  const frameMs = median(frames.slice(1).map((f, i) => f.t - (frames[i]?.t ?? f.t)));
  const { series, merged } = buildSeries(rec);
  const owner = new Map<number, number>();
  for (const [o, list] of merged) {
    owner.set(o, o);
    for (const id of list) owner.set(id, o);
  }
  const anims = new Map<number, AnimationRecord[]>();
  for (const a of rec.animations) {
    if (a.el === null) continue;
    const o = owner.get(a.el) ?? a.el;
    anims.set(o, [...(anims.get(o) ?? []), a]);
  }
  // Moves are measured against the nearest tracked ancestor that paints, so a
  // part carried by a wrapper that draws nothing still shows its own jump.
  const paintsEver = (id: number) => (series.get(owner.get(id) ?? id) ?? []).some((v) => v?.p === 1);
  const paintingParent = (id: number): number | null => {
    let p = rec.meta[id]?.parent ?? null;
    let guard = 0;
    while (p !== null && !paintsEver(p) && guard < 100) {
      p = rec.meta[p]?.parent ?? null;
      guard += 1;
    }
    return p;
  };
  const tracks = new Map<number, Track>();
  for (const [id, s] of series) {
    const meta = rec.meta[id];
    const pid = paintingParent(id);
    const parentSeries = pid !== null ? (series.get(owner.get(pid) ?? pid) ?? null) : null;
    const ancestorAnimations: AnimationRecord[] = [];
    for (let p = meta?.parent ?? null, guard = 0; p !== null && guard < 100; p = rec.meta[p]?.parent ?? null, guard += 1) ancestorAnimations.push(...(anims.get(owner.get(p) ?? p) ?? []));
    tracks.set(id, buildTrack({ id, meta, s, parentSeries, frames, t0, frameMs, scheme: rec.scheme, animations: anims.get(id) ?? [], ancestorAnimations, merged: merged.get(id) ?? [] }));
  }
  const live = [...tracks.values()].filter((t) => t.changed && !t.preMoving && visibleChange(t));
  const firstAbs = live.length > 0 ? Math.min(...live.map((t) => t.start ?? Infinity)) + t0 : null;
  const pointerup = eventTime(rec, 'pointerup') ?? eventTime(rec, 'touchend');
  const click = eventTime(rec, 'click');

  const hFrame = [...frames].reverse().find((f) => f.h !== null);
  const hId = hFrame?.h ?? null;
  const named = hId !== null ? (tracks.get(owner.get(hId) ?? hId) ?? null) : null;
  // The headline group: the named part and everything inside it.
  // A surface that opens is judged by itself: its parts stagger in on their own and are secondary.
  const group = named ? [...tracks.values()].filter((t) => t.id === named.id || (named.group === 'root' && isInside(t.id, named.id, tracks, rec.meta))) : [];
  // The part a person watches: the named one, unless something inside it moves 3px more (a label that rolls inside a still label box).
  let headline = named;
  for (const t of group) {
    if (!headline || t.preMoving || !t.changed) continue;
    if (Math.max(t.travel, t.ownTravel) >= Math.max(headline.travel, headline.ownTravel) + NOTICE.movePx) headline = t;
  }
  // Its main change: of the animations that start first in the group, the longest.
  let main: { ms: number | null; source: 'animation' | 'frames' | null; easing: string | null } = { ms: null, source: null, easing: null };
  const groupAnims = group.flatMap((t) => t.animations).filter((a) => a.iterations >= 0 && a.duration > 0 && a.firstSeen >= t0 - frameMs);
  if (groupAnims.length > 0) {
    const first = Math.min(...groupAnims.map((a) => a.firstSeen));
    const best = groupAnims.filter((a) => a.firstSeen <= first + 2 * frameMs).sort((a, b) => b.duration + b.delay - (a.duration + a.delay))[0];
    if (best) main = { ms: Math.round(best.duration + best.delay), source: 'animation', easing: easingOf(best) };
  } else if (headline) main = changeMs(headline, t0, frameMs);

  const rootTrack = [...tracks.values()].find((t) => t.group === 'root' && t.parent === null) ?? null;
  const lastOf = (id: number) => {
    const s = series.get(id);
    if (!s) return undefined;
    for (let i = s.length - 1; i >= 0; i -= 1) if (s[i]) return s[i];
    return undefined;
  };
  const areaOf = (t: Track | null) => {
    if (!t) return 0;
    const v = lastOf(t.id);
    return v ? v.w * v.h : 0;
  };
  const headlineIsOverlay = headline?.group === 'overlay';
  const rootArea = headlineIsOverlay ? areaOf(headline) : areaOf(rootTrack) || areaOf(headline);
  const side = headlineIsOverlay ? 'overlay' : 'root';
  let filled = 0;
  for (const t of tracks.values()) {
    if (t.group !== side || t.preMoving) continue;
    if (headlineIsOverlay && headline && t.id !== headline.id && !isInside(t.id, headline.id, tracks, rec.meta)) continue;
    if (t.fillDelta >= NOTICE.colour || (t.clipChanged && t.fillDelta > 0)) filled += areaOf(t);
  }
  const fillShare = rootArea > 0 ? Math.min(1, filled / rootArea) : 0;
  // Content of the headline that fades in or out by itself (a word that swaps), as a share of the control.
  let faded = 0;
  let fadeMs = 0;
  if (!headlineIsOverlay) {
    for (const t of group) {
      if (t.preMoving || !t.ownStyleChanged || t.opacityMax - t.opacityMin < 0.5) continue;
      if (rec.meta[t.id]?.parent !== null && group.some((g) => g.id === rec.meta[t.id]?.parent && g.opacityMax - g.opacityMin >= 0.5 && g.ownStyleChanged)) continue;
      faded += t.areaMax;
      fadeMs = Math.max(fadeMs, changeMs(t, t0, frameMs).ms ?? 0);
    }
  }
  const fadeShare = rootArea > 0 ? Math.min(1, faded / rootArea) : 0;

  const hid = named?.id ?? -1;
  const secondaries = live.filter((t) => {
    if (t.id === hid || (named?.group === 'root' && isInside(t.id, hid, tracks, rec.meta))) return false;
    if (named?.group === 'overlay' && t.group === 'overlay' && t.ownTravel < NOTICE.movePx && !t.ownStyleChanged) return false;
    if (!noticeableOwn(t)) return false;
    if (t.cut && t.cut.kind !== 'colour') return false;
    const ms = changeMs(t, t0, frameMs).ms ?? 0;
    return ms >= NOTICE.minMs;
  });
  const cuts = live.filter((t) => t.cut && t.cut.kind !== 'colour');
  const tooShortOrSmall: { track: Track; why: string }[] = [];
  if (opts.gesture !== 'drag') {
    for (const t of live) {
      if (!t.ownStyleChanged && t.ownTravel < NOTICE.visiblePx && t.existedBefore === t.existsAtEnd) continue;
      const ms = changeMs(t, t0, frameMs).ms;
      if (ms !== null && ms < 150) tooShortOrSmall.push({ track: t, why: ms === 0 ? 'changes in one frame' : `finishes in ${ms}ms` });
      else if (t.ownTravel >= NOTICE.visiblePx && t.ownTravel < NOTICE.movePx && t.sizeChange < NOTICE.movePx && t.colourDelta < NOTICE.colour) tooShortOrSmall.push({ track: t, why: `moves only ${t.ownTravel}px` });
    }
  }

  return {
    pointerdown: eventTime(rec, 'pointerdown'),
    pointerup,
    click,
    fingerMs: pointerup !== null ? Math.round(pointerup - t0) : null,
    latency: firstAbs === null ? null : Math.round(firstAbs - t0),
    startsAtRelease: firstAbs !== null && pointerup !== null && firstAbs >= pointerup,
    afterClick: firstAbs !== null && click !== null && firstAbs >= click + 50 && rec.stateChanged !== true,
    droppedFrames: frames.filter((f, i) => i > 0 && f.t >= t0 && f.t - (frames[i - 1]?.t ?? f.t) >= DROPPED_MS).length,
    frameMs: Math.round(frameMs * 10) / 10,
    frames: frames.length,
    headline,
    mainMs: main.ms,
    mainSource: main.source,
    mainEasing: main.easing,
    fillShare: Math.round(fillShare * 100) / 100,
    fadeShare: Math.round(fadeShare * 100) / 100,
    fadeMs,
    secondaries,
    cuts,
    tooShortOrSmall,
    tracks: [...tracks.values()],
    rootArea: Math.round(rootArea),
  };
}

/** How long the press look stayed on while the finger was held. */
export function analyzeHold(rec: Recording): HoldResult {
  const frames = rec.frames;
  const t0 = fingerDown(rec);
  const up = eventTime(rec, 'pointerup') ?? eventTime(rec, 'touchend') ?? frames[frames.length - 1]?.t ?? t0;
  const iDown = Math.max(0, frames.findIndex((f) => f.t >= t0));
  const rest = frames[Math.max(0, iDown - 1)];
  const { series } = buildSeries(rec);
  const restOf = new Map<number, Snap | undefined>();
  const moving = new Set<number>();
  for (const [id, s] of series) {
    restOf.set(id, rest ? s[Math.max(0, iDown - 1)] : undefined);
    for (let i = 1; i < iDown; i += 1) if (snapDiffers(s[i - 1], s[i])) moving.add(id);
  }
  let onAfter: number | null = null;
  let shownMs = 0;
  for (let i = iDown; i < frames.length; i += 1) {
    const f = frames[i];
    if (!f || f.t > up) break;
    let differs = false;
    for (const [id, s] of series) {
      if (moving.has(id)) continue;
      if (snapDiffers(restOf.get(id), s[i])) {
        differs = true;
        break;
      }
    }
    if (differs) {
      if (onAfter === null) onAfter = Math.round(f.t - t0);
      const nextT = Math.min(frames[i + 1]?.t ?? up, up);
      shownMs += Math.max(0, nextT - f.t);
    }
  }
  const holdMs = Math.round(up - t0);
  const window = Math.max(1, holdMs - 32);
  return { holdMs, onAfter, shownMs: Math.round(shownMs), share: Math.round(Math.min(1, shownMs / window) * 100) / 100 };
}
