// Temporary QA spec (ds-qa review angular-2, batch A3.1 and A3.2): every
// selection control with reactive forms, ngModel, a Field and a native form.
// Copied to docs/reports/reviews/shots/angular-2/a3-checks/forms/ and removed
// from the package.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsCheckboxGroup } from '../checkbox-group/checkbox-group';
import { DsField } from '../field/field';
import { DsForm } from '../form/form';
import { DsRadioCard, DsRadioCardItem } from '../radio-card/radio-card';
import { DsRadioGroup, DsRadioGroupItem } from '../radio-group/radio-group';
import { DsRangeSlider } from '../range-slider/range-slider';
import { DsRating } from '../rating/rating';
import { DsSlider } from '../slider/slider';
import { DsSwitch } from '../switch/switch';
import { DsCheckbox } from './checkbox';

const IMPORTS = [
  ReactiveFormsModule, FormsModule, DsField, DsCheckbox, DsCheckboxGroup, DsSwitch, DsSlider, DsRangeSlider,
  DsRadioGroup, DsRadioGroupItem, DsRadioCard, DsRadioCardItem, DsRating,
];

const LOG: string[] = [];
const say = (line: string) => LOG.push(line);
const tick = () => new Promise((r) => setTimeout(r, 0));

async function mount<T>(type: new () => T) {
  const fixture = TestBed.createComponent(type);
  fixture.autoDetectChanges();
  await fixture.whenStable();
  await tick();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const settle = async () => {
    fixture.componentRef.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    await tick();
    await fixture.whenStable();
  };
  return { fixture, el, host: fixture.componentInstance, settle };
}

const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

/** Normalized dump of the attributes that matter for Field wiring. */
function wiring(root: HTMLElement): Record<string, unknown> {
  const label = root.querySelector('[data-ds=field] > label, [data-ds=field] > [data-part=label]') as HTMLLabelElement | null;
  const target = label?.htmlFor ? root.ownerDocument.getElementById(label.htmlFor) : null;
  const ctl = root.querySelector('[role=checkbox],[role=switch],[role=slider],[role=radiogroup],fieldset') as HTMLElement | null;
  const ids = new Map<string, string>();
  const n = (v: string | null) => (v ? v.split(/\s+/).map((id) => {
    const t = root.ownerDocument.getElementById(id);
    return t ? `${t.tagName.toLowerCase()}[${t.getAttribute('data-part') ?? t.getAttribute('data-ds') ?? t.getAttribute('role')}]` : `missing:${id}`;
  }).join(' ') : null);
  void ids;
  return {
    labelFor: label ? (label.htmlFor ? (target ? `${target.tagName.toLowerCase()} role=${target.getAttribute('role')}` : 'points at nothing') : 'no for') : 'no label',
    labelId: label?.id ? 'yes' : 'no',
    control: ctl ? `${ctl.tagName.toLowerCase()} role=${ctl.getAttribute('role')}` : null,
    labelledby: n(ctl?.getAttribute('aria-labelledby') ?? null),
    describedby: n(ctl?.getAttribute('aria-describedby') ?? null),
    invalid: ctl?.getAttribute('aria-invalid') ?? null,
    required: ctl?.getAttribute('aria-required') ?? null,
    dataInvalid: root.querySelector('[data-ds=field] > :is([data-ds=checkbox],[data-ds=switch],[data-ds=slider],[data-ds=range-slider],[data-ds=checkbox-group],[data-ds=radio-group],[data-ds=radio-card],[data-ds=rating])')?.hasAttribute('data-invalid') ?? null,
    firstItemInvalid: root.querySelector('[data-ds=field] [data-ds=checkbox] [role=checkbox]')?.getAttribute('aria-invalid') ?? null,
  };
}

// 1. Reactive forms and ngModel, one host per control.

