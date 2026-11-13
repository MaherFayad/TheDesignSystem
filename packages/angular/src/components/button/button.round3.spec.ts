// Round 3 of Button (order 1.23): the result (interaction button-result),
// the glow that follows the pointer (button-glow) and the ripple origin set
// on pointer down for every family member. As React's Button.test.tsx.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { buttonMorph } from '@the-system/motion';
import { afterEach, describe, expect, it } from 'vitest';
import { DsCloseButton } from '../close-button/close-button';
import { DsButton, type ButtonResult } from './index';
import type { ButtonEmphasis } from './button-base';

@Component({
  imports: [DsButton, DsCloseButton],
  template: `
    <button id="plain" dsButton>Save changes</button>
    <button
      id="result"
      dsButton
      [result]="result()"
      [resultLabel]="resultLabel()"
      [loading]="loading()"
      [emphasis]="emphasis()"
      [disabled]="disabled()"
    >
      Save changes
    </button>
    <button id="close" dsCloseButton label="Close panel"></button>
  `,
})
class Host {
  readonly result = signal<ButtonResult | undefined>(undefined);
  readonly resultLabel = signal<string | undefined>('Saved');
  readonly loading = signal(false);
  readonly emphasis = signal<ButtonEmphasis | undefined>('solid');
  readonly disabled = signal(false);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

function rect(el: HTMLElement) {
  el.getBoundingClientRect = () => ({ left: 100, top: 50, width: 200, height: 40, right: 300, bottom: 90, x: 100, y: 50, toJSON: () => ({}) }) as DOMRect;
  Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 200 });
  Object.defineProperty(el, 'offsetHeight', { configurable: true, value: 40 });
}

function pointer(el: HTMLElement, type: 'pointermove' | 'pointerdown', clientX: number, clientY: number) {
  // jsdom has no PointerEvent constructor everywhere; a MouseEvent carries the coordinates.
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX, clientY }));
}

describe('DsButton result (interaction button-result, round 3)', () => {
  it('has no result part or status until a result shows', async () => {
    const { q } = await setup();
    const el = q('plain');
    expect(el.hasAttribute('data-result')).toBe(false);
    expect(el.querySelector('[data-part="result"]')).toBeNull();
    expect(el.querySelector('[role="status"]')).toBeNull();
    expect(el.hasAttribute('result')).toBe(false);
  });

  it('stamps data-result, draws a decorative glyph and says the result once', async () => {
    const { fixture, host, q } = await setup();
    const el = q('result');
    expect(el.querySelector('[role="status"]')?.textContent).toBe('');
    host.result.set('success');
    await fixture.whenStable();
    expect(el.getAttribute('data-result')).toBe('success');
    const glyph = el.querySelector('[data-part="result"]');
    expect(glyph?.getAttribute('aria-hidden')).toBe('true');
    const svg = glyph?.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg?.getAttribute('focusable')).toBe('false');
    const paths = Array.from(glyph?.querySelectorAll('path') ?? []);
    expect(paths.map((p) => p.getAttribute('d'))).toEqual(['M5 12.5 9.5 17 19 7']);
    expect(paths[0]?.getAttribute('pathLength')).toBe('1');
    expect(el.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(el.querySelector('[role="status"]')?.textContent).toBe('Saved');
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['label', 'result', 'status', 'hit']);
    // Order 1.29 (review N7): the ending in words beside the glyph, inside the aria-hidden result part, as React.
    const word = glyph?.querySelector(':scope > [data-result-label]');
    expect(word?.tagName).toBe('SPAN');
    expect(word?.getAttribute('data-result-label')).toBe('');
    expect(word?.textContent).toBe('Saved');
    expect(Array.from(glyph?.children ?? []).map((c) => c.tagName.toLowerCase())).toEqual(['svg', 'span']);
    // The hit part (review B10): the last child, empty and aria-hidden.
    const hit = el.lastElementChild;
    expect(hit?.getAttribute('aria-hidden')).toBe('true');
    expect(hit?.childNodes).toHaveLength(0);
  });

  it('draws the error mark in two strokes and goes back, keeping the glyph for the exit', async () => {
    const { fixture, host, q } = await setup();
    const el = q('result');
    host.result.set('error');
    await fixture.whenStable();
    expect(el.getAttribute('data-result')).toBe('error');
    expect(el.querySelectorAll('[data-part="result"] path')).toHaveLength(2);
    host.result.set(undefined);
    await fixture.whenStable();
    expect(el.hasAttribute('data-result')).toBe(false);
    expect(el.querySelectorAll('[data-part="result"] path')).toHaveLength(2);
    expect(el.querySelector('[role="status"]')?.textContent).toBe('');
  });

  it('says nothing about a result while loading', async () => {
    const { fixture, host, q } = await setup();
    host.loading.set(true);
    host.result.set('success');
    await fixture.whenStable();
    const statuses = Array.from(q('result').querySelectorAll('[role="status"]')).map((s) => s.textContent);
    expect(statuses).toEqual(['Loading', '']);
  });
});

