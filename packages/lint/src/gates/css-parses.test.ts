import { describe, expect, it } from 'vitest';
import { cssParses, cssParsesRule } from '../rules/css-parses';
import { filesFor, fixture, format, plantedDialog, runRule } from './harness';

describe('gate ds/css-parses: every stylesheet in packages/css/src and packages/styles parses', () => {
  it('reads the component, platform, base and style pack CSS, generated barrels included', () => {
    const files = filesFor(cssParsesRule);
    expect(files).toEqual(
      expect.arrayContaining([
        'packages/css/src/index.css',
        'packages/css/src/components/Dialog.css',
        'packages/styles/index.css',
        'packages/styles/studio/index.css',
      ]),
    );
    expect(files.every((f) => /^packages\/(css\/src|styles)\/.+\.css$/.test(f))).toBe(true);
    expect(files.length).toBeGreaterThan(150);
  });

  it('finds no parse error in the repo', () => {
    expect(format(runRule(cssParsesRule)), 'fix the stylesheet').toEqual([]);
  }, 60_000);

  it('passes on the passing fixture: layers, nesting, strings and escapes', () => {
    expect(cssParses(fixture('css-parses/good.css'))).toEqual([]);
  });

  it('fails on each failing fixture', () => {
    const at = (name: string) => cssParses(fixture(`css-parses/${name}.css`)).map((f) => `${f.line} ${f.message}`);
    expect(at('unclosed')).toEqual(['2 { is never closed']);
    expect(at('extra-close')[0]).toBe('5 } has no opener');
    expect(at('bad-selector')).toEqual([expect.stringMatching(/^2 does not parse: .*combinator/)]);
    expect(at('marker')).toEqual([expect.stringMatching(/^2 does not parse: /)]);
  });

  it('fails on a conflict planted in a copy of Dialog.css', () => {
    const planted = plantedDialog();
    const found = cssParses(planted);
    expect(found.length).toBeGreaterThan(0);
    expect(found[0]?.line).toBeGreaterThanOrEqual(planted.at);
  });

  it('fails on an unclosed comment and an unclosed string', () => {
    expect(cssParses({ path: 'x.css', content: '.a { color: red; }\n/* open' }).map((f) => f.message)).toContain('comment is never closed with */');
    expect(cssParses({ path: 'x.css', content: ".a { content: 'open; }\n" }).map((f) => f.message)).toContain("string opened with ' is not closed on its line");
  });
});