@Component({
  imports: IMPORTS,
  template: `
    <div data-t="checkbox" dsCheckbox label="News" [formControl]="checkbox"></div>
    <div data-t="switch" dsSwitch label="Sounds" [formControl]="sw"></div>
    <div data-t="slider" dsSlider label="Volume" [formControl]="slider"></div>
    <div data-t="range" dsRangeSlider label="Price" [thumbLabels]="['Low', 'High']" [formControl]="range"></div>
    <fieldset data-t="cgroup" dsCheckboxGroup legend="Channels" [formControl]="cgroup">
      <div dsCheckbox value="a" label="A"></div><div dsCheckbox value="b" label="B"></div>
    </fieldset>
    <div data-t="rgroup" dsRadioGroup label="View" [formControl]="rgroup">
      <div dsRadioGroupItem value="a" label="A"></div><div dsRadioGroupItem value="b" label="B"></div>
    </div>
    <div data-t="rcard" dsRadioCard aria-label="Plan" [formControl]="rcard">
      <button dsRadioCardItem value="a" title="A"></button><button dsRadioCardItem value="b" title="B"></button>
    </div>
    <div data-t="rating" dsRating aria-label="Score" [formControl]="rating"></div>
  `,
})
class Reactive {
  readonly checkbox = new FormControl<boolean | 'indeterminate' | null>(null, Validators.requiredTrue);
  readonly sw = new FormControl<boolean | null>(null, Validators.requiredTrue);
  readonly slider = new FormControl<number | null>(null, Validators.min(10));
  readonly range = new FormControl<[number, number] | null>(null);
  readonly cgroup = new FormControl<string[] | null>(null, Validators.required);
  readonly rgroup = new FormControl<string | null>(null, Validators.required);
  readonly rcard = new FormControl<string | null>(null, Validators.required);
  readonly rating = new FormControl<number | null>(null, Validators.required);
}

@Component({
  imports: IMPORTS,
  template: `
    <div data-t="checkbox" dsCheckbox label="News" [(ngModel)]="checkbox" [disabled]="off()"></div>
    <div data-t="switch" dsSwitch label="Sounds" [(ngModel)]="sw" [disabled]="off()"></div>
    <div data-t="slider" dsSlider label="Volume" [(ngModel)]="slider" [disabled]="off()"></div>
    <div data-t="range" dsRangeSlider label="Price" [thumbLabels]="['Low', 'High']" [(ngModel)]="range" [disabled]="off()"></div>
    <fieldset data-t="cgroup" dsCheckboxGroup legend="Channels" [(ngModel)]="cgroup" [disabled]="off()">
      <div dsCheckbox value="a" label="A"></div><div dsCheckbox value="b" label="B"></div>
    </fieldset>
    <div data-t="rgroup" dsRadioGroup label="View" [(ngModel)]="rgroup" [disabled]="off()">
      <div dsRadioGroupItem value="a" label="A"></div><div dsRadioGroupItem value="b" label="B"></div>
    </div>
    <div data-t="rcard" dsRadioCard aria-label="Plan" [(ngModel)]="rcard" [disabled]="off()">
      <button dsRadioCardItem value="a" title="A"></button><button dsRadioCardItem value="b" title="B"></button>
    </div>
    <div data-t="rating" dsRating aria-label="Score" [(ngModel)]="rating" [disabled]="off()"></div>
  `,
})
class Template {
  readonly checkbox = signal<boolean | 'indeterminate'>(false);
  readonly sw = signal(false);
  readonly slider = signal(0);
  readonly range = signal<[number, number]>([0, 100]);
  readonly cgroup = signal<string[]>([]);
  readonly rgroup = signal('');
  readonly rcard = signal('');
  readonly rating = signal(0);
  readonly off = signal(false);
}

interface Spec {
  t: string;
  model: unknown;
  /** What the view shows for model. */
  shows: (root: HTMLElement) => unknown;
  shown: unknown;
  /** A person changes the value. */
  act: (root: HTMLElement) => void;
  after: unknown;
  /** The elements that must be disabled. */
  disabledOk: (root: HTMLElement) => boolean;
  enabledOk: (root: HTMLElement) => boolean;
  focusable: (root: HTMLElement) => HTMLElement;
}

const checkedOf = (root: HTMLElement) => root.querySelector('[data-part=control]')?.getAttribute('aria-checked');
const thumbs = (root: HTMLElement) => [...root.querySelectorAll('[role=slider]')] as HTMLElement[];
const radios = (root: HTMLElement) => [...root.querySelectorAll('[role=radio]')] as HTMLButtonElement[];
const boxes = (root: HTMLElement) => [...root.querySelectorAll('[role=checkbox]')] as HTMLButtonElement[];

