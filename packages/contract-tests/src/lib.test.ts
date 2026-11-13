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
  hasOpenChecks,
  isControl,
  kebabCase,
  keyCheckFor,
  manifestAxes,
  moveDirection,
  moveDistance,
  moveFinding,
  openedKebab,
  optionalParts,
  parseValuedState,
  propValues,
  readyComponents,
  reportFile,
  shiftMovesFurther,
  splitKeys,
  stateClasses,
  stateFindings,
  trapsFocus,
  triggerSelector,
  valuedStates,
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
    expect(reportFile('/r', 'react', false, 7, 'liquid')).toBe('/r/docs/reports/contract-react-liquid.json');
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

  it('reads valued states as data-<name>=a|b and checks their values', () => {
    expect(parseValuedState('data-level=low|medium|high')).toEqual({ attr: 'data-level', values: ['low', 'medium', 'high'] });
    expect(parseValuedState('data-level')).toBeUndefined();
    expect(parseValuedState('open')).toBeUndefined();
    expect(parseValuedState('data-level=')).toBeUndefined();
    const meter: Manifest = { ...button, states: ['data-zoomed', 'data-level=low|medium|high'] };
    expect(valuedStates(meter)).toEqual({ 'data-level': ['low', 'medium', 'high'] });
    expect(booleanStates(meter)).toContain('data-zoomed');
    expect(booleanStates(meter).some((s) => s.startsWith('data-level'))).toBe(false);
    const f = stateFindings(meter, [
      { where: 'a', booleans: {}, valued: { 'data-level': 'high' }, dataState: null, className: '' },
      { where: 'b', booleans: {}, valued: { 'data-level': 'full' }, dataState: null, className: '' },
    ]);
    expect(f).toEqual(['data-level="full" is not one of the manifest values (low, medium, high) (b)']);
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
    expect(demoPath('switch', { style: 'liquid', platform: 'ios', dir: 'ltr', lang: 'en' })).toBe('/c/switch?style=liquid&platform=ios&dir=ltr&lang=en&chrome=0');
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

describe('the moves expectation', () => {
  it('reads the direction from the key, flipping inline keys in rtl', () => {
    expect(moveDirection('ArrowRight', 'ltr')).toEqual({ dx: 1, dy: 0 });
    expect(moveDirection('ArrowRight', 'rtl')).toEqual({ dx: -1, dy: 0 });
    expect(moveDirection('Shift+ArrowLeft', 'rtl')).toEqual({ dx: 1, dy: 0 });
    expect(moveDirection('ArrowUp', 'rtl')).toEqual({ dx: 0, dy: -1 });
    expect(moveDirection('Enter', 'ltr')).toBeUndefined();
  });

  it('keeps the screen direction for a physical hint in rtl', () => {
    expect(moveDirection('ArrowRight', 'rtl', true)).toEqual({ dx: 1, dy: 0 });
    expect(moveDirection('Shift+ArrowLeft', 'rtl', true)).toEqual({ dx: -1, dy: 0 });
    const at = { x: 40, y: 300 };
    expect(moveFinding('ArrowRight', 'rtl', at, { x: 56, y: 300 }, true)).toBeNull();
    expect(moveFinding('ArrowRight', 'rtl', at, { x: 24, y: 300 }, true)).toMatch(/moved by x -16/);
    expect(moveDistance('ArrowLeft', 'rtl', at, { x: 24, y: 300 }, true)).toBe(16);
  });

  it('fails a root that does not move, moves the wrong way, or leaves', () => {
    const at = { x: 40, y: 300 };
    expect(moveFinding('ArrowRight', 'ltr', at, { x: 40, y: 300 })).toMatch(/moved by x 0, y 0/);
    expect(moveFinding('ArrowRight', 'ltr', at, { x: 24, y: 300 })).toMatch(/moved by x -16/);
    expect(moveFinding('ArrowDown', 'ltr', at, { x: 56, y: 300 })).not.toBeNull();
    expect(moveFinding('ArrowRight', 'ltr', at, null)).toMatch(/left the page/);
    expect(moveFinding('ArrowRight', 'ltr', null, at)).toMatch(/not in a root/);
    expect(moveFinding('Enter', 'ltr', at, at)).toMatch(/names no direction/);
  });

  it('passes a root that moves in the key direction', () => {
    const at = { x: 40, y: 300 };
    expect(moveFinding('ArrowRight', 'ltr', at, { x: 56, y: 300 })).toBeNull();
    expect(moveFinding('ArrowRight', 'rtl', at, { x: 24, y: 300 })).toBeNull();
    expect(moveFinding('ArrowUp', 'ltr', at, { x: 40, y: 284 })).toBeNull();
    expect(moveDistance('Shift+ArrowRight', 'ltr', at, { x: 104, y: 300 })).toBe(64);
  });

  it('reads from the keyboard map whether Shift moves further', () => {
    const win: Manifest = {
      ...button,
      a11y: { keys: { ArrowRight: 'Moves the window 16px to the right', 'Shift+ArrowUp, Shift+ArrowRight': 'Moves the window 64px' } },
    };
    expect(shiftMovesFurther(win, 'Shift+ArrowRight')).toBe(true);
    expect(shiftMovesFurther(win, 'ArrowRight')).toBe(false);
    expect(shiftMovesFurther({ ...win, a11y: { keys: { ArrowUp: 'Moves up', 'Shift+ArrowUp': 'Moves further up' } } }, 'Shift+ArrowUp')).toBe(true);
    expect(shiftMovesFurther({ ...win, a11y: { keys: { ArrowUp: 'Moves up 16px', 'Shift+ArrowUp': 'Moves up 16px' } } }, 'Shift+ArrowUp')).toBe(false);
  });
});

describe('contract.opens', () => {
  const split: Manifest = { name: 'SplitButton', kind: 'component', states: ['data-disabled'], frameworks: {}, contract: { opens: 'dropdown-menu' } };
  const own: Manifest = { name: 'Dialog', kind: 'component', states: ['open', 'closed'], frameworks: {} };
  const still: Manifest = { name: 'Badge', kind: 'component', frameworks: {} };

  it('names the root the trigger opens', () => {
    expect(openedKebab(split, 'split-button')).toBe('dropdown-menu');
    expect(openedKebab(own, 'dialog')).toBe('dialog');
  });

  it('runs the open checks for a component that opens itself or names what it opens', () => {
    expect(hasOpenChecks(split)).toBe(true);
    expect(hasOpenChecks(own)).toBe(true);
    expect(hasOpenChecks(still)).toBe(false);
  });
});
