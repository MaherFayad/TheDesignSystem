// The motion of the Button base, as React's ButtonBase.tsx plays it: the
// loading morph (interaction button-loading, primitive buttonMorph) with the
// leaving spinner, and the press for Enter (interaction button-press).
// el.animate is recorded; each test checks the component calls the motion
// functions with React's arguments by replaying them on the same parts.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { buttonMorph, type MorphState, type PrimitiveOptions } from '@the-system/motion';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { injectMotion } from '../../internal/motion';
import { DsFloatingActionButton } from '../floating-action-button/floating-action-button';
import { DsIconButton } from '../icon-button/icon-button';
import { DsButton } from './button';

interface Recorded {
  target: Element;
  keyframes: unknown;
  options: unknown;
  finish: () => void;
}

/** Records every el.animate call and returns a stand in Animation. */
function recordAnimate() {
  const calls: Recorded[] = [];
  // On every prototype a spec may stub, so no leftover own property shadows it.
  const protos = [Element.prototype, HTMLElement.prototype, SVGElement.prototype];
  const had = protos.map((p) => Object.getOwnPropertyDescriptor(p, 'animate'));
  const animate = function (this: Element, keyframes: unknown, options: KeyframeAnimationOptions) {
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
  for (const p of protos) Object.defineProperty(p, 'animate', { configurable: true, writable: true, value: animate });
  return {
    calls,
    take: () => calls.splice(0).map(({ target, keyframes, options }) => ({ target, keyframes, options })),
    restore: () =>
      protos.forEach((p, i) => {
        const d = had[i];
        if (d) Object.defineProperty(p, 'animate', d);
        else Reflect.deleteProperty(p, 'animate');
      }),
  };
}

@Component({
  imports: [DsButton, DsIconButton, DsFloatingActionButton],
  template: `
    <button id="save" dsButton [loading]="loading()" loadingLabel="Saving">Save changes</button>
    <button id="refresh" dsIconButton icon="refresh" label="Refresh list" [loading]="loading()"></button>
    <button id="fab" dsFloatingActionButton icon="plus" label="Create board" position="static" [loading]="loading()"></button>
    <button id="plain" dsButton>Save draft</button>
  `,
})
class Host {
  readonly loading = signal(false);
}

@Component({
  imports: [DsButton],
  template: `<button dsButton loading>Save changes</button>`,
})
class StartsLoading {}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

const parts = (el: HTMLElement) => Array.from(el.children).map((c) => c.getAttribute('data-part'));
const flush = () => new Promise((r) => setTimeout(r, 0));

/** What React's useLoadingMorph plays for the same parts. */
function reactMorph(el: HTMLElement, from: MorphState, to: MorphState, opts: PrimitiveOptions) {
  const label = el.querySelector(':scope > [data-part="label"]') ?? el.querySelector(':scope > [data-part="icon"]');
  const spinner = el.querySelector(':scope > [data-part="spinner"]');
  buttonMorph({ root: el, label, spinner }, from, to, opts);
}

describe('DsButton motion', () => {
  let rec: ReturnType<typeof recordAnimate>;
  beforeEach(() => (rec = recordAnimate()));
  afterEach(() => {
    rec.restore();
    document.documentElement.removeAttribute('data-motion');
  });

  it('loading on plays buttonMorph idle to loading on the root, the label and the spinner', async () => {
    const { host, fixture, q } = await setup();
    rec.take();
    host.loading.set(true);
    await fixture.whenStable();
    const played = rec.take();
    const save = q('save');
    const refresh = q('refresh');
    reactMorph(save, 'idle', 'loading', { mode: 'full' });
    reactMorph(refresh, 'idle', 'loading', { mode: 'full' });
    reactMorph(q('fab'), 'idle', 'loading', { mode: 'full' });
    const expected = rec.take();
    expect(played.length).toBe(9);
    expect(played).toEqual(expected);
    expect(played.map((c) => c.target)).toContain(save.querySelector('[data-part="spinner"]'));
    expect(played.map((c) => c.target)).toContain(refresh.querySelector('[data-part="icon"]'));
  });

  it('loading off keeps an aria-hidden spinner for its exit, then removes it when the exit settles', async () => {
    const { host, fixture, q } = await setup();
    host.loading.set(true);
    await fixture.whenStable();
    rec.take();
    host.loading.set(false);
    await fixture.whenStable();
    const save = q('save');
    expect(parts(save)).toEqual(['label', 'spinner', 'hit']);
    expect(parts(q('refresh'))).toEqual(['icon', 'spinner', 'hit']);
    expect(parts(q('fab'))).toEqual(['icon', 'spinner', 'hit']);
    const spinner = save.querySelector(':scope > [data-part="spinner"]');
    expect(spinner?.getAttribute('aria-hidden')).toBe('true');
    expect(save.hasAttribute('aria-busy')).toBe(false);
    expect(save.querySelector('[data-part="status"]')).toBeNull();
    const records = rec.calls.slice();
    const played = rec.take();
    reactMorph(save, 'loading', 'idle', { mode: 'full' });
    reactMorph(q('refresh'), 'loading', 'idle', { mode: 'full' });
    reactMorph(q('fab'), 'loading', 'idle', { mode: 'full' });
    expect(played).toEqual(rec.take());
    for (const r of records) r.finish();
    await flush();
    await fixture.whenStable();
    expect(parts(save)).toEqual(['label', 'hit']);
    expect(parts(q('refresh'))).toEqual(['icon', 'hit']);
    expect(parts(q('fab'))).toEqual(['icon', 'hit']);
  });

  it('reduced motion cross fades the parts and does not move the button', async () => {
    document.documentElement.setAttribute('data-motion', 'reduce');
    const { host, fixture, q } = await setup();
    host.loading.set(true);
    await fixture.whenStable();
    const played = rec.take();
    const save = q('save');
    reactMorph(save, 'idle', 'loading', { mode: 'reduced' });
    reactMorph(q('refresh'), 'idle', 'loading', { mode: 'reduced' });
    reactMorph(q('fab'), 'idle', 'loading', { mode: 'reduced' });
    expect(played).toEqual(rec.take());
    expect(played.map((c) => c.target)).not.toContain(save);
  });

  it('with no Web Animations API, no leaving spinner renders', async () => {
    for (const p of [Element.prototype, HTMLElement.prototype, SVGElement.prototype]) {
      Object.defineProperty(p, 'animate', { configurable: true, writable: true, value: undefined });
    }
    const { host, fixture, q } = await setup();
    host.loading.set(true);
    await fixture.whenStable();
    host.loading.set(false);
    await fixture.whenStable();
    expect(parts(q('save'))).toEqual(['label', 'hit']);
  });

  it('Enter plays the press pattern enter on key down and exit on key up, as ButtonRoot', async () => {
    const { q } = await setup();
    const el = q('plain');
    rec.take();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true }));
    const down = rec.take();
    el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    const up = rec.take();
    const motion = TestBed.runInInjectionContext(() => injectMotion());
    motion.play(el, 'press', 'button-press', { phase: 'enter' });
    const expectDown = rec.take();
    motion.play(el, 'press', 'button-press', { phase: 'exit' });
    const expectUp = rec.take();
    expect(down.length).toBe(1);
    expect(down).toEqual(expectDown);
    expect(up).toEqual(expectUp);
  });

  it('a button that starts loading does not morph on its first render', async () => {
    const fixture = TestBed.createComponent(StartsLoading);
    await fixture.whenStable();
    expect(rec.take()).toEqual([]);
  });

  it('Enter does not press a loading button', async () => {
    const { host, fixture, q } = await setup();
    host.loading.set(true);
    await fixture.whenStable();
    rec.take();
    q('save').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(rec.take()).toEqual([]);
  });
});
