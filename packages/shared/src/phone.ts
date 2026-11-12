/**
 * Phone numbers: the pure logic behind PhoneField.
 *
 * Hand written for the Gulf (decision 7 of docs/plan/wave-1.md: no
 * libphonenumber, which is not on the allow list). The six Gulf countries
 * get length rules and a national format. Every other country gets its dial
 * code and the E.164 length limit only: its digits are kept as typed.
 *
 * Country names come from `Intl.DisplayNames`, so they follow the language
 * of the page and need no table of names here.
 */
import { toLatinDigits } from './otp';

/** The six Gulf countries, in the order the picker shows them. */
export const GULF_COUNTRIES = ['SA', 'AE', 'KW', 'QA', 'BH', 'OM'] as const;

export type GulfCountry = (typeof GULF_COUNTRIES)[number];

export interface PhoneCountry {
  /** ISO 3166 alpha 2 code, upper case: SA. */
  iso: string;
  /** Dial code digits, without the plus: 966. */
  dial: string;
}

export interface PhoneCountryOption extends PhoneCountry {
  /** The country name in the requested language. */
  name: string;
  /** True for the six Gulf countries. */
  gulf: boolean;
}

// ISO code and dial code, one pair per country or territory. NANP members
// share +1, and a few territories share their parent's code.
const TABLE =
  'AD376 AE971 AF93 AG1 AI1 AL355 AM374 AO244 AR54 AS1 AT43 AU61 AW297 AX358 AZ994 ' +
  'BA387 BB1 BD880 BE32 BF226 BG359 BH973 BI257 BJ229 BL590 BM1 BN673 BO591 BQ599 BR55 BS1 BT975 BW267 BY375 BZ501 ' +
  'CA1 CC61 CD243 CF236 CG242 CH41 CI225 CK682 CL56 CM237 CN86 CO57 CR506 CU53 CV238 CW599 CX61 CY357 CZ420 ' +
  'DE49 DJ253 DK45 DM1 DO1 DZ213 EC593 EE372 EG20 EH212 ER291 ES34 ET251 ' +
  'FI358 FJ679 FK500 FM691 FO298 FR33 ' +
  'GA241 GB44 GD1 GE995 GF594 GG44 GH233 GI350 GL299 GM220 GN224 GP590 GQ240 GR30 GT502 GU1 GW245 GY592 ' +
  'HK852 HN504 HR385 HT509 HU36 ID62 IE353 IL972 IM44 IN91 IO246 IQ964 IR98 IS354 IT39 ' +
  'JE44 JM1 JO962 JP81 KE254 KG996 KH855 KI686 KM269 KN1 KP850 KR82 KW965 KY1 KZ7 ' +
  'LA856 LB961 LC1 LI423 LK94 LR231 LS266 LT370 LU352 LV371 LY218 ' +
  'MA212 MC377 MD373 ME382 MF590 MG261 MH692 MK389 ML223 MM95 MN976 MO853 MP1 MQ596 MR222 MS1 MT356 MU230 MV960 MW265 MX52 MY60 MZ258 ' +
  'NA264 NC687 NE227 NF672 NG234 NI505 NL31 NO47 NP977 NR674 NU683 NZ64 OM968 ' +
  'PA507 PE51 PF689 PG675 PH63 PK92 PL48 PM508 PR1 PS970 PT351 PW680 PY595 QA974 ' +
  'RE262 RO40 RS381 RU7 RW250 ' +
  'SA966 SB677 SC248 SD249 SE46 SG65 SH290 SI386 SJ47 SK421 SL232 SM378 SN221 SO252 SR597 SS211 ST239 SV503 SX1 SY963 SZ268 ' +
  'TC1 TD235 TG228 TH66 TJ992 TK690 TL670 TM993 TN216 TO676 TR90 TT1 TV688 TW886 TZ255 ' +
  'UA380 UG256 US1 UY598 UZ998 VA39 VC1 VE58 VG1 VI1 VN84 VU678 WF681 WS685 XK383 YE967 YT262 ZA27 ZM260 ZW263';

/** Every country the picker can show, in ISO order. */
export const PHONE_COUNTRIES: readonly PhoneCountry[] = TABLE.split(' ').map((pair) => ({
  iso: pair.slice(0, 2),
  dial: pair.slice(2),
}));

const BY_ISO = new Map(PHONE_COUNTRIES.map((c) => [c.iso, c]));

