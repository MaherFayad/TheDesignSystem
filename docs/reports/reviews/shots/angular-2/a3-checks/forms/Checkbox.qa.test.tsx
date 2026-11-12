// Temporary QA test (ds-qa review angular-2, batch A3): the React side of the
// Field wiring dump and the native form check in checkbox.qa.spec.ts.
// Copied to docs/reports/reviews/shots/angular-2/a3-checks/forms/ and removed.
import { act, fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CheckboxGroup } from '../CheckboxGroup/CheckboxGroup';
import { Field } from '../Field/Field';
import { Form } from '../Form/Form';
import { RadioCard, RadioCardItem } from '../RadioCard/RadioCard';
import { RadioGroup, RadioGroupItem } from '../RadioGroup/RadioGroup';
import { RangeSlider } from '../RangeSlider/RangeSlider';
import { Rating } from '../Rating/Rating';
import { Slider } from '../Slider/Slider';
import { Switch } from '../Switch/Switch';
import { Checkbox } from './Checkbox';

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const LOG: string[] = [];
const say = (line: string) => LOG.push(line);

function wiring(root: HTMLElement): Record<string, unknown> {
  const label = root.querySelector('[data-ds=field] > label, [data-ds=field] > [data-part=label]') as HTMLLabelElement | null;
  const target = label?.htmlFor ? root.ownerDocument.getElementById(label.htmlFor) : null;
  const ctl = root.querySelector('[role=checkbox],[role=switch],[role=slider],[role=radiogroup],fieldset') as HTMLElement | null;
  const n = (v: string | null) => (v ? v.split(/\s+/).map((id) => {
    const t = root.ownerDocument.getElementById(id);
    return t ? `${t.tagName.toLowerCase()}[${t.getAttribute('data-part') ?? t.getAttribute('data-ds') ?? t.getAttribute('role')}]` : `missing:${id}`;
  }).join(' ') : null);
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

const f = (child: React.ReactNode) => (
  <Field label="L" description="D" error="E" required>
    {child}
  </Field>
);

describe('A3 QA React', () => {
  it('dumps the Field wiring', () => {
    const cases: [string, React.ReactNode][] = [
      ['checkbox', <Checkbox label="Own" />],
      ['switch', <Switch label="Own" />],
      ['slider', <Slider />],
      ['range', <RangeSlider thumbLabels={['Low', 'High']} />],
      ['cgroup', <CheckboxGroup legend="G"><Checkbox value="a" label="A" /></CheckboxGroup>],
      ['rgroup', <RadioGroup><RadioGroupItem value="a" label="A" /></RadioGroup>],
      ['rcard', <RadioCard><RadioCardItem value="a" title="A" /></RadioCard>],
      ['rating', <Rating />],
    ];
    for (const [t, node] of cases) {
      const { container, unmount } = render(<div>{f(node)}</div>);
      say(`[field] ${t} ${JSON.stringify(wiring(container as HTMLElement))}`);
      unmount();
    }
  });

  it('posts the values and fires the events a form listener sees', async () => {
    const { container } = render(
      <form>
        <Checkbox label="Terms" name="terms" value="yes" />
        <Switch label="Sounds" name="sounds" />
        <Slider label="Volume" name="volume" defaultValue={30} />
        <RangeSlider label="Price" name="price" thumbLabels={['Low', 'High']} defaultValue={[20, 80]} />
        <CheckboxGroup legend="Channels" name="channels" selectAll="All channels">
          <Checkbox value="a" label="A" />
          <Checkbox value="b" label="B" />
        </CheckboxGroup>
        <RadioGroup label="View" name="view" defaultValue="a">
          <RadioGroupItem value="a" label="A" />
          <RadioGroupItem value="b" label="B" />
        </RadioGroup>
        <RadioCard aria-label="Plan" name="plan">
          <RadioCardItem value="a" title="A" />
          <RadioCardItem value="b" title="B" />
        </RadioCard>
        <Rating aria-label="Score" name="score" defaultValue={2} />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
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
    await act(async () => {
      fireEvent.click(q('[data-ds=checkbox] [role=checkbox]'));
      fireEvent.click(q('[data-ds=switch] [role=switch]'));
      fireEvent.keyDown(q('[data-ds=slider] [role=slider]'), { key: 'ArrowRight' });
      fireEvent.keyDown(q('[data-ds=range-slider] [role=slider]'), { key: 'ArrowRight' });
      fireEvent.click(q('[data-part=select-all] [role=checkbox]'));
      fireEvent.click(form.querySelectorAll('[data-ds=radio-group] [role=radio]')[1] as HTMLElement);
      fireEvent.click(form.querySelectorAll('[data-ds=radio-card] [role=radio]')[0] as HTMLElement);
      fireEvent.click(form.querySelectorAll('[data-ds=rating] [role=radio]')[3] as HTMLElement);
    });
    say(`[form] after ${entries()}`);
    say(`[form] events ${events.join(' ')}`);
    await act(async () => form.reset());
    await act(async () => {});
    say(`[form] after reset ${entries()}`);
    const hidden = [...form.querySelectorAll('input')].map((i) => `${i.type}|${i.name}|${i.getAttribute('aria-hidden')}|${i.getAttribute('tabindex')}|${i.required}`);
    say(`[form] hidden inputs ${hidden.join(' ; ')}`);
  });

  it('clears each summary entry once the control changes', async () => {
    const validators = { volume: (v: unknown) => (Number(v) < 10 ? 'Pick 10 or more.' : undefined) };
    const { container } = render(
      <Form validators={validators}>
        <Checkbox label="Terms" name="terms" value="yes" required />
        <Slider label="Volume" name="volume" defaultValue={0} />
        <RadioGroup label="View" name="view" required>
          <RadioGroupItem value="a" label="A" />
          <RadioGroupItem value="b" label="B" />
        </RadioGroup>
        <RadioCard aria-label="Plan" name="plan" required>
          <RadioCardItem value="a" title="A" />
          <RadioCardItem value="b" title="B" />
        </RadioCard>
        <Rating aria-label="Score" name="score" required />
        <button type="submit">Send form</button>
      </Form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    const summary = () => [...form.querySelectorAll('[data-part=summary] li')].map((li) => li.textContent?.trim()).join(' | ');
    await act(async () => { fireEvent.submit(form); });
    say(`[Form] after submit: ${summary()}`);
    await act(async () => { fireEvent.click(form.querySelector('[data-ds=checkbox] [role=checkbox]') as HTMLElement); });
    say(`[Form] after checking terms: ${summary()}`);
    const thumb = form.querySelector('[role=slider]') as HTMLElement;
    await act(async () => { for (let i = 0; i < 12; i++) fireEvent.keyDown(thumb, { key: 'ArrowRight' }); });
    say(`[Form] after volume 12: ${summary()}`);
    await act(async () => {
      fireEvent.click(form.querySelectorAll('[data-ds=radio-group] [role=radio]')[0] as HTMLElement);
      fireEvent.click(form.querySelectorAll('[data-ds=radio-card] [role=radio]')[0] as HTMLElement);
      fireEvent.click(form.querySelectorAll('[data-ds=rating] [role=radio]')[2] as HTMLElement);
    });
    say(`[Form] after picking view, plan and score: ${summary()}`);
  });

  it('prints the log (fails on purpose so the runner shows it)', () => {
    expect(LOG.join('\n')).toBe('');
  });
});
