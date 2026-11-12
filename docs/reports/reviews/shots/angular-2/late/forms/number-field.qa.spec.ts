// Temporary QA spec (ds-qa review angular-2, late ports): ToggleGroup,
// SegmentedControl, NumberField and ScrubInput with reactive forms, ngModel
// and inside a Field. Copied to
// docs/reports/reviews/shots/angular-2/late/forms/ and removed from the package.
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { DsScrubInput } from '../scrub-input/scrub-input';
import { DS_SEGMENTED_CONTROL } from '../segmented-control/segmented-control';
import { DS_TOGGLE_GROUP } from '../toggle-group/toggle-group';
import { DsNumberField } from './number-field';

const IMPORTS = [ReactiveFormsModule, FormsModule, DsField, DsNumberField, DsScrubInput, ...DS_TOGGLE_GROUP, ...DS_SEGMENTED_CONTROL];

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  fixture.detectChanges();
  await fixture.whenStable();
}

const q = <T extends Element = HTMLElement>(f: ComponentFixture<unknown>, s: string) => (f.nativeElement as HTMLElement).querySelector(s) as T;
const qa = (f: ComponentFixture<unknown>, s: string) => [...(f.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(s)];

function type(el: HTMLInputElement, text: string): void {
  el.focus();
  el.value = text;
  el.setSelectionRange(text.length, text.length);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

async function blur(f: ComponentFixture<unknown>, el: HTMLElement): Promise<void> {
  el.focus();
  el.blur();
  el.dispatchEvent(new FocusEvent('blur'));
  el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  await settle(f);
}

// NumberField

@Component({ imports: IMPORTS, template: `<div dsNumberField aria-label="Seats" [min]="1" [max]="50" [formControl]="control"></div>` })
class NumR {
  readonly control = new FormControl<number | null>(null, Validators.required);
}

@Component({ imports: IMPORTS, template: `<div dsNumberField aria-label="Seats" [(ngModel)]="value" [disabled]="disabled()"></div>` })
class NumT {
  value: number | null = 3;
  readonly disabled = signal(false);
}

@Component({
  imports: IMPORTS,
  template: `<div dsField label="Seats" description="Between 1 and 50." error="Pick a number" required><div dsNumberField [formControl]="control"></div></div>`,
})
class NumF {
  readonly control = new FormControl<number | null>(4);
}

describe('NumberField forms', () => {
  it('reactive: model to view, view to model, clamps on commit, touched on blur, disable', async () => {
    const f = TestBed.createComponent(NumR);
    await settle(f);
    const c = f.componentInstance.control;
    const input = q<HTMLInputElement>(f, 'input');
    expect(c.hasError('required')).toBe(true);
    c.setValue(12);
    await settle(f);
    expect(input.value).toBe('12');
    type(input, '99');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await settle(f);
    expect(c.value).toBe(50);
    expect(input.value).toBe('50');
    expect(c.touched).toBe(false);
    await blur(f, input);
    expect(c.touched).toBe(true);
    c.disable();
    await settle(f);
    expect(input.disabled).toBe(true);
    expect(q(f, '[data-ds=number-field]').hasAttribute('data-disabled')).toBe(true);
    c.enable();
    await settle(f);
    expect(input.disabled).toBe(false);
    expect(q(f, '[data-ds=number-field]').hasAttribute('data-disabled')).toBe(false);
  });

  it('ngModel: model to view, view to model, disabled input', async () => {
    const f = TestBed.createComponent(NumT);
    await settle(f);
    const input = q<HTMLInputElement>(f, 'input');
    expect(input.value).toBe('3');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await settle(f);
    expect(f.componentInstance.value).toBe(4);
    f.componentInstance.disabled.set(true);
    await settle(f);
    expect(input.disabled).toBe(true);
  });

  it('inside a required invalid Field: for, aria-required, aria-invalid, describedby order, data-invalid', async () => {
    const f = TestBed.createComponent(NumF);
    await settle(f);
    const input = q<HTMLInputElement>(f, 'input:not([type=hidden])');
    const label = q<HTMLLabelElement>(f, 'label');
    expect(input.id).not.toBe('');
    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const ps = qa(f, 'p');
    expect((input.getAttribute('aria-describedby') ?? '').split(' ')).toEqual([ps[0]?.id, ps[1]?.id]);
    expect(q(f, '[data-ds=number-field]').hasAttribute('data-invalid')).toBe(true);
    const inc = q(f, '[data-part=increment]');
    expect(inc.getAttribute('aria-controls')).toBe(input.id);
  });
});

// ScrubInput

@Component({ imports: IMPORTS, template: `<div dsScrubInput label="W" aria-label="Width" unit="px" [min]="0" [formControl]="control"></div>` })
class ScrR {
  readonly control = new FormControl<number | null>(null);
}

@Component({ imports: IMPORTS, template: `<div dsScrubInput label="W" aria-label="Width" [(ngModel)]="value" [disabled]="disabled()"></div>` })
class ScrT {
  value: number | null = 8;
  readonly disabled = signal(false);
}

@Component({
  imports: IMPORTS,
  template: `<div dsField label="Gap" description="Space between items." error="Too wide" required><div dsScrubInput label="G" unit="px" [formControl]="control"></div></div>`,
})
class ScrF {
  readonly control = new FormControl<number | null>(8);
}

describe('ScrubInput forms', () => {
  it('reactive: model to view, view to model, touched on blur, disable', async () => {
    const f = TestBed.createComponent(ScrR);
    await settle(f);
    const c = f.componentInstance.control;
    const input = q<HTMLInputElement>(f, 'input');
    c.setValue(320);
    await settle(f);
    expect(input.value).toBe('320');
    type(input, '2*8');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await settle(f);
    expect(c.value).toBe(16);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true, bubbles: true }));
    await settle(f);
    expect(c.value).toBe(26);
    expect(c.touched).toBe(false);
    await blur(f, input);
    expect(c.touched).toBe(true);
    c.disable();
    await settle(f);
    expect(input.disabled).toBe(true);
    expect(q(f, '[data-ds=scrub-input]').hasAttribute('data-disabled')).toBe(true);
    c.enable();
    await settle(f);
    expect(input.disabled).toBe(false);
    expect(q(f, '[data-ds=scrub-input]').hasAttribute('data-disabled')).toBe(false);
  });

  it('ngModel: model to view, view to model, disabled', async () => {
    const f = TestBed.createComponent(ScrT);
    await settle(f);
    const input = q<HTMLInputElement>(f, 'input');
    expect(input.value).toBe('8');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await settle(f);
    expect(f.componentInstance.value).toBe(7);
    f.componentInstance.disabled.set(true);
    await settle(f);
    expect(input.disabled).toBe(true);
  });

  it('inside a required invalid Field: for, aria-required, aria-invalid, describedby description, error, unit', async () => {
    const f = TestBed.createComponent(ScrF);
    await settle(f);
    const input = q<HTMLInputElement>(f, 'input');
    expect(q(f, 'label').getAttribute('for')).toBe(input.id);
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const ps = qa(f, 'p');
    const unit = q(f, '[data-part=unit]');
    expect((input.getAttribute('aria-describedby') ?? '').split(' ')).toEqual([ps[0]?.id, ps[1]?.id, unit.id]);
    expect(q(f, '[data-ds=scrub-input]').hasAttribute('data-invalid')).toBe(true);
  });
});

