import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it, vi } from 'vitest';
import { DsInput } from './input';

@Component({
  imports: [DsInput, ReactiveFormsModule],
  template: `
    <div data-t="plain" dsInput aria-label="Board name"></div>
    <div data-t="full" dsInput size="lg" shape="pill" type="email" placeholder="name@example.com" name="email" autoComplete="email"
      start="search" end="USD" invalid required readOnly [(value)]="value"></div>
    <div data-t="disabled" dsInput disabled value="Design team"></div>
    <div data-t="template" dsInput [start]="tpl"></div>
    <ng-template #tpl><b>at</b></ng-template>
    <div data-t="number" dsInput type="number" aria-label="Width"></div>
    <div data-t="form" dsInput [formControl]="control"></div>
  `,
})
class Host {
  readonly value = signal<string | undefined>('sara@example.com');
  readonly control = new FormControl('first');
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`[data-t="${id}"]`) as HTMLElement;
  const native = (id: string) => q(id).querySelector('input') as HTMLInputElement;
  return { fixture, host: fixture.componentInstance, q, native };
}

describe('DsInput', () => {
  it('renders the box and the native control with the defaults', async () => {
    const { q, native } = await setup();
    const el = q('plain');
    expect(el.getAttribute('data-ds')).toBe('input');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-shape')).toBe('default');
    expect(el.hasAttribute('aria-label')).toBe(false);
    expect(el.hasAttribute('dsinput')).toBe(false);
    const input = native('plain');
    expect(input.getAttribute('data-part')).toBe('control');
    expect(input.getAttribute('type')).toBe('text');
    expect(input.getAttribute('aria-label')).toBe('Board name');
    expect(input.hasAttribute('value')).toBe(false);
  });

  it('maps every input to the box or the native control', async () => {
    const { q, native } = await setup();
    const el = q('full');
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.getAttribute('data-shape')).toBe('pill');
    expect(el.getAttribute('data-invalid')).toBe('');
    expect(el.getAttribute('data-readonly')).toBe('');
    const input = native('full');
    expect(input.type).toBe('email');
    expect(input.placeholder).toBe('name@example.com');
    expect(input.name).toBe('email');
    expect(input.getAttribute('autocomplete')).toBe('email');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.hasAttribute('required')).toBe(false);
    expect(input.readOnly).toBe(true);
    const parts = Array.from(el.children).map((c) => c.getAttribute('data-part'));
    expect(parts).toEqual(['start', 'control', 'end']);
    expect(el.querySelector('[data-part="start"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('[data-part="start"] svg')?.getAttribute('data-icon')).toBe('search');
    expect(el.querySelector('[data-part="end"]')?.textContent?.trim()).toBe('USD');
  });

  it('takes a template adornment without aria-hidden', async () => {
    const { q } = await setup();
    const start = q('template').querySelector('[data-part="start"]') as HTMLElement;
    expect(start.hasAttribute('aria-hidden')).toBe(false);
    expect(start.querySelector('b')?.textContent).toBe('at');
  });

  it('binds the value both ways', async () => {
    const { fixture, host, native } = await setup();
    const input = native('full');
    expect(input.value).toBe('sara@example.com');
    input.value = 'omar@example.com';
    input.dispatchEvent(new Event('input'));
    expect(host.value()).toBe('omar@example.com');
    host.value.set('lina@example.com');
    await fixture.whenStable();
    expect(input.value).toBe('lina@example.com');
  });

  it('disables the native input and keeps the value attribute', async () => {
    const { q, native } = await setup();
    expect(q('disabled').getAttribute('data-disabled')).toBe('');
    expect(native('disabled').disabled).toBe(true);
    expect(native('disabled').getAttribute('value')).toBe('Design team');
  });

  it('works with reactive forms', async () => {
    const { fixture, host, q, native } = await setup();
    const input = native('form');
    expect(input.value).toBe('first');
    input.value = 'second';
    input.dispatchEvent(new Event('input'));
    expect(host.control.value).toBe('second');
    host.control.setValue('third');
    host.control.disable();
    await fixture.whenStable();
    expect(input.value).toBe('third');
    expect(input.disabled).toBe(true);
    expect(q('form').getAttribute('data-disabled')).toBe('');
    input.dispatchEvent(new Event('blur'));
    expect(host.control.touched).toBe(true);
  });

  it('focuses the native input on a press on the box', async () => {
    const { q, native } = await setup();
    const box = q('plain');
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    box.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(native('plain'));
  });

  it('does not wipe a half typed number the browser reads as empty', async () => {
    const { fixture, native } = await setup();
    const input = native('number');
    input.value = '1';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    const write = vi.spyOn(input, 'value', 'set');
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(write).not.toHaveBeenCalled();
  });
});
