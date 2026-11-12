// QA probe (ds-qa angular-2 review): forms and Field wiring of Combobox and Autocomplete. Temporary.
import { ChangeDetectorRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { afterEach, describe, expect, it } from 'vitest';
import { DsAutocomplete } from '../autocomplete/autocomplete';
import { DsField } from '../field/field';
import { cityOptions } from '../list-box/samples';
import { DsCombobox } from './combobox';

@Component({
  imports: [DsCombobox, DsAutocomplete, DsField, ReactiveFormsModule, FormsModule],
  template: `
    <div dsField label="City" description="Where you work." required>
      <div data-test="fc" dsCombobox [items]="gulf" [formControl]="fc"></div>
    </div>
    <div dsField label="City" description="Where." error="Pick one.">
      <div data-test="err" dsCombobox [items]="gulf"></div>
    </div>
    <div data-test="ngm" dsCombobox aria-label="City" [items]="gulf" [(ngModel)]="model"></div>
    <div data-test="static" dsCombobox aria-label="City" [items]="gulf" size="sm" disabled="false"></div>
    <div dsField label="Tag" description="Any text." required>
      <div data-test="afc" dsAutocomplete [items]="gulf" [formControl]="afc"></div>
    </div>
    <div data-test="angm" dsAutocomplete aria-label="Tag" [items]="gulf" [(ngModel)]="amodel"></div>
  `,
})
class Host {
  readonly gulf = cityOptions('en', 'gulf');
  readonly fc = new FormControl<string | null>(null, Validators.required);
  readonly afc = new FormControl<string>('', { nonNullable: true, validators: Validators.required });
  model: string | null = 'doha';
  amodel = 'first';
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
  const input = (id: string) => root(id).querySelector('input[data-part="control"]') as HTMLInputElement;
  const settle = async () => {
    fixture.componentRef.injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const key = async (t: Element, k: string) => {
    t.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    await settle();
  };
  const type = async (el: HTMLInputElement, text: string) => {
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
  };
  return { fixture, host: fixture.componentInstance, root, input, settle, key, type };
}

afterEach(() => {
  for (const l of Array.from(document.querySelectorAll('[data-menu-layer]'))) l.remove();
});

describe('Combobox QA', () => {
  it('FormControl: model to view and view to model', async () => {
    const { host, input, settle, key, type } = await setup();
    host.fc.setValue('dubai');
    await settle();
    expect(input('fc').value).toBe('Dubai');
    input('fc').focus();
    await type(input('fc'), 'mus');
    await key(input('fc'), 'Enter');
    expect(host.fc.value).toBe('muscat');
    expect(input('fc').value).toBe('Muscat');
    host.fc.setValue(null);
    await settle();
    expect.soft(input('fc').value, 'setValue(null) clears the text').toBe('');
  });

  it('ngModel: model to view and view to model', async () => {
    const { host, input, settle, key, type } = await setup();
    await settle();
    expect(input('ngm').value).toBe('Doha');
    host.model = 'manama';
    await settle();
    expect(input('ngm').value).toBe('Manama');
    input('ngm').focus();
    await type(input('ngm'), 'dub');
    await key(input('ngm'), 'Enter');
    expect(host.model).toBe('dubai');
  });

  it('disable() and enable()', async () => {
    const { host, root, input, settle } = await setup();
    host.fc.disable();
    await settle();
    expect(input('fc').disabled).toBe(true);
    expect(root('fc').hasAttribute('data-disabled')).toBe(true);
    host.fc.enable();
    await settle();
    expect(input('fc').disabled).toBe(false);
    expect(root('fc').hasAttribute('data-disabled')).toBe(false);
  });

  it('touched on blur', async () => {
    const { host, input, settle } = await setup();
    input('fc').focus();
    input('fc').dispatchEvent(new FocusEvent('blur'));
    input('fc').dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    input('fc').blur();
    await settle();
    expect(host.fc.touched).toBe(true);
  });

  it('Field wiring', async () => {
    const { input } = await setup();
    const field = input('fc').closest('[data-ds="field"]')!;
    expect(field.querySelector('label')!.htmlFor).toBe(input('fc').id);
    expect(input('fc').getAttribute('aria-describedby')).toBe(field.querySelector('[data-part="description"]')!.id);
    expect(input('fc').getAttribute('aria-required')).toBe('true');
    const errField = input('err').closest('[data-ds="field"]')!;
    expect((input('err').getAttribute('aria-describedby') ?? '').split(' ')).toEqual([
      errField.querySelector('[data-part="description"]')!.id,
      errField.querySelector('[data-part="error"]')!.id,
    ]);
    expect(input('err').getAttribute('aria-invalid')).toBe('true');
  });

  it('static inputs leave no attribute on the host', async () => {
    const { root, input } = await setup();
    expect(root('static').getAttributeNames().filter((n) => ['dscombobox', 'size', 'disabled', 'items', 'aria-label'].includes(n))).toEqual([]);
    expect(input('static').disabled).toBe(false);
  });
});

describe('Autocomplete QA', () => {
  it('FormControl and ngModel both ways, disable, touched, Field', async () => {
    const { host, input, settle, type } = await setup();
    host.afc.setValue('hello');
    await settle();
    expect(input('afc').value).toBe('hello');
    input('afc').focus();
    await type(input('afc'), 'Doh');
    expect(host.afc.value).toBe('Doh');
    input('afc').blur();
    await settle();
    expect(host.afc.touched).toBe(true);
    expect(input('angm').value).toBe('first');
    host.amodel = 'second';
    await settle();
    expect(input('angm').value).toBe('second');
    await type(input('angm'), 'third');
    expect(host.amodel).toBe('third');
    host.afc.disable();
    await settle();
    expect(input('afc').disabled).toBe(true);
    host.afc.enable();
    await settle();
    expect(input('afc').disabled).toBe(false);
    const field = input('afc').closest('[data-ds="field"]')!;
    expect(field.querySelector('label')!.htmlFor).toBe(input('afc').id);
    expect(input('afc').getAttribute('aria-required')).toBe('true');
  });
});
