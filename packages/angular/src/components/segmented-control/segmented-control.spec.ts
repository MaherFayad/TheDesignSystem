import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DsTheme } from '../../theme/theme';
import SegmentedControlDemo from './segmented-control.demo';
import { DsSegmentedControl, DsSegmentedControlItem } from './segmented-control';

@Component({
  imports: [DsSegmentedControl, DsSegmentedControlItem, DsTheme, ReactiveFormsModule, FormsModule],
  template: `
    <div data-test="range" dsSegmentedControl aria-label="Calendar range" defaultValue="day" (valueChange)="changes.push($event)">
      <button dsSegmentedControlItem value="day">Day</button>
      <button dsSegmentedControlItem value="week">Week</button>
      <button dsSegmentedControlItem value="month">Month</button>
    </div>
    <div data-test="entry" dsSegmentedControl aria-label="Calendar range" defaultValue="month">
      <button dsSegmentedControlItem value="day">Day</button>
      <button dsSegmentedControlItem value="month">Month</button>
    </div>
    <div dsTheme dir="rtl" lang="ar">
      <div data-test="rtl" dsSegmentedControl aria-label="نطاق التقويم" defaultValue="day">
        <button dsSegmentedControlItem value="day">يوم</button>
        <button dsSegmentedControlItem value="week">أسبوع</button>
      </div>
    </div>
    <div data-test="bound" dsSegmentedControl aria-label="Calendar range" [(value)]="range">
      <button dsSegmentedControlItem value="day">Day</button>
      <button dsSegmentedControlItem value="month">Month</button>
    </div>
    <div data-test="inert-item" dsSegmentedControl aria-label="Calendar range" defaultValue="day" (valueChange)="inertChanges.push($event)">
      <button dsSegmentedControlItem value="day">Day</button>
      <button dsSegmentedControlItem value="week" disabled>Week</button>
      <button dsSegmentedControlItem value="month">Month</button>
    </div>
    <div data-test="inert-root" dsSegmentedControl aria-label="Calendar range" defaultValue="day" disabled>
      <button dsSegmentedControlItem value="day">Day</button>
      <button dsSegmentedControlItem value="week">Week</button>
    </div>
    <div data-test="axes" dsSegmentedControl aria-label="Board view" size="lg" shape="square" fullWidth defaultValue="grid">
      <button dsSegmentedControlItem value="list" icon="list" label="List view"></button>
      <button dsSegmentedControlItem value="grid" icon="grid" label="Grid view"></button>
    </div>
    <div data-test="prevent" dsSegmentedControl aria-label="Calendar range" defaultValue="day">
      <button dsSegmentedControlItem value="day">Day</button>
      <button dsSegmentedControlItem value="week" (click)="$event.preventDefault()">Week</button>
    </div>
    <div data-test="reactive" dsSegmentedControl aria-label="Billing period" [formControl]="period">
      <button dsSegmentedControlItem value="monthly">Monthly</button>
      <button dsSegmentedControlItem value="yearly">Yearly</button>
    </div>
    <div data-test="template" dsSegmentedControl aria-label="Billing period" [(ngModel)]="billing">
      <button dsSegmentedControlItem value="monthly">Monthly</button>
      <button dsSegmentedControlItem value="yearly">Yearly</button>
    </div>
  `,
})
class Host {
  readonly range = signal<string | undefined>('day');
  readonly period = new FormControl<string>('yearly', { nonNullable: true });
  billing = 'monthly';
  readonly changes: (string | undefined)[] = [];
  readonly inertChanges: (string | undefined)[] = [];
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
  const items = (id: string) => Array.from(root(id).querySelectorAll<HTMLButtonElement>(':scope > [data-part="item"]'));
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const key = async (k: string, init: KeyboardEventInit = {}) => {
    const el = document.activeElement as HTMLElement;
    const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
    el.dispatchEvent(event);
    await settle();
    return event;
  };
  const tabInto = async (id: string) => {
    root(id).focus();
    await settle();
  };
  return { fixture, host: fixture.componentInstance, root, items, settle, key, tabInto };
}

const states = (list: HTMLElement[]) => list.map((i) => i.getAttribute('data-state'));

