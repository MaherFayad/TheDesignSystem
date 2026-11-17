// Performance fixture for the tab-slide of ToggleGroup (order R0.4, the
// Angular twin of R0.3 and of
// packages/react/src/components/ToggleGroup/ToggleGroup.perf.test.tsx).
//
// A press used to read boxes and colors between DOM writes: followIndicator
// started the slide, then playInk read every label again, so one press paid
// for more than one style pass. ToggleGroup now plans in a frame job
// (inFrame) with planFollow and planInk. These cases log every box, style
// and animation read and every write of the motion code, and check that all
// the reads of a render come before its first write, also when two groups
// and a SegmentedControl change in the same render. (Angular has no Tabs
// yet; SegmentedControl is the other list that plans in inFrame.)
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DsButton } from '../button/button';
import { DsSegmentedControl, DsSegmentedControlItem } from '../segmented-control/segmented-control';
import { DsToggleGroup, DsToggleGroupItem } from './toggle-group';

type Entry = 'read' | 'write';

const log: Entry[] = [];
// The own descriptors of HTMLElement.prototype, put back as they were. Copying the inherited
// methods back would leave own properties that hide a later stub on Element.prototype in the
// same worker (a spec file that runs after this one).
const saved: { proto: Record<string, PropertyDescriptor | undefined>; gcs: typeof window.getComputedStyle } = { proto: {}, gcs: window.getComputedStyle };
const style = document.createElement('style');

/** The index of an element among its parent's element children. */
const indexOf = (el: Element) => Array.from(el.parentElement?.children ?? []).indexOf(el);

beforeEach(() => {
  log.length = 0;
  // Two colors, so the ink has a rest color and an on color to cross between.
  style.textContent = '[data-part="item"] > [data-part="label"] { color: rgb(20, 20, 20); } [data-part="item"][data-state="on"] > [data-part="label"] { color: rgb(250, 250, 250); }';
  document.head.append(style);
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  for (const key of ['animate', 'getAnimations', 'getBoundingClientRect']) saved.proto[key] = Object.getOwnPropertyDescriptor(HTMLElement.prototype, key);
  proto.animate = function (this: HTMLElement) {
    log.push('write');
    return { finished: Promise.resolve(), cancel() {}, playState: 'running', effect: null, currentTime: 0 } as unknown as Animation;
  };
  proto.getAnimations = function () {
    log.push('read');
    return [];
  };
  // Each item is 72 by 32 px, 80 px apart; the root and any other box is 300 by 32.
  proto.getBoundingClientRect = function (this: HTMLElement) {
    log.push('read');
    const item = this.closest('[data-part="item"]');
    if (!item) return DOMRect.fromRect({ x: 0, y: 0, width: 300, height: 32 });
    return DOMRect.fromRect({ x: indexOf(item) * 80, y: 0, width: 72, height: 32 });
  };
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
    log.push('read');
    return saved.gcs.call(window, el, pseudo);
  });
  for (const key of ['append', 'appendChild', 'insertBefore', 'replaceChildren'] as const) {
    const own = Element.prototype[key] as (...args: unknown[]) => unknown;
    vi.spyOn(Element.prototype, key).mockImplementation(function (this: Element, ...args: unknown[]) {
      // Angular's own render inserts nodes too (the template, the test root); only the writes of the motion code count.
      if (!/@angular[\\/]|test-bed-init/.test(new Error().stack ?? '')) log.push('write');
      return own.apply(this, args);
    } as never);
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const [key, own] of Object.entries(saved.proto)) {
    if (own) Object.defineProperty(HTMLElement.prototype, key, own);
    else Reflect.deleteProperty(HTMLElement.prototype, key);
  }
  style.remove();
});

/** The log from the last press: everything after `mark`. */
function since(mark: number): Entry[] {
  return log.slice(mark);
}

/** True when the press reads, then only writes: one style pass. */
function readsThenWrites(press: Entry[]): boolean {
  const firstWrite = press.indexOf('write');
  return firstWrite > 0 && !press.slice(firstWrite).includes('read');
}

/** Lets the render, its after render effects and the frame job (a microtask) run, as the browser does before a paint. */
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve));
}

@Component({
  imports: [DsToggleGroup, DsToggleGroupItem],
  template: `
    <div dsToggleGroup type="single" aria-label="Board view" defaultValue="list">
      <button dsToggleGroupItem value="list">List</button>
      <button dsToggleGroupItem value="grid">Grid</button>
      <button dsToggleGroupItem value="columns">Columns</button>
    </div>
  `,
})
class Views {}

@Component({
  imports: [DsToggleGroup, DsToggleGroupItem, DsSegmentedControl, DsSegmentedControlItem, DsButton],
  template: `
    <button dsButton data-test="move" (click)="value.set(value() === 'list' ? 'grid' : 'list')">Move every pill</button>
    <div dsToggleGroup type="single" aria-label="First" [(value)]="value">
      <button dsToggleGroupItem value="list">List</button>
      <button dsToggleGroupItem value="grid">Grid</button>
    </div>
    <div dsToggleGroup type="single" aria-label="Second" [(value)]="value">
      <button dsToggleGroupItem value="list">List</button>
      <button dsToggleGroupItem value="grid">Grid</button>
    </div>
    <div dsSegmentedControl aria-label="Third" [(value)]="value">
      <button dsSegmentedControlItem value="list">List</button>
      <button dsSegmentedControlItem value="grid">Grid</button>
    </div>
  `,
})
class Linked {
  readonly value = signal<string>('list');
}

const radio = (root: HTMLElement, name: string) =>
  Array.from(root.querySelectorAll<HTMLElement>('[role="radio"]')).find((el) => el.textContent?.trim() === name)!;

describe('ToggleGroup tab-slide performance fixture', () => {
  it('a press reads every box and color before its first write', async () => {
    const fixture = TestBed.createComponent(Views);
    await settle(fixture);
    const mark = log.length;
    radio(fixture.nativeElement, 'Grid').click();
    await settle(fixture);
    expect(readsThenWrites(since(mark))).toBe(true);
  });

  it('twenty presses across the segments: each one reads before it writes, and the pill lands on the pressed item', async () => {
    const fixture = TestBed.createComponent(Views);
    await settle(fixture);
    const names = ['Grid', 'Columns', 'List'];
    for (let i = 0; i < 20; i++) {
      const name = names[i % 3]!;
      const mark = log.length;
      radio(fixture.nativeElement, name).click();
      await settle(fixture);
      expect(readsThenWrites(since(mark))).toBe(true);
      const on = radio(fixture.nativeElement, name);
      expect(on.getAttribute('data-state')).toBe('on');
      expect(on.querySelector(':scope > span[aria-hidden="true"]:not([data-part])')).not.toBeNull();
    }
  });

  it('two groups and a SegmentedControl that change in one render read together, then write', async () => {
    const fixture = TestBed.createComponent(Linked);
    // Let the frame job of the first paint run, as the browser does between the render and a press.
    await settle(fixture);
    const mark = log.length;
    (fixture.nativeElement.querySelector('[data-test="move"]') as HTMLElement).click();
    await settle(fixture);
    const press = since(mark);
    expect(readsThenWrites(press)).toBe(true);
    // Three slides started, one per list.
    expect(press.filter((e) => e === 'write').length).toBeGreaterThanOrEqual(3);
  });
});
