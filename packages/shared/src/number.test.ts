import { describe, expect, it } from 'vitest';
import { clamp, decimalPlaces, formatNumber, latinLocale, numberSeparators, parseNumber, snapToStep } from './number';

describe('latinLocale', () => {
  it('adds the Western numbering system', () => {
    expect(latinLocale('ar')).toBe('ar-u-nu-latn');
    expect(latinLocale('en-US')).toBe('en-US-u-nu-latn');
    expect(latinLocale(undefined)).toBe('en-u-nu-latn');
    expect(latinLocale('not a tag')).toBe('en-u-nu-latn');
  });
});

describe('numberSeparators', () => {
  it('reads the marks of a locale', () => {
    expect(numberSeparators('en')).toEqual({ decimal: '.', group: ',' });
    expect(numberSeparators('de')).toEqual({ decimal: ',', group: '.' });
  });
});

describe('formatNumber', () => {
  it('keeps Western digits under Arabic', () => {
    expect(formatNumber(1234.5, 'ar')).toMatch(/^1[,٬]?234[.٫]5$/);
    expect(formatNumber(1234.5, 'ar')).not.toMatch(/[٠-٩]/);
  });

  it('formats with options', () => {
    expect(formatNumber(0.25, 'en', { style: 'percent' })).toBe('25%');
    expect(formatNumber(12, 'en', { minimumFractionDigits: 2 })).toBe('12.00');
  });

  it('allows another numbering system on request', () => {
    expect(formatNumber(12, 'ar', { numberingSystem: 'arab' })).toBe('١٢');
  });

  it('gives an empty string for NaN', () => {
    expect(formatNumber(Number.NaN, 'en')).toBe('');
  });
});

describe('parseNumber', () => {
  it('reads plain numbers', () => {
    expect(parseNumber('12', 'en')).toBe(12);
    expect(parseNumber('-12.5', 'en')).toBe(-12.5);
    expect(parseNumber('+3', 'en')).toBe(3);
    expect(parseNumber('.5', 'en')).toBe(0.5);
    expect(parseNumber('−4', 'en')).toBe(-4);
  });

  it('reads group marks of the locale', () => {
    expect(parseNumber('1,234.5', 'en')).toBe(1234.5);
    expect(parseNumber('1.234,5', 'de')).toBe(1234.5);
  });

  it('reads Arabic Indic digits and the Arabic marks', () => {
    expect(parseNumber('١٢', 'ar')).toBe(12);
    expect(parseNumber('١٢٫٥', 'ar')).toBe(12.5);
    expect(parseNumber('١٬٢٣٤', 'ar')).toBe(1234);
    expect(parseNumber('١،٢٣٤', 'ar')).toBe(1234);
    expect(parseNumber('۱۲', 'en')).toBe(12);
  });

  it('drops bidi marks around a copied number', () => {
    expect(parseNumber('‏12‏', 'ar')).toBe(12);
  });

  it('gives NaN for anything else', () => {
    expect(parseNumber('', 'en')).toBeNaN();
    expect(parseNumber('abc', 'en')).toBeNaN();
    expect(parseNumber('12px', 'en')).toBeNaN();
    expect(parseNumber('1.2.3', 'en')).toBeNaN();
    expect(parseNumber('12*2', 'en')).toBeNaN();
  });
});

describe('clamp', () => {
  it('keeps a value within bounds, open when a bound is missing', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
    expect(clamp(11)).toBe(11);
    expect(clamp(11, undefined, Number.NaN)).toBe(11);
  });
});

describe('snapToStep', () => {
  it('snaps to the nearest step from zero', () => {
    expect(snapToStep(7, 5)).toBe(5);
    expect(snapToStep(8, 5)).toBe(10);
  });

  it('counts steps from min', () => {
    expect(snapToStep(4, 5, 2)).toBe(2);
    expect(snapToStep(5, 5, 2)).toBe(7);
  });

  it('removes floating point dust', () => {
    expect(snapToStep(0.1 + 0.2, 0.1)).toBe(0.3);
    expect(snapToStep(1.004, 0.01)).toBe(1);
    expect(snapToStep(0.7, 0.1, 0.1)).toBe(0.7);
  });

  it('stays inside max on a step', () => {
    expect(snapToStep(100, 3, 0, 10)).toBe(9);
    expect(snapToStep(-5, 1, 0, 10)).toBe(0);
  });

  it('leaves the value when the step is not positive', () => {
    expect(snapToStep(3.3, 0)).toBe(3.3);
  });
});

describe('decimalPlaces', () => {
  it('counts the decimals of a step', () => {
    expect(decimalPlaces(1)).toBe(0);
    expect(decimalPlaces(0.25)).toBe(2);
    expect(decimalPlaces(1e-7)).toBe(7);
  });
});
