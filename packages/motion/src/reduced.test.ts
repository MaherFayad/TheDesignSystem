import { afterEach, describe, expect, it, vi } from 'vitest';
import { catalog } from './catalog';
import { prefersReducedMotion, REDUCED_MOTION_ATTRIBUTE } from './core';

function stubPage(systemReduce: boolean, attr: string | null) {
  vi.stubGlobal('window', { matchMedia: () => ({ matches: systemReduce }) });
  vi.stubGlobal('document', { documentElement: { getAttribute: (n: string) => (n === REDUCED_MOTION_ATTRIBUTE ? attr : null) } });
}

afterEach(() => vi.unstubAllGlobals());

describe('reduced motion from the system or from the page', () => {
  it('follows the system setting', () => {
    stubPage(true, null);
    expect(prefersReducedMotion()).toBe(true);
    stubPage(false, null);
    expect(prefersReducedMotion()).toBe(false);
  });

  it('follows data-motion="reduce" on the root element, an in app setting (WCAG 2.3.3)', () => {
    stubPage(false, 'reduce');
    expect(prefersReducedMotion()).toBe(true);
    expect(catalog.shake.specFor({}, {})).toBeNull();
    expect(catalog.swap.specFor({}, {})?.keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);
  });

  it('is false where there is no window', () => {
    expect(prefersReducedMotion()).toBe(false);
  });
});
