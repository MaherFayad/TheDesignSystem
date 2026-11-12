import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsCheckbox } from '../checkbox/checkbox';
import { DsCheckboxGroup } from './checkbox-group';

@Component({
  imports: [DsCheckbox, DsCheckboxGroup, ReactiveFormsModule, FormsModule],
  template: `
    <fieldset data-test="parts" dsCheckboxGroup legend="Channels" description="Pick one or more." error="Pick at least one." aria-describedby="extra">
      <div dsCheckbox value="email" label="Email"></div>
      <div dsCheckbox value="push" label="Push"></div>
    </fieldset>
    <fieldset data-test="bound" dsCheckboxGroup legend="Bound" [(value)]="bound">
      <div dsCheckbox value="email" label="Email"></div>
      <div dsCheckbox value="push" label="Push"></div>
      <div dsCheckbox value="sms" label="Text"></div>
    </fieldset>
    <fieldset data-test="all" dsCheckboxGroup legend="All" selectAll="All channels" [defaultValue]="['email']">
      <div dsCheckbox value="email" label="Email"></div>
      <div dsCheckbox value="push" label="Push"></div>
      <div dsCheckbox value="sms" label="Text"></div>
    </fieldset>
    <fieldset data-test="axes" dsCheckboxGroup legend="Axes" size="lg" disabled orientation="horizontal">
      <div dsCheckbox value="email" label="Email"></div>
    </fieldset>
    <fieldset data-test="readonly" dsCheckboxGroup legend="Fixed" readOnly [defaultValue]="['email']">
      <div dsCheckbox value="email" label="Fixed email"></div>
    </fieldset>
    <fieldset data-test="valid" dsCheckboxGroup legend="Valid" error="Pick one." [invalid]="false">
      <div dsCheckbox value="email" label="Email"></div>
    </fieldset>
    <fieldset data-test="reactive" dsCheckboxGroup legend="Reactive" [formControl]="reactive">
      <div dsCheckbox value="email" label="Email"></div>
      <div dsCheckbox value="push" label="Push"></div>
    </fieldset>
    <fieldset data-test="template" dsCheckboxGroup legend="Template" [(ngModel)]="template">
      <div dsCheckbox value="email" label="Email"></div>
      <div dsCheckbox value="push" label="Push"></div>
    </fieldset>
    <form data-test="allform">
      <fieldset dsCheckboxGroup legend="All in a form" name="channels" selectAll="All channels">
        <div dsCheckbox value="a" label="A"></div>
        <div dsCheckbox value="b" label="B"></div>
      </fieldset>
    </form>
    <form>
      <fieldset data-test="inform" dsCheckboxGroup legend="In a form" name="channels" [defaultValue]="['push']">
        <div dsCheckbox value="email" label="Email"></div>
        <div dsCheckbox value="push" label="Push"></div>
      </fieldset>
    </form>
  `,
})
class Host {
  readonly bound = signal<readonly string[] | undefined>(['push']);
  readonly reactive = new FormControl<readonly string[]>(['push'], { nonNullable: true });
  template: readonly string[] = [];
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
  const boxes = (id: string) => [...root(id).querySelectorAll<HTMLButtonElement>('[role="checkbox"]')];
  const box = (id: string, name: string) => {
    const label = [...root(id).querySelectorAll('label')].find((l) => l.textContent === name);
    return root(id).querySelector<HTMLButtonElement>(`#${label?.getAttribute('for')}`) as HTMLButtonElement;
  };
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, root, boxes, box, settle };
}

