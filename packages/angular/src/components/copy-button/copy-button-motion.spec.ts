// The result morph of CopyButton (interaction copy-swap, primitive
// buttonMorph), as React's CopyButton.tsx plays it: the old icon stays in an
// aria-hidden span after the new one for its exit, and goes when it settles.
// el.animate is recorded; each test replays buttonMorph with React's
// arguments on the same parts and expects the same calls.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { buttonMorph, type MorphParts, type MorphState, type PrimitiveOptions } from '@the-system/motion';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DsCopyButton } from './copy-button';

interface Recorded {
  target: Element;
  keyframes: unknown;
  options: unknown;
  finish: () => void;
}

/** Records every el.animate call and returns a stand in Animation. */
function recordAnimate() {
  const calls: Recorded[] = [];
  const proto = Element.prototype as unknown as { animate?: unknown };
  const had = proto.animate;
  proto.animate = function (this: Element, keyframes: unknown, options: KeyframeAnimationOptions) {
    let done: () => void = () => undefined;
    const anim = {
      id: options.id,
      playState: 'running',
      effect: { target: this, getTiming: () => options },
      finished: new Promise<void>((r) => (done = r)),
      cancel() {},
    };
    calls.push({ target: this, keyframes, options, finish: () => ((anim.playState = 'finished'), done()) });
    return anim;
  };
  return {
    calls,
    take: () => calls.splice(0).map(({ target, keyframes, options }) => ({ target, keyframes, options })),
    restore: () => {
      if (had === undefined) delete proto.animate;
      else proto.animate = had;
    },
  };
}

@Component({
  imports: [DsCopyButton],
  // A long hold, so the result stays while the test runs (jsdom reads no tokens).
  template: `<button id="copy" dsCopyButton value="npm install @the-system/react" label="Copy command" style="--ds-delay-feedback: 60s"></button>`,
})
class Host {}

const flush = () => new Promise((r) => setTimeout(r, 0));

function mockClipboard(ok: boolean) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: () => (ok ? Promise.resolve() : Promise.reject(new Error('denied'))) },
    configurable: true,
  });
}

async function clickAndSettle(ok: boolean) {
  mockClipboard(ok);
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el = fixture.nativeElement.querySelector('#copy') as HTMLElement;
  el.click();
  await flush();
  await fixture.whenStable();
  return { fixture, el };
}

/** What React's CopyButton plays for the rendered icons. */
function reactMorph(el: HTMLElement, from: MorphState, to: MorphState, fromSlot: keyof MorphParts, toSlot: keyof MorphParts, opts: PrimitiveOptions) {
  const part = el.querySelector(':scope > [data-part="icon"]') as HTMLElement;
  const parts: MorphParts = { root: el };
  parts[fromSlot] = part.lastElementChild;
  parts[toSlot] = part.firstElementChild;
  buttonMorph(parts, from, to, opts);
}

describe('DsCopyButton motion', () => {
  let rec: ReturnType<typeof recordAnimate>;
  beforeEach(() => (rec = recordAnimate()));
  afterEach(() => {
    rec.restore();
    Reflect.deleteProperty(navigator, 'clipboard');
    document.documentElement.removeAttribute('data-motion');
  });

  it('a copy keeps the old icon in an aria-hidden span and plays buttonMorph idle to success', async () => {
    const { el, fixture } = await clickAndSettle(true);
    const part = el.querySelector(':scope > [data-part="icon"]') as HTMLElement;
    expect(part.children.length).toBe(2);
    expect(part.firstElementChild?.getAttribute('data-icon')).toBe('check');
    const leaving = part.lastElementChild as HTMLElement;
    expect(leaving.tagName).toBe('SPAN');
    expect(leaving.getAttribute('aria-hidden')).toBe('true');
    expect(leaving.querySelector('svg')?.getAttribute('data-icon')).toBe('copy');
    const records = rec.calls.slice();
    const played = rec.take();
    reactMorph(el, 'idle', 'success', 'label', 'success', { mode: 'full' });
    expect(played).toEqual(rec.take());
    expect(played.map((c) => c.target)).toContain(el);
    for (const r of records) r.finish();
    await flush();
    await fixture.whenStable();
    expect(part.children.length).toBe(1);
    expect(el.getAttribute('data-state')).toBe('copied');
  });

  it('a failure plays buttonMorph idle to error', async () => {
    const { el } = await clickAndSettle(false);
    const played = rec.take();
    reactMorph(el, 'idle', 'error', 'label', 'error', { mode: 'full' });
    expect(played).toEqual(rec.take());
  });

  it('reduced motion cross fades the icons and does not move the button', async () => {
    document.documentElement.setAttribute('data-motion', 'reduce');
    const { el } = await clickAndSettle(true);
    const played = rec.take();
    reactMorph(el, 'idle', 'success', 'label', 'success', { mode: 'reduced' });
    expect(played).toEqual(rec.take());
    expect(played.map((c) => c.target)).not.toContain(el);
  });

  it('with no Web Animations API, no leaving span is added', async () => {
    rec.restore();
    const { el } = await clickAndSettle(true);
    expect(el.querySelector(':scope > [data-part="icon"]')?.children.length).toBe(1);
  });
});
