// Order 1.23 (interaction round 3) of DropdownMenu, as React's menuShared.tsx
// and ListBox/highlightMarker.tsx: one highlight marker per menu (its last
// child), the exit copy of review B6 and the drawn check of a checkbox item
// checked while the menu is open. jsdom has no Web Animations API, so
// Element.animate records each call; the stubs are restored by descriptor on
// Element, HTMLElement and SVGElement.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readDuration } from '@the-system/motion';
import { injectMotion } from '../../internal/motion';
import { CHECK_DRAW_ID, drawCheck } from '../../internal/selection-marker';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DS_DROPDOWN_MENU } from './dropdown-menu';

interface Call {
  el: Element;
  frames: Keyframe[];
  opts: KeyframeAnimationOptions;
}

let calls: Call[] = [];
const take = (): Call[] => {
  const out = calls;
  calls = [];
  return out;
};

const PROTOS = [Element.prototype, HTMLElement.prototype, SVGElement.prototype];
const NAMES = ['animate', 'getAnimations'] as const;
const saved = new Map<string, PropertyDescriptor | undefined>();
/** What getAnimations returns for an inert copy: one running exit, finished on demand. */
let finishExit: () => void = () => undefined;

beforeEach(() => {
  calls = [];
  const exit = new Promise<void>((resolve) => (finishExit = resolve));
  const record = vi.fn(function (this: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
    calls.push({ el: this, frames, opts });
    return { id: String(opts?.id ?? ''), finished: new Promise(() => undefined), cancel: vi.fn(), playState: 'running' } as unknown as Animation;
  });
  const running = function (this: Element): Animation[] {
    return this.hasAttribute('inert') ? [{ finished: exit, playState: 'running' } as unknown as Animation] : [];
  };
  PROTOS.forEach((proto, i) => {
    for (const name of NAMES) {
      saved.set(`${i}:${name}`, Object.getOwnPropertyDescriptor(proto, name));
      Object.defineProperty(proto, name, { configurable: true, writable: true, value: name === 'animate' ? record : running });
    }
  });
});

afterEach(() => {
  PROTOS.forEach((proto, i) => {
    for (const name of NAMES) {
      const before = saved.get(`${i}:${name}`);
      if (before) Object.defineProperty(proto, name, before);
      else Reflect.deleteProperty(proto, name);
    }
  });
  document.documentElement.removeAttribute('data-motion');
  vi.restoreAllMocks();
  for (const el of Array.from(document.body.children)) el.remove();
});

