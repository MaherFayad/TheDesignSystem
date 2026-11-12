import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsInput } from '../input/input';
import { DsLabel } from '../label/label';
import { DsField, DsFieldDescription } from './field';

@Component({
  imports: [DsField, DsFieldDescription, DsInput, DsLabel],
  template: `
    <div dsField id="one-line" label="Board name" description="Shown on the board card." [error]="error()" [invalid]="invalid()" required>
      <div dsInput></div>
    </div>
    <div dsField id="compound" orientation="horizontal" disabled readOnly>
      <label dsFieldLabel>Email</label>
      <div dsInput id="own" aria-describedby="hint"></div>
      @if (showDescription()) {
        <p dsFieldDescription>Sign in links go here.</p>
      }
    </div>
    <div dsField id="templated" [label]="tpl">
      <div dsInput></div>
      <ng-template #tpl><strong>Rich</strong> label</ng-template>
    </div>
  `,
})
class Host {
  readonly error = signal<string | undefined>(undefined);
  readonly invalid = signal<boolean | undefined>(undefined);
  readonly showDescription = signal(true);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (sel: string) => fixture.nativeElement.querySelector(sel) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

describe('DsField', () => {
  it('renders label, control, description in order and wires the ids', async () => {
    const { q } = await setup();
    const field = q('#one-line');
    expect(field.getAttribute('data-ds')).toBe('field');
    expect(field.getAttribute('data-orientation')).toBe('vertical');
    expect(field.hasAttribute('label')).toBe(false);
    const parts = Array.from(field.children).map((c) => c.getAttribute('data-part') ?? c.getAttribute('data-ds'));
    expect(parts).toEqual(['label', 'input', 'description']);
    const label = field.querySelector('label') as HTMLLabelElement;
    const control = field.querySelector('input') as HTMLInputElement;
    const description = field.querySelector('[data-part="description"]') as HTMLElement;
    expect(label.getAttribute('data-ds')).toBe('label');
    expect(label.getAttribute('for')).toBe(control.id);
    expect(control.getAttribute('aria-describedby')).toBe(description.id);
    expect(control.getAttribute('aria-required')).toBe('true');
    expect(label.querySelector('[data-part="required"]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows the error, joins aria-describedby after the description, and hides it with invalid false', async () => {
    const { fixture, host, q } = await setup();
    const field = q('#one-line');
    host.error.set('Add a name.');
    await fixture.whenStable();
    const control = field.querySelector('input') as HTMLInputElement;
    const error = field.querySelector('[data-part="error"]') as HTMLElement;
    const description = field.querySelector('[data-part="description"]') as HTMLElement;
    expect(error.getAttribute('data-ds')).toBe('field-error');
    expect(error.textContent?.trim()).toBe('Add a name.');
    expect(control.getAttribute('aria-describedby')).toBe(`${description.id} ${error.id}`);
    expect(field.getAttribute('data-invalid')).toBe('');
    expect(control.getAttribute('aria-invalid')).toBe('true');
    host.invalid.set(false);
    await fixture.whenStable();
    expect(field.querySelector('[data-part="error"]')).toBeNull();
    expect(field.hasAttribute('data-invalid')).toBe(false);
  });

  it('passes disabled, read only and orientation, and a control id of its own', async () => {
    const { fixture, host, q } = await setup();
    const field = q('#compound');
    const control = field.querySelector('input') as HTMLInputElement;
    const label = field.querySelector('label') as HTMLLabelElement;
    expect(field.getAttribute('data-orientation')).toBe('horizontal');
    expect(field.getAttribute('data-disabled')).toBe('');
    expect(field.getAttribute('data-readonly')).toBe('');
    expect(control.disabled).toBe(true);
    expect(control.readOnly).toBe(true);
    expect(control.id).toBe('own');
    expect(label.getAttribute('for')).toBe('own');
    const description = field.querySelector('[data-part="description"]') as HTMLElement;
    expect(control.getAttribute('aria-describedby')).toBe(`${description.id} hint`);
    host.showDescription.set(false);
    await fixture.whenStable();
    expect(control.getAttribute('aria-describedby')).toBe('hint');
  });

  it('takes a template as the label text', async () => {
    const { q } = await setup();
    expect(q('#templated label strong')?.textContent).toBe('Rich');
  });
});
