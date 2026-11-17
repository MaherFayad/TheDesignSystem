import { describe, expect, it } from 'vitest';
import {
  colorContrast,
  colorDescribe,
  colorFromOklch,
  colorLanguage,
  colorLocale,
  colorName,
  colorParse,
  colorSwatchEdgeNeeded,
  colorSwatchGrid,
  colorToHex,
  colorToOklch,
  colorWords,
} from './color';

const ARABIC_INDIC = /[٠-٩۰-۹]/;

describe('colorParse and colorToHex', () => {
  it('reads hex in every length and rgb strings', () => {
    expect(colorParse('#1e6fd9')).toEqual({ r: 30, g: 111, b: 217, a: 1 });
    expect(colorParse('1E6FD9')).toEqual({ r: 30, g: 111, b: 217, a: 1 });
    expect(colorParse('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(colorParse('#0008')!.a).toBeCloseTo(0.533, 2);
    expect(colorParse('#80808080')!.a).toBeCloseTo(0.502, 2);
    expect(colorParse('rgb(10, 20, 30)')).toEqual({ r: 10, g: 20, b: 30, a: 1 });
    expect(colorParse('rgba(10 20 30 / 50%)')).toEqual({ r: 10, g: 20, b: 30, a: 0.5 });
    expect(colorParse('blue')).toBeNull();
    expect(colorParse('#12345')).toBeNull();
  });

  it('writes hex, with alpha only when not opaque', () => {
    expect(colorToHex({ r: 30, g: 111, b: 217, a: 1 })).toBe('#1e6fd9');
    expect(colorToHex({ r: 0, g: 0, b: 0, a: 0.5 })).toBe('#00000080');
  });
});

describe('OKLCH', () => {
  it('round trips a colour in gamut', () => {
    for (const hex of ['#1e6fd9', '#e03a3a', '#2fa84f', '#f5c518', '#7a7a7a']) {
      expect(colorToHex(colorFromOklch(colorToOklch(colorParse(hex)!)))).toBe(hex);
    }
  });

  it('keeps lightness and hue and drops chroma for a colour out of gamut', () => {
    const out = colorFromOklch({ l: 0.9, c: 0.4, h: 260 });
    const back = colorToOklch(out);
    expect(back.l).toBeCloseTo(0.9, 1);
    expect(Math.abs(back.h - 260)).toBeLessThan(6);
  });
});

describe('colorContrast and the swatch edge', () => {
  it('gives WCAG ratios', () => {
    expect(colorContrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(colorContrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(colorContrast('#767676', '#ffffff')).toBeCloseTo(4.54, 1);
  });

  it('lays a see through colour over the backdrop first', () => {
    expect(colorContrast('#00000000', '#ffffff')).toBeCloseTo(1, 5);
    expect(colorContrast('#00000080', '#ffffff')).toBeGreaterThan(3);
  });

  it('says a pale swatch on a white panel or a dark swatch on a dark panel needs its edge (1.4.11)', () => {
    expect(colorSwatchEdgeNeeded('#f5efbb', '#ffffff')).toBe(true);
    expect(colorSwatchEdgeNeeded('#0d2c5a', '#1c1c1f')).toBe(true);
    expect(colorSwatchEdgeNeeded('#0d2c5a', '#ffffff')).toBe(false);
  });
});

describe('colorName', () => {
  const cases: [string, string, string][] = [
    ['#1e6fd9', 'Blue', 'أزرق'],
    ['#0d4289', 'Blue, dark', 'أزرق غامق'],
    ['#0b2d5c', 'Blue, very dark', 'أزرق غامق جدا'],
    ['#a7c8f5', 'Blue, light', 'أزرق فاتح'],
    ['#e03a3a', 'Red', 'أحمر'],
    ['#8b0000', 'Red, dark', 'أحمر غامق'],
    ['#ff8000', 'Orange', 'برتقالي'],
    ['#8b4513', 'Brown', 'بني'],
    ['#f5c518', 'Yellow', 'أصفر'],
    ['#2fa84f', 'Green', 'أخضر'],
    ['#20b2aa', 'Teal', 'فيروزي'],
    ['#00ffff', 'Cyan', 'سماوي'],
    ['#800080', 'Purple, dark', 'بنفسجي غامق'],
    ['#ec4899', 'Pink', 'وردي'],
    ['#ffffff', 'White', 'أبيض'],
    ['#000000', 'Black', 'أسود'],
    ['#7a7a7a', 'Grey', 'رمادي'],
    ['#c0c0c0', 'Grey, light', 'رمادي فاتح'],
  ];
  for (const [hex, en, ar] of cases) {
    it(`${hex} is ${en} and ${ar}`, () => {
      expect(colorName(hex, 'en')).toBe(en);
      expect(colorName(hex, 'ar-SA')).toBe(ar);
    });
  }

  it('names how see through a colour is, with Western digits and the Arabic comma', () => {
    expect(colorName('#0d428966', 'en')).toBe('Blue, dark, 60% transparent');
    expect(colorName('#0d428966', 'ar')).toBe('أزرق غامق، شفافية 60%');
    expect(colorName('#00000000', 'en')).toBe('Transparent');
    expect(colorName('#00000000', 'ar')).toBe('شفاف');
  });

  it('puts the colour first and the shade after it in Arabic, never the English order', () => {
    expect(colorName('#a7c8f5', 'ar')).toMatch(/^أزرق /);
  });

  it('gives an empty name for text it cannot read', () => {
    expect(colorName('not a colour', 'en')).toBe('');
  });

  it('describes family and shade', () => {
    expect(colorDescribe('#0d4289')).toEqual({ family: 'blue', shade: 'dark' });
    expect(colorDescribe('#e8e8e8')).toEqual({ family: 'grey', shade: 'very-light' });
  });
});

describe('colorSwatchGrid', () => {
  const grid = colorSwatchGrid();

  it('is 10 rows of 12 hex colours, the same every call', () => {
    expect(grid).toHaveLength(10);
    for (const row of grid) {
      expect(row).toHaveLength(12);
      for (const hex of row) expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(colorSwatchGrid()).toEqual(grid);
  });

  it('starts with a grey row from white to black', () => {
    expect(grid[0]![0]).toBe('#ffffff');
    expect(grid[0]![11]).toBe('#000000');
    for (const hex of grid[0]!) expect(['grey', 'white', 'black']).toContain(colorDescribe(hex).family);
  });

  it('runs each colour column from dark to light', () => {
    for (let col = 0; col < 12; col += 1) {
      const lightness = grid.slice(1).map((row) => colorToOklch(colorParse(row[col]!)!).l);
      for (let i = 1; i < lightness.length; i += 1) expect(lightness[i]!).toBeGreaterThan(lightness[i - 1]!);
    }
  });

  it('gives every swatch a name in both languages, never a grey in a colour row', () => {
    for (const row of grid.slice(1)) {
      for (const hex of row) {
        expect(colorName(hex, 'en')).not.toBe('');
        expect(colorName(hex, 'ar')).not.toBe('');
        expect(colorDescribe(hex).family).not.toBe('grey');
      }
    }
  });
});

describe('locales and words', () => {
  it('adds Western digits to the locale', () => {
    expect(colorLocale('ar-SA')).toBe('ar-SA-u-nu-latn');
    expect(colorLocale(undefined)).toBe('en-u-nu-latn');
    expect(colorLocale('not a tag!')).toBe('en-u-nu-latn');
    expect(new Intl.NumberFormat(colorLocale('ar-SA')).format(214)).toBe('214');
    expect(ARABIC_INDIC.test(new Intl.NumberFormat(colorLocale('ar-SA'), { style: 'percent' }).format(0.5))).toBe(false);
  });

  it('reads the language of a tag', () => {
    expect(colorLanguage('ar-SA-u-nu-latn')).toBe('ar');
    expect(colorLanguage('en-GB')).toBe('en');
  });

  it('has nouns for the built in words', () => {
    expect(colorWords('ar').add).toBe('إضافة لون');
    expect(colorWords('ar').channels.alpha).toBe('العتامة');
    expect(colorWords('en').swatch).toBe('colour swatch');
  });
});
