// Press from touch down (order M5): data-pressed from a primary pointerdown to
// the release, on the Button base (Button, IconButton, CloseButton, the
// FilterBar stand in chip) and on the Switch root. As React's tests for
// order M4 and Switch.drag.test.tsx (order M1).
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsButton } from '../components/button/button';
import { DsCloseButton } from '../components/close-button/close-button';
import { StandInChip } from '../components/filter-bar/stand-in-chip';
import { DsIconButton } from '../components/icon-button/icon-button';
import { DsSwitch } from '../components/switch/switch';
import { trackPressed } from './pressed';

@Component({
  imports: [DsButton, DsIconButton, DsCloseButton, StandInChip, DsSwitch],
  template: `
    <button id="button" dsButton [disabled]="disabled()" [loading]="loading()">Save changes</button>
    <a id="link" dsButton href="/next">Open settings</a>
    <button id="icon" dsIconButton icon="close" label="Close panel"></button>
    <button id="close" dsCloseButton label="Close panel"></button>
    <button id="chip" dsStandInChip [selected]="false">Open now</button>
    <div data-test="switch" dsSwitch label="Wi-Fi" [disabled]="disabled()"></div>
  `,
})
class Host {
  readonly disabled = signal(false);
  readonly loading = signal(false);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el = (id: string) => fixture.nativeElement.querySelector(`#${id}, [data-test="${id}"]`) as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, el, settle };
}

function pointer(target: Element, type: string, extra: { button?: number; primary?: boolean } = {}): void {
  const event = new MouseEvent(type, { bubbles: type !== 'pointerleave', cancelable: true, button: extra.button ?? 0 });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  Object.defineProperty(event, 'isPrimary', { value: extra.primary ?? true });
  target.dispatchEvent(event);
}

describe('data-pressed on the Button base (order M5)', () => {
  for (const id of ['button', 'link', 'icon', 'close', 'chip']) {
    it(`${id}: set on pointerdown, cleared on pointerup`, async () => {
      const { el } = await setup();
      expect(el(id).hasAttribute('data-pressed')).toBe(false);
      pointer(el(id), 'pointerdown');
      expect(el(id).getAttribute('data-pressed')).toBe('');
      pointer(el(id), 'pointerup');
      expect(el(id).hasAttribute('data-pressed')).toBe(false);
    });
  }

  for (const release of ['pointercancel', 'lostpointercapture', 'pointerleave']) {
    it(`cleared on ${release}`, async () => {
      const { el } = await setup();
      pointer(el('button'), 'pointerdown');
      expect(el('button').hasAttribute('data-pressed')).toBe(true);
      pointer(el('button'), release);
      expect(el('button').hasAttribute('data-pressed')).toBe(false);
    });
  }

  it('only for the primary pointer and the main button', async () => {
    const { el } = await setup();
    pointer(el('button'), 'pointerdown', { button: 2 });
    expect(el('button').hasAttribute('data-pressed')).toBe(false);
    pointer(el('button'), 'pointerdown', { primary: false });
    expect(el('button').hasAttribute('data-pressed')).toBe(false);
  });

  it('never while disabled or loading', async () => {
    const { el, host, settle } = await setup();
    host.disabled.set(true);
    await settle();
    pointer(el('button'), 'pointerdown');
    expect(el('button').hasAttribute('data-pressed')).toBe(false);
    host.disabled.set(false);
    host.loading.set(true);
    await settle();
    pointer(el('button'), 'pointerdown');
    expect(el('button').hasAttribute('data-pressed')).toBe(false);
  });

  it('a key press keeps :active alone', async () => {
    const { el } = await setup();
    el('button').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(el('button').hasAttribute('data-pressed')).toBe(false);
  });

  it('trackPressed removes its listeners and the mark', () => {
    const div = document.createElement('div');
    const stop = trackPressed(div, () => false);
    pointer(div, 'pointerdown');
    expect(div.hasAttribute('data-pressed')).toBe(true);
    stop();
    expect(div.hasAttribute('data-pressed')).toBe(false);
    pointer(div, 'pointerdown');
    expect(div.hasAttribute('data-pressed')).toBe(false);
  });
});

describe('data-pressed on the Switch root (order M5)', () => {
  const control = (root: HTMLElement) => root.querySelector('[data-part="control"]') as HTMLButtonElement;

  for (const release of ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave']) {
    it(`set on the root from pointerdown, cleared on ${release}`, async () => {
      const { el } = await setup();
      const c = control(el('switch'));
      pointer(c, 'pointerdown');
      expect(el('switch').getAttribute('data-pressed')).toBe('');
      expect(c.hasAttribute('data-pressed')).toBe(false);
      pointer(c, release);
      expect(el('switch').hasAttribute('data-pressed')).toBe(false);
    });
  }

  it('only for the primary pointer and the main button', async () => {
    const { el } = await setup();
    const c = control(el('switch'));
    pointer(c, 'pointerdown', { button: 2 });
    expect(el('switch').hasAttribute('data-pressed')).toBe(false);
    pointer(c, 'pointerdown', { primary: false });
    expect(el('switch').hasAttribute('data-pressed')).toBe(false);
  });

  it('never while disabled', async () => {
    const { el, host, settle } = await setup();
    host.disabled.set(true);
    await settle();
    pointer(control(el('switch')), 'pointerdown');
    expect(el('switch').hasAttribute('data-pressed')).toBe(false);
  });
});
