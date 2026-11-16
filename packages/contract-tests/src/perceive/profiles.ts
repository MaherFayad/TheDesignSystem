// The two perceive profiles of docs/plan/reset.md section 3 and DECISIONS.md
// (R0.1 lead decisions 7 and 8), the audit's call (fine, invisible, wrong)
// used to calibrate the gate, and the sentences of the report.
import type { Check, HoldResult, Interaction, Measured, Track } from './types';
import type { QuietSource } from './sources';

/** Rich (Neutral and Liquid, ruling 3). */
export const RICH = {
  latencyMs: 32,
  /** Android ripples follow the platform's touch delay: 150ms plus 32ms. */
  rippleLatencyMs: 182,
  travelPx: 8,
  scale: 0.06,
  fillShare: 0.3,
  mainMin: 200,
  mainMax: 500,
  meaningMinMs: 150,
  meaningMinPx: 3,
} as const;

/** Quiet (Studio and Desk): the motion tolerances of plan section 3. */
export const QUIET = {
  latencyMs: 32,
  travelPx: 1,
  scale: 0.01,
  durationMs: 10,
  durationShare: 0.1,
  easing: 0.02,
} as const;

/** What the audit called perceivable: a move or resize of 4px or more lasting 150ms or more. */
export const AUDIT = { px: 4, ms: 150, overlayShare: 0.05, fillShare: 0.3, fillColour: 10 } as const;

const r1 = (n: number) => Math.round(n * 10) / 10;
const pct = (n: number) => `${Math.round(n * 1000) / 10} percent`;

/** The largest scale change of a track, as a share: 0.02 for 0.98. */
export function scaleChange(t: Track | null): number {
  if (!t) return 0;
  return Math.max(Math.abs(1 - t.scaleMin), Math.abs(t.scaleMax - 1));
}

function rippleFirst(m: Measured): boolean {
  const first = m.tracks.filter((t) => t.changed && !t.preMoving && t.start !== null).sort((a, b) => (a.start ?? 0) - (b.start ?? 0))[0];
  return !!first && /ripple/.test(first.part ?? first.desc);
}

export function richChecks(ix: Interaction, m: Measured, platform: string): Check[] {
  const out: Check[] = [];
  const limit = platform === 'android' && rippleFirst(m) ? RICH.rippleLatencyMs : RICH.latencyMs;
  out.push({ id: 'latency', label: 'First visible change after the finger lands', pass: m.latency !== null && m.latency <= limit, measured: m.latency === null ? 'nothing changed' : `${m.latency}ms${m.startsAtRelease ? ', at release' : ''}`, limit: `at most ${limit}ms` });
  const h = m.headline;
  const sc = scaleChange(h);
  const big = !!h && (h.ownTravel >= RICH.travelPx || h.travel >= RICH.travelPx || sc >= RICH.scale || m.fillShare >= RICH.fillShare);
  out.push({ id: 'size', label: 'Headline part moves, scales or changes fill enough to see', pass: big, measured: h ? `moves ${r1(Math.max(h.travel, h.ownTravel))}px, scales ${pct(sc)}, fill over ${Math.round(m.fillShare * 100)} percent` : 'headline not found', limit: `${RICH.travelPx}px, or ${RICH.scale * 100} percent scale, or fill over ${RICH.fillShare * 100} percent` });
  if (ix.gesture !== 'drag') {
    out.push({ id: 'duration', label: 'Main change lasts long enough to read', pass: m.mainMs !== null && m.mainMs >= RICH.mainMin && m.mainMs <= RICH.mainMax, measured: m.mainMs === null ? 'no change' : `${m.mainMs}ms`, limit: `${RICH.mainMin} to ${RICH.mainMax}ms` });
  }
  out.push({ id: 'secondary', label: 'A second element reacts', pass: m.secondaries.length > 0, measured: m.secondaries.length > 0 ? m.secondaries.slice(0, 3).map((t) => t.desc).join(', ') : 'none', limit: 'at least one' });
  const bad = m.tooShortOrSmall;
  out.push({ id: 'meaning', label: 'Nothing that carries meaning is too fast or too small', pass: bad.length === 0, measured: bad.length === 0 ? 'none' : bad.slice(0, 4).map((b) => `${b.track.desc} ${b.why}`).join('; '), limit: `no change under ${RICH.meaningMinMs}ms or under ${RICH.meaningMinPx}px` });
  return out;
}

