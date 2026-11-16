// The calibration run: the motion audit's table of twenty components
// (docs/reports/audit/interactions.md, measured 2026-11-14 in Neutral on the
// Pixel 7 profile, platform web) as numbers, and the comparison of a run with
// it. Order R0.8 accepts the gate when a run on the tree reproduces these
// within 10 percent and calls 9 of 20 invisible and 4 wrong, as the audit did.
import { scaleChange } from './profiles';
import type { InteractionResult } from './types';

export interface AuditValue {
  what: string;
  /** The audit's number (or true for a yes). */
  audit: number | boolean;
  read: (r: InteractionResult) => number | boolean | null;
  /** Absolute slack added to the 10 percent, for values a frame or a rounding can move. */
  slack?: number;
}

export interface AuditRow {
  id: string;
  call: 'fine' | 'invisible' | 'wrong';
  says: string;
  values: AuditValue[];
}

const head = (r: InteractionResult) => r.measured?.headline ?? null;
const travel = (r: InteractionResult) => {
  const h = head(r);
  return h ? Math.max(h.travel, h.ownTravel) : null;
};
const main = (r: InteractionResult) => r.measured?.mainMs ?? null;
/** The longest animation whose name matches, anywhere in the run. */
const named = (r: InteractionResult, re: RegExp) => {
  const a = (r.measured?.tracks ?? []).flatMap((t) => t.animations).filter((x) => re.test(x.name));
  return a.length > 0 ? Math.max(...a.map((x) => x.duration)) : null;
};
/** The duration of the headline's own animation of one property. */
const animOf = (r: InteractionResult, prop: string) => {
  const a = (r.measured?.headline?.animations ?? []).filter((x) => x.props.includes(prop) && x.iterations >= 0);
  return a.length > 0 ? Math.max(...a.map((x) => x.duration)) : null;
};
const scale = (r: InteractionResult) => (head(r) ? Math.round(scaleChange(head(r)) * 1000) / 1000 : null);
const release = (r: InteractionResult) => r.measured?.startsAtRelease ?? null;
const cutOf = (kind: string) => (r: InteractionResult) => (r.measured?.cuts ?? []).some((t) => t.cut?.kind === kind);
const jump = (r: InteractionResult) => {
  const j = (r.measured?.cuts ?? []).filter((t) => t.cut?.kind === 'jump').map((t) => t.cut?.size ?? 0);
  return j.length > 0 ? Math.max(...j) : null;
};

