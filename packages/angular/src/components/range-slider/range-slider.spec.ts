import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { DsRangeSlider, type RangeSliderValue } from './range-slider';

@Component({
  imports: [DsRangeSlider, DsField, DsTheme, ReactiveFormsModule, FormsModule],
  template: `
    <div data-test="plain" dsRangeSlider label="Price" unit="SAR" [max]="1000" [step]="50" [defaultValue]="[200, 700]" [thumbLabels]="['Minimum price', 'Maximum price']"></div>
    <div data-test="bound" dsRangeSlider [thumbLabels]="['First year', 'Last year']" [min]="2000" [max]="2026" [formatOptions]="{ useGrouping: false }" [(value)]="years" (valueCommit)="saved.set($event)"></div>
    <div data-test="gap" dsRangeSlider [thumbLabels]="['Low', 'High']" [max]="1000" [step]="50" [minStepsBetweenThumbs]="2" [defaultValue]="[450, 500]"></div>
    <div dsTheme dir="rtl">
      <div data-test="rtl" dsRangeSlider [thumbLabels]="['Low', 'High']" [max]="1000" [step]="50" [defaultValue]="[200, 700]"></div>
    </div>
    <div dsField error="Leave a gap.">
      <div data-test="field" dsRangeSlider [thumbLabels]="['Low', 'High']" [defaultValue]="[20, 60]"></div>
    </div>
    <div data-test="reactive" dsRangeSlider [thumbLabels]="['Low', 'High']" [formControl]="range"></div>
    <div data-test="template" dsRangeSlider [thumbLabels]="['Low', 'High']" [(ngModel)]="model"></div>
    <form><div data-test="inform" dsRangeSlider [thumbLabels]="['Low', 'High']" name="price" [defaultValue]="[10, 90]"></div></form>
  `,
})
class Host {
  readonly years = signal<RangeSliderValue | undefined>([2019, 2020]);
  readonly saved = signal<RangeSliderValue | undefined>(undefined);
  readonly range = new FormControl<RangeSliderValue>([20, 80], { nonNullable: true });
  model: RangeSliderValue = [0, 100];
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
  const thumbs = (id: string) => [...root(id).querySelectorAll<HTMLElement>('[role="slider"]')];
  const values = (id: string) => thumbs(id).map((t) => Number(t.getAttribute('aria-valuenow')));
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const press = async (id: string, index: number, key: string) => {
    const t = thumbs(id)[index] as HTMLElement;
    t.focus();
    t.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    await settle();
    return values(id);
  };
  return { fixture, host: fixture.componentInstance, root, thumbs, values, settle, press };
}

