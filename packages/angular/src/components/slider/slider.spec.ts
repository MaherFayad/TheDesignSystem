import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { formatSliderValue } from './format';
import { DsSlider } from './slider';
import { nextStepValue, thumbInBoundsOffset, valueToPercent } from './slider-base';

@Component({
  imports: [DsSlider, DsField, DsTheme, ReactiveFormsModule, FormsModule],
  template: `
    <div data-test="plain" dsSlider label="Volume" unit="%" [defaultValue]="60" [marks]="[0, { value: 50, label: 'Half' }]"></div>
    <div data-test="bound" dsSlider aria-label="Opacity" [(value)]="opacity" (valueCommit)="saved.set($event)"></div>
    <div data-test="fine" dsSlider aria-label="Line height" [min]="1" [max]="2" [step]="0.05" [defaultValue]="1.5"></div>
    <div data-test="vertical" dsSlider aria-label="Level" orientation="vertical" [defaultValue]="30" [marks]="[0, 50]"></div>
    <div dsTheme dir="rtl" lang="ar">
      <div data-test="rtl" dsSlider label="مستوى الصوت" unit="%" [defaultValue]="60"></div>
    </div>
    <div data-test="disabled" dsSlider label="Volume" [defaultValue]="40" disabled></div>
    <div dsField label="Thumbnail scale" error="Pick 10 or more.">
      <div data-test="field" dsSlider unit="%" [min]="1" [defaultValue]="4" showValue></div>
    </div>
    <div data-test="reactive" dsSlider aria-label="Blur" [formControl]="blur"></div>
    <div data-test="template" dsSlider aria-label="Zoom" [(ngModel)]="zoom"></div>
    <form><div data-test="inform" dsSlider aria-label="Size" name="size" [defaultValue]="20"></div></form>
  `,
})
class Host {
  readonly opacity = signal<number | undefined>(40);
  readonly saved = signal<number | undefined>(undefined);
  readonly blur = new FormControl(10, { nonNullable: true });
  zoom = 50;
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
  const thumb = (id: string) => root(id).querySelector('[role="slider"]') as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const press = async (id: string, key: string, shiftKey = false) => {
    thumb(id).dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }));
    await settle();
    return thumb(id).getAttribute('aria-valuenow');
  };
  return { fixture, host: fixture.componentInstance, root, thumb, settle, press };
}

describe('formatSliderValue and the Radix arithmetic', () => {
  it('formats with Western digits and the unit', () => {
    expect(formatSliderValue(40, 'en', { unit: '%' })).toBe('40%');
    expect(formatSliderValue(250000, 'en', { unit: 'SAR' })).toBe('250,000 SAR');
    expect(formatSliderValue(12500, 'ar', { unit: 'ريال' })).toMatch(/^12.500 ريال$/);
    expect(formatSliderValue(2019, 'en', { options: { useGrouping: false } })).toBe('2019');
  });

  it('steps, keeps the thumb in bounds and maps a value to a percent', () => {
    expect(nextStepValue(1.5, 1, 0.05, 1, 1)).toBe(1.55);
    expect(nextStepValue(3, 0, 4, 1, 1)).toBe(4);
    expect(nextStepValue(60, 0, 1, -1, 10)).toBe(50);
    expect(thumbInBoundsOffset(24, 60, 1)).toBeCloseTo(-2.4);
    expect(thumbInBoundsOffset(24, 0, -1)).toBe(-12);
    expect(valueToPercent(8, 0, 24)).toBeCloseTo(33.333, 2);
  });
});

