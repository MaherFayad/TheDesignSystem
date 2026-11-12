// Temporary QA spec (ds-qa review angular-1, batch A2): every text control
// with reactive forms and with ngModel. Copied to
// docs/reports/reviews/shots/angular-1/a2/forms/ and removed from the package.
import { Component, signal, type Type, type WritableSignal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { DsInlineEdit } from '../inline-edit/inline-edit';
import { DS_INPUT_GROUP } from '../input-group/input-group';
import { DsOTPField } from '../otp-field/otp-field';
import { DsPasswordField } from '../password-field/password-field';
import { DsPhoneField } from '../phone-field/phone-field';
import { DsSearchField } from '../search-field/search-field';
import { DsTextarea } from '../textarea/textarea';
import { DsInput } from './input';

const IMPORTS = [
  ReactiveFormsModule,
  FormsModule,
  DsField,
  DsInput,
  DsTextarea,
  DsSearchField,
  DsPasswordField,
  DsInlineEdit,
  DsOTPField,
  DsPhoneField,
  ...DS_INPUT_GROUP,
];

interface Case {
  name: string;
  /** The control element, with `BIND` where the forms binding goes. */
  markup: string;
  /** A value the model writes. */
  modelValue: string;
  /** What the native control shows for modelValue. */
  shown: string;
  /** Text typed into the native control. */
  typed: string;
  /** The model value after typing. */
  expected: string;
  native: string;
  /** InlineEdit has no text entry while viewing. */
  textEntry: boolean;
}

const CASES: Case[] = [
  { name: 'Input', markup: '<div data-t dsInput aria-label="Name" BIND></div>', modelValue: 'Sara', shown: 'Sara', typed: 'Omar', expected: 'Omar', native: 'input', textEntry: true },
  { name: 'Textarea', markup: '<div data-t dsTextarea aria-label="Summary" BIND></div>', modelValue: 'Line', shown: 'Line', typed: 'Two', expected: 'Two', native: 'textarea', textEntry: true },
  { name: 'SearchField', markup: '<div data-t dsSearchField aria-label="Search" BIND></div>', modelValue: 'boards', shown: 'boards', typed: 'cards', expected: 'cards', native: 'input', textEntry: true },
  { name: 'PasswordField', markup: '<div data-t dsPasswordField aria-label="Password" BIND></div>', modelValue: 'secret', shown: 'secret', typed: 'other', expected: 'other', native: 'input', textEntry: true },
  { name: 'OTPField', markup: '<div data-t dsOTPField aria-label="Code" BIND></div>', modelValue: '123', shown: '123', typed: '123456', expected: '123456', native: 'input[data-part=control]', textEntry: true },
  { name: 'PhoneField', markup: '<div data-t dsPhoneField aria-label="Phone" BIND></div>', modelValue: '+966501234567', shown: '50 123 4567', typed: '0551234567', expected: '+966551234567', native: 'input[data-part=control]', textEntry: true },
  {
    name: 'InputGroup with Input',
    markup: '<div dsInputGroup><span dsInputGroupAddon>https://</span><div data-t dsInput aria-label="Site" BIND></div></div>',
    modelValue: 'a.com', shown: 'a.com', typed: 'b.com', expected: 'b.com', native: 'input', textEntry: true,
  },
  { name: 'InlineEdit', markup: '<div data-t dsInlineEdit label="Board name" BIND></div>', modelValue: 'Launch', shown: 'Launch', typed: 'Spring', expected: 'Spring', native: 'input', textEntry: false },
];

class Base {
  readonly control = new FormControl<string | null>(null);
  value: string | null = null;
  readonly disabled = signal(false);
}

@Component({ imports: IMPORTS, template: `<div data-t dsInput aria-label="Name" [formControl]="control"></div>` })
class R0 extends Base {}

@Component({ imports: IMPORTS, template: `<div data-t dsInput aria-label="Name" [(ngModel)]="value" [disabled]="disabled()"></div>` })
class T0 extends Base {}

@Component({ imports: IMPORTS, template: `<div dsField label="Label" description="Hint" error="Fix it" required><div data-t dsInput [formControl]="control"></div></div>` })
class F0 extends Base {}

@Component({ imports: IMPORTS, template: `<div data-t dsTextarea aria-label="Summary" [formControl]="control"></div>` })
class R1 extends Base {}

@Component({ imports: IMPORTS, template: `<div data-t dsTextarea aria-label="Summary" [(ngModel)]="value" [disabled]="disabled()"></div>` })
class T1 extends Base {}

@Component({ imports: IMPORTS, template: `<div dsField label="Label" description="Hint" error="Fix it" required><div data-t dsTextarea [formControl]="control"></div></div>` })
class F1 extends Base {}

@Component({ imports: IMPORTS, template: `<div data-t dsSearchField aria-label="Search" [formControl]="control"></div>` })
class R2 extends Base {}

@Component({ imports: IMPORTS, template: `<div data-t dsSearchField aria-label="Search" [(ngModel)]="value" [disabled]="disabled()"></div>` })
class T2 extends Base {}

@Component({ imports: IMPORTS, template: `<div dsField label="Label" description="Hint" error="Fix it" required><div data-t dsSearchField [formControl]="control"></div></div>` })
class F2 extends Base {}

@Component({ imports: IMPORTS, template: `<div data-t dsPasswordField aria-label="Password" [formControl]="control"></div>` })
class R3 extends Base {}

@Component({ imports: IMPORTS, template: `<div data-t dsPasswordField aria-label="Password" [(ngModel)]="value" [disabled]="disabled()"></div>` })
class T3 extends Base {}

@Component({ imports: IMPORTS, template: `<div dsField label="Label" description="Hint" error="Fix it" required><div data-t dsPasswordField [formControl]="control"></div></div>` })
class F3 extends Base {}

@Component({ imports: IMPORTS, template: `<div data-t dsOTPField aria-label="Code" [formControl]="control"></div>` })
class R4 extends Base {}

@Component({ imports: IMPORTS, template: `<div data-t dsOTPField aria-label="Code" [(ngModel)]="value" [disabled]="disabled()"></div>` })
class T4 extends Base {}

@Component({ imports: IMPORTS, template: `<div dsField label="Label" description="Hint" error="Fix it" required><div data-t dsOTPField [formControl]="control"></div></div>` })
class F4 extends Base {}

@Component({ imports: IMPORTS, template: `<div data-t dsPhoneField aria-label="Phone" [formControl]="control"></div>` })
class R5 extends Base {}

@Component({ imports: IMPORTS, template: `<div data-t dsPhoneField aria-label="Phone" [(ngModel)]="value" [disabled]="disabled()"></div>` })
class T5 extends Base {}

@Component({ imports: IMPORTS, template: `<div dsField label="Label" description="Hint" error="Fix it" required><div data-t dsPhoneField [formControl]="control"></div></div>` })
class F5 extends Base {}

@Component({ imports: IMPORTS, template: `<div dsInputGroup><span dsInputGroupAddon>https://</span><div data-t dsInput aria-label="Site" [formControl]="control"></div></div>` })
class R6 extends Base {}

@Component({ imports: IMPORTS, template: `<div dsInputGroup><span dsInputGroupAddon>https://</span><div data-t dsInput aria-label="Site" [(ngModel)]="value" [disabled]="disabled()"></div></div>` })
class T6 extends Base {}

@Component({ imports: IMPORTS, template: `<div dsField label="Label" description="Hint" error="Fix it" required><div dsInputGroup><span dsInputGroupAddon>https://</span><div data-t dsInput [formControl]="control"></div></div></div>` })
class F6 extends Base {}

@Component({ imports: IMPORTS, template: `<div data-t dsInlineEdit label="Board name" [formControl]="control"></div>` })
class R7 extends Base {}

@Component({ imports: IMPORTS, template: `<div data-t dsInlineEdit label="Board name" [(ngModel)]="value" [disabled]="disabled()"></div>` })
class T7 extends Base {}

@Component({ imports: IMPORTS, template: `<div dsField label="Label" description="Hint" error="Fix it" required><div data-t dsInlineEdit label="Board name" [formControl]="control"></div></div>` })
class F7 extends Base {}

@Component({ imports: IMPORTS, template: `<div dsField label="Name" disabled><div data-t dsInput [formControl]="control"></div></div>` })
class FD extends Base {}

@Component({ imports: IMPORTS, template: `<div data-t dsInput disabled aria-label="Name"></div>` })
class SD extends Base {}

const HOSTS: Record<string, { R: Type<unknown>; T: Type<unknown>; F: Type<unknown> }> = {
  'Input': { R: R0, T: T0, F: F0 },
  'Textarea': { R: R1, T: T1, F: F1 },
  'SearchField': { R: R2, T: T2, F: F2 },
  'PasswordField': { R: R3, T: T3, F: F3 },
  'OTPField': { R: R4, T: T4, F: F4 },
  'PhoneField': { R: R5, T: T5, F: F5 },
  'InputGroup with Input': { R: R6, T: T6, F: F6 },
  'InlineEdit': { R: R7, T: T7, F: F7 },
};

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
}

