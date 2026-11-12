import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { DsPhoneField, type PhoneValueDetail } from './phone-field';

@Component({
  imports: [DsPhoneField, DsField, ReactiveFormsModule],
  template: `
    <div dsField label="Mobile number"><div data-t="mobile" dsPhoneField name="mobile" [(value)]="phone" [(country)]="country" (valueDetail)="details.push($event)"></div></div>
    <div data-t="empty" dsPhoneField aria-label="Mobile" country="KW"></div>
    <div dsField label="Account phone" readOnly><div data-t="readonly" dsPhoneField value="+97336001234"></div></div>
    <div data-t="arabic" dsPhoneField locale="ar" aria-label="رقم الجوال"></div>
    <div data-t="form" dsPhoneField aria-label="Phone" [formControl]="control"></div>
  `,
})
class Host {
  readonly phone = signal<string | undefined>('+966501234567');
  readonly country = signal('SA');
  readonly control = new FormControl('+97141234567');
  details: PhoneValueDetail[] = [];
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`[data-t="${id}"]`) as HTMLElement;
  const native = (id: string) => q(id).querySelector('input[data-part="control"]') as HTMLInputElement;
  const select = (id: string) => q(id).querySelector('select') as HTMLSelectElement | null;
  return { fixture, host: fixture.componentInstance, q, native, select };
}

async function type(fixture: { whenStable(): Promise<unknown> }, el: HTMLInputElement, text: string) {
  el.value = text;
  el.setSelectionRange(text.length, text.length);
  el.dispatchEvent(new Event('input'));
  await fixture.whenStable();
}

describe('DsPhoneField', () => {
  it('shows the dial code, the picker and the grouped national number', async () => {
    const { q, native, select } = await setup();
    const el = q('mobile');
    expect(el.getAttribute('data-ds')).toBe('phone-field');
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part') ?? c.getAttribute('type'))).toEqual(['code', 'control', 'hidden']);
    expect(el.querySelector('bdi')?.textContent).toBe('+966');
    const input = native('mobile');
    expect(input.type).toBe('tel');
    expect(input.getAttribute('dir')).toBe('ltr');
    expect(input.getAttribute('autocomplete')).toBe('tel-national');
    expect(input.getAttribute('inputmode')).toBe('tel');
    expect(input.value).toBe('50 123 4567');
    expect(select('mobile')?.value).toBe('SA');
    expect(select('mobile')?.getAttribute('aria-label')).toBe('Country code');
    expect(select('mobile')?.getAttribute('aria-labelledby')?.split(' ').length).toBe(2);
    expect(select('mobile')?.querySelectorAll('optgroup')[0]?.getAttribute('label')).toBe('Gulf');
    expect((el.querySelector('input[type="hidden"]') as HTMLInputElement).value).toBe('+966501234567');
  });

  it('reads Arabic Indic digits, drops the trunk 0 and emits E.164', async () => {
    const { fixture, host, native } = await setup();
    await type(fixture, native('mobile'), '٠٥٥١٢٣٤٥٦٧');
    expect(host.phone()).toBe('+966551234567');
    expect(native('mobile').value).toBe('55 123 4567');
    expect(host.details.at(-1)).toEqual({ country: 'SA', national: '551234567', valid: true });
  });

  it('sets the country from a pasted international number', async () => {
    const { fixture, host, q, native, select } = await setup();
    await type(fixture, native('mobile'), '+971501234567');
    expect(host.country()).toBe('AE');
    expect(host.phone()).toBe('+971501234567');
    expect(select('mobile')?.value).toBe('AE');
    expect(q('mobile').querySelector('bdi')?.textContent).toBe('+971');
  });

  it('keeps the digits when the picker changes the country', async () => {
    const { fixture, host, select } = await setup();
    const picker = select('mobile') as HTMLSelectElement;
    picker.value = 'KW';
    picker.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(host.country()).toBe('KW');
    expect(host.phone()).toBe('+965501234567');
    expect(host.details.at(-1)?.valid).toBe(false);
  });

  it('starts empty with the example as the placeholder', async () => {
    const { native, q } = await setup();
    expect(native('empty').value).toBe('');
    expect(native('empty').placeholder.length).toBeGreaterThan(0);
    expect(q('empty').querySelector('bdi')?.textContent).toBe('+965');
  });

  it('drops the picker when read only and describes the number with the dial code', async () => {
    const { q, native, select } = await setup();
    expect(select('readonly')).toBeNull();
    const code = q('readonly').querySelector('[data-part="code"] > span') as HTMLElement;
    expect(code.hasAttribute('aria-hidden')).toBe(false);
    expect(native('readonly').getAttribute('aria-describedby')).toBe(code.id);
    expect(native('readonly').readOnly).toBe(true);
  });

  it('names the picker in Arabic', async () => {
    const { select } = await setup();
    expect(select('arabic')?.getAttribute('aria-label')).toBe('رمز الدولة');
    expect(select('arabic')?.querySelector('optgroup')?.getAttribute('label')).toBe('دول الخليج');
  });

  it('works with reactive forms', async () => {
    const { fixture, host, native } = await setup();
    expect(native('form').value).toBe('4 123 4567');
    await type(fixture, native('form'), '41234568');
    expect(host.control.value).toBe('+97141234568');
    host.control.disable();
    await fixture.whenStable();
    expect(native('form').disabled).toBe(true);
  });
});
