// Order 1.22 motion of FilterBar: chip-check-pop (the check of a chip turns
// in, iconMorph), filter-count-roll (the count rolls in an aria-hidden copy
// beside the visually hidden text) and collection-flip (the parts and chips
// make room), with React's arguments. jsdom has no Web Animations API, so
// Element.animate records each call; a replay of the primitive with React's
// arguments must record the same calls.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { iconMorph, renderDigits, rollDigits } from '@the-system/motion';
import { injectMotion } from '../../internal/motion';
import { DsFilterBar } from './filter-bar';

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
/** A call without its element, to compare a replay on another element. */
const shape = (c: Call) => ({ frames: c.frames, opts: c.opts });

@Component({
  imports: [DsFilterBar],
  template: `<div dsFilterBar aria-label="Files" [filters]="filters" [(value)]="value" [resultCount]="128 - value().length * 37"></div>`,
})
class Host {
  readonly filters = [
    { value: 'images', label: 'Images' },
    { value: 'video', label: 'Video' },
    { value: 'docs', label: 'Documents' },
  ];
  readonly value = signal<readonly string[]>([]);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement.querySelector('[data-ds="filter-bar"]') as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const chips = () => Array.from(root.querySelectorAll<HTMLElement>('[data-part="filters"] > [data-ds="chip"]'));
  const roll = () => root.querySelector('[data-part="count"] > [aria-hidden="true"]') as HTMLElement;
  const motion = TestBed.runInInjectionContext(() => injectMotion());
  return { root, settle, chips, roll, motion };
}

describe('filter bar motion, order 1.22', () => {
  it('filter-count-roll: the count is the visually hidden text and an aria-hidden copy, written still on first paint', async () => {
    const { root, roll } = await setup();
    const count = root.querySelector('[data-part="count"]') as HTMLElement;
    expect(count.querySelector('[data-visually-hidden]')?.textContent).toBe('128 results');
    expect(roll().textContent).toBe('128 results');
    expect(ids(take(), 'digit-roll')).toEqual([]);
  });

  for (const reduced of [false, true]) {
    it(`chip-check-pop and filter-count-roll play React's iconMorph and rollDigits${reduced ? ' (reduced)' : ''}`, async () => {
      if (reduced) document.documentElement.setAttribute('data-motion', 'reduce');
      const { settle, chips, roll, motion } = await setup();
      take();
      chips()[1]!.click();
      await settle();
      const got = take();
      const glyph = chips()[1]!.querySelector('[data-part="icon"]')?.firstElementChild;
      const pop = ids(got, 'icon-morph-in');
      expect(pop.map((c) => c.el)).toEqual([glyph]);
      iconMorph({ to: glyph, turn: 45, mode: motion.mode('chip-check-pop') });
      expect(pop).toEqual(take());
      const rolled = ids(got, 'digit-roll');
      expect(roll().textContent).toBe('1 filter on, 91 results');
      const replay = document.createElement('span');
      document.body.append(replay);
      renderDigits(replay, '128 results');
      take();
      rollDigits(replay, '128 results', '1 filter on, 91 results', { direction: 'down', mode: motion.mode('filter-count-roll') });
      expect(rolled.map(shape)).toEqual(ids(take(), 'digit-roll').map(shape));
      replay.remove();
      if (reduced) expect(got.every((c) => c.frames.every((f) => f['transform'] === undefined))).toBe(true);
    });
  }

  it('collection-flip: clear comes in and pops, a first paint plays nothing', async () => {
    const { root, settle, chips } = await setup();
    expect(ids(take(), 'flip')).toEqual([]);
    chips()[0]!.click();
    await settle();
    const clear = root.querySelector(':scope > [data-part="clear"]');
    expect(ids(take(), 'flip').map((c) => c.el)).toContain(clear);
  });
});
