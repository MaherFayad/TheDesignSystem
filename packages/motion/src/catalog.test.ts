import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { catalog, getPattern, isPatternId } from './catalog';
import { animatedProperties, PATTERN_IDS, tokenVar, type MotionInput, type MotionPattern, type MotionSpec, type PatternId } from './core';
import { tokenNode } from './testing/base-tokens';

const rect = (x: number, y: number, width: number, height: number) => ({ x, y, width, height });
const a = rect(20, 30, 100, 40);
const b = rect(220, 130, 400, 200);

/**
 * Inputs that reach every branch of each pattern: both phases, both
 * directions, and the pattern's own options.
 */
const inputs: Record<PatternId, MotionInput[]> = {
  'fade-rise': [{}, { phase: 'exit' }],
  'menu-scale': [{}, { phase: 'exit' }],
  dialog: [{}, { phase: 'exit' }],
  sheet: [{}, { phase: 'exit' }, { side: 'start', dir: 'rtl' } as MotionInput, { side: 'end' } as MotionInput, { side: 'top' } as MotionInput],
  toast: [{}, { phase: 'exit' }, { edge: 'top' } as MotionInput],
  'accordion-height': [{}, { phase: 'exit' }],
  'tab-indicator': [{ from: a, to: b } as MotionInput],
  'list-stagger': [{}, { index: 3 } as MotionInput, { index: 40 } as MotionInput],
  'drag-drop': [{ step: 'lift' } as MotionInput, { from: a, to: b } as MotionInput],
  'window-grow': [{ from: a, to: b } as MotionInput, {}, { phase: 'exit', from: b, to: a } as MotionInput, { phase: 'exit' }],
  'window-zoom': [{ from: a, to: b } as MotionInput],
  'window-minimize': [{ from: b, to: a } as MotionInput, {}],
  'skeleton-shimmer': [{}, { dir: 'rtl' }],
  spinner: [{}],
  'number-roll': [{}, { phase: 'exit' }, { direction: 'down' } as MotionInput],
  'chart-draw': [{}, { axis: 'block' } as MotionInput, { dir: 'rtl' }],
  thinking: [{ index: 0 } as MotionInput, { index: 2 } as MotionInput],
  'streaming-text': [{}],
  fade: [{}, { phase: 'exit' }],
  press: [{}, { phase: 'exit' }],
  shake: [{}, { swings: 1 } as MotionInput, { swings: 3, dir: 'rtl' } as MotionInput, { swings: 1, toward: 'end' } as MotionInput, { swings: 2, toward: 'start', dir: 'rtl' } as MotionInput],
  pop: [{}, { phase: 'exit' }, { index: 3 } as MotionInput, { index: 40 } as MotionInput],
  swap: [{}, { phase: 'exit' }, { direction: 'down' } as MotionInput, { direction: 'down', phase: 'exit' } as MotionInput],
};

const entries = Object.entries(catalog) as [PatternId, MotionPattern<MotionInput>][];

