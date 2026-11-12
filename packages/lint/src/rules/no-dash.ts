// ds/no-dash: no em dash and no en dash in any text file we write. Ported
// from GoBanana `design-no-em-dash.test.ts`, widened to the en dash and to
// every text file. Catches the character, its JS and CSS escapes and its HTML
// entities.
//
// The characters and escapes are built from char codes so this file does not
// flag itself.
import { isTextFile } from '../scopes';
import type { Finding, Rule, SourceFile } from '../types';
import { locator } from '../util';

export const NO_DASH = 'ds/no-dash';

const EM = String.fromCharCode(0x2014);
const EN = String.fromCharCode(0x2013);
const BS = String.fromCharCode(0x5c);
const AMP = String.fromCharCode(0x26);

const FORMS: { pattern: string; name: string }[] = [];
for (const [code, name] of [
  [0x2014, 'em dash'],
  [0x2013, 'en dash'],
] as const) {
  const hex = code.toString(16);
  const word = name === 'em dash' ? 'mdash' : 'ndash';
  FORMS.push(
    { pattern: `${BS}${BS}u${hex}`, name },
    { pattern: `${BS}${BS}u${BS}{${hex}${BS}}`, name },
    { pattern: `${BS}${BS}0*${hex}(?![0-9a-f])`, name },
    { pattern: `${AMP}${word};`, name },
    { pattern: `${AMP}#${code};`, name },
    { pattern: `${AMP}#x0*${hex};`, name },
  );
}

const PATTERN = new RegExp(`[${EM}${EN}]|${FORMS.map((f) => `(${f.pattern})`).join('|')}`, 'gi');

function nameOf(match: string): string {
  if (match === EM) return 'em dash';
  if (match === EN) return 'en dash';
  const lower = match.toLowerCase();
  return lower.includes('2014') || lower.includes('8212') || lower.includes('mdash') ? 'em dash (escaped)' : 'en dash (escaped)';
}

export function noDash(file: SourceFile): Finding[] {
  const out: Finding[] = [];
  const at = locator(file.content);
  for (const m of file.content.matchAll(PATTERN)) {
    const index = m.index ?? 0;
    const pos = at(index);
    const near = file.content.slice(Math.max(0, index - 24), index + 24).replace(/\s+/g, ' ');
    out.push({
      ruleId: NO_DASH,
      file: file.path,
      line: pos.line,
      column: pos.column,
      message: `${nameOf(m[0])} near "${near.split(m[0]).join('<here>')}". Use a comma, colon, period or parentheses.`,
    });
  }
  return out;
}

export const noDashRule: Rule = {
  id: NO_DASH,
  description: 'No em dash or en dash in any text file, escapes and entities included.',
  appliesTo: isTextFile,
  check: noDash,
};
