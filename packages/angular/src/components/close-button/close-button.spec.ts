import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsCloseButton } from './close-button';

@Component({
  imports: [DsCloseButton, DsTheme],
  template: `
    <button id="plain" dsCloseButton></button>
    <button id="named" dsCloseButton label="Close panel" size="sm" shape="pill"></button>
    <div dsTheme [lang]="'ar'"><button id="ar" dsCloseButton></button></div>
    <button id="disabled" dsCloseButton disabled></button>
  `,
})
class Host {}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  return (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
}

describe('DsCloseButton', () => {
  it('is a neutral ghost button named Close with the close icon', async () => {
    const q = await setup();
    const el = q('plain');
    expect(el.getAttribute('data-ds')).toBe('close-button');
    expect(el.getAttribute('aria-label')).toBe('Close');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.getAttribute('data-emphasis')).toBe('ghost');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.querySelector('[data-part="icon"] svg')?.getAttribute('data-icon')).toBe('close');
  });

  it('takes a label, size and shape', async () => {
    const q = await setup();
    const el = q('named');
    expect(el.getAttribute('aria-label')).toBe('Close panel');
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.getAttribute('data-shape')).toBe('pill');
    expect(el.hasAttribute('label')).toBe(false);
  });

  it('follows an Arabic dsTheme', async () => {
    const q = await setup();
    expect(q('ar').getAttribute('aria-label')).toBe('إغلاق');
  });

  it('disabled keeps focus with aria-disabled', async () => {
    const q = await setup();
    const el = q('disabled');
    expect(el.hasAttribute('disabled')).toBe(false);
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('data-disabled')).toBe('');
  });
});
