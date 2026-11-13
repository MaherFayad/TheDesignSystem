// Order 1.22 motion of FilterBar: chip-check-pop (the check of a chip turns
// in, iconMorph), filter-count-roll (the count rolls in an aria-hidden copy
// beside the visually hidden text) and collection-flip (the parts and chips
// make room), with React's arguments. jsdom has no Web Animations API, so
// Element.animate records each call; a replay of the primitive with React's
// arguments must record the same calls.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderDigits, rollDigits } from '@the-system/motion';
import { injectMotion } from '../../internal/motion';
import { drawCheck } from '../../internal/selection-marker';
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

const PROTOS = [Element.prototype, HTMLElement.prototype, SVGElement.prototype];
const saved = new Map<object, PropertyDescriptor | undefined>();

beforeEach(() => {
  calls = [];
  // On every prototype a spec may stub, so a stub another spec file left on HTMLElement does not shadow this one.
  const record = vi.fn(function (this: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
      calls.push({ el: this, frames, opts });
      return { id: String(opts?.id ?? ''), finished: new Promise(() => undefined), cancel: vi.fn() } as unknown as Animation;
    });
  for (const proto of PROTOS) {
    saved.set(proto, Object.getOwnPropertyDescriptor(proto, 'animate'));
    Object.defineProperty(proto, 'animate', { configurable: true, writable: true, value: record });
  }
});

afterEach(() => {
  for (const proto of PROTOS) {
    const before = saved.get(proto);
    if (before) Object.defineProperty(proto, 'animate', before);
    else Reflect.deleteProperty(proto, 'animate');
  }
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
    it(`chip-check-pop (order 1.23: the check draws) and filter-count-roll play React's drawCheck and rollDigits${reduced ? ' (reduced)' : ''}`, async () => {
      if (reduced) document.documentElement.setAttribute('data-motion', 'reduce');
      const { settle, chips, roll, motion } = await setup();
      take();
      chips()[1]!.click();
      await settle();
      const got = take();
      const icon = chips()[1]!.querySelector('[data-part="icon"]')!;
      const pop = ids(got, 'check-draw-pick');
      expect(pop.length).toBeGreaterThan(0);
      expect(pop.every((c) => icon.contains(c.el))).toBe(true);
      drawCheck(icon, motion.mode('chip-check-pop'));
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

  it('chip-check-pop: a press writes the press point for a ripple, as React (platform hook)', async () => {
    const { chips } = await setup();
    const chip = chips()[0]!;
    chip.getBoundingClientRect = () => DOMRect.fromRect({ x: 10, y: 20, width: 80, height: 32 });
    chip.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 30, clientY: 28 }));
    expect(chip.style.getPropertyValue('--_chip-press-x')).toBe('20px');
    expect(chip.style.getPropertyValue('--_chip-press-y')).toBe('8px');
  });

  it('collection-flip: clear comes in and pops, a first paint plays nothing', async () => {
    const { root, settle, chips } = await setup();
    expect(ids(take(), 'flip')).toEqual([]);
    chips()[0]!.click();
    await settle();
    const clear = root.querySelector(':scope > [data-part="clear"]');
    expect(ids(take(), 'flip').map((c) => c.el)).toContain(clear);
  });
});
