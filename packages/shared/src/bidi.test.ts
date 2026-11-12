import { describe, expect, it } from 'vitest';
import { directionOf, hasArabic, splitLatinRuns } from './bidi';

const latin = (s: string) =>
  splitLatinRuns(s)
    .filter((p) => p.latin)
    .map((p) => p.text);

describe('splitLatinRuns', () => {
  it('isolates Latin terms and keeps sentence punctuation outside', () => {
    expect(latin('الألوان والخطوط بصيغة JSON.')).toEqual(['JSON']);
    expect(latin('سمة جاهزة لملف إعدادات Tailwind.')).toEqual(['Tailwind']);
    expect(latin('افتح الملف ~/.cursor/mcp.json أو أنشئه.')).toEqual(['~/.cursor/mcp.json']);
    expect(latin('بصفتها البائع المعتمد (Merchant of Record).')).toEqual(['Merchant of Record']);
    expect(latin('مثل https://example.com/pin/123، أو')).toEqual(['https://example.com/pin/123']);
    expect(latin('من Pinterest وDribbble وBehance')).toEqual(['Pinterest', 'Dribbble', 'Behance']);
  });

  it('keeps every character, in order', () => {
    const text = 'نزله بصيغة JSON وأرسله لفريقك في Figma.';
    expect(
      splitLatinRuns(text)
        .map((p) => p.text)
        .join(''),
    ).toBe(text);
  });

  it('leaves English untouched', () => {
    expect(hasArabic('Colors and type as design tokens, in JSON.')).toBe(false);
    expect(splitLatinRuns('Add it to Claude.')).toEqual([{ text: 'Add it to Claude.', latin: false }]);
  });

  it('never ends a run with sentence punctuation', () => {
    for (const s of ['جرب Ctrl+C.', 'الملف DESIGN.md، ثم', 'اسم المنتج: Claude Code؛ وبعدها']) {
      for (const run of latin(s)) expect(run, s).not.toMatch(/[.,:;!?،؛]$/);
    }
  });
});

describe('directionOf', () => {
  it('reads the primary subtag', () => {
    expect(directionOf('ar')).toBe('rtl');
    expect(directionOf('ar-SA')).toBe('rtl');
    expect(directionOf('he')).toBe('rtl');
    expect(directionOf('en')).toBe('ltr');
    expect(directionOf('en-GB')).toBe('ltr');
    expect(directionOf('')).toBe('ltr');
  });
});
