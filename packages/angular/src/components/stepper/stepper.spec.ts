import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsStepper, type StepperStep } from './stepper';

const steps: StepperStep[] = [
  { title: 'Account', description: 'Email and password' },
  { title: 'Address' },
  { title: 'Payment' },
  { title: 'Review' },
];

@Component({
  imports: [DsStepper, DsTheme],
  template: `
    <ol dsStepper id="static" [steps]="steps" [current]="2" size="sm" orientation="vertical"></ol>
    <ol dsStepper id="nav" [steps]="navSteps()" [current]="current()" [onStepSelect]="pick" [mode]="mode()" aria-label="Checkout steps"></ol>
    <ol dsStepper id="own" [steps]="steps" [onStepSelect]="pick"></ol>
    <ol dsStepper id="links" [steps]="links" [current]="1" aria-labelledby="heading"></ol>
    <div dsTheme [lang]="'ar'"><ol dsStepper id="ar" [steps]="steps" [current]="1"></ol></div>
  `,
})
class Host {
  readonly steps = steps;
  readonly links = steps.map((s, i) => ({ ...s, href: `#step-${i}` }));
  readonly current = signal(2);
  readonly mode = signal<'linear' | 'free'>('linear');
  readonly navSteps = signal<StepperStep[]>(steps);
  readonly picked: number[] = [];
  readonly pick = (i: number) => {
    this.picked.push(i);
    this.current.set(i);
  };
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (sel: string) => fixture.nativeElement.querySelector(sel) as HTMLElement;
  const qa = (sel: string) => Array.from(fixture.nativeElement.querySelectorAll(sel)) as HTMLElement[];
  return { fixture, host: fixture.componentInstance, q, qa };
}