export const AUDIT_TABLE: AuditRow[] = [
  { id: 'button', call: 'invisible', says: 'scale 1 to 0.98 over 70ms, starts at release', values: [
    { what: 'scale change', audit: 0.02, read: scale, slack: 0.001 },
    { what: 'press ms', audit: 70, read: main },
    { what: 'starts at release', audit: true, read: release },
  ] },
  { id: 'icon-button', call: 'invisible', says: 'scale 0.98 over 70ms, starts at release', values: [
    { what: 'scale change', audit: 0.02, read: scale, slack: 0.001 },
    { what: 'press ms', audit: 70, read: main },
    { what: 'starts at release', audit: true, read: release },
  ] },
  { id: 'switch', call: 'fine', says: 'thumb 12px over 158ms', values: [
    { what: 'thumb travel px', audit: 12, read: travel },
    { what: 'slide ms', audit: 158, read: main },
  ] },
  { id: 'checkbox', call: 'invisible', says: 'fill 90ms, check 72ms after 45ms, all done by about 120ms', values: [
    { what: 'fill ms', audit: 90, read: (r) => {
      const a = (r.measured?.tracks ?? []).flatMap((t) => t.animations).filter((x) => x.props.includes('clipPath'));
      return a.length > 0 ? Math.max(...a.map((x) => x.duration)) : null;
    } },
    { what: 'check stroke ms', audit: 72, read: (r) => {
      const a = (r.measured?.tracks ?? []).flatMap((t) => t.animations).filter((x) => x.props.includes('strokeDashoffset')).sort((x, y) => x.delay - y.delay)[0];
      return a ? a.duration : null;
    } },
    { what: 'check stroke delay ms', audit: 45, read: (r) => {
      const a = (r.measured?.tracks ?? []).flatMap((t) => t.animations).filter((x) => x.props.includes('strokeDashoffset')).sort((x, y) => x.delay - y.delay)[0];
      return a ? a.delay : null;
    } },
  ] },
  { id: 'radio', call: 'invisible', says: 'dot 0.5 to 1, opacity 0 to 1 over 100ms', values: [
    { what: 'dot fade ms', audit: 100, read: (r) => animOf(r, 'opacity') },
    { what: 'dot starts at scale', audit: 0.5, read: (r) => head(r)?.scaleMin ?? null, slack: 0.02 },
  ] },
  { id: 'tabs', call: 'wrong', says: 'pill 60px over 158ms; the panel swaps in one frame', values: [
    { what: 'pill travel px', audit: 60, read: travel },
    { what: 'pill ms', audit: 158, read: main },
    { what: 'panel cut', audit: true, read: (r) => cutOf('appear')(r) || cutOf('disappear')(r) },
  ] },
  { id: 'segmented-control', call: 'fine', says: 'pill 55px over 158ms', values: [
    { what: 'pill travel px', audit: 55, read: travel },
    { what: 'pill ms', audit: 158, read: main },
  ] },
  { id: 'select', call: 'invisible', says: 'open: 5px, 0.98 to 1, 158ms', values: [
    { what: 'rise px', audit: 5, read: travel, slack: 0.5 },
    { what: 'scale change', audit: 0.02, read: scale, slack: 0.001 },
    { what: 'open ms', audit: 158, read: main },
  ] },
  { id: 'dropdown-menu', call: 'invisible', says: '8px, 0.98 to 1, 158ms', values: [
    { what: 'rise px', audit: 8, read: travel },
    { what: 'scale change', audit: 0.02, read: scale, slack: 0.001 },
    { what: 'open ms', audit: 158, read: main },
  ] },
  { id: 'dialog', call: 'invisible', says: 'panel 4px, 0.98 to 1', values: [
    { what: 'rise px', audit: 4, read: travel, slack: 0.5 },
    { what: 'scale change', audit: 0.02, read: scale, slack: 0.001 },
  ] },
  { id: 'alert-dialog', call: 'invisible', says: 'panel 4px', values: [
    { what: 'rise px', audit: 4, read: travel, slack: 0.5 },
  ] },
  { id: 'sheet', call: 'fine', says: '241px over 200ms', values: [
    { what: 'slide px', audit: 241, read: travel },
    { what: 'slide ms', audit: 200, read: main },
  ] },
  { id: 'toast', call: 'fine', says: '40px, 0.98 to 1, 200ms', values: [
    { what: 'rise px', audit: 40, read: travel },
    { what: 'rise ms', audit: 200, read: main },
  ] },
  { id: 'tooltip', call: 'wrong', says: 'appears with no entrance on touch', values: [
    { what: 'appears in one frame', audit: true, read: cutOf('appear') },
  ] },
  { id: 'accordion', call: 'wrong', says: 'the items below jump 49px in one frame', values: [
    { what: 'jump px', audit: 49, read: jump },
  ] },
  { id: 'input', call: 'invisible', says: 'colour only, no movement', values: [
    { what: 'travel px', audit: 0, read: travel, slack: 0.5 },
  ] },
  { id: 'copy-button', call: 'fine', says: 'press 0.987 at release; icon pop 200ms, label roll 158ms', values: [
    { what: 'icon pop ms', audit: 200, read: (r) => named(r, /pop/) },
    { what: 'label roll ms', audit: 158, read: (r) => named(r, /roll/) },
    { what: 'press scale change', audit: 0.013, read: (r) => {
      const root = (r.measured?.tracks ?? []).find((t) => t.desc.startsWith('button copy-button'));
      return root ? Math.round((1 - root.scaleMin) * 1000) / 1000 : null;
    }, slack: 0.001 },
    { what: 'starts at release', audit: true, read: release },
  ] },
  { id: 'slider', call: 'fine', says: 'thumb follows 53px, 16ms latency', values: [
    { what: 'thumb travel px', audit: 53, read: travel },
    { what: 'latency ms', audit: 16, read: (r) => r.measured?.latency ?? null, slack: 17 },
  ] },
  { id: 'chip', call: 'fine', says: 'label slides 20px over 158ms', values: [
    { what: 'label travel px', audit: 20, read: travel },
    { what: 'label ms', audit: 158, read: main },
  ] },
  { id: 'card', call: 'wrong', says: '0.3px, starting after the click', values: [
    { what: 'after the click', audit: true, read: (r) => r.measured?.afterClick ?? null },
  ] },
];

export interface CalibrationLine {
  id: string;
  what: string;
  audit: string;
  measured: string;
  pass: boolean;
}

export function within(audit: number, value: number, slack = 0): boolean {
  return Math.abs(value - audit) <= Math.abs(audit) * 0.1 + slack;
}

export function compareWithAudit(results: InteractionResult[]): { lines: CalibrationLine[]; calls: { id: string; audit: string; gate: string; why: string }[]; counts: { invisible: number; wrong: number; fine: number }; pass: boolean } {
  const lines: CalibrationLine[] = [];
  const calls: { id: string; audit: string; gate: string; why: string }[] = [];
  for (const row of AUDIT_TABLE) {
    const r = results.find((x) => x.id === row.id);
    calls.push({ id: row.id, audit: row.call, gate: r?.call ?? 'not run', why: r?.callWhy ?? r?.error ?? '' });
    for (const v of row.values) {
      const got = r ? v.read(r) : null;
      const pass = got === null ? false : typeof v.audit === 'boolean' ? got === v.audit : typeof got === 'number' && within(v.audit, got, v.slack ?? 0);
      lines.push({ id: row.id, what: v.what, audit: String(v.audit), measured: got === null ? 'not measured' : String(got), pass });
    }
  }
  const counts = { invisible: 0, wrong: 0, fine: 0 };
  for (const c of calls) if (c.gate === 'invisible' || c.gate === 'wrong' || c.gate === 'fine') counts[c.gate] += 1;
  const pass = lines.every((l) => l.pass) && counts.invisible === 9 && counts.wrong === 4;
  return { lines, calls, counts, pass };
}
