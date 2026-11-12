import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { afterEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { DsTagField } from './tag-field';

const suggestions = ['Design', 'Research', 'Copy', 'Bug', 'Onboarding'].map((label, i) => ({ value: `s${i}`, label }));

@Component({
  imports: [DsTagField, DsField, DsTheme, ReactiveFormsModule, FormsModule],
  template: `
    <div dsField label="Tags" description="Press Enter to add a tag.">
      <div data-test="tags" dsTagField [(value)]="tags" [suggestions]="suggestions" placeholder="Add a tag" name="tags"></div>
    </div>
    <div data-test="plain" dsTagField aria-label="Tags" size="lg" shape="pill" [max]="3" [defaultValue]="['Design']"></div>
    <div dsTheme lang="ar"><div data-test="ar" dsTagField aria-label="الوسوم" [defaultValue]="['تصميم']"></div></div>
    <div dsField label="Tags" disabled><div data-test="disabled" dsTagField [defaultValue]="['Design', 'Copy']"></div></div>
    <div dsField label="Tags" readOnly><div data-test="readonly" dsTagField [defaultValue]="['Design', 'Copy']"></div></div>
    <div data-test="reactive" dsTagField aria-label="Tags" [formControl]="form"></div>
    <div data-test="template" dsTagField aria-label="Tags" [(ngModel)]="model"></div>
  `,
})
class Host {
  readonly suggestions = suggestions;
  readonly tags = signal<readonly string[]>(['Design', 'Copy']);
  readonly form = new FormControl<string[]>(['Bug'], { nonNullable: true });
  model: string[] = [];
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
  const input = (id: string) => root(id).querySelector('input[data-part="control"]') as HTMLInputElement;
  const removes = (id: string) => Array.from(root(id).querySelectorAll<HTMLButtonElement>('[data-part="tag-remove"]'));
  const labels = (id: string) => Array.from(root(id).querySelectorAll('[data-part="tag-label"]')).map((n) => n.textContent);
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const key = async (target: Element, k: string) => {
    const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    await settle();
    return event;
  };
  const type = async (id: string, text: string) => {
    input(id).value = text;
    input(id).dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
  };
  const popup = () => document.querySelector('[data-menu-layer] [data-part="popup"]') as HTMLElement | null;
  return { fixture, host: fixture.componentInstance, root, input, removes, labels, settle, key, type, popup };
}

afterEach(() => {
  for (const el of Array.from(document.querySelectorAll('[data-menu-layer]'))) el.remove();
});

describe('DsTagField', () => {
  it('renders the root, the tags group, the remove buttons and the control', async () => {
    const { root, input, removes, labels } = await setup();
    const el = root('tags');
    expect(el.getAttribute('data-ds')).toBe('tag-field');
    expect(el.getAttribute('class')).toBe('');
    const group = el.querySelector('[data-part="tags"]') as HTMLElement;
    expect(group.getAttribute('role')).toBe('group');
    const field = el.closest('[data-ds="field"]') as HTMLElement;
    expect(group.getAttribute('aria-labelledby')).toBe(field.querySelector('label')?.id);
    expect(labels('tags')).toEqual(['Design', 'Copy']);
    const [first] = removes('tags');
    expect(first?.getAttribute('data-ds')).toBe('close-button');
    expect(first?.getAttribute('aria-label')).toBe('Remove tag Design');
    expect(first?.getAttribute('tabindex')).toBe('-1');
    const c = input('tags');
    expect(c.id).toBe(field.querySelector('label')?.getAttribute('for'));
    expect(c.getAttribute('role')).toBe('combobox');
    expect(c.getAttribute('aria-expanded')).toBe('false');
    expect(c.getAttribute('enterkeyhint')).toBe('enter');
    expect(input('plain').hasAttribute('role')).toBe(false);
    expect(Array.from(el.querySelectorAll<HTMLInputElement>('input[type="hidden"]')).map((i) => i.value)).toEqual(['Design', 'Copy']);
    expect(removes('ar')[0]?.getAttribute('aria-label')).toBe('حذف الوسم تصميم');
  });

  it('Enter adds the typed text and drops duplicates with the shared rule', async () => {
    const { host, key, input, type, root } = await setup();
    await type('tags', 'Search');
    const enter = await key(input('tags'), 'Enter');
    expect(enter.defaultPrevented).toBe(true);
    expect(host.tags()).toEqual(['Design', 'Copy', 'Search']);
    expect(input('tags').value).toBe('');
    await type('tags', 'design');
    await key(input('tags'), 'Enter');
    expect(host.tags()).toEqual(['Design', 'Copy', 'Search']);
    await new Promise((r) => setTimeout(r, 40));
    expect(root('tags').querySelector('[data-part="status"]')?.textContent).toBe('design is already added');
  });

  it('a refusal shows a FieldError after the root that the control points at, until the next add or removal, as React', async () => {
    const { key, input, type, root, removes } = await setup();
    const error = () => root('tags').nextElementSibling as HTMLElement | null;
    expect(error()?.getAttribute('data-ds')).not.toBe('field-error');
    await type('tags', 'design');
    await key(input('tags'), 'Enter');
    const p = error() as HTMLElement;
    expect(p.tagName).toBe('P');
    expect(p.getAttribute('data-ds')).toBe('field-error');
    expect(p.getAttribute('data-size')).toBe('md');
    expect(p.hasAttribute('data-part')).toBe(false);
    expect(p.hasAttribute('dsFieldError')).toBe(false);
    expect(p.querySelector('[data-part="message"]')?.textContent).toBe('design is already added');
    expect(input('tags').getAttribute('aria-describedby')?.split(' ')).toContain(p.id);
    removes('tags')[0]?.click();
    await key(input('tags'), 'Shift');
    expect(error()?.getAttribute('data-ds')).not.toBe('field-error');
    expect(input('tags').getAttribute('aria-describedby')?.split(' ')).not.toContain(p.id);
  });

  it('a comma or the Arabic comma adds the parts before it', async () => {
    const { host, input, type } = await setup();
    await type('tags', 'Alpha، Beta, Gam');
    expect(host.tags()).toEqual(['Design', 'Copy', 'Alpha', 'Beta']);
    expect(input('tags').value).toBe('Gam');
  });

  it('max keeps the extra text in the control', async () => {
    const { root, input, key, type, labels } = await setup();
    await type('plain', 'One, Two, Three');
    expect(labels('plain')).toEqual(['Design', 'One', 'Two']);
    expect(input('plain').value).toBe('Three');
    await key(input('plain'), 'Enter');
    expect(input('plain').value).toBe('Three');
    expect(root('plain').getAttribute('data-size')).toBe('lg');
  });

  it('suggestions filter, skip added tags, and an arrow then Enter adds one', async () => {
    const { host, input, key, type, popup } = await setup();
    await type('tags', 'o');
    const labels = Array.from(popup()?.querySelectorAll('[data-part="option-label"]') ?? []).map((n) => n.textContent);
    expect(labels).toEqual(['Onboarding']);
    expect(popup()?.getAttribute('data-ds')).toBe('tag-field');
    await key(input('tags'), 'ArrowDown');
    expect(document.getElementById(input('tags').getAttribute('aria-activedescendant') ?? '')?.textContent).toBe('Onboarding');
    await key(input('tags'), 'Enter');
    expect(host.tags()).toEqual(['Design', 'Copy', 'Onboarding']);
    expect(popup()).toBeNull();
  });

  it('Backspace on an empty control focuses the last remove button, Backspace there removes it', async () => {
    const { host, input, key, removes } = await setup();
    input('tags').focus();
    await key(input('tags'), 'Backspace');
    expect(document.activeElement).toBe(removes('tags')[1]);
    await key(removes('tags')[1] as HTMLElement, 'ArrowLeft');
    expect(document.activeElement).toBe(removes('tags')[0]);
    await key(removes('tags')[0] as HTMLElement, 'Delete');
    expect(host.tags()).toEqual(['Copy']);
    expect(document.activeElement).toBe(removes('tags')[0]);
  });

  it('a click on a remove button removes its tag', async () => {
    const { host, removes, settle } = await setup();
    removes('tags')[1]?.click();
    await settle();
    expect(host.tags()).toEqual(['Design']);
  });

  it('disabled and read only follow the Field', async () => {
    const { root, input, removes, settle, labels } = await setup();
    expect(input('disabled').disabled).toBe(true);
    expect(root('disabled').querySelector('[data-part="tags"]')?.getAttribute('aria-disabled')).toBe('true');
    expect(removes('disabled')[0]?.getAttribute('aria-disabled')).toBe('true');
    removes('disabled')[0]?.click();
    await settle();
    expect(labels('disabled')).toEqual(['Design', 'Copy']);
    expect(input('readonly').readOnly).toBe(true);
    expect(removes('readonly').length).toBe(0);
  });

  it('works with a reactive form control, both ways, and its disabled state', async () => {
    const { host, input, key, type, labels, settle } = await setup();
    expect(labels('reactive')).toEqual(['Bug']);
    await type('reactive', 'Fix');
    await key(input('reactive'), 'Enter');
    expect(host.form.value).toEqual(['Bug', 'Fix']);
    host.form.setValue(['Ship']);
    await settle();
    expect(labels('reactive')).toEqual(['Ship']);
    host.form.disable();
    await settle();
    expect(input('reactive').disabled).toBe(true);
  });

  it('works with ngModel', async () => {
    const { host, input, key, type } = await setup();
    await type('template', 'Notes');
    await key(input('template'), 'Enter');
    expect(host.model).toEqual(['Notes']);
  });
});

@Component({
  imports: [DsTagField, DsField],
  template: `
    <div dsField data-test="wired" label="Name" description="A hint." error="Fix this." required>
      <div dsTagField></div>
    </div>
    <div dsField data-test="own-id" label="Name">
      <div dsTagField id="own-control"></div>
    </div>
    <div dsField data-test="off" label="Name" disabled>
      <div dsTagField></div>
    </div>
  `,
})
class FieldWiringHost {
}

describe('DsTagField in a Field', () => {
  it('reads the Field as React useFieldControl does: id, describedby order, invalid, required, disabled', async () => {
    const fixture = TestBed.createComponent(FieldWiringHost);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const field = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
    const control = (id: string) => field(id).querySelector('input[data-part="control"]') as HTMLElement;

    const wired = field('wired');
    const label = wired.querySelector(':scope > label') as HTMLLabelElement;
    const description = wired.querySelector(':scope > [data-part="description"]') as HTMLElement;
    const error = wired.querySelector(':scope > [data-part="error"]') as HTMLElement;
    const c = control('wired');
    expect(c.id).not.toBe('');
    expect(label.getAttribute('for')).toBe(c.id);
    expect(c.getAttribute('aria-describedby')).toBe(`${description.id} ${error.id}`);
    expect(c.getAttribute('aria-invalid')).toBe('true');
    expect(c.getAttribute('aria-required')).toBe('true');

    // A control with an id of its own tells the Field, so the label points at it.
    expect(control('own-id').id).toBe('own-control');
    expect(field('own-id').querySelector(':scope > label')?.getAttribute('for')).toBe('own-control');
    expect(control('own-id').hasAttribute('aria-describedby')).toBe(false);
    expect(control('own-id').hasAttribute('aria-invalid')).toBe(false);
  });

  it('takes disabled from the Field', async () => {
    const fixture = TestBed.createComponent(FieldWiringHost);
    await fixture.whenStable();
    const c = fixture.nativeElement.querySelector('[data-test="off"] input[data-part="control"]') as HTMLButtonElement;
    expect(c.disabled).toBe(true);
    expect(c.closest('[data-ds="tag-field"]')?.hasAttribute('data-disabled')).toBe(true);
  });
});
