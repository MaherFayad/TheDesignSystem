// QA probe (ds-qa angular-2 review): forms and Field wiring of MultiSelect. Temporary.
import { ChangeDetectorRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { afterEach, describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { cityOptions } from '../list-box/samples';
import { DsMultiSelect } from './multi-select';

@Component({
  imports: [DsMultiSelect, DsField, ReactiveFormsModule, FormsModule],
  template: `
    <div dsField label="Cities" description="Pick a few." required>
      <div data-test="fc" dsMultiSelect [items]="gulf" [formControl]="fc"></div>
    </div>
    <div dsField label="Cities" description="Pick." error="Pick one.">
      <div data-test="err" dsMultiSelect [items]="gulf"></div>
    </div>
    <div data-test="ngm" dsMultiSelect aria-label="Cities" [items]="gulf" [(ngModel)]="model"></div>
    <div data-test="static" dsMultiSelect aria-label="Cities" [items]="gulf" size="sm" disabled="false"></div>
  `,
})
class Host {
  readonly gulf = cityOptions('en', 'gulf');
  readonly fc = new FormControl<string[]>([], { nonNullable: true, validators: Validators.required });
  model: string[] = ['doha'];
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const trigger = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
  const root = (id: string) => trigger(id).closest('[data-ds="multi-select"]') as HTMLElement;
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
  const options = () => Array.from(document.querySelectorAll<HTMLElement>('[data-menu-layer] [role="option"]'));
  return { fixture, host: fixture.componentInstance, trigger, root, settle, key, options };
}

afterEach(() => {
  for (const l of Array.from(document.querySelectorAll('[data-menu-layer]'))) l.remove();
});

describe('MultiSelect QA', () => {
  it('FormControl: model to view and view to model', async () => {
    const { host, trigger, settle, key, options } = await setup();
    host.fc.setValue(['dubai', 'doha']);
    await settle();
    expect(trigger('fc').textContent).toContain('Dubai');
    trigger('fc').focus();
    await key(trigger('fc'), 'Enter');
    const muscat = options().find((o) => o.textContent?.includes('Muscat'))!;
    muscat.click();
    await settle();
    expect(host.fc.value).toContain('muscat');
    expect(host.fc.dirty).toBe(true);
  });

  it('ngModel: model to view and view to model', async () => {
    const { host, trigger, settle, key, options } = await setup();
    await settle();
    expect(trigger('ngm').textContent).toContain('Doha');
    host.model = ['muscat'];
    await settle();
    expect(trigger('ngm').textContent).toContain('Muscat');
    trigger('ngm').focus();
    await key(trigger('ngm'), 'Enter');
    options().find((o) => o.textContent?.includes('Dubai'))!.click();
    await settle();
    expect(host.model).toEqual(expect.arrayContaining(['muscat', 'dubai']));
  });

  it('disable() and enable()', async () => {
    const { host, trigger, root, settle } = await setup();
    host.fc.disable();
    await settle();
    expect(trigger('fc').getAttribute('aria-disabled')).toBe('true');
    expect(root('fc').hasAttribute('data-disabled')).toBe(true);
    expect(trigger('fc').getAttribute('tabindex')).toBe('-1');
    host.fc.enable();
    await settle();
    expect(trigger('fc').getAttribute('aria-disabled')).toBe(null);
    expect(root('fc').hasAttribute('data-disabled')).toBe(false);
    expect(trigger('fc').getAttribute('tabindex')).toBe('0');
  });

  it('touched on blur, and when the list opens', async () => {
    const { host, trigger, settle, key } = await setup();
    trigger('fc').focus();
    trigger('fc').blur();
    await settle();
    expect(host.fc.touched).toBe(true);
    host.fc.markAsUntouched();
    trigger('fc').focus();
    await key(trigger('fc'), 'Enter');
    expect.soft(host.fc.touched, 'opening the list marks the control touched').toBe(false);
  });

  it('Field wiring', async () => {
    const { trigger } = await setup();
    const field = trigger('fc').closest('[data-ds="field"]')!;
    expect(field.querySelector('label')!.htmlFor).toBe(trigger('fc').id);
    expect(trigger('fc').getAttribute('aria-describedby')).toBe(field.querySelector('[data-part="description"]')!.id);
    expect(trigger('fc').getAttribute('aria-required')).toBe('true');
    const errField = trigger('err').closest('[data-ds="field"]')!;
    expect((trigger('err').getAttribute('aria-describedby') ?? '').split(' ')).toEqual([
      errField.querySelector('[data-part="description"]')!.id,
      errField.querySelector('[data-part="error"]')!.id,
    ]);
    expect(trigger('err').getAttribute('aria-invalid')).toBe('true');
  });

  it('static inputs leave no attribute on the host', async () => {
    const { trigger, root } = await setup();
    const names = [...root('static').getAttributeNames(), ...trigger('static').getAttributeNames()];
    expect(names.filter((n) => ['dsmultiselect', 'size', 'disabled', 'items'].includes(n))).toEqual([]);
    expect(trigger('static').getAttribute('aria-disabled')).toBe(null);
  });
});
