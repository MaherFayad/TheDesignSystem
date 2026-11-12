import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { DsInput } from '../input/input';
import { DsLabel } from './label';

@Component({
  imports: [DsLabel, DsField, DsInput, DsTheme],
  template: `
    <label id="plain" dsLabel for="a">Board name</label>
    <label id="small" dsLabel htmlFor="b" size="sm" [disabled]="disabled()" invalid>Width</label>
    <label id="required" dsLabel for="c" required>Email</label>
    <label id="word" dsLabel required requiredText="needed">Email</label>
    <label id="optional" dsLabel optional="Optional">Company</label>
    <label id="both" dsLabel optional="Optional" required>Company</label>
    <div dsTheme [lang]="'ar'"><label id="arabic" dsLabel required>البريد</label></div>
    <div dsField required disabled>
      <label id="in-field" dsLabel>Plain label in a field</label>
      <label id="field-label" dsFieldLabel>Field label</label>
      <div dsInput></div>
    </div>
  `,
})
class Host {
  readonly disabled = signal(true);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

describe('DsLabel', () => {
  it('renders a native label with the React attributes only', async () => {
    const { q } = await setup();
    const el = q('plain');
    expect(el.tagName).toBe('LABEL');
    expect(el.getAttribute('data-ds')).toBe('label');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('for')).toBe('a');
    expect(el.hasAttribute('dslabel')).toBe(false);
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(el.textContent?.trim()).toBe('Board name');
  });

  it('maps size, disabled, invalid and htmlFor', async () => {
    const { fixture, host, q } = await setup();
    const el = q('small');
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.getAttribute('for')).toBe('b');
    expect(el.hasAttribute('htmlfor')).toBe(false);
    expect(el.getAttribute('data-disabled')).toBe('');
    expect(el.getAttribute('data-invalid')).toBe('');
    host.disabled.set(false);
    await fixture.whenStable();
    expect(el.hasAttribute('data-disabled')).toBe(false);
  });

  it('adds the required mark and a hidden word outside a field', async () => {
    const { q } = await setup();
    const mark = q('required').querySelector('[data-part="required"]') as HTMLElement;
    expect(mark.hasAttribute('aria-hidden')).toBe(false);
    expect(mark.children[0]?.getAttribute('aria-hidden')).toBe('true');
    expect(mark.children[0]?.textContent).toBe('*');
    expect(mark.children[1]?.textContent).toBe(' required');
    expect(mark.children[1]?.getAttribute('style')).toContain('position: absolute');
    expect(q('word').querySelector('[data-part="required"]')?.textContent).toBe('* needed');
    expect(q('arabic').querySelector('[data-part="required"]')?.textContent).toBe('* مطلوب');
  });

  it('shows optional text after a space, never next to required', async () => {
    const { q } = await setup();
    expect(q('optional').querySelector('[data-part="optional"]')?.textContent?.trim()).toBe('Optional');
    expect(q('optional').textContent?.replace(/\s+/g, ' ').trim()).toBe('Company Optional');
    expect(q('both').querySelector('[data-part="optional"]')).toBeNull();
  });

  it('follows the field state, and the FieldLabel form takes the ids', async () => {
    const { fixture, q } = await setup();
    const plain = q('in-field');
    expect(plain.getAttribute('data-disabled')).toBe('');
    expect(plain.hasAttribute('id')).toBe(true);
    expect(plain.hasAttribute('data-part')).toBe(false);
    expect(plain.querySelector('[data-part="required"]')?.getAttribute('aria-hidden')).toBe('true');
    const label = q('field-label');
    const control = fixture.nativeElement.querySelector('[data-part="control"]') as HTMLInputElement;
    expect(label.getAttribute('data-part')).toBe('label');
    expect(label.getAttribute('for')).toBe(control.id);
    expect(control.getAttribute('aria-required')).toBe('true');
  });
});
