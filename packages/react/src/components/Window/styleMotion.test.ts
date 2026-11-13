import { describe, expect, it } from 'vitest';
import desk from '@the-system/styles/desk/motion';
import liquid from '@the-system/styles/liquid/motion';
import neutral from '@the-system/styles/neutral/motion';
import studio from '@the-system/styles/studio/motion';
import { windowMotionMode, windowMotionPreset } from './styleMotion';

describe('window motion of a style (order 1.29)', () => {
  it('has a row for every style with a motion preset, so none of them falls back to the fade', () => {
    for (const style of [desk, liquid, neutral, studio]) expect(windowMotionMode(style.id)).toBe(style.window);
    expect(windowMotionMode(neutral.id)).toBe('grow');
    expect(windowMotionMode('unknown')).toBe('fade');
  });

  it('gives the preset row of each window pattern, close as the exit of window-grow', () => {
    expect(windowMotionPreset(studio.id, 'grow')).toEqual({ mode: 'full', easing: 'ease.spring-bouncy' });
    expect(windowMotionPreset(studio.id, 'zoom')).toEqual({ mode: 'full', easing: 'ease.spring-bouncy' });
    expect(windowMotionPreset(neutral.id, 'close')?.exit).toEqual({ duration: 'duration.moderate', easing: 'ease.exit' });
    expect(windowMotionPreset(neutral.id, 'minimize')).toEqual({ mode: 'full', duration: 'duration.slow', easing: 'ease.out' });
    expect(windowMotionPreset('unknown', 'grow')).toBeUndefined();
  });
});
