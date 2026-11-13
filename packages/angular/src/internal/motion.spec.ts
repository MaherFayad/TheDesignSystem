// The Angular motion player follows the style preset and the person's
// reduced motion setting, as React's useMotion.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DsTheme } from '../theme/theme';
import { injectMotion, motionApi, motionPresetFor, type DsMotionApi } from './motion';

@Component({
  selector: 'ds-motion-probe',
  template: ``,
})
class Probe {
  readonly motion: DsMotionApi = injectMotion();
}

@Component({
  imports: [DsTheme, Probe],
  template: `<div [dsTheme]="style()"><ds-motion-probe /></div>`,
})
class Host {
  readonly style = signal('studio');
}

describe('injectMotion', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-motion');
    vi.restoreAllMocks();
  });

  it('reads the preset of the nearest theme and follows a style change', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const probe = fixture.debugElement.query(By.directive(Probe)).componentInstance as Probe;
    expect(probe.motion.style().id).toBe('flat');
    expect(probe.motion.mode('error-shake')).toBe('none');
    fixture.componentInstance.style.set('desk');
    await fixture.whenStable();
    expect(probe.motion.style().id).toBe('window');
    expect(probe.motion.mode('error-shake')).toBe('full');
  });

  it('gives reduced under data-motion="reduce" and plays the reduced form', () => {
    const api = motionApi(signal(motionPresetFor(undefined)));
    expect(api.mode('error-shake')).toBe('full');
    document.documentElement.setAttribute('data-motion', 'reduce');
    expect(api.mode('error-shake')).toBe('reduced');
    const el = document.createElement('div');
    const animate = vi.fn(() => ({}) as Animation);
    (el as unknown as { animate: typeof animate }).animate = animate;
    // The shake has no reduced form: nothing plays.
    expect(api.play(el, 'shake', 'error-shake')).toBeNull();
    expect(animate).not.toHaveBeenCalled();
  });

  it('gives reduced under prefers-reduced-motion', () => {
    const api = motionApi(signal(motionPresetFor(undefined)));
    const had = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: (q: string) => ({ matches: q.includes('reduce') }) as MediaQueryList });
    try {
      expect(api.mode('toggle-pop')).toBe('reduced');
    } finally {
      if (had) Object.defineProperty(window, 'matchMedia', had);
      else delete (window as { matchMedia?: unknown }).matchMedia;
    }
  });

  it('plays nothing for a style that turns the interaction off, and nothing on a missing element', () => {
    const api = motionApi(signal(motionPresetFor('flat')));
    const el = document.createElement('div');
    const animate = vi.fn(() => ({}) as Animation);
    (el as unknown as { animate: typeof animate }).animate = animate;
    expect(api.play(el, 'shake', 'error-shake')).toBeNull();
    expect(api.play(null, 'swap', 'copy-swap')).toBeNull();
    expect(animate).not.toHaveBeenCalled();
  });
});
