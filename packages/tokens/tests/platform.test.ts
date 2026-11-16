// The platform layer (docs/contracts/tokens.md, "Platform layer (ruling 8)",
// order R0.13): one token file per platform, CSS under [data-platform], native
// theme objects keyed by style, scheme and platform.
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { bakeSpring, buildTokens, contractNames, cssVar } from '../build';

const root = join(import.meta.dirname, '..', '..', '..');
const result = buildTokens({ root });
const css = result.files['css/tokens.css']!;
const ROLES = ['display', 'headline', 'title', 'body', 'label'].flatMap((r) => ['large', 'medium', 'small'].map((s) => `${r}-${s}`));

/** The declarations of one CSS block, by its exact selector line. */
function block(selector: string): Map<string, string> {
  const start = css.indexOf(`\n  ${selector} {\n`);
  expect(start, selector).toBeGreaterThan(-1);
  const body = css.slice(start + selector.length + 6, css.indexOf('\n  }', start + 1));
  const out = new Map<string, string>();
  for (const m of body.matchAll(/(--[\w-]+): ([^;]+);/g)) out.set(m[1]!, m[2]!);
  return out;
}

describe('platform contract', () => {
  const names = contractNames(result.platformContract.groups);

  it('lists the four platforms and the platform names', () => {
    expect(result.platformContract.ids).toEqual(['web', 'ios', 'android', 'macos']);
    expect(result.platforms.map((p) => p.id)).toEqual(['web', 'ios', 'android', 'macos']);
    for (const role of ROLES) expect(names).toContain(`type.${role}`);
    for (const n of ['shape.corner.none', 'shape.corner.full', 'opacity.state.pressed', 'opacity.state.disabled-container', 'elevation.level0', 'elevation.level5', 'spring.spatial.fast.stiffness', 'spring.effects.slow.mass', 'inset.safe.start', 'inset.keyboard', 'size.control.md', 'size.target-min']) {
      expect(names).toContain(n);
    }
  });

  for (const p of result.platforms) {
    it(`${p.id} fills every platform name and nothing else`, () => {
      expect([...p.tokens.keys()].sort()).toEqual([...names].sort());
    });
  }

  it('no platform file sets a colour, a font family or a material', () => {
    for (const p of result.platforms) {
      for (const t of p.tokens.values()) {
        expect(t.type, `${p.id} ${t.path}`).not.toBe('color');
        expect(t.type, `${p.id} ${t.path}`).not.toBe('fontFamily');
        expect(t.path).not.toMatch(/^(color|blur)\./);
        if (t.type === 'typography') expect((t.value as { fontFamily: string }).fontFamily).toMatch(/^\{font\.family\.[a-z-]+\}$/);
        if (t.type === 'shadow') for (const l of t.value as { color: string }[]) expect(l.color).toMatch(/^\{color\.[a-z0-9.-]+\}$/);
      }
    }
  });

  it('keeps the existing web values in the base', () => {
    const base = block(':root,\n  [data-style]');
    expect(base.get('--ds-size-control-xs')).toBe('24px');
    expect(base.get('--ds-size-control-sm')).toBe('28px');
    expect(base.get('--ds-size-control-md')).toBe('32px');
    expect(base.get('--ds-size-control-lg')).toBe('44px');
    expect(base.get('--ds-size-target-min')).toBe('24px');
    expect(base.get('--ds-size-touch-ios')).toBe('44px');
    expect(base.get('--ds-size-touch-android')).toBe('48px');
    expect(base.get('--ds-breakpoint-medium')).toBe('600px');
    expect(base.get('--ds-breakpoint-extra-large')).toBe('1600px');
  });
});

