// Round 2 motion of FormWizard (order 1.22): wizard-step and wizard-done,
// with React's beats. jsdom has no Web Animations API, so Element.animate
// is a stand in that records each call.
import { Component, viewChild, type TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { landPop, slideIn, token } from '../../internal/motion-fields';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { DsInput } from '../input/input';
import { DsFormWizard, type FormWizardStep, type FormWizardTemplateContext } from './form-wizard';

interface Call {
  el: Element;
  frames: Keyframe[];
  opts: KeyframeAnimationOptions;
}

let calls: Call[] = [];
const ids = (id: string) => calls.filter((c) => String(c.opts.id) === `ds-motion:${id}`);

beforeEach(() => {
  calls = [];
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value: vi.fn(function (this: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
      calls.push({ el: this, frames, opts });
      return { id: String(opts?.id ?? ''), finished: new Promise(() => undefined), cancel: vi.fn() } as unknown as Animation;
    }),
  });
});

afterEach(() => {
  Reflect.deleteProperty(Element.prototype, 'animate');
  document.documentElement.removeAttribute('data-motion');
});

@Component({
  imports: [DsTheme, DsFormWizard, DsField, DsInput],
  template: `
    <div dsTheme="desk">
      @if (steps(); as s) {
        <div dsFormWizard [steps]="s" [defaultStep]="start" [onSubmit]="submit"></div>
      }
    </div>
    <ng-template #one><div dsField label="Work email"><div dsInput name="email" value="sara@example.com"></div></div></ng-template>
    <ng-template #two><div dsField label="Team name"><div dsInput name="team" value="Design"></div></div></ng-template>
    <ng-template #three><p>Check the details and send the form.</p></ng-template>
  `,
})
class Host {
  readonly one = viewChild.required<TemplateRef<FormWizardTemplateContext>>('one');
  readonly two = viewChild.required<TemplateRef<FormWizardTemplateContext>>('two');
  readonly three = viewChild.required<TemplateRef<FormWizardTemplateContext>>('three');
  start = 0;
  readonly submit = () => Promise.resolve();
  private made: FormWizardStep[] | undefined;
  steps(): FormWizardStep[] | undefined {
    if (this.made) return this.made;
    try {
      this.made = [
        { id: 'account', title: 'Account', content: this.one() },
        { id: 'team', title: 'Team', content: this.two() },
        { id: 'review', title: 'Review', content: this.three() },
      ];
    } catch {
      return undefined;
    }
    return this.made;
  }
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

async function setup(start = 0) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.start = start;
  document.body.appendChild(fixture.nativeElement);
  const settle = async () => {
    for (let i = 0; i < 4; i += 1) {
      await tick();
      await fixture.whenStable();
    }
  };
  await settle();
  const root = (fixture.nativeElement as HTMLElement).querySelector('[data-ds="form-wizard"]') as HTMLElement;
  const press = async (part: string) => {
    root.querySelector<HTMLElement>(`[data-part="${part}"]`)!.click();
    await settle();
  };
  return { fixture, root, press, settle };
}

// jsdom lays nothing out: give every element a box, so the leaving step has one to copy.
const box = { x: 0, y: 0, top: 0, left: 0, right: 320, bottom: 80, width: 320, height: 80, toJSON: () => ({}) } as DOMRect;
beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(box);
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('form wizard motion, order 1.22', () => {
  it('wizard-step: the old step leaves as an inert copy toward the start, the new one comes from the end, the completed mark lands its check', async () => {
    const { root, press } = await setup();
    expect(ids('wizard-step')).toHaveLength(0);
    await press('next');
    const body = root.querySelector('[data-part="body"][data-step="1"]');
    const [enter] = ids('wizard-step');
    expect(enter?.el).toBe(body);
    expect(enter?.frames).toEqual(slideIn({}, `translateX(calc(1 * ${token.enter}))`).keyframes);
    const [out] = ids('wizard-step-out');
    const copy = out?.el as HTMLElement;
    expect(copy.getAttribute('aria-hidden')).toBe('true');
    expect(copy.hasAttribute('inert')).toBe(true);
    expect(copy.hasAttribute('data-part')).toBe(false);
    expect(copy.querySelector('[id], [name]')).toBeNull();
    expect(out?.frames).toEqual([
      { transform: 'none', opacity: 1 },
      { transform: `translateX(calc(-1 * ${token.enter}))`, opacity: 0 },
    ]);
    expect(out?.opts.fill).toBe('forwards');
    const [check] = ids('wizard-step-check');
    const first = root.querySelectorAll(':scope > [data-part="steps"] [data-part="step"]')[0];
    expect(check?.el).toBe(first?.querySelector(':scope > [data-part="indicator"] > *'));
    expect(check?.frames).toEqual(landPop().keyframes);

    await press('back');
    const back = ids('wizard-step').at(-1);
    expect(back?.frames).toEqual(slideIn({}, `translateX(calc(-1 * ${token.enter}))`).keyframes);
    expect(ids('wizard-step-check')).toHaveLength(1);
  });

  it('wizard-step reduced: the steps cross fade and the marks stay', async () => {
    const { press } = await setup();
    document.documentElement.setAttribute('data-motion', 'reduce');
    await press('next');
    expect(ids('wizard-step')[0]?.frames).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    expect(ids('wizard-step-out')[0]?.frames).toEqual([{ opacity: 1 }, { opacity: 0 }]);
    expect(ids('wizard-step-check')).toHaveLength(0);
  });

  it('wizard-done: every mark dips and springs back once the form is sent; reduced plays nothing', async () => {
    const { root, press } = await setup(2);
    await press('submit');
    expect(root.getAttribute('data-state')).toBe('done');
    const marks = [...root.querySelectorAll(':scope > [data-part="steps"] [data-part="indicator"]')];
    const played = ids('wizard-done');
    expect(played.map((c) => c.el)).toEqual(marks);
    expect(played[0]?.frames.map((f) => f.transform)).toEqual(['none', `scale(${token.anticipate})`, 'none']);

    calls = [];
    document.documentElement.setAttribute('data-motion', 'reduce');
    const reduced = await setup(2);
    await reduced.press('submit');
    expect(ids('wizard-done')).toHaveLength(0);
  });
});
