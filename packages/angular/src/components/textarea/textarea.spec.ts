import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { DsTextarea } from './textarea';

@Component({
  imports: [DsTextarea, DsField, DsTheme, ReactiveFormsModule],
  template: `
    <div data-t="plain" dsTextarea aria-label="Notes"></div>
    <div data-t="limit" dsTextarea [limit]="20" [maxRows]="6" size="sm" [(value)]="value"></div>
    <div data-t="fixed" dsTextarea [autoHeight]="false" [rows]="4" [showCount]="true" value="Hi"></div>
    <div dsTheme [lang]="'ar'"><div data-t="arabic" dsTextarea [limit]="200" value="مسودة"></div></div>
    <div dsField label="Summary" disabled><div data-t="field" dsTextarea></div></div>
    <div data-t="form" dsTextarea [formControl]="control"></div>
  `,
})
class Host {
  readonly value = signal<string | undefined>('Short');
  readonly control = new FormControl('first');
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`[data-t="${id}"]`) as HTMLElement;
  const native = (id: string) => q(id).querySelector('textarea') as HTMLTextAreaElement;
  const live = (id: string) => q(id).querySelector('[aria-live]') as HTMLElement;
  return { fixture, host: fixture.componentInstance, q, native, live };
}

async function type(fixture: { whenStable(): Promise<unknown> }, el: HTMLTextAreaElement, text: string) {
  el.value = text;
  el.dispatchEvent(new Event('input'));
  await fixture.whenStable();
}

describe('DsTextarea', () => {
  it('renders the defaults: 3 rows, auto height, no count', async () => {
    const { q, native, live } = await setup();
    const el = q('plain');
    expect(el.getAttribute('data-ds')).toBe('textarea');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-shape')).toBe('default');
    expect(el.getAttribute('data-auto-height')).toBe('');
    expect(el.getAttribute('style')).toBe('--_textarea-rows: 3;');
    expect(native('plain').getAttribute('rows')).toBe('3');
    expect(native('plain').getAttribute('data-part')).toBe('control');
    expect(native('plain').getAttribute('aria-label')).toBe('Notes');
    expect(el.querySelector('[data-part="count"]')).toBeNull();
    expect(live('plain').getAttribute('aria-live')).toBe('polite');
    expect(live('plain').hasAttribute('data-part')).toBe(false);
  });

  it('counts against the limit and links the count', async () => {
    const { q, native } = await setup();
    const el = q('limit');
    expect(el.getAttribute('style')).toBe('--_textarea-rows: 3; --_textarea-max-rows: 6;');
    const count = el.querySelector('[data-part="count"]') as HTMLElement;
    expect(count.children[0]?.textContent).toBe('5/20');
    expect(count.children[1]?.textContent).toBe('5 of 20 characters');
    expect(native('limit').getAttribute('aria-describedby')).toBe(count.id);
  });

  it('turns invalid past the limit and announces only on a zone change', async () => {
    const { fixture, host, q, native, live } = await setup();
    const el = q('limit');
    await type(fixture, native('limit'), 'Twelve chars');
    expect(live('limit').textContent).toBe('8 characters left');
    expect(host.value()).toBe('Twelve chars');
    await type(fixture, native('limit'), 'Thirteen char');
    expect(live('limit').textContent).toBe('8 characters left');
    await type(fixture, native('limit'), 'Twenty one characters');
    expect(live('limit').textContent).toBe('1 character over the limit');
    expect(el.getAttribute('data-over')).toBe('');
    expect(el.getAttribute('data-invalid')).toBe('');
    expect(native('limit').getAttribute('aria-invalid')).toBe('true');
    await type(fixture, native('limit'), 'Ok');
    expect(live('limit').textContent).toBe('');
    expect(el.hasAttribute('data-over')).toBe(false);
  });

  it('counts emoji as one character and speaks Arabic in an Arabic theme', async () => {
    const { fixture, q, native } = await setup();
    await type(fixture, native('fixed'), 'Hi 👋');
    expect(q('fixed').querySelector('[data-part="count"] [aria-hidden]')?.textContent).toBe('4');
    expect(q('arabic').querySelector('[data-part="count"]')?.textContent).toContain('5 من 200 حرف');
  });

  it('keeps rows with a resize handle when auto height is off', async () => {
    const { q, native } = await setup();
    expect(q('fixed').hasAttribute('data-auto-height')).toBe(false);
    expect(native('fixed').getAttribute('rows')).toBe('4');
    expect(native('fixed').value).toBe('Hi');
    expect(native('fixed').textContent).toBe('Hi');
  });

  it('follows the field and works with reactive forms', async () => {
    const { fixture, host, q, native } = await setup();
    expect(q('field').getAttribute('data-disabled')).toBe('');
    expect(native('field').disabled).toBe(true);
    expect(native('form').value).toBe('first');
    await type(fixture, native('form'), 'second');
    expect(host.control.value).toBe('second');
    host.control.disable();
    await fixture.whenStable();
    expect(native('form').disabled).toBe(true);
  });
});