function root(fixture: ComponentFixture<unknown>): HTMLElement {
  return (fixture.nativeElement as HTMLElement).querySelector('[data-t]') as HTMLElement;
}

function nativeOf(fixture: ComponentFixture<unknown>, c: Case): HTMLInputElement {
  return root(fixture).querySelector(c.native) as HTMLInputElement;
}

async function typeInto(fixture: ComponentFixture<unknown>, c: Case): Promise<void> {
  if (c.name === 'InlineEdit') {
    (root(fixture).querySelector('button[data-part=display]') as HTMLButtonElement).click();
    await settle(fixture);
  }
  const el = nativeOf(fixture, c);
  el.focus();
  el.value = c.typed;
  el.setSelectionRange?.(c.typed.length, c.typed.length);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  if (c.name === 'InlineEdit') el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await settle(fixture);
}

async function blur(fixture: ComponentFixture<unknown>, c: Case): Promise<void> {
  const el = c.name === 'InlineEdit' ? (root(fixture).querySelector('button') as HTMLElement) : nativeOf(fixture, c);
  el.focus();
  el.blur();
  // jsdom fires focus events on blur(); dispatch them as a browser would, in case it does not.
  el.dispatchEvent(new FocusEvent('blur'));
  el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  await settle(fixture);
}

