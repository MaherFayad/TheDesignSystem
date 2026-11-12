import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsRadioCard, DsRadioCardItem } from './radio-card';

@Component({
  imports: [DsRadioCard, DsRadioCardItem, DsTheme, ReactiveFormsModule, FormsModule],
  template: `
    <p id="plan-heading">Plan</p>
    <div data-test="plain" dsRadioCard aria-labelledby="plan-heading" [(value)]="plan" size="sm" tone="accent" orientation="horizontal">
      <button dsRadioCardItem value="free" title="Free" description="Up to 3 boards." end="$0"></button>
      <button dsRadioCardItem value="team" title="Team" icon="user" end="$12"></button>
      <button dsRadioCardItem value="pro" title="Pro" disabled></button>
    </div>
    <div dsTheme dir="rtl">
      <div data-test="rtl" dsRadioCard aria-label="الباقة" defaultValue="free">
        <button dsRadioCardItem value="free" title="مجانية"></button>
        <button dsRadioCardItem value="team" title="الفريق"></button>
      </div>
    </div>
    <div data-test="invalid" dsRadioCard aria-label="Billing" invalid required disabled>
      <button dsRadioCardItem value="monthly" title="Monthly"></button>
    </div>
    <div data-test="reactive" dsRadioCard aria-label="Region" [formControl]="region">
      <button dsRadioCardItem value="me" title="Middle East"></button>
      <button dsRadioCardItem value="us" title="United States"></button>
    </div>
    <div data-test="template" dsRadioCard aria-label="Period" [(ngModel)]="period">
      <button dsRadioCardItem value="monthly" title="Monthly"></button>
      <button dsRadioCardItem value="yearly" title="Yearly"></button>
    </div>
    <form>
      <div data-test="inform" dsRadioCard aria-label="Plan" name="plan" defaultValue="b">
        <button dsRadioCardItem value="a" title="A"></button>
        <button dsRadioCardItem value="b" title="B"></button>
      </div>
    </form>
  `,
})
class Host {
  readonly plan = signal<string | undefined>('team');
  readonly region = new FormControl<string>('me', { nonNullable: true });
  period = 'monthly';
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
  const cards = (id: string) => Array.from(root(id).querySelectorAll<HTMLButtonElement>('[data-part="item"]'));
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const key = (el: HTMLElement, k: string) => {
    const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    return event;
  };
  return { fixture, host: fixture.componentInstance, root, cards, settle, key };
}

