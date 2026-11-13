import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { between, parseDuration, settled, tokenVar } from './core';
import {
  animateWindow,
  windowClose,
  windowGrow,
  windowMinimize,
  windowMotionFor,
  windowZoom,
  WINDOW_REST_SCALE,
} from './window';

const trigger = { x: 20, y: 30, width: 100, height: 40 };
const win = { x: 220, y: 130, width: 400, height: 200 };

/** Every property a keyframe sets, apart from offset. */
function animated(frames: Keyframe[]): string[] {
  const props = new Set<string>();
  for (const f of frames) for (const k of Object.keys(f)) if (k !== 'offset' && k !== 'easing') props.add(k);
  return [...props].sort();
}

describe('window patterns', () => {
  it('grow draws the window over its trigger first and ends with no transform', () => {
    const spec = windowGrow({ from: trigger, to: win });
    expect(spec.name).toBe('window-grow');
    expect(spec.duration).toBe('duration.window-open');
    expect(spec.easing).toBe('ease.window');
    expect(spec.keyframes[0]?.transform).toBe(between(trigger, win));
    expect(spec.keyframes[0]?.transform).toBe('translate(-200px, -100px) scale(0.25, 0.2)');
    expect(spec.keyframes.at(-1)?.transform).toBe('none');
    expect(spec.keyframes.at(-1)?.opacity).toBe(1);
  });

  it('grow without a trigger scales up from 92%', () => {
    const spec = windowGrow({ to: win });
    expect(spec.keyframes[0]).toEqual({ transform: 'scale(0.92)', opacity: 0 });
    expect(spec.origin).toBe('50% 50%');
    expect(windowGrow({ from: trigger, to: win }).origin).toBe('0 0');
    expect(windowGrow({ from: { x: 0, y: 0, width: 1, height: 1 }, to: win }).keyframes[0]?.transform).toBe('scale(0.92)');
  });

  it('close shrinks back into the trigger and holds the last frame', () => {
    const spec = windowClose({ from: win, to: trigger });
    expect(spec.fill).toBe('forwards');
    expect(spec.duration).toBe('duration.window-close');
    expect(spec.keyframes.at(-1)).toMatchObject({ transform: between(trigger, win), opacity: 0 });
    expect(windowClose({ from: win }).easing).toBe('ease.exit');
  });

  it('zoom is a FLIP from the old frame, and nothing when reduced', () => {
    const spec = windowZoom({ from: trigger, to: win });
    expect(spec.duration).toBe('duration.window-zoom');
    expect(spec.keyframes[0]?.transform).toBe(between(trigger, win));
    expect(windowZoom({ from: trigger, to: win, reduced: true }).keyframes).toEqual([]);
  });

  it('minimize falls toward the target, bottom center first', () => {
    const dock = { x: 476, y: 744, width: 48, height: 48 };
    const spec = windowMinimize({ from: win, to: dock });
    expect(spec.keyframes).toHaveLength(3);
    expect(spec.origin).toBe('50% 100%');
    expect(spec.keyframes.at(-1)?.opacity).toBe(0);
    expect(String(spec.keyframes.at(-1)?.transform)).toMatch(/^translate\(80px, 438px\) scale\(0\.12\)$/);
  });

  it('keyframes hold only transform and opacity in every pattern, the origin is set apart', () => {
    for (const spec of [windowGrow({ from: trigger, to: win }), windowClose({ from: win, to: trigger }), windowZoom({ from: trigger, to: win }), windowMinimize({ from: win, to: trigger })]) {
      for (const p of animated(spec.keyframes)) expect(['opacity', 'transform']).toContain(p);
    }
  });

  it('the reduced forms only fade, on duration.base', () => {
    for (const spec of [windowGrow({ from: trigger, to: win, reduced: true }), windowClose({ reduced: true }), windowMinimize({ reduced: true })]) {
      expect(animated(spec.keyframes)).toEqual(['opacity']);
      expect(spec.duration).toBe('duration.base');
    }
  });

  it('a preset picks the form: grow plays the pattern, fade its fade, none nothing', () => {
    expect(windowMotionFor('grow', 'grow', { from: trigger, to: win })?.keyframes[0]?.transform).toBe(between(trigger, win));
    expect(animated(windowMotionFor('fade', 'grow', { from: trigger, to: win })?.keyframes ?? [])).toEqual(['opacity']);
    expect(windowMotionFor('fade', 'zoom', { from: trigger, to: win })).toBeNull();
    expect(windowMotionFor('none', 'close')).toBeNull();
    expect(animated(windowMotionFor('grow', 'close', { reduced: true })?.keyframes ?? [])).toEqual(['opacity']);
  });
});

