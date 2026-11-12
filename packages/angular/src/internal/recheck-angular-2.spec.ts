// Recheck of the 20 blockers in docs/reports/reviews/angular-2.md against the
// current tree. Each test reproduces a blocker the way the review measured it
// and passes when the blocker is fixed. Test names carry the blocker id.
import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import type { FormValidators, FormValues } from '@the-system/shared';
import { afterEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../theme/theme';
import { DsButton } from '../components/button/button';
import { DsCheckbox } from '../components/checkbox/checkbox';
import { DsCheckboxGroup } from '../components/checkbox-group/checkbox-group';
import ConsentFieldDemo from '../components/consent-field/consent-field.demo';
import { DsConsentField } from '../components/consent-field/consent-field';
import { DsFieldset } from '../components/fieldset/fieldset';
import { DsFilterBar, type FilterBarFilter } from '../components/filter-bar/filter-bar';
import { DsForm } from '../components/form/form';
import FormDemo from '../components/form/form.demo';
import { DsFormField } from '../components/form/form-field';
import { DsInput } from '../components/input/input';
import { cityOptions } from '../components/list-box/samples';
import { DsMultiSelect } from '../components/multi-select/multi-select';
import { DsNumberField } from '../components/number-field/number-field';
import { DsRadioCard, DsRadioCardItem } from '../components/radio-card/radio-card';
import { DsRadioGroup, DsRadioGroupItem } from '../components/radio-group/radio-group';
import { DsRating } from '../components/rating/rating';
import { DsSelect } from '../components/select/select';
import { DsSwitch } from '../components/switch/switch';

const tick = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

async function settle(fixture: { detectChanges: () => void; whenStable: () => Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  await tick();
  fixture.detectChanges();
  await fixture.whenStable();
}

function submit(form: HTMLFormElement) {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function summaryItems(form: HTMLElement): string[] {
  return Array.from(form.querySelectorAll('[data-part="summary"] li')).map((li) => (li.textContent ?? '').replace(/\s+/g, ' ').trim());
}

function mount<T>(type: Type<T>) {
  const fixture = TestBed.createComponent(type);
  document.body.appendChild(fixture.nativeElement);
  return fixture;
}

afterEach(() => {
  for (const el of Array.from(document.querySelectorAll('[data-menu-layer]'))) el.remove();
  document.body.innerHTML = '';
});

// Checkbox and CheckboxGroup.

@Component({
  imports: [DsCheckbox, DsCheckboxGroup],
  template: `
    <div data-t="box" dsCheckbox label="Show rulers"></div>
    <form id="channels">
      <fieldset dsCheckboxGroup legend="Channels" name="channels" selectAll="All channels">
        <div dsCheckbox value="a" label="A"></div>
        <div dsCheckbox value="b" label="B"></div>
      </fieldset>
    </form>
  `,
})
class CheckHost {}

describe('recheck angular-2: checks', () => {
  it('Checkbox B1: the indicator keeps a hidden span with the last glyph while unchecked, as React forceMount', async () => {
    const fixture = mount(CheckHost);
    await settle(fixture);
    const box = fixture.nativeElement.querySelector('[data-t="box"]') as HTMLElement;
    const control = box.querySelector('[data-part="control"]') as HTMLButtonElement;
    const clip = () => box.querySelector('[data-part="indicator"] > span[aria-hidden="true"]') as HTMLElement | null;
    // Unchecked from the start: the clip span and a check glyph are there.
    expect(clip()).not.toBeNull();
    expect(clip()?.querySelector('[data-icon="check"]')).not.toBeNull();
    control.click();
    await settle(fixture);
    expect(box.getAttribute('data-state')).toBe('checked');
    const checkedClip = clip();
    expect(checkedClip?.querySelector('[data-icon="check"]')).not.toBeNull();
    control.click();
    await settle(fixture);
    expect(box.getAttribute('data-state')).toBe('unchecked');
    // Still the same span, still the last glyph, so an uncheck can fade it.
    expect(clip()).toBe(checkedClip);
    expect(clip()?.querySelector('[data-icon="check"]')).not.toBeNull();
  });

  it('CheckboxGroup B1: select all posts only the items, never channels=on', async () => {
    const fixture = mount(CheckHost);
    await settle(fixture);
    const form = fixture.nativeElement.querySelector('#channels') as HTMLFormElement;
    const all = form.querySelector('[data-part="select-all"] [data-part="control"]') as HTMLButtonElement;
    all.click();
    await settle(fixture);
    expect(new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString()).toBe('channels=a&channels=b');
  });
});

// RadioGroup, RadioCard and Rating in a dsForm: picking clears the summary entry.

@Component({
  imports: [DsForm, DsRadioGroup, DsRadioGroupItem, DsRadioCard, DsRadioCardItem, DsRating],
  template: `
    <form dsForm id="radios">
      <div dsRadioGroup label="View" name="view" required>
        <div dsRadioGroupItem value="list" label="List"></div>
        <div dsRadioGroupItem value="board" label="Board"></div>
      </div>
      <div dsRadioCard aria-label="Plan" name="plan" required>
        <button dsRadioCardItem value="free" title="Free"></button>
        <button dsRadioCardItem value="team" title="Team"></button>
      </div>
      <div dsRating aria-label="Score" name="score" required></div>
    </form>
  `,
})
class RadioHost {}

async function radioSetup() {
  const fixture = mount(RadioHost);
  await settle(fixture);
  const form = fixture.nativeElement.querySelector('#radios') as HTMLFormElement;
  const clicks: string[] = [];
  form.addEventListener('click', (e) => {
    const t = e.target;
    if (t instanceof HTMLInputElement && t.type === 'radio' && t.checked) clicks.push(`click:${t.name}`);
  });
  submit(form);
  await settle(fixture);
  return { fixture, form, clicks };
}

describe('recheck angular-2: radios', () => {
  it('RadioGroup B1: a pick dispatches click on the hidden radio and clears its summary entry', async () => {
    const { fixture, form, clicks } = await radioSetup();
    expect(summaryItems(form).some((t) => t.includes('Pick one option'))).toBe(true);
    const before = summaryItems(form).length;
    (form.querySelector('[data-ds="radio-group"] [role="radio"]') as HTMLElement).click();
    await settle(fixture);
    expect(clicks).toContain('click:view');
    expect(summaryItems(form)).toHaveLength(before - 1);
    expect(summaryItems(form).some((t) => t.startsWith('View:'))).toBe(false);
  });

  it('RadioCard B1: a pick dispatches click on the hidden radio and clears its summary entry', async () => {
    const { fixture, form, clicks } = await radioSetup();
    const before = summaryItems(form).length;
    (form.querySelector('button[value="team"], [data-ds="radio-card"] [role="radio"]') as HTMLElement).click();
    await settle(fixture);
    expect(clicks).toContain('click:plan');
    expect(summaryItems(form)).toHaveLength(before - 1);
    expect(summaryItems(form).some((t) => t.startsWith('Plan:'))).toBe(false);
  });

  it('Rating B1: a pick dispatches click on the hidden radio and clears its summary entry', async () => {
    const { fixture, form, clicks } = await radioSetup();
    const before = summaryItems(form).length;
    expect(before).toBe(3);
    (form.querySelectorAll('[data-ds="rating"] [role="radio"]')[3] as HTMLElement).click();
    await settle(fixture);
    expect(clicks).toContain('click:score');
    expect(summaryItems(form)).toHaveLength(before - 1);
  });
});

// Select and MultiSelect.

@Component({
  imports: [DsSelect, DsMultiSelect, DsButton, ReactiveFormsModule],
  template: `
    <button id="empty" dsSelect aria-label="Status" [items]="[]" empty="No statuses yet."></button>
    <button id="select" dsSelect aria-label="City" [items]="cities" [formControl]="one"></button>
    <div id="multi" dsMultiSelect aria-label="Cities" [items]="cities" [formControl]="many"></div>
    <button id="outside" dsButton>Outside</button>
  `,
})
class ListHost {
  readonly cities = cityOptions('en', 'gulf');
  readonly one = new FormControl<string | null>(null);
  readonly many = new FormControl<string[]>([], { nonNullable: true });
}

async function press(fixture: { detectChanges: () => void; whenStable: () => Promise<unknown> }, target: Element, key: string) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  await settle(fixture);
}

describe('recheck angular-2: lists', () => {
  it('Select B1: an empty list does not open and a hidden note with the empty words describes the trigger', async () => {
    const fixture = mount(ListHost);
    await settle(fixture);
    const el = fixture.nativeElement.querySelector('#empty') as HTMLButtonElement;
    const ids = (el.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
    const notes = ids.map((id) => document.getElementById(id));
    expect(notes.some((n) => n?.textContent === 'No statuses yet.' && n.hidden)).toBe(true);
    el.focus();
    for (const key of ['Enter', 'ArrowDown', ' ']) {
      await press(fixture, el, key);
      expect(document.querySelector('[role="listbox"]')).toBeNull();
    }
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, pointerType: 'mouse' }));
    el.click();
    await settle(fixture);
    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(el.getAttribute('aria-expanded')).toBe('false');
  });

  it('Select B2: not touched when the list opens and focus moves into it', async () => {
    const fixture = mount(ListHost);
    await settle(fixture);
    const host = fixture.componentInstance;
    const el = fixture.nativeElement.querySelector('#select') as HTMLButtonElement;
    el.focus();
    await press(fixture, el, 'Enter');
    const list = document.querySelector('[role="listbox"]');
    expect(list).not.toBeNull();
    expect(list?.contains(document.activeElement)).toBe(true);
    expect(host.one.touched).toBe(false);
    await press(fixture, document.activeElement as Element, 'Escape');
    expect(document.activeElement).toBe(el);
    expect(host.one.touched).toBe(false);
    (fixture.nativeElement.querySelector('#outside') as HTMLElement).focus();
    await settle(fixture);
    expect(host.one.touched).toBe(true);
  });

  it('MultiSelect B1: not touched when the popup opens and focus moves into it', async () => {
    const fixture = mount(ListHost);
    await settle(fixture);
    const host = fixture.componentInstance;
    const root = fixture.nativeElement.querySelector('#multi') as HTMLElement;
    const trigger = (root.matches('[role="combobox"]') ? root : root.querySelector('[role="combobox"]')) as HTMLElement;
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
    await press(fixture, trigger, 'Enter');
    const popup = document.querySelector('[data-menu-layer] [data-part="popup"]');
    expect(popup).not.toBeNull();
    expect(popup?.contains(document.activeElement)).toBe(true);
    expect(host.many.touched).toBe(false);
    await press(fixture, document.activeElement as Element, 'Escape');
    expect(host.many.touched).toBe(false);
    (fixture.nativeElement.querySelector('#outside') as HTMLElement).focus();
    await settle(fixture);
    expect(host.many.touched).toBe(true);
  });
});

