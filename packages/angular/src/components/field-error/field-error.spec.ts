import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { DsInput } from '../input/input';
import { DsFieldError } from './field-error';

@Component({
  imports: [DsFieldError, DsField, DsInput],
  template: `
    <p dsFieldError id="alone">Add a name.</p>
    <p dsFieldError id="small" size="sm">Use 1 px or more.</p>
    <div dsField id="field">
      <div dsInput></div>
      @if (error()) {
        <p dsFieldError id="own-id">{{ error() }}</p>
      }
    </div>
  `,
})
class Host {
  readonly error = signal<string | null>('Add a first name.');
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, host: fixture.componentInstance, root };
}

describe('DsFieldError', () => {
  it('renders the icon and the message, never as a live region', async () => {
    const { root } = await setup();
    const el = root.querySelector('#alone') as HTMLElement;
    expect(el.getAttribute('data-ds')).toBe('field-error');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-live')).toBe(false);
    const [icon, message] = Array.from(el.children);
    expect(icon?.getAttribute('data-part')).toBe('icon');
    expect(icon?.getAttribute('data-icon')).toBe('danger');
    expect(icon?.getAttribute('data-size')).toBe('md');
    expect(message?.getAttribute('data-part')).toBe('message');
    expect(message?.textContent).toBe('Add a name.');
  });

  it('takes a small icon at size sm', async () => {
    const { root } = await setup();
    const el = root.querySelector('[data-size="sm"][data-ds="field-error"]') as HTMLElement;
    expect(el.querySelector('svg')?.getAttribute('data-size')).toBe('sm');
  });

  it('is the error part inside a field: the field id wins, the control points at it, the field turns invalid', async () => {
    const { fixture, host, root } = await setup();
    const field = root.querySelector('[data-ds="field"]') as HTMLElement;
    const error = field.querySelector('[data-ds="field-error"]') as HTMLElement;
    const control = field.querySelector('input') as HTMLInputElement;
    expect(error.getAttribute('data-part')).toBe('error');
    expect(error.id).not.toBe('own-id');
    expect(control.getAttribute('aria-describedby')).toBe(error.id);
    expect(control.getAttribute('aria-invalid')).toBe('true');
    expect(field.getAttribute('data-invalid')).toBe('');
    host.error.set(null);
    await fixture.whenStable();
    expect(field.querySelector('[data-ds="field-error"]')).toBeNull();
    expect(control.hasAttribute('aria-describedby')).toBe(false);
    expect(control.hasAttribute('aria-invalid')).toBe(false);
    expect(field.hasAttribute('data-invalid')).toBe(false);
  });
});
