// Unit tests for the perception gate: the analysis on synthetic recordings,
// the profiles, the audit call, the calibration comparison and the command
// line. The browser run itself is proven by the calibration run in
// docs/reports/reset/R0.8/.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyze, analyzeHold, buildSeries, colourDistance, snapDiffers } from './analyze';
import { AUDIT_TABLE, compareWithAudit, within } from './calibration';
import { INTERACTIONS, findInteraction, profileFor } from './catalog';
import { auditCall, bezierOf, quietChecks, richChecks, sameEasing } from './profiles';
import { devicesFor, pageUrl, parseArgs } from './run';
import { QUIET_SOURCES, quietSource } from './sources';
import type { AnimationRecord, ElementMeta, Frame, Interaction, InteractionResult, Recording, Snap } from './types';

const FRAME = 16.7;

function snap(over: Partial<Snap> = {}): Snap {
  const s: Snap = { x: 100, y: 100, w: 100, h: 40, o: 1, eo: 1, va: 4000, tf: 'none', bg: 'rgb(0, 0, 255)', c: 'rgb(255, 255, 255)', bc: 'rgb(0, 0, 255)', bs: 'none', cp: 'none', f: 'none', bf: 'none', p: 1, ...over };
  if (over.va === undefined) s.va = Math.round(s.w * s.h * s.eo);
  return s;
}

function meta(id: number, over: Partial<ElementMeta> = {}): ElementMeta {
  return { id, desc: `el ${id}`, tag: 'div', part: null, ds: null, role: null, group: 'root', parent: null, ...over };
}

/** Builds a recording of `n` frames 16.7ms apart from a function of the frame time. */
function recording(n: number, at: (t: number) => { [id: number]: Snap | undefined }, opts: { metas: ElementMeta[]; events: [string, number][]; head?: number | null; animations?: AnimationRecord[] }): Recording {
  const frames: Frame[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = Math.round(i * FRAME * 10) / 10;
    const els: Record<number, Snap> = {};
    for (const [k, v] of Object.entries(at(t))) if (v) els[Number(k)] = v;
    frames.push({ t, h: opts.head ?? null, els });
  }
  const m: Record<number, ElementMeta> = {};
  for (const x of opts.metas) m[x.id] = x;
  return { frames, meta: m, events: opts.events, animations: opts.animations ?? [], viewport: { width: 412, height: 839 }, scheme: 'light' };
}

const anim = (el: number, firstSeen: number, duration: number, over: Partial<AnimationRecord> = {}): AnimationRecord => ({ el, target: '', type: 'CSSTransition', name: 'transform', props: ['transform'], duration, delay: 0, easing: 'ease', keyEasing: '', iterations: 1, firstSeen, ...over });

const button = findInteraction('button') as Interaction;
const dialog = findInteraction('dialog') as Interaction;

describe('snapDiffers', () => {
  it('sees a move, a fade and a colour change, and ignores sub pixel noise', () => {
    expect(snapDiffers(snap(), snap({ x: 100.1 }))).toBe(false);
    expect(snapDiffers(snap(), snap({ x: 101 }))).toBe(true);
    expect(snapDiffers(snap(), snap({ eo: 0.5 }))).toBe(true);
    expect(snapDiffers(snap(), snap({ bg: 'rgb(0, 0, 200)' }))).toBe(true);
  });
  it('ignores an element that paints nothing, and anything not visible', () => {
    expect(snapDiffers(snap({ p: 0 }), snap({ p: 0, x: 140 }))).toBe(false);
    expect(snapDiffers(snap({ va: 0 }), snap({ va: 0, x: 140 }))).toBe(false);
    expect(snapDiffers(undefined, snap())).toBe(true);
  });
});

describe('colourDistance', () => {
  it('is 0 for one colour and large for black against white', () => {
    expect(colourDistance('rgb(10, 20, 30)', 'rgb(10, 20, 30)')).toBe(0);
    expect(colourDistance('rgb(0, 0, 0)', 'rgb(255, 255, 255)')).toBeGreaterThan(90);
  });
  it('composites a clear colour on the page, so transparent equals white on a light page', () => {
    expect(colourDistance('rgba(0, 0, 0, 0)', 'rgb(255, 255, 255)')).toBeLessThan(0.5);
  });
});

