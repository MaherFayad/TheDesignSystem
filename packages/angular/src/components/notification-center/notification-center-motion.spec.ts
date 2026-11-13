// notification-change, as React's NotificationCenter plays it (useFlipList,
// useDigitRoll, popMark): a new entry pops in, a removed one leaves as a
// ghost, the rest move, and the unread number rolls while the count pops.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { popMark } from '../../internal/motion-feedback';
import { DsNotificationCenter, type NotificationItem } from './notification-center';

interface Call {
  target: Element;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

/** Records every el.animate call, gives each element a box from its order among visible siblings, and queues frames. */
function stage() {
  const calls: Call[] = [];
  const frames: FrameRequestCallback[] = [];
  // Stub on Element and HTMLElement: another spec may have left an own property on HTMLElement.prototype.
  const protos = [Element.prototype, HTMLElement.prototype];
  const names = ['animate', 'getBoundingClientRect'];
  const saved = protos.map((p) => names.map((n) => Object.getOwnPropertyDescriptor(p, n)));
  const raf = window.requestAnimationFrame;
  const animate = function (this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    calls.push({ target: this, keyframes, options });
    return { id: options.id, playState: 'running', finished: Promise.resolve(), cancel() {}, effect: { getTiming: () => options } };
  };
  const rect = function (this: Element) {
    const siblings = this.parentElement ? [...this.parentElement.children] : [];
    const y = this.hasAttribute('inert') ? 0 : siblings.slice(0, siblings.indexOf(this)).filter((c) => !c.hasAttribute('inert')).length * 50;
    return { x: 0, y, top: y, left: 0, width: 100, height: 40, right: 100, bottom: y + 40, toJSON() {} } as DOMRect;
  };
  for (const p of protos) {
    Object.defineProperty(p, 'animate', { configurable: true, writable: true, value: animate });
    Object.defineProperty(p, 'getBoundingClientRect', { configurable: true, writable: true, value: rect });
  }
  window.requestAnimationFrame = (cb) => frames.push(cb);
  return {
    take: () => calls.splice(0),
    flush: () => frames.splice(0).forEach((f) => f(0)),
    restore: () => {
      protos.forEach((p, i) =>
        names.forEach((n, j) => {
          const d = saved[i]![j];
          if (d) Object.defineProperty(p, n, d);
          else delete (p as unknown as Record<string, unknown>)[n];
        }),
      );
      window.requestAnimationFrame = raf;
      document.documentElement.removeAttribute('data-motion');
    },
  };
}

const now = new Date(2026, 10, 12, 12);
const base: NotificationItem[] = [
  { id: 'n1', title: 'Omar commented', time: now, unread: true },
  { id: 'n2', title: 'Lina invited you', time: now },
];

@Component({
  imports: [DsNotificationCenter, DsTheme],
  template: `<div dsTheme="neutral"><section dsNotificationCenter [items]="items()" [now]="now"></section></div>`,
})
class Host {
  readonly items = signal(base);
  readonly now = now;
}

const name = (el: Element) => el.querySelector('[data-part="item-title"]')?.textContent?.replace('Unread: ', '');

describe('DsNotificationCenter motion', () => {
  let s: ReturnType<typeof stage>;
  beforeEach(() => (s = stage()));
  afterEach(() => s.restore());

  it('keeps the count DOM of React: a hidden copy and the number in its own span', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const count = fixture.nativeElement.querySelector('[data-part="count"]') as HTMLElement;
    expect(count.children[0]!.getAttribute('data-visually-hidden')).toBe('');
    expect(count.children[0]!.textContent).toBe('1 unread');
    expect(count.children[1]!.getAttribute('aria-hidden')).toBe('true');
    expect(count.children[1]!.children[0]!.textContent).toBe('1');
  });

  it('a new entry pops in, the rest move, the number rolls and the count pops', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    s.take();
    fixture.componentInstance.items.update((v) => [{ id: 'n3', title: 'Build passed', time: now, unread: true }, ...v]);
    await fixture.whenStable();
    const played = s.take();
    const count = fixture.nativeElement.querySelector('[data-part="count"]');
    const flips = played.filter((p) => p.options.id === 'ds-motion:flip');
    // The new entry pops in (it fades and grows); the two below it move down.
    expect(flips.map((p) => name(p.target))).toEqual(['Build passed', 'Omar commented', 'Lina invited you']);
    expect(flips.map((p) => p.keyframes.some((k) => k.opacity !== undefined))).toEqual([true, false, false]);
    expect(played.some((p) => p.options.id === 'ds-motion:digit-roll')).toBe(true);
    const pop = played.find((p) => p.options.id === 'ds-motion:pop-mark')!;
    expect(pop.target).toBe(count);
    popMark(count, 'full');
    expect(pop).toEqual(s.take()[0]);
  });

  it('a removed entry leaves as a ghost that shrinks away', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    s.take();
    fixture.componentInstance.items.update((v) => v.slice(1));
    await fixture.whenStable();
    const exits = s.take().filter((p) => p.options.id === 'ds-motion:flip-exit');
    expect(exits.map((p) => p.target.hasAttribute('inert'))).toEqual([true]);
  });

  it('reduced motion: the new entry fades in, nothing moves or pops', async () => {
    document.documentElement.setAttribute('data-motion', 'reduce');
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    s.take();
    fixture.componentInstance.items.update((v) => [{ id: 'n3', title: 'Build passed', time: now, unread: true }, ...v]);
    await fixture.whenStable();
    const played = s.take();
    const flips = played.filter((p) => p.options.id === 'ds-motion:flip');
    expect(flips.length).toBe(1);
    expect(flips[0]!.keyframes.every((k) => k.transform === undefined)).toBe(true);
    expect(played.some((p) => p.options.id === 'ds-motion:pop-mark')).toBe(false);
  });
});
