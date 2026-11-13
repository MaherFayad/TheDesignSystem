// Order 1.23 (interaction round 3) of the picker popups, shown on Combobox
// (Autocomplete, MultiSelect and TagField share internal/popper.ts and
// internal/motion-selection.ts): the exit copy of review B6 and
// combobox-results (rows that stay slide, new rows rise). jsdom has no Web
// Animations API, so Element.animate records each call and getAnimations
// reports one running exit on an inert copy; both stubs are restored by
// descriptor on Element, HTMLElement and SVGElement.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DsCombobox } from './combobox';

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
const NAMES = ['animate', 'getAnimations', 'getBoundingClientRect'] as const;
const saved = new Map<string, PropertyDescriptor | undefined>();
// clientHeight lives on Element; the stub on HTMLElement is deleted after each test.
let finishExit: () => void = () => undefined;
/** The top of each option in the list, by its label, so a new query moves rows. */
let tops = new Map<string, number>();

beforeEach(() => {
  calls = [];
  tops = new Map();
  const exit = new Promise<void>((resolve) => (finishExit = resolve));
  const record = vi.fn(function (this: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
    calls.push({ el: this, frames, opts });
    return { id: String(opts?.id ?? ''), finished: new Promise(() => undefined), cancel: vi.fn(), playState: 'running' } as unknown as Animation;
  });
  const running = function (this: Element): Animation[] {
    return this.hasAttribute('inert') ? [{ finished: exit, playState: 'running' } as unknown as Animation] : [];
  };
  const box = function (this: Element): DOMRect {
    if (this.getAttribute('data-part') === 'popup') return DOMRect.fromRect({ x: 0, y: 40, width: 240, height: 200 });
    if (this.getAttribute('data-part') === 'option') {
      const y = tops.get(this.textContent?.trim() ?? '') ?? 0;
      return DOMRect.fromRect({ x: 0, y, width: 240, height: 28 });
    }
    return DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 });
  };
  PROTOS.forEach((proto, i) => {
    for (const name of NAMES) {
      saved.set(`${i}:${name}`, Object.getOwnPropertyDescriptor(proto, name));
      const value = name === 'animate' ? record : name === 'getAnimations' ? running : box;
      Object.defineProperty(proto, name, { configurable: true, writable: true, value });
    }
  });
  // The list is 200px tall, so a row that moves farther was out of view.
  saved.set('clientHeight', Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight'));
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: Element) {
      return this.getAttribute('data-ds') === 'list-box' ? 200 : 0;
    },
  });
});

afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  PROTOS.forEach((proto, i) => {
    for (const name of NAMES) {
      const before = saved.get(`${i}:${name}`);
      if (before) Object.defineProperty(proto, name, before);
      else Reflect.deleteProperty(proto, name);
    }
  });
  document.documentElement.removeAttribute('data-motion');
  vi.restoreAllMocks();
  for (const el of Array.from(document.querySelectorAll('[data-menu-layer]'))) el.remove();
});

@Component({
  imports: [DsCombobox],
  template: `<div dsCombobox aria-label="Fruit" [items]="fruit" [(open)]="open"></div>`,
})
class Host {
  readonly fruit = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'grape', label: 'Grape' },
  ];
  readonly open = signal<boolean | undefined>(false);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();
  };
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const type = async (text: string) => {
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
  };
  const real = () => Array.from(document.querySelectorAll<HTMLElement>("[data-ds='combobox'][data-part='popup']:not([inert])"));
  const copies = () => Array.from(document.querySelectorAll<HTMLElement>("[data-ds='combobox'][data-part='popup'][inert]"));
  const rows = () => Array.from(document.querySelectorAll<HTMLElement>("[data-ds='combobox'][data-part='popup']:not([inert]) [data-part='option']"));
  return { fixture, host: fixture.componentInstance, settle, type, real, copies, rows };
}

describe('combobox popup, order 1.23', () => {
  it('exit copy (review B6): the popup leaves at once, an inert aria-hidden copy plays the exit, reopening is at once', async () => {
    const { host, settle, real, copies } = await setup();
    host.open.set(true);
    await settle();
    expect(real()).toHaveLength(1);
    host.open.set(false);
    await settle();
    expect(real()).toHaveLength(0);
    const [copy] = copies();
    expect(copy).toBeDefined();
    expect(copy!.getAttribute('aria-hidden')).toBe('true');
    expect(copy!.getAttribute('data-state')).toBe('closed');
    expect(copy!.hasAttribute('id')).toBe(false);
    expect(copy!.querySelectorAll('[id]')).toHaveLength(0);
    expect(copy!.parentElement?.style.pointerEvents).toBe('none');
    host.open.set(true);
    await settle();
    expect(real()).toHaveLength(1);
    expect(real()[0]!.getAttribute('data-state')).toBe('open');
    finishExit();
    await settle();
    expect(copies()).toHaveLength(0);
  });

  it('combobox-results: on a new query rows that stay slide on the snappy spring and a row from out of view arrives as new', async () => {
    const { host, settle, type, rows } = await setup();
    tops = new Map([
      ['Apple', 40],
      ['Banana', 68],
      ['Cherry', 96],
      ['Grape', 124],
    ]);
    host.open.set(true);
    await settle();
    take();
    // "ap": Apple stays at its place, Grape moves up a short way; nothing new.
    tops = new Map([
      ['Apple', 40],
      ['Grape', 68],
    ]);
    await type('ap');
    expect(rows().map((r) => r.textContent?.trim())).toEqual(['Apple', 'Grape']);
    const moved = ids(take(), 'flip');
    expect(moved.map((c) => (c.el as HTMLElement).textContent?.trim())).toEqual(['Grape']);
    // A move: from the old box, no fade.
    expect(moved[0]!.frames[0]!['transform']).toContain('translate');
    expect(moved[0]!.frames[0]!['opacity']).toBeUndefined();
    // Back to every row: Banana and Cherry are new and pop in; a row that jumps farther than the list is tall arrives as new.
    tops = new Map([
      ['Apple', 40],
      ['Banana', 68],
      ['Cherry', 96],
      ['Grape', 124 + 400],
    ]);
    await type('');
    const flips = ids(take(), 'flip');
    const played = flips.map((c) => (c.el as HTMLElement).textContent?.trim());
    expect(played).toEqual(expect.arrayContaining(['Banana', 'Cherry', 'Grape']));
    expect(played).not.toContain('Apple');
    // Each arrives as new: it rises from transparent.
    for (const c of flips) expect(c.frames[0]!['opacity']).toBe(0);
  });

  it('combobox-results: a first paint of the popup plays no flip', async () => {
    const { host, settle } = await setup();
    host.open.set(true);
    await settle();
    expect(ids(take(), 'flip')).toEqual([]);
  });
});
