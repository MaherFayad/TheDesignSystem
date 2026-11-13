import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it, vi } from 'vitest';
import { DsTheme } from '../../theme/theme';
import ToggleGroupDemo from './toggle-group.demo';
import { DsToggleGroup, DsToggleGroupItem, type ToggleGroupValue } from './toggle-group';

@Component({
  imports: [DsToggleGroup, DsToggleGroupItem, DsTheme, ReactiveFormsModule, FormsModule],
  template: `
    <div data-test="views" dsToggleGroup type="single" aria-label="Board view">
      <button dsToggleGroupItem value="list">List</button>
      <button dsToggleGroupItem value="grid">Grid</button>
      <button dsToggleGroupItem value="columns">Columns</button>
    </div>
    <div data-test="style" dsToggleGroup type="multiple" aria-label="Text style" (valueChange)="styleChanges.push($event)">
      <button dsToggleGroupItem value="bold">Bold</button>
      <button dsToggleGroupItem value="italic">Italic</button>
    </div>
    <div data-test="single" dsToggleGroup type="single" aria-label="Board view" defaultValue="list" (valueChange)="singleChanges.push($event)">
      <button dsToggleGroupItem value="list">List</button>
      <button dsToggleGroupItem value="grid">Grid</button>
    </div>
    <div data-test="bound" dsToggleGroup type="single" aria-label="Board view" [(value)]="view">
      <button dsToggleGroupItem value="list">List</button>
      <button dsToggleGroupItem value="grid">Grid</button>
    </div>
    <div dsTheme dir="rtl" lang="ar">
      <div data-test="rtl" dsToggleGroup type="single" aria-label="عرض اللوحة">
        <button dsToggleGroupItem value="list">قائمة</button>
        <button dsToggleGroupItem value="grid">شبكة</button>
      </div>
    </div>
    <div data-test="vertical" dsToggleGroup type="multiple" aria-label="Show on canvas" orientation="vertical">
      <button dsToggleGroupItem value="rulers">Rulers</button>
      <button dsToggleGroupItem value="guides">Guides</button>
    </div>
    <div data-test="axes" dsToggleGroup type="multiple" aria-label="Text style" size="lg" emphasis="outline" shape="pill" attached>
      <button dsToggleGroupItem value="bold">Bold</button>
      <button dsToggleGroupItem value="italic" size="sm" emphasis="ghost" shape="square">Italic</button>
    </div>
    <div data-test="icon" dsToggleGroup type="single" aria-label="Board view">
      <button dsToggleGroupItem value="grid" icon="grid" label="Grid view"></button>
      <button dsToggleGroupItem value="bold" aria-label="Bold text">B</button>
    </div>
    <div data-test="inert-item" dsToggleGroup type="multiple" aria-label="Text style" (valueChange)="inertChanges.push($event)">
      <button dsToggleGroupItem value="bold">Bold</button>
      <button dsToggleGroupItem value="italic" disabled>Italic</button>
      <button dsToggleGroupItem value="underline">Underline</button>
    </div>
    <div data-test="inert-group" dsToggleGroup type="single" aria-label="Board view" disabled>
      <button dsToggleGroupItem value="list">List</button>
      <button dsToggleGroupItem value="grid">Grid</button>
    </div>
    <div data-test="prevent" dsToggleGroup type="multiple" aria-label="Text style">
      <button dsToggleGroupItem value="bold" (click)="$event.preventDefault()">Bold</button>
    </div>
    <div data-test="reactive" dsToggleGroup type="single" aria-label="Board view" [formControl]="board">
      <button dsToggleGroupItem value="list">List</button>
      <button dsToggleGroupItem value="grid">Grid</button>
    </div>
    <div data-test="template" dsToggleGroup type="multiple" aria-label="Text style" [(ngModel)]="styles">
      <button dsToggleGroupItem value="bold">Bold</button>
      <button dsToggleGroupItem value="italic">Italic</button>
    </div>
  `,
})
class Host {
  readonly view = signal<ToggleGroupValue | undefined>('list');
  readonly board = new FormControl<string>('grid', { nonNullable: true });
  styles: string[] = ['italic'];
  readonly styleChanges: (ToggleGroupValue | undefined)[] = [];
  readonly singleChanges: (ToggleGroupValue | undefined)[] = [];
  readonly inertChanges: (ToggleGroupValue | undefined)[] = [];
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
  /** Tab into a group: focus lands on the root, which hands it on. */
  const tabInto = async (id: string) => {
    root(id).focus();
    await settle();
  };
  return { fixture, host: fixture.componentInstance, root, items, settle, key, tabInto };
}

