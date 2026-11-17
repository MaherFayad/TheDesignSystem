// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { MODALITY_ATTRIBUTE, acquireModality, isModalityKey, modalityOf, takesText } from './modality';

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute(MODALITY_ATTRIBUTE);
});

function key(target: Element, k: string, init: KeyboardEventInit = {}) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...init }));
}

describe('modality keys', () => {
  it('counts focus navigation keys anywhere', () => {
    const input = document.createElement('input');
    for (const k of ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Escape', 'F6']) {
      expect(isModalityKey({ key: k, target: input })).toBe(true);
    }
  });

  it('counts Enter and Space only on a control that takes no text', () => {
    const button = document.createElement('div');
    const input = document.createElement('input');
    const box = document.createElement('input');
    box.type = 'checkbox';
    expect(isModalityKey({ key: 'Enter', target: button })).toBe(true);
    expect(isModalityKey({ key: ' ', target: button })).toBe(true);
    expect(isModalityKey({ key: ' ', target: box })).toBe(true);
    expect(isModalityKey({ key: 'Enter', target: input })).toBe(false);
    expect(isModalityKey({ key: ' ', target: input })).toBe(false);
  });

  it('ignores letters, digits, modifiers, shortcuts and composition', () => {
    expect(isModalityKey({ key: 'a' })).toBe(false);
    expect(isModalityKey({ key: '5' })).toBe(false);
    expect(isModalityKey({ key: 'Shift' })).toBe(false);
    expect(isModalityKey({ key: 'Tab', ctrlKey: true })).toBe(false);
    expect(isModalityKey({ key: 'ArrowLeft', metaKey: true })).toBe(false);
    expect(isModalityKey({ key: 'ArrowLeft', isComposing: true })).toBe(false);
  });

  it('knows which targets take text', () => {
    const area = document.createElement('textarea');
    const range = document.createElement('input');
    range.type = 'range';
    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    Object.defineProperty(editable, 'isContentEditable', { value: true });
    expect(takesText(area)).toBe(true);
    expect(takesText(editable)).toBe(true);
    expect(takesText(range)).toBe(false);
    expect(takesText(null)).toBe(false);
  });
});

describe('the modality flag on the document', () => {
  it('has no attribute until an input is seen', () => {
    const release = acquireModality(document);
    expect(document.documentElement.hasAttribute(MODALITY_ATTRIBUTE)).toBe(false);
    expect(modalityOf(document)).toBeNull();
    release();
  });

  it('follows the keyboard and the pointer', () => {
    const release = acquireModality(document);
    document.body.innerHTML = '<div id="x" tabindex="0"></div><input id="i" />';
    const x = document.getElementById('x')!;
    const i = document.getElementById('i')!;
    key(x, 'Tab');
    expect(modalityOf(document)).toBe('keyboard');
    x.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(modalityOf(document)).toBe('pointer');
    // Typing into a field after a tap keeps the pointer modality.
    key(i, 'a');
    key(i, ' ');
    key(i, 'Enter');
    expect(modalityOf(document)).toBe('pointer');
    key(i, 'ArrowUp');
    expect(modalityOf(document)).toBe('keyboard');
    x.dispatchEvent(new Event('touchstart', { bubbles: true }));
    expect(modalityOf(document)).toBe('pointer');
    key(x, 'Enter');
    expect(modalityOf(document)).toBe('keyboard');
    x.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(modalityOf(document)).toBe('pointer');
    release();
  });

  it('sees events a component stops, through the capture phase', () => {
    const release = acquireModality(document);
    document.body.innerHTML = '<div id="x"></div>';
    const x = document.getElementById('x')!;
    x.addEventListener('keydown', (e) => e.stopPropagation());
    key(x, 'Tab');
    expect(modalityOf(document)).toBe('keyboard');
    release();
  });

  it('is shared, and the last release removes the listeners and the attribute', () => {
    const a = acquireModality(document);
    const b = acquireModality(document);
    key(document.body, 'Tab');
    a();
    a();
    expect(modalityOf(document)).toBe('keyboard');
    b();
    expect(document.documentElement.hasAttribute(MODALITY_ATTRIBUTE)).toBe(false);
    key(document.body, 'Tab');
    expect(document.documentElement.hasAttribute(MODALITY_ATTRIBUTE)).toBe(false);
  });
});