describe('DsRangeSlider', () => {
  it('renders two named thumbs, start and end, in a group named by the label', async () => {
    const { root, thumbs } = await setup();
    const el = root('plain');
    expect(el.getAttribute('data-ds')).toBe('range-slider');
    expect(el.getAttribute('role')).toBe('group');
    expect(el.getAttribute('aria-labelledby')).toBe(el.querySelector('[data-part="label"]')?.id);
    for (const name of ['dsrangeslider', 'thumblabels', 'label']) expect(el.hasAttribute(name)).toBe(false);
    const [start, end] = thumbs('plain');
    expect(start?.getAttribute('data-thumb')).toBe('start');
    expect(end?.getAttribute('data-thumb')).toBe('end');
    expect(start?.getAttribute('aria-label')).toBe('Minimum price');
    expect(end?.getAttribute('aria-label')).toBe('Maximum price');
    expect(start?.hasAttribute('aria-labelledby')).toBe(false);
    expect(end?.getAttribute('aria-valuetext')).toBe('700 SAR');
    expect([...el.querySelectorAll('[data-part="value"] bdi')].map((b) => b.textContent)).toEqual(['200 SAR', '700 SAR']);
    expect(el.querySelector('[data-part="value"]')?.textContent).toBe('200 SAR - 700 SAR');
    expect(el.querySelector('[data-part="range"]')?.getAttribute('style')).toBe('left: 20%; right: 30%;');
  });

  it('the thumbs never cross, and Home and End stop at the other thumb', async () => {
    const { host, press } = await setup();
    expect(await press('bound', 0, 'ArrowRight')).toEqual([2019, 2020]);
    expect(await press('bound', 0, 'End')).toEqual([2019, 2020]);
    expect(await press('bound', 0, 'Home')).toEqual([2000, 2020]);
    expect(host.years()).toEqual([2000, 2020]);
    expect(host.saved()).toEqual([2000, 2020]);
    expect(await press('bound', 1, 'Home')).toEqual([2000, 2001]);
    expect(await press('bound', 1, 'End')).toEqual([2000, 2026]);
    expect(await press('bound', 1, 'PageDown')).toEqual([2000, 2016]);
    expect(await press('bound', 0, 'PageUp')).toEqual([2010, 2016]);
  });

  it('keeps minStepsBetweenThumbs', async () => {
    const { press } = await setup();
    expect(await press('gap', 1, 'ArrowLeft')).toEqual([450, 550]);
    expect(await press('gap', 1, 'Home')).toEqual([450, 550]);
    expect(await press('gap', 0, 'End')).toEqual([450, 550]);
  });

  it('arrows follow the reading direction, and the range sits from the right', async () => {
    const { root, press } = await setup();
    expect(root('rtl').querySelector('[data-part="range"]')?.getAttribute('style')).toBe('right: 20%; left: 30%;');
    expect(await press('rtl', 0, 'ArrowRight')).toEqual([150, 700]);
    expect(await press('rtl', 1, 'ArrowLeft')).toEqual([150, 750]);
  });

  it('keeps the last focused or pressed thumb on top', async () => {
    const { root, thumbs, settle } = await setup();
    const [start, end] = thumbs('bound') as [HTMLElement, HTMLElement];
    expect(start.hasAttribute('data-active')).toBe(false);
    expect(start.parentElement?.getAttribute('style')).not.toContain('z-index');
    end.focus();
    await settle();
    expect(end.hasAttribute('data-active')).toBe(true);
    expect(end.parentElement?.getAttribute('style')).toMatch(/; z-index: 1;$/);
    end.blur();
    await settle();
    expect(end.hasAttribute('data-active')).toBe(true);
    start.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
    await settle();
    expect(start.hasAttribute('data-active')).toBe(true);
    expect(end.hasAttribute('data-active')).toBe(false);
    expect(start.parentElement?.getAttribute('style')).toContain('z-index: 1');
    expect(root('bound').querySelectorAll('[data-active]').length).toBe(1);
  });

  it('a press on the track moves the closest thumb', async () => {
    const { root, values, settle } = await setup();
    const control = root('plain').querySelector('[data-part="control"]') as HTMLElement;
    control.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 24, right: 1000, bottom: 24, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    control.dispatchEvent(new MouseEvent('pointerdown', { clientX: 900, clientY: 12, bubbles: true, cancelable: true }));
    await settle();
    expect(values('plain')).toEqual([200, 900]);
    expect(root('plain').querySelector('[data-thumb="end"]')?.hasAttribute('data-active')).toBe(true);
  });

  it('reads the error and invalid from a Field; the start thumb takes the control id', async () => {
    const { fixture, thumbs } = await setup();
    const error = fixture.nativeElement.querySelector('[data-ds="field"] [data-part="error"]') as HTMLElement;
    const [start, end] = thumbs('field');
    expect(start?.id).toBeTruthy();
    expect(end?.hasAttribute('id')).toBe(false);
    for (const t of [start, end]) {
      expect(t?.getAttribute('aria-describedby')).toBe(error.id);
      expect(t?.getAttribute('aria-invalid')).toBe('true');
    }
  });

  it('works with a reactive form control, both ways', async () => {
    const { host, values, press, settle } = await setup();
    expect(values('reactive')).toEqual([20, 80]);
    await press('reactive', 1, 'ArrowRight');
    expect(host.range.value).toEqual([20, 81]);
    host.range.setValue([5, 10]);
    await settle();
    expect(values('reactive')).toEqual([5, 10]);
  });

  it('works with ngModel', async () => {
    const { host, press, settle } = await setup();
    await settle();
    await press('template', 0, 'PageUp');
    expect(host.model).toEqual([10, 100]);
  });

  it('inside a form, each thumb has a hidden input named name[]', async () => {
    const { root, settle } = await setup();
    await settle();
    const inputs = [...root('inform').querySelectorAll<HTMLInputElement>('input')];
    expect(inputs.map((i) => i.name)).toEqual(['price[]', 'price[]']);
    expect(inputs.map((i) => i.value)).toEqual(['10', '90']);
  });
});
