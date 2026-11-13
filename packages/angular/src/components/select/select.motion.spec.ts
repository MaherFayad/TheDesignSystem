// Motion of Select: menu-rows (the rows stagger in on open, order 1.22),
// highlight-marker (order 1.23: one marker in the viewport replaces the
// row-glide layer) and picker-value-roll (order 1.23: a drum roll, the old
// label on an inert copy, not on first paint), with React's arguments.
// jsdom has no Web Animations API, so Element.animate records each call; a
// replay of the primitive with React's arguments must record the same calls.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { staggerRows } from '@the-system/motion';
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
    it(`menu-rows: the rows stagger in after the surface with React's staggerRows arguments${reduced ? ' (reduced)' : ''}`, async () => {
      if (reduced) document.documentElement.setAttribute('data-motion', 'reduce');
      const { host, settle, items, motion } = await setup();
      expect(ids(take(), 'stagger')).toEqual([]);
      host.open.set(true);
      await settle();
      const got = ids(take(), 'stagger');
      expect(got).toHaveLength(motion.mode('menu-rows') === 'full' ? 6 : 3);
      // Order 1.29 (ten weakest #9): every row fades with the surface and only the rise staggers (staggerRows).
      staggerRows(document.querySelector('[data-menu-layer]'), "[data-part='viewport'] [data-part='item']", motion.mode('menu-rows'));
      expect(got).toEqual(take());
    });
  }

  it('highlight-marker: items hold no fill layer; the viewport holds one aria-hidden marker as its last child', async () => {
    const { host, settle, items } = await setup();
    host.open.set(true);
    await settle();
    for (const item of items()) expect(item.querySelector(":scope > span[aria-hidden='true']:not([data-part])")).toBeNull();
    const viewport = document.querySelector('[data-menu-layer] [data-part="viewport"]')!;
    const marker = viewport.lastElementChild as HTMLElement;
    expect(marker.getAttribute('data-part')).toBe('highlight');
    expect(marker.getAttribute('aria-hidden')).toBe('true');
    // The chosen item is focused, so lit, on open: the marker shows there.
    expect(marker.style.opacity).toBe('1');
  });

  it("picker-value-roll: the new label rolls in from below and an inert copy of the old one rolls out, with React's arguments, not on first paint", async () => {
    const { host, settle, trigger } = await setup();
    const value = trigger.querySelector('[data-part="value"]') as HTMLElement;
    expect(ids(take(), 'picker-value-roll')).toEqual([]);
    host.value.set('cherry');
    await settle();
    expect(value.textContent).toContain('Cherry');
    const got = ids(take(), 'picker-value-roll');
    expect(got).toHaveLength(2);
    expect(got[0]!.el).toBe(value);
    expect(got[0]!.frames).toEqual([
      { transform: 'translateY(100%)', clipPath: 'inset(0 0 100% 0)' },
      { transform: 'none', clipPath: 'inset(0 0 0 0)' },
    ]);
    const ghost = got[1]!.el as HTMLElement;
    expect(ghost.parentElement).toBe(trigger);
    expect(ghost.textContent).toBe('Apple');
    expect(ghost.getAttribute('aria-hidden')).toBe('true');
    expect(ghost.hasAttribute('inert')).toBe(true);
    expect(got[1]!.frames).toEqual([
      { transform: 'none', clipPath: 'inset(0 0 0 0)', opacity: 1 },
      { transform: 'translateY(-100%)', clipPath: 'inset(100% 0 0 0)', opacity: 0 },
    ]);
    expect(got[1]!.opts.fill).toBe('forwards');
  });

  it('picker-value-roll: the old label of no value is the placeholder; reduced is a fade with no copy', async () => {
    const { host, settle, trigger } = await setup();
    host.value.set(null);
    await settle();
    const ghost = ids(take(), 'picker-value-roll')[1]!.el;
    expect(ghost.textContent).toBe('Apple');
    host.value.set('banana');
    await settle();
    expect(ids(take(), 'picker-value-roll')[1]!.el.textContent).toBe('Choose an option');
    document.documentElement.setAttribute('data-motion', 'reduce');
    host.value.set('cherry');
    await settle();
    const reduced = ids(take(), 'picker-value-roll');
    expect(reduced.map((c) => c.frames)).toEqual([[{ opacity: 0 }, { opacity: 1 }]]);
    expect(reduced[0]!.el).toBe(trigger.querySelector('[data-part="value"]'));
  });
});