// Fieldset and Form.

@Component({
  imports: [DsForm, DsFieldset, DsCheckbox],
  template: `
    <form dsForm id="group" [validators]="validators">
      <fieldset dsFieldset legend="How should we reach you" name="reach">
        <div dsCheckbox name="reach" value="email" label="Email"></div>
        <div dsCheckbox name="reach" value="text" label="Text message"></div>
      </fieldset>
    </form>
  `,
})
class FieldsetHost {
  readonly validators: FormValidators = { reach: (v) => (v === undefined ? 'Pick at least one way to reach you.' : undefined) };
}

@Component({
  imports: [DsTheme, DsForm, DsFormField, DsInput],
  template: `
    <div dsTheme [lang]="'ar'">
      <form dsForm id="ar" (errors)="found.push($event)">
        <div dsFormField name="email" label="البريد"><div dsInput name="email" type="email" value="sara"></div></div>
      </form>
    </div>
    <form dsForm id="en" (errors)="found.push($event)">
      <div dsFormField name="postal" label="Postal code"><div dsInput name="postal" pattern="[0-9]{5}" value="12"></div></div>
    </form>
  `,
})
class CopyHost {
  readonly found: unknown[] = [];
}

@Component({
  imports: [DsForm, DsFormField, DsInput, DsCheckbox, DsSwitch, DsRadioGroup, DsRadioGroupItem, ReactiveFormsModule],
  template: `
    <form dsForm id="shape" [validators]="validators" [labels]="labels" (errors)="found.push($event)">
      <div dsCheckbox name="terms" value="yes" label="Terms" required></div>
      <div dsSwitch name="alerts" label="Alerts" required></div>
      <div dsRadioGroup label="Seat" name="seat" required>
        <div dsRadioGroupItem value="in" label="Inside"></div>
        <div dsRadioGroupItem value="out" label="Outside"></div>
      </div>
      <div dsFormField name="site" label="Website"><div dsInput name="site" type="url" value="example"></div></div>
      <div dsFormField name="postal" label="Postal code"><div dsInput name="postal" pattern="[0-9]{5}" value="12"></div></div>
    </form>
    <form dsForm id="ng" [formGroup]="group" (errors)="found.push($event)">
      <div dsFormField name="seats" label="Seats"><div dsInput formControlName="seats"></div></div>
      <div dsFormField name="nick" label="Nickname"><div dsInput formControlName="nick"></div></div>
    </form>
  `,
})
class ShapeHost {
  readonly validators: FormValidators = { postal: (v) => (v === '12' ? 'Enter the 5 digit postal code.' : undefined) };
  readonly labels = { typeMismatch: (type: string) => `Bad ${type}.` };
  readonly group = new FormGroup({
    seats: new FormControl('0', Validators.min(1)),
    nick: new FormControl('ab', Validators.minLength(3)),
  });
  readonly found: unknown[] = [];
}

