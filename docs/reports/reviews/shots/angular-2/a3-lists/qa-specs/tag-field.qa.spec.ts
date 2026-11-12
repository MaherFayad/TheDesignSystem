// QA probe (ds-qa angular-2 review): forms and Field wiring of TagField and ListBox. Temporary.
import { ChangeDetectorRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { afterEach, describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { DsListBox } from '../list-box/list-box';
import { sortOptions } from '../list-box/samples';
import { DsTagField } from './tag-field';

@Component({
  imports: [DsTagField, DsListBox, DsField, ReactiveFormsModule, FormsModule],
  template: `
    <div dsField label="Tags" description="Press Enter to add." required>
      <div data-test="fc" dsTagField [formControl]="fc"></div>
    </div>
    <div dsField label="Tags" description="Add." error="Add one.">
      <div data-test="err" dsTagField></div>
    </div>
    <div data-test="ngm" dsTagField aria-label="Tags" [(ngModel)]="model"></div>
    <div data-test="static" dsTagField aria-label="Tags" size="sm" disabled="false"></div>
    <div data-test="lb" dsListBox aria-label="Sort" [items]="sort" [formControl]="lfc"></div>
    <div data-test="lbm" dsListBox aria-label="Sort" [items]="sort" [(ngModel)]="lmodel"></div>
    <div data-test="lbstatic" dsListBox aria-label="Sort" [items]="sort" disabled="false" size="sm"></div>
  `,
})
class Host {
  readonly sort = sortOptions('en');
  readonly fc = new FormControl<string[]>([], { nonNullable: true, validators: Validators.required });
  readonly lfc = new FormControl<string | null>(null, Validators.required);
  model: string[] = ['one'];
  lmodel: string | null = 'name';
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
  const input = (id: string) => root(id).querySelector('input[data-part="control"]') as HTMLInputElement;
  const tags = (id: string) => Array.from(root(id).querySelectorAll('[data-part="tag-label"]')).map((t) => t.textContent);
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
  return { fixture, host: fixture.componentInstance, root, input, tags, settle, key, type };
}

afterEach(() => {
  for (const l of Array.from(document.querySelectorAll('[data-menu-layer]'))) l.remove();
});

describe('TagField QA', () => {
  it('FormControl and ngModel both ways', async () => {
    const { host, input, tags, settle, key, type } = await setup();
    host.fc.setValue(['a', 'b']);
    await settle();
    expect(tags('fc')).toEqual(['a', 'b']);
    input('fc').focus();
    await type(input('fc'), 'c');
    await key(input('fc'), 'Enter');
    expect(host.fc.value).toEqual(['a', 'b', 'c']);
    expect(host.fc.dirty).toBe(true);
    expect(tags('ngm')).toEqual(['one']);
    host.model = ['two'];
    await settle();
    expect(tags('ngm')).toEqual(['two']);
    await type(input('ngm'), 'three');
    await key(input('ngm'), 'Enter');
    expect(host.model).toEqual(['two', 'three']);
  });

  it('disable() and enable(), touched on blur', async () => {
    const { host, root, input, settle } = await setup();
    host.fc.setValue(['a']);
    host.fc.disable();
    await settle();
    expect(input('fc').disabled).toBe(true);
    expect(root('fc').hasAttribute('data-disabled')).toBe(true);
    expect(root('fc').querySelector('[data-part="tag-remove"]')!.getAttribute('aria-disabled')).toBe('true');
    host.fc.enable();
    await settle();
    expect(input('fc').disabled).toBe(false);
    expect(root('fc').hasAttribute('data-disabled')).toBe(false);
    input('fc').focus();
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
    expect(root('static').getAttributeNames().filter((n) => ['dstagfield', 'size', 'disabled', 'aria-label'].includes(n))).toEqual([]);
    expect(input('static').disabled).toBe(false);
  });
});

describe('ListBox QA', () => {
  it('FormControl and ngModel both ways, disable, touched', async () => {
    const { host, root, settle } = await setup();
    const opt = (id: string, label: string) =>
      Array.from(root(id).querySelectorAll<HTMLElement>('[role="option"]')).find((o) => o.textContent?.includes(label))!;
    host.lfc.setValue('owner');
    await settle();
    expect(opt('lb', 'Owner').getAttribute('aria-selected')).toBe('true');
    opt('lb', 'Name').click();
    await settle();
    expect(host.lfc.value).toBe('name');
    expect(opt('lbm', 'Name').getAttribute('aria-selected')).toBe('true');
    host.lmodel = 'owner';
    await settle();
    expect(opt('lbm', 'Owner').getAttribute('aria-selected')).toBe('true');
    opt('lbm', 'Date edited').click();
    await settle();
    expect(host.lmodel).toBe('edited');
    host.lfc.disable();
    await settle();
    expect(root('lb').getAttribute('aria-disabled')).toBe('true');
    expect(root('lb').hasAttribute('data-disabled')).toBe(true);
    host.lfc.enable();
    await settle();
    expect(root('lb').getAttribute('aria-disabled')).toBe(null);
    opt('lb', 'Name').focus();
    opt('lb', 'Name').dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    await settle();
    expect(host.lfc.touched).toBe(true);
    expect(root('lbstatic').getAttributeNames().filter((n) => ['dslistbox', 'size', 'disabled', 'items'].includes(n))).toEqual([]);
    expect(root('lbstatic').getAttribute('aria-disabled')).toBe(null);
  });
});
