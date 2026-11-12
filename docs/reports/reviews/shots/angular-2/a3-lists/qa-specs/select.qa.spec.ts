// QA probe (ds-qa angular-2 review): forms and Field wiring of Select. Temporary.
import { ChangeDetectorRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { afterEach, describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { sortOptions } from '../list-box/samples';
import { DsSelect } from './select';

@Component({
  imports: [DsSelect, DsField, ReactiveFormsModule, FormsModule],
  template: `
    <div dsField label="Sort by" description="Order of the board." required>
      <button data-test="fc" dsSelect [items]="sort" [formControl]="fc"></button>
    </div>
    <div dsField label="Sort by" description="Order." error="Choose one.">
      <button data-test="err" dsSelect [items]="sort"></button>
    </div>
    <input data-test="nat" [(ngModel)]="model" />
    <button data-test="ngm" dsSelect aria-label="Sort" [items]="sort" [(ngModel)]="model"></button>
    <button data-test="static" dsSelect aria-label="Sort" [items]="sort" disabled="false" size="sm"></button>
    <form [formGroup]="group"><button data-test="fcn" dsSelect aria-label="Sort" [items]="sort" formControlName="sort"></button></form>
  `,
})
class Host {
  readonly sort = sortOptions('en');
  readonly fc = new FormControl<string | null>(null, Validators.required);
  readonly group = new FormGroup({ sort: new FormControl<string | null>('owner') });
  model: string | null = 'name';
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLButtonElement;
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
  const items = () => Array.from(document.querySelectorAll<HTMLElement>('[data-menu-layer] [data-part="item"]'));
  return { fixture, host: fixture.componentInstance, el, settle, key, items };
}

afterEach(() => {
  for (const l of Array.from(document.querySelectorAll('[data-menu-layer]'))) l.remove();
});

describe('Select QA', () => {
  it('FormControl: model to view and view to model', async () => {
    const { host, el, settle, key, items } = await setup();
    expect(el('fc').hasAttribute('data-placeholder')).toBe(true);
    host.fc.setValue('owner');
    await settle();
    expect(el('fc').textContent).toContain('Owner');
    el('fc').focus();
    await key(el('fc'), 'Enter');
    const name = items().find((i) => i.textContent?.includes('Name'));
    name?.focus();
    await key(name!, 'Enter');
    expect(host.fc.value).toBe('name');
    expect(host.fc.dirty).toBe(true);
  });

  it('ngModel: model to view and view to model', async () => {
    const { host, el, settle, key, items } = await setup();
    await settle();
    expect(el('ngm').textContent).toContain('Name');
    host.model = 'owner';
    await settle();
    expect(el('ngm').textContent).toContain('Owner');
    el('ngm').focus();
    await key(el('ngm'), 'Enter');
    const edited = items().find((i) => i.textContent?.includes('Date edited'));
    edited?.focus();
    await key(edited!, 'Enter');
    expect(host.model).toBe('edited');
  });

  it('formControlName inside a FormGroup', async () => {
    const { host, el, settle } = await setup();
    expect(el('fcn').textContent).toContain('Owner');
    host.group.setValue({ sort: 'name' });
    await settle();
    expect(el('fcn').textContent).toContain('Name');
  });

  it('disable() and enable()', async () => {
    const { host, el, settle } = await setup();
    host.fc.disable();
    await settle();
    expect(el('fc').disabled).toBe(true);
    expect(el('fc').hasAttribute('data-disabled')).toBe(true);
    host.fc.enable();
    await settle();
    expect(el('fc').disabled).toBe(false);
    expect(el('fc').hasAttribute('data-disabled')).toBe(false);
  });

  it('touched on blur, and when the list opens', async () => {
    const { host, el, settle, key } = await setup();
    el('fc').focus();
    el('fc').blur();
    await settle();
    expect(host.fc.touched).toBe(true);
    host.fc.markAsUntouched();
    el('fc').focus();
    await key(el('fc'), 'Enter');
    // Records whether opening the list already marks the control touched (focus moves to an item).
    expect.soft(host.fc.touched, 'opening the list marks the control touched').toBe(false);
  });

  it('Field wiring', async () => {
    const { el, fixture } = await setup();
    const field = el('fc').closest('[data-ds="field"]')!;
    const label = field.querySelector('label')!;
    expect(label.htmlFor).toBe(el('fc').id);
    const desc = field.querySelector('[data-part="description"]')!;
    expect(el('fc').getAttribute('aria-describedby')).toBe(desc.id);
    expect(el('fc').getAttribute('aria-required')).toBe('true');
    const errField = el('err').closest('[data-ds="field"]')!;
    const ids = (el('err').getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids).toEqual([errField.querySelector('[data-part="description"]')!.id, errField.querySelector('[data-part="error"]')!.id]);
    expect(el('err').getAttribute('aria-invalid')).toBe('true');
    expect(el('err').hasAttribute('data-invalid')).toBe(true);
    // Validators.required on the FormControl does not reach aria-invalid (as React has no forms layer).
    expect(fixture.componentInstance.fc.invalid).toBe(true);
    expect.soft(el('fc').getAttribute('aria-invalid'), 'FormControl required error reaches aria-invalid').toBe(null);
  });

  it('static inputs leave no attribute on the host', async () => {
    const { el } = await setup();
    const names = el('static').getAttributeNames();
    expect(names).not.toContain('dsselect');
    expect(names).not.toContain('size');
    expect(names).not.toContain('items');
    expect.soft(el('static').disabled, 'static disabled="false"').toBe(false);
    expect(names.filter((n) => ['dsselect', 'size', 'disabled', 'aria-label'].includes(n) === false && !n.startsWith('data-') && !n.startsWith('aria-') && !['type', 'role', 'dir', 'id'].includes(n))).toEqual([]);
  });
});
