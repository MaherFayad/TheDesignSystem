import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsRating, ratingItemLabel, ratingValueLabel, starFill } from './rating';

@Component({
  imports: [DsRating, DsTheme, ReactiveFormsModule, FormsModule],
  template: `
    <div data-test="plain" dsRating aria-label="Rate this board" size="lg" tone="accent" [(value)]="score"></div>
    <div data-test="ten" dsRating aria-label="Recommend" [max]="10" [defaultValue]="8" showValue [getItemLabel]="custom"></div>
    <div data-test="readonly" dsRating readOnly [value]="4.5" showValue aria-labelledby="heading" aria-describedby="note">(128 reviews)</div>
    <div data-test="unrated" dsRating readOnly [value]="0">No ratings yet</div>
    <div data-test="bare" dsRating readOnly [value]="3"></div>
    <div data-test="disabled" dsRating aria-label="Rate" disabled [defaultValue]="2">Open it first.</div>
    <div dsTheme lang="ar" dir="rtl">
      <div data-test="ar" dsRating aria-label="تقييم" [defaultValue]="3"></div>
      <div data-test="ar-readonly" dsRating readOnly [value]="0"></div>
    </div>
    <div data-test="reactive" dsRating aria-label="Rate" [formControl]="stars"></div>
    <div data-test="template" dsRating aria-label="Rate" [(ngModel)]="model"></div>
    <form><div data-test="inform" dsRating aria-label="Rate" name="score" [defaultValue]="2"></div></form>
  `,
})
class Host {
  readonly score = signal<number | undefined>(3);
  readonly stars = new FormControl<number>(2, { nonNullable: true });
  model = 0;
  readonly custom = (score: number, max: number) => `${score} / ${max}`;
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  await settle();
  const root = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
  const stars = (id: string) => Array.from(root(id).querySelectorAll<HTMLButtonElement>('button[data-part="item"]'));
  const key = (el: HTMLElement, k: string) => {
    const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    return event;
  };
  return { fixture, host: fixture.componentInstance, root, stars, settle, key };
}

