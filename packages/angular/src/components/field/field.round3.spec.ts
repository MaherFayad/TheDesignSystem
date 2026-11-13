// Round 3 of Field (order 1.23): the floating label. The label renders after
// the control, the root carries data-floating, and data-filled while the
// control has a value, from typing or from a value written by code.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsInput } from '../input/input';
import { DsField } from './field';

@Component({
  imports: [DsField, DsInput, ReactiveFormsModule],
  template: `
    <div dsField id="typed" label="Email" floating><div dsInput></div></div>
    <div dsField id="model" label="City" floating><div dsInput [value]="city()"></div></div>
    <div dsField id="form" label="Name" floating><div dsInput [formControl]="name"></div></div>
    <div dsField id="plain" label="Email"><div dsInput value="x"></div></div>
  `,
})
class Host {
  readonly city = signal<string | undefined>(undefined);
  readonly name = new FormControl('');
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const field = (id: string) => root.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, field };
}

describe('field floating label, order 1.23', () => {
  it('renders the label after the control and follows what the person types', async () => {
    const { fixture, field } = await setup();
    const root = field('typed');
    expect(root.hasAttribute('data-floating')).toBe(true);
    expect(root.hasAttribute('data-filled')).toBe(false);
    const parts = Array.from(root.children).map((c) => c.getAttribute('data-part') ?? c.getAttribute('data-ds'));
    expect(parts).toEqual(['input', 'label']);
    const input = root.querySelector('input') as HTMLInputElement;
    expect(root.querySelector('label')?.getAttribute('for')).toBe(input.id);
    input.value = 'sara';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(root.hasAttribute('data-filled')).toBe(true);
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(root.hasAttribute('data-filled')).toBe(false);
  });

  it('follows a value written by code, with no input event', async () => {
    const { fixture, host, field } = await setup();
    host.city.set('Riyadh');
    await fixture.whenStable();
    expect(field('model').hasAttribute('data-filled')).toBe(true);
    host.city.set('');
    await fixture.whenStable();
    expect(field('model').hasAttribute('data-filled')).toBe(false);
    host.name.setValue('Sara');
    await fixture.whenStable();
    expect(field('form').hasAttribute('data-filled')).toBe(true);
    host.name.setValue('');
    await fixture.whenStable();
    expect(field('form').hasAttribute('data-filled')).toBe(false);
  });

  it('is off by default: the label stays first and no state is stamped', async () => {
    const { field } = await setup();
    const root = field('plain');
    expect(root.hasAttribute('data-floating')).toBe(false);
    expect(root.hasAttribute('data-filled')).toBe(false);
    expect(root.firstElementChild?.getAttribute('data-part')).toBe('label');
  });
});
