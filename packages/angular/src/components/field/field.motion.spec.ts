// Round 2 motion of Field and FieldError (order 1.22): field-message-enter
// and field-error-enter, with React's beats. jsdom has no Web Animations
// API, so Element.animate is a stand in that records each call.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emerge, landPop, slideIn } from '@the-system/motion';
import { DsInput } from '../input/input';
import { DsField, DsFieldDescription } from './field';

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
  imports: [DsField, DsFieldDescription, DsInput],
  template: `
    <div dsField label="Board name" [error]="error()">
      <div dsInput></div>
      @if (hint()) {
        <p dsFieldDescription>Shown to everyone in the workspace.</p>
      }
    </div>
  `,
})
class Host {
  readonly error = signal<string | undefined>(undefined);
  readonly hint = signal(false);
}

async function setup(start: { error?: string; hint?: boolean } = {}) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.error.set(start.error);
  fixture.componentInstance.hint.set(start.hint ?? false);
  await fixture.whenStable();
  return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
}

describe('field motion, order 1.22', () => {
  it('field-message-enter: a description created after the first render slides in with slideIn; one there at first does not move', async () => {
    const first = await setup({ hint: true });
    expect(ids('field-message-enter')).toHaveLength(0);
    first.fixture.destroy();

    const { fixture, host, root } = await setup();
    host.hint.set(true);
    await fixture.whenStable();
    const [call] = ids('field-message-enter');
    expect(call?.el).toBe(root.querySelector('[data-part="description"]'));
    expect(call?.frames).toEqual(slideIn().keyframes);
    expect(call?.opts.fill).toBe('none');
  });

  it('field-message-enter reduced: the description fades in', async () => {
    const { fixture, host } = await setup();
    document.documentElement.setAttribute('data-motion', 'reduce');
    host.hint.set(true);
    await fixture.whenStable();
    expect(ids('field-message-enter')[0]?.frames).toEqual([{ opacity: 0 }, { opacity: 1 }]);
  });

  it('field-error-enter: a later error comes out from under the control and its icon lands one stagger step later; one there at first does not move', async () => {
    const first = await setup({ error: 'Enter a board name.' });
    expect(ids('field-error-enter')).toHaveLength(0);
    first.fixture.destroy();

    const { fixture, host, root } = await setup();
    host.error.set('Enter a board name.');
    await fixture.whenStable();
    const error = root.querySelector('[data-ds="field-error"]');
    const [msg] = ids('field-error-enter');
    const [icon] = ids('field-error-enter-icon');
    expect(msg?.el).toBe(error);
    // Order 1.23: it comes out from under the control, behind a clip-path that holds its top edge.
    expect(msg?.frames).toEqual(emerge().keyframes);
    expect(msg?.frames[0]).toMatchObject({ transform: 'translateY(-100%)', clipPath: 'inset(100% 0 0 0)' });
    expect(msg?.frames[msg.frames.length - 1]).toMatchObject({ transform: 'none', clipPath: 'inset(0 0 0 0)' });
    expect(icon?.el).toBe(error?.querySelector(':scope > [data-part="icon"]'));
    expect(icon?.frames).toEqual(landPop().keyframes);
  });

  it('field-error-enter reduced: the message fades in and the icon does not move', async () => {
    const { fixture, host } = await setup();
    document.documentElement.setAttribute('data-motion', 'reduce');
    host.error.set('Enter a board name.');
    await fixture.whenStable();
    expect(ids('field-error-enter')[0]?.frames).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    expect(ids('field-error-enter-icon')).toHaveLength(0);
  });
});
