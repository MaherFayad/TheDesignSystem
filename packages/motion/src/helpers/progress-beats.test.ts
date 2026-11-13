// @vitest-environment jsdom
// The small beats of round 3 (order 1.29): the step check and the meter value.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { landValue } from './meter-value';
import { CHECK_LENGTH, drawStepCheck } from './step-check';

afterEach(() => vi.restoreAllMocks());

describe('round 3 beats', () => {
  it('draws a step check from its short stroke, in full mode only', () => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const animate = vi.fn(() => ({}) as Animation);
    (path as unknown as { animate: typeof animate }).animate = animate;
    expect(drawStepCheck(path, 'reduced')).toBeNull();
    drawStepCheck(path, 'full');
    const [frames, options] = animate.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
    expect(frames[0]).toEqual({ strokeDasharray: `${CHECK_LENGTH} ${CHECK_LENGTH}`, strokeDashoffset: -CHECK_LENGTH });
    expect(options.id).toBe('ds-motion:stepper-check');
  });

  it('lands the meter value late in the reveal, from the muted text colour', () => {
    const value = document.createElement('span');
    const fill = document.createElement('span');
    const animate = vi.fn(() => ({}) as Animation);
    (value as unknown as { animate: typeof animate }).animate = animate;
    landValue(value, fill);
    const [frames, options] = animate.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
    expect(frames[0]).toEqual({ transform: 'translateY(var(--ds-distance-nudge))', color: 'var(--ds-color-text-muted)' });
    expect(options).toMatchObject({ id: 'ds-motion:meter-value', fill: 'backwards' });
  });
});