const SPECS: Spec[] = [
  {
    t: 'checkbox', model: true, shows: checkedOf, shown: 'true',
    act: (r) => (r.querySelector('[data-part=control]') as HTMLElement).click(), after: false,
    disabledOk: (r) => (r.querySelector('[data-part=control]') as HTMLButtonElement).disabled && r.hasAttribute('data-disabled'),
    enabledOk: (r) => !(r.querySelector('[data-part=control]') as HTMLButtonElement).disabled && !r.hasAttribute('data-disabled'),
    focusable: (r) => r.querySelector('[data-part=control]') as HTMLElement,
  },
  {
    t: 'switch', model: true, shows: checkedOf, shown: 'true',
    act: (r) => (r.querySelector('[data-part=control]') as HTMLElement).click(), after: false,
    disabledOk: (r) => (r.querySelector('[data-part=control]') as HTMLButtonElement).disabled && r.hasAttribute('data-disabled'),
    enabledOk: (r) => !(r.querySelector('[data-part=control]') as HTMLButtonElement).disabled && !r.hasAttribute('data-disabled'),
    focusable: (r) => r.querySelector('[data-part=control]') as HTMLElement,
  },
  {
    t: 'slider', model: 30, shows: (r) => thumbs(r).map((x) => x.getAttribute('aria-valuenow')).join(','), shown: '30',
    act: (r) => key(thumbs(r)[0]!, 'ArrowRight'), after: 31,
    disabledOk: (r) => r.hasAttribute('data-disabled') && thumbs(r)[0]!.getAttribute('tabindex') === null && r.querySelector('[data-part=control]')!.getAttribute('aria-disabled') === 'true',
    enabledOk: (r) => !r.hasAttribute('data-disabled') && thumbs(r)[0]!.getAttribute('tabindex') === '0',
    focusable: (r) => thumbs(r)[0]!,
  },
  {
    t: 'range', model: [20, 80], shows: (r) => thumbs(r).map((x) => x.getAttribute('aria-valuenow')).join(','), shown: '20,80',
    act: (r) => key(thumbs(r)[0]!, 'ArrowRight'), after: [21, 80],
    disabledOk: (r) => r.hasAttribute('data-disabled') && thumbs(r).every((x) => x.getAttribute('tabindex') === null),
    enabledOk: (r) => !r.hasAttribute('data-disabled') && thumbs(r).every((x) => x.getAttribute('tabindex') === '0'),
    focusable: (r) => thumbs(r)[0]!,
  },
  {
    t: 'cgroup', model: ['a'], shows: (r) => boxes(r).map((b) => b.getAttribute('aria-checked')).join(','), shown: 'true,false',
    act: (r) => boxes(r)[1]!.click(), after: ['a', 'b'],
    disabledOk: (r) => boxes(r).every((b) => b.disabled) && r.hasAttribute('data-disabled'),
    enabledOk: (r) => boxes(r).every((b) => !b.disabled) && !r.hasAttribute('data-disabled'),
    focusable: (r) => boxes(r)[0]!,
  },
  {
    t: 'rgroup', model: 'b', shows: (r) => radios(r).map((b) => b.getAttribute('aria-checked')).join(','), shown: 'false,true',
    act: (r) => radios(r)[0]!.click(), after: 'a',
    disabledOk: (r) => radios(r).every((b) => b.disabled) && r.hasAttribute('data-disabled'),
    enabledOk: (r) => radios(r).every((b) => !b.disabled) && !r.hasAttribute('data-disabled'),
    focusable: (r) => radios(r)[0]!,
  },
  {
    t: 'rcard', model: 'b', shows: (r) => radios(r).map((b) => b.getAttribute('aria-checked')).join(','), shown: 'false,true',
    act: (r) => radios(r)[0]!.click(), after: 'a',
    disabledOk: (r) => radios(r).every((b) => b.disabled) && r.hasAttribute('data-disabled'),
    enabledOk: (r) => radios(r).every((b) => !b.disabled) && !r.hasAttribute('data-disabled'),
    focusable: (r) => radios(r)[0]!,
  },
  {
    t: 'rating', model: 3, shows: (r) => radios(r).map((b) => b.getAttribute('aria-checked')).join(','), shown: 'false,false,true,false,false',
    act: (r) => radios(r)[4]!.click(), after: 5,
    disabledOk: (r) => radios(r).every((b) => b.disabled) && r.hasAttribute('data-disabled'),
    enabledOk: (r) => radios(r).every((b) => !b.disabled) && !r.hasAttribute('data-disabled'),
    focusable: (r) => radios(r)[0]!,
  },
];

