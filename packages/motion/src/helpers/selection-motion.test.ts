// @vitest-environment jsdom
// The selection family motion helpers (order 1.22): row glide, flip group and
// popup rows. Moved with the code from
// packages/angular/src/internal/motion-selection.spec.ts (order 1.29); the
// open stagger of the Angular popup layer stays there.
// jsdom has no Web Animations API, so Element.animate records each call; a
// replay of the primitive with React's arguments must record the same calls.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PatternMode } from '../core';
import { flipPlay, rectOf } from '../primitives/flip';
import { staggerGroup } from '../primitives/stagger';
import { FlipGroup, glideRow, staggerRows, watchGlide } from './selection-motion';

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

/** A box per element, from its data-y attribute, so moves can be measured. */
function box(this: Element): DOMRect {
  const y = Number(this.closest('[data-y]')?.getAttribute('data-y') ?? 0);
  return { x: 0, y, width: 100, height: 28, top: y, left: 0, right: 100, bottom: y + 28, toJSON: () => ({}) } as DOMRect;
}

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
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(box);
  // Also on HTMLElement, where another spec file may have left its own measure.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(box);
});

afterEach(() => {
  for (const proto of PROTOS) {
    const before = saved.get(proto);
    if (before) Object.defineProperty(proto, 'animate', before);
    else Reflect.deleteProperty(proto, 'animate');
  }
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

function rows(n: number): HTMLElement {
  const list = document.createElement('div');
  for (let i = 0; i < n; i++) {
    const row = document.createElement('div');
    row.setAttribute('data-part', 'option');
    row.setAttribute('data-y', String(i * 28));
    row.innerHTML = `<span aria-hidden="true"></span><span data-part="option-label">Row ${i}</span>`;
    list.append(row);
  }
  document.body.append(list);
  return list;
}

describe('row-glide', () => {
  for (const mode of ['full', 'reduced'] as PatternMode[]) {
    it(`glides the new row's layer from the old one with React's flipPlay arguments (${mode})`, () => {
      const list = rows(3);
      const [a, , c] = Array.from(list.children);
      glideRow(a, c, mode);
      const got = take();
      const from = a!.firstElementChild!;
      const to = c!.firstElementChild!;
      flipPlay({ rects: new Map([[to, rectOf(from)]]) }, { items: [to], spring: 'snappy', stretch: 'y', scale: true, mode, enter: 'none' });
      expect(got).toEqual(take());
      if (mode === 'full') expect(got.map((g) => g.el)).toEqual([to]);
    });
  }

  it('plays when the lit attribute moves between rows, and nothing under mode none', async () => {
    const list = rows(3);
    const [a, b] = Array.from(list.children) as HTMLElement[];
    a!.setAttribute('data-highlighted', '');
    let mode: PatternMode = 'full';
    const stop = watchGlide(list, "[data-part='option']", 'data-highlighted', () => mode);
    a!.removeAttribute('data-highlighted');
    b!.setAttribute('data-highlighted', '');
    await Promise.resolve();
    expect(take().map((c) => c.el)).toEqual([b!.firstElementChild]);
    mode = 'none';
    b!.removeAttribute('data-highlighted');
    a!.setAttribute('data-highlighted', '');
    await Promise.resolve();
    expect(take()).toEqual([]);
    stop();
  });
});

describe('collection-flip', () => {
  it('measures on the first update and plays React flipPlay on the next', () => {
    const list = rows(2);
    const group = new FlipGroup({ items: (el) => Array.from(el.children) }, () => 'full');
    group.update(list);
    expect(take()).toEqual([]);
    const added = document.createElement('div');
    added.setAttribute('data-y', '56');
    list.append(added);
    group.update(list);
    const got = take();
    expect(got.map((c) => c.el)).toEqual([added]);
    expect(String(got[0]!.opts.id)).toBe('ds-motion:flip');
  });

  it('draws a removed item once more as an inert clone that shrinks out', () => {
    const list = rows(2);
    const group = new FlipGroup({ items: (el) => Array.from(el.children).filter((c) => c.getAttribute('data-part') === 'option') }, () => 'full');
    group.update(list);
    list.firstElementChild!.remove();
    group.update(list);
    const clone = list.querySelector('[inert]');
    expect(clone?.getAttribute('aria-hidden')).toBe('true');
    expect(take().some((c) => c.el === clone)).toBe(true);
  });

  it('plays nothing under mode none', () => {
    const list = rows(1);
    const group = new FlipGroup({ items: (el) => Array.from(el.children) }, () => 'none');
    group.update(list);
    list.append(document.createElement('div'));
    group.update(list);
    expect(take()).toEqual([]);
  });
});

describe('menu-rows', () => {
  for (const mode of ['full', 'reduced'] as PatternMode[]) {
    it(`staggers the rows with React's staggerGroup arguments (${mode})`, () => {
      const list = rows(3);
      staggerRows(list, "[data-part='option']", mode);
      const got = take();
      staggerGroup(Array.from(list.children), { phase: 'enter', offset: 1, spring: 'soft', mode });
      expect(got).toEqual(take());
      expect(got).toHaveLength(3);
    });
  }
});

describe('row-glide on hover', () => {
  it('glides from the row the pointer left to the row it reached', () => {
    const list = rows(3);
    const stop = watchGlide(list, "[data-part='option']", null, () => 'full');
    list.children[0]!.dispatchEvent(new Event('pointerover', { bubbles: true }));
    expect(take()).toEqual([]);
    list.children[2]!.dispatchEvent(new Event('pointerover', { bubbles: true }));
    expect(take().length).toBeGreaterThan(0);
    stop();
  });
});
