// Order 1.22 motion of ListBox: row-glide. Each option holds an unnamed
// aria-hidden fill as its first child; when the highlight moves, the new
// row's fill travels from the old one with React's flipPlay arguments. jsdom
// has no Web Animations API, so Element.animate records each call.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flipPlay, rectOf } from '@the-system/motion';
import { injectMotion } from '../../internal/motion';
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
  template: `<div dsListBox aria-label="Fruit" [items]="fruit"></div>`,
})
class Host {
  readonly fruit = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
  ];
}

async function setup() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(box);
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const options = Array.from(fixture.nativeElement.querySelectorAll('[role="option"]')) as HTMLElement[];
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
  };
  const motion = TestBed.runInInjectionContext(() => injectMotion());
  return { options, settle, motion };
}

describe('list box motion, order 1.22', () => {
  it('row-glide: every option holds the fill layer as its first child, unnamed and aria-hidden', async () => {
    const { options } = await setup();
    for (const o of options) {
      const first = o.firstElementChild;
      expect(first?.tagName).toBe('SPAN');
      expect(first?.getAttribute('aria-hidden')).toBe('true');
      expect(first?.hasAttribute('data-part')).toBe(false);
    }
  });

  for (const reduced of [false, true]) {
    it(`row-glide: an arrow key glides the fill from the old row with React's flipPlay arguments${reduced ? ' (reduced)' : ''}`, async () => {
      if (reduced) document.documentElement.setAttribute('data-motion', 'reduce');
      const { options, settle, motion } = await setup();
      const [a, b] = options;
      a!.focus();
      await settle();
      take();
      a!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
      await settle();
      expect(b!.hasAttribute('data-highlighted')).toBe(true);
      const got = take();
      const to = b!.firstElementChild!;
      flipPlay({ rects: new Map([[to, rectOf(a!.firstElementChild!)]]) }, { items: [to], spring: 'snappy', stretch: 'y', scale: true, mode: motion.mode('row-glide'), enter: 'none' });
      expect(got).toEqual(take());
      if (reduced) expect(got).toEqual([]);
      else expect(got.map((c) => c.el)).toEqual([to]);
    });
  }
});
