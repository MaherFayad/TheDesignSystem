// Motion of ListBox. Order 1.23 replaced row-glide with highlight-marker:
// one aria-hidden marker, the list's last child, draws the lit row's fill and
// slides between rows; alone, it follows the pointer with the hover veil. And
// check-draw-pick: the check of an option chosen now draws itself. jsdom has
// no Web Animations API, so Element.animate records each call.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readDuration } from '@the-system/motion';
import { injectMotion } from '../../internal/motion';
import { CHECK_DRAW_ID, drawCheck } from '../../internal/selection-marker';
import { DsListBox } from './list-box';

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

/** A box per row, by its place in the list, so the glide has a distance to travel. */
function box(this: Element): DOMRect {
  const row = this.closest('[data-part="option"]');
  const y = row ? Array.from(row.parentElement?.children ?? []).indexOf(row) * 28 : 0;
  return { x: 0, y, width: 100, height: 28, top: y, left: 0, right: 100, bottom: y + 28, toJSON: () => ({}) } as DOMRect;
}

@Component({
  imports: [DsListBox],
  template: `<div dsListBox aria-label="Fruit" [items]="fruit" [selectionMode]="mode" [virtualFocus]="virtual"></div>`,
})
class Host {
  mode: 'single' | 'multiple' = 'single';
  virtual = false;
  readonly fruit = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
  ];
}

async function setup(configure: (host: Host) => void = () => undefined) {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(box);
  // Also on HTMLElement, where another spec file may have left its own measure.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(box);
  const fixture = TestBed.createComponent(Host);
  configure(fixture.componentInstance);
  await fixture.whenStable();
  const list = fixture.nativeElement.querySelector('[data-ds="list-box"]') as HTMLElement;
  const options = Array.from(fixture.nativeElement.querySelectorAll('[role="option"]')) as HTMLElement[];
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
  };
  const motion = TestBed.runInInjectionContext(() => injectMotion());
  return { list, options, settle, motion };
}

describe('list box motion, order 1.23', () => {
  it('highlight-marker: options hold no fill layer; the list holds one aria-hidden marker as its last child', async () => {
    const { list, options } = await setup();
    for (const o of options) expect(o.querySelector(":scope > span[aria-hidden='true']:not([data-part])")).toBeNull();
    const marker = list.lastElementChild as HTMLElement;
    expect(marker.tagName).toBe('SPAN');
    expect(marker.getAttribute('data-part')).toBe('highlight');
    expect(marker.getAttribute('aria-hidden')).toBe('true');
    // Hidden while nothing is lit.
    expect(marker.style.opacity).toBe('');
  });

  it('highlight-marker: jumps to the first lit row, then slides over duration.fast for the keys', async () => {
    const { list, options, settle } = await setup();
    const marker = list.lastElementChild as HTMLElement;
    const [a, b] = options;
    a!.focus();
    await settle();
    expect(marker.style.opacity).toBe('1');
    // jsdom writes translate(0px, 0px) as translate(0px).
    expect(marker.style.transform).toBe('translate(0px)');
    expect(marker.style.backgroundColor).toBe('var(--_list-box-highlight-bg)');
    a!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    await settle();
    expect(b!.hasAttribute('data-highlighted')).toBe(true);
    expect(marker.style.transform).toBe('translate(0px, 28px)');
    expect(marker.style.inlineSize).toBe('100px');
    expect(marker.style.blockSize).toBe('28px');
    expect(marker.style.transitionDuration).toBe(`${readDuration(marker, 'duration.fast')}ms`);
  });

  it('highlight-marker: alone, the marker follows the pointer with the hover veil; with virtualFocus it does not', async () => {
    const { list, options, settle } = await setup();
    const marker = list.lastElementChild as HTMLElement;
    options[2]!.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
    await settle();
    expect(marker.style.opacity).toBe('1');
    expect(marker.style.transform).toBe('translate(0px, 56px)');
    expect(marker.style.backgroundColor).toBe('var(--_list-box-option-bg-hover)');
    list.dispatchEvent(new PointerEvent('pointerleave'));
    await settle();
    expect(marker.style.opacity).toBe('0');

    const other = await setup((h) => (h.virtual = true));
    const m2 = other.list.lastElementChild as HTMLElement;
    other.options[2]!.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
    await other.settle();
    // An owner keeps focus: the pointer lights the row, the marker goes to the lit row with no hover color.
    expect(other.options[2]!.hasAttribute('data-highlighted')).toBe(true);
    expect(m2.style.backgroundColor).toBe('');
  });

  it('highlight-marker: an empty list has no marker', async () => {
    const { list } = await setup((h) => (h.fruit.length = 0));
    expect(list.querySelector("[data-part='highlight']")).toBeNull();
  });

  for (const reduced of [false, true]) {
    it(`check-draw-pick: the check of an option chosen now draws with React's arguments, not on first paint${reduced ? ' (reduced)' : ''}`, async () => {
      if (reduced) document.documentElement.setAttribute('data-motion', 'reduce');
      const { options, settle, motion } = await setup((h) => (h.mode = 'multiple'));
      expect(take().filter((c) => c.el.closest("[data-part='indicator']"))).toEqual([]);
      options[1]!.click();
      await settle();
      const indicator = options[1]!.querySelector("[data-part='indicator']")!;
      const got = take().filter((c) => indicator.contains(c.el));
      expect(got.length).toBeGreaterThan(0);
      drawCheck(indicator, motion.mode(CHECK_DRAW_ID));
      expect(got).toEqual(take());
      if (reduced) expect(got.map((c) => c.frames)).toEqual([[{ opacity: 0 }, { opacity: 1 }]]);
      else expect(got.at(-1)!.frames).toEqual([{ transform: 'scale(0.6)' }, { transform: 'none' }]);
    });
  }
});
