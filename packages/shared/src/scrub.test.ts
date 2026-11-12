// Ported from Figma-Killer-2 `ScrubInput/__tests__/numericExpression.test.ts`
// and `scrubMath.test.ts`. The values are numbers here, not CSS strings, so
// the cases that checked a unit on the output check the number and the
// unit rule of resolveCommit instead. Keywords (auto, fill, hug) are not
// part of this field.
import { describe, expect, it } from 'vitest';
import { evaluateExpression, formatScrub, nudgeStepFor, nudgeValue, resolveCommit, scrubValue } from './scrub';

describe('evaluateExpression', () => {
  it('evaluates a plain number, with and without a unit', () => {
    expect(evaluateExpression('50')).toEqual({ magnitude: 50, unit: '' });
    expect(evaluateExpression('120px')).toEqual({ magnitude: 120, unit: 'px' });
    expect(evaluateExpression('1.25rem')).toEqual({ magnitude: 1.25, unit: 'rem' });
    expect(evaluateExpression('-4%')).toEqual({ magnitude: -4, unit: '%' });
    expect(evaluateExpression('.5')).toEqual({ magnitude: 0.5, unit: '' });
  });

  it('evaluates the four operators', () => {
    expect(evaluateExpression('100/2')).toEqual({ magnitude: 50, unit: '' });
    expect(evaluateExpression('100+8')).toEqual({ magnitude: 108, unit: '' });
    expect(evaluateExpression('100*2')).toEqual({ magnitude: 200, unit: '' });
    expect(evaluateExpression('100-8')).toEqual({ magnitude: 92, unit: '' });
    expect(evaluateExpression('12*2')).toEqual({ magnitude: 24, unit: '' });
  });

  it('respects precedence and parentheses', () => {
    expect(evaluateExpression('2+3*4')).toEqual({ magnitude: 14, unit: '' });
    expect(evaluateExpression('(2+3)*4')).toEqual({ magnitude: 20, unit: '' });
    expect(evaluateExpression('(80 + 20) / 2')).toEqual({ magnitude: 50, unit: '' });
  });

  it('tolerates whitespace and unary signs', () => {
    expect(evaluateExpression('  100px  +  8  ')).toEqual({ magnitude: 108, unit: 'px' });
    expect(evaluateExpression('-10 + 4')).toEqual({ magnitude: -6, unit: '' });
    expect(evaluateExpression('10 - -4')).toEqual({ magnitude: 14, unit: '' });
  });

  it('carries the single unit seen through the whole expression', () => {
    expect(evaluateExpression('100px/2')).toEqual({ magnitude: 50, unit: 'px' });
    expect(evaluateExpression('2*8rem')).toEqual({ magnitude: 16, unit: 'rem' });
  });

  it('refuses a mix of two units rather than picking one', () => {
    expect(evaluateExpression('100px + 8em')).toBeNull();
    expect(evaluateExpression('50% - 4px')).toBeNull();
  });

  it('rounds away floating point dust', () => {
    expect(evaluateExpression('0.1 + 0.2')).toEqual({ magnitude: 0.3, unit: '' });
  });

  it('refuses everything outside the grammar', () => {
    expect(evaluateExpression('')).toBeNull();
    expect(evaluateExpression('auto')).toBeNull();
    expect(evaluateExpression('calc(100% - 8px)')).toBeNull();
    expect(evaluateExpression('var(--space-md)')).toBeNull();
    expect(evaluateExpression('10px 20px')).toBeNull();
    expect(evaluateExpression('#4f46e5')).toBeNull();
    expect(evaluateExpression('100 +')).toBeNull();
    expect(evaluateExpression('(100 + 8')).toBeNull();
    expect(evaluateExpression('100/0')).toBeNull();
  });

  it('reads Arabic Indic digits, the Arabic decimal mark and the times and divide signs', () => {
    expect(evaluateExpression('١٢*٢')).toEqual({ magnitude: 24, unit: '' });
    expect(evaluateExpression('١٢٫٥')).toEqual({ magnitude: 12.5, unit: '' });
    expect(evaluateExpression('6 × 7')).toEqual({ magnitude: 42, unit: '' });
    expect(evaluateExpression('9 ÷ 3')).toEqual({ magnitude: 3, unit: '' });
    expect(evaluateExpression('−5')).toEqual({ magnitude: -5, unit: '' });
    expect(evaluateExpression('45°')).toEqual({ magnitude: 45, unit: '°' });
  });
});

