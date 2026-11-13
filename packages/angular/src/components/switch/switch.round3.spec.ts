// Order 1.23: the thumb parts and the drag (switch-drag), as
// packages/react/src/components/Switch/Switch.drag.test.tsx.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { snapChecked, switchRubberBand } from '@the-system/motion';
import { DsSwitch } from './switch';

@Component({
  imports: [DsSwitch, ReactiveFormsModule],
  template: `
    <div data-test="plain" dsSwitch label="Wi-Fi" (checkedChange)="changes.push($event)"></div>
    <div data-test="on" dsSwitch label="Wi-Fi" defaultChecked (checkedChange)="changes.push($event)"></div>
    <div data-test="icon" dsSwitch label="Wi-Fi" [thumbIcon]="icon()"></div>
    <div data-test="readonly" dsSwitch label="Wi-Fi" readOnly></div>
    <div data-test="reactive" dsSwitch label="News" [formControl]="news"></div>
  `,
})
class Host {
  readonly icon = signal(false);
  readonly changes: (boolean | undefined)[] = [];
  readonly news = new FormControl(false, { nonNullable: true });
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
  const control = (id: string) => root(id).querySelector('[data-part="control"]') as HTMLButtonElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, root, control, settle };
}

let stamp = 0;
function pointer(target: Element, type: string, clientX: number, extra: { button?: number; time?: number } = {}): void {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, button: extra.button ?? 0 });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  Object.defineProperty(event, 'isPrimary', { value: true });
  stamp = extra.time ?? stamp + 16;
  Object.defineProperty(event, 'timeStamp', { value: stamp });
  target.dispatchEvent(event);
}

