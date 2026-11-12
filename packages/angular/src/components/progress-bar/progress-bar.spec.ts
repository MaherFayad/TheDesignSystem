import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsProgressBar } from './progress-bar';
import { formatPercent } from './format';

@Component({
  imports: [DsProgressBar, DsTheme],
  template: `
    <div id="plain" dsProgressBar [value]="value()" label="Uploading files"></div>
    <div id="busy" dsProgressBar label="Preparing export" size="sm" tone="danger"></div>
    <div id="files" dsProgressBar [value]="3" [max]="10" [valueText]="filesOf" label="Copying files"></div>
    <div id="named" dsProgressBar [value]="60" aria-label="Import progress" [showValue]="false"></div>
    <div id="over" dsProgressBar [value]="140"></div>
    <div dsTheme [lang]="'ar'"><div id="ar" dsProgressBar label="مزامنة اللوحات"></div></div>
  `,
})
class Host {
  readonly value = signal<number | null>(46);
  readonly filesOf = (v: number, max: number) => `${v} of ${max} files`;
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

const part = (el: HTMLElement, name: string) => el.querySelector(`[data-part="${name}"]`) as HTMLElement | null;

describe('DsProgressBar', () => {
  it('renders the Radix Progress attributes and the parts in order', async () => {
    const { q } = await setup();
    const el = q('plain');
    expect(el.getAttribute('data-ds')).toBe('progress-bar');
    expect(el.getAttribute('role')).toBe('progressbar');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
    expect(el.getAttribute('aria-valuenow')).toBe('46');
    expect(el.getAttribute('aria-valuetext')).toBe('46%');
    expect(el.getAttribute('data-state')).toBe('loading');
    expect(el.getAttribute('data-value')).toBe('46');
    expect(el.getAttribute('data-max')).toBe('100');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-tone')).toBe('accent');
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['label', 'value', 'track']);
    const label = part(el, 'label') as HTMLElement;
    expect(el.getAttribute('aria-labelledby')).toBe(label.id);
    expect(label.textContent).toBe('Uploading files');
    expect(part(el, 'value')?.textContent).toBe('46%');
    const indicator = part(el, 'indicator') as HTMLElement;
    expect(indicator.parentElement?.getAttribute('data-part')).toBe('track');
    expect(indicator.getAttribute('data-state')).toBe('loading');
    expect(indicator.style.getPropertyValue('--_progress-bar-fraction')).toBe('0.46');
  });

  it('follows the value to complete and to indeterminate', async () => {
    const { q, host, fixture } = await setup();
    const el = q('plain');
    host.value.set(100);
    await fixture.whenStable();
    expect(el.getAttribute('data-state')).toBe('complete');
    host.value.set(null);
    await fixture.whenStable();
    expect(el.getAttribute('data-state')).toBe('indeterminate');
    expect(el.hasAttribute('aria-valuenow')).toBe(false);
    expect(el.hasAttribute('data-value')).toBe(false);
    expect(el.getAttribute('aria-valuetext')).toBe('Loading');
    expect(part(el, 'indicator')?.style.getPropertyValue('--_progress-bar-fraction')).toBe('0');
  });

  it('indeterminate with size and tone', async () => {
    const { q } = await setup();
    const el = q('busy');
    expect(el.getAttribute('data-state')).toBe('indeterminate');
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.getAttribute('data-tone')).toBe('danger');
    expect(part(el, 'value')?.textContent).toBe('Loading');
  });

  it('valueText and max build the text', async () => {
    const { q } = await setup();
    const el = q('files');
    expect(el.getAttribute('aria-valuemax')).toBe('10');
    expect(el.getAttribute('aria-valuetext')).toBe('3 of 10 files');
    expect(part(el, 'value')?.textContent).toBe('3 of 10 files');
  });

  it('aria-label names the bar instead of a label part; showValue false drops the value', async () => {
    const { q } = await setup();
    const el = q('named');
    expect(el.getAttribute('aria-label')).toBe('Import progress');
    expect(el.hasAttribute('aria-labelledby')).toBe(false);
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['track']);
  });

  it('clamps out of range values', async () => {
    const { q } = await setup();
    const el = q('over');
    expect(el.getAttribute('aria-valuenow')).toBe('100');
    expect(el.getAttribute('data-state')).toBe('complete');
  });

  it('speaks Arabic under lang ar', async () => {
    const { q } = await setup();
    expect(q('ar').getAttribute('aria-valuetext')).toBe('جار التحميل');
  });

  it('leaves no input attribute or selector marker on the host', async () => {
    const { q } = await setup();
    for (const id of ['plain', 'busy', 'files', 'named']) {
      for (const name of ['dsprogressbar', 'value', 'max', 'label', 'size', 'tone', 'showvalue']) expect(q(id).hasAttribute(name)).toBe(false);
    }
  });

  it('formats a floored whole percent with Western digits', () => {
    expect(formatPercent(0.456, 'en')).toBe('45%');
    expect(formatPercent(0.996, 'en')).toBe('99%');
    expect(formatPercent(0.46, 'ar')).toMatch(/46/);
  });
});
