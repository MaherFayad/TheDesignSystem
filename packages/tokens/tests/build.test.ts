import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { buildTokens, contractNames, cssVar, resolveValue, writeTokens } from '../build';

const root = join(import.meta.dirname, '..', '..', '..');
const result = buildTokens({ root });

describe('token build', () => {
  it('discovers every style folder, dark and light, in sorted order', () => {
    const ids = result.modes.map((m) => m.id);
    // A new style pack must not need a change here, so the test checks the
    // shape and the two source styles, not a fixed list.
    expect(ids).toEqual([...ids].sort());
    for (const id of ['desk.dark', 'desk.light', 'studio.dark', 'studio.light']) expect(ids).toContain(id);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*\.(dark|light)$/);
  });

  it('writes the five outputs', () => {
    const files = Object.keys(result.files);
    expect(files).toContain('css/tokens.css');
    expect(files).toContain('css/studio.css');
    expect(files).toContain('css/desk.css');
    expect(files).toContain('native/index.ts');
    expect(files).toContain('native/studio.dark.ts');
    expect(files).toContain('types/tokens.d.ts');
    expect(files).toContain('figma/desk.light.json');
    expect(files).toContain('tailwind/theme.css');
    expect(files).toContain('css/custom-media.css');
  });

  it('is deterministic: two runs give byte equal output', () => {
    const again = buildTokens({ root });
    expect(again.files).toEqual(result.files);
    const a = mkdtempSync(join(tmpdir(), 'ds-tokens-a-'));
    const b = mkdtempSync(join(tmpdir(), 'ds-tokens-b-'));
    writeTokens(result, a);
    writeTokens(again, b);
    for (const rel of Object.keys(result.files)) {
      expect(readFileSync(join(b, rel), 'utf8')).toBe(readFileSync(join(a, rel), 'utf8'));
    }
    rmSync(a, { recursive: true, force: true });
    rmSync(b, { recursive: true, force: true });
  });

  it('reads the prefix from ds.config.json', () => {
    const config = JSON.parse(readFileSync(join(root, 'ds.config.json'), 'utf8')) as { cssPrefix: string };
    expect(result.prefix).toBe(config.cssPrefix);
    expect(result.files['css/tokens.css']).toContain(`--${config.cssPrefix}-color-bg-surface:`);
  });

  it('puts every value in the tokens layer with the contract selectors', () => {
    const css = result.files['css/tokens.css']!;
    expect(css).toContain('@layer ds.tokens {');
    expect(css).toContain(':root,\n  [data-style] {');
    expect(css).toContain("[data-style='studio'][data-scheme='dark'] {");
    expect(css).toContain("[data-style='desk'][data-scheme='light'] {");
    expect(css).toContain("[data-density='compact'] {");
    expect(css).toContain("[data-density='comfortable'] {");
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('@media (prefers-contrast: more)');
    expect(css).toContain("[data-style][data-scheme][data-contrast='more'] {");
  });

  it('zeroes motion under reduced motion but keeps timing marked ds.motion false', () => {
    const css = result.files['css/tokens.css']!;
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    const reduced = block.slice(0, block.indexOf('\n  }'));
    expect(reduced).toContain('--ds-duration-base: 0ms;');
    expect(reduced).toContain('--ds-delay-reveal-step: 0ms;');
    expect(reduced).not.toContain('--ds-delay-peek-hide');
    expect(result.base.get('delay.peek-hide')!.extensions?.['ds.motion']).toBe(false);
  });

  it('emits a dynamic viewport form with the static unit as fallback', () => {
    const css = result.files['css/tokens.css']!;
    const fallback = css.indexOf('--ds-dialog-height-max: 80vh;');
    const dynamic = css.indexOf('--ds-dialog-height-max: 80dvh;');
    expect(fallback).toBeGreaterThan(-1);
    expect(dynamic).toBeGreaterThan(fallback);
    expect(css.slice(0, dynamic)).toContain('@supports (height: 1dvh) {');
  });

  it('emits breakpoints as custom media and literal Tailwind breakpoints', () => {
    expect(result.files['css/custom-media.css']).toContain('@custom-media --ds-below-tablet (width < 48rem);');
    expect(result.files['css/custom-media.css']).toContain('@custom-media --ds-tablet-up (width >= 48rem);');
    expect(result.files['tailwind/theme.css']).toContain('--breakpoint-tablet: 48rem;');
    expect(result.files['types/tokens.d.ts']).toContain('/* breakpoint.tablet */');
  });

  it('exports native data: em base, fluid minimums, solid materials', () => {
    const index = result.files['native/index.ts']!;
    expect(index).toContain('export const emBase = 16;');
    expect(index).toContain("'space.12xl': 84,");
    expect(index).toContain("'font.size.3xs': 8,");
    expect(index).toMatch(/export const solidMaterials: readonly string\[\] = \['color\.material\.glass',/);
  });

  it('gives native plain values a consumer can use', () => {
    const t = result.files['native/studio.dark.ts']!;
    expect(t).toContain("'max-window-ratio': 0.8,");
    expect(t).toContain("mono: 'SFMono-Regular',");
    expect(t).not.toMatch(/'(system-ui|ui-monospace|sans-serif)'/);
    expect(result.files['native/types.ts']).toContain('lineHeight = fontSize * leading');
  });

  it('emits fluid values as clamp() and uses the max on native', () => {
    expect(result.files['css/tokens.css']).toContain('--ds-space-12xl: clamp(84px, calc(75.396px + 2.264vw), 108px);');
    expect(result.files['native/studio.dark.ts']).toMatch(/'12xl': 108,/);
  });

  it('converts shadows to React Native shadow props', () => {
    const t = result.files['native/desk.dark.ts']!;
    expect(t).toContain('shadowColor:');
    expect(t).toContain('shadowOffset:');
    expect(t).toContain('shadowOpacity:');
    expect(t).toContain('shadowRadius:');
    expect(t).toMatch(/elevation: \d+,/);
  });

  it('writes no em dash or en dash', () => {
    const dashes = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
    for (const [rel, content] of Object.entries(result.files)) {
      expect(dashes.test(content), rel).toBe(false);
    }
  });

  it('matches the CSS snapshot', async () => {
    await expect(result.files['css/tokens.css']).toMatchFileSnapshot('./__snapshots__/tokens.css');
  });

  it('matches the theme object snapshots', async () => {
    for (const m of result.modes) {
      await expect(result.files[`native/${m.id}.ts`]).toMatchFileSnapshot(`./__snapshots__/native.${m.id}.ts.snap`);
    }
    await expect(result.files['native/index.ts']).toMatchFileSnapshot('./__snapshots__/native.index.ts.snap');
  });
});

