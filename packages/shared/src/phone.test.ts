import { describe, expect, it } from 'vitest';
import {
  GULF_COUNTRIES,
  PHONE_COUNTRIES,
  findPhoneCountry,
  formatNational,
  isGulfCountry,
  isValidNational,
  maxNationalLength,
  nationalDigits,
  parsePhone,
  phoneCountryOptions,
  phoneExample,
  toE164,
} from './phone';

const arabicDigits = (latin: string) => latin.replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));

describe('country table', () => {
  it('has the Gulf dial codes', () => {
    const dial = Object.fromEntries(GULF_COUNTRIES.map((iso) => [iso, findPhoneCountry(iso)?.dial]));
    expect(dial).toEqual({ SA: '966', AE: '971', KW: '965', QA: '974', BH: '973', OM: '968' });
  });

  it('holds unique two letter codes and digit dial codes', () => {
    const isos = PHONE_COUNTRIES.map((c) => c.iso);
    expect(new Set(isos).size).toBe(isos.length);
    expect(isos.length).toBeGreaterThan(230);
    for (const c of PHONE_COUNTRIES) {
      expect(c.iso).toMatch(/^[A-Z]{2}$/);
      expect(c.dial).toMatch(/^[1-9]\d{0,2}$/);
    }
  });

  it('finds a country in any case', () => {
    expect(findPhoneCountry('eg')?.dial).toBe('20');
    expect(findPhoneCountry('ZZ')).toBeUndefined();
    expect(isGulfCountry('OM')).toBe(true);
    expect(isGulfCountry('EG')).toBe(false);
  });
});

describe('phoneCountryOptions', () => {
  it('puts the Gulf first in a fixed order, then the rest by English name', () => {
    const list = phoneCountryOptions('en');
    expect(list.slice(0, 6).map((c) => c.iso)).toEqual(['SA', 'AE', 'KW', 'QA', 'BH', 'OM']);
    expect(list.slice(0, 6).every((c) => c.gulf)).toBe(true);
    expect(list[0]?.name).toBe('Saudi Arabia');
    const rest = list.slice(6).map((c) => c.name);
    expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b, 'en')));
    expect(list).toHaveLength(PHONE_COUNTRIES.length);
  });

  it('names and sorts in Arabic', () => {
    const list = phoneCountryOptions('ar');
    expect(list[0]?.name).toContain('السعودية');
    const rest = list.slice(6).map((c) => c.name);
    expect(rest).toEqual([...rest].sort(new Intl.Collator('ar').compare));
    expect(list.slice(0, 6).map((c) => c.iso)).toEqual(['SA', 'AE', 'KW', 'QA', 'BH', 'OM']);
  });

  it('limits the list', () => {
    expect(phoneCountryOptions('en', ['eg', 'SA', 'AE']).map((c) => c.iso)).toEqual(['SA', 'AE', 'EG']);
  });
});

describe('nationalDigits', () => {
  it('drops the trunk 0 in SA and AE, and keeps digits only', () => {
    expect(nationalDigits('050 123 4567', 'SA')).toBe('501234567');
    expect(nationalDigits('04 123 4567', 'AE')).toBe('41234567');
    expect(nationalDigits('(5000) 1234', 'KW')).toBe('50001234');
  });

  it('reads Arabic Indic digits', () => {
    expect(nationalDigits(arabicDigits('0501234567'), 'SA')).toBe('501234567');
  });

  it('cuts to the longest valid length', () => {
    expect(nationalDigits('5012345678999', 'SA')).toBe('501234567');
    expect(nationalDigits('500012345', 'QA')).toBe('50001234');
    expect(maxNationalLength('SA')).toBe(9);
    expect(maxNationalLength('US')).toBe(14);
  });
});