describe('platform CSS', () => {
  it('writes one block per platform, after the styles and before density', () => {
    const lastStyle = css.lastIndexOf("[data-style='");
    const firstDensity = css.indexOf("\n  [data-density='");
    for (const id of ['web', 'ios', 'android', 'macos']) {
      const at = css.indexOf(`\n  [data-platform='${id}'] {`);
      expect(at, id).toBeGreaterThan(lastStyle);
      expect(at, id).toBeLessThan(firstDensity);
    }
  });

  it('gives the cited values per platform', () => {
    const ios = block("[data-platform='ios']");
    expect(ios.get('--ds-type-body-large-font-size')).toBe('17px');
    expect(ios.get('--ds-type-display-large-font-size')).toBe('34px');
    expect(ios.get('--ds-type-title-large-font-weight')).toBe('600');
    expect(ios.get('--ds-size-control-md')).toBe('44px');
    const android = block("[data-platform='android']");
    expect(android.get('--ds-type-title-large-font-size')).toBe('22px');
    expect(android.get('--ds-type-body-large-letter-spacing')).toBe('0.5px');
    expect(android.get('--ds-type-label-large-font-weight')).toBe('500');
    expect(android.get('--ds-shape-corner-extra-large')).toBe('28px');
    expect(android.get('--ds-opacity-state-hover')).toBe('0.08');
    expect(android.get('--ds-size-control-md')).toBe('40px');
    const macos = block("[data-platform='macos']");
    expect(macos.get('--ds-type-body-large-font-size')).toBe('13px');
    expect(macos.get('--ds-size-control-md')).toBe('28px');
  });

  it('writes a typography role as five variables that alias the style family', () => {
    for (const id of ['web', 'ios', 'android', 'macos']) {
      const b = block(`[data-platform='${id}']`);
      for (const role of ROLES) {
        for (const f of ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'line-height']) expect(b.has(`--ds-type-${role}-${f}`), `${id} ${role} ${f}`).toBe(true);
        expect(b.get(`--ds-type-${role}-font-family`)).toMatch(/^var\(--ds-font-family-(sans|display)\)$/);
        expect(b.get(`--ds-type-${role}-font-size`)).toMatch(/^\d+px$/);
      }
    }
  });

  it('writes elevation geometry with the colour from the style', () => {
    expect(block("[data-platform='android']").get('--ds-elevation-level3')).toBe('0px 1px 3px 0px var(--ds-color-bg-scrim-30), 0px 4px 8px 3px var(--ds-color-bg-scrim-20)');
  });

  it('bakes springs to linear() and a duration on the web', () => {
    const b = block("[data-platform='android']");
    expect(b.get('--ds-spring-spatial-fast-stiffness')).toBe('1400');
    expect(b.get('--ds-spring-spatial-fast-easing')).toMatch(/^linear\(0, [\d., ]+, 1\)$/);
    const baked = bakeSpring({ stiffness: 1400, damping: 67.35, mass: 1 });
    expect(b.get('--ds-spring-spatial-fast-easing')).toBe(baked.easing);
    expect(b.get('--ds-spring-spatial-fast-duration')).toBe(`${baked.durationMs}ms`);
    // Effects springs do not overshoot.
    const effects = b.get('--ds-spring-effects-default-easing')!.slice(7, -1).split(', ').map(Number);
    expect(Math.max(...effects)).toBeLessThanOrEqual(1);
  });

  it('zeroes the baked spring durations under reduced motion', () => {
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduced).toContain('[data-platform],');
    expect(reduced.slice(0, reduced.indexOf('\n  }'))).toContain('--ds-spring-spatial-default-duration: 0ms;');
  });

  it('feeds insets from env() and swaps start and end under rtl', () => {
    for (const sel of ["[data-platform='ios']", ':root,\n  [data-style]']) {
      const b = block(sel);
      expect(b.get('--ds-inset-safe-top')).toBe('env(safe-area-inset-top, 0px)');
      expect(b.get('--ds-inset-safe-start')).toBe('env(safe-area-inset-left, 0px)');
      expect(b.get('--ds-inset-safe-end')).toBe('env(safe-area-inset-right, 0px)');
      expect(b.get('--ds-inset-keyboard')).toBe('env(keyboard-inset-height, 0px)');
    }
    const rtl = block("[data-platform='ios']:dir(rtl)");
    expect(rtl.get('--ds-inset-safe-start')).toBe('env(safe-area-inset-right, 0px)');
    expect(rtl.get('--ds-inset-safe-end')).toBe('env(safe-area-inset-left, 0px)');
    expect(css).toContain(':root:dir(rtl),\n  [data-style]:dir(rtl) {');
  });

  it('keeps ios, android and macos at their own control sizes under every density', () => {
    for (const id of ['ios', 'android', 'macos']) {
      const own = block(`[data-platform='${id}']`);
      for (const d of ['compact', 'comfortable']) {
        const b = block(`[data-platform='${id}'][data-density='${d}']`);
        for (const s of ['xs', 'sm', 'md', 'lg']) expect(b.get(`--ds-size-control-${s}`), `${id} ${d} ${s}`).toBe(own.get(`--ds-size-control-${s}`));
      }
    }
    expect(css).not.toContain("[data-platform='web'][data-density=");
  });

  it('declares every CSS variable in the types', () => {
    const types = result.files['types/tokens.d.ts']!;
    expect(types).toContain("| '--ds-type-body-large-font-size'");
    expect(types).toContain("| '--ds-spring-spatial-fast-easing'");
    expect(types).toContain("export type Platform = 'web' | 'ios' | 'android' | 'macos';");
    for (const m of css.matchAll(/(--ds-[\w-]+):/g)) expect(types, m[1]).toContain(`'${m[1]}'`);
  });

  it('gives Figma one variable per typography field', () => {
    const figma = JSON.parse(result.files['figma/studio.dark.json']!) as { variables: Record<string, { type: string; value: unknown }> };
    expect(figma.variables['type/body-large/font-size']).toMatchObject({ type: 'FLOAT', value: 16 });
    expect(figma.variables['type/body-large']).toBeUndefined();
  });
});

