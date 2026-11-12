// Round 2 motion of the text inputs and forms family (order 1.22), and the
// fixes of the round 1 review that live in CSS (B1, B2). One test per
// interaction or fix; jsdom has no Web Animations API, so Element.animate
// is a stand in that records each call.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { ConsentField } from '../ConsentField/ConsentField';
import { FieldError } from '../FieldError/FieldError';
import { Form, FormField, FormSubmit } from '../Form/Form';
import { FormWizard } from '../FormWizard/FormWizard';
import { InlineEdit } from '../InlineEdit/InlineEdit';
import { Input } from '../Input/Input';
import { shakeBeat } from '../Input/useErrorShake';
import { ScrubInput } from '../ScrubInput/ScrubInput';
import { SearchField } from '../SearchField/SearchField';
import { Field, FieldDescription } from './Field';

interface Call {
  el: Element;
  frames: Keyframe[];
  opts: KeyframeAnimationOptions;
}

function mockAnimate() {
  const calls: Call[] = [];
  const animate = vi.fn(function (this: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
    calls.push({ el: this, frames, opts });
    return {
      id: String(opts?.id ?? ''),
      playState: 'running',
      finished: new Promise(() => {}),
      cancel: vi.fn(),
    } as unknown as Animation;
  });
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value: animate,
  });
  return {
    calls,
    restore: () => Reflect.deleteProperty(Element.prototype, 'animate'),
  };
}

const desk = (ui: ReactNode) => <Theme style="desk">{ui}</Theme>;
const ids = (calls: Call[], id: string) => calls.filter((c) => String(c.opts.id) === `ds-motion:${id}`);
const css = (name: string) => readFileSync(join(process.cwd(), `packages/css/src/components/${name}.css`), 'utf8');