describe('isValidNational', () => {
  it('applies the Gulf lengths', () => {
    expect(isValidNational('501234567', 'SA')).toBe(true);
    expect(isValidNational('50123456', 'SA')).toBe(false);
    expect(isValidNational('501234567', 'AE')).toBe(true);
    expect(isValidNational('41234567', 'AE')).toBe(true);
    for (const iso of ['KW', 'QA', 'BH', 'OM']) {
      expect(isValidNational('50001234', iso)).toBe(true);
      expect(isValidNational('5000123', iso)).toBe(false);
    }
  });

  it('applies the E.164 limit elsewhere', () => {
    expect(isValidNational('2025550123', 'US')).toBe(true);
    expect(isValidNational('123', 'US')).toBe(false);
    expect(isValidNational('', 'SA')).toBe(false);
  });
});

describe('formatNational', () => {
  it('groups Gulf numbers', () => {
    expect(formatNational('501234567', 'SA')).toBe('50 123 4567');
    expect(formatNational('501234567', 'AE')).toBe('50 123 4567');
    expect(formatNational('41234567', 'AE')).toBe('4 123 4567');
    expect(formatNational('50001234', 'KW')).toBe('5000 1234');
    expect(formatNational('33123456', 'QA')).toBe('3312 3456');
  });

  it('groups a partial number as far as it goes', () => {
    expect(formatNational('', 'SA')).toBe('');
    expect(formatNational('5', 'SA')).toBe('5');
    expect(formatNational('501', 'SA')).toBe('50 1');
    expect(formatNational('50123', 'SA')).toBe('50 123');
    expect(formatNational('50001', 'OM')).toBe('5000 1');
  });

  it('leaves numbers outside the Gulf as digits', () => {
    expect(formatNational('2025550123', 'US')).toBe('2025550123');
  });

  it('has a placeholder example for the Gulf only', () => {
    expect(phoneExample('SA')).toBe('50 123 4567');
    expect(phoneExample('US')).toBeUndefined();
  });
});

describe('toE164', () => {
  it('joins the dial code and the national digits', () => {
    expect(toE164('050 123 4567', 'SA')).toBe('+966501234567');
    expect(toE164('5000 1234', 'KW')).toBe('+96550001234');
    expect(toE164('', 'SA')).toBe('');
    expect(toE164('123', 'ZZ')).toBe('');
  });
});

describe('parsePhone', () => {
  it('reads the country from a pasted plus number', () => {
    expect(parsePhone('+966 50 123 4567', 'AE')).toEqual({ country: 'SA', national: '501234567', international: true });
    expect(parsePhone('+9665012345 67', 'SA')).toMatchObject({ country: 'SA', national: '501234567' });
    expect(parsePhone('+971 4 123 4567', 'SA')).toMatchObject({ country: 'AE', national: '41234567' });
  });

  it('reads 00 as a plus and drops a (0) after the code', () => {
    expect(parsePhone('00965 5000 1234', 'SA')).toMatchObject({ country: 'KW', national: '50001234', international: true });
    expect(parsePhone('+966 (0) 50 123 4567', 'KW')).toMatchObject({ country: 'SA', national: '501234567' });
  });

  it('reads Arabic Indic digits', () => {
    expect(parsePhone(`+${arabicDigits('966501234567')}`, 'AE')).toMatchObject({ country: 'SA', national: '501234567' });
  });

  it('keeps the field country for a shared dial code, else picks the main one', () => {
    expect(parsePhone('+1 416 555 0123', 'CA')).toMatchObject({ country: 'CA' });
    expect(parsePhone('+1 202 555 0123', 'SA')).toMatchObject({ country: 'US', national: '2025550123' });
    expect(parsePhone('+44 20 7946 0000', 'SA')).toMatchObject({ country: 'GB' });
    expect(parsePhone('+20 10 1234 5678', 'SA')).toMatchObject({ country: 'EG' });
  });

  it('reads the own dial code without a plus only when the rest is a valid number', () => {
    expect(parsePhone('966501234567', 'SA')).toEqual({ country: 'SA', national: '501234567', international: true });
    expect(parsePhone('0501234567', 'SA')).toEqual({ country: 'SA', national: '501234567', international: false });
    expect(parsePhone('96550001', 'KW')).toMatchObject({ country: 'KW', national: '96550001', international: false });
  });
});
