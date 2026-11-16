// Performance fixture for the tab-slide of ToggleGroup (order R0.3).
//
// A press used to read boxes and colors between DOM writes: followIndicator
// started the slide, then playInk read every label again, so one press paid
// for more than one style pass. ToggleGroup now plans in a frame job
// (inFrame) with planFollow and planInk, as Tabs does. These cases log every
// box, style and animation read and every write, and check that all the
// reads of a commit come before its first write, also when two groups and a
// Tabs list change in the same commit.
//
// The Chrome trace at 4x CPU that goes with it is
// docs/reports/reset/R0.3/tab-slide-trace.cjs.
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '../Tabs';
import { ToggleGroup, ToggleGroupItem } from './index';

type Entry = 'read' | 'write';

const log: Entry[] = [];
const saved: { proto: Record<string, unknown>; gcs: typeof window.getComputedStyle } = { proto: {}, gcs: window.getComputedStyle };
const style = document.createElement('style');

/** The index of an element among its parent's element children. */
const indexOf = (el: Element) => Array.from(el.parentElement?.children ?? []).indexOf(el);

beforeEach(() => {
  log.length = 0;
  // Two colors, so the ink has a rest color and an on color to cross between.
  style.textContent = '[data-part="item"] > [data-part="label"] { color: rgb(20, 20, 20); } [data-part="item"][data-state="on"] > [data-part="label"] { color: rgb(250, 250, 250); }';
  document.head.append(style);
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  for (const key of ['animate', 'getAnimations', 'getBoundingClientRect']) saved.proto[key] = proto[key];
  proto.animate = function (this: HTMLElement) {
    log.push('write');
    if (process.env.DBG) console.log('ANIM');
    return { finished: Promise.resolve(), cancel() {}, playState: 'running', effect: null, currentTime: 0 } as unknown as Animation;
  };
  proto.getAnimations = function () {
    log.push('read');
    return [];
  };
  // Each item is 72 by 32 px, 80 px apart; the root and any other box is 300 by 32.
  proto.getBoundingClientRect = function (this: HTMLElement) {
    log.push('read');
    if (process.env.DBG) console.log('READ', new Error().stack?.split('\n').slice(2, 5).map((l) => l.trim().split(' (')[0]).join(' | '));
    const item = this.closest('[data-part="item"], [data-part="trigger"]');
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
      log.push('write');
      if (process.env.DBG) console.log('WRITE', key, (this as Element).outerHTML.slice(0, 80), new Error().stack?.split('\n').slice(2, 6).join(' | '));
      return own.apply(this, args);
    } as never);
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  Object.assign(HTMLElement.prototype, saved.proto);
  style.remove();
});

/**
 * The log from the last press, from its first read on: everything after
 * `mark`. React's own DOM writes of the commit (a panel swapped in) come
 * before the layout effects, so they come before the first read.
 */
function since(mark: number): Entry[] {
  const press = log.slice(mark);
  const first = press.indexOf('read');
  return first < 0 ? [] : press.slice(first);
}

/** True when the press reads, then only writes: one style pass. */
function readsThenWrites(press: Entry[]): boolean {
  const firstWrite = press.indexOf('write');
  return firstWrite > 0 && !press.slice(firstWrite).includes('read');
}

function Views({ name }: { name: string }) {
  return (
    <ToggleGroup type="single" aria-label={name} defaultValue="list">
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      <ToggleGroupItem value="columns">Columns</ToggleGroupItem>
    </ToggleGroup>
  );
}

describe('ToggleGroup tab-slide performance fixture', () => {
  it('a press reads every box and color before its first write', async () => {
    render(<Views name="Board view" />);
    const mark = log.length;
    await userEvent.click(screen.getByRole('radio', { name: 'Grid' }));
    const press = since(mark);
    expect(readsThenWrites(press)).toBe(true);
  });

  it('twenty presses across the segments: each one reads before it writes, and the pill lands on the pressed item', async () => {
    render(<Views name="Board view" />);
    const names = ['Grid', 'Columns', 'List'];
    for (let i = 0; i < 20; i++) {
      const name = names[i % 3]!;
      const mark = log.length;
      await userEvent.click(screen.getByRole('radio', { name }));
      const press = since(mark);
      expect(readsThenWrites(press)).toBe(true);
      const on = screen.getByRole('radio', { name });
      expect(on.getAttribute('data-state')).toBe('on');
      expect(on.querySelector(':scope > span[aria-hidden="true"]:not([data-part])')).not.toBeNull();
    }
  });

  it('two groups and a Tabs list that change in one commit read together, then write', async () => {
    function Linked() {
      const [value, setValue] = useState('list');
      return (
        <>
          <button type="button" onClick={() => setValue((v) => (v === 'list' ? 'grid' : 'list'))}>
            Move every pill
          </button>
          <ToggleGroup type="single" aria-label="First" value={value} onValueChange={(v) => v && setValue(v)}>
            <ToggleGroupItem value="list">List</ToggleGroupItem>
            <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup type="single" aria-label="Second" value={value} onValueChange={(v) => v && setValue(v)}>
            <ToggleGroupItem value="list">List</ToggleGroupItem>
            <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
          </ToggleGroup>
          <Tabs value={value} onValueChange={setValue}>
            <TabsList aria-label="Third">
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="grid">Grid</TabsTrigger>
            </TabsList>
            <TabsPanel value="list">Rows</TabsPanel>
            <TabsPanel value="grid">Cards</TabsPanel>
          </Tabs>
        </>
      );
    }
    render(<Linked />);
    const mark = log.length;
    if (process.env.DBG) console.log('MARK');
    await act(async () => {
      screen.getByRole('button', { name: 'Move every pill' }).click();
    });
    console.log('PRESS', since(mark).join(' '), new Error().stack ? '' : '');
    const press = since(mark);
    expect(readsThenWrites(press)).toBe(true);
    // Three slides started, one per list.
    expect(press.filter((e) => e === 'write').length).toBeGreaterThanOrEqual(3);
  });
});