describe('DsRadioCard', () => {
  it('renders a radiogroup root and one radio card per item, named by the title', async () => {
    const { root, cards } = await setup();
    const el = root('plain');
    expect(el.getAttribute('data-ds')).toBe('radio-card');
    expect(el.getAttribute('role')).toBe('radiogroup');
    expect(el.getAttribute('aria-labelledby')).toBe('plan-heading');
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.getAttribute('data-tone')).toBe('accent');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.getAttribute('aria-orientation')).toBe('horizontal');
    expect(el.getAttribute('aria-required')).toBe('false');
    expect(el.getAttribute('tabindex')).toBe('0');
    for (const name of ['dsradiocard', 'size', 'tone', 'orientation']) expect(el.hasAttribute(name)).toBe(false);
    const [free, team] = cards('plain');
    expect(free?.tagName).toBe('BUTTON');
    expect(free?.getAttribute('role')).toBe('radio');
    expect(free?.getAttribute('type')).toBe('button');
    expect(free?.hasAttribute('title')).toBe(false);
    expect(free?.hasAttribute('dsradiocarditem')).toBe(false);
    expect(free?.hasAttribute('data-radix-collection-item')).toBe(true);
    expect(document.getElementById(free?.getAttribute('aria-labelledby') ?? '')?.textContent).toBe('Free');
    const described = (free?.getAttribute('aria-describedby') ?? '').split(' ').map((id) => document.getElementById(id)?.textContent);
    expect(described).toEqual(['Up to 3 boards.', '$0']);
    expect(free?.querySelector('[data-part="indicator"]')?.getAttribute('data-state')).toBe('unchecked');
    expect(team?.getAttribute('aria-checked')).toBe('true');
    expect(team?.getAttribute('data-state')).toBe('checked');
    const icon = team?.querySelector('[data-part="icon"]');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(icon?.querySelector('svg')?.getAttribute('data-size')).toBe('md');
  });

  it('checks on click anywhere on the card and writes the model back', async () => {
    const { host, cards, settle } = await setup();
    (cards('plain')[0]?.querySelector('[data-part="title"]') as HTMLElement).click();
    await settle();
    expect(host.plan()).toBe('free');
    expect(cards('plain')[0]?.getAttribute('aria-checked')).toBe('true');
  });

  it('moves and selects with the arrows, skipping a disabled card', async () => {
    const { host, cards, settle, key } = await setup();
    const [free, team] = cards('plain');
    team?.focus();
    key(team as HTMLElement, 'ArrowDown');
    await settle();
    expect(document.activeElement).toBe(free);
    expect(host.plan()).toBe('free');
    expect(free?.getAttribute('tabindex')).toBe('0');
    expect(team?.getAttribute('tabindex')).toBe('-1');
  });

  it('follows the reading direction: ArrowLeft moves to the next card in right to left', async () => {
    const { cards, settle, key } = await setup();
    const [free, team] = cards('rtl');
    free?.focus();
    key(free as HTMLElement, 'ArrowLeft');
    await settle();
    expect(document.activeElement).toBe(team);
    expect(team?.getAttribute('aria-checked')).toBe('true');
  });

  it('marks invalid, required and disabled', async () => {
    const { root, cards } = await setup();
    const el = root('invalid');
    expect(el.getAttribute('aria-invalid')).toBe('true');
    expect(el.hasAttribute('data-invalid')).toBe(true);
    expect(el.getAttribute('aria-required')).toBe('true');
    expect(el.hasAttribute('data-disabled')).toBe(true);
    expect(cards('invalid')[0]?.disabled).toBe(true);
    expect(cards('plain')[2]?.disabled).toBe(true);
    expect(cards('plain')[2]?.hasAttribute('data-disabled')).toBe(true);
  });

  it('works with a reactive form control and ngModel', async () => {
    const { host, cards, settle } = await setup();
    cards('reactive')[1]?.click();
    await settle();
    expect(host.region.value).toBe('us');
    host.region.setValue('me');
    await settle();
    expect(cards('reactive')[0]?.getAttribute('aria-checked')).toBe('true');
    host.region.disable();
    await settle();
    expect(cards('reactive')[0]?.disabled).toBe(true);
    cards('template')[1]?.click();
    await settle();
    expect(host.period).toBe('yearly');
  });

  it('inside a form, a hidden native radio follows each card', async () => {
    const { root, cards, settle } = await setup();
    await settle();
    const [a, b] = cards('inform');
    const input = a?.nextElementSibling as HTMLInputElement;
    expect(input.tagName).toBe('INPUT');
    expect(input.type).toBe('radio');
    expect(input.getAttribute('aria-hidden')).toBe('true');
    expect(input.tabIndex).toBe(-1);
    expect(input.name).toBe('plan');
    expect(input.value).toBe('a');
    expect((b?.nextElementSibling as HTMLInputElement).checked).toBe(true);
    a?.click();
    await settle();
    expect(input.checked).toBe(true);
    expect(root('plain').querySelector('input')).toBeNull();
  });

  it('dispatches a click on the hidden radio after a pick, as Radix, so a form sees the change', async () => {
    const { fixture, cards, settle } = await setup();
    await settle();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const seen: string[] = [];
    form.addEventListener('click', (e) => {
      const t = e.target as HTMLInputElement;
      if (t.type === 'radio') seen.push(`${t.value}:${t.checked}`);
    });
    cards('inform')[0]?.click();
    await settle();
    expect(seen).toContain('a:true');
    expect(seen).toContain('b:false');
  });
});
