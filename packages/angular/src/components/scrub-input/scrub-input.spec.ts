import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { DsScrubInput } from './scrub-input';

@Component({
  imports: [DsScrubInput, DsField, DsTheme, ReactiveFormsModule],
  template: `
    <div data-t="width" dsScrubInput label="W" aria-label="Width" unit="px" [min]="0" [(value)]="width" (changeEnd)="ends.push($event)"></div>
    <div data-t="text" dsScrubInput label="X" [value]="-12.5"></div>
    <div data-t="icon" dsScrubInput label="refresh" aria-label="Rotation" [value]="45" unit="deg"></div>
    <div data-t="mixed" dsScrubInput label="H" aria-label="Height" mixed unit="px"></div>
    <div dsField label="Width" description="Drag the letter." error="Enter a width of 1 px or more." required>
      <div data-t="field" dsScrubInput label="W" [value]="0" unit="px"></div>
    </div>
    <div data-t="readonly" dsScrubInput label="W" aria-label="Width" [value]="320" readOnly></div>
    <div data-t="disabled" dsScrubInput label="W" aria-label="Width" [value]="320" disabled></div>
    <div dsTheme lang="ar">
      <div data-t="arabic" dsScrubInput label="ع" aria-label="العرض" [(value)]="arabic" unit="px"></div>
    </div>
    <div data-t="form" dsScrubInput label="W" aria-label="Width" [formControl]="control"></div>
  `,
})
class Host {
  readonly width = signal<number | null | undefined>(320);
  readonly arabic = signal<number | null | undefined>(10);
  readonly control = new FormControl<number | null>(100);
  ends: number[] = [];
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`[data-t="${id}"]`) as HTMLElement;
  const native = (id: string) => q(id).querySelector('input') as HTMLInputElement;
  const part = (id: string, name: string) => q(id).querySelector(`[data-part="${name}"]`) as HTMLElement | null;
  const key = async (id: string, k: string, init: KeyboardEventInit = {}) => {
    native(id).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
    await fixture.whenStable();
  };
  const type = async (id: string, text: string) => {
    native(id).value = text;
    native(id).dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const pointer = async (id: string, type: string, clientX: number) => {
    const event = new MouseEvent(type, { button: 0, clientX, bubbles: true, cancelable: true });
    Object.defineProperty(event, 'pointerId', { value: 1 });
    part(id, 'label')!.dispatchEvent(event);
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, q, native, part, key, type, pointer };
}