@Component({
  imports: [DsForm, DsFormField, DsInput],
  template: `
    <form dsForm id="pass" [onSubmit]="send">
      <div dsFormField name="name" label="Full name" required><div dsInput name="name" value="Sara"></div></div>
    </form>
    <form dsForm id="pass-plain">
      <div dsFormField name="name" label="Full name" required><div dsInput name="name" value="Sara"></div></div>
    </form>
  `,
})
class PassHost {
  readonly sent: FormValues[] = [];
  readonly send = (values: FormValues) => {
    this.sent.push(values);
  };
}

@Component({
  imports: [DsForm, DsFieldset, DsCheckbox, DsRadioGroup, DsRadioGroupItem],
  template: `
    <form dsForm id="names" [validators]="validators">
      <fieldset dsFieldset legend="How should we reach you" name="reach">
        <div dsCheckbox name="reach" value="email" label="Email"></div>
        <div dsCheckbox name="reach" value="text" label="Text message"></div>
      </fieldset>
      <div dsRadioGroup label="Seating" name="seat" required>
        <div dsRadioGroupItem value="in" label="Inside"></div>
        <div dsRadioGroupItem value="out" label="Outside"></div>
      </div>
    </form>
  `,
})
class GroupNameHost {
  readonly validators: FormValidators = { reach: (v) => (v === undefined ? 'Pick at least one way to reach you.' : undefined) };
}