/** Every token a spec reads: its timing and every var() in its keyframes. A spec with no keyframes reads nothing. */
function tokensOf(spec: MotionSpec): string[] {
  if (spec.keyframes.length === 0) return [];
  const out: string[] = [spec.duration];
  if (spec.easing !== 'linear') out.push(spec.easing);
  if (spec.delay) out.push(spec.delay);
  for (const f of spec.keyframes) {
    for (const m of String(f.transform ?? '').matchAll(/var\(--ds-([a-z]+)-([a-z0-9-]+),/g)) out.push(`${m[1]}.${m[2]}`);
  }
  return out;
}

describe('the catalog', () => {
  it('holds the 18 ids of order 1.11, fade and press, and the three of order 1.21, each under its own id', () => {
    expect(Object.keys(catalog).sort()).toEqual([...PATTERN_IDS].sort());
    expect(PATTERN_IDS).toHaveLength(23);
    for (const [id, p] of entries) expect(p.id).toBe(id);
    expect(isPatternId('spinner')).toBe(true);
    expect(isPatternId('fade')).toBe(true);
    expect(isPatternId('press')).toBe(true);
    expect(isPatternId('pulse')).toBe(false);
    expect(getPattern('dialog')?.id).toBe('dialog');
    expect(getPattern('nope')).toBeUndefined();
  });

  describe.each(entries)('%s', (id, pattern) => {
    it('names only tokens that exist in packages/tokens/src/base', () => {
      expect(pattern.tokens.length).toBeGreaterThan(0);
      for (const t of pattern.tokens) expect(tokenNode(t), t).toBeDefined();
    });

    it('lists every token its full and reduced forms read', () => {
      for (const input of inputs[id]) {
        for (const spec of [pattern.spec(input), pattern.reducedSpec(input)]) {
          for (const t of tokensOf(spec)) expect(pattern.tokens as readonly string[], `${id} reads ${t}`).toContain(t);
        }
      }
    });

    it('moves only transform and opacity in its full form', () => {
      for (const input of inputs[id]) {
        const frames = pattern.keyframes(input);
        expect(frames.length, `${id} has keyframes`).toBeGreaterThan(0);
        for (const p of animatedProperties(frames)) expect(['opacity', 'transform']).toContain(p);
      }
    });

    it('has a reduced form that is opacity only or no motion', () => {
      for (const input of inputs[id]) {
        const props = animatedProperties(pattern.reduced(input));
        expect([[], ['opacity']]).toContainEqual(props);
      }
      expect(pattern.native.reducedDuration === 0).toBe(pattern.reduced(inputs[id][0]).length === 0);
    });

    it('gives native numbers for Reanimated', () => {
      expect(typeof pattern.native.duration).toBe('number');
      expect(pattern.native.duration).toBeGreaterThan(0);
      expect(pattern.native.easing).toHaveLength(4);
      for (const v of Object.values(pattern.native)) if (typeof v === 'number') expect(Number.isFinite(v), `${id} native holds a finite number`).toBe(true);
    });
  });

  it('keeps the values of the components that already play a pattern', () => {
    expect(catalog.dialog.keyframes()[0]).toEqual({
      transform: 'translateY(var(--ds-space-2xs, 5px)) scale(var(--ds-scale-dialog-enter, 0.98))',
      opacity: 0,
    });
    expect(catalog.toast.spec().duration).toBe('duration.toast-enter');
    expect(catalog.toast.spec({ phase: 'exit' }).duration).toBe('duration.toast-exit');
    expect(catalog['window-grow'].spec({ phase: 'exit' }).keyframes.at(-1)).toEqual({ transform: 'scale(0.92)', opacity: 0 });
  });

  it('flips the inline axis in RTL', () => {
    expect(catalog.sheet.keyframes({ side: 'start' })[0]?.transform).toBe('translateX(-100%)');
    expect(catalog.sheet.keyframes({ side: 'start', dir: 'rtl' })[0]?.transform).toBe('translateX(100%)');
    expect(catalog['skeleton-shimmer'].keyframes({ dir: 'rtl' })[0]?.transform).toBe('translateX(100%)');
    expect(catalog['chart-draw'].spec({ dir: 'rtl' }).origin).toBe('100% 50%');
  });

  it('stops loops that are not the activity itself before five seconds', () => {
    for (const id of ['skeleton-shimmer', 'thinking'] as const) {
      const s = catalog[id].spec();
      expect(Number.isFinite(s.iterations), id).toBe(true);
      expect((s.iterations ?? 1) * catalog[id].native.duration, id).toBeLessThan(5000);
      expect(s.loopLimitMs, id).toBe(5000);
    }
  });

  it('caps the stagger', () => {
    expect(catalog['list-stagger'].spec({ index: 3 }).delaySteps).toBe(3);
    expect(catalog['list-stagger'].spec({ index: 40 }).delaySteps).toBe(8);
  });
});

describe('animate', () => {
  function fakeEl(direction = 'ltr') {
    const running = { id: 'ds-motion:dialog', cancel: vi.fn() };
    const animate = vi.fn(() => ({ finished: Promise.resolve() }) as unknown as Animation);
    const el = { animate, getAnimations: () => [running], style: {} as CSSStyleDeclaration } as unknown as HTMLElement;
    const vars: Record<string, string> = {
      '--ds-duration-base': '120ms',
      '--ds-duration-slow': '180ms',
      '--ds-ease-out': 'cubic-bezier(0, 0, 0.58, 1)',
      '--ds-ease-reveal': 'cubic-bezier(0.22, 1, 0.36, 1)',
      '--ds-delay-reveal-step': '80ms',
    };
    vi.stubGlobal('getComputedStyle', () => ({ direction, getPropertyValue: (n: string) => vars[n] ?? '' }));
    return { el, animate, running };
  }

  it('plays the full form with token timing, and replaces its own running animation', () => {
    const { el, animate, running } = fakeEl();
    expect(catalog.dialog.animate(el, { reduced: false })).not.toBeNull();
    expect(running.cancel).toHaveBeenCalled();
    expect(animate).toHaveBeenCalledWith(catalog.dialog.keyframes(), {
      id: 'ds-motion:dialog',
      duration: 120,
      easing: 'cubic-bezier(0, 0, 0.58, 1)',
      fill: 'none',
      iterations: 1,
      delay: 0,
    });
    vi.unstubAllGlobals();
  });

  it('delays a staggered item by its steps', () => {
    const { el, animate } = fakeEl();
    catalog['list-stagger'].animate(el, { index: 2, reduced: false });
    expect(animate).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ delay: 160, fill: 'backwards' }));
    vi.unstubAllGlobals();
  });

  it('reads the direction from the element', () => {
    const { el, animate } = fakeEl('rtl');
    catalog['skeleton-shimmer'].animate(el, { reduced: false });
    expect(animate).toHaveBeenCalledWith(catalog['skeleton-shimmer'].keyframes({ dir: 'rtl' }), expect.anything());
    vi.unstubAllGlobals();
  });

  it('follows the preset and reduced motion', () => {
    const { el, animate } = fakeEl();
    expect(catalog.dialog.animate(el, { preset: { mode: 'none' } })).toBeNull();
    expect(catalog.spinner.animate(el, { reduced: true })).toBeNull();
    catalog.dialog.animate(el, { reduced: true });
    expect(animate).toHaveBeenLastCalledWith([{ opacity: 0 }, { opacity: 1 }], expect.anything());
    catalog.dialog.animate(el, { reduced: false, preset: { mode: 'reduced' } });
    expect(animate).toHaveBeenLastCalledWith([{ opacity: 0 }, { opacity: 1 }], expect.anything());
    expect(catalog.dialog.specFor({}, { reduced: false, preset: { mode: 'full', duration: 'duration.slow' } })?.duration).toBe('duration.slow');
    expect(catalog.dialog.animate({} as HTMLElement, { reduced: false })).toBeNull();
    vi.unstubAllGlobals();
  });

  it('names the CSS variable of a token', () => {
    expect(tokenVar('scale.dialog-enter')).toBe('--ds-scale-dialog-enter');
  });
});