describe('DsSlider', () => {
  it('renders the Radix DOM: label, value, control, track, range, thumb wrapper, thumb and marks', async () => {
    const { root, thumb } = await setup();
    const el = root('plain');
    expect(el.getAttribute('data-ds')).toBe('slider');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-tone')).toBe('accent');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.hasAttribute('role')).toBe(false);
    for (const name of ['dsslider', 'label', 'unit', 'marks']) expect(el.hasAttribute(name)).toBe(false);
    expect([...el.children].map((c) => c.getAttribute('data-part'))).toEqual(['label', 'value', 'control', 'marks']);
    const value = el.querySelector('output[data-part="value"]') as HTMLElement;
    expect(value.getAttribute('aria-hidden')).toBe('true');
    expect(value.querySelector('bdi')?.textContent).toBe('60%');
    const control = el.querySelector('[data-part="control"]') as HTMLElement;
    expect(control.getAttribute('dir')).toBe('ltr');
    expect(control.getAttribute('aria-disabled')).toBe('false');
    expect(control.getAttribute('style')).toBe('--radix-slider-thumb-transform: translateX(-50%);');
    const range = control.querySelector('[data-part="track"] > [data-part="range"]') as HTMLElement;
    expect(range.getAttribute('style')).toBe('left: 0%; right: 40%;');
    const t = thumb('plain');
    expect(t.parentElement?.getAttribute('style')).toMatch(/^transform: var\(--radix-slider-thumb-transform\); position: absolute; left: calc\(60%/);
    expect(t.getAttribute('aria-valuemin')).toBe('0');
    expect(t.getAttribute('aria-valuemax')).toBe('100');
    expect(t.getAttribute('aria-valuenow')).toBe('60');
    expect(t.getAttribute('aria-valuetext')).toBe('60%');
    expect(t.getAttribute('aria-orientation')).toBe('horizontal');
    expect(t.getAttribute('tabindex')).toBe('0');
    expect(t.getAttribute('aria-labelledby')).toBe(el.querySelector('[data-part="label"]')?.id);
    expect(t.hasAttribute('data-active')).toBe(false);
    const marks = [...el.querySelectorAll('[data-part="marks"] > [data-mark]')];
    expect(marks.map((m) => m.getAttribute('style'))).toEqual(['--_slider-mark-at: 0%;', '--_slider-mark-at: 50%;']);
    expect(marks[1]?.textContent).toBe('Half');
  });

  it('moves by step, ten steps, and to the ends, and writes the model and the commit', async () => {
    const { host, press } = await setup();
    expect(await press('bound', 'ArrowRight')).toBe('41');
    expect(host.opacity()).toBe(41);
    expect(host.saved()).toBe(41);
    expect(await press('bound', 'ArrowUp')).toBe('42');
    expect(await press('bound', 'PageUp')).toBe('52');
    expect(await press('bound', 'ArrowLeft', true)).toBe('42');
    expect(await press('bound', 'PageDown')).toBe('32');
    expect(await press('bound', 'ArrowDown')).toBe('31');
    expect(await press('bound', 'End')).toBe('100');
    expect(await press('bound', 'Home')).toBe('0');
    expect(host.saved()).toBe(0);
  });

  it('follows a bound value', async () => {
    const { host, thumb, settle } = await setup();
    host.opacity.set(75);
    await settle();
    expect(thumb('bound').getAttribute('aria-valuenow')).toBe('75');
  });

  it('snaps decimal steps', async () => {
    const { press } = await setup();
    expect(await press('fine', 'ArrowRight')).toBe('1.55');
    expect(await press('fine', 'PageDown')).toBe('1.05');
  });

  it('arrows follow the reading direction of the nearest theme', async () => {
    const { root, press } = await setup();
    expect(root('rtl').querySelector('[data-part="control"]')?.getAttribute('dir')).toBe('rtl');
    expect(root('rtl').querySelector('[data-part="range"]')?.getAttribute('style')).toBe('right: 0%; left: 40%;');
    expect(await press('rtl', 'ArrowRight')).toBe('59');
    expect(await press('rtl', 'ArrowLeft')).toBe('60');
    expect(await press('rtl', 'ArrowUp')).toBe('61');
  });

  it('vertical: the thumb sits from the bottom, ArrowUp goes up and no marks show', async () => {
    const { root, press } = await setup();
    const el = root('vertical');
    expect(el.getAttribute('data-orientation')).toBe('vertical');
    expect(el.querySelector('[data-part="control"]')?.getAttribute('style')).toBe('--radix-slider-thumb-transform: translateY(50%);');
    expect(el.querySelector('[role="slider"]')?.parentElement?.getAttribute('style')).toMatch(/bottom: calc\(30%/);
    expect(el.querySelector('[data-part="marks"]')).toBeNull();
    expect(await press('vertical', 'ArrowUp')).toBe('31');
    expect(await press('vertical', 'ArrowRight')).toBe('32');
  });

  it('a press on the track moves the value there', async () => {
    const { root, thumb, settle } = await setup();
    const control = root('bound').querySelector('[data-part="control"]') as HTMLElement;
    control.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 24, right: 200, bottom: 24, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    control.dispatchEvent(new MouseEvent('pointerdown', { clientX: 150, clientY: 12, bubbles: true, cancelable: true }));
    await settle();
    expect(thumb('bound').getAttribute('aria-valuenow')).toBe('75');
    expect(root('bound').hasAttribute('data-dragging')).toBe(true);
  });

  it('disabled: no tab stop, aria-disabled and data-disabled, keys do nothing', async () => {
    const { root, thumb, press } = await setup();
    expect(root('disabled').hasAttribute('data-disabled')).toBe(true);
    expect(root('disabled').hasAttribute('disabled')).toBe(false);
    expect(thumb('disabled').hasAttribute('tabindex')).toBe(false);
    expect(thumb('disabled').hasAttribute('data-disabled')).toBe(true);
    expect(root('disabled').querySelector('[data-part="control"]')?.getAttribute('aria-disabled')).toBe('true');
    expect(await press('disabled', 'ArrowRight')).toBe('40');
  });

  it('reads id, the error, invalid and the label from a Field', async () => {
    const { fixture, root, thumb } = await setup();
    const field = fixture.nativeElement.querySelector('[data-ds="field"]') as HTMLElement;
    const label = field.querySelector(':scope > label') as HTMLElement;
    const error = field.querySelector('[data-part="error"]') as HTMLElement;
    const t = thumb('field');
    expect(t.id).toBe(label.getAttribute('for'));
    expect(t.getAttribute('aria-labelledby')).toBe(label.id);
    expect(t.getAttribute('aria-describedby')).toBe(error.id);
    expect(t.getAttribute('aria-invalid')).toBe('true');
    expect(root('field').hasAttribute('data-invalid')).toBe(true);
    expect(root('field').querySelector('[data-part="value"] bdi')?.textContent).toBe('4%');
  });

  it('works with a reactive form control, both ways, and with its disabled state', async () => {
    const { host, thumb, press, settle } = await setup();
    expect(thumb('reactive').getAttribute('aria-valuenow')).toBe('10');
    expect(thumb('reactive').getAttribute('aria-label')).toBe('Blur');
    await press('reactive', 'ArrowRight');
    expect(host.blur.value).toBe(11);
    host.blur.setValue(30);
    await settle();
    expect(thumb('reactive').getAttribute('aria-valuenow')).toBe('30');
    host.blur.disable();
    await settle();
    expect(thumb('reactive').hasAttribute('tabindex')).toBe(false);
  });

  it('works with ngModel', async () => {
    const { host, press, settle } = await setup();
    await settle();
    expect(await press('template', 'PageUp')).toBe('60');
    expect(host.zoom).toBe(60);
  });

  it('inside a form, a hidden input carries the name and value', async () => {
    const { root, press, settle } = await setup();
    await settle();
    const input = root('inform').querySelector('[data-part="control"] > input') as HTMLInputElement;
    expect(input.getAttribute('style')).toBe('display: none;');
    expect(input.name).toBe('size');
    expect(input.value).toBe('20');
    await press('inform', 'ArrowRight');
    expect(input.value).toBe('21');
    expect(root('plain').querySelector('input')).toBeNull();
  });
});
