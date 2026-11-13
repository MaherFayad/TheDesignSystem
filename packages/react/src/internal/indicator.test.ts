// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useActivated } from './indicator';

// The slide, the boxes and the small answers are tested with the helper
// (packages/motion/src/helpers/indicator.test.ts, order 1.29); this file keeps
// the React hooks.
describe('useActivated', () => {
  it('runs only when the flag turns on after the first paint', () => {
    const effect = vi.fn();
    const { rerender } = renderHook(({ on }) => useActivated(on, effect), { initialProps: { on: true } });
    expect(effect).not.toHaveBeenCalled();
    rerender({ on: false });
    rerender({ on: true });
    expect(effect).toHaveBeenCalledTimes(1);
  });
});
