import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsProgressCircle } from './progress-circle';

@Component({
  imports: [DsProgressCircle],
  template: `
    <div id="plain" dsProgressCircle [value]="value()" label="Uploading files"></div>
    <div id="small" dsProgressCircle size="sm" [value]="46" tone="success" label="Uploading brief.pdf"></div>
    <div id="small-shown" dsProgressCircle size="xs" [value]="46" showValue label="Uploading logo.svg"></div>
    <div id="busy" dsProgressCircle label="Preparing export"></div>
    <div id="slash" dsProgressCircle size="lg" [value]="7" [max]="12" [valueText]="slash" label="Copying files"></div>
  `,
})
class Host {
  readonly value = signal<number | null>(46);
  readonly slash = (v: number, m: number) => `${v}/${m}`;
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

const parts = (el: HTMLElement) => Array.from(el.children).map((c) => c.getAttribute('data-part'));

describe('DsProgressCircle', () => {
  it('renders the Radix Progress attributes, the label as the name and the parts in order', async () => {
    const { q } = await setup();
    const el = q('plain');
    expect(el.getAttribute('data-ds')).toBe('progress-circle');
    expect(el.getAttribute('role')).toBe('progressbar');
    expect(el.getAttribute('aria-label')).toBe('Uploading files');
    expect(el.getAttribute('aria-valuenow')).toBe('46');
    expect(el.getAttribute('aria-valuetext')).toBe('46%');
    expect(el.getAttribute('data-state')).toBe('loading');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-tone')).toBe('accent');
    expect(parts(el)).toEqual(['track', 'indicator', 'value']);
    const value = el.querySelector('[data-part="value"]') as HTMLElement;
    expect(value.getAttribute('aria-hidden')).toBe('true');
    expect(value.textContent).toBe('46%');
    const indicator = el.querySelector('[data-part="indicator"]') as HTMLElement;
    expect(indicator.style.getPropertyValue('--_progress-circle-fraction')).toBe('0.46');
    expect(indicator.getAttribute('data-max')).toBe('100');
  });

  it('hides the value at xs and sm unless showValue is set', async () => {
    const { q } = await setup();
    expect(parts(q('small'))).toEqual(['track', 'indicator']);
    expect(q('small').getAttribute('data-tone')).toBe('success');
    expect(parts(q('small-shown'))).toEqual(['track', 'indicator', 'value']);
  });

  it('indeterminate: no value part, the loading words in aria-valuetext', async () => {
    const { q, host, fixture } = await setup();
    expect(parts(q('busy'))).toEqual(['track', 'indicator']);
    expect(q('busy').getAttribute('aria-valuetext')).toBe('Loading');
    host.value.set(null);
    await fixture.whenStable();
    expect(q('plain').getAttribute('data-state')).toBe('indeterminate');
    expect(parts(q('plain'))).toEqual(['track', 'indicator']);
  });

  it('B11 (review interactions-3): the indicator holds the arc part with a value and when indeterminate, as React', async () => {
    const { q, host, fixture } = await setup();
    const arc = (id: string) => {
      const indicator = q(id).querySelector(':scope > [data-part="indicator"]') as HTMLElement;
      expect(Array.from(indicator.children).map((c) => `${c.localName}[${c.getAttribute('data-part')}]`)).toEqual(['svg[arc]']);
      const svg = indicator.firstElementChild as SVGElement;
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.getAttribute('focusable')).toBe('false');
      expect(Array.from(svg.children).map((c) => `${c.localName} ${c.getAttribute('pathLength')}`)).toEqual(['circle 100']);
    };
    arc('plain');
    arc('small');
    arc('busy');
    expect(q('busy').getAttribute('data-state')).toBe('indeterminate');
    host.value.set(null);
    await fixture.whenStable();
    arc('plain');
    host.value.set(100);
    await fixture.whenStable();
    expect(q('plain').getAttribute('data-state')).toBe('complete');
    arc('plain');
  });

  it('valueText and max', async () => {
    const { q } = await setup();
    const el = q('slash');
    expect(el.getAttribute('aria-valuetext')).toBe('7/12');
    expect(el.getAttribute('aria-valuemax')).toBe('12');
    expect(el.querySelector('[data-part="value"]')?.textContent).toBe('7/12');
  });

  it('leaves no input attribute or selector marker on the host', async () => {
    const { q } = await setup();
    for (const id of ['plain', 'small', 'small-shown', 'busy', 'slash']) {
      for (const name of ['dsprogresscircle', 'value', 'max', 'label', 'size', 'tone', 'showvalue']) expect(q(id).hasAttribute(name)).toBe(false);
    }
  });
});
