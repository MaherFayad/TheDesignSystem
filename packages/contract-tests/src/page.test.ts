// @vitest-environment jsdom
// The in-page scans on a small DOM. Layout based functions (target size,
// reflow) need a real browser and run only in the Playwright suite.
import { beforeEach, describe, expect, it } from 'vitest';
import { closingDone, freshOpen, keySnapshot, markClosing, markFocusedRoot, movingRootBox, markSeen, markTarget, scanAnatomy, scanDisabled, scanStates, scanVariants, staticDataState } from './page';

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
    const field = scanAnatomy({ kebab: 'field' });
    expect(field.roots).toBe(1);
    expect(field.parts.map((p) => p.part).sort()).toEqual(['description', 'label', 'required']);
    const input = scanAnatomy({ kebab: 'input' });
    expect(input.roots).toBe(4);
    expect(input.parts.filter((p) => p.root === 0).map((p) => p.part)).toEqual(['start', 'control']);
  });

  it('gives a part on a nested root to the parent root', () => {
    expect(scanAnatomy({ kebab: 'dialog' }).parts.map((p) => p.part)).toEqual(['close']);
    expect(scanAnatomy({ kebab: 'icon-button' }).parts).toEqual([]);
  });

  it('reports where a part is', () => {
    expect(scanAnatomy({ kebab: 'field' }).parts[0]?.where).toBe('label[data-part=label] in case variants');
  });
});

describe('scanVariants', () => {
  it('reads the axes and the case of every root', () => {
    const r = scanVariants({ kebab: 'input' });
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

  it('reads the valued state attributes it is asked for', () => {
    const hits = scanStates({ kebab: 'input', booleans: [], valued: ['data-size'] });
    expect(hits.filter((h) => h.valued && 'data-size' in h.valued).map((h) => h.valued?.['data-size'])).toEqual(['md', 'sm', 'sm', 'sm']);
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

describe('nested components (Window, TitleBar, Dialog close)', () => {
  it('counts a part on a nested root for the outer root, and the parts inside it for the nested one', () => {
    document.body.innerHTML = `
      <div data-ds="window">
        <div data-ds="title-bar" data-part="titlebar">
          <div data-ds="window-controls" data-part="controls">
            <button data-ds="icon-button" data-part="close"><span data-part="icon"></span></button>
          </div>
          <h2 data-part="title">Board</h2>
        </div>
        <div data-part="body"></div>
      </div>`;
    expect(scanAnatomy({ kebab: 'window' }).parts.map((p) => p.part)).toEqual(['titlebar', 'body']);
    expect(scanAnatomy({ kebab: 'title-bar' }).parts.map((p) => p.part)).toEqual(['controls', 'title']);
    expect(scanAnatomy({ kebab: 'window-controls' }).parts.map((p) => p.part)).toEqual(['close']);
    expect(scanAnatomy({ kebab: 'icon-button' }).parts.map((p) => p.part)).toEqual(['icon']);
  });
});

describe('overlays: roots a trigger adds', () => {
  it('tells opened roots from static examples', () => {
    document.body.innerHTML = `
      <section data-demo-case="variants"><div data-ds="toast" data-tone="info"><span data-part="title"></span></div></section>
      <ol data-ds="toaster"></ol>`;
    expect(markSeen('toast')).toBe(1);
    expect(freshOpen('toast')).toBe(0);
    document.querySelector('[data-ds="toaster"]')!.innerHTML = '<li data-ds="toast" data-tone="danger" data-state="open"><span data-part="icon"></span></li>';
    expect(freshOpen('toast')).toBe(1);
    expect(scanAnatomy({ kebab: 'toast', fresh: true }).parts.map((p) => p.part)).toEqual(['icon']);
    const v = scanVariants({ kebab: 'toast', fresh: true, asVariants: true });
    expect(v.roots).toEqual([{ attrs: { tone: 'danger' }, inVariants: true, where: 'li[data-ds=toast] opened by a trigger' }]);
    expect(scanStates({ kebab: 'toast', booleans: [], fresh: true }).map((h) => h.dataState)).toEqual(['open', null]);
    document.querySelector('[data-ds="toaster"] [data-ds="toast"]')!.setAttribute('data-state', 'closed');
    expect(freshOpen('toast')).toBe(0);
    expect(markTarget({ kebab: 'toast', button: false, fresh: true })).toBeNull();
  });

  it('flags a static example that stamps data-state', () => {
    document.body.innerHTML = '<section data-demo-case="one"><div data-ds="toast" data-state="open"></div><div data-ds="toast"></div></section>';
    expect(staticDataState('toast')).toEqual(['div[data-ds=toast][data-state=open] in case one']);
  });
});

describe('moves and closes fixtures', () => {
  it('a root that does not move fails the moves check', async () => {
    const { moveFinding } = await import('./lib');
    document.body.innerHTML = '<div data-ds="window"><div data-part="move" tabindex="0"></div></div>';
    (document.querySelector('[data-part="move"]') as HTMLElement).focus();
    const start = markFocusedRoot('window');
    expect(start).toMatchObject({ x: 0, y: 0, dir: 'ltr' });
    expect(moveFinding('ArrowRight', 'ltr', start, movingRootBox())).toMatch(/moved by x 0, y 0/);
  });

  it('closes: the root that held focus leaves or hides', () => {
    document.body.innerHTML = '<div data-ds="window"><button>Close</button></div>';
    expect(markClosing('window')).toBe(false);
    document.querySelector('button')!.focus();
    expect(markClosing('window')).toBe(true);
    expect(closingDone()).toBe(false);
    document.querySelector('[data-ds="window"]')!.setAttribute('data-state', 'closed');
    expect(closingDone()).toBe(true);
    document.body.innerHTML = '';
    expect(closingDone()).toBe(true);
  });

  it('state-changes sees a boolean state the manifest lists', () => {
    document.body.innerHTML = '<div data-ds="window" data-state="active"><button>Zoom</button></div>';
    document.querySelector('button')!.focus();
    const before = keySnapshot({ kebab: 'window', attrs: ['data-zoomed'] });
    document.querySelector('[data-ds="window"]')!.setAttribute('data-zoomed', '');
    expect(keySnapshot({ kebab: 'window', attrs: ['data-zoomed'] }).states).not.toBe(before.states);
  });
});