describe('analyze: a press that starts at release', () => {
  // Finger down at 50ms, up at 140ms; the button shrinks to 0.98 over 70ms from 150ms, then back by 400ms.
  const rec = recording(
    50,
    (t) => {
      const k = t < 150 ? 1 : t < 220 ? 1 - 0.02 * ((t - 150) / 70) : t < 400 ? 0.98 + 0.02 * ((t - 220) / 180) : 1;
      return { 1: snap({ w: 100 * k, x: 100 + (100 - 100 * k) / 2, h: 40 * k, y: 100 + (40 - 40 * k) / 2 }) };
    },
    { metas: [meta(1, { desc: 'button', ds: 'button' })], events: [['pointerdown', 50], ['pointerup', 140], ['click', 145]], head: 1, animations: [anim(1, 150, 70)] },
  );
  const m = analyze(rec);
  it('reports the latency from pointerdown and that it starts at release', () => {
    expect(m.latency).toBeGreaterThanOrEqual(100);
    expect(m.latency).toBeLessThanOrEqual(120);
    expect(m.startsAtRelease).toBe(true);
    expect(m.afterClick).toBe(false);
  });
  it('reads the scale and the main change from the animation', () => {
    expect(m.headline?.scaleMin).toBeCloseTo(0.98, 2);
    expect(m.mainMs).toBe(70);
    expect(m.mainSource).toBe('animation');
  });
  it('fails the rich profile on latency and duration, and the audit calls it invisible', () => {
    const checks = richChecks(button, m, 'web');
    expect(checks.find((c) => c.id === 'latency')?.pass).toBe(false);
    expect(checks.find((c) => c.id === 'duration')?.pass).toBe(false);
    expect(checks.find((c) => c.id === 'size')?.pass).toBe(false);
    expect(auditCall(button, m).call).toBe('invisible');
  });
});

describe('analyze: a press under the finger that is big and slow enough', () => {
  // Finger down at 50ms; the root shrinks to 0.9 over 240ms from the next frame; a label 10px away fades in over 200ms.
  const rec = recording(
    60,
    (t) => {
      const p = t < 60 ? 0 : Math.min(1, (t - 60) / 240);
      const k = 1 - 0.1 * p;
      const q = t < 60 ? 0 : Math.min(1, (t - 60) / 200);
      return {
        1: snap({ w: 100 * k, x: 100 + (100 - 100 * k) / 2 }),
        2: snap({ x: 300, w: 60, h: 20, y: 110 + 10 * (1 - q), o: q, eo: q, bg: 'rgba(0, 0, 0, 0)', p: 1 }),
      };
    },
    { metas: [meta(1, { desc: 'button' }), meta(2, { desc: 'span/status', part: 'status' })], events: [['pointerdown', 50], ['pointerup', 400]], head: 1, animations: [anim(1, 60, 240), anim(2, 60, 200, { name: 'opacity', props: ['opacity'] })] },
  );
  const m = analyze(rec);
  it('passes every rich check', () => {
    const checks = richChecks(button, m, 'web');
    for (const c of checks) expect({ id: c.id, pass: c.pass, measured: c.measured }).toMatchObject({ id: c.id, pass: true });
    expect(m.latency).toBeLessThanOrEqual(32);
    expect(m.secondaries.map((t) => t.part)).toContain('status');
  });
});

