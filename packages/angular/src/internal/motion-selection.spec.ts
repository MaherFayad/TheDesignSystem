// The Angular wiring of the selection family motion (order 1.22). The
// framework free parts (row glide, flip group, staggerRows) are tested once
// in packages/motion/src/helpers/selection-motion.test.ts (order 1.29); this
// keeps openStaggered, the popup layer part. jsdom has no Web Animations API,
// so Element.animate records each call.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openStaggered } from './motion-selection';

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

describe('menu-rows', () => {
  it('staggers on a fresh mount only, not on a reopen during the exit', () => {
    const list = rows(2);
    let mounted = false;
    const layer = { mounted: () => mounted, open: () => (mounted = true), content: list };
    openStaggered(layer, "[data-part='option']", () => 'full');
    // Order 1.29 (ten weakest #9): each row fades with the surface and rises one step later: two animations a row.
    expect(take()).toHaveLength(4);
    openStaggered(layer, "[data-part='option']", () => 'full');
    expect(take()).toEqual([]);
  });
});
