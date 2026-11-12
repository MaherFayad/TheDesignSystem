import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isSpaceStep, spaceSteps } from './space';

describe('spaceSteps', () => {
  it('starts with none and has no duplicates', () => {
    expect(spaceSteps[0]).toBe('none');
    expect(new Set(spaceSteps).size).toBe(spaceSteps.length);
  });

  it('names only steps that exist in the space token scale', () => {
    const base = JSON.parse(
      readFileSync(join(import.meta.dirname, '../../tokens/src/base/space.json'), 'utf8'),
    ) as { space: Record<string, unknown> };
    for (const step of spaceSteps) {
      if (step === 'none') continue;
      expect(Object.keys(base.space), step).toContain(step);
    }
  });

  it('isSpaceStep accepts steps and rejects anything else', () => {
    expect(isSpaceStep('m')).toBe(true);
    expect(isSpaceStep('none')).toBe(true);
    expect(isSpaceStep('13xl')).toBe(false);
    expect(isSpaceStep(4)).toBe(false);
  });
});