describe('A3 QA: reactive forms', () => {
  for (const s of SPECS) {
    it(`${s.t}: model to view, view to model, disable and enable, touched on blur, validator`, async () => {
      const { el, host, settle } = await mount(Reactive);
      const root = el.querySelector(`[data-t="${s.t}"]`) as HTMLElement;
      const ctl = (host as unknown as Record<string, FormControl>)[s.t === 'switch' ? 'sw' : s.t]!;
      const invalidAtStart = ctl.invalid;
      ctl.setValue(s.model as never);
      await settle();
      expect(s.shows(root)).toBe(s.shown);
      s.act(root);
      await settle();
      expect(ctl.value).toEqual(s.after);
      expect(ctl.dirty).toBe(true);
      ctl.disable();
      await settle();
      expect(s.disabledOk(root)).toBe(true);
      ctl.enable();
      await settle();
      expect(s.enabledOk(root)).toBe(true);
      // A key moves focus to the thumb, and disabling then blurs it: start the blur check from untouched.
      say(`[reactive] ${s.t}: touched before the blur check ${ctl.touched}`);
      ctl.markAsUntouched();
      const f = s.focusable(root);
      f.focus();
      f.blur();
      f.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      await settle();
      expect(ctl.touched).toBe(true);
      say(`[reactive] ${s.t}: invalid at start ${invalidAtStart}, ng classes "${root.className}"`);
    });
  }
});

describe('A3 QA: ngModel', () => {
  for (const s of SPECS) {
    it(`${s.t}: model to view, view to model, disabled through the binding`, async () => {
      const { el, host, settle } = await mount(Template);
      const root = el.querySelector(`[data-t="${s.t}"]`) as HTMLElement;
      const h = host as unknown as Record<string, ReturnType<typeof signal<unknown>>>;
      h[s.t === 'switch' ? 'sw' : s.t]!.set(s.model);
      await settle();
      expect(s.shows(root)).toBe(s.shown);
      s.act(root);
      await settle();
      expect(h[s.t === 'switch' ? 'sw' : s.t]!()).toEqual(s.after);
      h['off']!.set(true);
      await settle();
      expect(s.disabledOk(root)).toBe(true);
      h['off']!.set(false);
      await settle();
      expect(s.enabledOk(root)).toBe(true);
    });
  }
});

// 2. Inside a Field: label, description, error and required.

@Component({
  imports: IMPORTS,
  template: `
    <div data-t="checkbox"><div dsField label="L" description="D" error="E" required><div dsCheckbox label="Own"></div></div></div>
    <div data-t="switch"><div dsField label="L" description="D" error="E" required><div dsSwitch label="Own"></div></div></div>
    <div data-t="slider"><div dsField label="L" description="D" error="E" required><div dsSlider></div></div></div>
    <div data-t="range"><div dsField label="L" description="D" error="E" required><div dsRangeSlider [thumbLabels]="['Low', 'High']"></div></div></div>
    <div data-t="cgroup"><div dsField label="L" description="D" error="E" required><fieldset dsCheckboxGroup legend="G"><div dsCheckbox value="a" label="A"></div></fieldset></div></div>
    <div data-t="rgroup"><div dsField label="L" description="D" error="E" required><div dsRadioGroup><div dsRadioGroupItem value="a" label="A"></div></div></div></div>
    <div data-t="rcard"><div dsField label="L" description="D" error="E" required><div dsRadioCard><button dsRadioCardItem value="a" title="A"></button></div></div></div>
    <div data-t="rating"><div dsField label="L" description="D" error="E" required><div dsRating></div></div></div>
  `,
})
class InField {}

describe('A3 QA: Field wiring dump', () => {
  it('dumps the wiring of each control inside a required Field', async () => {
    const { el } = await mount(InField);
    for (const t of ['checkbox', 'switch', 'slider', 'range', 'cgroup', 'rgroup', 'rcard', 'rating']) {
      say(`[field] ${t} ${JSON.stringify(wiring(el.querySelector(`[data-t="${t}"]`) as HTMLElement))}`);
      if (t === 'rgroup' || t === 'cgroup') say(`[html] ${(el.querySelector(`[data-t="${t}"]`) as HTMLElement).innerHTML.replace(/<!--[^>]*-->/g, '')}`);
    }
  });
});

// 3. Native form: hidden inputs, FormData, the events a form listener sees, reset.