describe('Switch round 3 anatomy', () => {
  it('puts the aria-hidden thumb-lens part inside the thumb', async () => {
    const { root } = await setup();
    const lens = root('plain').querySelector('[data-part="thumb"] > [data-part="thumb-lens"]');
    expect(lens?.tagName).toBe('SPAN');
    expect(lens?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders no thumb icon by default, and an aria-hidden check and cross with thumbIcon', async () => {
    const { root, host, settle } = await setup();
    expect(root('icon').querySelector('[data-part="thumb-icon"]')).toBeNull();
    host.icon.set(true);
    await settle();
    const icon = root('icon').querySelector('[data-part="thumb"] > [data-part="thumb-lens"] + [data-part="thumb-icon"]');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(icon?.getAttribute('focusable')).toBe('false');
    expect(icon?.getAttribute('viewBox')).toBe('0 0 16 16');
    const paths = icon?.querySelectorAll('path') ?? [];
    expect(paths).toHaveLength(2);
    expect(paths[0]?.getAttribute('pathLength')).toBe('1');
    expect(paths[1]?.hasAttribute('pathLength')).toBe(false);
    expect(root('icon').hasAttribute('thumbIcon')).toBe(false);
  });
});

describe('switch-drag math', () => {
  it('damps the thumb past either end', () => {
    expect(switchRubberBand(0.4)).toBe(0.4);
    expect(switchRubberBand(1.2)).toBeCloseTo(1.06);
    expect(switchRubberBand(3)).toBeCloseTo(1.12);
    expect(switchRubberBand(-0.2)).toBeCloseTo(-0.06);
  });

  it('snaps by velocity first, else by the nearer end', () => {
    expect(snapChecked(0.3, 0.02)).toBe(true);
    expect(snapChecked(0.8, -0.02)).toBe(false);
    expect(snapChecked(0.6, 0)).toBe(true);
    expect(snapChecked(0.4, 0.001)).toBe(false);
  });
});

describe('switch-drag on the control', () => {
  // jsdom has no layout: the track is 44px with a 20px thumb and no padding, so the travel is 24px.
  // Stubs are restored by descriptor, so no own property is left behind on a prototype.
  const saved: [object, string, PropertyDescriptor | undefined][] = [];
  const stub = (proto: object, key: string, desc: PropertyDescriptor) => {
    saved.push([proto, key, Object.getOwnPropertyDescriptor(proto, key)]);
    Object.defineProperty(proto, key, { configurable: true, ...desc });
  };
  beforeEach(() => {
    stub(HTMLElement.prototype, 'offsetWidth', {
      get(this: HTMLElement) {
        return this.getAttribute('data-part') === 'thumb' ? 20 : 44;
      },
    });
    stub(Element.prototype, 'clientWidth', { get: () => 44 });
    stub(Element.prototype, 'getBoundingClientRect', {
      value: () => ({ x: 0, y: 0, left: 0, top: 0, width: 44, height: 24, right: 44, bottom: 24, toJSON: () => ({}) }),
      writable: true,
    });
    stub(Element.prototype, 'setPointerCapture', { value: () => {}, writable: true });
  });
  afterEach(() => {
    for (const [proto, key, desc] of saved.reverse()) {
      if (desc) Object.defineProperty(proto, key, desc);
      else delete (proto as Record<string, unknown>)[key];
    }
    saved.length = 0;
  });

  it('follows the pointer while dragging, then snaps on and toggles once', async () => {
    const { root, control, host, settle } = await setup();
    const c = control('plain');
    pointer(c, 'pointerdown', 10, { time: 1000 });
    pointer(c, 'pointermove', 18);
    await settle();
    expect(root('plain').hasAttribute('data-dragging')).toBe(true);
    expect(Number(root('plain').style.getPropertyValue('--_switch-drag-progress'))).toBeCloseTo(8 / 24);
    pointer(c, 'pointermove', 26);
    pointer(c, 'pointerup', 26);
    c.click();
    await settle();
    expect(root('plain').hasAttribute('data-dragging')).toBe(false);
    expect(root('plain').style.getPropertyValue('--_switch-drag-progress')).toBe('');
    expect(c.getAttribute('aria-checked')).toBe('true');
    expect(host.changes).toEqual([true]);
  });

  // Order 1.29 (B4 and N1), as React's Switch.drag.test.tsx.
  it('while dragging the root shows the side the thumb is on; the control keeps aria-checked (B4)', async () => {
    const { root, control, settle } = await setup();
    const c = control('plain');
    pointer(c, 'pointerdown', 10, { time: 3000 });
    pointer(c, 'pointermove', 18);
    await settle();
    expect(root('plain').getAttribute('data-state')).toBe('unchecked');
    pointer(c, 'pointermove', 24);
    await settle();
    // Past the middle (14 of 24): the root steps to checked; the control still says what it is.
    expect(root('plain').getAttribute('data-state')).toBe('checked');
    expect(c.getAttribute('aria-checked')).toBe('false');
    expect(c.getAttribute('data-state')).toBe('unchecked');
    pointer(c, 'pointermove', 12);
    await settle();
    expect(root('plain').getAttribute('data-state')).toBe('unchecked');
    pointer(c, 'pointercancel', 12);
    await settle();
    expect(root('plain').getAttribute('data-state')).toBe('unchecked');
  });

  it('a release marks the root data-released until the next press or key (N1)', async () => {
    const { root, control } = await setup();
    const c = control('plain');
    pointer(c, 'pointerdown', 10, { time: 4000 });
    expect(root('plain').hasAttribute('data-released')).toBe(false);
    pointer(c, 'pointerup', 10);
    expect(root('plain').hasAttribute('data-released')).toBe(true);
    pointer(c, 'pointerdown', 10, { time: 4100 });
    expect(root('plain').hasAttribute('data-released')).toBe(false);
    pointer(c, 'pointerup', 10);
    c.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(root('plain').hasAttribute('data-released')).toBe(false);
  });

  it('rubber bands past the end, at most 12 percent of the travel', async () => {
    const { root, control } = await setup();
    const c = control('plain');
    pointer(c, 'pointerdown', 10, { time: 2000 });
    pointer(c, 'pointermove', 100);
    expect(Number(root('plain').style.getPropertyValue('--_switch-drag-progress'))).toBeCloseTo(1.12);
    pointer(c, 'pointercancel', 100);
    expect(root('plain').style.getPropertyValue('--_switch-drag-progress')).toBe('');
  });

  it('springs back when let go short of half, and the click after the drag toggles nothing', async () => {
    const { control, host, settle } = await setup();
    const c = control('on');
    pointer(c, 'pointerdown', 30, { time: 3000 });
    pointer(c, 'pointermove', 24);
    // The pointer rests before the release, so there is no flick.
    pointer(c, 'pointermove', 24);
    pointer(c, 'pointerup', 24);
    c.click();
    await settle();
    expect(c.getAttribute('aria-checked')).toBe('true');
    expect(host.changes).toEqual([]);
  });

  it('a flick goes its way even short of half', async () => {
    const { control, host, settle } = await setup();
    const c = control('plain');
    pointer(c, 'pointerdown', 10, { time: 4000 });
    pointer(c, 'pointermove', 14, { time: 4010 });
    // 4px of 24 in 10ms: 0.0167 travels a ms.
    pointer(c, 'pointermove', 18, { time: 4020 });
    pointer(c, 'pointerup', 18, { time: 4025 });
    c.click();
    await settle();
    expect(c.getAttribute('aria-checked')).toBe('true');
    expect(host.changes).toEqual([true]);
  });

  it('a tap under the slop still toggles through the click, and keys still toggle', async () => {
    const { control, host, settle } = await setup();
    const c = control('plain');
    pointer(c, 'pointerdown', 10, { time: 5000 });
    pointer(c, 'pointermove', 11);
    pointer(c, 'pointerup', 11);
    c.click();
    await settle();
    expect(c.getAttribute('aria-checked')).toBe('true');
    // Space and Enter on a button are clicks.
    c.click();
    await settle();
    expect(c.getAttribute('aria-checked')).toBe('false');
    expect(host.changes).toEqual([true, false]);
  });

  it('does not drag while read only', async () => {
    const { root, control, settle } = await setup();
    const c = control('readonly');
    pointer(c, 'pointerdown', 10, { time: 6000 });
    pointer(c, 'pointermove', 30);
    pointer(c, 'pointerup', 30);
    c.click();
    await settle();
    expect(root('readonly').hasAttribute('data-dragging')).toBe(false);
    expect(c.getAttribute('aria-checked')).toBe('false');
  });

  it('a drag in a reactive form sets the value once and marks touched on blur', async () => {
    const { control, host, settle } = await setup();
    const c = control('reactive');
    const seen: boolean[] = [];
    host.news.valueChanges.subscribe((v) => seen.push(v));
    c.focus();
    pointer(c, 'pointerdown', 10, { time: 7000 });
    pointer(c, 'pointermove', 20);
    pointer(c, 'pointermove', 30);
    pointer(c, 'pointerup', 30);
    c.click();
    await settle();
    expect(host.news.value).toBe(true);
    expect(seen).toEqual([true]);
    expect(host.news.touched).toBe(false);
    c.blur();
    expect(host.news.touched).toBe(true);
  });
});
