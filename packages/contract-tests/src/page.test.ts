// @vitest-environment jsdom
// The in-page scans on a small DOM. Layout based functions (target size,
// reflow) need a real browser and run only in the Playwright suite.
import { beforeEach, describe, expect, it } from 'vitest';
import { markTarget, scanAnatomy, scanDisabled, scanStates, scanVariants } from './page';

beforeEach(() => {
  document.body.innerHTML = `
    <section data-demo-case="variants">
      <div data-ds="field" data-orientation="vertical">
        <label data-part="label">Name<span data-part="required">*</span></label>
        <div data-ds="input" data-size="md" data-shape="pill">
          <span data-part="start"><svg data-ds="icon" data-size="md"></svg></span>
          <input data-part="control" />
        </div>
        <p data-part="description">Hint</p>
      </div>
      <div data-ds="dialog"><button data-ds="icon-button" data-part="close" class="is-open"></button></div>
    </section>
    <section data-demo-case="disabled">
      <div data-ds="input" data-size="sm" data-disabled=""><input data-part="control" disabled /></div>
      <div data-ds="input" data-size="sm" data-disabled="true"><input data-part="control" /></div>
      <div data-ds="input" data-size="sm" data-disabled="" aria-disabled="true"><input data-part="control" /></div>
    </section>`;
});

describe('scanAnatomy: the part ownership walk', () => {
  it('gives each part to the nearest root above it', () => {
    const field = scanAnatomy('field');
    expect(field.roots).toBe(1);
    expect(field.parts.map((p) => p.part).sort()).toEqual(['description', 'label', 'required']);
    const input = scanAnatomy('input');
    expect(input.roots).toBe(4);
    expect(input.parts.filter((p) => p.root === 0).map((p) => p.part)).toEqual(['start', 'control']);
  });

  it('gives a part on a nested root to the parent root', () => {
    expect(scanAnatomy('dialog').parts.map((p) => p.part)).toEqual(['close']);
    expect(scanAnatomy('icon-button').parts).toEqual([]);
  });

  it('reports where a part is', () => {
    expect(scanAnatomy('field').parts[0]?.where).toBe('label[data-part=label] in case variants');
  });
});

describe('scanVariants', () => {
  it('reads the axes and the case of every root', () => {
    const r = scanVariants('input');
    expect(r.hasVariantsCase).toBe(true);
    expect(r.roots[0]).toMatchObject({ attrs: { size: 'md', shape: 'pill' }, inVariants: true });
    expect(r.roots[1]).toMatchObject({ attrs: { size: 'sm' }, inVariants: false });
  });
});

describe('scanStates', () => {
  it('reads booleans and classes on roots and owned parts', () => {
    const hits = scanStates({ kebab: 'input', booleans: ['data-disabled'] });
    expect(hits.filter((h) => 'data-disabled' in h.booleans).map((h) => h.booleans['data-disabled'])).toEqual(['', 'true', '']);
    const dialog = scanStates({ kebab: 'dialog', booleans: [] });
    expect(dialog.map((h) => h.className)).toContain('is-open');
  });
});

describe('scanDisabled', () => {
  it('flags a focusable control in a disabled root without aria-disabled', () => {
    const r = scanDisabled('input');
    expect(r.disabledRoots).toBe(3);
    expect(r.failures).toHaveLength(1);
    expect(r.failures[0]).toContain('in case disabled');
  });
});

describe('markTarget', () => {
  it('marks the first enabled root and its tab stop', () => {
    expect(markTarget({ kebab: 'input', button: false })).toBe('div[data-ds=input] in case variants');
    expect(document.querySelectorAll('[data-contract-target]')).toHaveLength(1);
    expect(document.querySelector('[data-contract-stop]')?.tagName).toBe('INPUT');
    expect(markTarget({ kebab: 'input', button: true })).toBeNull();
  });
});
