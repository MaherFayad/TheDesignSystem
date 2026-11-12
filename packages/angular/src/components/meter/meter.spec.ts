import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsMeter } from './meter';

@Component({
  imports: [DsMeter, DsTheme],
  template: `
    <div id="storage" dsMeter [value]="value()" [max]="100" [low]="60" [high]="85" [optimum]="0" [valueText]="gb" [levelLabels]="levels" label="Storage used"></div>
    <div id="plain" dsMeter [value]="46" size="lg" label="Usage"></div>
    <div id="named" dsMeter [value]="3" [max]="10" [low]="4" [high]="7" [optimum]="10" [showLevel]="false" aria-label="Score"></div>
    <div id="forced" dsMeter [value]="120" tone="danger" label="Quota"></div>
    <div dsTheme [lang]="'ar'"><div id="ar" dsMeter [value]="90" [low]="60" [high]="85" label="المساحة"></div></div>
  `,
})
class Host {
  readonly value = signal(72);
  readonly gb = (v: number, _min: number, max: number) => `${v} GB of ${max} GB`;
  readonly levels = { low: 'Plenty of room', medium: 'Filling up', high: 'Almost full' };
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

const part = (el: HTMLElement, name: string) => el.querySelector(`[data-part="${name}"]`) as HTMLElement | null;

describe('DsMeter', () => {
  it('renders role meter, the values, the level and the parts in order', async () => {
    const { q } = await setup();
    const el = q('storage');
    expect(el.getAttribute('data-ds')).toBe('meter');
    expect(el.getAttribute('role')).toBe('meter');
    expect(el.getAttribute('aria-valuenow')).toBe('72');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
    expect(el.getAttribute('data-level')).toBe('medium');
    expect(el.getAttribute('data-tone')).toBe('warning');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('aria-valuetext')).toBe('72 GB of 100 GB, Filling up');
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['label', 'value', 'track']);
    expect(el.getAttribute('aria-labelledby')).toBe(part(el, 'label')?.id);
    expect(part(el, 'value')?.textContent).toBe('72 GB of 100 GB, Filling up');
    expect(part(el, 'indicator')?.style.getPropertyValue('--_meter-fraction')).toBe('0.72');
  });

  it('follows the value across the regions', async () => {
    const { q, host, fixture } = await setup();
    const el = q('storage');
    host.value.set(94);
    await fixture.whenStable();
    expect(el.getAttribute('data-level')).toBe('high');
    expect(el.getAttribute('data-tone')).toBe('danger');
    host.value.set(10);
    await fixture.whenStable();
    expect(el.getAttribute('data-level')).toBe('low');
    expect(el.getAttribute('data-tone')).toBe('success');
  });

  it('no thresholds: accent, medium, the percent only', async () => {
    const { q } = await setup();
    const el = q('plain');
    expect(el.getAttribute('data-tone')).toBe('accent');
    expect(el.getAttribute('data-level')).toBe('medium');
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.getAttribute('aria-valuetext')).toBe('46%');
  });

  it('showLevel false hides the word but aria-valuetext keeps it', async () => {
    const { q } = await setup();
    const el = q('named');
    expect(el.getAttribute('aria-label')).toBe('Score');
    expect(el.hasAttribute('aria-labelledby')).toBe(false);
    expect(part(el, 'value')?.textContent).toBe('30%');
    expect(el.getAttribute('aria-valuetext')).toBe('30%, Low');
    expect(el.getAttribute('data-tone')).toBe('danger');
  });

  it('tone overrides, and the value clamps', async () => {
    const { q } = await setup();
    const el = q('forced');
    expect(el.getAttribute('data-tone')).toBe('danger');
    expect(el.getAttribute('aria-valuenow')).toBe('100');
  });

  it('Arabic level words and comma under lang ar', async () => {
    const { q } = await setup();
    expect(q('ar').getAttribute('aria-valuetext')).toMatch(/، مرتفع$/);
  });

  it('leaves no input attribute or selector marker on the host', async () => {
    const { q } = await setup();
    for (const id of ['storage', 'plain', 'named', 'forced']) {
      for (const name of ['dsmeter', 'value', 'max', 'low', 'high', 'optimum', 'label', 'size', 'tone']) expect(q(id).hasAttribute(name)).toBe(false);
    }
  });
});