describe('web helper', () => {
  it('names the CSS variable of a token and parses times', () => {
    expect(tokenVar('duration.window-open')).toBe('--ds-duration-window-open');
    expect(tokenVar('ease.window', 'x')).toBe('--x-ease-window');
    expect(parseDuration('300ms')).toBe(300);
    expect(parseDuration(' 0.3s ')).toBe(300);
    expect(parseDuration('0ms')).toBe(0);
    expect(parseDuration('')).toBe(0);
  });

  it('plays the pattern with the token timing read from the element', () => {
    const animate = vi.fn(() => ({ finished: Promise.resolve() }) as unknown as Animation);
    const el = { animate, getAnimations: () => [], style: {} as CSSStyleDeclaration } as unknown as HTMLElement;
    const style = { getPropertyValue: (name: string) => ({ '--ds-duration-window-open': '300ms', '--ds-ease-window': 'cubic-bezier(0.2, 0.8, 0.2, 1)' })[name] ?? '' };
    vi.stubGlobal('getComputedStyle', () => style);
    const a = animateWindow(el, 'grow', { from: trigger, to: win, reduced: false });
    expect(a).not.toBeNull();
    expect(animate).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ id: 'ds-motion:window-grow', duration: 300, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'none', iterations: 1 }));
    expect(el.style.transformOrigin).toBe('0 0');
    expect(animateWindow(el, 'zoom', { from: trigger, to: win, mode: 'fade' })).toBeNull();
    expect(animateWindow({} as HTMLElement, 'grow', { reduced: false })).toBeNull();
    vi.unstubAllGlobals();
  });

  it('plays the timing of the style preset row in the full form only (order 1.29)', () => {
    const animate = vi.fn(() => ({ finished: Promise.resolve() }) as unknown as Animation);
    const el = { animate, getAnimations: () => [], style: {} as CSSStyleDeclaration } as unknown as HTMLElement;
    const vars: Record<string, string> = {
      '--ds-duration-window-open': '300ms',
      '--ds-ease-window': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      '--ds-duration-spring-bouncy': '140ms',
      '--ds-ease-spring-bouncy': 'steps(3, end)',
      '--ds-duration-slow': '180ms',
      '--ds-ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      '--ds-duration-moderate': '150ms',
      '--ds-ease-exit': 'cubic-bezier(0.4, 0, 1, 1)',
      '--ds-duration-base': '120ms',
    };
    vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: (name: string) => vars[name] ?? '' }));
    const last = () => (animate.mock.calls.at(-1) as unknown as [Keyframe[], KeyframeAnimationOptions])[1];

    // Studio: one ease for both phases, the window duration kept.
    animateWindow(el, 'grow', { from: trigger, to: win, reduced: false, preset: { mode: 'full', easing: 'ease.spring-bouncy' } });
    expect(last()).toMatchObject({ duration: 300, easing: 'steps(3, end)' });

    // Neutral: enter and exit timing; close is the exit phase.
    const neutralGrow = { mode: 'full', enter: { duration: 'duration.slow', easing: 'ease.out' }, exit: { duration: 'duration.moderate', easing: 'ease.exit' } } as const;
    animateWindow(el, 'grow', { from: trigger, to: win, reduced: false, preset: neutralGrow });
    expect(last()).toMatchObject({ duration: 180, easing: 'cubic-bezier(0, 0, 0.2, 1)' });
    animateWindow(el, 'close', { from: win, to: trigger, reduced: false, preset: neutralGrow });
    expect(last()).toMatchObject({ duration: 150, easing: 'cubic-bezier(0.4, 0, 1, 1)' });

    // The reduced form, and the fade mode, keep their own timing.
    animateWindow(el, 'grow', { from: trigger, to: win, reduced: true, preset: neutralGrow });
    expect(last()).toMatchObject({ duration: 120 });
    animateWindow(el, 'grow', { from: trigger, to: win, reduced: false, mode: 'fade', preset: neutralGrow });
    expect(last()).toMatchObject({ duration: 120 });

    // No preset: the pattern's own tokens, as before.
    animateWindow(el, 'grow', { from: trigger, to: win, reduced: false });
    expect(last()).toMatchObject({ duration: 300, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
    vi.unstubAllGlobals();
  });

  it('settled resolves for null, a finished and a cancelled animation', async () => {
    await expect(settled(null)).resolves.toBeUndefined();
    await expect(settled({ finished: Promise.resolve() } as unknown as Animation)).resolves.toBeUndefined();
    await expect(settled({ finished: Promise.reject(new Error('AbortError')) } as unknown as Animation)).resolves.toBeUndefined();
  });
});

describe('window motion tokens', () => {
  it('WINDOW_REST_SCALE equals the token scale.window-enter', () => {
    const json = JSON.parse(readFileSync(new URL('../../tokens/src/base/scale.json', import.meta.url), 'utf8')) as {
      scale: Record<string, { $value: number }>;
    };
    expect(WINDOW_REST_SCALE).toBe(json.scale['window-enter']?.$value);
  });

  it('minimize and zoom read their own duration tokens', () => {
    expect(windowMinimize({ from: win, to: trigger }).duration).toBe('duration.window-minimize');
    expect(windowZoom({ from: trigger, to: win }).duration).toBe('duration.window-zoom');
  });
});
