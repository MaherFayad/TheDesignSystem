// The motion of InlineEdit, as React's InlineEdit.tsx plays it
// (inline-edit-morph): starting to edit morphs the pencil into the save
// check and lands the cancel mark one stagger step later; saving morphs the
// check back into the pencil, cancelling the close mark. The leaving glyph
// sits in an unnamed aria-hidden span after the new one.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { iconInFrames, iconOutFrames } from '@the-system/motion';
import { afterEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsInlineEdit } from './inline-edit';

interface Recorded {
  target: Element;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  finish: () => void;
}

/** Records every el.animate call on Element, HTMLElement and SVGElement, and restores them by descriptor. */
function recordAnimate() {
  const calls: Recorded[] = [];
  type Proto = { animate?: unknown; getAnimations?: unknown };
  const protos = [Element.prototype, HTMLElement.prototype, SVGElement.prototype] as unknown as Proto[];
  const saved = protos.map((p) => ({
    animate: Object.getOwnPropertyDescriptor(p, 'animate'),
    getAnimations: Object.getOwnPropertyDescriptor(p, 'getAnimations'),
  }));
  const animate = function (this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    let done: () => void = () => undefined;
    const anim = { id: options.id, playState: 'running', finished: new Promise<void>((r) => (done = r)), cancel() {} };
    calls.push({ target: this, keyframes, options, finish: () => ((anim.playState = 'finished'), done()) });
    return anim;
  };
  for (const p of protos) {
    Object.defineProperty(p, 'animate', { configurable: true, writable: true, value: animate });
    Object.defineProperty(p, 'getAnimations', { configurable: true, writable: true, value: () => [] });
  }
  return {
    calls,
    take: () => calls.splice(0),
    restore: () => {
      protos.forEach((p, i) => {
        for (const name of ['animate', 'getAnimations'] as const) {
          const d = saved[i]?.[name];
          if (d) Object.defineProperty(p, name, d);
          else delete p[name];
        }
      });
    },
  };
}

@Component({
  imports: [DsTheme, DsInlineEdit],
  template: `<div dsTheme="neutral"><div dsInlineEdit label="Board name" value="Spring launch"></div></div>`,
})
class Host {}

const byId = (calls: Recorded[], id: string) => calls.filter((c) => c.options.id === `ds-motion:${id}`);

async function setup() {
  const fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  const root = (fixture.nativeElement as HTMLElement).querySelector('[data-ds="inline-edit"]') as HTMLElement;
  return { fixture, root };
}

describe('InlineEdit motion', () => {
  afterEach(() => document.documentElement.removeAttribute('data-motion'));

  it('morphs the pencil into the check and lands the cancel mark a step later; save morphs back', async () => {
    const rec = recordAnimate();
    try {
      const { fixture, root } = await setup();
      (root.querySelector('[data-part="display"]') as HTMLElement).click();
      await fixture.whenStable();
      const icon = root.querySelector(':scope > [data-part="save"] > [data-part="icon"]') as HTMLElement;
      const incoming = icon.firstElementChild;
      const leaving = icon.lastElementChild as HTMLElement;
      expect(incoming?.getAttribute('data-icon')).toBe('check');
      expect(leaving.tagName).toBe('SPAN');
      expect(leaving.getAttribute('aria-hidden')).toBe('true');
      expect(leaving.firstElementChild?.getAttribute('data-icon')).toBe('edit');
      // iconMorph({ from: leaving span, to: the check, turn: 90 }), as React calls it.
      expect(byId(rec.calls, 'icon-morph-out').map((c) => c.target)).toEqual([leaving]);
      expect(byId(rec.calls, 'icon-morph-out')[0]?.keyframes).toEqual(iconOutFrames(90));
      expect(byId(rec.calls, 'icon-morph-in').map((c) => c.target)).toEqual([incoming]);
      expect(byId(rec.calls, 'icon-morph-in')[0]?.keyframes).toEqual(iconInFrames(90));
      // iconParts([null, cancel icon]): the cancel mark lands one stagger step later.
      const cancelIcon = root.querySelector(':scope > [data-part="cancel"] > [data-part="icon"]');
      const parts = rec.calls.filter((c) => c.target === cancelIcon);
      expect(parts).toHaveLength(1);
      // jsdom has no token values, so the delay reads 0; the step shows in the backwards fill.
      expect(parts[0]?.options.fill).toBe('backwards');
      // The leaving glyph goes once the morph settles.
      for (const c of rec.take()) c.finish();
      await new Promise((r) => setTimeout(r));
      await fixture.whenStable();
      expect(icon.querySelector(':scope > span')).toBeNull();
      // Save: the check morphs back into the pencil, turning the other way.
      (root.querySelector('[data-part="save"]') as HTMLElement).click();
      await fixture.whenStable();
      const end = root.querySelector(':scope > [data-part="display"] > [data-part="end"]') as HTMLElement;
      expect(end.firstElementChild?.getAttribute('data-icon')).toBe('edit');
      expect(end.lastElementChild?.firstElementChild?.getAttribute('data-icon')).toBe('check');
      expect(byId(rec.calls, 'icon-morph-in')[0]?.target).toBe(end.firstElementChild);
      expect(byId(rec.calls, 'icon-morph-in')[0]?.keyframes).toEqual(iconInFrames(-90));
      for (const c of rec.take()) c.finish();
      await new Promise((r) => setTimeout(r));
      await fixture.whenStable();
      expect(end.querySelector(':scope > span')).toBeNull();
      // Cancel: the close mark morphs into the pencil.
      (root.querySelector('[data-part="display"]') as HTMLElement).click();
      await fixture.whenStable();
      rec.take();
      (root.querySelector('[data-part="cancel"]') as HTMLElement).click();
      await fixture.whenStable();
      const end2 = root.querySelector(':scope > [data-part="display"] > [data-part="end"]') as HTMLElement;
      expect(end2.lastElementChild?.firstElementChild?.getAttribute('data-icon')).toBe('close');
      expect(byId(rec.calls, 'icon-morph-in')[0]?.keyframes).toEqual(iconInFrames(90));
      fixture.nativeElement.remove();
    } finally {
      rec.restore();
    }
  });

  it('cross fades with no turn under reduced motion', async () => {
    const rec = recordAnimate();
    try {
      document.documentElement.setAttribute('data-motion', 'reduce');
      const { fixture, root } = await setup();
      (root.querySelector('[data-part="display"]') as HTMLElement).click();
      await fixture.whenStable();
      const frames = rec.calls.flatMap((c) => c.keyframes);
      expect(rec.calls.length).toBeGreaterThan(0);
      expect(frames.some((f) => 'transform' in f)).toBe(false);
      fixture.nativeElement.remove();
    } finally {
      rec.restore();
    }
  });

  it('draws no leaving glyph at rest', async () => {
    const { fixture, root } = await setup();
    expect(root.querySelector('[data-part="end"] > span')).toBeNull();
    fixture.nativeElement.remove();
  });
});