@Component({
  imports: IMPORTS,
  template: `
    <form data-t="form">
      <div dsCheckbox label="Terms" name="terms" value="yes"></div>
      <div dsSwitch label="Sounds" name="sounds"></div>
      <div dsSlider label="Volume" name="volume" [defaultValue]="30"></div>
      <div dsRangeSlider label="Price" name="price" [thumbLabels]="['Low', 'High']" [defaultValue]="[20, 80]"></div>
      <fieldset dsCheckboxGroup legend="Channels" name="channels" selectAll="All channels">
        <div dsCheckbox value="a" label="A"></div><div dsCheckbox value="b" label="B"></div>
      </fieldset>
      <div dsRadioGroup label="View" name="view" defaultValue="a">
        <div dsRadioGroupItem value="a" label="A"></div><div dsRadioGroupItem value="b" label="B"></div>
      </div>
      <div dsRadioCard aria-label="Plan" name="plan">
        <button dsRadioCardItem value="a" title="A"></button><button dsRadioCardItem value="b" title="B"></button>
      </div>
      <div dsRating aria-label="Score" name="score" [defaultValue]="2"></div>
    </form>
  `,
})
class NativeForm {}

describe('A3 QA: native form', () => {
  it('posts the values and fires the events a form listener sees', async () => {
    const { el, settle } = await mount(NativeForm);
    const form = el.querySelector('form') as HTMLFormElement;
    const events: string[] = [];
    for (const type of ['input', 'change', 'click']) {
      form.addEventListener(type, (e) => {
        const t = e.target as HTMLElement;
        if (t.tagName === 'INPUT') events.push(`${type}:${(t as HTMLInputElement).name || '(no name)'}`);
      });
    }
    const entries = () => [...new FormData(form).entries()].map(([k, v]) => `${k}=${v}`).join('&');
    say(`[form] start ${entries()}`);
    const q = (s: string) => form.querySelector(s) as HTMLElement;
    (q('[data-ds=checkbox] [role=checkbox]')).click();
    (q('[data-ds=switch] [role=switch]')).click();
    key(q('[data-ds=slider] [role=slider]'), 'ArrowRight');
    key(q('[data-ds=range-slider] [role=slider]'), 'ArrowRight');
    (q('[data-part=select-all] [role=checkbox]')).click();
    (form.querySelectorAll('[data-ds=radio-group] [role=radio]')[1] as HTMLElement).click();
    (form.querySelectorAll('[data-ds=radio-card] [role=radio]')[0] as HTMLElement).click();
    (form.querySelectorAll('[data-ds=rating] [role=radio]')[3] as HTMLElement).click();
    await settle();
    say(`[form] after ${entries()}`);
    say(`[form] events ${events.join(' ')}`);
    form.reset();
    await settle();
    say(`[form] after reset ${entries()}`);
    const hidden = [...form.querySelectorAll('input')].map((i) => `${i.type}|${i.name}|${i.getAttribute('aria-hidden')}|${i.getAttribute('tabindex')}|${i.required}`);
    say(`[form] hidden inputs ${hidden.join(' ; ')}`);
    expect(true).toBe(true);
  });
});


// 4. dsForm: after a failed submit, a pick in each control clears its summary entry.

@Component({
  imports: [...IMPORTS, DsForm],
  template: `
    <form dsForm [validators]="validators">
      <div dsCheckbox label="Terms" name="terms" value="yes" required></div>
      <div dsSlider label="Volume" name="volume" [defaultValue]="0"></div>
      <div dsRadioGroup label="View" name="view" required>
        <div dsRadioGroupItem value="a" label="A"></div><div dsRadioGroupItem value="b" label="B"></div>
      </div>
      <div dsRadioCard aria-label="Plan" name="plan" required>
        <button dsRadioCardItem value="a" title="A"></button><button dsRadioCardItem value="b" title="B"></button>
      </div>
      <div dsRating aria-label="Score" name="score" required></div>
      <button type="submit">Send form</button>
    </form>
  `,
})
class WithForm {
  readonly validators = { volume: (v: unknown) => (Number(v) < 10 ? 'Pick 10 or more.' : undefined) };
}