describe('recheck angular-2: Fieldset and Form', () => {
  it('Fieldset B1: with name inside a Form, the group shows the Form error for that name', async () => {
    const fixture = mount(FieldsetHost);
    await settle(fixture);
    const form = fixture.nativeElement.querySelector('#group') as HTMLFormElement;
    const fieldset = form.querySelector('fieldset') as HTMLFieldSetElement;
    expect(fieldset.getAttribute('data-name')).toBe('reach');
    expect(fieldset.hasAttribute('name')).toBe(false);
    submit(form);
    await settle(fixture);
    const error = fieldset.querySelector(':scope > [data-part="error"]') as HTMLElement | null;
    expect(error?.textContent?.trim()).toBe('Pick at least one way to reach you.');
    expect(fieldset.hasAttribute('data-invalid')).toBe(true);
    expect((fieldset.getAttribute('aria-describedby') ?? '').split(' ')).toContain(error?.id);
  });

  it('Form B1: a constraint failure uses the Form copy in the page language, never the browser message', async () => {
    const fixture = mount(CopyHost);
    await settle(fixture);
    submit(fixture.nativeElement.querySelector('#ar'));
    submit(fixture.nativeElement.querySelector('#en'));
    await settle(fixture);
    expect(fixture.componentInstance.found).toEqual([
      { email: 'اكتب بريد إلكتروني صحيح، مثل name@example.com.' },
      { postal: 'Check the format of the value in this field.' },
    ]);
  });

  it('Form B2: React label shape, choice and option copy, Angular validator keys, a validator beats the constraint copy', async () => {
    const fixture = mount(ShapeHost);
    await settle(fixture);
    submit(fixture.nativeElement.querySelector('#shape'));
    submit(fixture.nativeElement.querySelector('#ng'));
    await settle(fixture);
    expect(fixture.componentInstance.found).toEqual([
      {
        terms: 'Tick this box to go on.',
        alerts: 'Tick this box to go on.',
        seat: 'Pick one option to go on.',
        site: 'Bad url.',
        postal: 'Enter the 5 digit postal code.',
      },
      { seats: 'Enter 1 or more.', nick: 'Use at least 3 characters.' },
    ]);
  });

  it('Form B3: a passing submit announces that the form was sent', async () => {
    const fixture = mount(PassHost);
    await settle(fixture);
    for (const id of ['#pass', '#pass-plain']) {
      const form = fixture.nativeElement.querySelector(id) as HTMLFormElement;
      submit(form);
      await settle(fixture);
      expect(form.getAttribute('data-state')).toBe('submitted');
      expect(form.querySelector('[role="status"]')?.textContent?.trim()).toBe('The form was sent.');
    }
    expect(fixture.componentInstance.sent).toEqual([{ name: 'Sara' }]);
  });

  it('Form B4: a group summary link names the group (legend or radiogroup name), not its first option', async () => {
    const fixture = mount(GroupNameHost);
    await settle(fixture);
    const form = fixture.nativeElement.querySelector('#names') as HTMLFormElement;
    submit(form);
    await settle(fixture);
    const links = Array.from(form.querySelectorAll('[data-part="summary"] a')).map((a) => a.textContent?.trim());
    expect(links).toEqual(['How should we reach you: Pick at least one way to reach you.', 'Seating: Pick one option to go on.']);
  });

  it('Form B5: the demo "many" case has the postal description, addressChecks and the reach fieldset, as React', async () => {
    const fixture = mount(FormDemo);
    await settle(fixture);
    const many = fixture.nativeElement.querySelector('[data-demo-case="many"]') as HTMLElement;
    const postal = many.querySelector('input[name="postal"]') as HTMLInputElement;
    const describedBy = (postal.getAttribute('aria-describedby') ?? '').split(' ').map((id) => document.getElementById(id)?.textContent?.trim());
    expect(describedBy).toContain('5 digits, such as 12211.');
    const reach = many.querySelector('fieldset[data-name="reach"]') as HTMLElement;
    expect(reach.querySelector('legend')?.textContent?.trim()).toBe('How should we reach you');
    expect(Array.from(reach.querySelectorAll('[data-part="label"]')).map((l) => l.textContent?.trim())).toEqual([
      'Email',
      'Text message',
      'Phone call',
    ]);
    postal.value = '12';
    submit(postal.form as HTMLFormElement);
    await settle(fixture);
    const items = summaryItems(many);
    expect(items).toContain('Postal code: Enter the 5 digit postal code.');
    expect(items).toContain('How should we reach you: Pick at least one way to reach you.');
  });
});