describe('field motion, order 1.22', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('error-shake: shrinking swings toward the inline end first, then a settle to rest; RTL starts the other way', () => {
    const ltr = shakeBeat(1);
    expect(ltr.keyframes).toHaveLength(6);
    expect(ltr.keyframes[0]?.transform).toBe('none');
    expect(ltr.keyframes[5]?.transform).toBe('none');
    expect(String(ltr.keyframes[1]?.transform)).toContain('calc(1 * var(--ds-distance-shift');
    expect(String(shakeBeat(-1).keyframes[1]?.transform)).toContain('calc(-1 * var(--ds-distance-shift');
    expect(String(ltr.keyframes[3]?.transform)).toContain('--ds-distance-nudge');
  });

  it('field-error-enter: an error that shows after first paint slides in and its icon lands; one there at first paint does not move', () => {
    const { calls, restore } = mockAnimate();
    try {
      const { rerender, container } = render(
        desk(
          <Field label="Email" error="Enter an email address.">
            {<Input />}
          </Field>,
        ),
      );
      expect(ids(calls, 'field-error-enter')).toHaveLength(0);
      rerender(desk(<Field label="Email">{<Input />}</Field>));
      rerender(
        desk(
          <Field label="Email" error="Enter an email address.">
            {<Input />}
          </Field>,
        ),
      );
      const error = container.querySelector('[data-ds="field-error"]');
      expect(ids(calls, 'field-error-enter')[0]?.el).toBe(error);
      // Order 1.23: it comes out from under the control, behind a clip-path that holds its top edge.
      const frames = ids(calls, 'field-error-enter')[0]?.frames ?? [];
      expect(frames[0]).toMatchObject({ transform: 'translateY(-100%)', clipPath: 'inset(100% 0 0 0)' });
      expect(frames[frames.length - 1]).toMatchObject({ transform: 'none', clipPath: 'inset(0 0 0 0)' });
      expect(ids(calls, 'field-error-enter-icon')[0]?.el).toBe(error?.querySelector('[data-part="icon"]'));
      // The control shakes on the same commit.
      expect(ids(calls, 'error-shake')[0]?.el).toBe(container.querySelector('[data-ds="input"]'));
    } finally {
      restore();
    }
  });

  it('field-error-enter: a standalone FieldError enters when it turns on', () => {
    const { calls, restore } = mockAnimate();
    try {
      const { rerender } = render(desk(<FieldError>{''}</FieldError>));
      rerender(desk(<FieldError>Pick a date.</FieldError>));
      expect(ids(calls, 'field-error-enter')).toHaveLength(1);
    } finally {
      restore();
    }
  });

  it('field-message-enter: a description that renders after first paint slides in', () => {
    const { calls, restore } = mockAnimate();
    try {
      const { rerender } = render(desk(<Field label="Name">{<Input />}</Field>));
      rerender(
        desk(
          <Field label="Name">
            <Input />
            <FieldDescription>Shown on your profile.</FieldDescription>
          </Field>,
        ),
      );
      const call = ids(calls, 'field-message-enter')[0];
      expect(call?.el.getAttribute('data-part')).toBe('description');
      expect(String(call?.frames[0]?.transform)).toContain('--ds-distance-shift');
    } finally {
      restore();
    }
  });

  it('field-label-focus: Field.css lifts the label on focus and keeps it still under both reduced motion settings', () => {
    const field = css('Field');
    expect(field).toMatch(/\[data-ds='field'\]:focus-within:not\(\[data-disabled\], \[data-readonly\]\) > \[data-part='label'\] \{\s*transform: translateY/);
    expect(field).toContain("@media (prefers-reduced-motion: reduce) {\n    [data-ds='field'] {\n      --_field-lift: 0px;");
    expect(field).toContain(":root[data-motion='reduce'] [data-ds='field'] {\n    --_field-lift: 0px;");
  });

  it('B1: the Rating focus ring shows at once: its ::before layer has no transition', () => {
    const rating = css('Rating');
    const ring = /\[data-ds='rating'\] > \[data-part='item'\]::before \{([^}]*)\}/.exec(rating)?.[1] ?? '';
    expect(ring).toContain('box-shadow: var(--_rating-ring)');
    expect(ring).not.toContain('transition');
  });

  it('B2: every reduced motion block in the family files applies under data-motion="reduce" too', () => {
    const files = [
      'Field',
      'FormWizard',
      'InlineEdit',
      'Input',
      'NumberField',
      'OTPField',
      'PasswordField',
      'PhoneField',
      'Rating',
      'ScrubInput',
      'SearchField',
      'Textarea',
    ];
    for (const f of files) {
      const text = css(f);
      const media = (text.match(/@media \(prefers-reduced-motion: reduce\)/g) ?? []).length;
      const attr = (text.match(/:root\[data-motion='reduce'\]/g) ?? []).length;
      expect(attr, f).toBeGreaterThanOrEqual(media);
    }
  });

  it('focus-glow: the ring is the root box shadow at once on every field; only the glow layer fades and grows', () => {
    const pairs: [string, string][] = [
      ['Textarea', 'textarea'],
      ['PhoneField', 'phone-field'],
      ['SearchField', 'search-field'],
      ['ScrubInput', 'scrub-input'],
    ];
    for (const [file, c] of pairs) {
      const text = css(file);
      const before = (new RegExp(`\\[data-ds='${c}'\\]::before \\{([^}]*)\\}`).exec(text)?.[1] ?? '').replace(/\s+/g, ' ');
      expect(before, file).toContain(`box-shadow: var(--_${c}-shadow-focus), 0 0 0 var(--_${c}-bloom-now) var(--_${c}-bloom)`);
      // Order 1.23: the bloom spreads on box-shadow; the border color eases.
      expect(before, file).toContain(`box-shadow var(--_${c}-duration-out)`);
      expect(text, file).toContain(`transition: border-color var(--_${c}-duration) var(--_${c}-ease);`);
      expect(before, file).not.toContain(`--_${c}-ring`);
      expect(text, file).toContain(`box-shadow: var(--_${c}-ring);`);
    }
  });

  it('search-clear and search-submit: the clear glyph turns in, a copy turns out, and Enter dips the search glyph', () => {
    const { calls, restore } = mockAnimate();
    try {
      const onSubmit = vi.fn();
      const { container } = render(desk(<SearchField aria-label="Search" onSubmit={onSubmit} />));
      const input = screen.getByRole('searchbox', { name: 'Search' });
      fireEvent.change(input, { target: { value: 'tea' } });
      const clearIcon = container.querySelector('[data-part="clear"] > [data-part="icon"]');
      expect(calls.some((c) => c.el === clearIcon && String(c.frames[0]?.transform).includes('rotate(-90deg)'))).toBe(true);
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onSubmit).toHaveBeenCalledWith('tea');
      expect(ids(calls, 'search-submit')[0]?.el).toBe(container.querySelector('[data-ds="search-field"] > [data-part="icon"]'));
      fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
      expect(container.querySelector('[data-part="clear"]')).toBeNull();
      // getBoundingClientRect is all zero in jsdom, so no copy is made there: nothing stays behind.
      expect(container.querySelectorAll('[data-ds="search-field"] > [inert]')).toHaveLength(0);
    } finally {
      restore();
    }
  });

  it('inline-edit-morph: the pencil morphs into the check, and the check back into the pencil on save', () => {
    const { calls, restore } = mockAnimate();
    try {
      const { container } = render(desk(<InlineEdit label="Board name" defaultValue="Launch" />));
      fireEvent.click(screen.getByRole('button', { name: /Launch/ }));
      const saveIcon = container.querySelector('[data-part="save"] > [data-part="icon"]') as HTMLElement;
      const leaving = saveIcon.querySelector(':scope > span[aria-hidden="true"]');
      expect(leaving).not.toBeNull();
      expect(calls.some((c) => c.el === leaving)).toBe(true);
      expect(calls.some((c) => c.el === saveIcon.firstElementChild)).toBe(true);
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
      const end = container.querySelector('[data-part="display"] > [data-part="end"]') as HTMLElement;
      expect(end.querySelector(':scope > span[aria-hidden="true"]')).not.toBeNull();
    } finally {
      restore();
    }
  });

  it('form-summary-enter and form-submit-success: rows arrive after a refused submit, the actions celebrate after a sent one', async () => {
    const { calls, restore } = mockAnimate();
    try {
      const { container } = render(
        desk(
          <Form actions={<FormSubmit>Send request</FormSubmit>}>
            <FormField name="email" label="Email">
              <Input name="email" required />
            </FormField>
          </Form>,
        ),
      );
      const form = container.querySelector('form') as HTMLFormElement;
      await act(async () => {
        fireEvent.submit(form);
      });
      const rows = container.querySelectorAll('[data-part="summary"] li');
      expect(rows.length).toBe(1);
      expect(calls.some((c) => c.el === rows[0])).toBe(true);
      fireEvent.change(screen.getByRole('textbox', { name: /Email/ }), {
        target: { value: 'sara@example.com' },
      });
      await act(async () => {
        fireEvent.submit(form);
      });
      expect(form.getAttribute('data-state')).toBe('submitted');
      expect(ids(calls, 'form-submit-success')[0]?.el).toBe(container.querySelector('[data-part="actions"] > *'));
    } finally {
      restore();
    }
  });

  it('wizard-step: the new step arrives from the inline end going on, from the start going back', async () => {
    const { calls, restore } = mockAnimate();
    try {
      const { container } = render(
        desk(
          <FormWizard
            steps={[
              { id: 'a', title: 'Account', content: <p>One</p> },
              { id: 'b', title: 'Address', content: <p>Two</p> },
            ]}
          />,
        ),
      );
      await act(async () => {
        fireEvent.submit(container.querySelector('form') as HTMLFormElement);
      });
      const second = container.querySelector('[data-part="body"][data-step="1"]');
      const enter = ids(calls, 'wizard-step').find((c) => c.el === second);
      expect(String(enter?.frames[0]?.transform)).toContain('calc(1 * var(--ds-distance-enter');
      fireEvent.click(screen.getByRole('button', { name: 'Go to previous step' }));
      const first = container.querySelector('[data-part="body"][data-step="0"]');
      const back = ids(calls, 'wizard-step').find((c) => c.el === first);
      expect(String(back?.frames[0]?.transform)).toContain('calc(-1 * var(--ds-distance-enter');
    } finally {
      restore();
    }
  });

  it('consent-check: giving the consent pops the mark on top of the draw (composite add); withdrawing does not', () => {
    const { calls, restore } = mockAnimate();
    try {
      render(desk(<ConsentField purpose="Send me product news by email" detailsHref="#privacy" />));
      fireEvent.click(screen.getByRole('checkbox'));
      const pop = ids(calls, 'consent-check');
      expect(pop).toHaveLength(1);
      expect(pop[0]?.opts.composite).toBe('add');
      fireEvent.click(screen.getByRole('checkbox'));
      expect(ids(calls, 'consent-check')).toHaveLength(1);
    } finally {
      restore();
    }
  });

  it('N16: a consent that starts given with a record line that has no date warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(<ConsentField purpose="Send me product news" detailsHref="#p" checked onCheckedChange={() => {}} meta="Given in the app" />);
      expect(warn.mock.calls.some(([m]) => String(m).includes('meta has no date'))).toBe(true);
      warn.mockClear();
      render(<ConsentField purpose="Send me product news" detailsHref="#p" checked onCheckedChange={() => {}} meta="Given on 3 March 2026, version 4" />);
      expect(warn.mock.calls.some(([m]) => String(m).includes('meta has no date'))).toBe(false);
    } finally {
      warn.mockRestore();
    }
  });

  it('scrub-roll: an arrow nudge rolls the new value in the aria-hidden layer over the input; typing does not', () => {
    const { calls, restore } = mockAnimate();
    try {
      const { container } = render(desk(<ScrubInput label="W" aria-label="Width" defaultValue={12} precision={0} />));
      const input = screen.getByRole('textbox', { name: 'Width' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      const layer = container.querySelector('[data-ds="scrub-input"] > span[aria-hidden="true"]:not([data-part])') as HTMLElement;
      // The columns draw the new value; a leaving digit rolls out beside it until its roll ends.
      expect(Array.from(layer.querySelectorAll('[data-digit]'), (c) => c.firstElementChild?.textContent).join('')).toBe('13');
      expect(calls.some((c) => layer.contains(c.el))).toBe(true);
      const before = calls.length;
      fireEvent.change(input, { target: { value: '40' } });
      expect(calls.length).toBe(before);
    } finally {
      restore();
    }
  });
});