describe('A3 QA: dsForm summary', () => {
  it('clears each summary entry once the control changes', async () => {
    const { el, settle } = await mount(WithForm);
    const form = el.querySelector('form') as HTMLFormElement;
    const summary = () => [...form.querySelectorAll('[data-part=summary] li')].map((li) => li.textContent?.trim()).join(' | ');
    form.requestSubmit();
    await settle();
    say(`[dsForm] after submit: ${summary()}`);
    (form.querySelector('[data-ds=checkbox] [role=checkbox]') as HTMLElement).click();
    await settle();
    say(`[dsForm] after checking terms: ${summary()}`);
    const thumb = form.querySelector('[role=slider]') as HTMLElement;
    for (let i = 0; i < 12; i++) key(thumb, 'ArrowRight');
    await settle();
    say(`[dsForm] after volume 12: ${summary()}`);
    (form.querySelectorAll('[data-ds=radio-group] [role=radio]')[0] as HTMLElement).click();
    (form.querySelectorAll('[data-ds=radio-card] [role=radio]')[0] as HTMLElement).click();
    (form.querySelectorAll('[data-ds=rating] [role=radio]')[2] as HTMLElement).click();
    await settle();
    say(`[dsForm] after picking view, plan and score: ${summary()}`);
    form.requestSubmit();
    await settle();
    say(`[dsForm] after a second submit: ${summary()}`);
  });
});

// 5. Static inputs: nothing consumed is left on a host.
@Component({
  imports: IMPORTS,
  template: `
    <div data-p="checkbox" dsCheckbox label="A" description="D" size="lg" tone="accent" disabled readOnly required invalid value="x" name="n" id="cb" aria-label="Box" aria-describedby="ext" [defaultChecked]="true"></div>
    <div data-p="switch" dsSwitch label="A" description="D" size="lg" tone="accent" disabled readOnly required invalid value="x" name="n" id="sw" aria-label="Sw" defaultChecked></div>
    <div data-p="slider" dsSlider label="A" size="sm" tone="accent" unit="%" disabled invalid name="n" id="sl" aria-label="Sl" orientation="vertical" showValue></div>
    <div data-p="range" dsRangeSlider label="A" size="sm" unit="%" disabled invalid name="n" id="rs" [thumbLabels]="['Low', 'High']" showValue></div>
    <fieldset data-p="cgroup" dsCheckboxGroup legend="G" description="D" error="E" size="sm" orientation="horizontal" name="n" disabled invalid readOnly selectAll="All" aria-describedby="ext"><div dsCheckbox value="a" label="A"></div></fieldset>
    <div data-p="rgroup" dsRadioGroup label="G" description="D" error="E" invalid defaultValue="a" disabled required name="n" orientation="horizontal" size="sm" tone="accent" loop aria-labelledby="ext" aria-describedby="ext"><div dsRadioGroupItem value="a" label="A" description="D" disabled id="ri" aria-describedby="ext"></div></div>
    <div data-p="rcard" dsRadioCard aria-label="Plan" defaultValue="a" disabled required invalid name="n" orientation="horizontal" size="sm" tone="accent" loop><button dsRadioCardItem value="a" title="A" description="D" end="E" icon="user" disabled></button></div>
    <div data-p="rating" dsRating aria-label="Score" disabled required name="n" size="sm" tone="accent" showValue aria-describedby="ext"></div>
    <div data-p="rating-ro" dsRating aria-label="Score" readOnly showValue></div>
  `,
})
class Probe {}

describe('A3 QA: static input probe', () => {
  it('lists the host attributes', async () => {
    const { el } = await mount(Probe);
    for (const host of el.querySelectorAll('[data-p]')) {
      const attrs = [...host.attributes].map((a) => a.name).filter((n) => !n.startsWith('_ng') && n !== 'data-p');
      const items = [...host.querySelectorAll('[dsCheckbox],[dsRadioGroupItem],[dsRadioCardItem],[dscheckbox],[dsradiogroupitem],[dsradiocarditem],[title],[label],[value]')]
        .filter((e) => !(e instanceof HTMLButtonElement && e.getAttribute('role') !== 'radio') || true)
        .map((e) => `${e.tagName.toLowerCase()}(${[...e.attributes].map((a) => a.name).filter((n) => ['title', 'label', 'value', 'description', 'disabled', 'id'].includes(n) || n.startsWith('ds')).join(',')})`);
      say(`[probe] ${host.getAttribute('data-p')}: ${attrs.join(' ')} || inner ${items.join(' ')}`);
    }
  });
});

describe('A3 QA: log', () => {
  it('prints the log (fails on purpose so the runner shows it)', () => {
    expect(LOG.join('\n')).toBe('');
  });
});