// ConsentField.

@Component({
  imports: [DsForm, DsConsentField, DsButton, ReactiveFormsModule],
  template: `
    <form dsForm id="consent" [serverErrors]="server()">
      <div dsConsentField name="terms" purpose="I agree to the terms." required requiredError="Agree to the terms to open an account."></div>
    </form>
    <div id="touch" dsConsentField purpose="Send me offers by email." [formControl]="offers"></div>
    <button id="away" dsButton>Away</button>
  `,
})
class ConsentHost {
  readonly server = signal<unknown>(undefined);
  readonly offers = new FormControl(false, { nonNullable: true });
}

describe('recheck angular-2: ConsentField', () => {
  it('ConsentField B1: requiredError reaches the summary, and never replaces a server error in the field', async () => {
    const fixture = mount(ConsentHost);
    await settle(fixture);
    const form = fixture.nativeElement.querySelector('#consent') as HTMLFormElement;
    submit(form);
    await settle(fixture);
    expect(summaryItems(form)).toEqual(['I agree to the terms.: Agree to the terms to open an account.']);
    const field = form.querySelector('[data-ds="consent-field"]') as HTMLElement;
    expect(field.querySelector('[data-part="error"]')?.textContent?.trim()).toBe('Agree to the terms to open an account.');
    fixture.componentInstance.server.set({ terms: 'We could not record your answer. Try again.' });
    await settle(fixture);
    expect(field.querySelector('[data-part="error"]')?.textContent?.trim()).toBe('We could not record your answer. Try again.');
    expect(summaryItems(form)).toEqual(['I agree to the terms.: We could not record your answer. Try again.']);
  });

  it('ConsentField B2: touched on blur with no change', async () => {
    const fixture = mount(ConsentHost);
    await settle(fixture);
    const control = fixture.nativeElement.querySelector('#touch [role="checkbox"]') as HTMLElement;
    control.focus();
    expect(document.activeElement).toBe(control);
    expect(fixture.componentInstance.offers.touched).toBe(false);
    (fixture.nativeElement.querySelector('#away') as HTMLElement).focus();
    await settle(fixture);
    expect(fixture.componentInstance.offers.touched).toBe(true);
    expect(fixture.componentInstance.offers.value).toBe(false);
  });

  it('ConsentField B3: the demo has the React fix-late cases and copy', async () => {
    const fixture = mount(ConsentFieldDemo);
    await settle(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const empty = root.querySelector('[data-demo-case="empty"]') as HTMLElement;
    expect(empty.querySelector('[data-demo="title"]')?.textContent?.trim()).toBe('Purpose and the details link only');
    expect(empty.querySelectorAll('[data-ds="consent-field"]')).toHaveLength(1);
    expect(empty.querySelector('[data-part="details"]')).not.toBeNull();
    const settings = root.querySelector('[data-demo-case="too-many"] fieldset > [data-part="description"]') as HTMLElement;
    expect(settings.textContent).toContain('Each switch saves at once, and you can turn it off the same way.');
    expect(settings.querySelector('a[href]')?.textContent?.trim()).toBe('Read how we use your data');
    const long = root.querySelector('[data-demo-case="long-text"] [data-part="purpose"]')?.textContent ?? '';
    expect(long).toContain(
      'Share my full name, mobile number, delivery address, building and floor, order contents and delivery notes with Swift Route Logistics, the delivery partner for Riyadh, Jeddah, Dammam and Al Khobar, so they can deliver my orders.',
    );
  });
});

// FilterBar (DropdownMenu) and NumberField.

@Component({
  imports: [DsFilterBar],
  template: `<div dsFilterBar id="bar" [filters]="kinds" [more]="more" [(value)]="value"></div>`,
})
class FilterHost {
  readonly kinds: FilterBarFilter[] = [{ value: 'boards', label: 'Boards' }];
  readonly more: FilterBarFilter[] = [
    { value: 'starred', label: 'Starred' },
    { value: 'archived', label: 'Archived' },
  ];
  readonly value = signal<readonly string[] | undefined>([]);
}

@Component({
  imports: [DsNumberField],
  template: `<div data-t="nf" dsNumberField aria-label="Width" [min]="0" [value]="320"></div>`,
})
class NumberHost {}

/** Types like a browser: beforeinput, then the edit at the selection unless refused, then input. */
function typeText(el: HTMLInputElement, data: string) {
  for (const ch of data) {
    const before = new InputEvent('beforeinput', { inputType: 'insertText', data: ch, bubbles: true, cancelable: true });
    el.dispatchEvent(before);
    if (before.defaultPrevented) continue;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    el.value = el.value.slice(0, start) + ch + el.value.slice(end);
    el.setSelectionRange(start + 1, start + 1);
    el.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: ch, bubbles: true }));
  }
}