describe('DsButton glow and ripple origin (button-glow, round 3)', () => {
  it('places the glow of a solid button where the pointer is, as a share of the box', async () => {
    const { q } = await setup();
    const el = q('result');
    rect(el);
    pointer(el, 'pointermove', 150, 60);
    expect(el.style.getPropertyValue('--_button-glow-x')).toBe('25%');
    expect(el.style.getPropertyValue('--_button-glow-y')).toBe('25%');
    pointer(el, 'pointerdown', 300, 90);
    expect(el.style.getPropertyValue('--_button-glow-x')).toBe('100%');
  });

  it('sets the ripple origin on pointer down, in px from the inline start, on every family member', async () => {
    const { q } = await setup();
    for (const id of ['plain', 'close']) {
      const el = q(id);
      rect(el);
      pointer(el, 'pointerdown', 150, 60);
      expect(el.style.getPropertyValue('--_button-ripple-x')).toBe('50px');
      expect(el.style.getPropertyValue('--_button-ripple-y')).toBe('10px');
    }
  });

  it('leaves link buttons and inert buttons alone', async () => {
    const { fixture, host, q } = await setup();
    const el = q('result');
    rect(el);
    host.emphasis.set('link');
    await fixture.whenStable();
    pointer(el, 'pointermove', 150, 60);
    expect(el.style.getPropertyValue('--_button-glow-x')).toBe('');
    host.emphasis.set('solid');
    host.disabled.set(true);
    await fixture.whenStable();
    pointer(el, 'pointermove', 150, 60);
    pointer(el, 'pointerdown', 150, 60);
    expect(el.style.getPropertyValue('--_button-glow-x')).toBe('');
    expect(el.style.getPropertyValue('--_button-ripple-x')).toBe('');
  });
});

describe('DsButton loading into a result (round 3)', () => {
  const protos = [Element.prototype, HTMLElement.prototype, SVGElement.prototype];
  const had = protos.map((p) => Object.getOwnPropertyDescriptor(p, 'animate'));
  afterEach(() =>
    protos.forEach((p, i) => {
      const d = had[i];
      if (d) Object.defineProperty(p, 'animate', d);
      else Reflect.deleteProperty(p, 'animate');
    }),
  );

  it('keeps the label out under the result glyph: only the spinner leaves, as React', async () => {
    const calls: { target: Element; keyframes: unknown; options: unknown }[] = [];
    const animate = function (this: Element, keyframes: unknown, options: unknown) {
      calls.push({ target: this, keyframes, options });
      return { playState: 'running', effect: { target: this }, finished: new Promise(() => undefined), cancel() {} };
    };
    for (const p of protos) Object.defineProperty(p, 'animate', { configurable: true, writable: true, value: animate });
    const { fixture, host, q } = await setup();
    host.loading.set(true);
    await fixture.whenStable();
    calls.splice(0);
    host.loading.set(false);
    host.result.set('success');
    await fixture.whenStable();
    const el = q('result');
    const played = calls.splice(0);
    const label = el.querySelector(':scope > [data-part="label"]');
    expect(played.map((c) => c.target)).not.toContain(label);
    buttonMorph({ root: el, label: null, spinner: el.querySelector(':scope > [data-part="spinner"]') }, 'loading', 'idle', { mode: 'full' });
    expect(played).toEqual(calls.splice(0));
  });
});