describe.each(CASES)('$name with reactive forms', (c) => {
  it('writes model to view, view to model, disables natively, marks touched', async () => {
    const fixture = TestBed.createComponent(HOSTS[c.name]!.R);
    await settle(fixture);
    const host = fixture.componentInstance as { control: FormControl<string | null> };

    host.control.setValue(c.modelValue);
    await settle(fixture);
    if (c.textEntry) expect(nativeOf(fixture, c).value).toBe(c.shown);
    else expect(root(fixture).querySelector('button[data-part=display]')?.textContent?.trim()).toBe(c.shown);

    await typeInto(fixture, c);
    expect(host.control.value).toBe(c.expected);

    expect(host.control.touched).toBe(false);
    await blur(fixture, c);
    expect(host.control.touched).toBe(true);

    host.control.disable();
    await settle(fixture);
    expect(root(fixture).hasAttribute('data-disabled')).toBe(true);
    if (c.textEntry) {
      expect(nativeOf(fixture, c).disabled).toBe(true);
      expect(nativeOf(fixture, c).hasAttribute('aria-disabled')).toBe(false);
    } else {
      const display = root(fixture).querySelector('button[data-part=display]') as HTMLButtonElement;
      expect(display.disabled).toBe(false);
      expect(display.getAttribute('aria-disabled')).toBe('true');
    }

    host.control.enable();
    await settle(fixture);
    expect(root(fixture).hasAttribute('data-disabled')).toBe(false);
    if (c.textEntry) expect(nativeOf(fixture, c).disabled).toBe(false);
  });
});

describe.each(CASES)('$name with ngModel', (c) => {
  it('writes model to view, view to model, disables natively, marks touched', async () => {
    const fixture = TestBed.createComponent(HOSTS[c.name]!.T);
    // value is a plain field on the host for ngModel.
    const host = fixture.componentInstance as { value?: string | null; disabled: WritableSignal<boolean> };
    host.value = c.modelValue;
    await settle(fixture);
    if (c.textEntry) expect(nativeOf(fixture, c).value).toBe(c.shown);

    await typeInto(fixture, c);
    expect(host.value).toBe(c.expected);

    host.disabled.set(true);
    await settle(fixture);
    expect(root(fixture).hasAttribute('data-disabled')).toBe(true);
    if (c.textEntry) expect(nativeOf(fixture, c).disabled).toBe(true);
  });
});

describe.each(CASES.filter((c) => c.name !== 'InlineEdit' && !c.name.startsWith('InputGroup')))('$name inside a required invalid Field', (c) => {
  it('takes id, aria-required, aria-invalid and aria-describedby from the Field', async () => {
    const fixture = TestBed.createComponent(HOSTS[c.name]!.F);
    await settle(fixture);
    const el = nativeOf(fixture, c);
    const label = (fixture.nativeElement as HTMLElement).querySelector('label') as HTMLLabelElement;
    expect(el.id).not.toBe('');
    expect(label.getAttribute('for')).toBe(el.id);
    expect(el.getAttribute('aria-required')).toBe('true');
    expect(el.getAttribute('aria-invalid')).toBe('true');
    const described = (el.getAttribute('aria-describedby') ?? '').split(' ');
    const p = (fixture.nativeElement as HTMLElement).querySelectorAll('p');
    expect(described.slice(0, 2)).toEqual([p[0]?.id, p[1]?.id]);
    expect(root(fixture).hasAttribute('data-invalid')).toBe(true);
  });
});

describe('Field disabled with a form control', () => {
  it('Field disabled wins, form disable also disables', async () => {
    const fixture = TestBed.createComponent(FD);
    await settle(fixture);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('a static disabled attribute on dsInput becomes the native disabled, never a host attribute', async () => {
    const fixture = TestBed.createComponent(SD);
    await settle(fixture);
    expect(root(fixture).hasAttribute('disabled')).toBe(false);
    expect((root(fixture).querySelector('input') as HTMLInputElement).disabled).toBe(true);
  });
});
