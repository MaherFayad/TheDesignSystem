import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { DsInput } from '../input/input';
import { DsFieldset } from './fieldset';

@Component({
  imports: [DsFieldset, DsField, DsInput],
  template: `
    <fieldset dsFieldset id="group" legend="Delivery address" description="Where we send it." [error]="error()" [invalid]="invalid()" [size]="size()" aria-describedby="extra">
      <div dsField label="City"><div dsInput></div></div>
    </fieldset>
    <fieldset dsFieldset id="off" legend="Billing" disabled>
      <div dsField label="City"><div dsInput></div></div>
    </fieldset>
    <fieldset dsFieldset id="tpl" [legend]="legendTpl"></fieldset>
    <ng-template #legendTpl><strong>Rich</strong> legend</ng-template>
  `,
})
class Host {
  readonly error = signal<string | undefined>(undefined);
  readonly invalid = signal<boolean | undefined>(undefined);
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (sel: string) => fixture.nativeElement.querySelector(sel) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

describe('DsFieldset', () => {
  it('renders legend, description and body in order on a native fieldset', async () => {
    const { q } = await setup();
    const group = q('#group');
    expect(group.tagName).toBe('FIELDSET');
    expect(group.getAttribute('data-ds')).toBe('fieldset');
    expect(group.getAttribute('data-size')).toBe('md');
    expect(group.hasAttribute('legend')).toBe(false);
    expect(group.hasAttribute('dsfieldset')).toBe(false);
    expect(Array.from(group.children).map((c) => c.getAttribute('data-part'))).toEqual(['legend', 'description', 'body']);
    const description = group.querySelector('[data-part="description"]') as HTMLElement;
    expect(group.getAttribute('aria-describedby')).toBe(`${description.id} extra`);
    expect(group.hasAttribute('data-invalid')).toBe(false);
  });

  it('shows the error before the body, joins aria-describedby and marks the group invalid', async () => {
    const { fixture, host, q } = await setup();
    host.error.set('Pick at least one way to reach you.');
    await fixture.whenStable();
    const group = q('#group');
    expect(Array.from(group.children).map((c) => c.getAttribute('data-part'))).toEqual(['legend', 'description', 'error', 'body']);
    const error = group.querySelector('[data-part="error"]') as HTMLElement;
    expect(error.getAttribute('data-ds')).toBe('field-error');
    expect(error.getAttribute('data-size')).toBe('md');
    const description = group.querySelector('[data-part="description"]') as HTMLElement;
    expect(group.getAttribute('aria-describedby')).toBe(`${description.id} ${error.id} extra`);
    expect(group.hasAttribute('data-invalid')).toBe(true);
    // The error context reaches the error alone: the field in the body keeps its own error id.
    const input = group.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('aria-describedby')).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('hides the error with invalid false and uses a small error at size sm', async () => {
    const { fixture, host, q } = await setup();
    host.error.set('Fix it.');
    host.size.set('sm');
    await fixture.whenStable();
    expect(q('#group [data-part="error"]').getAttribute('data-size')).toBe('sm');
    host.invalid.set(false);
    await fixture.whenStable();
    expect(q('#group [data-part="error"]')).toBeNull();
    expect(q('#group').hasAttribute('data-invalid')).toBe(false);
  });

  it('is native disabled', async () => {
    const { q } = await setup();
    const off = q('#off');
    expect(off.hasAttribute('disabled')).toBe(true);
    expect(off.hasAttribute('data-disabled')).toBe(true);
    expect((off.querySelector('input') as HTMLInputElement).matches(':disabled')).toBe(true);
    expect(off.hasAttribute('aria-describedby')).toBe(false);
  });

  it('takes a template legend', async () => {
    const { q } = await setup();
    expect(q('#tpl legend').innerHTML).toContain('<strong>Rich</strong>');
  });
});
