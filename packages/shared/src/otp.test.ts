import { describe, expect, it } from 'vitest';
import { codeInputHints, codeSeparatorIndexes, parseCode, toLatinDigits } from './otp';

describe('toLatinDigits', () => {
  it('turns Arabic Indic and Eastern Arabic Indic digits into Latin digits', () => {
    expect(toLatinDigits('\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669')).toBe('0123456789');
    expect(toLatinDigits('\u06F0\u06F1\u06F9')).toBe('019');
    expect(toLatinDigits('رقم 12')).toBe('رقم 12');
  });
});

describe('parseCode', () => {
  it('keeps a plain code', () => {
    expect(parseCode('123456')).toEqual({ value: '123456', complete: true, rejected: false });
  });

  it('reads a partial code as not complete', () => {
    expect(parseCode('12')).toEqual({ value: '12', complete: false, rejected: false });
    expect(parseCode('')).toEqual({ value: '', complete: false, rejected: false });
  });

  it('drops spaces and dashes between groups', () => {
    expect(parseCode('123 456').value).toBe('123456');
    expect(parseCode('123-456').value).toBe('123456');
    expect(parseCode(` 12\u00A034${String.fromCharCode(0x2013)}56 `).value).toBe('123456');
    expect(parseCode('123\u2212456').value).toBe('123456');
  });

  it('reads Arabic Indic digits', () => {
    expect(parseCode('\u0661\u0662\u0663\u0664\u0665\u0666')).toEqual({ value: '123456', complete: true, rejected: false });
  });

  it('cuts a long value to the length', () => {
    expect(parseCode('12345678').value).toBe('123456');
    expect(parseCode('12345678', { length: 4 }).value).toBe('1234');
  });

  it('finds the one code run in an SMS', () => {
    expect(parseCode('Your code is 482913. It ends in 10 minutes.')).toEqual({ value: '482913', complete: true, rejected: false });
    expect(parseCode('رمز التحقق: \u0664\u0668\u0662\u0669\u0661\u0663')).toEqual({ value: '482913', complete: true, rejected: false });
  });

  it('keeps the code characters when no single run is found, and says so', () => {
    expect(parseCode('12a4')).toEqual({ value: '124', complete: false, rejected: true });
    expect(parseCode('Codes 111111 and 222222')).toMatchObject({ rejected: true });
  });

  it('upper cases letters for an alphanumeric code', () => {
    expect(parseCode('ab-12c', { length: 5, charset: 'alphanumeric' })).toEqual({ value: 'AB12C', complete: true, rejected: false });
    expect(parseCode('ab!2', { length: 4, charset: 'alphanumeric' })).toMatchObject({ value: 'AB2', rejected: true });
  });

  it('treats a length below 1 as 1', () => {
    expect(parseCode('98', { length: 0 }).value).toBe('9');
  });
});

describe('codeInputHints', () => {
  it('asks for the numeric keypad for digits', () => {
    expect(codeInputHints()).toEqual({ inputMode: 'numeric', pattern: '[0-9]*' });
    expect(codeInputHints('alphanumeric').inputMode).toBe('text');
  });
});

describe('codeSeparatorIndexes', () => {
  it('places a separator before each group after the first', () => {
    expect(codeSeparatorIndexes(6, [3, 3])).toEqual([3]);
    expect(codeSeparatorIndexes(8, [2, 3, 3])).toEqual([2, 5]);
  });

  it('shows one group when the groups do not fit the length', () => {
    expect(codeSeparatorIndexes(6)).toEqual([]);
    expect(codeSeparatorIndexes(6, [6])).toEqual([]);
    expect(codeSeparatorIndexes(6, [3, 2])).toEqual([]);
    expect(codeSeparatorIndexes(6, [3, 0, 3])).toEqual([]);
  });
});