describe('DsSegmentedControl', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders a radiogroup of radio items with the indicator first and the default attributes', async () => {
    const { root, items } = await setup();
    const el = root('range');
    expect(el.getAttribute('role')).toBe('radiogroup');
    expect(el.getAttribute('aria-label')).toBe('Calendar range');
    expect(el.getAttribute('data-ds')).toBe('segmented-control');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-shape')).toBe('pill');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.getAttribute('dir')).toBe('ltr');
    expect(el.getAttribute('tabindex')).toBe('0');
    for (const name of ['data-disabled', 'aria-disabled', 'data-full-width', 'dssegmentedcontrol', 'defaultvalue']) {
      expect(el.hasAttribute(name)).toBe(false);
    }
    const indicator = el.querySelector('[data-part="indicator"]');
    expect(indicator?.getAttribute('aria-hidden')).toBe('true');
    expect(el.firstElementChild).toBe(indicator);
    const list = items('range');
    expect(list).toHaveLength(3);
    for (const item of list) {
      expect(item.getAttribute('role')).toBe('radio');
      expect(item.getAttribute('data-ds')).toBe('toggle-button');
      expect(item.getAttribute('data-part')).toBe('item');
      expect(item.getAttribute('data-size')).toBe('md');
      expect(item.getAttribute('data-emphasis')).toBe('ghost');
      expect(item.getAttribute('data-orientation')).toBe('horizontal');
      expect(item.hasAttribute('aria-pressed')).toBe(false);
      expect(item.hasAttribute('emphasis')).toBe(false);
    }
    expect(states(list)).toEqual(['on', 'off', 'off']);
    expect(list.map((i) => i.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
  });

  it('selects on click and never goes empty', async () => {
    const { items, host, settle } = await setup();
    const [day, week] = items('range');
    week!.click();
    await settle();
    expect(week!.getAttribute('data-state')).toBe('on');
    expect(day!.getAttribute('data-state')).toBe('off');
    week!.click();
    await settle();
    expect(week!.getAttribute('data-state')).toBe('on');
    expect(host.changes).toEqual(['week']);
  });

  it('selection follows focus: the arrows select, Home and End too, and wrap', async () => {
    const { items, host, key, tabInto } = await setup();
    const [day, week, month] = items('range');
    await tabInto('range');
    expect(document.activeElement).toBe(day);
    await key('ArrowRight');
    expect(document.activeElement).toBe(week);
    expect(week!.getAttribute('aria-checked')).toBe('true');
    await key('End');
    expect(month!.getAttribute('data-state')).toBe('on');
    await key('ArrowRight');
    expect(document.activeElement).toBe(day);
    await key('ArrowLeft');
    await key('Home');
    expect(day!.getAttribute('data-state')).toBe('on');
    // Space and Enter are the native click, which keeps the selected item.
    expect((await key(' ')).defaultPrevented).toBe(false);
    day!.click();
    expect(day!.getAttribute('data-state')).toBe('on');
    expect(host.changes).toEqual(['week', 'month', 'day', 'month', 'day']);
  });

  it('Tab enters on the selected item', async () => {
    const { items, tabInto } = await setup();
    await tabInto('entry');
    expect(document.activeElement).toBe(items('entry')[1]);
  });

  it('reverses the arrows in RTL', async () => {
    const { root, items, key, tabInto } = await setup();
    expect(root('rtl').getAttribute('dir')).toBe('rtl');
    const [, week] = items('rtl');
    await tabInto('rtl');
    await key('ArrowLeft');
    expect(document.activeElement).toBe(week);
    expect(week!.getAttribute('data-state')).toBe('on');
  });

  it('follows a bound value both ways', async () => {
    const { items, host, settle } = await setup();
    const [day, month] = items('bound');
    expect(day!.getAttribute('data-state')).toBe('on');
    host.range.set('month');
    await settle();
    expect(month!.getAttribute('data-state')).toBe('on');
    day!.click();
    await settle();
    expect(host.range()).toBe('day');
  });

  it('a disabled item keeps focus in the arrow order and is never selected', async () => {
    const { items, host, key, tabInto, settle } = await setup();
    const [, week, month] = items('inert-item');
    expect(week!.getAttribute('aria-disabled')).toBe('true');
    expect(week!.getAttribute('data-disabled')).toBe('');
    expect(week!.hasAttribute('disabled')).toBe(false);
    await tabInto('inert-item');
    await key('ArrowRight');
    expect(document.activeElement).toBe(week);
    expect(week!.getAttribute('data-state')).toBe('off');
    week!.click();
    await settle();
    expect(week!.getAttribute('data-state')).toBe('off');
    await key('ArrowRight');
    expect(document.activeElement).toBe(month);
    expect(host.inertChanges).toEqual(['month']);
  });

  it('disabled on the root marks the root and every item, stays reachable by Tab, and Shift+Tab leaves', async () => {
    const { root, items, key, tabInto, settle } = await setup();
    const el = root('inert-root');
    expect(el.getAttribute('data-disabled')).toBe('');
    expect(el.getAttribute('aria-disabled')).toBe('true');
    for (const item of items('inert-root')) {
      expect(item.getAttribute('aria-disabled')).toBe('true');
      expect(item.getAttribute('data-disabled')).toBe('');
    }
    await tabInto('inert-root');
    expect(document.activeElement).toBe(items('inert-root')[0]);
    await key('ArrowRight');
    expect(document.activeElement).toBe(items('inert-root')[1]);
    expect(items('inert-root')[1]!.getAttribute('data-state')).toBe('off');
    await key('Tab', { shiftKey: true });
    expect(el.getAttribute('tabindex')).toBe('-1');
    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await settle();
    expect(el.getAttribute('tabindex')).toBe('0');
  });

  it('sets size, shape and full width; items take the size', async () => {
    const { root, items } = await setup();
    const el = root('axes');
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.getAttribute('data-shape')).toBe('square');
    expect(el.getAttribute('data-full-width')).toBe('');
    const [, grid] = items('axes');
    expect(grid!.getAttribute('data-size')).toBe('lg');
    expect(grid!.getAttribute('data-shape')).toBe('default');
    expect(grid!.getAttribute('aria-label')).toBe('Grid view');
    expect(Array.from(grid!.children).map((c) => c.getAttribute('data-part'))).toEqual(['icon']);
  });

  it('a caller (click) that prevents the default keeps the selection, decided in the same click', async () => {
    const { items } = await setup();
    const [day, week] = items('prevent');
    week!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(day!.getAttribute('aria-checked')).toBe('true');
  });

  it('places the indicator under the selected item and slides it with tab-slide on a change, as React', async () => {
    const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel: vi.fn() }) as unknown as Animation);
    const proto = HTMLElement.prototype as unknown as { animate?: unknown; getAnimations?: unknown };
    // Own descriptors, so cleanup removes the stubs instead of leaving own properties that hide later stubs on Element.prototype.
    const own = (['animate', 'getAnimations', 'getBoundingClientRect'] as const).map((k) => [k, Object.getOwnPropertyDescriptor(HTMLElement.prototype, k)] as const);
    proto.animate = animate;
    proto.getAnimations = () => [];
    // A fake layout: each item is 60 by 26 px, side by side from x 3.
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const part = this.getAttribute('data-part');
      if (part === 'item') {
        const i = Array.from(this.parentElement?.querySelectorAll('[data-part="item"]') ?? []).indexOf(this);
        return DOMRect.fromRect({ x: 3 + i * 60, y: 3, width: 60, height: 26 });
      }
      if (part === 'indicator') {
        const x = Number.parseFloat(this.style.getPropertyValue('--_segmented-control-indicator-start')) || 0;
        return DOMRect.fromRect({ x: x + 1, y: 3, width: 60, height: 26 });
      }
      return DOMRect.fromRect({ x: 0, y: 0, width: 200, height: 34 });
    };
    try {
      const { root, items, settle } = await setup();
      const indicator = root('range').querySelector<HTMLElement>('[data-part="indicator"]');
      expect(indicator?.hidden).toBe(false);
      expect(indicator?.style.getPropertyValue('--_segmented-control-indicator-inline-size')).toBe('60px');
      expect(animate).not.toHaveBeenCalled();
      items('range')[2]!.click();
      await settle();
      expect(indicator?.style.getPropertyValue('--_segmented-control-indicator-start')).toBe('123px');
      // The thumb slides (shared pill, x axis), then the label it leaves dips and the one it reaches pops.
      expect(animate).toHaveBeenCalledTimes(3);
      const calls = animate.mock.calls as unknown as [Keyframe[], KeyframeAnimationOptions][];
      const [frames, options] = calls[0]!;
      expect(options.id).toBe('ds-motion:indicator-slide');
      expect(frames[0]?.transform).toBe('translate(-120px, 0px) scale(1, 1)');
      expect(frames[1]?.transform).toBe('translate(-60px, 0px) scale(1.15, 1)');
      expect(frames.flatMap((f) => Object.keys(f)).every((k) => k === 'transform' || k === 'offset')).toBe(true);
      expect(calls[1]![1]).toMatchObject({ id: 'ds-motion:indicator-answer', composite: 'add' });
      expect(calls[2]![0]).toEqual([{ transform: 'scale(0.95)' }, { transform: 'none' }]);
      // Reduced: the thumb jumps and no label moves.
      document.documentElement.setAttribute('data-motion', 'reduce');
      items('range')[0]!.click();
      await settle();
      expect(indicator?.style.getPropertyValue('--_segmented-control-indicator-start')).toBe('3px');
      expect(animate).toHaveBeenCalledTimes(3);
    } finally {
      document.documentElement.removeAttribute('data-motion');
      for (const [k, d] of own) {
        if (d) Object.defineProperty(HTMLElement.prototype, k, d);
        else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[k];
      }
    }
  });

  it('works with a reactive FormControl: model to view, view to model, disable', async () => {
    const { root, items, host, settle } = await setup();
    const [monthly, yearly] = items('reactive');
    expect(yearly!.getAttribute('data-state')).toBe('on');
    host.period.setValue('monthly');
    await settle();
    expect(monthly!.getAttribute('data-state')).toBe('on');
    yearly!.click();
    await settle();
    expect(host.period.value).toBe('yearly');
    host.period.disable();
    await settle();
    expect(root('reactive').getAttribute('data-disabled')).toBe('');
    monthly!.click();
    await settle();
    expect(host.period.value).toBe('yearly');
    host.period.enable();
    await settle();
    expect(root('reactive').hasAttribute('data-disabled')).toBe(false);
  });

  it('works with ngModel', async () => {
    const { items, host, settle } = await setup();
    await settle();
    const [monthly, yearly] = items('template');
    expect(monthly!.getAttribute('data-state')).toBe('on');
    yearly!.click();
    await settle();
    expect(host.billing).toBe('yearly');
  });

  it('renders the demo with every case that applies and no native title', async () => {
    const fixture = TestBed.createComponent(SegmentedControlDemo);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const cases = Array.from(el.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
    expect(el.querySelector('[title]')).toBeNull();
  });
});