describe('resolveCommit', () => {
  it('takes a bare number in the field unit', () => {
    expect(resolveCommit('50', { unit: 'px' })).toBe(50);
    expect(resolveCommit('45', { unit: 'deg' })).toBe(45);
  });

  it('evaluates arithmetic on commit', () => {
    expect(resolveCommit('100/2', { unit: 'px' })).toBe(50);
    expect(resolveCommit('100 + 8', { unit: 'px' })).toBe(108);
    expect(resolveCommit('100px*2', { unit: 'px' })).toBe(200);
  });

  it('refuses a unit other than the field unit', () => {
    expect(resolveCommit('12rem', { unit: 'px' })).toBeNull();
    expect(resolveCommit('50%', { unit: 'px' })).toBeNull();
    expect(resolveCommit('50%', { unit: '%' })).toBe(50);
  });

  it('keeps the old value for anything it cannot reduce', () => {
    expect(resolveCommit('auto', { unit: 'px' })).toBeNull();
    expect(resolveCommit('calc(100% - 8px)', { unit: 'px' })).toBeNull();
    expect(resolveCommit('10px 20px', { unit: 'px' })).toBeNull();
  });

  it('keeps an empty commit empty, never a zero', () => {
    expect(resolveCommit('')).toBeNull();
    expect(resolveCommit('   ')).toBeNull();
  });

  it('clamps and rounds', () => {
    expect(resolveCommit('500', { max: 100 })).toBe(100);
    expect(resolveCommit('-5', { min: 0 })).toBe(0);
    expect(resolveCommit('1/3', { precision: 2 })).toBe(0.33);
  });
});

describe('formatScrub', () => {
  it('shows the number with Western digits', () => {
    expect(formatScrub(120)).toBe('120');
  });

  it('rounds to 2 decimal places by default', () => {
    expect(formatScrub(1.23456)).toBe('1.23');
    expect(formatScrub(1.23456, 3)).toBe('1.235');
  });

  it('drops trailing zeros', () => {
    expect(formatScrub(10.0)).toBe('10');
    expect(formatScrub(10.5)).toBe('10.5');
  });

  it('shows nothing for NaN', () => {
    expect(formatScrub(Number.NaN)).toBe('');
  });
});

describe('nudgeStepFor', () => {
  it('is one step, ten with Shift and a tenth with Alt', () => {
    expect(nudgeStepFor({ shiftKey: false, altKey: false })).toBe(1);
    expect(nudgeStepFor({ shiftKey: true, altKey: false })).toBe(10);
    expect(nudgeStepFor({ shiftKey: false, altKey: true })).toBe(0.1);
  });

  it('lets Alt win over Shift', () => {
    expect(nudgeStepFor({ shiftKey: true, altKey: true })).toBe(0.1);
  });

  it('scales with the step', () => {
    expect(nudgeStepFor({ shiftKey: false, altKey: false }, 5)).toBe(5);
    expect(nudgeStepFor({ shiftKey: true, altKey: false }, 5)).toBe(50);
    expect(nudgeStepFor({ shiftKey: false, altKey: true }, 0.1)).toBe(0.01);
  });
});

describe('scrubValue', () => {
  it('adds a positive pixel delta at one unit per pixel', () => {
    expect(scrubValue(100, 24, 1)).toBe(124);
  });

  it('subtracts a negative pixel delta', () => {
    expect(scrubValue(100, -24, 1)).toBe(76);
  });

  it('applies a coarse step (Shift held)', () => {
    expect(scrubValue(100, 5, 10)).toBe(150);
  });

  it('applies a fine step (Alt held)', () => {
    expect(scrubValue(100, 10, 0.1)).toBe(101);
    expect(scrubValue(100, 3, 0.1)).toBe(100.3);
  });

  it('clamps to a minimum and a maximum', () => {
    expect(scrubValue(5, -100, 1, { min: 0 })).toBe(0);
    expect(scrubValue(5, 1000, 1, { max: 100 })).toBe(100);
  });
});

describe('nudgeValue', () => {
  it('steps by one with no modifier', () => {
    expect(nudgeValue(10, 1, { shiftKey: false, altKey: false })).toBe(11);
    expect(nudgeValue(10, -1, { shiftKey: false, altKey: false })).toBe(9);
  });

  it('steps by ten with Shift and a tenth with Alt', () => {
    expect(nudgeValue(10, 1, { shiftKey: true, altKey: false })).toBe(20);
    expect(nudgeValue(10, 1, { shiftKey: false, altKey: true })).toBe(10.1);
  });

  it('honors a custom step', () => {
    expect(nudgeValue(10, 1, { shiftKey: false, altKey: false }, 5)).toBe(15);
    expect(nudgeValue(0.3, 1, { shiftKey: false, altKey: false }, 0.1)).toBe(0.4);
  });

  it('respects min and max while stepping', () => {
    expect(nudgeValue(0, -1, { shiftKey: false, altKey: false }, 1, { min: 0 })).toBe(0);
    expect(nudgeValue(99, 1, { shiftKey: true, altKey: false }, 1, { max: 100 })).toBe(100);
  });
});
