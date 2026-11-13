// alert-dismiss on Alert, as React's Alert.tsx plays it (Alert/ghost.ts,
// dismissWithExit): onClose runs at once, then a ghost of the alert shrinks
// away (flipExit) and the content below slides into the gap (flipPlay).
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { flipExit } from '@the-system/motion';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsAlert } from './alert';

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

@Component({
  imports: [DsAlert, DsTheme],
  template: `
    <div dsTheme="neutral">
      @for (id of items(); track id) {
        <div dsAlert [title]="id" [onClose]="close"></div>
      }
      <p id="below">Below</p>
    </div>
  `,
})
class Host {
  readonly items = signal(['a', 'b']);
  readonly close = () => this.items.update((v) => v.slice(1));
}

async function dismissFirst() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const first = fixture.nativeElement.querySelector('[data-ds="alert"]') as HTMLElement;
  (first.querySelector('[data-part="close"]') as HTMLElement).click();
  // onClose ran at once: the state changed before any frame.
  expect(fixture.componentInstance.items()).toEqual(['b']);
  await fixture.whenStable();
  expect(first.isConnected).toBe(false);
  return fixture;
}

describe('DsAlert motion', () => {
  let s: ReturnType<typeof stage>;
  beforeEach(() => (s = stage()));
  afterEach(() => s.restore());

  it('the ghost shrinks with flipExit and the alert and text below move on the snappy spring', async () => {
    const fixture = await dismissFirst();
    s.take();
    s.flush();
    const played = s.take();
    const ghost = played[0]!.target as HTMLElement;
    expect(ghost.getAttribute('data-ds')).toBe('alert');
    expect(ghost.hasAttribute('inert')).toBe(true);
    flipExit(ghost, { mode: 'full' });
    expect(played[0]).toEqual(s.take()[0]);
    const below = fixture.nativeElement.querySelector('#below');
    const moved = played.slice(1);
    expect(moved.map((p) => p.options.id)).toEqual(['ds-motion:flip', 'ds-motion:flip']);
    expect(moved[1]!.target).toBe(below);
    expect(moved[1]!.keyframes[0]!.transform).toBe('translate(0px, 50px)');
  });

  it('reduced motion: no ghost and nothing moves, the alert goes at once (round 3, review B1)', async () => {
    document.documentElement.setAttribute('data-motion', 'reduce');
    await dismissFirst();
    s.take();
    s.flush();
    expect(s.take()).toEqual([]);
    expect(document.querySelector('[data-ds="alert"][inert]')).toBeNull();
  });
});
