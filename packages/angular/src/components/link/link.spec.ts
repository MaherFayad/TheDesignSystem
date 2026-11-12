import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsLink } from './link';

@Component({
  imports: [DsLink, DsTheme],
  template: `
    <a id="plain" dsLink href="#docs">Read the docs</a>
    <a id="ext" dsLink href="https://example.com" external tone="accent" size="sm" standalone>Open the site</a>
    <a id="disabled" dsLink href="#report" disabled (click)="clicks.set(clicks() + 1)">Download the report</a>
    <div dsTheme [lang]="'ar'"><a id="ar" dsLink href="https://example.com" external>الدليل</a></div>
  `,
})
class Host {
  readonly clicks = signal(0);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

describe('DsLink', () => {
  it('renders the React DOM for a plain link', async () => {
    const { q } = await setup();
    const el = q('plain');
    expect(el.getAttribute('data-ds')).toBe('link');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.getAttribute('href')).toBe('#docs');
    for (const absent of ['data-size', 'target', 'rel', 'role', 'tabindex', 'dslink', 'aria-disabled']) {
      expect(el.hasAttribute(absent)).toBe(false);
    }
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['label']);
  });

  it('external opens a new tab and says so', async () => {
    const { q } = await setup();
    const el = q('ext');
    expect(el.getAttribute('target')).toBe('_blank');
    expect(el.getAttribute('rel')).toBe('noopener noreferrer');
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.getAttribute('data-standalone')).toBe('');
    expect(el.querySelector('[data-part="end"] svg')?.getAttribute('data-icon')).toBe('external');
    expect(el.querySelector('[data-part="end"] > span')?.textContent).toBe(', opens in a new tab');
  });

  it('disabled drops the href, keeps role link and a tab stop, and blocks clicks', async () => {
    const { fixture, host, q } = await setup();
    const el = q('disabled');
    expect(el.hasAttribute('href')).toBe(false);
    expect(el.getAttribute('role')).toBe('link');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.getAttribute('aria-disabled')).toBe('true');
    el.click();
    await fixture.whenStable();
    expect(host.clicks()).toBe(0);
  });

  it('says the hidden words in Arabic under an Arabic dsTheme', async () => {
    const { q } = await setup();
    expect(q('ar').querySelector('[data-part="end"] > span')?.textContent).toBe('، يفتح في تبويب جديد');
  });
});