/** Control points of a cubic easing, or null for a curve that is not one. */
export function bezierOf(easing: string): [number, number, number, number] | null {
  const named: Record<string, [number, number, number, number]> = {
    ease: [0.25, 0.1, 0.25, 1],
    'ease-in': [0.42, 0, 1, 1],
    'ease-out': [0, 0, 0.58, 1],
    'ease-in-out': [0.42, 0, 0.58, 1],
    linear: [0, 0, 1, 1],
  };
  const e = easing.trim();
  if (named[e]) return named[e];
  const m = /^cubic-bezier\(([^)]+)\)$/.exec(e);
  if (!m) return null;
  const v = (m[1] ?? '').split(',').map((x) => parseFloat(x));
  return v.length === 4 && v.every(Number.isFinite) ? [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0, v[3] ?? 0] : null;
}

/** True when two easings are the same curve: each control point within the tolerance. */
export function sameEasing(a: string, b: string, tol: number = QUIET.easing): boolean {
  if (a.trim() === b.trim()) return true;
  const x = bezierOf(a);
  const y = bezierOf(b);
  if (!x || !y) return false;
  return x.every((v, i) => Math.abs(v - (y[i] ?? 0)) <= tol);
}

export function quietChecks(m: Measured, src: QuietSource | undefined): Check[] {
  const out: Check[] = [];
  out.push({ id: 'latency', label: 'First visible change after the finger lands', pass: m.latency !== null && m.latency <= QUIET.latencyMs, measured: m.latency === null ? 'nothing changed' : `${m.latency}ms${m.startsAtRelease ? ', at release' : ''}`, limit: `at most ${QUIET.latencyMs}ms` });
  if (!src) {
    out.push({ id: 'source', label: 'Source numbers to compare with', pass: false, measured: 'no source numbers recorded for this interaction', limit: 'a QUIET_SOURCES entry' });
    return out;
  }
  const h = m.headline;
  const travel = h ? Math.max(h.travel, h.ownTravel) : 0;
  out.push({ id: 'travel', label: 'Headline travel equals the source', pass: Math.abs(travel - src.travel) <= QUIET.travelPx, measured: `${r1(travel)}px`, limit: `${src.travel}px within ${QUIET.travelPx}px` });
  const sc = h ? (Math.abs(h.scaleMin - 1) > Math.abs(h.scaleMax - 1) ? h.scaleMin : h.scaleMax) : 1;
  out.push({ id: 'scale', label: 'Headline scale equals the source', pass: Math.abs(sc - src.scale) <= QUIET.scale, measured: `${sc}`, limit: `${src.scale} within ${QUIET.scale}` });
  const tol = Math.max(QUIET.durationMs, src.ms * QUIET.durationShare);
  out.push({ id: 'duration', label: 'Main change takes as long as the source', pass: m.mainMs !== null && Math.abs(m.mainMs - src.ms) <= tol, measured: m.mainMs === null ? 'no change' : `${m.mainMs}ms`, limit: `${src.ms}ms within ${Math.round(tol)}ms` });
  out.push({ id: 'easing', label: 'Easing is the source curve', pass: m.mainEasing !== null && sameEasing(m.mainEasing, src.easing), measured: m.mainEasing ?? 'none', limit: `${src.easing}, each control point within ${QUIET.easing}` });
  return out;
}

/**
 * The audit's call, rebuilt from numbers so the gate can be calibrated on it:
 * wrong when something jumps, appears or vanishes in one frame, or when the
 * look follows the emulated hover after the tap; fine when the headline part
 * moves or resizes 4px or more (for a surface that opens, also 5 percent of
 * its own size, since a short rise on a big panel reads as a fade), or changes
 * fill or fades its content over 30 percent of the control, for 150ms or
 * more; invisible otherwise.
 */
