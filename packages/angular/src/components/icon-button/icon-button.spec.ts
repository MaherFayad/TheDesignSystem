import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsIconButton } from './icon-button';

@Component({
  imports: [DsIconButton],
  template: `
    <button id="close" dsIconButton icon="close" label="Close panel"></button>
    <button id="busy" dsIconButton icon="upload" label="Upload file" tone="accent" emphasis="solid" [loading]="true" (click)="clicks.set(clicks() + 1)"></button>
  `,
})
class Host {
  readonly clicks = signal(0);
}

describe('DsIconButton', () => {
  it('is an icon-button root named by its label, ghost by default', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement.querySelector('#close') as HTMLElement;
    expect(el.getAttribute('data-ds')).toBe('icon-button');
    expect(el.getAttribute('aria-label')).toBe('Close panel');
    expect(el.getAttribute('data-emphasis')).toBe('ghost');
    expect(el.hasAttribute('label')).toBe(false);
    expect(el.hasAttribute('icon')).toBe(false);
    const icon = el.querySelector('[data-part="icon"] > svg');
    expect(icon?.getAttribute('data-icon')).toBe('close');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('loading blocks clicks and adds the status part', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement.querySelector('#busy') as HTMLElement;
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['icon', 'spinner', 'status', 'hit']);
    el.click();
    expect(fixture.componentInstance.clicks()).toBe(0);
  });
});