describe('DsCheckboxGroup', () => {
  it('renders a fieldset with the parts in order, named by its legend', async () => {
    const { root, boxes } = await setup();
    const el = root('parts');
    expect(el.tagName).toBe('FIELDSET');
    expect(el.getAttribute('data-ds')).toBe('checkbox-group');
    expect([...el.children].map((c) => c.getAttribute('data-part'))).toEqual(['legend', 'description', 'items', 'error']);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-orientation')).toBe('vertical');
    expect(el.hasAttribute('data-invalid')).toBe(true);
    for (const name of ['dscheckboxgroup', 'legend', 'description', 'error', 'disabled']) expect(el.hasAttribute(name)).toBe(false);
    const ids = (el.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids.slice(0, 2).map((id) => document.getElementById(id)?.textContent)).toEqual(['Pick one or more.', 'Pick at least one.']);
    expect(ids[2]).toBe('extra');
    expect(el.querySelector('[data-part="error"] [data-icon="danger"]')).not.toBeNull();
    for (const b of boxes('parts')) expect(b.getAttribute('aria-invalid')).toBe('true');
  });

  it('keeps one value array and writes it back through [(value)]', async () => {
    const { host, box, settle } = await setup();
    expect(box('bound', 'Push').getAttribute('aria-checked')).toBe('true');
    box('bound', 'Email').click();
    await settle();
    expect(host.bound()).toEqual(['push', 'email']);
    box('bound', 'Push').click();
    await settle();
    expect(host.bound()).toEqual(['email']);
    host.bound.set(['sms']);
    await settle();
    expect(box('bound', 'Text').getAttribute('aria-checked')).toBe('true');
    expect(box('bound', 'Email').getAttribute('aria-checked')).toBe('false');
  });

  it('select all is indeterminate when some are checked, and checks or clears every item', async () => {
    const { root, box, boxes, settle } = await setup();
    const all = box('all', 'All channels');
    expect(all.closest('[data-ds="checkbox"]')?.getAttribute('data-part')).toBe('select-all');
    expect(all.closest('[data-part="items"]')).not.toBeNull();
    expect(all.getAttribute('aria-checked')).toBe('mixed');
    all.click();
    await settle();
    expect(all.getAttribute('aria-checked')).toBe('true');
    for (const b of boxes('all')) expect(b.getAttribute('aria-checked')).toBe('true');
    box('all', 'Push').click();
    await settle();
    expect(all.getAttribute('aria-checked')).toBe('mixed');
    box('all', 'Push').click();
    await settle();
    all.click();
    await settle();
    expect(all.getAttribute('aria-checked')).toBe('false');
    for (const b of boxes('all')) expect(b.getAttribute('aria-checked')).toBe('false');
    expect(root('all').querySelectorAll('[data-part="select-all"]').length).toBe(1);
  });

  it('passes size, disabled and orientation to the root and the items', async () => {
    const { root } = await setup();
    const el = root('axes');
    expect(el.hasAttribute('data-disabled')).toBe(true);
    expect(el.hasAttribute('disabled')).toBe(false);
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    const item = el.querySelector('[data-ds="checkbox"]') as HTMLElement;
    expect(item.getAttribute('data-size')).toBe('lg');
    expect(item.hasAttribute('data-disabled')).toBe(true);
    expect((item.querySelector('[role="checkbox"]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('read only keeps the value', async () => {
    const { root, box, settle } = await setup();
    box('readonly', 'Fixed email').click();
    await settle();
    expect(box('readonly', 'Fixed email').getAttribute('aria-checked')).toBe('true');
    expect(root('readonly').hasAttribute('data-readonly')).toBe(true);
  });

  it('hides the error when invalid is false', async () => {
    const { root } = await setup();
    expect(root('valid').querySelector('[data-part="error"]')).toBeNull();
    expect(root('valid').hasAttribute('data-invalid')).toBe(false);
    expect(root('valid').hasAttribute('aria-describedby')).toBe(false);
  });

  it('works with a reactive form control, both ways, and with its disabled state', async () => {
    const { host, box, settle } = await setup();
    expect(box('reactive', 'Push').getAttribute('aria-checked')).toBe('true');
    box('reactive', 'Email').click();
    await settle();
    expect(host.reactive.value).toEqual(['push', 'email']);
    host.reactive.setValue(['email']);
    await settle();
    expect(box('reactive', 'Push').getAttribute('aria-checked')).toBe('false');
    host.reactive.disable();
    await settle();
    expect(box('reactive', 'Email').disabled).toBe(true);
  });

  it('works with ngModel', async () => {
    const { host, box, settle } = await setup();
    box('template', 'Push').click();
    await settle();
    expect(host.template).toEqual(['push']);
  });

  it('inside a form, each item submits under the group name', async () => {
    const { root, settle } = await setup();
    await settle();
    const inputs = [...root('inform').querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
    expect(inputs.map((i) => i.name)).toEqual(['channels', 'channels']);
    expect(inputs.map((i) => i.checked)).toEqual([false, true]);
  });

  it('the select all box takes no group name, so select all posts only the items, as React', async () => {
    const { root, settle } = await setup();
    await settle();
    const form = root('allform') as HTMLFormElement;
    const all = form.querySelector<HTMLButtonElement>('[role="checkbox"]') as HTMLButtonElement;
    all.click();
    await settle();
    expect(new FormData(form).getAll('channels')).toEqual(['a', 'b']);
  });
});
