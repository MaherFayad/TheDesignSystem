// The Form and ConsentField fixes of the round 1 review (B6), ported from
// React: required messages by kind, no fallback to the browser's English
// validationMessage, ConsentField requiredError in the summary too, and the
// development warnings, a FormControl that starts a consent as true included.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DsConsentField } from '../consent-field/consent-field';
import { DsInput } from '../input/input';
import { DsForm, formLabels } from './form';
import { DsFormField } from './form-field';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

@Component({
  imports: [DsForm, DsFormField, DsInput, DsConsentField],
  template: `
    <form dsForm id="kinds">
      <input type="checkbox" name="terms" required aria-label="Accept the terms" />
      <input type="radio" name="plan" value="a" required aria-label="Plan A" />
      <input type="radio" name="plan" value="b" aria-label="Plan B" />
      <input type="email" name="email" aria-label="Email" value="sara@" />
      <input type="text" name="code" aria-label="Code" minlength="5" value="12" />
      <div dsConsentField name="clinic" required purpose="Share my medical history." detailsHref="#p" requiredError="The booking needs this consent."></div>
    </form>
  `,
})
class KindsHost {}

@Component({
  imports: [DsConsentField, ReactiveFormsModule],
  template: `<div dsConsentField purpose="Send me a survey." detailsHref="#p" [formControl]="survey"></div>`,
})
class PreTickedHost {
  readonly survey = new FormControl(true);
}

@Component({
  imports: [DsConsentField, ReactiveFormsModule],
  template: `<div dsConsentField purpose="Send me a survey." detailsHref="#p" meta="You agreed in the app." [formControl]="survey"></div>`,
})
class UndatedHost {
  readonly survey = new FormControl(true);
}

describe('Form and ConsentField copy in Angular (B6)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('says what to do by kind of control, never the browser message, and puts requiredError in the summary', async () => {
    const fixture = TestBed.createComponent(KindsHost);
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('#kinds') as HTMLFormElement;
    // jsdom has no constraint validation for minlength on a value set by markup; force it the way a browser reports a typed value.
    const code = form.querySelector('[name="code"]') as HTMLInputElement;
    Object.defineProperty(code, 'validity', {
      value: { ...code.validity, valid: false, tooShort: true },
    });
    Object.defineProperty(code, 'checkValidity', { value: () => false });
    Object.defineProperty(code, 'validationMessage', {
      value: 'Please lengthen this text (browser English).',
    });
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await tick();
    fixture.detectChanges();
    await fixture.whenStable();
    const summary = (form.querySelector('[data-part="summary"]')?.textContent ?? '').replace(/\s+/g, ' ');
    const en = formLabels('en');
    expect(summary).toContain(en.requiredChoice);
    expect(summary).toContain(en.requiredOption);
    expect(summary).toContain(en.typeMismatch('email'));
    expect(summary).toContain(en.tooShort(5));
    expect(summary).not.toContain('browser English');
    expect(summary).toContain('The booking needs this consent.');
  });

  it('warns in development when a FormControl starts a consent as true with no record (PDPL: never pre ticked)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fixture = TestBed.createComponent(PreTickedHost);
    await fixture.whenStable();
    const said = warn.mock.calls.map(([m]) => String(m)).filter((m) => m.startsWith('ConsentField'));
    // One warning, named after the form control, never a second one for checked.
    expect(said).toEqual([expect.stringContaining('FormControl starts true with no meta')]);
  });

  it('shares one check with checked: a FormControl that starts true with an undated meta is named too', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fixture = TestBed.createComponent(UndatedHost);
    await fixture.whenStable();
    const said = warn.mock.calls.map(([m]) => String(m)).filter((m) => m.startsWith('ConsentField'));
    expect(said).toEqual([expect.stringContaining('FormControl starts true and meta has no date')]);
  });
});