/** The country a shared dial code points to when a pasted number gives no more. */
const MAIN_FOR_DIAL: Record<string, string> = {
  '1': 'US',
  '7': 'RU',
  '39': 'IT',
  '44': 'GB',
  '47': 'NO',
  '61': 'AU',
  '212': 'MA',
  '262': 'RE',
  '358': 'FI',
  '590': 'GP',
  '599': 'CW',
};

/** Gulf rules: national lengths (no trunk 0), whether a trunk 0 is dialled at home, and the groups of the national format. */
interface GulfRule {
  lengths: readonly number[];
  trunk: boolean;
  groups: Record<number, readonly number[]>;
  example: string;
  /** Digits that start a number of the longest length: a partial number takes its groups from the start. */
  long?: RegExp;
}

const GULF_RULES: Record<GulfCountry, GulfRule> = {
  // Mobile 5X XXX XXXX and landline 1X XXX XXXX, both 9 digits; 05 at home.
  SA: { lengths: [9], trunk: true, groups: { 9: [2, 3, 4] }, example: '50 123 4567' },
  // Mobile 5X XXX XXXX (9 digits), landline X XXX XXXX (8 digits); 0 at home.
  // 5 starts a mobile and 6 a shared 600 number, both 9 digits.
  AE: { lengths: [8, 9], trunk: true, groups: { 8: [1, 3, 4], 9: [2, 3, 4] }, example: '50 123 4567', long: /^[56]/ },
  KW: { lengths: [8], trunk: false, groups: { 8: [4, 4] }, example: '5000 1234' },
  QA: { lengths: [8], trunk: false, groups: { 8: [4, 4] }, example: '3312 3456' },
  BH: { lengths: [8], trunk: false, groups: { 8: [4, 4] }, example: '3600 1234' },
  OM: { lengths: [8], trunk: false, groups: { 8: [4, 4] }, example: '9212 3456' },
};

function gulfRule(iso: string): GulfRule | undefined {
  return (GULF_RULES as Record<string, GulfRule | undefined>)[iso];
}

/** True for SA, AE, KW, QA, BH and OM. */
export function isGulfCountry(iso: string): iso is GulfCountry {
  return gulfRule(iso) !== undefined;
}

/** The country with this ISO code, or undefined. */
export function findPhoneCountry(iso: string): PhoneCountry | undefined {
  return BY_ISO.get(iso.toUpperCase());
}

/** E.164 allows 15 digits with the dial code. */
function maxNational(country: PhoneCountry): number {
  const rule = gulfRule(country.iso);
  return rule ? Math.max(...rule.lengths) : 15 - country.dial.length;
}

/** The longest number of national digits the field accepts for a country. */
export function maxNationalLength(iso: string): number {
  const country = findPhoneCountry(iso);
  return country ? maxNational(country) : 15;
}

/** An example national number for the placeholder, Gulf countries only. */
export function phoneExample(iso: string): string | undefined {
  return gulfRule(iso)?.example;
}

/**
 * The picker list: the six Gulf countries first, in the order SA, AE, KW,
 * QA, BH, OM, then the rest by name in `locale`. `only` limits the list to
 * these ISO codes.
 */
export function phoneCountryOptions(locale = 'en', only?: readonly string[]): PhoneCountryOption[] {
  let names: Intl.DisplayNames | undefined;
  try {
    names = new Intl.DisplayNames([locale, 'en'], { type: 'region' });
  } catch {
    names = undefined;
  }
  const allow = only ? new Set(only.map((c) => c.toUpperCase())) : undefined;
  const named = PHONE_COUNTRIES.filter((c) => !allow || allow.has(c.iso)).map((c) => ({
    ...c,
    name: names?.of(c.iso) ?? c.iso,
    gulf: isGulfCountry(c.iso),
  }));
  const gulf = GULF_COUNTRIES.map((iso) => named.find((c) => c.iso === iso)).filter((c): c is PhoneCountryOption => c !== undefined);
  const collator = new Intl.Collator([locale, 'en']);
  const rest = named.filter((c) => !c.gulf).sort((a, b) => collator.compare(a.name, b.name));
  return [...gulf, ...rest];
}

/**
 * The national digits of a number typed for a country: Arabic Indic digits
 * become Latin, everything but digits goes, the trunk 0 of SA and AE goes
 * (050 becomes 50), and the result is cut to the longest valid length.
 */
export function nationalDigits(input: string, iso: string, options: { cut?: boolean } = {}): string {
  const cut = options.cut ?? true;
  let digits = toLatinDigits(input).replace(/\D/g, '');
  const country = findPhoneCountry(iso);
  if (!country) return cut ? digits.slice(0, 15) : digits;
  if (gulfRule(country.iso)?.trunk) digits = digits.replace(/^0+/, '');
  return cut ? digits.slice(0, maxNational(country)) : digits;
}

