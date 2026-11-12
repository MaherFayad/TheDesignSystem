import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  anatomyFindings,
  axeMatrix,
  booleanStates,
  defaultStyle,
  demoPath,
  discoverStyles,
  formatAxe,
  isControl,
  kebabCase,
  keyCheckFor,
  manifestAxes,
  optionalParts,
  propValues,
  readyComponents,
  reportFile,
  splitKeys,
  stateClasses,
  stateFindings,
  trapsFocus,
  triggerSelector,
  variantFindings,
  type Manifest,
  type StyleInfo,
} from './lib';

const button: Manifest = {
  name: 'Button',
  kind: 'component',
  anatomy: ['root', 'label', 'icon-start', 'spinner'],
  props: {
    size: { type: ['sm', 'md'], default: 'md' },
    tone: ['neutral', 'danger'],
    loading: 'boolean',
  },
  states: ['data-loading', 'data-disabled', 'data-full-width', 'hover'],
  a11y: { keys: { Enter: 'Activates', Space: 'Activates', Tab: 'Moves on', 'ArrowUp, ArrowDown': 'Nothing' } },
  frameworks: { react: { status: 'ready' }, angular: { status: 'planned' }, native: { status: 'planned' } },
  contract: { optionalParts: ['spinner'] },
};

describe('kebabCase', () => {
  it('turns component names into the data-ds value', () => {
    expect(kebabCase('Button')).toBe('button');
    expect(kebabCase('IconButton')).toBe('icon-button');
    expect(kebabCase('AlertDialog')).toBe('alert-dialog');
    expect(kebabCase('OTPField')).toBe('otp-field');
  });
});

describe('manifest reading', () => {
  it('reads enum props in both shapes', () => {
    expect(propValues(['a', 'b'])).toEqual(['a', 'b']);
    expect(propValues({ type: ['x'] })).toEqual(['x']);
    expect(propValues({ type: 'string' })).toBeUndefined();
    expect(propValues('boolean')).toBeUndefined();
    expect(manifestAxes(button)).toEqual({ size: ['sm', 'md'], tone: ['neutral', 'danger'] });
  });

  it('adds data-* booleans from states to the contract list', () => {
    const b = booleanStates(button);
    expect(b).toContain('data-disabled');
    expect(b).toContain('data-full-width');
    expect(b).not.toContain('hover');
  });

  it('splits keyboard map entries', () => {
    expect(splitKeys('Home, End')).toEqual(['Home', 'End']);
    expect(splitKeys('Enter or Space')).toEqual(['Enter', 'Space']);
    expect(splitKeys('Shift+Tab')).toEqual(['Shift+Tab']);
  });

  it('picks a key check from manifest data, not names', () => {
    expect(keyCheckFor('Tab', button)).toBe('tab');
    expect(keyCheckFor('Shift+Tab', button)).toBe('shift-tab');
    expect(keyCheckFor('Enter', button)).toBe('activate');
    expect(keyCheckFor('Escape', button)).toBe('none');
    expect(keyCheckFor('Escape', { ...button, states: ['open', 'closed'] })).toBe('escape');
    expect(keyCheckFor('ArrowDown', button)).toBe('none');
    expect(keyCheckFor('ArrowDown', { ...button, contract: { keys: { ArrowDown: { expect: 'focus-moves' } } } })).toBe('hint');
  });

  it('reads optional parts per style under test', () => {
    const styles: StyleInfo[] = [
      { id: 'desk', schemes: ['dark'], defaultScheme: 'dark', optionalParts: { button: ['controls', 'titlebar'] } },
      { id: 'studio', schemes: ['dark'], defaultScheme: 'dark', optionalParts: {} },
    ];
    // Studio does not show the desk only parts, so they may be missing there.
    expect(optionalParts(button, styles, 'studio')).toEqual(['spinner', 'controls', 'titlebar']);
    // Desk shows them, so they are required there.
    expect(optionalParts(button, styles, 'desk')).toEqual(['spinner']);
  });

  it('reads whether focus is trapped from the a11y text', () => {
    expect(trapsFocus({ ...button, a11y: { role: 'dialog, modal: keeps focus inside' } })).toBe(true);
    expect(trapsFocus({ ...button, a11y: { role: 'dialog', keys: { Tab: 'Moves inside and wraps from the last to the first' } } })).toBe(true);
    expect(trapsFocus({ ...button, a11y: { role: 'dialog. Not modal unless modal is set.' } })).toBe(false);
    expect(trapsFocus(button)).toBe(false);
    expect(trapsFocus({ ...button, a11y: { role: 'region', focus: 'While a modal dialog is open, focus stays in it' } })).toBe(false);
  });

  it('picks the trigger selector', () => {
    expect(triggerSelector(button)).toBe('[data-demo-trigger]');
    expect(triggerSelector({ ...button, contract: { trigger: '#open' } })).toBe('#open');
  });

  it('writes a partial run away from the main report', () => {
    expect(reportFile('/r', 'react', false, 7)).toBe('/r/docs/reports/contract-react.json');
    expect(reportFile('/r', 'react', true, 7)).toBe('/r/packages/contract-tests/.out/7/contract-react.partial.json');
  });

  it('keeps components ready for a framework', () => {
    const icon = { ...button, name: 'Icon', frameworks: { ...button.frameworks, react: { status: 'planned' } } };
    expect(readyComponents([icon, button], 'react').map((m) => m.name)).toEqual(['Button']);
    expect(readyComponents([icon, button], 'react', ['icon'])).toEqual([]);
    expect(readyComponents([button], 'angular')).toEqual([]);
  });
});

