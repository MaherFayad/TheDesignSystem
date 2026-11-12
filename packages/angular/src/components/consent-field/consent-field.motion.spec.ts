// Round 2 motion of ConsentField (order 1.22): consent-check and the error
// entrance, with React's beats. jsdom has no Web Animations API, so
// Element.animate is a stand in that records each call.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { slideIn, token } from '../../internal/motion-fields';
import { DsTheme } from '../../theme/theme';
import { DsConsentField } from './consent-field';

interface Call {
  el: Element;
  frames: Keyframe[];
  opts: KeyframeAnimationOptions;
}

let calls: Call[] = [];
const ids = (id: string) => calls.filter((c) => String(c.opts.id) === `ds-motion:${id}`);

beforeEach(() => {
  calls = [];
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value: vi.fn(function (this: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
      calls.push({ el: this, frames, opts });
      return { id: String(opts?.id ?? ''), finished: new Promise(() => undefined), cancel: vi.fn() } as unknown as Animation;
    }),
  });
});

afterEach(() => {
  Reflect.deleteProperty(Element.prototype, 'animate');
  document.documentElement.removeAttribute('data-motion');
});

@Component({
  imports: [DsConsentField, DsTheme],
  template: `<div dsTheme="desk"><div dsConsentField purpose="Send me product news by email" detailsHref="#privacy" [error]="error()"></div></div>`,
})
class Host {
  readonly error = signal<string | undefined>(undefined);
}

@Component({
  imports: [DsConsentField],
  template: `<div dsConsentField purpose="Send me product news by email" detailsHref="#privacy"></div>`,
})
class Studio {}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const box = root.querySelector<HTMLElement>('[role="checkbox"]')!;
  return { fixture, host: fixture.componentInstance, root, box };
}

describe('consent field motion, order 1.22', () => {
  it('consent-check: giving the consent lands the mark from scale.morph on top of the draw; withdrawing plays nothing', async () => {
    const { fixture, root, box } = await setup();
    box.click();
    await fixture.whenStable();
    const [call] = ids('consent-check');
    expect(call?.el).toBe(root.querySelector('[data-ds="consent-field"] > [data-part="control"] [data-part="indicator"] [data-ds="icon"]'));
    expect(call?.frames).toEqual([{ transform: `scale(${token.morph})` }, { transform: 'scale(1)' }]);
    expect(call?.opts.composite).toBe('add');
    box.click();
    await fixture.whenStable();
    expect(ids('consent-check')).toHaveLength(1);
  });

  it('consent-check in Studio (pop plays reduced) and under reduced motion: no pop', async () => {
    const studio = TestBed.createComponent(Studio);
    await studio.whenStable();
    (studio.nativeElement as HTMLElement).querySelector<HTMLElement>('[role="checkbox"]')!.click();
    await studio.whenStable();
    expect(ids('consent-check')).toHaveLength(0);
    studio.destroy();

    const { fixture, box } = await setup();
    document.documentElement.setAttribute('data-motion', 'reduce');
    box.click();
    await fixture.whenStable();
    expect(ids('consent-check')).toHaveLength(0);
  });

  it('field-error-enter: an error after the first render slides in', async () => {
    const { fixture, host, root } = await setup();
    host.error.set('Give the consent to get the news.');
    await fixture.whenStable();
    expect(ids('field-error-enter')[0]?.el).toBe(root.querySelector('[data-ds="field-error"]'));
    expect(ids('field-error-enter')[0]?.frames).toEqual(slideIn().keyframes);
  });
});