export function auditCall(ix: Interaction, m: Measured): { call: 'fine' | 'invisible' | 'wrong'; why: string } {
  if (m.cuts.length > 0) {
    const c = m.cuts[0] as Track;
    const what = c.cut?.kind === 'jump' ? `jumps ${c.cut.size}px in one frame` : c.cut?.kind === 'appear' ? 'appears in one frame, with no entrance' : 'vanishes in one frame';
    return { call: 'wrong', why: `${c.desc} ${what}` };
  }
  if (m.afterClick && m.headline?.group !== 'overlay') return { call: 'wrong', why: `the first change comes ${m.latency}ms after the finger lands, after the click, through emulated hover` };
  const h = m.headline;
  if (!h || !h.changed) return { call: 'invisible', why: 'the headline part does not change' };
  const ms = ix.gesture === 'drag' ? (h.totalMs ?? 0) : (m.mainMs ?? 0);
  const move = Math.max(h.travel, h.ownTravel);
  const size = h.group === 'overlay' ? Math.sqrt(Math.max(1, m.rootArea)) : 0;
  const moveOk = move >= AUDIT.px && (h.group !== 'overlay' || move >= AUDIT.overlayShare * Math.max(size, 1));
  const sizeOk = h.sizeChange >= AUDIT.px && (h.group !== 'overlay' || h.sizeChange >= AUDIT.overlayShare * Math.max(size, 1));
  const fillOk = h.group !== 'overlay' && m.fillShare >= AUDIT.fillShare;
  const fadeOk = h.group !== 'overlay' && m.fadeShare >= AUDIT.fillShare;
  if ((moveOk || sizeOk || fillOk || fadeOk) && ms >= AUDIT.ms) return { call: 'fine', why: `the headline ${moveOk ? `moves ${r1(move)}px` : sizeOk ? `changes size by ${r1(h.sizeChange)}px` : fillOk ? 'changes fill' : `fades content over ${Math.round(m.fadeShare * 100)} percent of the control`} over ${ms}ms` };
  const reasons: string[] = [];
  if (!(moveOk || sizeOk || fillOk || fadeOk)) reasons.push(`it moves ${r1(move)}px and changes size by ${r1(h.sizeChange)}px`);
  if (ms < AUDIT.ms) reasons.push(`its main change takes ${ms}ms`);
  return { call: 'invisible', why: reasons.join(' and ') };
}

/** Plain sentences a person can picture: no token names. */
export function sentences(ix: Interaction, m: Measured, hold: HoldResult | null): string[] {
  const out: string[] = [];
  const h = m.headline;
  const name = h ? (h.part ?? h.desc) : 'the headline part';
  if (m.latency === null) out.push('Nothing visible changes after the finger lands.');
  else out.push(`The first visible change comes ${m.latency}ms after the finger lands${m.startsAtRelease ? ', when the finger lifts' : ', while the finger is still down'}${m.afterClick ? ', after the click' : ''}.`);
  if (h && h.changed) {
    const bits: string[] = [];
    const move = Math.max(h.travel, h.ownTravel);
    if (move >= 0.5) bits.push(`moves ${r1(move)}px`);
    const sc = scaleChange(h);
    if (sc >= 0.005) bits.push(h.scaleMin < 1 ? `shrinks to ${h.scaleMin}` : `grows to ${h.scaleMax}`);
    if (h.opacityMax - h.opacityMin >= 0.1) bits.push(`fades from ${h.opacityMin} to ${h.opacityMax}`);
    if (h.colourDelta >= 5) bits.push(`changes colour (Delta E ${Math.round(h.colourDelta)})`);
    if (bits.length === 0) bits.push('changes a little');
    out.push(`The ${name} ${bits.join(', ')}${m.mainMs !== null ? ` over ${m.mainMs}ms` : ''}${m.mainEasing ? ` (${m.mainEasing.length > 40 ? `${m.mainEasing.slice(0, 37)}...` : m.mainEasing})` : ''}.`);
  } else {
    out.push(`The ${name} does not change.`);
  }
  if (m.fillShare >= 0.05) out.push(`The fill changes over ${Math.round(m.fillShare * 100)} percent of the ${h?.group === 'overlay' ? 'surface' : 'control'}.`);
  if (m.secondaries.length > 0) out.push(`Also reacting: ${m.secondaries.slice(0, 4).map((t) => `${t.part ?? t.desc} (${t.ownTravel >= 3 ? `${r1(t.ownTravel)}px` : t.colourDelta >= 10 ? 'colour' : 'fade'})`).join(', ')}.`);
  else out.push('Nothing else reacts.');
  for (const c of m.cuts.slice(0, 3)) out.push(`The ${c.part ?? c.desc} ${c.cut?.kind === 'jump' ? `jumps ${c.cut.size}px` : c.cut?.kind === 'appear' ? 'appears' : 'vanishes'} in one frame.`);
  if (m.droppedFrames > 0) out.push(`The page dropped frames ${m.droppedFrames} times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.`);
  if (hold) out.push(hold.onAfter === null ? `Held for ${hold.holdMs}ms, the press shows nothing while the finger is down.` : `Held for ${hold.holdMs}ms, the press shows ${hold.onAfter}ms after the finger lands and stays for ${hold.shownMs}ms of the hold.`);
  void ix;
  return out;
}