describe('anatomyFindings', () => {
  it('passes when every required part shows and nothing else does', () => {
    const scan = { roots: 2, rootPart: [], parts: [{ root: 0, part: 'label', where: 'a' }, { root: 1, part: 'icon-start', where: 'b' }] };
    expect(anatomyFindings(button.anatomy ?? [], ['spinner'], scan)).toEqual([]);
  });

  it('reports missing, unknown and root parts', () => {
    const scan = { roots: 1, rootPart: ['button'], parts: [{ root: 0, part: 'lable', where: 'span' }] };
    const f = anatomyFindings(button.anatomy ?? [], [], scan);
    expect(f.some((x) => x.includes('"label" is in the anatomy'))).toBe(true);
    expect(f.some((x) => x.includes('"spinner" is in the anatomy'))).toBe(true);
    expect(f.some((x) => x.includes('data-part="lable" is not in the anatomy'))).toBe(true);
    expect(f.some((x) => x.includes('data-part="root"'))).toBe(true);
  });

  it('reports a missing root', () => {
    expect(anatomyFindings(['root'], [], { roots: 0, rootPart: [], parts: [] })).toEqual(['no root element found']);
  });
});

describe('variantFindings', () => {
  const root = (attrs: Record<string, string>, inVariants = true) => ({ attrs, inVariants, where: 'x' });
  it('passes when every value shows in the variants case', () => {
    const roots = [root({ size: 'sm', tone: 'neutral' }), root({ size: 'md', tone: 'danger' })];
    expect(variantFindings(button, roots, true)).toEqual([]);
  });

  it('reports values out of the manifest, not shared, and never shown', () => {
    const roots = [root({ size: 'lg', tone: 'neutral' }), root({ size: 'big' }), root({ emphasis: 'solid' }), root({ size: 'md', tone: 'danger' }, false)];
    const f = variantFindings(button, roots, true);
    expect(f).toContain('data-size="lg" is not in props.size (sm, md) (x)');
    expect(f).toContain('data-size="big" is not a shared word (xs, sm, md, lg, xl, 2xl) (x)');
    expect(f).toContain('data-emphasis="solid" on a root, but the manifest has no emphasis prop (x)');
    expect(f).toContain('variants case never shows data-size: sm, md');
    expect(f).toContain('variants case never shows data-tone: danger');
  });

  it('reports manifest values that are not shared words and a missing variants case', () => {
    const odd = { ...button, props: { size: ['small'] } };
    const f = variantFindings(odd, [], false);
    expect(f[0]).toMatch(/props.size has "small"/);
    expect(f).toContain('the manifest declares size but the demo has no variants case');
  });
});