describe('analyze: cuts', () => {
  it('flags a panel that appears in one frame with no animation, and the audit calls it wrong', () => {
    const rec = recording(30, (t) => (t < 200 ? {} : { 5: snap({ w: 300, h: 200 }) }), { metas: [meta(5, { desc: 'div/panel[dialog]', part: 'panel', group: 'overlay' })], events: [['pointerdown', 50], ['pointerup', 140], ['click', 150]], head: 5 });
    const m = analyze(rec);
    expect(m.cuts.map((t) => t.cut?.kind)).toEqual(['appear']);
    expect(auditCall(dialog, m).call).toBe('wrong');
  });
  it('does not flag an appearance that an animation drives', () => {
    const rec = recording(30, (t) => (t < 200 ? {} : { 5: snap({ w: 300, h: 200 }) }), { metas: [meta(5, { desc: 'div/panel[dialog]', part: 'panel', group: 'overlay' })], events: [['pointerdown', 50]], head: 5, animations: [anim(5, 200.4, 200)] });
    expect(analyze(rec).cuts).toHaveLength(0);
  });
  it('flags a neighbour that jumps 49px in one frame', () => {
    const rec = recording(
      30,
      (t) => ({ 1: snap({ x: 0, y: 0, w: 400, h: 300, bg: 'rgba(0, 0, 0, 0)', p: 0 }), 2: snap({ x: 0, y: t < 200 ? 50 : 99, w: 400, h: 36 }) }),
      { metas: [meta(1, { desc: 'accordion' }), meta(2, { desc: 'div/item', part: 'item', parent: 1 })], events: [['pointerdown', 50]], head: 1 },
    );
    const m = analyze(rec);
    expect(m.cuts[0]?.cut).toMatchObject({ kind: 'jump', size: 49 });
  });
});

describe('buildSeries', () => {
  it('joins a part that React replaced with a new node on the same frame', () => {
    const rec = recording(20, (t) => (t < 100 ? { 1: snap({ x: 10 }) } : { 2: snap({ x: 10 + Math.min(60, (t - 100) / 2) }) }), { metas: [meta(1, { part: 'indicator' }), meta(2, { part: 'indicator' })], events: [['pointerdown', 40]], head: 2 });
    const { series, merged } = buildSeries(rec);
    expect(series.size).toBe(1);
    expect(merged.get(1)).toEqual([2]);
    const m = analyze(rec);
    expect(m.headline?.travel).toBeGreaterThan(50);
    expect(m.cuts).toHaveLength(0);
  });
});

describe('analyzeHold', () => {
  it('measures a press shown under the finger for the whole hold', () => {
    const rec = recording(50, (t) => ({ 1: snap({ bg: t >= 66 && t < 640 ? 'rgb(0, 0, 180)' : 'rgb(0, 0, 255)' }) }), { metas: [meta(1)], events: [['pointerdown', 50], ['pointerup', 650]] });
    const h = analyzeHold(rec);
    expect(h.onAfter).toBeLessThanOrEqual(32);
    expect(h.share).toBeGreaterThanOrEqual(0.95);
  });
  it('reports nothing shown when the press waits for release', () => {
    const rec = recording(50, (t) => ({ 1: snap({ bg: t >= 660 ? 'rgb(0, 0, 180)' : 'rgb(0, 0, 255)' }) }), { metas: [meta(1)], events: [['pointerdown', 50], ['pointerup', 650]] });
    expect(analyzeHold(rec).onAfter).toBeNull();
  });
});

describe('easing', () => {
  it('reads named curves and cubic-bezier, and compares control points within 0.02', () => {
    expect(bezierOf('ease')).toEqual([0.25, 0.1, 0.25, 1]);
    expect(bezierOf('cubic-bezier(0.2, 0.8, 0.2, 1)')).toEqual([0.2, 0.8, 0.2, 1]);
    expect(sameEasing('ease', 'cubic-bezier(0.25, 0.11, 0.26, 1)')).toBe(true);
    expect(sameEasing('ease', 'ease-out')).toBe(false);
    expect(sameEasing('ease', 'linear(0 0%, 0.5 50%, 1 100%)')).toBe(false);
  });
});

