import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsInlineEdit } from './inline-edit';

const required = (value: string) => (value.trim() === '' ? 'Add a name of at least 1 letter.' : undefined);

@Component({
  imports: [DsInlineEdit],
  template: `
    <div data-t="name" dsInlineEdit label="Board name" [(value)]="name" [validate]="required" (editingChange)="editing.push($event)"></div>
    <div data-t="empty" dsInlineEdit label="Board name" placeholder="Add a board name"></div>
    <div data-t="open" dsInlineEdit label="Board name" value="Spring launch" defaultEditing error="A board with this name exists."></div>
    <div data-t="disabled" dsInlineEdit label="Board name" value="Spring launch" disabled></div>
  `,
})
class Host {
  readonly name = signal('Spring launch');
  readonly required = required;
  editing: boolean[] = [];
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`[data-t="${id}"]`) as HTMLElement;
  const part = (id: string, name: string) => q(id).querySelector(`[data-part="${name}"]`) as HTMLElement;
  const input = (id: string) => q(id).querySelector('input') as HTMLInputElement;
  return { fixture, host: fixture.componentInstance, q, part, input };
}

async function type(fixture: { whenStable(): Promise<unknown> }, el: HTMLInputElement, text: string) {
  el.value = text;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  await fixture.whenStable();
}

const press = (el: Element, key: string) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event;
};

describe('DsInlineEdit', () => {
  it('shows the value in a ghost display button with a full name', async () => {
    const { q, part } = await setup();
    const el = q('name');
    expect(el.getAttribute('data-ds')).toBe('inline-edit');
    expect(el.getAttribute('data-state')).toBe('viewing');
    expect(el.getAttribute('data-size')).toBe('md');
    const display = part('name', 'display');
    expect(display.getAttribute('data-ds')).toBe('button');
    expect(display.getAttribute('data-emphasis')).toBe('ghost');
    expect(display.getAttribute('aria-label')).toBe('Spring launch, Edit board name');
    expect(display.textContent?.trim()).toBe('Spring launch');
    expect(part('name', 'status').getAttribute('role')).toBe('status');
  });

  it('shows the placeholder when empty', async () => {
    const { q, part } = await setup();
    expect(q('empty').getAttribute('data-empty')).toBe('');
    expect(part('empty', 'display').textContent?.trim()).toBe('Add a board name');
  });

  it('starts editing with the text selected, saves on Enter and returns focus', async () => {
    const { fixture, host, q, part, input } = await setup();
    part('name', 'display').click();
    await fixture.whenStable();
    expect(q('name').getAttribute('data-state')).toBe('editing');
    expect(Array.from(q('name').children).map((c) => c.getAttribute('data-part'))).toEqual(['control', 'save', 'cancel', 'status']);
    expect(document.activeElement).toBe(input('name'));
    expect(input('name').getAttribute('aria-label')).toBe('Board name');
    await type(fixture, input('name'), 'Brand refresh');
    press(input('name'), 'Enter');
    await fixture.whenStable();
    expect(host.name()).toBe('Brand refresh');
    expect(host.editing).toEqual([true, false]);
    expect(part('name', 'status').textContent).toBe('Saved');
    expect(document.activeElement).toBe(part('name', 'display'));
  });

  it('stays open when the removed display button fires focusout, as Chromium does on Enter', async () => {
    const { fixture, q, part, input } = await setup();
    const display = part('name', 'display');
    display.focus();
    display.click();
    // The display is still in the DOM until the next render: Chromium fires focusout on it then, with no relatedTarget.
    display.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    await fixture.whenStable();
    expect(q('name').getAttribute('data-state')).toBe('editing');
    expect(document.activeElement).toBe(input('name'));
  });

  it('cancels on Escape and keeps the value', async () => {
    const { fixture, host, q, part, input } = await setup();
    part('name', 'display').click();
    await fixture.whenStable();
    await type(fixture, input('name'), 'Draft');
    const event = press(input('name'), 'Escape');
    await fixture.whenStable();
    expect(event.defaultPrevented).toBe(true);
    expect(host.name()).toBe('Spring launch');
    expect(q('name').getAttribute('data-state')).toBe('viewing');
  });

  it('never saves an invalid value and links the message', async () => {
    const { fixture, host, q, part, input } = await setup();
    part('name', 'display').click();
    await fixture.whenStable();
    await type(fixture, input('name'), ' ');
    part('name', 'save').click();
    await fixture.whenStable();
    expect(host.name()).toBe('Spring launch');
    expect(q('name').getAttribute('data-state')).toBe('editing');
    expect(q('name').getAttribute('data-invalid')).toBe('');
    const error = part('name', 'error');
    expect(error.textContent?.trim()).toBe('Add a name of at least 1 letter.');
    expect(input('name').getAttribute('aria-describedby')).toBe(error.id);
    expect(input('name').getAttribute('aria-invalid')).toBe('true');
    await type(fixture, input('name'), 'Fixed');
    expect(part('name', 'error')).toBeNull();
  });

  it('opens with an outside error and does not take focus', async () => {
    const { q, part, input } = await setup();
    expect(q('open').getAttribute('data-state')).toBe('editing');
    expect(input('open').value).toBe('Spring launch');
    expect(document.activeElement).not.toBe(input('open'));
    expect(part('open', 'error').textContent?.trim()).toBe('A board with this name exists.');
  });

  it('keeps a disabled display focusable with aria-disabled', async () => {
    const { fixture, q, part } = await setup();
    const display = part('disabled', 'display');
    expect(q('disabled').getAttribute('data-disabled')).toBe('');
    expect(display.getAttribute('aria-disabled')).toBe('true');
    expect(display.hasAttribute('disabled')).toBe(false);
    display.click();
    await fixture.whenStable();
    expect(q('disabled').getAttribute('data-state')).toBe('viewing');
  });
});
