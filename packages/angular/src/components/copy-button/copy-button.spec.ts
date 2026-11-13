import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsCopyButton } from './copy-button';

@Component({
  imports: [DsCopyButton, DsTheme],
  template: `
    <button id="plain" dsCopyButton value="npx the-system add button" (copied)="copied.set($event)" (copyFailed)="failed.set($event)"></button>
    <button id="icon" dsCopyButton value="board_42" iconOnly label="Copy board id"></button>
    <button id="cancel" dsCopyButton value="x" (click)="$event.preventDefault()"></button>
    <button id="disabled" dsCopyButton value="x" disabled (copied)="copied.set($event)"></button>
    <div dsTheme [lang]="'ar'"><button id="ar" dsCopyButton value="x"></button></div>
  `,
})
class Host {
  readonly copied = signal<string | undefined>(undefined);
  readonly failed = signal<string | undefined>(undefined);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

function mockClipboard(writeText: (t: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

describe('DsCopyButton', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('renders idle: ghost, the copy icon, the label and an empty status', async () => {
    const { q } = await setup();
    const el = q('plain');
    expect(el.getAttribute('data-ds')).toBe('copy-button');
    expect(el.getAttribute('data-state')).toBe('idle');
    expect(el.getAttribute('data-emphasis')).toBe('ghost');
    expect(el.hasAttribute('value')).toBe(false);
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['icon', 'label', 'status']);
    const glyphs = Array.from(el.querySelectorAll('[data-part="icon"] > [data-copy-glyph]'));
    expect(glyphs.map((g) => g.getAttribute('data-copy-glyph'))).toEqual(['idle', 'copied', 'failed']);
    expect(glyphs.map((g) => g.querySelector('[data-ds="icon"]')?.getAttribute('data-icon'))).toEqual(['copy', 'check', 'warning']);
    // Every word sits in the label, so the width is the widest; only the idle word is read.
    const words = Array.from(el.querySelectorAll('[data-part="label"] > [data-copy-label]'));
    expect(words.map((w) => w.textContent)).toEqual(['Copy', 'Copied', 'Could not copy']);
    expect(words.map((w) => w.getAttribute('aria-hidden'))).toEqual([null, 'true', 'true']);
    expect(words.some((w) => w.hasAttribute('data-roll'))).toBe(false);
    expect(el.querySelector('[data-part="bubble"]')).toBeNull();
    expect(el.getAttribute('aria-label')).toBe('Copy');
    expect(el.querySelector('[data-part="status"]')?.textContent).toBe('');
  });

  it('iconOnly moves the label to aria-label', async () => {
    const { q } = await setup();
    const el = q('icon');
    expect(el.getAttribute('aria-label')).toBe('Copy board id');
    expect(el.querySelector('[data-part="label"]')).toBeNull();
  });

  it('copies, says Copied and emits the value', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    mockClipboard(writeText);
    const { fixture, host, q } = await setup();
    const el = q('plain');
    el.click();
    await flush();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith('npx the-system add button');
    expect(host.copied()).toBe('npx the-system add button');
    expect(el.getAttribute('data-state')).toBe('copied');
    expect(el.querySelector('[data-part="status"]')?.textContent).toBe('Copied');
    expect(el.querySelector('[data-copy-label="copied"]')?.hasAttribute('data-roll')).toBe(true);
  });

  it('a failed copy says so and emits copyFailed', async () => {
    mockClipboard(() => Promise.reject(new Error('denied')));
    const { fixture, host, q } = await setup();
    const el = q('plain');
    el.click();
    await flush();
    await fixture.whenStable();
    expect(host.failed()).toBe('npx the-system add button');
    expect(el.getAttribute('data-state')).toBe('failed');
    expect(el.querySelector('[data-part="status"]')?.textContent).toBe('Could not copy');
  });

  it('a caller click with preventDefault cancels the copy', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    mockClipboard(writeText);
    const { fixture, q } = await setup();
    q('cancel').click();
    await flush();
    await fixture.whenStable();
    expect(writeText).not.toHaveBeenCalled();
  });

  it('starts the clipboard write inside the click, with no microtask wait', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    mockClipboard(writeText);
    const { q } = await setup();
    q('plain').click();
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it('disabled does not copy', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    mockClipboard(writeText);
    const { fixture, host, q } = await setup();
    q('disabled').click();
    await flush();
    await fixture.whenStable();
    expect(writeText).not.toHaveBeenCalled();
    expect(host.copied()).toBeUndefined();
  });

  it('uses the Arabic words under an Arabic dsTheme', async () => {
    const { q } = await setup();
    expect(q('ar').querySelector('[data-copy-label="idle"]')?.textContent).toBe('نسخ');
    expect(q('ar').getAttribute('aria-label')).toBe('نسخ');
  });
});
