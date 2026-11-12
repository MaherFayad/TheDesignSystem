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
  const proto = Element.prototype as unknown as Record<string, unknown>;
  const had = { animate: proto['animate'], rect: proto['getBoundingClientRect'], raf: window.requestAnimationFrame };
  proto['animate'] = function (this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    calls.push({ target: this, keyframes, options });
    return { id: options.id, playState: 'running', finished: Promise.resolve(), cancel() {}, effect: { getTiming: () => options } };
  };
  proto['getBoundingClientRect'] = function (this: Element) {
    const siblings = this.parentElement ? [...this.parentElement.children] : [];
    const y = this.hasAttribute('inert') ? 0 : siblings.slice(0, siblings.indexOf(this)).filter((c) => !c.hasAttribute('inert')).length * 50;
    return { x: 0, y, top: y, left: 0, width: 100, height: 40, right: 100, bottom: y + 40, toJSON() {} } as DOMRect;
  };
  window.requestAnimationFrame = (cb) => frames.push(cb);
  return {
    take: () => calls.splice(0),
    flush: () => frames.splice(0).forEach((f) => f(0)),
    restore: () => {
      proto['animate'] = had.animate;
      proto['getBoundingClientRect'] = had.rect;
      window.requestAnimationFrame = had.raf;
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

  it('reduced motion: a fade of the ghost only', async () => {
    document.documentElement.setAttribute('data-motion', 'reduce');
    await dismiss();
    s.take();
    s.flush();
    expect(s.take().map((p) => p.options.id)).toEqual(['ds-motion:flip-exit']);
  });
});