describe('DsScrubInput', () => {
  it('renders the handle, the control and the unit, as React does', async () => {
    const { q, native, part } = await setup();
    const el = q('width');
    expect(el.getAttribute('data-ds')).toBe('scrub-input');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('dsscrubinput')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['label', 'control', 'unit']);
    expect(part('width', 'label')!.getAttribute('aria-hidden')).toBe('true');
    const input = native('width');
    expect(input.value).toBe('320');
    expect(input.getAttribute('value')).toBe('320');
    expect(input.getAttribute('inputmode')).toBe('text');
    expect(input.getAttribute('aria-label')).toBe('Width');
    expect(input.getAttribute('aria-describedby')).toBe(part('width', 'unit')!.id);
    expect(native('text').getAttribute('aria-label')).toBe('X');
    expect(native('icon').hasAttribute('aria-label')).toBe(true);
    expect(part('icon', 'label')!.querySelector('svg')).not.toBeNull();
  });

  it('nudges with the arrow keys, Shift ten steps and Alt a tenth', async () => {
    const { host, native, key } = await setup();
    await key('width', 'ArrowUp');
    expect(host.width()).toBe(321);
    await key('width', 'ArrowUp', { shiftKey: true });
    expect(host.width()).toBe(331);
    await key('width', 'ArrowDown', { altKey: true });
    expect(host.width()).toBe(330.9);
    expect(native('width').value).toBe('330.9');
    expect(host.ends).toEqual([321, 331, 330.9]);
  });

  it('commits a typed expression on Enter, reverts on Escape and keeps the old value for text it cannot read', async () => {
    const { fixture, host, native, key, type } = await setup();
    await type('width', '12*2');
    await key('width', 'Enter');
    expect(host.width()).toBe(24);
    await type('width', '99');
    await key('width', 'Escape');
    expect(native('width').value).toBe('24');
    await type('width', 'auto');
    native('width').dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(host.width()).toBe(24);
    expect(native('width').value).toBe('24');
    await type('width', '-5px');
    await key('width', 'Enter');
    expect(host.width()).toBe(0);
  });

  it('scrubs with a drag on the handle and ends once', async () => {
    const { host, pointer, q } = await setup();
    await pointer('width', 'pointerdown', 100);
    await pointer('width', 'pointermove', 110);
    expect(q('width').getAttribute('data-dragging')).toBe('');
    expect(host.width()).toBe(330);
    await pointer('width', 'pointerup', 115);
    expect(host.width()).toBe(335);
    expect(q('width').hasAttribute('data-dragging')).toBe(false);
    expect(host.ends).toEqual([335]);
  });

  it('flips the drag in RTL and reads Arabic Indic digits', async () => {
    const { host, native, pointer, key, type, q } = await setup();
    expect(q('arabic').closest('[dir]')?.getAttribute('dir')).toBe('rtl');
    const style = getComputedStyle(q('arabic'));
    if (style.direction === 'rtl') {
      await pointer('arabic', 'pointerdown', 100);
      await pointer('arabic', 'pointermove', 95);
      await pointer('arabic', 'pointerup', 90);
      expect(host.arabic()).toBe(20);
    }
    await type('arabic', '١٢');
    await key('arabic', 'Enter');
    expect(host.arabic()).toBe(12);
    expect(native('arabic').value).toBe('12');
  });

  it('shows the mixed word and waits for a typed value', async () => {
    const { q, native, key } = await setup();
    expect(q('mixed').getAttribute('data-mixed')).toBe('');
    expect(native('mixed').value).toBe('');
    expect(native('mixed').placeholder).toBe('Mixed');
    await key('mixed', 'ArrowUp');
    expect(native('mixed').value).toBe('');
  });

  it('wires a Field: label for, aria-describedby with the unit, aria-invalid and no aria-label', async () => {
    const { native, part } = await setup();
    const input = native('field');
    const field = input.closest('[data-ds="field"]') as HTMLElement;
    const label = field.querySelector('label') as HTMLLabelElement;
    const description = field.querySelector('[data-part="description"]') as HTMLElement;
    const error = field.querySelector('[data-part="error"]') as HTMLElement;
    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.hasAttribute('aria-label')).toBe(false);
    expect(input.getAttribute('aria-describedby')).toBe(`${description.id} ${error.id} ${part('field', 'unit')!.id}`);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('stays still while read only and marks the whole field disabled', async () => {
    const { q, native, key } = await setup();
    await key('readonly', 'ArrowUp');
    expect(native('readonly').value).toBe('320');
    expect(native('readonly').readOnly).toBe(true);
    expect(q('readonly').getAttribute('data-readonly')).toBe('');
    expect(q('disabled').getAttribute('aria-disabled')).toBe('true');
    expect(q('disabled').getAttribute('data-disabled')).toBe('');
    expect(native('disabled').disabled).toBe(true);
  });

  it('works with reactive forms', async () => {
    const { fixture, host, native, key } = await setup();
    expect(native('form').value).toBe('100');
    await key('form', 'ArrowDown');
    expect(host.control.value).toBe(99);
    host.control.setValue(7.125);
    await fixture.whenStable();
    expect(native('form').value).toBe('7.13');
    host.control.disable();
    await fixture.whenStable();
    expect(native('form').disabled).toBe(true);
  });
});
