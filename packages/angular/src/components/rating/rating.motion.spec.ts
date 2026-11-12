// Round 2 motion of Rating (order 1.22): rating-fill, with React's beats.
// jsdom has no Web Animations API, so Element.animate is a stand in that
// records each call.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { token } from '../../internal/motion-fields';
import { DsTheme } from '../../theme/theme';
import { DsRating } from './rating';

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
  imports: [DsTheme, DsRating],
  template: `<div dsTheme="desk"><div dsRating aria-label="Rate this template" [defaultValue]="2"></div></div>`,
})
class Host {}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const stars = [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="radio"]')];
  const pick = async (score: number) => {
    stars[score - 1]!.click();
    await fixture.whenStable();
  };
  const icon = (score: number) => stars[score - 1]!.querySelector('[data-part="icon"]');
  return { fixture, stars, pick, icon };
}

describe('rating motion, order 1.22', () => {
  it('rating-fill: only the stars that fill land from scale.morph; the ones that empty dip; kept stars never move', async () => {
    const { pick, icon } = await setup();
    await pick(4);
    let played = ids('rating-fill');
    expect(played.map((c) => c.el)).toEqual([icon(3), icon(4)]);
    expect(played.every((c) => c.frames[0]?.transform === `scale(${token.morph})` && c.frames[0]?.opacity === 0)).toBe(true);

    calls = [];
    await pick(1);
    played = ids('rating-fill');
    expect(played.map((c) => c.el)).toEqual([icon(2), icon(3), icon(4)]);
    expect(played[0]?.frames.map((f) => f.transform)).toEqual(['none', `scale(${token.anticipate})`, 'none']);

    calls = [];
    await pick(1);
    expect(ids('rating-fill')).toHaveLength(0);
  });

  it('rating-fill reduced: the new stars fade in, the stars that empty change at once', async () => {
    const { pick, icon } = await setup();
    document.documentElement.setAttribute('data-motion', 'reduce');
    await pick(3);
    expect(ids('rating-fill').map((c) => [c.el, c.frames])).toEqual([[icon(3), [{ opacity: 0 }, { opacity: 1 }]]]);
    calls = [];
    await pick(1);
    expect(ids('rating-fill')).toHaveLength(0);
  });
});