describe('DsToggleGroup', () => {
  it('tab-slide: the on fill slides from the item it leaves and the labels take the ink, with no dip; none in a multiple group or when reduced', async () => {
    // A slide carries its keyframes and timing, so the ink can read them; finished never settles, so twins stay to be read.
    const animate = vi.fn(
      (frames: Keyframe[], opts?: KeyframeAnimationOptions) =>
        ({
          playState: 'running',
          startTime: 0,
          finished: new Promise(() => undefined),
          cancel: vi.fn(),
          effect: {
            getKeyframes: () => frames.map((f, i) => ({ ...f, computedOffset: f.offset ?? i / Math.max(1, frames.length - 1) })),
            getTiming: () => ({ duration: opts?.duration ?? 0, easing: opts?.easing ?? 'linear' }),
            getComputedTiming: () => ({ duration: opts?.duration ?? 0 }),
          },
        }) as unknown as Animation,
    );
    const proto = HTMLElement.prototype as unknown as { animate?: unknown; getAnimations?: unknown };
    // Own descriptors, so cleanup removes the stubs instead of leaving own properties that hide later stubs on Element.prototype.
    const own = (['animate', 'getAnimations', 'getBoundingClientRect'] as const).map((k) => [k, Object.getOwnPropertyDescriptor(HTMLElement.prototype, k)] as const);
    proto.animate = animate;
    proto.getAnimations = () => [];
    // A fake layout: each item is 60 by 28 px, side by side; its fill and label inside it.
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const item = this.closest<HTMLElement>('[data-part="item"]');
      if (!item) return DOMRect.fromRect({ x: 0, y: 0, width: 200, height: 28 });
      const i = Array.from(item.parentElement?.querySelectorAll('[data-part="item"]') ?? []).indexOf(item);
      return DOMRect.fromRect({ x: i * 60, y: 0, width: 60, height: 28 });
    };
    try {
      const { items, settle } = await setup();
      expect(animate).not.toHaveBeenCalled();
      const multiple = items('style');
      expect(multiple[0]!.querySelector(':scope > span[aria-hidden="true"]:not([data-part])')).toBeNull();
      multiple[0]!.click();
      await settle();
      expect(animate).not.toHaveBeenCalled();
      // The spring time the slide reads (the token CSS is not loaded here), so the ink has a duration to follow.
      document.documentElement.style.setProperty('--ds-duration-spring-snappy', '180ms');
      // Two colors, as the CSS gives the off and on labels, so the ink has something to cross.
      const parts = items('single').map((i) => i.querySelector<HTMLElement>(':scope > [data-part="label"], :scope > [data-part="icon"]')!);
      parts.forEach((p, i) => (p.style.color = i === 1 ? 'rgb(2, 2, 2)' : 'rgb(1, 1, 1)'));
      items('single')[1]!.click();
      await settle();
      const calls = animate.mock.calls as unknown as [Keyframe[], KeyframeAnimationOptions][];
      expect(calls[0]![0][0]?.transform).toBe('translate(-60px, 0px) scale(1, 1)');
      expect(calls[0]![1]).toMatchObject({ id: 'ds-motion:indicator-slide' });
      expect(calls.some(([, o]) => o.id === 'ds-motion:indicator-answer')).toBe(false);
      // The label is kept outside the track, as React (order 1.29): no label or icon of an item moves (no dip and pop); the ink only holds its color.
      const animated = animate.mock.contexts as unknown as HTMLElement[];
      const moved = animated.filter((el, i) => el.matches?.('[data-part="item"] > :is([data-part="label"], [data-part="icon"])') && calls[i]![0].some((f) => 'transform' in f));
      expect(moved).toHaveLength(0);
      const group = items('single')[0]!.parentElement!;
      const twins = group.querySelectorAll<HTMLElement>('[data-part="label-ink"]');
      expect(twins.length).toBeGreaterThan(0);
      for (const t of twins) {
        expect(t.getAttribute('aria-hidden')).toBe('true');
        expect(t.style.color).toBe('rgb(2, 2, 2)');
      }
      const clips = calls.filter(([f, o]) => o.id === 'ds-motion:indicator-ink' && 'clipPath' in (f[0] ?? {}));
      expect(clips).toHaveLength(twins.length);
      expect(clips[0]![1]).toMatchObject({ duration: calls[0]![1].duration, easing: calls[0]![1].easing, fill: 'forwards' });
      const total = calls.length;
      document.documentElement.setAttribute('data-motion', 'reduce');
      items('single')[0]!.click();
      await settle();
      expect(animate).toHaveBeenCalledTimes(total);
      expect(group.querySelectorAll('[data-part="label-ink"]')).toHaveLength(0);
    } finally {
      document.documentElement.removeAttribute('data-motion');
      document.documentElement.style.removeProperty('--ds-duration-spring-snappy');
      for (const [k, d] of own) {
        if (d) Object.defineProperty(HTMLElement.prototype, k, d);
        else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[k];
      }
    }
  });

  it('an item holds the same parts in the same order as React: the pill span, the label or icon, the hit area', async () => {
    const { items } = await setup();
    const parts = (el: HTMLElement) => Array.from(el.children).map((c) => c.getAttribute('data-part'));
    // React ToggleGroup.tsx with ButtonRoot: [pill, label, hit] and [pill, icon, hit] in a single group; no pill in a multiple one.
    expect(parts(items('views')[0]!)).toEqual([null, 'label', 'hit']);
    expect(parts(items('icon')[0]!)).toEqual([null, 'icon', 'hit']);
    expect(parts(items('style')[0]!)).toEqual(['label', 'hit']);
  });

  it('renders the Radix root and items; single is a radiogroup of radios, with no stray attributes', async () => {
    const { root, items } = await setup();
    const el = root('views');
    expect(el.getAttribute('role')).toBe('radiogroup');
    expect(el.getAttribute('aria-label')).toBe('Board view');
    expect(el.getAttribute('data-ds')).toBe('toggle-group');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.getAttribute('dir')).toBe('ltr');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.getAttribute('style')).toContain('outline');
    for (const name of ['data-attached', 'data-disabled', 'data-emphasis', 'data-shape', 'aria-disabled', 'type', 'dstogglegroup']) {
      expect(el.hasAttribute(name)).toBe(false);
    }
    const list = items('views');
    expect(list).toHaveLength(3);
    for (const item of list) {
      expect(item.getAttribute('role')).toBe('radio');
      expect(item.getAttribute('data-ds')).toBe('toggle-button');
      expect(item.getAttribute('data-part')).toBe('item');
      expect(item.getAttribute('data-state')).toBe('off');
      expect(item.getAttribute('aria-checked')).toBe('false');
      expect(item.hasAttribute('aria-pressed')).toBe(false);
      expect(item.getAttribute('data-size')).toBe('md');
      expect(item.getAttribute('data-emphasis')).toBe('soft');
      expect(item.getAttribute('data-tone')).toBe('neutral');
      expect(item.getAttribute('data-shape')).toBe('default');
      expect(item.getAttribute('data-orientation')).toBe('horizontal');
      expect(item.getAttribute('tabindex')).toBe('-1');
      expect(item.getAttribute('type')).toBe('button');
      expect(item.hasAttribute('data-radix-collection-item')).toBe(true);
      expect(item.hasAttribute('value')).toBe(false);
      expect(item.hasAttribute('dstogglegroupitem')).toBe(false);
    }
    // A single group draws the on fill in an empty aria-hidden span first, as React (tab-slide).
    expect(Array.from(list[0]!.children).map((c) => c.getAttribute('data-part'))).toEqual([null, 'label', 'hit']);
    expect(list[0]!.firstElementChild?.outerHTML).toBe('<span aria-hidden="true"></span>');
  });

  it('type multiple is a toolbar of pressed buttons', async () => {
    const { root, items, host, settle } = await setup();
    expect(root('style').getAttribute('role')).toBe('toolbar');
    const [bold, italic] = items('style');
    expect(bold!.getAttribute('aria-pressed')).toBe('false');
    expect(bold!.hasAttribute('role')).toBe(false);
    expect(bold!.hasAttribute('aria-checked')).toBe(false);
    bold!.click();
    italic!.click();
    await settle();
    expect(bold!.getAttribute('data-state')).toBe('on');
    expect(italic!.getAttribute('aria-pressed')).toBe('true');
    expect(host.styleChanges).toEqual([['bold'], ['bold', 'italic']]);
  });

  it('type single keeps one on and lets it turn off', async () => {
    const { items, host, settle } = await setup();
    const [list, grid] = items('single');
    expect(list!.getAttribute('data-state')).toBe('on');
    grid!.click();
    await settle();
    expect(list!.getAttribute('data-state')).toBe('off');
    expect(grid!.getAttribute('aria-checked')).toBe('true');
    grid!.click();
    await settle();
    expect(grid!.getAttribute('data-state')).toBe('off');
    expect(host.singleChanges).toEqual(['grid', '']);
  });

  it('follows a bound value both ways', async () => {
    const { items, host, settle } = await setup();
    const [list, grid] = items('bound');
    expect(list!.getAttribute('data-state')).toBe('on');
    host.view.set('grid');
    await settle();
    expect(grid!.getAttribute('data-state')).toBe('on');
    expect(list!.getAttribute('data-state')).toBe('off');
    list!.click();
    await settle();
    expect(host.view()).toBe('list');
  });

  it('has one tab stop; arrows, Home and End move focus without toggling; Space and Enter toggle', async () => {
    const { root, items, key, tabInto, settle } = await setup();
    const [list, grid, columns] = items('views');
    await tabInto('views');
    expect(document.activeElement).toBe(list);
    expect(list!.getAttribute('tabindex')).toBe('0');
    await key('ArrowRight');
    expect(document.activeElement).toBe(grid);
    expect(grid!.getAttribute('tabindex')).toBe('0');
    expect(list!.getAttribute('tabindex')).toBe('-1');
    // Focus alone does not select in a ToggleGroup.
    expect(grid!.getAttribute('data-state')).toBe('off');
    await key('End');
    expect(document.activeElement).toBe(columns);
    await key('ArrowRight');
    expect(document.activeElement).toBe(list);
    await key('Home');
    await key('ArrowLeft');
    expect(document.activeElement).toBe(columns);
    // ArrowDown does nothing in a row.
    await key('ArrowDown');
    expect(document.activeElement).toBe(columns);
    // Space and Enter are left to the native button, which clicks.
    expect((await key(' ')).defaultPrevented).toBe(false);
    expect((await key('Enter')).defaultPrevented).toBe(false);
    columns!.click();
    await settle();
    expect(columns!.getAttribute('data-state')).toBe('on');
    // Shift+Tab takes the root out of the tab order, so focus leaves backward.
    await key('Tab', { shiftKey: true });
    expect(root('views').getAttribute('tabindex')).toBe('-1');
    root('views').dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await settle();
    expect(root('views').getAttribute('tabindex')).toBe('0');
  });

  it('Tab enters on the on item', async () => {
    const { items, tabInto } = await setup();
    await tabInto('style');
    expect(document.activeElement).toBe(items('style')[0]);
    await tabInto('single');
    expect(document.activeElement).toBe(items('single')[0]);
    items('single')[1]!.click();
    await tabInto('single');
    expect(document.activeElement).toBe(items('single')[1]);
  });

  it('reverses the arrows in RTL', async () => {
    const { root, items, key, tabInto } = await setup();
    expect(root('rtl').getAttribute('dir')).toBe('rtl');
    const [list, grid] = items('rtl');
    await tabInto('rtl');
    expect(document.activeElement).toBe(list);
    await key('ArrowLeft');
    expect(document.activeElement).toBe(grid);
    await key('ArrowRight');
    expect(document.activeElement).toBe(list);
  });

  it('uses ArrowDown and ArrowUp when vertical', async () => {
    const { root, items, key, tabInto } = await setup();
    expect(root('vertical').getAttribute('data-orientation')).toBe('vertical');
    const [rulers, guides] = items('vertical');
    expect(rulers!.getAttribute('data-orientation')).toBe('vertical');
    await tabInto('vertical');
    await key('ArrowDown');
    expect(document.activeElement).toBe(guides);
    await key('ArrowUp');
    expect(document.activeElement).toBe(rulers);
    await key('ArrowRight');
    expect(document.activeElement).toBe(rulers);
  });

  it('passes size, emphasis and shape to the items, and an item input wins', async () => {
    const { root, items } = await setup();
    const el = root('axes');
    expect(el.getAttribute('data-attached')).toBe('');
    expect(el.getAttribute('data-emphasis')).toBe('outline');
    expect(el.getAttribute('data-shape')).toBe('pill');
    expect(el.getAttribute('data-size')).toBe('lg');
    const [bold, italic] = items('axes');
    expect(bold!.getAttribute('data-size')).toBe('lg');
    expect(bold!.getAttribute('data-emphasis')).toBe('outline');
    expect(bold!.getAttribute('data-shape')).toBe('pill');
    expect(italic!.getAttribute('data-size')).toBe('sm');
    expect(italic!.getAttribute('data-emphasis')).toBe('ghost');
    expect(italic!.getAttribute('data-shape')).toBe('square');
  });

  it('renders the icon only form with the label as the name, and keeps a caller aria-label on a text item', async () => {
    const { items } = await setup();
    const [grid, bold] = items('icon');
    expect(grid!.getAttribute('aria-label')).toBe('Grid view');
    expect(grid!.hasAttribute('label')).toBe(false);
    expect(grid!.hasAttribute('icon')).toBe(false);
    expect(Array.from(grid!.children).map((c) => c.getAttribute('data-part'))).toEqual([null, 'icon', 'hit']);
    expect(bold!.getAttribute('aria-label')).toBe('Bold text');
  });

  it('a disabled item keeps aria-disabled and focus, does not toggle, and the arrows pass through it', async () => {
    const { items, host, key, tabInto, settle } = await setup();
    const [bold, italic, underline] = items('inert-item');
    expect(italic!.getAttribute('aria-disabled')).toBe('true');
    expect(italic!.getAttribute('data-disabled')).toBe('');
    expect(italic!.hasAttribute('disabled')).toBe(false);
    expect(bold!.hasAttribute('data-disabled')).toBe(false);
    await tabInto('inert-item');
    await key('ArrowRight');
    expect(document.activeElement).toBe(italic);
    italic!.click();
    await settle();
    expect(italic!.getAttribute('data-state')).toBe('off');
    await key('ArrowRight');
    expect(document.activeElement).toBe(underline);
    await key('ArrowLeft');
    await key('ArrowLeft');
    expect(document.activeElement).toBe(bold);
    expect(host.inertChanges).toEqual([]);
  });

  it('disabled on the group marks the root and every item, and the group stays reachable', async () => {
    const { root, items, key, tabInto, settle } = await setup();
    const el = root('inert-group');
    expect(el.getAttribute('data-disabled')).toBe('');
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('tabindex')).toBe('0');
    const [list, grid] = items('inert-group');
    for (const item of [list!, grid!]) {
      expect(item.getAttribute('aria-disabled')).toBe('true');
      expect(item.getAttribute('data-disabled')).toBe('');
    }
    await tabInto('inert-group');
    expect(document.activeElement).toBe(list);
    await key('End');
    expect(document.activeElement).toBe(grid);
    await key('ArrowRight');
    expect(document.activeElement).toBe(list);
    list!.click();
    await settle();
    expect(list!.getAttribute('data-state')).toBe('off');
  });

  it('a caller (click) that prevents the default keeps the state, decided in the same click', async () => {
    const { items } = await setup();
    const [bold] = items('prevent');
    bold!.click();
    // No wait: the decision is synchronous.
    expect(bold!.getAttribute('aria-pressed')).toBe('false');
  });

  it('works with a reactive FormControl: model to view, view to model, disable', async () => {
    const { root, items, host, settle } = await setup();
    const [list, grid] = items('reactive');
    expect(grid!.getAttribute('data-state')).toBe('on');
    host.board.setValue('list');
    await settle();
    expect(list!.getAttribute('data-state')).toBe('on');
    grid!.click();
    await settle();
    expect(host.board.value).toBe('grid');
    host.board.disable();
    await settle();
    expect(root('reactive').getAttribute('data-disabled')).toBe('');
    expect(list!.getAttribute('aria-disabled')).toBe('true');
    list!.click();
    await settle();
    expect(host.board.value).toBe('grid');
    host.board.enable();
    await settle();
    expect(root('reactive').hasAttribute('data-disabled')).toBe(false);
    expect(list!.hasAttribute('aria-disabled')).toBe(false);
  });

  it('works with ngModel and a list for multiple, and marks touched on focusout', async () => {
    const { fixture, root, items, host, settle } = await setup();
    await settle();
    const [bold, italic] = items('template');
    expect(italic!.getAttribute('data-state')).toBe('on');
    bold!.click();
    await settle();
    expect(host.styles).toEqual(['italic', 'bold']);
    root('template').dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await settle();
    expect(root('template').classList.contains('ng-touched')).toBe(true);
    fixture.destroy();
  });

  it('renders the demo with every case and no native title', async () => {
    const fixture = TestBed.createComponent(ToggleGroupDemo);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const cases = Array.from(el.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
    expect(el.querySelector('[title]')).toBeNull();
  });
});
