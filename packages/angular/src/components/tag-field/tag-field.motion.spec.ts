// Order 1.22 motion of TagField: menu-rows (the options stagger in each time the
// popup opens) and collection-flip (the tags and the input), with React's arguments. jsdom has no Web Animations
// API, so Element.animate records each call; a replay of the primitive with
// React's arguments must record the same calls.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { staggerGroup } from '@the-system/motion';
import { injectMotion } from '../../internal/motion';
import { DsTagField } from './tag-field';

interface Call {
  el: Element;
  frames: Keyframe[];
  opts: KeyframeAnimationOptions;
}

let calls: Call[] = [];
const take = (): Call[] => {
  const out = calls;
  calls = [];
  return out;
};
const ids = (list: Call[], id: string) => list.filter((c) => String(c.opts.id) === `ds-motion:${id}`);

beforeEach(() => {
  calls = [];
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value: vi.fn(function (this: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
      calls.push({ el: this, frames, opts });
      return { id: String(opts?.id ?? ''), finished: new Promise(() => undefined), cancel: vi.fn() } as unknown as Animation;
    }),
  });
});

afterEach(() => {
  Reflect.deleteProperty(Element.prototype, 'animate');
  document.documentElement.removeAttribute('data-motion');
  vi.restoreAllMocks();
  for (const el of Array.from(document.querySelectorAll('[data-menu-layer]'))) el.remove();
});

@Component({
  imports: [DsTagField],
  template: `<div dsTagField aria-label="Tags" [defaultValue]="['Design']" [suggestions]="fruit"></div>`,
})
class Host {
  readonly fruit = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
  ];
  readonly open = signal<boolean | undefined>(false);
  readonly value = signal<readonly string[]>(['apple']);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
  };
  const rows = () => Array.from(document.querySelectorAll<HTMLElement>("[data-menu-layer] [data-ds='list-box'] [data-part='option']"));
  const motion = TestBed.runInInjectionContext(() => injectMotion());
  return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement, settle, rows, motion };
}

describe('tag-field motion, order 1.22', () => {
  for (const reduced of [false, true]) {
    it(`menu-rows: the options stagger in after the surface with React's staggerGroup arguments${reduced ? ' (reduced)' : ''}`, async () => {
      if (reduced) document.documentElement.setAttribute('data-motion', 'reduce');
      const { root, settle, rows, motion } = await setup();
      take();
      const control = root.querySelector('input[data-part="control"]') as HTMLInputElement;
      control.value = 'a';
      control.dispatchEvent(new Event('input', { bubbles: true }));
      await settle();
      const got = ids(take(), 'stagger');
      expect(rows().length).toBeGreaterThan(0);
      expect(got).toHaveLength(rows().length);
      staggerGroup(rows(), { phase: 'enter', offset: 1, spring: 'soft', mode: motion.mode('menu-rows') });
      expect(got).toEqual(take());
      for (const row of rows()) expect(row.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    });
  }

  it('collection-flip: an added tag pops in, a removed one shrinks out as an inert clone', async () => {
    const { root, settle } = await setup();
    const control = root.querySelector('input[data-part="control"]') as HTMLInputElement;
    take();
    control.value = 'Brand';
    control.dispatchEvent(new Event('input', { bubbles: true }));
    control.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await settle();
    const tags = () => Array.from(root.querySelectorAll('[data-part="tags"] > [data-part="tag"]:not([inert])'));
    expect(tags().map((t) => t.querySelector('[data-part="tag-label"]')?.textContent)).toEqual(['Design', 'Brand']);
    expect(ids(take(), 'flip').map((c) => c.el)).toContain(tags()[1]);
    (tags()[0]!.querySelector('[data-part="tag-remove"]') as HTMLElement).click();
    await settle();
    const clone = root.querySelector('[inert]');
    expect(clone?.getAttribute('aria-hidden')).toBe('true');
    expect(ids(take(), 'flip-exit').map((c) => c.el)).toEqual([clone]);
  });
});
