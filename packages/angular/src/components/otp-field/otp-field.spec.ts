import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { DsOTPField } from './otp-field';

@Component({
  imports: [DsOTPField, DsField, ReactiveFormsModule],
  template: `
    <div data-t="code" dsOTPField aria-label="Verification code" [groups]="[3, 3]" [(value)]="code" (complete)="completes.push($event)"></div>
    <div data-t="alpha" dsOTPField aria-label="Backup code" [length]="8" charset="alphanumeric" value="k7qd"></div>
    <div dsField label="Code" readOnly><div data-t="readonly" dsOTPField value="5820" [length]="4"></div></div>
    <div data-t="form" dsOTPField aria-label="Code" [formControl]="control"></div>
  `,
})
class Host {
  readonly code = signal('48');
  readonly control = new FormControl('12');
  completes: string[] = [];
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`[data-t="${id}"]`) as HTMLElement;
  const native = (id: string) => q(id).querySelector('input') as HTMLInputElement;
  const cells = (id: string) => Array.from(q(id).querySelectorAll('[data-part="cell"]')) as HTMLElement[];
  return { fixture, host: fixture.componentInstance, q, native, cells };
}

async function typeAt(fixture: { whenStable(): Promise<unknown> }, el: HTMLInputElement, text: string, caret = text.length) {
  el.value = text;
  el.setSelectionRange(caret, caret);
  el.dispatchEvent(new Event('input'));
  await fixture.whenStable();
}

describe('DsOTPField', () => {
  it('draws one native input and the cells, left to right', async () => {
    const { q, native, cells } = await setup();
    const el = q('code');
    expect(el.getAttribute('data-ds')).toBe('otp-field');
    expect(el.getAttribute('dir')).toBe('ltr');
    const input = native('code');
    expect(input.getAttribute('data-part')).toBe('control');
    expect(input.getAttribute('autocomplete')).toBe('one-time-code');
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.getAttribute('pattern')).toBe('[0-9]*');
    expect(input.getAttribute('enterkeyhint')).toBe('done');
    expect(input.getAttribute('aria-label')).toBe('Verification code');
    expect(input.value).toBe('48');
    expect(cells('code').length).toBe(6);
    expect(cells('code').map((c) => c.textContent)).toEqual(['4', '8', '', '', '', '']);
    // Each filled character sits in its own span (the otp-fill target), as React; an empty cell has none.
    expect(cells('code').map((c) => c.firstElementChild?.tagName ?? null)).toEqual(['SPAN', 'SPAN', null, null, null, null]);
    expect(cells('code').every((c) => c.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(cells('code').map((c) => c.hasAttribute('data-filled'))).toEqual([true, true, false, false, false, false]);
    const order = Array.from(el.children).map((c) => c.getAttribute('data-part'));
    expect(order).toEqual(['control', 'cell', 'cell', 'cell', 'separator', 'cell', 'cell', 'cell']);
  });

  it('upper cases letters and uses the text keyboard for alphanumeric codes', async () => {
    const { native, cells } = await setup();
    expect(native('alpha').value).toBe('K7QD');
    expect(native('alpha').getAttribute('inputmode')).toBe('text');
    expect(native('alpha').getAttribute('autocapitalize')).toBe('characters');
    expect(cells('alpha').length).toBe(8);
  });

  it('takes typed digits, refuses a letter, completes once', async () => {
    const { fixture, host, q, native } = await setup();
    const input = native('code');
    input.focus();
    await typeAt(fixture, input, '48a');
    expect(host.code()).toBe('48');
    expect(input.value).toBe('48');
    await typeAt(fixture, input, '٤٨٢٩١٣');
    expect(host.code()).toBe('482913');
    expect(host.completes).toEqual(['482913']);
    expect(q('code').getAttribute('data-complete')).toBe('');
  });

  it('reads a pasted code with spaces and dashes', async () => {
    const { fixture, host, native } = await setup();
    await typeAt(fixture, native('code'), '482-913');
    expect(host.code()).toBe('482913');
  });

  it('moves the active cell with the arrows and marks it while focused', async () => {
    const { fixture, native, cells } = await setup();
    const input = native('code');
    input.focus();
    input.dispatchEvent(new FocusEvent('focus'));
    await fixture.whenStable();
    expect(cells('code')[2]?.hasAttribute('data-active')).toBe(true);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true }));
    await fixture.whenStable();
    expect(cells('code')[1]?.hasAttribute('data-active')).toBe(true);
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 2]);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', cancelable: true }));
    await fixture.whenStable();
    expect(cells('code')[0]?.hasAttribute('data-active')).toBe(true);
  });

  it('follows a read only field', async () => {
    const { q, native } = await setup();
    expect(q('readonly').getAttribute('data-readonly')).toBe('');
    expect(native('readonly').readOnly).toBe(true);
    expect(q('readonly').getAttribute('data-complete')).toBe('');
  });

  it('works with reactive forms', async () => {
    const { fixture, host, native } = await setup();
    expect(native('form').value).toBe('12');
    await typeAt(fixture, native('form'), '123');
    expect(host.control.value).toBe('123');
    host.control.disable();
    await fixture.whenStable();
    expect(native('form').disabled).toBe(true);
  });
});
