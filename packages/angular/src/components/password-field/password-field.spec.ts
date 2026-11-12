import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { DsPasswordField } from './password-field';

@Component({
  imports: [DsPasswordField, DsField, ReactiveFormsModule],
  template: `
    <div data-t="plain" dsPasswordField aria-label="Password" value="spring-launch-26"></div>
    <div data-t="shown" dsPasswordField aria-label="New password" size="lg" autoComplete="new-password" [(visible)]="visible" showLabel="Show key" hideLabel="Hide key"></div>
    <div dsField label="Password" disabled><div data-t="disabled" dsPasswordField></div></div>
    <form (submit)="$event.preventDefault()"><div data-t="form" dsPasswordField aria-label="Password" [formControl]="control" [visible]="true"></div></form>
  `,
})
class Host {
  readonly visible = signal(true);
  readonly control = new FormControl('first');
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`[data-t="${id}"]`) as HTMLElement;
  const native = (id: string) => q(id).querySelector('input') as HTMLInputElement;
  const toggle = (id: string) => q(id).querySelector('[data-part="toggle"]') as HTMLButtonElement;
  return { fixture, host: fixture.componentInstance, q, native, toggle };
}

describe('DsPasswordField', () => {
  it('hides the value and names the toggle by what a press does', async () => {
    const { q, native, toggle } = await setup();
    const el = q('plain');
    expect(el.getAttribute('data-ds')).toBe('password-field');
    expect(el.hasAttribute('data-visible')).toBe(false);
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['control', 'toggle']);
    const input = native('plain');
    expect(input.type).toBe('password');
    expect(input.getAttribute('autocomplete')).toBe('current-password');
    expect(input.getAttribute('autocapitalize')).toBe('none');
    expect(input.getAttribute('autocorrect')).toBe('off');
    expect(input.getAttribute('spellcheck')).toBe('false');
    expect(input.value).toBe('spring-launch-26');
    expect(toggle('plain').getAttribute('aria-label')).toBe('Show password');
    expect(toggle('plain').getAttribute('aria-pressed')).toBe('false');
    expect(toggle('plain').getAttribute('aria-controls')).toBe(input.id);
    expect(toggle('plain').getAttribute('data-size')).toBe('xs');
  });

  it('shows the value and toggles it back, two way', async () => {
    const { fixture, host, q, native, toggle } = await setup();
    expect(q('shown').getAttribute('data-visible')).toBe('');
    expect(native('shown').type).toBe('text');
    expect(native('shown').getAttribute('autocomplete')).toBe('new-password');
    expect(toggle('shown').getAttribute('aria-label')).toBe('Hide key');
    expect(toggle('shown').getAttribute('aria-pressed')).toBe('true');
    expect(toggle('shown').getAttribute('data-size')).toBe('sm');
    toggle('shown').click();
    await fixture.whenStable();
    expect(host.visible()).toBe(false);
    expect(native('shown').type).toBe('password');
    expect(toggle('shown').getAttribute('aria-label')).toBe('Show key');
  });

  it('follows a disabled field and points the toggle at the field control', async () => {
    const { q, native, toggle } = await setup();
    expect(q('disabled').getAttribute('data-disabled')).toBe('');
    expect(native('disabled').disabled).toBe(true);
    expect(toggle('disabled').getAttribute('aria-disabled')).toBe('true');
    expect(toggle('disabled').getAttribute('aria-controls')).toBe(native('disabled').id);
  });

  it('hides the value when the form submits and works with reactive forms', async () => {
    const { fixture, host, q, native } = await setup();
    expect(native('form').value).toBe('first');
    expect(native('form').type).toBe('text');
    native('form').value = 'second';
    native('form').dispatchEvent(new Event('input'));
    expect(host.control.value).toBe('second');
    q('form').closest('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(native('form').type).toBe('password');
    await fixture.whenStable();
    expect(q('form').hasAttribute('data-visible')).toBe(false);
  });
});
