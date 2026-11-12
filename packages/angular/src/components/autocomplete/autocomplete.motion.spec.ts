// Order 1.22 motion of Autocomplete: menu-rows (the options stagger in each time the
// popup opens), with React's arguments. jsdom has no Web Animations
// API, so Element.animate records each call; a replay of the primitive with
// React's arguments must record the same calls.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { staggerGroup } from '@the-system/motion';
import { injectMotion } from '../../internal/motion';
import { DsAutocomplete } from './autocomplete';

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
  imports: [DsAutocomplete],
  template: `<div dsAutocomplete aria-label="Fruit" [items]="fruit" [(open)]="open"></div>`,
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

describe('autocomplete motion, order 1.22', () => {
  for (const reduced of [false, true]) {
    it(`menu-rows: the options stagger in after the surface with React's staggerGroup arguments${reduced ? ' (reduced)' : ''}`, async () => {
      if (reduced) document.documentElement.setAttribute('data-motion', 'reduce');
      const { host, settle, rows, motion } = await setup();
      take();
      host.open.set(true);
      await settle();
      const got = ids(take(), 'stagger');
      expect(rows().length).toBeGreaterThan(0);
      expect(got).toHaveLength(rows().length);
      staggerGroup(rows(), { phase: 'enter', offset: 1, spring: 'soft', mode: motion.mode('menu-rows') });
      expect(got).toEqual(take());
      for (const row of rows()) expect(row.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    });
  }
});
