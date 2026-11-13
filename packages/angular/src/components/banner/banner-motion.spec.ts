// alert-dismiss on Banner, as React's Banner.tsx plays it: focus moves,
// onDismiss runs at once, then a ghost shrinks away (flipExit).
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { flipExit } from '@the-system/motion';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsBanner } from './banner';

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
  imports: [DsBanner, DsTheme],
  template: `
    <div dsTheme="neutral">
      @if (shown()) {
        <section dsBanner [onDismiss]="hide">Trial ends soon.</section>
      }
      <main><p>Page</p></main>
    </div>
  `,
})
class Host {
  readonly shown = signal(true);
  readonly hide = () => this.shown.set(false);
}

async function dismiss() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const banner = fixture.nativeElement.querySelector('[data-ds="banner"]') as HTMLElement;
  (banner.querySelector('[data-part="close"]') as HTMLElement).click();
  expect(fixture.componentInstance.shown()).toBe(false);
  await fixture.whenStable();
  return fixture;
}

describe('DsBanner motion', () => {
  let s: ReturnType<typeof stage>;
  beforeEach(() => (s = stage()));
  afterEach(() => s.restore());

  it('the banner leaves at once and its ghost shrinks with flipExit while the page moves up', async () => {
    const fixture = await dismiss();
    s.take();
    s.flush();
    const played = s.take();
    const ghost = played[0]!.target as HTMLElement;
    expect(ghost.getAttribute('data-ds')).toBe('banner');
    flipExit(ghost, { mode: 'full' });
    expect(played[0]).toEqual(s.take()[0]);
    expect(played[1]!.target).toBe(fixture.nativeElement.querySelector('main'));
    expect(played[1]!.options.id).toBe('ds-motion:flip');
  });

  it('reduced motion: no ghost and nothing moves, the banner goes at once (round 3, review B1)', async () => {
    document.documentElement.setAttribute('data-motion', 'reduce');
    await dismiss();
    s.take();
    s.flush();
    expect(s.take()).toEqual([]);
    expect(document.querySelector('[data-ds="banner"][inert]')).toBeNull();
  });
});
