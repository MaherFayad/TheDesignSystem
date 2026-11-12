import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { DsNumberField } from './number-field';

@Component({
  imports: [DsNumberField, DsField, DsTheme, ReactiveFormsModule],
  template: `
    <div data-t="seats" dsNumberField aria-label="Seats" [min]="0" [max]="50" [(value)]="seats"></div>
    <div data-t="pct" dsNumberField aria-label="Discount" [formatOptions]="percent" [min]="0" [max]="1" [value]="0.15"></div>
    <div data-t="empty" dsNumberField aria-label="Team size" placeholder="For example, 12"></div>
    <div data-t="bounded" dsNumberField aria-label="Guests" [min]="1" [max]="3" [value]="2" end="px"></div>
    <div dsField label="Seats" description="Between 1 and 50." error="Enter a number from 1 to 50." required>
      <div data-t="field" dsNumberField [value]="0" [min]="0" [max]="50"></div>
    </div>
    <div dsField label="Seats" readOnly><div data-t="readonly" dsNumberField [value]="10"></div></div>
    <div dsField label="Seats" disabled><div data-t="disabled" dsNumberField [value]="10"></div></div>
    <div dsTheme lang="ar">
      <div data-t="arabic" dsNumberField aria-label="الكمية" [(value)]="arabic"></div>
    </div>
    <div data-t="form" dsNumberField aria-label="Width" name="width" [formControl]="control"></div>
  `,
})
class Host {
  readonly seats = signal<number | null | undefined>(10);
  readonly arabic = signal<number | null | undefined>(1234.5);
  readonly percent: Intl.NumberFormatOptions = { style: 'percent' };
  readonly control = new FormControl<number | null>(320);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`[data-t="${id}"]`) as HTMLElement;
  const native = (id: string) => q(id).querySelector('input[data-part="control"]') as HTMLInputElement;
  const part = (id: string, name: string) => q(id).querySelector(`[data-part="${name}"]`) as HTMLElement | null;
  const key = async (id: string, k: string) => {
    native(id).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    await fixture.whenStable();
  };
  const type = async (id: string, text: string) => {
    const el = native(id);
    el.value = text;
    el.setSelectionRange(text.length, text.length);
    el.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const blur = async (id: string) => {
    native(id).dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, q, native, part, key, type, blur };
}

