// QA probe for the angular-2 review (batch A4). Temporary: copied to
// docs/reports/reviews/shots/angular-2/a4-forms/ and deleted from the tree.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsFieldset } from '../fieldset/fieldset';
import { DsStepper } from '../stepper/stepper';
import { DsFilterBar } from '../filter-bar/filter-bar';
import { DsForm } from '../form/form';
import { DsFormField } from '../form/form-field';
import { DsInput } from '../input/input';
import { DsConsentField } from './consent-field';
import { DsCheckbox } from '../checkbox/checkbox';

const DUMP: string[] = [];
const dump = (...a: unknown[]) => DUMP.push(a.map(String).join(' '));
const tick = () => new Promise((r) => setTimeout(r, 0));

@Component({
  imports: [DsConsentField, ReactiveFormsModule],
  template: `<div dsConsentField id="c1" purpose="Send me offers by email." [formControl]="ctl"></div>`,
})
class ReactiveConsent {
  readonly ctl = new FormControl(false, Validators.requiredTrue);
}

@Component({
  imports: [DsConsentField, FormsModule],
  template: `<div dsConsentField id="c2" name="offers" purpose="Send me offers by email." [(ngModel)]="granted"></div>`,
})
class TemplateConsent {
  granted = false;
}

@Component({
  imports: [DsCheckbox, FormsModule],
  template: `<div dsCheckbox id="k2" name="offers" label="Offers" [(ngModel)]="granted"></div>`,
})
class TemplateCheckbox {
  granted = false;
}

@Component({
  imports: [DsConsentField, FormsModule],
  template: `<div dsConsentField id="c9" name="offers" purpose="Send me offers by email." [(ngModel)]="granted"></div>`,
})
class TemplateConsentTrue {
  granted = true;
}

@Component({
  imports: [DsConsentField, DsFieldset, DsStepper, DsFilterBar, DsForm, DsFormField, DsInput],
  template: `
    <fieldset dsFieldset id="f1" legend="Delivery" description="Where to send it" size="sm" disabled name="reach" invalid error="Pick one"></fieldset>
    <div dsConsentField id="c3" purpose="Share my order." defaultChecked="true" required disabled control="switch" value="yes" detailsHref="#p" meta="v2" version="2" size="lg" requiredError="x"></div>
    <ol dsStepper id="s1" [steps]="steps" aria-label="Checkout steps" size="sm" orientation="vertical" mode="free" [defaultCurrent]="1"></ol>
    <div dsFilterBar id="fb" size="sm" [filters]="filters"></div>
    <form dsForm id="fm" size="sm" orientation="horizontal"><div dsFormField name="a" label="A" required description="d" orientation="vertical"><div dsInput name="a"></div></div></form>
  `,
})
class StaticHost {
  readonly steps = [{ title: 'Account' }, { title: 'Address' }];
  readonly filters = [{ value: 'a', label: 'Boards' }];
}

function attrs(el: Element | null): string {
  return el ? [...el.attributes].map((a) => `${a.name}="${a.value}"`).sort().join(' ') : 'missing';
}

describe('QA A4: ConsentField forms and host hygiene', () => {
  it('FormControl and ngModel, disable, touched on blur', async () => {
    DUMP.length = 0;
    const r = TestBed.createComponent(ReactiveConsent);
    await r.whenStable();
    const host = r.nativeElement.querySelector('#c1') as HTMLElement;
    const button = () => host.querySelector('[role="checkbox"]') as HTMLButtonElement;
    const ctl = r.componentInstance.ctl;
    ctl.setValue(true);
    await r.whenStable();
    dump('reactive model to view (true):', host.getAttribute('data-state'), button().getAttribute('aria-checked'));
    button().click();
    await r.whenStable();
    dump('reactive view to model (click):', ctl.value, 'dirty', ctl.dirty, 'touched after click', ctl.touched);
    const r2 = TestBed.createComponent(ReactiveConsent);
    await r2.whenStable();
    const b2 = r2.nativeElement.querySelector('[role="checkbox"]') as HTMLButtonElement;
    b2.focus();
    b2.dispatchEvent(new FocusEvent('blur'));
    b2.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await r2.whenStable();
    dump('reactive touched on blur without a change:', r2.componentInstance.ctl.touched);
    ctl.disable();
    await r.whenStable();
    dump('disable():', `root data-disabled=${host.hasAttribute('data-disabled')}`, `button disabled=${button().disabled}`, `aria-disabled=${button().getAttribute('aria-disabled')}`, `data-disabled=${button().hasAttribute('data-disabled')}`);
    ctl.enable();
    await r.whenStable();
    dump('enable():', `root data-disabled=${host.hasAttribute('data-disabled')}`, `button disabled=${button().disabled}`, `data-disabled=${button().hasAttribute('data-disabled')}`);

    const t = TestBed.createComponent(TemplateConsent);
    await t.whenStable();
    await tick();
    const th = t.nativeElement.querySelector('#c2') as HTMLElement;
    t.componentInstance.granted = true;
    t.changeDetectorRef.markForCheck();
    await t.whenStable();
    await tick();
    await t.whenStable();
    dump('ngModel model to view (true):', th.getAttribute('data-state'));
    const tt = TestBed.createComponent(TemplateConsentTrue);
    await tt.whenStable();
    await tick();
    await tt.whenStable();
    dump('ngModel initial true renders:', (tt.nativeElement.firstElementChild as HTMLElement).getAttribute('data-state'));
    for (const fx of [t, TestBed.createComponent(TemplateCheckbox)]) {
      await fx.whenStable();
      fx.componentInstance.granted = true;
      fx.detectChanges();
      await tick();
      fx.detectChanges();
      await fx.whenStable();
      const el = fx.nativeElement.firstElementChild as HTMLElement;
      dump('ngModel model to view with detectChanges:', el.getAttribute('data-ds'), el.getAttribute('data-state'));
    }
    (th.querySelector('[role="checkbox"]') as HTMLButtonElement).click();
    await t.whenStable();
    dump('ngModel view to model (click):', t.componentInstance.granted);
    expect(DUMP).toEqual([]);
  });

  it('static inputs leave nothing on the hosts', async () => {
    DUMP.length = 0;
    const f = TestBed.createComponent(StaticHost);
    await f.whenStable();
    await tick();
    await f.whenStable();
    const n = f.nativeElement as HTMLElement;
    dump('fieldset', attrs(n.querySelector('#f1')));
    dump('fieldset body inputs disabled by native fieldset:', (n.querySelector('#f1') as HTMLFieldSetElement).disabled);
    dump('consent', attrs(n.querySelector('#c3')));
    dump('consent control', attrs(n.querySelector('#c3 [role="switch"]')));
    dump('stepper', attrs(n.querySelector('#s1')));
    dump('stepper current li', [...n.querySelectorAll('#s1 li')].map((li) => li.getAttribute('aria-current')).join(','));
    dump('filterbar', attrs(n.querySelector('#fb')));
    dump('form', attrs(n.querySelector('#fm')));
    dump('formfield', attrs(n.querySelector('#fm [data-ds="field"]')));
    expect(DUMP).toEqual([]);
  });
});
