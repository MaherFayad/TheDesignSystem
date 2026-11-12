import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import BannerDemo from './banner.demo';
import { DsButton } from '../button/button';
import { DsBanner } from './banner';

@Component({
  imports: [DsBanner, DsButton, DsTheme],
  template: `
    <main id="main"><p>Main</p></main>
    <section id="plain" dsBanner>Boards now open in the new editor.</section>
    <section id="axes" dsBanner tone="danger" emphasis="solid" label="Service status" toneLabel="Outage">Sync is down.</section>
    <section id="by" dsBanner aria-labelledby="h1">Text</section>
    <div dsTheme [lang]="'ar'"><section id="ar" dsBanner tone="info" [onDismiss]="dismiss">نص</section></div>
    <ng-template #acts><button dsButton>Add payment method</button></ng-template>
    <section id="close" dsBanner [actions]="acts" [onDismiss]="dismiss">Trial ends soon.</section>
    <section id="bad" dsBanner returnFocus="[[" [onDismiss]="dismiss">Text</section>
    <p id="target">Target</p>
    <section id="to" dsBanner [returnFocus]="target" [onDismiss]="dismiss">Text</section>
    <div id="scroller" style="overflow-y: auto; scroll-padding-block-start: 4px;">
      @if (showSticky()) {<section id="sticky" dsBanner sticky>Maintenance on Friday.</section>}
    </div>
  `,
})
class Host {
  readonly dismissed = signal(0);
  readonly showSticky = signal(true);
  readonly focusAtDismiss = signal<string | null>(null);
  target: HTMLElement | undefined;
  readonly dismiss = () => {
    this.focusAtDismiss.set(document.activeElement?.id ?? null);
    this.dismissed.update((n) => n + 1);
  };
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement);
  const host = fixture.componentInstance;
  host.target = fixture.nativeElement.querySelector('#target');
  fixture.detectChanges();
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host, q };
}
const parts = (el: Element) => Array.from(el.children).map((c) => c.getAttribute('data-part'));

describe('DsBanner', () => {
  afterEach(() => document.body.replaceChildren());

  it('renders a named region with the anatomy and the default axes', async () => {
    const { q } = await setup();
    const el = q('plain');
    expect(el.tagName).toBe('SECTION');
    expect(el.getAttribute('data-ds')).toBe('banner');
    expect(el.getAttribute('aria-label')).toBe('Announcement');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.getAttribute('data-emphasis')).toBe('soft');
    expect(el.hasAttribute('data-sticky')).toBe(false);
    expect(parts(el)).toEqual(['icon', 'body']);
    expect(el.querySelector('svg')?.getAttribute('aria-label')).toBe('Notice');
  });

  it('sets the axes, a custom label and the tone word; aria-labelledby wins', async () => {
    const { q } = await setup();
    const el = q('axes');
    expect(el.getAttribute('data-tone')).toBe('danger');
    expect(el.getAttribute('data-emphasis')).toBe('solid');
    expect(el.getAttribute('aria-label')).toBe('Service status');
    expect(el.querySelector('svg')?.getAttribute('aria-label')).toBe('Outage');
    for (const n of ['dsbanner', 'tone', 'emphasis', 'label', 'tonelabel']) expect(el.hasAttribute(n)).toBe(false);
    expect(q('by').hasAttribute('aria-label')).toBe(false);
  });

  it('speaks Arabic under an Arabic theme', async () => {
    const { q } = await setup();
    const el = q('ar');
    expect(el.getAttribute('aria-label')).toBe('إعلان');
    expect(el.querySelector('svg')?.getAttribute('aria-label')).toBe('معلومة');
    expect(el.querySelector('[data-part="close"]')?.getAttribute('aria-label')).toBe('إغلاق الإعلان');
  });

  it('moves focus to the main content, then calls onDismiss', async () => {
    const { q, host } = await setup();
    const el = q('close');
    expect(parts(el)).toEqual(['icon', 'body', 'actions', 'close']);
    const close = el.querySelector<HTMLElement>('[data-part="close"]');
    expect(close?.getAttribute('data-ds')).toBe('close-button');
    expect(close?.getAttribute('aria-label')).toBe('Dismiss announcement');
    close?.click();
    expect(host.dismissed()).toBe(1);
    expect(host.focusAtDismiss()).toBe('main');
    expect(q('main').getAttribute('tabindex')).toBe('-1');
  });

  it('still calls onDismiss when the selector is invalid, and returns focus to a given element', async () => {
    const { q, host } = await setup();
    q('bad').querySelector<HTMLElement>('[data-part="close"]')?.click();
    expect(host.dismissed()).toBe(1);
    q('to').querySelector<HTMLElement>('[data-part="close"]')?.click();
    expect(host.focusAtDismiss()).toBe('target');
  });

  it('reserves scroll padding on its scroll container while sticky, and restores it', async () => {
    const { q, host, fixture } = await setup();
    expect(q('sticky').getAttribute('data-sticky')).toBe('');
    const scroller = q('scroller');
    expect(scroller.style.scrollPaddingBlockStart).toBe('0px');
    host.showSticky.set(false);
    await fixture.whenStable();
    expect(scroller.style.scrollPaddingBlockStart).toBe('4px');
  });

  it('renders the demo with every case it applies to', async () => {
    const fixture = TestBed.createComponent(BannerDemo);
    await fixture.whenStable();
    const ids = [...(fixture.nativeElement as HTMLElement).querySelectorAll('[data-demo-case]')].map((c) => c.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic']);
  });
});
