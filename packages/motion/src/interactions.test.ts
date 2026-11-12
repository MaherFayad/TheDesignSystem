import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import desk from '../../styles/desk/motion';
import neutral from '../../styles/neutral/motion';
import studio from '../../styles/studio/motion';
import { isPatternId } from './catalog';
import { getInteraction, interactionMode, interactionRecipes, interactions } from './interactions';

const root = new URL('../../../', import.meta.url);
const componentsCss = new URL('packages/css/src/components/', root);
const reactComponents = new URL('packages/react/src/components/', root);

/** An en dash, an em dash or an exclamation mark, built from code points. */
const DASH_OR_BANG = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}!]`);

/** Every private property the component CSS files declare. */
const declared = new Set<string>();
for (const f of readdirSync(componentsCss)) {
  for (const m of readFileSync(new URL(f, componentsCss), 'utf8').matchAll(/(--_[\w-]+)\s*:/g)) declared.add(m[1] ?? '');
}

describe('the interaction registry', () => {
  it('has unique kebab case ids', () => {
    const ids = interactions.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  it('names catalog patterns and existing components', () => {
    for (const i of interactions) {
      expect(isPatternId(i.pattern), `${i.id} pattern ${i.pattern}`).toBe(true);
      expect(i.components.length, i.id).toBeGreaterThan(0);
      for (const c of i.components) expect(existsSync(new URL(`${c}/${c}.tsx`, reactComponents)), `${i.id} names ${c}`).toBe(true);
    }
  });

  it('describes every interaction and its reduced form in plain words, and marks it proposed', () => {
    for (const i of interactions) {
      for (const text of [i.trigger, i.feedback, i.reduced]) {
        expect(text.length, i.id).toBeGreaterThan(8);
        expect(text, i.id).not.toMatch(DASH_OR_BANG);
      }
      expect(i.status).toBe('proposed');
    }
  });

  it('turns a CSS interaction off only through private properties the component CSS declares', () => {
    for (const i of interactions) {
      if (i.drive !== 'css') continue;
      expect(i.off, `${i.id} has an off switch`).toBeDefined();
      for (const [selector, decls] of Object.entries(i.off ?? {})) {
        expect(selector, i.id).toMatch(/^\[data-ds='[a-z-]+'\]/);
        for (const prop of Object.keys(decls)) expect(declared.has(prop), `${i.id} sets ${prop}`).toBe(true);
      }
    }
  });

  it('finds an interaction by id', () => {
    const first = interactions[0];
    if (first) expect(getInteraction(first.id)).toBe(first);
    expect(getInteraction('nope')).toBeUndefined();
  });
});

describe('interaction modes per style', () => {
  it('follow the style row first, then the pattern row, then the full form', () => {
    const style = { id: 't', window: 'fade' as const, patterns: { press: { mode: 'reduced' as const } }, interactions: { x: 'none' as const } };
    expect(interactionMode(style, 'x')).toBe('none');
    const pressRow = interactions.find((i) => i.pattern === 'press');
    if (pressRow) expect(interactionMode(style, pressRow.id)).toBe('reduced');
    expect(interactionMode({ id: 'f', window: 'grow' }, 'anything')).toBe('full');
  });

  it('name only interactions of the registry', () => {
    for (const style of [studio, desk, neutral]) {
      for (const id of Object.keys(style.interactions ?? {})) expect(getInteraction(id), `${style.id} names ${id}`).toBeDefined();
    }
  });

  it('write a recipe that sets private properties only, scoped to the style', () => {
    for (const [id, style] of [['studio', studio], ['desk', desk], ['neutral', neutral]] as const) {
      const css = interactionRecipes(id, style);
      if (!css) continue;
      expect(css.startsWith('@layer ds.recipes {')).toBe(true);
      for (const line of css.split('\n').filter((l) => l.includes(':') && !l.includes('{') && !l.includes('/*'))) {
        expect(line.trim(), `${id} recipe line`).toMatch(/^--_[\w-]+: [^;]+;$/);
      }
      for (const sel of css.matchAll(/\[data-style='([a-z]+)'\]/g)) expect(sel[1]).toBe(id);
    }
  });
});
