// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { captureFocusReturn, dialogInitialFocus, focusReturnTarget } from './dialog-focus';

afterEach(() => {
  document.body.innerHTML = '';
});

function panel(html: string): HTMLElement {
  document.body.innerHTML = `<div data-ds="dialog"><div data-part="panel" role="dialog">${html}</div></div>`;
  return document.querySelector<HTMLElement>('[data-part="panel"]') as HTMLElement;
}

const footer = (buttons: string) => `<div data-part="footer">${buttons}</div>`;

describe('dialogInitialFocus', () => {
  it('takes data-autofocus first', () => {
    const p = panel(`<div data-part="body"><input id="a"><button id="b" data-autofocus></button></div>`);
    expect(dialogInitialFocus(p)?.id).toBe('b');
  });

  it('then the first field in the body, skipping disabled and hidden ones', () => {
    const p = panel(`<div data-part="body"><input type="hidden"><input id="x" disabled><textarea id="t"></textarea></div>${footer('<button id="f">Keep</button>')}`);
    expect(dialogInitialFocus(p)?.id).toBe('t');
  });

  it('then the first footer action that is not tone danger', () => {
    const p = panel(footer('<button id="d" data-tone="danger">Discard</button><button id="k">Keep</button>'));
    expect(dialogInitialFocus(p)?.id).toBe('k');
  });

  it('in a danger dialog, the Cancel action, never the destructive one', () => {
    const p = panel(footer('<button id="d" data-tone="danger">Delete</button><button id="c" data-dialog-cancel>Keep</button>'));
    expect(dialogInitialFocus(p, 'danger')?.id).toBe('c');
    const q = panel(footer('<button id="d" data-tone="danger">Delete</button><button id="k">Keep</button>'));
    expect(dialogInitialFocus(q, 'danger')?.id).toBe('k');
  });

  it('then the close control, or null', () => {
    const p = panel(`<button data-part="close" id="x"></button>${footer('<button data-tone="danger">Delete</button>')}`);
    expect(dialogInitialFocus(p, 'danger')?.id).toBe('x');
    expect(dialogInitialFocus(panel('<p>Text</p>'))).toBeNull();
  });

  it('ignores the parts of a dialog nested inside the panel', () => {
    const p = panel(`<div><div data-part="panel"><div data-part="body"><input id="inner"></div></div></div>${footer('<button id="k">Keep</button>')}`);
    expect(dialogInitialFocus(p)?.id).toBe('k');
  });
});

describe('focus return', () => {
  it('returns the target while it is connected', () => {
    document.body.innerHTML = '<main><button id="t">Open</button></main>';
    const memo = captureFocusReturn(document.getElementById('t'));
    expect(focusReturnTarget(memo, document)?.id).toBe('t');
  });

  it('falls back to the nearest connected focusable ancestor when the target is gone', () => {
    document.body.innerHTML = '<main><ul id="list" tabindex="-1"><li id="row"><button id="t">Delete board</button></li></ul></main>';
    const memo = captureFocusReturn(document.getElementById('t'));
    document.getElementById('row')?.remove();
    expect(focusReturnTarget(memo, document)?.id).toBe('list');
  });

  it('then to the first tab stop of main, then to the body', () => {
    document.body.innerHTML = '<main><button id="first">Create board</button><div id="row"><button id="t">Delete</button></div></main>';
    const memo = captureFocusReturn(document.getElementById('t'));
    document.getElementById('row')?.remove();
    expect(focusReturnTarget(memo, document)?.id).toBe('first');
    document.body.innerHTML = '<div id="row"><button id="t2">Delete</button></div>';
    const memo2 = captureFocusReturn(document.getElementById('t2'));
    document.getElementById('row')?.remove();
    expect(focusReturnTarget(memo2, document)).toBe(document.body);
  });

  it('captures nothing for null or the body', () => {
    expect(captureFocusReturn(null)).toEqual({ target: null, path: [] });
    expect(captureFocusReturn(document.body)).toEqual({ target: null, path: [] });
    expect(focusReturnTarget(captureFocusReturn(null))).toBeNull();
  });
});
