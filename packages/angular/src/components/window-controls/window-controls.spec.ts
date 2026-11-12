import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsWindowControls } from './window-controls';

@Component({
  imports: [DsWindowControls, DsTheme],
  template: `
    <div id="en" dsWindowControls [onClose]="close"></div>
    <div id="own" dsWindowControls label="Report controls" closeLabel="Close report"></div>
    <div dsTheme [lang]="'ar-SA'"><div id="ar" dsWindowControls [onClose]="close"></div></div>
  `,
})
class Host {
  readonly close = () => undefined;
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const names = (id: string) => {
    const root = fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
    return [root.getAttribute('aria-label'), ...Array.from(root.querySelectorAll('button')).map((b) => b.getAttribute('aria-label'))];
  };
  return { names };
}

describe('DsWindowControls', () => {
  it('names the group and the lights in English by default', async () => {
    const { names } = await setup();
    expect(names('en')).toEqual(['Window controls', 'Close window', 'Minimize window', 'Zoom window']);
  });

  it('an input always wins', async () => {
    const { names } = await setup();
    expect(names('own').slice(0, 2)).toEqual(['Report controls', 'Close report']);
  });

  it('defaults to Arabic under an Arabic theme, ar-SA included', async () => {
    const { names } = await setup();
    expect(names('ar')).toEqual(['أزرار النافذة', 'إغلاق النافذة', 'تصغير النافذة', 'تكبير النافذة']);
  });
});