describe('platform native themes', () => {
  const index = result.files['native/index.ts']!;

  it('exposes themes[style][scheme][platform] and keeps themes[style][scheme] as the web theme', () => {
    expect(index).toContain("export type Platform = 'web' | 'ios' | 'android' | 'macos';");
    expect(index).toContain('export type PlatformThemes = Theme & { readonly [P in Platform]: Theme };');
    expect(index).toContain('export const themes: Record<StyleId, Partial<Record<Scheme, PlatformThemes>>> = {');
    for (const m of result.modes) {
      const web = m.style + m.scheme[0]!.toUpperCase() + m.scheme.slice(1);
      expect(index).toContain(`${m.scheme}: { ...${web}, web: ${web}, ios: ${web}Ios, android: ${web}Android, macos: ${web}Macos },`);
    }
  });

  it('writes one theme object per style, scheme and platform, in a folder per platform', () => {
    // A `.ios.ts` suffix beside the web file would win the import on iOS.
    for (const rel of Object.keys(result.files)) expect(rel).not.toMatch(/\.(ios|android|macos|native|web)\.ts$/);
    for (const m of result.modes) {
      for (const p of ['ios', 'android', 'macos']) expect(result.files[`native/${p}/${m.id}.ts`], `${p}/${m.id}`).toBeDefined();
    }
  });

  it('never names a desktop fallback family in any native file', () => {
    for (const [rel, content] of Object.entries(result.files)) {
      if (!rel.startsWith('native/')) continue;
      expect(content, rel).not.toMatch(/Segoe UI|SFMono-Regular/);
    }
  });

  it('maps system stacks to the platform font', () => {
    const ios = result.files['native/ios/liquid.light.ts']!;
    expect(ios).toMatch(/family: \{[^}]*mono: undefined,[^}]*sans: undefined,/s);
    const android = result.files['native/android/liquid.light.ts']!;
    expect(android).toMatch(/family: \{[^}]*mono: 'monospace',[^}]*sans: undefined,/s);
    // A style font keeps its name: the theme says which family the style wants.
    expect(result.files['native/ios/studio.dark.ts']).toContain("sans: 'Inter Variable',");
  });

  it('gives a role as a React Native text style with an absolute line height', () => {
    const t = result.files['native/ios/neutral.dark.ts']!;
    expect(t).toContain("'body-large': {\n      fontFamily: 'Inter Variable',\n      fontSize: 17,\n      fontWeight: 400,\n      letterSpacing: 0,\n      lineHeight: 22,\n    },");
    expect(t).toContain("'display-large': {\n      fontFamily: 'Inter Variable',\n      fontSize: 34,\n      fontWeight: 400,\n      letterSpacing: 0,\n      lineHeight: 41,\n    },");
    const a = result.files['native/android/neutral.dark.ts']!;
    expect(a).toContain("'title-large': {\n      fontFamily: 'Inter Variable',\n      fontSize: 22,\n      fontWeight: 400,\n      letterSpacing: 0,\n      lineHeight: 28,\n    },");
  });

  it('gives springs and elevation as numbers, insets as 0, and no CSS curves', () => {
    const t = result.files['native/android/desk.dark.ts']!;
    expect(t).toMatch(/spatial: \{\n\s+default: \{\n\s+damping: 47\.62,\n\s+mass: 1,\n\s+stiffness: 700,/);
    expect(t).toMatch(/level3: 6,/);
    expect(t).toMatch(/safe: \{\n\s+bottom: 0,\n\s+end: 0,\n\s+start: 0,\n\s+top: 0,/);
    for (const [rel, content] of Object.entries(result.files)) {
      if (rel.startsWith('native/') && rel !== 'native/types.ts') expect(content, rel).not.toMatch(/linear\(|steps\(/);
    }
  });

  it('exports the platform density values', () => {
    expect(index).toMatch(/export const platformDensities = \{\n\s+android: \{\n\s+comfortable: \{\n\s+size: \{\n\s+control: \{\n\s+lg: 56,\n\s+md: 40,/);
  });

  // Order R0.19: density keeps the macos control heights (DECISIONS.md, R0.14
  // rulings on macos, item 1), on the web and in the native objects.
  it('keeps macos control heights under every density, in CSS and native', () => {
    const own = block("[data-platform='macos']");
    expect(own.get('--ds-size-control-md')).toBe('28px');
    for (const d of ['compact', 'comfortable']) {
      const b = block(`[data-platform='macos'][data-density='${d}']`);
      expect([...b.keys()].sort(), d).toEqual(['--ds-size-control-lg', '--ds-size-control-md', '--ds-size-control-sm', '--ds-size-control-xs']);
      expect(b.get('--ds-size-control-md'), d).toBe('28px');
      expect(css.indexOf(`\n  [data-platform='macos'][data-density='${d}'] {`), d).toBeGreaterThan(css.indexOf(`\n  [data-density='${d}'] {`));
    }
    expect(index).toMatch(/\n\s+macos: \{\n\s+comfortable: \{\n\s+size: \{\n\s+control: \{\n\s+lg: 32,\n\s+md: 28,\n\s+sm: 22,\n\s+xs: 20,\n\s+\},\n\s+\},\n\s+\},\n\s+compact: \{\n\s+size: \{\n\s+control: \{\n\s+lg: 32,\n\s+md: 28,\n\s+sm: 22,\n\s+xs: 20,/);
  });
});

describe('platform checks', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'ds-tokens-platform-'));
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  function fixture(name: string, edit: (dir: string) => void): string {
    const dir = join(tmp, name);
    cpSync(join(root, 'ds.config.json'), join(dir, 'ds.config.json'));
    cpSync(join(root, 'packages/tokens/src'), join(dir, 'packages/tokens/src'), { recursive: true });
    for (const f of readdirSync(join(root, 'packages/styles/studio')).filter((x) => /^tokens\.\w+\.json$/.test(x))) {
      cpSync(join(root, 'packages/styles/studio', f), join(dir, 'packages/styles/studio', f));
    }
    edit(dir);
    return dir;
  }
  // A loose JSON tree, so a test can reach into a token file by path.
  type Tree = { [k: string]: Tree } & Record<string, unknown>;
  const editJson = (path: string, fn: (j: Tree) => void) => {
    const j = JSON.parse(readFileSync(path, 'utf8')) as Tree;
    fn(j);
    writeFileSync(path, JSON.stringify(j));
  };

  it('refuses a colour in a platform file', () => {
    const dir = fixture('colour', (d) =>
      editJson(join(d, 'packages/tokens/src/platform/ios.json'), (j) => {
        (j.elevation.level1.$value as unknown as { color: unknown }[])[0]!.color = { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.3, hex: '#000000' };
      }),
    );
    expect(() => buildTokens({ root: dir })).toThrow(/colour/);
  });

  it('refuses a font family in a platform file', () => {
    const dir = fixture('family', (d) =>
      editJson(join(d, 'packages/tokens/src/platform/android.json'), (j) => {
        (j.type['body-large'].$value as unknown as { fontFamily: unknown }).fontFamily = ['Roboto', 'sans-serif'];
      }),
    );
    expect(() => buildTokens({ root: dir })).toThrow(/fontFamily must alias/);
  });

  it('refuses a missing platform name', () => {
    const dir = fixture('missing', (d) =>
      editJson(join(d, 'packages/tokens/src/platform/macos.json'), (j) => {
        delete j.shape.corner.full;
      }),
    );
    expect(() => buildTokens({ root: dir })).toThrow(/shape\.corner\.full has no value/);
  });

  it('refuses a style that sets a platform name', () => {
    const dir = fixture('style', (d) =>
      editJson(join(d, 'packages/styles/studio/tokens.dark.json'), (j) => {
        j.opacity = { state: { hover: { $type: 'number', $value: 0.2 } } } as unknown as Tree;
      }),
    );
    expect(() => buildTokens({ root: dir })).toThrow(/platform name, which a style never sets/);
  });

  it('every platform CSS variable is one the token build declares', () => {
    for (const p of result.platforms) for (const path of p.tokens.keys()) if (!p.tokens.get(path)!.path.startsWith('type.')) expect(css).toContain(`${cssVar(result.prefix, path)}:`);
  });
});
