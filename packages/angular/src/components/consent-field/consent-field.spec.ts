import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsForm } from '../form/form';
import { DsConsentField, type ConsentRecord } from './consent-field';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

@Component({
  imports: [DsConsentField, DsForm, ReactiveFormsModule],
  template: `
    <div dsConsentField id="plain" name="offers" version="2.1" purpose="Send me offers by email." detailsHref="#privacy" meta="Text version 2.1."
      defaultChecked (decision)="records.push($event)"></div>
    <div dsConsentField id="stringy" purpose="Send me news." [checked]="$any('true')"></div>
    <div dsConsentField id="settings" control="switch" purpose="Use my location." [(checked)]="granted"></div>
    <div dsConsentField id="required" required purpose="Share my history." [error]="error()" [invalid]="invalid()"></div>
    <div dsConsentField id="cva" purpose="Send me a survey." [formControl]="survey"></div>
    <form dsForm id="form">
      <div dsConsentField id="in-form" name="clinic" required purpose="Share my medical history." requiredError="The booking needs this consent."></div>
    </form>
  `,
})
class Host {
  readonly records: ConsentRecord[] = [];
  readonly granted = signal(true);
  readonly error = signal<string | undefined>(undefined);
  readonly invalid = signal<boolean | undefined>(undefined);
  readonly survey = new FormControl(false);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (sel: string) => fixture.nativeElement.querySelector(sel) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

describe('DsConsentField', () => {
  it('starts denied even with a defaultChecked attribute, and wires the label, meta and details', async () => {
    const { q } = await setup();
    const root = q('#plain');
    expect(root.getAttribute('data-ds')).toBe('consent-field');
    expect(root.getAttribute('data-state')).toBe('denied');
    expect(root.hasAttribute('checked')).toBe(false);
    expect(root.hasAttribute('defaultchecked')).toBe(false);
    const control = root.querySelector('[data-part="control"] button') as HTMLButtonElement;
    expect(control.getAttribute('role')).toBe('checkbox');
    expect(control.getAttribute('aria-checked')).toBe('false');
    expect(control.getAttribute('value')).toBe('granted');
    const purpose = root.querySelector('[data-part="purpose"]') as HTMLLabelElement;
    expect(purpose.getAttribute('for')).toBe(control.id);
    expect(control.getAttribute('aria-labelledby')).toBe(purpose.id);
    const meta = root.querySelector('[data-part="meta"]') as HTMLElement;
    expect(control.getAttribute('aria-describedby')).toBe(meta.id);
    const details = root.querySelector('[data-part="details"]') as HTMLAnchorElement;
    expect(details.getAttribute('data-ds')).toBe('link');
    expect(details.textContent?.trim()).toBe('How we use your data');
    expect(details.getAttribute('href')).toBe('#privacy');
  });

  it('stays denied when checked arrives as a string, as a static attribute does in a template without strict types', async () => {
    const { q } = await setup();
    expect(q('#stringy').getAttribute('data-state')).toBe('denied');
    expect(q('#stringy [data-part="control"] button').getAttribute('aria-checked')).toBe('false');
  });

  it('a click grants, a second click withdraws, and each choice emits a record', async () => {
    const { fixture, host, q } = await setup();
    const control = q('#plain [data-part="control"] button');
    control.click();
    await fixture.whenStable();
    expect(q('#plain').getAttribute('data-state')).toBe('granted');
    expect(control.getAttribute('aria-checked')).toBe('true');
    control.click();
    await fixture.whenStable();
    expect(q('#plain').getAttribute('data-state')).toBe('denied');
    expect(host.records.map((r) => [r.name, r.granted, r.version])).toEqual([
      ['offers', true, '2.1'],
      ['offers', false, '2.1'],
    ]);
    expect(Number.isNaN(Date.parse(host.records[0]!.at))).toBe(false);
  });

  it('a switch shows a choice on record and withdraws through the same control', async () => {
    const { fixture, host, q } = await setup();
    const control = q('#settings [data-part="control"] button');
    expect(control.getAttribute('role')).toBe('switch');
    expect(q('#settings [data-part="control"]').getAttribute('data-ds')).toBe('switch');
    expect(q('#settings').getAttribute('data-state')).toBe('granted');
    control.click();
    await fixture.whenStable();
    expect(host.granted()).toBe(false);
  });

  it('shows the required mark, the error and sets aria-required and aria-invalid; invalid false hides the error', async () => {
    const { fixture, host, q } = await setup();
    expect(q('#required [data-part="required"]').textContent).toBe(' *');
    const control = q('#required [data-part="control"] button');
    expect(control.getAttribute('aria-required')).toBe('true');
    host.error.set('The booking needs this consent.');
    await fixture.whenStable();
    const error = q('#required [data-part="error"]');
    expect(error.getAttribute('data-ds')).toBe('field-error');
    expect(control.getAttribute('aria-describedby')).toBe(error.id);
    expect(control.getAttribute('aria-invalid')).toBe('true');
    expect(q('#required').hasAttribute('data-invalid')).toBe(true);
    host.invalid.set(false);
    await fixture.whenStable();
    expect(q('#required [data-part="error"]')).toBeNull();
  });

  it('binds a boolean with Angular forms', async () => {
    const { fixture, host, q } = await setup();
    host.survey.setValue(true);
    await fixture.whenStable();
    expect(q('#cva').getAttribute('data-state')).toBe('granted');
    q('#cva [data-part="control"] button').click();
    await fixture.whenStable();
    expect(host.survey.value).toBe(false);
    host.survey.disable();
    await fixture.whenStable();
    expect(q('#cva').hasAttribute('data-disabled')).toBe(true);
  });

  it('inside a form, a required consent left off shows requiredError and takes focus', async () => {
    const { fixture, q } = await setup();
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await tick();
    await fixture.whenStable();
    const bubble = q('#in-form input[type="checkbox"]') as HTMLInputElement;
    expect(bubble.getAttribute('aria-hidden')).toBe('true');
    expect(bubble.name).toBe('clinic');
    q('#form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    await tick();
    await fixture.whenStable();
    expect(q('#in-form [data-part="error"]').textContent).toContain('The booking needs this consent.');
    expect(document.activeElement).toBe(q('#in-form [data-part="control"] button'));
    // Granting fixes the error at once: the hidden input reports the change to the form.
    q('#in-form [data-part="control"] button').click();
    await fixture.whenStable();
    await tick();
    await fixture.whenStable();
    expect(bubble.checked).toBe(true);
    expect(q('#in-form [data-part="error"]')).toBeNull();
    fixture.nativeElement.remove();
  });
});
