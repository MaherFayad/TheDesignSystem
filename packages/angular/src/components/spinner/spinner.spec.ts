import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsSpinner } from './spinner';

@Component({
  imports: [DsSpinner],
  template: `
    <span id="plain" dsSpinner label="Loading files"></span>
    <span id="accent" dsSpinner size="lg" tone="accent" [label]="label()"></span>
    <span id="decorative" dsSpinner size="sm" decorative></span>
  `,
})
class Host {
  readonly label = signal('Syncing boards');
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

describe('DsSpinner', () => {
  it('stamps the root with the React defaults and a status role', async () => {
    const { q } = await setup();
    const el = q('plain');
    expect(el.getAttribute('data-ds')).toBe('spinner');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.getAttribute('role')).toBe('status');
    expect(el.hasAttribute('aria-hidden')).toBe(false);
    const label = el.querySelector('[data-part="label"]');
    expect(label?.textContent).toBe('Loading files');
    expect(el.children.length).toBe(1);
  });

  it('maps size and tone, and follows a label change', async () => {
    const { q, host, fixture } = await setup();
    const el = q('accent');
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.getAttribute('data-tone')).toBe('accent');
    host.label.set('Checking links');
    await fixture.whenStable();
    expect(el.querySelector('[data-part="label"]')?.textContent).toBe('Checking links');
  });

  it('decorative: aria-hidden, no role and no label part', async () => {
    const { q } = await setup();
    const el = q('decorative');
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.children.length).toBe(0);
  });

  it('leaves no input attribute or selector marker on the host', async () => {
    const { q } = await setup();
    for (const id of ['plain', 'accent', 'decorative']) {
      for (const name of ['dsspinner', 'size', 'tone', 'label', 'decorative']) expect(q(id).hasAttribute(name)).toBe(false);
    }
  });
});