describe('stateFindings and stateClasses', () => {
  it('flags state classes and leaves other classes alone', () => {
    expect(stateClasses('is-open btn--disabled active foo bar-baz')).toEqual(['is-open', 'btn--disabled', 'active']);
    expect(stateClasses('card  card--compact')).toEqual([]);
  });

  it('flags boolean states with a value and unlisted data-state', () => {
    const f = stateFindings({ ...button, states: ['open', 'closed'] }, [
      { where: 'a', booleans: { 'data-disabled': '' }, dataState: 'open', className: '' },
      { where: 'b', booleans: { 'data-loading': 'true' }, dataState: 'checked', className: 'is-loading' },
    ]);
    expect(f).toEqual([
      'data-loading="true": a boolean state is present with an empty value, never a word (b)',
      'data-state="checked" is not in the manifest states (open, closed) (b)',
      'state written as a class: is-loading (b)',
    ]);
  });
});

describe('styles and urls', () => {
  it('discovers styles and builds the axe matrix', () => {
    const dir = mkdtempSync(join(tmpdir(), 'contract-'));
    for (const [id, schemes] of [['studio', ['dark', 'light']], ['desk', ['dark']]] as const) {
      mkdirSync(join(dir, 'packages/styles', id), { recursive: true });
      writeFileSync(join(dir, 'packages/styles', id, 'style.json'), JSON.stringify({ id, schemes, defaultScheme: 'dark' }));
    }
    mkdirSync(join(dir, 'packages/styles/no-json'), { recursive: true });
    const styles = discoverStyles(dir);
    expect(styles.map((s) => s.id)).toEqual(['desk', 'studio']);
    expect(axeMatrix(styles)).toHaveLength(6);
    const theme = { ...button, name: 'Theme', props: { style: { type: ['studio', 'desk'], default: 'studio' } } };
    expect(defaultStyle([theme], styles)?.id).toBe('studio');
    expect(defaultStyle([], styles)?.id).toBe('desk');
  });

  it('builds the gallery url from the url contract', () => {
    expect(demoPath('icon-button', { style: 'desk', scheme: 'light', dir: 'rtl', lang: 'ar' })).toBe('/c/icon-button?style=desk&scheme=light&dir=rtl&lang=ar&chrome=0');
    expect(demoPath('input', { style: 'studio', density: 'compact', dir: 'ltr', lang: 'en', case: 'variants' })).toBe('/c/input?style=studio&density=compact&dir=ltr&lang=en&case=variants&chrome=0');
  });

  it('tells controls from other components with a size prop', () => {
    expect(isControl(button)).toBe(true);
    expect(isControl({ ...button, a11y: { focus: 'Never focusable.' } })).toBe(false);
    expect(isControl({ ...button, props: { size: { type: ['sm', 'md', 'lg', 'xl', '2xl'] } } })).toBe(false);
    expect(isControl({ ...button, states: ['open', 'closed'] })).toBe(false);
    expect(isControl({ ...button, props: {} })).toBe(false);
  });
});

describe('formatAxe', () => {
  it('names both colors and the ratio for contrast', () => {
    const lines = formatAxe(
      [
        {
          id: 'color-contrast',
          impact: 'serious',
          help: 'Elements must meet minimum color contrast ratio thresholds',
          nodes: [{ target: ['#a'], html: '<span id="a">Save</span>', any: [{ id: 'color-contrast', data: { fgColor: '#777777', bgColor: '#000000', contrastRatio: 4.1, expectedContrastRatio: '4.5:1', fontSize: '10.5pt (14px)', fontWeight: 'normal' } }], all: [], none: [] }],
        },
        { id: 'button-name', impact: 'critical', help: 'Buttons must have discernible text', nodes: [{ target: ['#b'], html: '<button id="b"></button>', any: [], all: [], none: [] }] },
      ],
      { '#a': '[data-ds=button] case variants' },
    );
    expect(lines[0]).toContain('text #777777 on #000000, 4.1:1, needs 4.5:1');
    expect(lines[0]).toContain('in [data-ds=button] case variants');
    expect(lines[1]).toContain('button-name (critical)');
  });
});