@Component({
  imports: [DsButton, DsTheme, ...DS_DROPDOWN_MENU],
  template: `
    <div dsTheme="neutral" [lang]="'en'">
      <ng-container dsDropdownMenu [(open)]="open">
        <button id="trigger" dsButton dsDropdownMenuTrigger>Open menu</button>
        <ng-template dsDropdownMenuContent>
          <div id="rename" dsDropdownMenuItem start="edit">Rename board</div>
          <div id="duplicate" dsDropdownMenuItem start="copy">Duplicate board</div>
          <div id="grid" dsDropdownMenuCheckboxItem [(checked)]="grid" (select)="$event.preventDefault()">Show grid</div>
          <div id="rulers" dsDropdownMenuCheckboxItem [(checked)]="rulers">Show rulers</div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
class Host {
  readonly open = signal<boolean | undefined>(undefined);
  readonly grid = signal(false);
  readonly rulers = signal(true);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  document.body.append(fixture.nativeElement);
  await fixture.whenStable();
  const byId = (id: string) => document.getElementById(id) as HTMLElement;
  const settle = async () => {
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();
  };
  const press = async (key: string, target: Element | null = document.activeElement) => {
    target?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    await settle();
  };
  const real = () => Array.from(document.querySelectorAll<HTMLElement>('[data-ds="dropdown-menu"]:not([inert])'));
  const copies = () => Array.from(document.querySelectorAll<HTMLElement>('[data-ds="dropdown-menu"][inert]'));
  const motion = TestBed.runInInjectionContext(() => injectMotion());
  return { fixture, host: fixture.componentInstance, byId, press, settle, real, copies, motion };
}

/** A row box by its top, in CSS px, as the drawn boxes the marker falls back to in jsdom. */
const at = (el: HTMLElement, top: number) => {
  el.getBoundingClientRect = () => DOMRect.fromRect({ x: 4, y: top, width: 200, height: 28 });
};

describe('dropdown menu, order 1.23', () => {
  it('highlight-marker: the menu holds one aria-hidden marker as its last child', async () => {
    const { byId, press, real } = await setup();
    byId('trigger').focus();
    await press('Enter');
    const [menu] = real();
    const marker = menu!.lastElementChild as HTMLElement;
    expect(marker.tagName).toBe('SPAN');
    expect(marker.getAttribute('data-part')).toBe('highlight');
    expect(marker.getAttribute('aria-hidden')).toBe('true');
    expect(menu!.querySelectorAll("[data-part='highlight']")).toHaveLength(1);
  });

  it('highlight-marker: jumps to the first lit row, then slides over duration.fast for the keys', async () => {
    const { byId, press, real } = await setup();
    byId('trigger').focus();
    await press('Enter');
    const [menu] = real();
    const marker = menu!.lastElementChild as HTMLElement;
    // The first row is lit on open: the marker shows there with no motion.
    expect(marker.style.opacity).toBe('1');
    at(byId('rename'), 30);
    at(byId('duplicate'), 58);
    await press('ArrowDown');
    expect(document.activeElement).toBe(byId('duplicate'));
    expect(marker.style.transform).toBe('translate(4px, 58px)');
    expect(marker.style.inlineSize).toBe('200px');
    expect(marker.style.blockSize).toBe('28px');
    expect(marker.style.transitionDuration).toBe(`${readDuration(marker, 'duration.fast')}ms`);
  });

  it('exit copy (review B6): the real menu leaves at once, an inert aria-hidden copy plays the exit, a press reopens at once', async () => {
    const { byId, press, settle, real, copies } = await setup();
    const drawn = Element.prototype.getBoundingClientRect;
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      return this.getAttribute('role') === 'menu' ? DOMRect.fromRect({ x: 0, y: 0, width: 220, height: 120 }) : drawn.call(this);
    });
    byId('trigger').focus();
    await press('Enter');
    expect(real()).toHaveLength(1);
    await press('Escape');
    expect(real()).toHaveLength(0);
    const [copy] = copies();
    expect(copy).toBeDefined();
    expect(copy!.getAttribute('aria-hidden')).toBe('true');
    expect(copy!.getAttribute('data-state')).toBe('closed');
    expect(copy!.querySelectorAll('[id]')).toHaveLength(0);
    expect(copy!.hasAttribute('id')).toBe(false);
    expect(copy!.closest('[data-menu-layer]')).not.toBeNull();
    // A press during the exit opens a new menu at once, beside the copy.
    byId('trigger').focus();
    await press('Enter');
    expect(real()).toHaveLength(1);
    expect(real()[0]!.getAttribute('data-state')).toBe('open');
    expect(copies()).toHaveLength(1);
    finishExit();
    await settle();
    expect(copies()).toHaveLength(0);
  });

  it('exit copy: none under reduced motion (no exit animation runs)', async () => {
    document.documentElement.setAttribute('data-motion', 'reduce');
    const { byId, press, real, copies } = await setup();
    byId('trigger').focus();
    await press('Enter');
    // Under reduced motion the CSS plays nothing: getAnimations is empty for every element.
    for (const proto of PROTOS) Object.defineProperty(proto, 'getAnimations', { configurable: true, writable: true, value: () => [] });
    await press('Escape');
    expect(real()).toHaveLength(0);
    expect(copies()).toHaveLength(0);
  });

  for (const reduced of [false, true]) {
    it(`check-draw-pick: a check that appears while the menu is open draws, with React's arguments${reduced ? ' (reduced)' : ''}`, async () => {
      if (reduced) document.documentElement.setAttribute('data-motion', 'reduce');
      const { byId, press, host, motion } = await setup();
      byId('trigger').focus();
      await press('Enter');
      // Calls from the open are dropped: the pick is what is checked here.
      take();
      byId('grid').focus();
      await press('Enter');
      expect(host.grid()).toBe(true);
      const svg = byId('grid').querySelector("[data-part='indicator'] svg")!;
      const got = take().filter((c) => svg === c.el || svg.contains(c.el));
      expect(got.length).toBeGreaterThan(0);
      drawCheck(svg, motion.mode(CHECK_DRAW_ID));
      expect(got).toEqual(take());
      if (reduced) expect(got.map((c) => c.frames)).toEqual([[{ opacity: 0 }, { opacity: 1 }]]);
      else expect(got.at(-1)!.frames).toEqual([{ transform: 'scale(0.6)' }, { transform: 'none' }]);
    });
  }

  it('check-draw-pick: not when the check is there as the menu opens while it animates', async () => {
    const { byId, press } = await setup();
    // The menu runs its enter animation.
    for (const proto of PROTOS)
      Object.defineProperty(proto, 'getAnimations', {
        configurable: true,
        writable: true,
        value: function (this: Element) {
          return this.getAttribute('role') === 'menu' ? [{ playState: 'running', finished: new Promise(() => undefined) }] : [];
        },
      });
    byId('trigger').focus();
    await press('Enter');
    const svg = byId('rulers').querySelector("[data-part='indicator'] svg")!;
    expect(take().filter((c) => svg === c.el || svg.contains(c.el))).toEqual([]);
  });
});