describe('quiet profile', () => {
  it('has a source entry with a file for each sample of the R0.8 baseline', () => {
    for (const style of ['studio', 'desk']) for (const id of ['button', 'switch']) expect(quietSource(style, id)?.from).toMatch(/\.css/);
    expect(QUIET_SOURCES.every((s) => !/vendor\//.test(s.from))).toBe(true);
  });
  it('passes a measure equal to the source and fails one with a transform press', () => {
    const src = quietSource('studio', 'button');
    const rec = recording(40, (t) => ({ 1: snap({ bg: t >= 60 ? 'rgb(0, 0, 200)' : 'rgb(0, 0, 255)' }) }), { metas: [meta(1)], events: [['pointerdown', 50]], head: 1, animations: [anim(1, 60, 150, { name: 'background-color', props: ['backgroundColor'] })] });
    expect(quietChecks(analyze(rec), src).every((c) => c.pass)).toBe(true);
    const pressed = recording(40, (t) => ({ 1: snap({ w: t >= 60 ? 96 : 100 }) }), { metas: [meta(1)], events: [['pointerdown', 50]], head: 1, animations: [anim(1, 60, 70)] });
    const checks = quietChecks(analyze(pressed), src);
    expect(checks.find((c) => c.id === 'scale')?.pass).toBe(false);
    expect(checks.find((c) => c.id === 'duration')?.pass).toBe(false);
  });
});

describe('calibration', () => {
  it('lists the twenty components of the audit, nine invisible and four wrong', () => {
    expect(AUDIT_TABLE).toHaveLength(20);
    expect(AUDIT_TABLE.filter((r) => r.call === 'invisible')).toHaveLength(9);
    expect(AUDIT_TABLE.filter((r) => r.call === 'wrong')).toHaveLength(4);
    for (const r of AUDIT_TABLE) expect(findInteraction(r.id)).toBeDefined();
  });
  it('accepts a value within 10 percent and refuses one outside it', () => {
    expect(within(70, 76)).toBe(true);
    expect(within(70, 78)).toBe(false);
    expect(within(4, 4.8, 0.5)).toBe(true);
  });
  it('fails when a component was not run', () => {
    const res = compareWithAudit([] as InteractionResult[]);
    expect(res.pass).toBe(false);
    expect(res.calls.every((c) => c.gate === 'not run')).toBe(true);
  });
});

describe('command line', () => {
  it('reads the plan form of the command', () => {
    const a = parseArgs(['--component', 'button,switch', '--style', 'neutral', '--platform', 'android']);
    expect(a.ids).toEqual(['button', 'switch']);
    expect(a.styles).toEqual(['neutral']);
    expect(a.platforms).toEqual(['android']);
    expect(() => parseArgs(['--platform', 'windows'])).toThrow(/Unknown platform/);
  });
  it('picks the iPhone for ios and the Pixel otherwise', () => {
    expect(devicesFor('ios', null)).toEqual(['iphone']);
    expect(devicesFor('auto', null)).toEqual(['pixel']);
    expect(devicesFor('web', ['iphone', 'pixel'])).toEqual(['iphone', 'pixel']);
  });
  it('builds the gallery address with the axes and leaves platform out for auto', () => {
    expect(pageUrl('http://h', button, 'liquid', 'auto', 'light')).toBe('http://h/c/button?style=liquid&scheme=light&dir=ltr&lang=en&case=variants&chrome=0');
    expect(pageUrl('http://h', button, 'neutral', 'ios', 'dark')).toContain('platform=ios');
  });
  it('gives Studio and Desk the quiet profile and the rest the rich one', () => {
    expect(profileFor('studio')).toBe('quiet');
    expect(profileFor('desk')).toBe('quiet');
    expect(profileFor('neutral')).toBe('rich');
    expect(profileFor('liquid')).toBe('rich');
  });
  it('has a unique id and a headline for every interaction', () => {
    expect(new Set(INTERACTIONS.map((i) => i.id)).size).toBe(INTERACTIONS.length);
    for (const i of INTERACTIONS) expect(i.headline).not.toBe('');
  });
});

describe('source repos', () => {
  it('names no path under the vendor folder of Figma-Killer-2 in any gate file', () => {
    const dir = import.meta.dirname;
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.test.ts')) continue;
      expect(readFileSync(join(dir, f), 'utf8')).not.toMatch(/vendor\/|alm-design-system/);
    }
  });
});