describe('contract', () => {
  const names = contractNames(result.contract);

  it('lists the semantic names', () => {
    expect(names.length).toBeGreaterThan(200);
    expect(names).toContain('color.bg.surface');
    expect(names).toContain('color.material.glass');
    expect(names).toContain('size.control.md');
    expect(new Set(names).size).toBe(names.length);
  });

  for (const mode of result.modes) {
    it(`every contract name resolves in ${mode.id}`, () => {
      const css = result.files['css/tokens.css']!;
      const missing = names.filter((n) => !mode.all.has(n));
      expect(missing).toEqual([]);
      for (const n of names) {
        const v = resolveValue(mode.all.get(n)!.value, mode.all, `${mode.id} ${n}`);
        expect(v, n).not.toBeUndefined();
        expect(css).toContain(`${cssVar(result.prefix, n)}:`);
      }
    });
  }

  it('every style and scheme defines the same names', () => {
    const [first, ...rest] = result.modes;
    const keys = [...first!.all.keys()].sort();
    for (const m of rest) expect([...m.all.keys()].sort(), m.id).toEqual(keys);
  });
});

describe('style discovery', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'ds-tokens-style-'));
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it('picks up a new style folder with no build change', () => {
    cpSync(join(root, 'ds.config.json'), join(tmp, 'ds.config.json'));
    cpSync(join(root, 'packages/tokens/src'), join(tmp, 'packages/tokens/src'), { recursive: true });
    for (const id of ['studio', 'probe']) {
      for (const scheme of ['dark', 'light']) {
        cpSync(join(root, `packages/styles/studio/tokens.${scheme}.json`), join(tmp, `packages/styles/${id}/tokens.${scheme}.json`));
      }
    }
    const r = buildTokens({ root: tmp });
    expect(r.modes.map((m) => m.id)).toEqual(['probe.dark', 'probe.light', 'studio.dark', 'studio.light']);
    expect(r.files['css/tokens.css']).toContain("[data-style='probe'][data-scheme='dark'] {");
    expect(r.files['css/probe.css']).toBeDefined();
    expect(r.files['native/index.ts']).toContain('probe: { dark: probeDark, light: probeLight },');
  });
});