describe('DsNumberField', () => {
  it('renders the root, the control and two IconButton steppers, as React does', async () => {
    const { q, native, part } = await setup();
    const el = q('seats');
    expect(el.getAttribute('data-ds')).toBe('number-field');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-shape')).toBe('default');
    expect(el.hasAttribute('dsnumberfield')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['decrement', 'control', 'increment']);
    const input = native('seats');
    expect(input.value).toBe('10');
    expect(input.getAttribute('value')).toBe('10');
    expect(input.type).toBe('text');
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.getAttribute('aria-roledescription')).toBe('Number field');
    expect(input.getAttribute('autocomplete')).toBe('off');
    expect(input.getAttribute('tabindex')).toBe('0');
    const inc = part('seats', 'increment')!;
    expect(inc.getAttribute('data-ds')).toBe('icon-button');
    expect(inc.getAttribute('aria-label')).toBe('Increase Seats');
    expect(inc.getAttribute('tabindex')).toBe('-1');
    expect(inc.getAttribute('aria-controls')).toBe(input.id);
    expect(inc.getAttribute('data-size')).toBe('xs');
    expect(part('seats', 'decrement')!.getAttribute('aria-label')).toBe('Decrease Seats');
    expect(part('bounded', 'end')?.textContent?.trim()).toBe('px');
  });

  it('steps with the arrow keys, ten steps with PageUp and PageDown, and Home and End go to the bounds', async () => {
    const { host, native, key } = await setup();
    await key('seats', 'ArrowUp');
    expect(native('seats').value).toBe('11');
    expect(host.seats()).toBe(11);
    await key('seats', 'ArrowDown');
    await key('seats', 'ArrowDown');
    expect(native('seats').value).toBe('9');
    await key('seats', 'PageUp');
    expect(native('seats').value).toBe('19');
    await key('seats', 'PageDown');
    expect(native('seats').value).toBe('9');
    await key('seats', 'End');
    expect(native('seats').value).toBe('50');
    await key('seats', 'ArrowUp');
    expect(native('seats').value).toBe('50');
    await key('seats', 'Home');
    expect(native('seats').value).toBe('0');
    expect(host.seats()).toBe(0);
  });

  it('moves ten percent steps with PageUp on a percent field', async () => {
    const { native, key } = await setup();
    await key('pct', 'PageUp');
    expect(native('pct').value).toBe('25%');
    await key('pct', 'ArrowDown');
    expect(native('pct').value).toBe('24%');
  });

  it('commits a typed value on Enter and blur, within the bounds, and refuses text that is no number', async () => {
    const { host, native, key, type, blur } = await setup();
    await type('seats', '12a');
    expect(native('seats').value).toBe('10');
    await type('seats', '12');
    expect(host.seats()).toBe(10);
    await key('seats', 'Enter');
    expect(host.seats()).toBe(12);
    await type('seats', '75');
    await blur('seats');
    expect(native('seats').value).toBe('50');
    expect(host.seats()).toBe(50);
    await type('seats', '-');
    expect(native('seats').value).toBe('50');
    await type('seats', '');
    await blur('seats');
    expect(host.seats()).toBeNull();
    expect(native('seats').value).toBe('');
  });

  it('reads a percent typed with its sign', async () => {
    const { native, type, blur } = await setup();
    await type('pct', '40%');
    await blur('pct');
    expect(native('pct').value).toBe('40%');
  });

  it('starts empty, and a step from empty starts at the bound or zero', async () => {
    const { native, key } = await setup();
    expect(native('empty').value).toBe('');
    expect(native('empty').getAttribute('value')).toBe('');
    expect(native('empty').placeholder).toBe('For example, 12');
    await key('empty', 'ArrowUp');
    expect(native('empty').value).toBe('0');
  });

  it('steps with the buttons and disables the one at a bound', async () => {
    const { fixture, native, part } = await setup();
    const inc = part('bounded', 'increment')!;
    inc.dispatchEvent(new MouseEvent('pointerdown', { button: 0, bubbles: true, cancelable: true }));
    inc.dispatchEvent(new MouseEvent('pointerup', { button: 0, bubbles: true }));
    await fixture.whenStable();
    expect(native('bounded').value).toBe('3');
    expect(document.activeElement).toBe(native('bounded'));
    expect(inc.getAttribute('aria-disabled')).toBe('true');
    expect(inc.hasAttribute('disabled')).toBe(false);
    expect(part('bounded', 'decrement')!.hasAttribute('aria-disabled')).toBe(false);
    // A click with no press, as a screen reader sends it, steps once.
    part('bounded', 'decrement')!.dispatchEvent(new MouseEvent('click', { detail: 0, bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(native('bounded').value).toBe('2');
  });

  it('reads Arabic Indic digits, keeps Western digits and names the parts in Arabic (RTL)', async () => {
    const { host, q, native, part, type, blur } = await setup();
    expect(q('arabic').closest('[dir]')?.getAttribute('dir')).toBe('rtl');
    expect(native('arabic').value).toBe('1,234.5');
    expect(native('arabic').getAttribute('aria-roledescription')).toBe('حقل رقمي');
    expect(part('arabic', 'increment')!.getAttribute('aria-label')).toBe('زيادة الكمية');
    expect(part('arabic', 'decrement')!.getAttribute('aria-label')).toBe('خفض الكمية');
    await type('arabic', '١٢٫٥');
    expect(native('arabic').value).toBe('12.5');
    await blur('arabic');
    expect(native('arabic').value).toBe('12.5');
    expect(host.arabic()).toBe(12.5);
    expect(native('arabic').value).not.toMatch(/[٠-٩]/);
  });

  it('wires a Field: label for, aria-labelledby, aria-describedby, aria-invalid and aria-required', async () => {
    const { fixture, native, part } = await setup();
    const input = native('field');
    const field = input.closest('[data-ds="field"]') as HTMLElement;
    const label = field.querySelector('label') as HTMLLabelElement;
    const description = field.querySelector('[data-part="description"]') as HTMLElement;
    const error = field.querySelector('[data-part="error"]') as HTMLElement;
    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.getAttribute('aria-labelledby')).toBe(label.id);
    expect(input.hasAttribute('aria-label')).toBe(false);
    expect(input.getAttribute('aria-describedby')).toBe(`${description.id} ${error.id}`);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.hasAttribute('required')).toBe(false);
    expect(fixture.nativeElement.querySelector('[data-t="field"]').getAttribute('data-invalid')).toBe('');
    const inc = part('field', 'increment')!;
    expect(inc.getAttribute('aria-label')).toBe('Increase');
    expect(inc.getAttribute('aria-labelledby')).toBe(`${inc.id} ${label.id}`);
    // At the bound the decrement disables.
    expect(part('field', 'decrement')!.getAttribute('aria-disabled')).toBe('true');
  });

  it('hides the steppers while read only and blocks the keys; disabled stays out of the tab order', async () => {
    const { q, native, part, key } = await setup();
    expect(q('readonly').getAttribute('data-readonly')).toBe('');
    expect(part('readonly', 'increment')).toBeNull();
    expect(native('readonly').readOnly).toBe(true);
    expect(native('readonly').getAttribute('aria-readonly')).toBe('true');
    await key('readonly', 'ArrowUp');
    expect(native('readonly').value).toBe('10');
    expect(q('disabled').getAttribute('data-disabled')).toBe('');
    expect(native('disabled').disabled).toBe(true);
    expect(native('disabled').getAttribute('aria-disabled')).toBe('true');
    expect(native('disabled').hasAttribute('tabindex')).toBe(false);
    expect(part('disabled', 'increment')!.getAttribute('aria-disabled')).toBe('true');
  });

  it('works with reactive forms and carries the number in a hidden input after the root', async () => {
    const { fixture, host, q, native, key } = await setup();
    expect(native('form').value).toBe('320');
    await key('form', 'ArrowUp');
    expect(host.control.value).toBe(321);
    const hidden = q('form').nextElementSibling as HTMLInputElement;
    expect(hidden.type).toBe('hidden');
    expect(hidden.name).toBe('width');
    expect(hidden.value).toBe('321');
    host.control.setValue(5);
    await fixture.whenStable();
    expect(native('form').value).toBe('5');
    host.control.disable();
    await fixture.whenStable();
    expect(native('form').disabled).toBe(true);
  });
});