// ---------------------------------------------------------------- manifests

describe('manifests name catalog patterns', () => {
  // The source manifests, not manifests.gen.json, so a stale generated file
  // cannot hide a new name. There is no allow list: any name that is not a
  // catalog id or `none` fails.
  const dir = new URL('../../manifest/src/component/', import.meta.url);
  const manifests = readdirSync(dir)
    .filter((f) => f.endsWith('.manifest.json'))
    .map((f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as { name: string; motion?: string });

  it('reads the component manifests', () => {
    expect(manifests.length).toBeGreaterThan(50);
  });

  it('every motion value is a catalog id or none', () => {
    const unknown = manifests.filter((m) => typeof m.motion === 'string' && m.motion !== 'none' && !isPatternId(m.motion));
    expect(unknown.map((m) => `${m.name}: ${m.motion}`)).toEqual([]);
  });
});

describe('the patterns of order 1.21', () => {
  it('shake swings at most three times, flips in RTL and plays once', () => {
    const frames = catalog.shake.keyframes({ swings: 3 });
    expect(frames).toHaveLength(8);
    expect(catalog.shake.keyframes({ swings: 9 as 3 })).toHaveLength(8);
    expect(catalog.shake.spec().iterations ?? 1).toBe(1);
    expect(String(catalog.shake.keyframes({ swings: 1, toward: 'end' })[1]?.transform)).toContain('calc(1 *');
    expect(String(catalog.shake.keyframes({ swings: 1, toward: 'end', dir: 'rtl' })[1]?.transform)).toContain('calc(-1 *');
    expect(catalog.shake.reduced()).toEqual([]);
  });

  it('pop waits at most six half steps in a run', () => {
    expect(catalog.pop.spec({ index: 2 }).delaySteps).toBe(1);
    expect(catalog.pop.spec({ index: 40 }).delaySteps).toBe(3);
    expect(catalog.pop.spec().delay).toBeUndefined();
  });

  it('swap moves the old content out one way and the new in from the other', () => {
    const outUp = String(catalog.swap.keyframes({ phase: 'exit' })[1]?.transform);
    const inUp = String(catalog.swap.keyframes()[0]?.transform);
    expect(outUp).toContain('calc(-1 *');
    expect(inUp).not.toContain('calc(-1 *');
    expect(catalog.swap.spec({ phase: 'exit' }).fill).toBe('forwards');
  });
});
