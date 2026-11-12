import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildTokens, flatten } from '../../../tokens/build';
import { CONTRAST_PAIRS, type ContrastData } from '../contrast-pairs';
import { backdropsOf, checkContrast, contrastModes, describeResult, type ContrastMode } from '../rules/contrast';
import { ROOT, format } from './harness';

const modes = contrastModes(buildTokens().modes);
const report = checkContrast(modes, CONTRAST_PAIRS);

// Vitest hides console output of passing tests, so known failures go straight to stderr.
if (report.known.length > 0) {
  const lines = report.known.map(({ result, entry }) => `  ${describeResult(result)} [${entry.reason}]`);
  process.stderr.write(`[ds/contrast] ${report.known.length} known failures:\n${lines.join('\n')}\n`);
}

describe('gate ds/contrast: text 4.5:1 and UI 3:1 in every style and scheme', () => {
  it('measures the pair list in every style and scheme of the token build', () => {
    expect(modes.map((m) => m.id)).toEqual(expect.arrayContaining(['studio.dark', 'studio.light', 'desk.dark', 'desk.light']));
    for (const m of modes) expect(report.results.filter((r) => r.mode === m.id).length, m.id).toBeGreaterThan(100);
  });

  it('finds no failing pair outside the known failures', () => {
    expect(format(report.findings), 'fix the token value, or narrow the pair in contrast-pairs.ts with a written reason').toEqual([]);
  });

  it('has no stale known failure', () => {
    expect(report.stale.map((s) => `${s.entry.mode}|${s.entry.fg}|${s.entry.bg}: ${s.why}`)).toEqual([]);
  });
});

// A tiny fake style: muted text, glass over a black backdrop and a faint control border all fail.
const fakePath = 'packages/lint/fixtures/contrast/tokens.dark.json';
const fake: ContrastMode = {
  id: 'fake.dark',
  style: 'fake',
  scheme: 'dark',
  tokens: flatten(JSON.parse(readFileSync(join(ROOT, fakePath), 'utf8')), fakePath),
  file: fakePath,
};

const fakeData: ContrastData = {
  backdrops: ['color.bg.body', 'color.bg.surface'],
  groups: [
    { use: 'text', fg: ['color.text.default', 'color.text.muted'], bg: ['color.bg.surface'], min: 4.5 },
    { use: 'text on glass', fg: ['color.text.default'], bg: ['color.material.glass over $backdrop'], min: 4.5 },
    { use: 'control boundary', fg: ['color.border.control over $bg'], bg: ['color.bg.surface'], min: 3 },
  ],
  knownFailures: [],
};

describe('gate ds/contrast: fixture', () => {
  it('picks the darkest and the brightest backdrop', () => {
    expect(backdropsOf(fake, fakeData)).toEqual(['color.bg.body', 'color.bg.surface']);
  });

  it('fails on muted text, on glass over its backdrops and on a faint border', () => {
    const r = checkContrast([fake], fakeData);
    expect(r.findings.map((f) => f.allowKey)).toEqual([
      'fake.dark|color.text.muted|color.bg.surface',
      'fake.dark|color.text.default|color.material.glass over color.bg.body',
      'fake.dark|color.text.default|color.material.glass over color.bg.surface',
      'fake.dark|color.border.control over color.bg.surface|color.bg.surface',
    ]);
    expect(r.findings.every((f) => f.ruleId === 'ds/contrast' && f.file === fakePath)).toBe(true);
    // Glass at 50% white over black paints #808080: 3.95:1 against #ededed.
    expect(r.results.find((x) => x.bg === 'color.material.glass over color.bg.body')?.bgHex).toBe('#808080');
  });

  it('turns a known failure into a printed result, and fails on a stale one', () => {
    const r = checkContrast([fake], {
      ...fakeData,
      knownFailures: [
        { mode: 'fake.dark', fg: 'color.text.muted', bg: 'color.bg.surface', reason: 'fixture' },
        { mode: 'fake.dark', fg: 'color.text.default', bg: 'color.bg.surface', reason: 'fixture, passes so it is stale' },
        { mode: 'fake.dark', fg: 'color.text.bright', bg: 'color.bg.surface', reason: 'fixture, names no pair' },
      ],
    });
    expect(r.known.map((k) => k.result.key)).toEqual(['fake.dark|color.text.muted|color.bg.surface']);
    expect(r.findings).toHaveLength(3);
    expect(r.stale.map((s) => s.entry.fg)).toEqual(['color.text.default', 'color.text.bright']);
  });

  it('refuses a translucent bottom layer', () => {
    const r = () => checkContrast([fake], { ...fakeData, groups: [{ use: 'x', fg: ['color.text.default'], bg: ['color.material.glass'], min: 4.5 }] });
    expect(r).toThrow(/translucent/);
  });
});