describe('DsStepper', () => {
  it('stepper-travel: the ring (indicator ::after) travels from the old current step and fades, the new one pops; nothing when reduced', async () => {
    const animate = vi.fn(() => ({ playState: 'running', cancel: vi.fn() }) as unknown as Animation);
    const proto = HTMLElement.prototype as unknown as { animate?: unknown; getAnimations?: unknown };
    // Own descriptors, so cleanup removes the stubs instead of leaving own properties that hide later stubs on Element.prototype.
    const own = (['animate', 'getAnimations', 'getBoundingClientRect'] as const).map((k) => [k, Object.getOwnPropertyDescriptor(HTMLElement.prototype, k)] as const);
    proto.animate = animate;
    proto.getAnimations = () => [];
    // A fake layout: each step is a 40px row; its indicator a 24px square at its start.
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const step = this.closest<HTMLElement>('li[data-part="step"]');
      if (!step) return DOMRect.fromRect({ x: 0, y: 0, width: 300, height: 160 });
      const i = Array.from(step.parentElement?.children ?? []).indexOf(step);
      return DOMRect.fromRect({ x: 0, y: i * 40, width: 24, height: 24 });
    };
    try {
      const { fixture, host } = await setup();
      expect(animate).not.toHaveBeenCalled();
      host.current.set(3);
      await fixture.whenStable();
      const calls = animate.mock.calls as unknown as [Keyframe[], KeyframeAnimationOptions & { pseudoElement?: string }][];
      expect(calls.length).toBe(2);
      const [frames, options] = calls[0]!;
      expect(options).toMatchObject({ id: 'ds-motion:indicator-slide', pseudoElement: '::after' });
      expect(frames[0]).toMatchObject({ transform: 'translate(0px, -40px) scale(1, 1)', opacity: 1 });
      expect(frames[2]).toMatchObject({ transform: 'none', opacity: 0 });
      // The new current indicator pops, added to its own transform.
      expect(calls[1]![0]).toEqual([{ transform: 'scale(0.95)' }, { transform: 'none' }]);
      expect(calls[1]![1]).toMatchObject({ id: 'ds-motion:indicator-answer', composite: 'add' });
      document.documentElement.setAttribute('data-motion', 'reduce');
      host.current.set(1);
      await fixture.whenStable();
      expect(animate).toHaveBeenCalledTimes(2);
    } finally {
      document.documentElement.removeAttribute('data-motion');
      for (const [k, d] of own) {
        if (d) Object.defineProperty(HTMLElement.prototype, k, d);
        else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[k];
      }
    }
  });

  it('stepper-travel, round 3: a step that turns complete draws its check from its end with stroke-dashoffset; back and reduced draw nothing', async () => {
    const animate = vi.fn(() => ({ playState: 'running', finished: Promise.resolve(), cancel: vi.fn() }) as unknown as Animation);
    // Own descriptors on every prototype a stub lands on, so cleanup leaves nothing that hides later stubs.
    const protos = [Element.prototype, HTMLElement.prototype, SVGElement.prototype] as const;
    const own = protos.flatMap((p) => (['animate', 'getAnimations'] as const).map((k) => [p, k, Object.getOwnPropertyDescriptor(p, k)] as const));
    for (const p of [HTMLElement.prototype, SVGElement.prototype]) {
      Object.defineProperty(p, 'animate', { value: animate, configurable: true, writable: true });
      Object.defineProperty(p, 'getAnimations', { value: () => [], configurable: true, writable: true });
    }
    document.documentElement.style.setProperty('--ds-duration-spring-soft', '220ms');
    try {
      const { fixture, host } = await setup();
      const draws = () => (animate.mock.calls as unknown as [Keyframe[], KeyframeAnimationOptions][]).filter(([, o]) => o.id === 'ds-motion:stepper-check');
      expect(draws()).toHaveLength(0);
      host.current.set(3);
      await fixture.whenStable();
      expect(draws()).toHaveLength(1);
      const [frames, options] = draws()[0]!;
      expect(frames).toEqual([
        { strokeDasharray: '24 24', strokeDashoffset: -24 },
        { strokeDasharray: '24 24', strokeDashoffset: 0 },
      ]);
      expect(options).toMatchObject({ duration: 220, id: 'ds-motion:stepper-check' });
      const target = (animate.mock.contexts as Element[])[animate.mock.calls.findIndex((c) => (c as unknown as [unknown, KeyframeAnimationOptions])[1].id === 'ds-motion:stepper-check')];
      expect(target?.tagName.toLowerCase()).toBe('path');
      expect(target?.closest('[data-part="step"]')).toBe(document.querySelectorAll('#nav > [data-part="step"]')[2]);
      // Going back draws nothing.
      host.current.set(1);
      await fixture.whenStable();
      expect(draws()).toHaveLength(1);
      // Reduced: the check is whole at once.
      document.documentElement.setAttribute('data-motion', 'reduce');
      host.current.set(3);
      await fixture.whenStable();
      expect(draws()).toHaveLength(1);
    } finally {
      document.documentElement.removeAttribute('data-motion');
      document.documentElement.style.removeProperty('--ds-duration-spring-soft');
      for (const [p, k, d] of own) {
        if (d) Object.defineProperty(p, k, d);
        else delete (p as unknown as Record<string, unknown>)[k];
      }
    }
  });

  it('renders an ordered list with complete, current and upcoming steps, and plain titles without a handler', async () => {
    const { q, qa } = await setup();
    const list = q('#static');
    expect(list.tagName).toBe('OL');
    expect(list.getAttribute('data-ds')).toBe('stepper');
    expect(list.getAttribute('data-size')).toBe('sm');
    expect(list.getAttribute('data-orientation')).toBe('vertical');
    expect(list.getAttribute('aria-label')).toBe('Steps');
    const items = qa('#static > li');
    expect(items.map((li) => li.getAttribute('data-state'))).toEqual(['complete', 'complete', 'current', 'upcoming']);
    expect(items[2]!.getAttribute('aria-current')).toBe('step');
    expect(items[0]!.querySelector('[data-part="indicator"] svg')?.getAttribute('data-icon')).toBe('check');
    expect(items[3]!.querySelector('[data-part="indicator"]')?.textContent).toBe('4');
    expect(items[0]!.querySelector('[data-part="title"]')?.tagName).toBe('SPAN');
    expect(items[0]!.querySelector('[data-part="status"]')?.textContent).toBe(', complete');
    expect(items[2]!.querySelector('[data-part="status"]')?.textContent).toBe(', current step');
    expect(items[0]!.querySelector('[data-part="description"]')?.textContent).toBe('Email and password');
    expect(items.map((li) => li.querySelector('[data-part="connector"]') !== null)).toEqual([true, true, true, false]);
  });

  it('renders reachable steps as buttons when onStepSelect is set and calls it on a click', async () => {
    const { fixture, host, qa } = await setup();
    const titles = () => qa('#nav > li > [data-part="title"]');
    expect(titles().map((t) => t.tagName)).toEqual(['BUTTON', 'BUTTON', 'SPAN', 'SPAN']);
    expect(titles()[0]!.getAttribute('data-ds')).toBe('button');
    expect(titles()[0]!.getAttribute('data-emphasis')).toBe('ghost');
    expect(titles()[0]!.getAttribute('data-size')).toBe('xs');
    expect(titles()[0]!.hasAttribute('data-wrap')).toBe(true);
    titles()[0]!.click();
    await fixture.whenStable();
    expect(host.picked).toEqual([0]);
    // Going back keeps the progress: the steps before the furthest one reached stay complete, so step 3 stays reachable.
    expect(qa('#nav > li').map((li) => li.getAttribute('data-state'))).toEqual(['current', 'complete', 'upcoming', 'upcoming']);
    expect(titles().map((t) => t.tagName)).toEqual(['SPAN', 'BUTTON', 'BUTTON', 'SPAN']);
  });

  it('keeps an uncontrolled current of its own', async () => {
    const { fixture, host, qa } = await setup();
    expect(qa('#own > li')[0]!.getAttribute('data-state')).toBe('current');
    host.mode.set('free');
    await fixture.whenStable();
    const nav = qa('#nav > li > [data-part="title"]');
    expect(nav.map((t) => t.tagName)).toEqual(['BUTTON', 'BUTTON', 'SPAN', 'BUTTON']);
  });

  it('marks invalid and disabled steps with words and skips a disabled step', async () => {
    const { fixture, host, qa } = await setup();
    host.navSteps.set(steps.map((s, i) => (i === 1 ? { ...s, invalid: true } : i === 3 ? { ...s, disabled: true } : s)));
    host.mode.set('free');
    await fixture.whenStable();
    const items = qa('#nav > li');
    expect(items[1]!.hasAttribute('data-invalid')).toBe(true);
    expect(items[1]!.querySelector('[data-part="indicator"] svg')?.getAttribute('data-icon')).toBe('danger');
    expect(items[1]!.querySelector('[data-part="status"]')?.textContent).toBe(', complete, has errors');
    expect(items[3]!.hasAttribute('data-disabled')).toBe(true);
    expect(items[3]!.querySelector('[data-part="title"]')?.tagName).toBe('SPAN');
    expect(items[3]!.querySelector('[data-part="status"]')?.textContent).toBe(', unavailable');
  });

  it('renders link steps as a[dsButton] and drops aria-label for aria-labelledby', async () => {
    const { q, qa } = await setup();
    expect(q('#links').getAttribute('aria-label')).toBeNull();
    expect(q('#links').getAttribute('aria-labelledby')).toBe('heading');
    const first = qa('#links > li > [data-part="title"]')[0]!;
    expect(first.tagName).toBe('A');
    expect(first.getAttribute('href')).toBe('#step-0');
  });

  it('uses Arabic words under an Arabic theme', async () => {
    const { q } = await setup();
    expect(q('#ar').getAttribute('aria-label')).toBe('الخطوات');
    expect(q('#ar > li [data-part="status"]').textContent).toBe('، مكتملة');
  });
});