describe('DsRating', () => {
  it('rounds to the nearest half, and names stars in the language', () => {
    expect(starFill(3, 2.74)).toBe('half');
    expect(starFill(3, 2.75)).toBe('full');
    expect(starFill(3, 2.2)).toBe('empty');
    expect(ratingItemLabel(3, 5)).toBe('3 of 5 stars');
    expect(ratingItemLabel(3, 5, 'ar')).toBe('3 من 5 نجوم');
    expect(ratingValueLabel(4.5, 5)).toBe('4.5 of 5 stars');
    expect(ratingValueLabel(4.5, 5, 'ar')).toBe('4.5 من 5 نجوم');
    expect(ratingValueLabel(0, 5)).toBe('Not rated');
    expect(ratingValueLabel(0, 5, 'ar')).toBe('بدون تقييم');
  });

  it('renders a named radiogroup of stars, each named "n of max stars"', async () => {
    const { root, stars } = await setup();
    const el = root('plain');
    expect(el.getAttribute('data-ds')).toBe('rating');
    expect(el.getAttribute('role')).toBe('radiogroup');
    expect(el.getAttribute('aria-label')).toBe('Rate this board');
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.getAttribute('data-tone')).toBe('accent');
    expect(el.getAttribute('aria-orientation')).toBe('horizontal');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.hasAttribute('data-readonly')).toBe(false);
    const all = stars('plain');
    expect(all).toHaveLength(5);
    expect(all.map((s) => s.getAttribute('aria-label'))).toEqual(['1 of 5 stars', '2 of 5 stars', '3 of 5 stars', '4 of 5 stars', '5 of 5 stars']);
    expect(all[2]?.getAttribute('aria-checked')).toBe('true');
    expect(all[2]?.getAttribute('data-orientation')).toBe('horizontal');
    expect(all.map((s) => s.hasAttribute('data-filled'))).toEqual([true, true, true, false, false]);
    expect(all[0]?.querySelector('svg')?.getAttribute('data-icon')).toBe('star-filled');
    expect(all[4]?.querySelector('svg')?.getAttribute('data-icon')).toBe('star');
  });

  it('supports ten stars, custom names and the value text', async () => {
    const { root, stars } = await setup();
    expect(stars('ten')).toHaveLength(10);
    expect(stars('ten')[0]?.getAttribute('aria-label')).toBe('1 / 10');
    const value = root('ten').querySelector('[data-part="value"]') as HTMLElement;
    expect(value.textContent).toBe('8');
    expect(root('ten').getAttribute('aria-describedby')).toBe(value.id);
  });

  it('picks a score on click and fills the stars up to it', async () => {
    const { host, root, stars, settle } = await setup();
    stars('plain')[3]?.click();
    await settle();
    expect(host.score()).toBe(4);
    expect(stars('plain').filter((s) => s.hasAttribute('data-filled'))).toHaveLength(4);
    expect(root('plain').querySelector('[data-part="value"]')).toBeNull();
  });

  it('changes the score with the arrows, ignores Up and Down, and Home and End pick the ends', async () => {
    const { host, stars, settle, key } = await setup();
    const all = stars('plain');
    all[2]?.focus();
    key(all[2] as HTMLElement, 'ArrowRight');
    await settle();
    expect(host.score()).toBe(4);
    expect(document.activeElement).toBe(all[3]);
    key(all[3] as HTMLElement, 'ArrowUp');
    await settle();
    expect(host.score()).toBe(4);
    key(all[3] as HTMLElement, 'End');
    await settle();
    expect(host.score()).toBe(5);
    expect(document.activeElement).toBe(all[4]);
    key(all[4] as HTMLElement, 'ArrowRight');
    await settle();
    expect(host.score()).toBe(5);
    key(all[4] as HTMLElement, 'Home');
    await settle();
    expect(host.score()).toBe(1);
    expect(document.activeElement).toBe(all[0]);
  });

  it('defaults the star names to the Theme language and flips the arrows in right to left', async () => {
    const { root, stars, settle, key } = await setup();
    const all = stars('ar');
    expect(all[2]?.getAttribute('aria-label')).toBe('3 من 5 نجوم');
    expect(root('ar-readonly').querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('بدون تقييم');
    all[2]?.focus();
    key(all[2] as HTMLElement, 'ArrowLeft');
    await settle();
    expect(all[3]?.getAttribute('aria-checked')).toBe('true');
  });

  it('read only is role img with a label, half stars, the text outside it and no tab stop', async () => {
    const { root, stars } = await setup();
    const el = root('readonly');
    expect(el.hasAttribute('data-readonly')).toBe(true);
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('tabindex')).toBe(false);
    expect(el.hasAttribute('style')).toBe(false);
    expect(el.getAttribute('aria-describedby')).toBe('note');
    expect(stars('readonly')).toHaveLength(0);
    const img = el.querySelector('[data-part="stars"]') as HTMLElement;
    expect(img.getAttribute('role')).toBe('img');
    expect(img.getAttribute('aria-label')).toBe('4.5 of 5 stars');
    expect(img.getAttribute('aria-labelledby')).toBe(`heading ${img.id}`);
    expect(Array.from(img.querySelectorAll('svg')).map((s) => s.getAttribute('data-icon'))).toEqual([
      'star-filled',
      'star-filled',
      'star-filled',
      'star-filled',
      'star-half',
    ]);
    const value = el.querySelector('[data-part="value"]') as HTMLElement;
    expect(value.parentElement).toBe(el);
    expect(value.textContent).toBe('4.5 (128 reviews)');
    expect(root('unrated').querySelector('[data-part="value"]')?.textContent).toBe('No ratings yet');
    expect(root('unrated').querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Not rated');
    expect(root('bare').querySelector('[data-part="value"]')).toBeNull();
  });

  it('disables every star with native disabled and describes the group with the text', async () => {
    const { root, stars } = await setup();
    const el = root('disabled');
    expect(el.hasAttribute('data-disabled')).toBe(true);
    expect(el.getAttribute('tabindex')).toBe('-1');
    for (const star of stars('disabled')) expect(star.disabled).toBe(true);
    const value = el.querySelector('[data-part="value"]') as HTMLElement;
    expect(value.textContent).toBe('Open it first.');
    expect(el.getAttribute('aria-describedby')).toBe(value.id);
  });

  it('works with a reactive form control and ngModel', async () => {
    const { host, stars, settle } = await setup();
    expect(stars('reactive')[1]?.getAttribute('aria-checked')).toBe('true');
    stars('reactive')[4]?.click();
    await settle();
    expect(host.stars.value).toBe(5);
    host.stars.setValue(1);
    await settle();
    expect(stars('reactive')[0]?.getAttribute('aria-checked')).toBe('true');
    host.stars.disable();
    await settle();
    expect(stars('reactive')[0]?.disabled).toBe(true);
    stars('template')[2]?.click();
    await settle();
    expect(host.model).toBe(3);
  });

  it('inside a form, a hidden native radio follows each star', async () => {
    const { root, stars, settle } = await setup();
    const inputs = Array.from(root('inform').querySelectorAll<HTMLInputElement>('input[type="radio"]'));
    expect(inputs).toHaveLength(5);
    expect(inputs[0]?.previousElementSibling).toBe(stars('inform')[0]);
    expect(inputs[1]?.checked).toBe(true);
    expect(inputs[1]?.name).toBe('score');
    expect(inputs[1]?.value).toBe('2');
    stars('inform')[3]?.click();
    await settle();
    expect(inputs[3]?.checked).toBe(true);
  });

  it('dispatches a click on the hidden radio after a pick, as Radix, so a form sees the change', async () => {
    const { fixture, stars, settle } = await setup();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const seen: string[] = [];
    form.addEventListener('click', (e) => {
      const t = e.target as HTMLInputElement;
      if (t.type === 'radio') seen.push(`${t.value}:${t.checked}`);
    });
    stars('inform')[3]?.click();
    await settle();
    expect(seen).toContain('4:true');
    expect(seen).toContain('2:false');
  });
});