/** True when the national digits have a valid length: the Gulf rules, else 4 to the E.164 limit. */
export function isValidNational(national: string, iso: string): boolean {
  const country = findPhoneCountry(iso);
  if (!country || !/^\d+$/.test(national)) return false;
  const rule = gulfRule(country.iso);
  if (rule) return rule.lengths.includes(national.length);
  return national.length >= 4 && national.length <= maxNational(country);
}

/**
 * The national number in groups for display: 50 123 4567 for SA,
 * 5000 1234 for KW. A partial number is grouped as far as it goes. A number
 * from outside the Gulf comes back as plain digits.
 */
export function formatNational(national: string, iso: string): string {
  const digits = toLatinDigits(national).replace(/\D/g, '');
  const rule = gulfRule(iso.toUpperCase());
  if (!rule) return digits;
  const longest = Math.max(...rule.lengths);
  // A partial number takes the groups of the length it is heading for.
  const target = rule.long?.test(digits) ? longest : (rule.lengths.find((l) => l >= digits.length) ?? longest);
  const groups = rule.groups[target] ?? rule.groups[longest] ?? [];
  const out: string[] = [];
  let at = 0;
  for (const size of groups) {
    if (at >= digits.length) break;
    out.push(digits.slice(at, at + size));
    at += size;
  }
  if (at < digits.length) out.push(digits.slice(at));
  return out.join(' ');
}

/**
 * The E.164 form, +966501234567, or an empty string when there are no
 * digits. Digits are never cut here: a number that is too long stays too
 * long, and `isValidNational` says so.
 */
export function toE164(national: string, iso: string): string {
  const country = findPhoneCountry(iso);
  const digits = nationalDigits(national, iso, { cut: false });
  if (!country || digits === '') return '';
  return `+${country.dial}${digits}`;
}

export interface ParsedPhone {
  /** The country found, or the fallback country. */
  country: string;
  /** National digits, without the trunk 0. */
  national: string;
  /** True when the input named its country with + or 00. */
  international: boolean;
}

/** The country whose dial code starts these digits: the longest code wins, a shared code goes to its main country. */
function countryForDigits(digits: string, prefer?: string): { country: PhoneCountry; rest: string } | undefined {
  for (let len = 3; len >= 1; len -= 1) {
    const dial = digits.slice(0, len);
    const matches = PHONE_COUNTRIES.filter((c) => c.dial === dial);
    if (matches.length === 0) continue;
    const pick =
      matches.find((c) => c.iso === prefer) ?? BY_ISO.get(MAIN_FOR_DIAL[dial] ?? '') ?? matches[0];
    if (pick) return { country: pick, rest: digits.slice(len) };
  }
  return undefined;
}

/**
 * Reads a typed or pasted number.
 *
 * - `+9665...`, `009665...` and `+966 (0) 5...` name their country: the
 *   country changes and the rest is the national number. A shared dial code
 *   keeps `fallback` when it shares the code (+1 stays CA for a Canadian
 *   field), else goes to its main country (+1 to US).
 * - `9665XXXXXXXX` without a plus is read as international only when it is
 *   the fallback's own dial code followed by a valid Gulf length.
 * - Anything else is a national number for `fallback`.
 */
export function parsePhone(input: string, fallback: string): ParsedPhone {
  const latin = toLatinDigits(input).trim();
  const digits = latin.replace(/\D/g, '');
  const plus = /^\+/.test(latin) || /^00/.test(digits);
  if (plus) {
    const intl = /^00/.test(digits) && !/^\+/.test(latin) ? digits.slice(2) : digits;
    const found = countryForDigits(intl, fallback.toUpperCase());
    if (found) {
      return { country: found.country.iso, national: nationalDigits(found.rest, found.country.iso), international: true };
    }
  }
  const own = findPhoneCountry(fallback);
  if (own && isGulfCountry(own.iso) && digits.startsWith(own.dial)) {
    const rest = digits.slice(own.dial.length);
    // Too long to be national, and a valid number once the dial code is taken off.
    if (digits.replace(/^0+/, '').length > maxNational(own) && isValidNational(nationalDigits(rest, own.iso), own.iso)) {
      return { country: own.iso, national: nationalDigits(rest, own.iso), international: true };
    }
  }
  return { country: own?.iso ?? fallback.toUpperCase(), national: nationalDigits(digits, fallback), international: false };
}
