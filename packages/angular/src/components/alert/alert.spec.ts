import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import AlertDemo from './alert.demo';
import { DsButton } from '../button/button';
import { DsAlert } from './alert';

@Component({
  imports: [DsAlert, DsButton, DsTheme],
  template: `
    <div id="plain" dsAlert title="Board shared">Everyone can comment.</div>
    <div id="axes" dsAlert tone="danger" emphasis="solid" size="sm" title="Could not sync" aria-atomic="false"></div>
    <div id="live" dsAlert live tone="danger" title="Could not sync"></div>
    <div id="status" dsAlert live tone="info" title="Sync paused"></div>
    <div dsTheme [lang]="'ar'"><div id="ar" dsAlert tone="warning" title="المساحة" [onClose]="close"></div></div>
    <div id="word" dsAlert tone="warning" toneLabel="Heads up" title="Storage"></div>
    <ng-template #mark><span>!</span></ng-template>
    <div id="node" dsAlert tone="danger" [icon]="mark" title="Error"></div>
    <ng-template #acts><button id="act" dsButton>Retry sync</button></ng-template>
    <div id="close" dsAlert title="Sync paused" [actions]="acts" [onClose]="close">
      @if (body()) {<p>Body text</p>}
    </div>
  `,
})
class Host {
  readonly closed = signal(0);
  readonly body = signal(false);
  readonly close = () => this.closed.update((n) => n + 1);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}
const parts = (el: Element) => Array.from(el.children).map((c) => c.getAttribute('data-part'));

describe('DsAlert', () => {
  it('renders the anatomy with the default axes and no live role', async () => {
    const { q } = await setup();
    const el = q('plain');
    expect(el.getAttribute('data-ds')).toBe('alert');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.getAttribute('data-emphasis')).toBe('soft');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('title')).toBe(false);
    expect(parts(el)).toEqual(['icon', 'title', 'body']);
    expect(el.querySelector('[data-part="title"]')?.textContent).toBe('Board shared');
    expect(el.querySelector('[data-part="body"]')?.textContent?.trim()).toBe('Everyone can comment.');
  });

  it('sets the axes, leaves out an empty body, and keeps a caller aria-atomic', async () => {
    const { q } = await setup();
    const el = q('axes');
    expect(el.getAttribute('data-tone')).toBe('danger');
    expect(el.getAttribute('data-emphasis')).toBe('solid');
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(parts(el)).toEqual(['icon', 'title']);
    expect(el.getAttribute('aria-atomic')).toBe('false');
    for (const n of ['dsalert', 'tone', 'emphasis', 'size']) expect(el.hasAttribute(n)).toBe(false);
  });

  it('names the tone through the icon, in Arabic under an Arabic theme, and takes a custom word', async () => {
    const { q } = await setup();
    const svg = q('plain').querySelector('[data-part="icon"] svg');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('Notice');
    expect(q('ar').querySelector('[data-part="icon"] svg')?.getAttribute('aria-label')).toBe('تنبيه');
    expect(q('ar').querySelector('[data-part="close"]')?.getAttribute('aria-label')).toBe('إغلاق الرسالة');
    expect(q('word').querySelector('[data-part="icon"] svg')?.getAttribute('aria-label')).toBe('Heads up');
  });

  it('puts the tone word on the icon part when a template replaces the icon', async () => {
    const { q } = await setup();
    const part = q('node').querySelector('[data-part="icon"]');
    expect(part?.getAttribute('role')).toBe('img');
    expect(part?.getAttribute('aria-label')).toBe('Error');
    expect(part?.textContent).toBe('!');
  });

  it('uses role alert for a live danger alert and role status for the other tones', async () => {
    const { q } = await setup();
    expect(q('live').getAttribute('role')).toBe('alert');
    expect(q('live').hasAttribute('aria-atomic')).toBe(false);
    expect(q('status').getAttribute('role')).toBe('status');
    expect(q('status').getAttribute('aria-atomic')).toBe('true');
  });

  it('renders the actions and a close button that calls onClose', async () => {
    const { q, host } = await setup();
    const el = q('close');
    expect(parts(el)).toEqual(['icon', 'title', 'actions', 'close']);
    const close = el.querySelector<HTMLElement>('[data-part="close"]');
    expect(close?.getAttribute('data-ds')).toBe('close-button');
    expect(close?.getAttribute('data-size')).toBe('xs');
    expect(close?.getAttribute('aria-label')).toBe('Dismiss alert');
    close?.click();
    expect(host.closed()).toBe(1);
  });

  it('brings the body part back when projected content appears', async () => {
    const { q, host, fixture } = await setup();
    host.body.set(true);
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r));
    expect(parts(q('close'))).toEqual(['icon', 'title', 'body', 'actions', 'close']);
  });

  it('renders the demo with every case it applies to', async () => {
    const fixture = TestBed.createComponent(AlertDemo);
    await fixture.whenStable();
    const ids = [...(fixture.nativeElement as HTMLElement).querySelectorAll('[data-demo-case]')].map((c) => c.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error']);
  });
});
