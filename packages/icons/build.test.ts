import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generate, optimizeSvg, readGlyph, sources } from './build';
import { iconNames, isMirrored, mirrorIcons } from './src/names';
import { iconSets } from './src/generated/sets.gen';
import { iconToSvg, parseBody, resolveIcon } from './src/svg';

describe('icon build', () => {
  it('has unique kebab case names and a mirror list drawn from them', () => {
    expect(new Set(iconNames).size).toBe(iconNames.length);
    for (const name of iconNames) expect(name).toMatch(/^[a-z]+(-[a-z]+)*$/);
    for (const name of mirrorIcons) expect(iconNames).toContain(name);
    for (const name of ['clock', 'play', 'pause', 'loader'] as const) expect(isMirrored(name)).toBe(false);
    for (const name of iconNames) expect(name).not.toMatch(/(^|-)(left|right)(-|$)/);
  });

  for (const source of sources) {
    it(`maps every system name to an existing ${source.id} glyph`, () => {
      for (const name of iconNames) {
        const glyph = readGlyph(source, source.glyphs[name]);
        expect(glyph.viewBox).toBe('0 0 24 24');
        expect(glyph.body.length).toBeGreaterThan(0);
      }
    });
  }

  it('is deterministic and the committed output is up to date', async () => {
    const a = await generate();
    const b = await generate();
    expect([...a.entries()]).toEqual([...b.entries()]);
    for (const [path, content] of a) {
      expect(existsSync(path), path).toBe(true);
      expect(readFileSync(path, 'utf8'), path).toBe(content);
    }
    expect(a.has(join(import.meta.dirname, 'src', 'generated', 'sets.gen.ts'))).toBe(true);
  });

  it('keeps every attribute, digits in names included', () => {
    for (const set of Object.values(iconSets)) {
      for (const [name, { body }] of Object.entries(set.icons)) {
        for (const [tag, attrs] of parseBody(body)) expect(Object.keys(attrs).length, `${set.id} ${name} ${tag}`).toBeGreaterThan(0);
        expect(body, `${set.id} ${name}`).not.toMatch(/<[a-z]+\/>/);
      }
    }
    expect(parseBody(iconSets.line.icons['zoom-in'].body)[1]?.[1]).toEqual({ x1: '21', x2: '16.65', y1: '21', y2: '16.65' });
  });

  it('optimizes to flat self closing elements and rejects groups', () => {
    const out = optimizeSvg(
      '<!-- c --><svg class="a" viewBox="0 0 24 24" fill="none">\n  <path d="M1 1  h2" class="b" />\n  <circle cx="1" cy="1" r="1"/>\n</svg>',
    );
    expect(out).toEqual({ viewBox: '0 0 24 24', body: '<path d="M1 1 h2"/><circle cx="1" cy="1" r="1"/>' });
    expect(() => optimizeSvg('<svg viewBox="0 0 24 24"><g><path d="M0 0"/></g></svg>')).toThrow();
  });

  it('parses bodies back into nodes and builds a standalone svg', () => {
    const nodes = parseBody(iconSets.line.icons.search.body);
    expect(nodes.map(([tag]) => tag)).toEqual(['path', 'circle']);
    expect(nodes[1]?.[1]).toEqual({ cx: '11', cy: '11', r: '8' });
    const svg = iconToSvg('close', { set: 'pixel' }, 16);
    expect(svg).toContain('width="16"');
    expect(svg).toContain('fill="currentColor"');
  });

  it('applies a style map and falls back to pixel for an unknown set', () => {
    expect(resolveIcon('close', { set: 'nope' }).set.id).toBe('pixel');
    const mapped = resolveIcon('success', { set: 'pixel', map: { success: 'missing-glyph' } });
    expect(mapped.data).toBe(iconSets.pixel.icons.success);
  });
});

describe('icon names outside the package', () => {
  it('the Icon manifest lists every system name, in order', () => {
    const file = join(import.meta.dirname, '..', 'manifest', 'src', 'component', 'Icon.manifest.json');
    const manifest = JSON.parse(readFileSync(file, 'utf8')) as { props: { name: { type: string[] } } };
    expect(manifest.props.name.type).toEqual([...iconNames]);
  });

  it('every derived glyph in sets/local is used by its set', () => {
    for (const source of sources) {
      const dir = join(import.meta.dirname, 'sets', 'local', source.id);
      if (!existsSync(dir)) continue;
      const used = new Set(Object.values(source.glyphs));
      for (const f of readdirSync(dir)) expect(used.has(`local:${f.replace(/\.svg$/, '')}`), f).toBe(true);
    }
  });
});