describe('recheck angular-2: FilterBar and NumberField', () => {
  it('FilterBar B1: a second Space within 1 s unchecks the more menu item (DropdownMenu typeahead)', async () => {
    const fixture = mount(FilterHost);
    await settle(fixture);
    const more = fixture.nativeElement.querySelector('[data-part="more"]') as HTMLElement;
    more.focus();
    await press(fixture, more, 'Enter');
    const archived = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitemcheckbox"]')).find(
      (i) => i.textContent?.trim() === 'Archived',
    ) as HTMLElement;
    archived.focus();
    await press(fixture, archived, ' ');
    expect(fixture.componentInstance.value()).toEqual(['archived']);
    expect(archived.getAttribute('aria-checked')).toBe('true');
    await tick(200);
    await press(fixture, document.activeElement as Element, ' ');
    expect(document.activeElement).toBe(archived);
    expect(fixture.componentInstance.value()).toEqual([]);
    expect(archived.getAttribute('aria-checked')).toBe('false');
  });

  it('NumberField B1: a refused key keeps the selection, so select all of 320 and type -5 gives 5', async () => {
    const fixture = mount(NumberHost);
    await settle(fixture);
    const el = fixture.nativeElement.querySelector('[data-t="nf"] input[data-part="control"]') as HTMLInputElement;
    expect(el.value).toBe('320');
    el.focus();
    el.setSelectionRange(0, el.value.length);
    typeText(el, '-');
    await settle(fixture);
    expect(el.value).toBe('320');
    expect([el.selectionStart, el.selectionEnd]).toEqual([0, 3]);
    typeText(el, '5');
    await settle(fixture);
    expect(el.value).toBe('5');
    el.setSelectionRange(0, el.value.length);
    typeText(el, 'x7');
    await settle(fixture);
    expect(el.value).toBe('7');
  });
});
