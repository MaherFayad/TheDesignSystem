// Round 2 motion of Fieldset (order 1.22): the group error enters as
// field-error-enter, with React's beats. jsdom has no Web Animations API,
// so Element.animate is a stand in that records each call.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { landPop, slideIn } from '../../internal/motion-fields';
import { DsFieldset } from './fieldset';

interface Call {
  el: Element;
  frames: Keyframe[];
  opts: KeyframeAnimationOptions;
}

let calls: Call[] = [];
const ids = (id: string) => calls.filter((c) => String(c.opts.id) === `ds-motion:${id}`);

// The stand in goes on the HTML and SVG prototypes too, so an own property
// another spec left there cannot shadow it.
const prototypes = [Element.prototype, HTMLElement.prototype, SVGElement.prototype];

beforeEach(() => {
  calls = [];
  const animate = vi.fn(function (this: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
    calls.push({ el: this, frames, opts });
    return { id: String(opts?.id ?? ''), finished: new Promise(() => undefined), cancel: vi.fn() } as unknown as Animation;
  });
  for (const proto of prototypes) Object.defineProperty(proto, 'animate', { configurable: true, writable: true, value: animate });
});

afterEach(() => {
  for (const proto of prototypes) Reflect.deleteProperty(proto, 'animate');
  document.documentElement.removeAttribute('data-motion');
});

@Component({
  imports: [DsFieldset],
  template: `<fieldset dsFieldset legend="Delivery days" [error]="error()"><p>Body</p></fieldset>`,
})
class Host {
  readonly error = signal<string | undefined>(undefined);
}

async function setup(error?: string) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.error.set(error);
  await fixture.whenStable();
  return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
}

describe('fieldset motion, order 1.22', () => {
  it('field-error-enter: a group error after the first render slides in and its icon lands; one there at first does not move', async () => {
    const first = await setup('Pick at least one day.');
    expect(ids('field-error-enter')).toHaveLength(0);
    first.fixture.destroy();

    const { fixture, host, root } = await setup();
    host.error.set('Pick at least one day.');
    await fixture.whenStable();
    const error = root.querySelector('[data-ds="field-error"]');
    expect(ids('field-error-enter')[0]?.el).toBe(error);
    expect(ids('field-error-enter')[0]?.frames).toEqual(slideIn().keyframes);
    expect(ids('field-error-enter-icon')[0]?.frames).toEqual(landPop().keyframes);
  });

  it('field-error-enter reduced: the group error fades in, the icon stays', async () => {
    const { fixture, host } = await setup();
    document.documentElement.setAttribute('data-motion', 'reduce');
    host.error.set('Pick at least one day.');
    await fixture.whenStable();
    expect(ids('field-error-enter')[0]?.frames).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    expect(ids('field-error-enter-icon')).toHaveLength(0);
  });
});
