// Order 1.22 motion of Select: menu-rows (the rows stagger in on open),
// row-glide (each item holds the fill layer) and picker-value-roll (a new
// value rolls into the trigger, not on first paint), with React's arguments.
// jsdom has no Web Animations API, so Element.animate records each call; a
// replay of the primitive with React's arguments must record the same calls.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { staggerGroup } from '@the-system/motion';
import { injectMotion } from '../../internal/motion';
import { DsSelect } from './select';

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
  imports: [DsSelect],
  template: `<button dsSelect aria-label="Fruit" [items]="fruit" [(value)]="value" [(open)]="open"></button>`,
})
class Host {
  readonly fruit = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
  ];
  readonly value = signal<string | null | undefined>('apple');
  readonly open = signal<boolean | undefined>(false);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
  };
  const trigger = fixture.nativeElement.querySelector('[data-ds="select"]') as HTMLElement;
  const items = () => Array.from(document.querySelectorAll<HTMLElement>('[data-menu-layer] [data-part="viewport"] [data-part="item"]'));
  const motion = TestBed.runInInjectionContext(() => injectMotion());
  return { fixture, host: fixture.componentInstance, settle, trigger, items, motion };
}

describe('select motion, order 1.22', () => {
  for (const reduced of [false, true]) {
    it(`menu-rows: the rows stagger in after the surface with React's staggerGroup arguments${reduced ? ' (reduced)' : ''}`, async () => {
      if (reduced) document.documentElement.setAttribute('data-motion', 'reduce');
      const { host, settle, items, motion } = await setup();
      expect(ids(take(), 'stagger')).toEqual([]);
      host.open.set(true);
      await settle();
      const got = ids(take(), 'stagger');
      expect(got).toHaveLength(3);
      staggerGroup(items(), { phase: 'enter', offset: 1, spring: 'soft', mode: motion.mode('menu-rows') });
      expect(got).toEqual(take());
    });
  }

  it('row-glide: each item holds the fill layer as its first child', async () => {
    const { host, settle, items } = await setup();
    host.open.set(true);
    await settle();
    for (const item of items()) {
      expect(item.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
      expect(item.firstElementChild?.hasAttribute('data-part')).toBe(false);
    }
  });

  it("picker-value-roll: a new value rolls up into the trigger with React's arguments, not on first paint", async () => {
    const { host, settle, trigger, motion } = await setup();
    const value = trigger.querySelector('[data-part="value"]') as HTMLElement;
    expect(ids(take(), 'stagger').filter((c) => c.el === value)).toEqual([]);
    host.value.set('cherry');
    await settle();
    expect(value.textContent).toContain('Cherry');
    const got = take().filter((c) => c.el === value);
    expect(got).toHaveLength(1);
    staggerGroup([value], { from: 'block', spring: 'snappy', mode: motion.mode('picker-value-roll') });
    expect(got).toEqual(take());
  });
});