// ToggleGroup and SegmentedControl

@Component({
  imports: IMPORTS,
  template: `<div dsToggleGroup type="multiple" aria-label="Style" [formControl]="control">
    <button dsToggleGroupItem value="b">Bold</button><button dsToggleGroupItem value="i">Italic</button></div>`,
})
class TgR {
  readonly control = new FormControl<string[]>(['b']);
}

@Component({
  imports: IMPORTS,
  template: `<div dsToggleGroup type="single" aria-label="View" [(ngModel)]="value" [disabled]="disabled()">
    <button dsToggleGroupItem value="list">List</button><button dsToggleGroupItem value="grid">Grid</button></div>`,
})
class TgT {
  value = 'list';
  readonly disabled = signal(false);
}

@Component({
  imports: IMPORTS,
  template: `<div dsSegmentedControl aria-label="Range" [formControl]="control">
    <button dsSegmentedControlItem value="day">Day</button><button dsSegmentedControlItem value="week">Week</button></div>`,
})
class ScR {
  readonly control = new FormControl<string>('day');
}

describe('ToggleGroup and SegmentedControl forms', () => {
  it('ToggleGroup multiple reactive: model to view, view to model, touched, disable sets aria-disabled', async () => {
    const f = TestBed.createComponent(TgR);
    await settle(f);
    const c = f.componentInstance.control;
    const [b, i] = qa(f, '[data-part=item]');
    expect(b!.getAttribute('aria-pressed')).toBe('true');
    c.setValue(['i']);
    await settle(f);
    expect(b!.getAttribute('aria-pressed')).toBe('false');
    expect(i!.getAttribute('aria-pressed')).toBe('true');
    b!.click();
    await settle(f);
    expect(c.value).toEqual(['i', 'b']);
    await blur(f, b!);
    expect(c.touched).toBe(true);
    c.disable();
    await settle(f);
    const g = q(f, '[data-ds=toggle-group]');
    expect(g.getAttribute('aria-disabled')).toBe('true');
    expect(b!.getAttribute('aria-disabled')).toBe('true');
    expect(b!.hasAttribute('data-disabled')).toBe(true);
    i!.click();
    await settle(f);
    expect(c.value).toEqual(['i', 'b']);
    c.enable();
    await settle(f);
    expect(g.hasAttribute('aria-disabled')).toBe(false);
    expect(b!.hasAttribute('aria-disabled')).toBe(false);
  });

  it('ToggleGroup single ngModel: view to model, a press on the on item empties it', async () => {
    const f = TestBed.createComponent(TgT);
    await settle(f);
    const [list, grid] = qa(f, '[data-part=item]');
    expect(list!.getAttribute('aria-checked')).toBe('true');
    grid!.click();
    await settle(f);
    expect(f.componentInstance.value).toBe('grid');
    grid!.click();
    await settle(f);
    expect(f.componentInstance.value).toBe('');
    f.componentInstance.disabled.set(true);
    await settle(f);
    expect(list!.getAttribute('aria-disabled')).toBe('true');
  });

  it('SegmentedControl reactive: model to view, view to model, never empty, disable', async () => {
    const f = TestBed.createComponent(ScR);
    await settle(f);
    const c = f.componentInstance.control;
    const [day, week] = qa(f, '[data-part=item]');
    c.setValue('week');
    await settle(f);
    expect(week!.getAttribute('aria-checked')).toBe('true');
    day!.click();
    await settle(f);
    expect(c.value).toBe('day');
    day!.click();
    await settle(f);
    expect(c.value).toBe('day');
    await blur(f, day!);
    expect(c.touched).toBe(true);
    c.disable();
    await settle(f);
    expect(day!.getAttribute('aria-disabled')).toBe('true');
    expect(q(f, '[data-ds=segmented-control]').hasAttribute('data-disabled')).toBe(true);
  });
});
