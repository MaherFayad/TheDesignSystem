// Stages of the /interactions page for the text inputs and forms family
// (orders 1.21 to 1.23). One live stage per interaction id of
// packages/motion/src/interactions. Each stage marks the control that plays
// it with data-interaction-trigger, so the page's replay control can press
// it again. Owned by the family agent of order 1.22.
import { useState, type ReactNode } from 'react';
import {
  Button,
  ConsentField,
  Field,
  FieldDescription,
  Form,
  FormField,
  FormSubmit,
  FormWizard,
  InlineEdit,
  Input,
  NumberField,
  OTPField,
  PasswordField,
  RangeSlider,
  Rating,
  ScrubInput,
  SearchField,
  Slider,
  Textarea,
} from '@the-system/react';

const stack = { display: 'grid', gap: 'var(--ds-space-m)', inlineSize: '100%' } as const;

function InvalidToggle({ children }: { children: (invalid: boolean) => ReactNode }) {
  const [invalid, setInvalid] = useState(false);
  return (
    <>
      {children(invalid)}
      <Button size="sm" emphasis="soft" data-interaction-trigger="" onClick={() => setInvalid((v) => !v)}>
        {invalid ? 'Clear the error' : 'Show an error'}
      </Button>
    </>
  );
}

function ErrorStage() {
  const [error, setError] = useState(false);
  return (
    <>
      <Field label="Email" error={error ? 'Enter an email address, like name@example.com.' : undefined}>
        <Input defaultValue="sara@" />
      </Field>
      <Button size="sm" emphasis="soft" data-interaction-trigger="" onClick={() => setError((v) => !v)}>
        {error ? 'Clear the error' : 'Show an error'}
      </Button>
    </>
  );
}

function HintStage() {
  const [hint, setHint] = useState(false);
  return (
    <>
      <Field label="Board name">
        <Input defaultValue="Spring launch" />
        {hint && <FieldDescription>Shown to everyone in the workspace.</FieldDescription>}
      </Field>
      <Button size="sm" emphasis="soft" data-interaction-trigger="" onClick={() => setHint((v) => !v)}>
        {hint ? 'Hide the hint' : 'Show a hint'}
      </Button>
    </>
  );
}

function SubmitStage() {
  const [key, setKey] = useState(0);
  return (
    <Form key={key} actions={<FormSubmit data-interaction-trigger="">Send request</FormSubmit>} onReset={() => setKey((k) => k + 1)}>
      <FormField name="team" label="Team name">
        <Input name="team" defaultValue="Design" required />
      </FormField>
    </Form>
  );
}

function SummaryStage() {
  return (
    <Form actions={<FormSubmit data-interaction-trigger="">Send request</FormSubmit>}>
      <FormField name="name" label="Full name">
        <Input name="name" required />
      </FormField>
      <FormField name="email" label="Email">
        <Input name="email" type="email" required />
      </FormField>
    </Form>
  );
}

/** The stage around a trigger. */
const stageOf = (el: Element): HTMLElement | null => el.closest('[data-interaction-stage]');

/** Writes a value into a native input the way typing does, so React hears the change. */
function typeInto(input: HTMLInputElement | null | undefined, value: string) {
  if (!input) return;
  input.focus();
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** A key on an element, as the keyboard sends it. */
function key(el: Element | null | undefined, k: string) {
  if (!(el instanceof HTMLElement)) return;
  el.focus();
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  el.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true, cancelable: true }));
}

/**
 * A control that plays a stage whose own control is a part a stage cannot
 * mark (a toggle inside a field, a star, a key): the recorder and the replay
 * press it, and it acts on the real control of its stage.
 */
function Play({ label = 'Play interaction', act }: { label?: string; act: (stage: HTMLElement) => void }) {
  return (
    <Button
      size="sm"
      emphasis="soft"
      data-interaction-trigger=""
      onClick={(event) => {
        const stage = stageOf(event.currentTarget);
        if (stage) act(stage);
      }}
    >
      {label}
    </Button>
  );
}

const click = (stage: HTMLElement, selector: string) => stage.querySelector<HTMLElement>(selector)?.click();

const wizardSteps = [
  {
    id: 'account',
    title: 'Account',
    content: (
      <Field label="Work email">
        <Input defaultValue="sara@example.com" />
      </Field>
    ),
  },
  {
    id: 'team',
    title: 'Team',
    content: (
      <Field label="Team name">
        <Input defaultValue="Design" />
      </Field>
    ),
  },
  {
    id: 'review',
    title: 'Review',
    content: <p style={{ margin: 0 }}>Check the details and send the form.</p>,
  },
];

/** Live stages by interaction id. */
export const stages: Record<string, () => ReactNode> = {
  'focus-glow': () => (
    <>
      <Input aria-label="Board name" placeholder="Board name" data-interaction-trigger="" />
      <SearchField aria-label="Search files" placeholder="Search files" />
      <Textarea aria-label="Note" placeholder="Add a note" rows={2} />
    </>
  ),
  'error-shake': () => <InvalidToggle>{(invalid) => <Input aria-label="Email" defaultValue="sara@" invalid={invalid} />}</InvalidToggle>,
  'field-label-focus': () => (
    <Field label="Project name" description="Shown in the sidebar.">
      <Input defaultValue="Spring launch" data-interaction-trigger="" />
    </Field>
  ),
  'field-message-enter': () => <HintStage />,
  'field-error-enter': () => <ErrorStage />,
  'password-reveal': () => (
    <>
      <PasswordField aria-label="Password" defaultValue="spring-launch-26" />
      <Play label="Show the password" act={(s) => click(s, '[data-part="toggle"]')} />
    </>
  ),
  'search-clear': () => (
    <>
      <SearchField aria-label="Search files" defaultValue="brief" />
      <Play
        label="Clear or fill the search"
        act={(s) => {
          const input = s.querySelector<HTMLInputElement>('input');
          if (input?.value) click(s, '[data-part="clear"]');
          else typeInto(input, 'brief');
        }}
      />
    </>
  ),
  'search-submit': () => (
    <>
      <SearchField aria-label="Search files" defaultValue="brief" onSubmit={() => undefined} />
      <Play label="Send the search" act={(s) => key(s.querySelector('input'), 'Enter')} />
    </>
  ),
  'otp-fill': () => (
    <>
      <OTPField aria-label="Verification code" groups={[3, 3]} />
      <Play
        label="Paste a code"
        act={(s) => {
          const input = s.querySelector<HTMLInputElement>('input');
          typeInto(input, '');
          requestAnimationFrame(() => typeInto(input, '482913'));
        }}
      />
    </>
  ),
  'otp-caret': () => (
    <>
      <OTPField aria-label="Verification code" length={4} />
      <Play
        label="Type a digit"
        act={(s) => {
          const input = s.querySelector<HTMLInputElement>('input');
          typeInto(input, input && input.value.length < 4 ? `${input.value}7` : '');
        }}
      />
    </>
  ),
  'otp-complete': () => (
    <>
      <OTPField aria-label="Verification code" length={4} defaultValue="482" />
      <Play
        label="Finish the code"
        act={(s) => {
          const input = s.querySelector<HTMLInputElement>('input');
          typeInto(input, '482');
          requestAnimationFrame(() => typeInto(input, '4826'));
        }}
      />
    </>
  ),
  'field-step': () => (
    <>
      <NumberField aria-label="Quantity" defaultValue={98} min={0} max={1000} />
      <Play label="Step the quantity up" act={(s) => key(s.querySelector('input'), 'ArrowUp')} />
    </>
  ),
  'scrub-roll': () => (
    <>
      <ScrubInput label="W" aria-label="Width" defaultValue={128} precision={0} />
      <Play label="Nudge the width" act={(s) => key(s.querySelector('input'), 'ArrowUp')} />
    </>
  ),
  'inline-edit-morph': () => (
    <>
      <InlineEdit label="Board name" defaultValue="Spring launch" />
      <Play
        label="Edit or save the name"
        act={(s) => {
          if (s.querySelector('[data-part="save"]')) click(s, '[data-part="save"]');
          else click(s, '[data-part="display"]');
        }}
      />
    </>
  ),
  'form-summary-enter': () => <SummaryStage />,
  'form-submit-success': () => <SubmitStage />,
  'wizard-step': () => (
    <>
      <FormWizard steps={wizardSteps} onSubmit={() => undefined} />
      <Play
        label="Go to the next step"
        act={(s) => {
          if (s.querySelector('[data-part="next"]')) click(s, '[data-part="next"]');
          else click(s, '[data-part="back"]');
        }}
      />
    </>
  ),
  'wizard-done': () => (
    <>
      <FormWizard steps={wizardSteps} defaultStep={2} onSubmit={() => undefined} />
      <Play label="Send the form" act={(s) => click(s, '[data-part="submit"]')} />
    </>
  ),
  'consent-check': () => (
    <>
      <ConsentField purpose="Send me product news by email" detailsHref="#privacy" />
      <Play label="Give or withdraw the consent" act={(s) => click(s, '[role="checkbox"]')} />
    </>
  ),
  'rating-fill': () => (
    <>
      <Rating aria-label="Rate this template" defaultValue={2} />
      <Play
        label="Pick a score"
        act={(s) => {
          const checked = s.querySelector('[role="radio"][aria-checked="true"]');
          const stars = [...s.querySelectorAll<HTMLElement>('[role="radio"]')];
          stars[stars.indexOf(checked as HTMLElement) === 4 ? 1 : 4]?.click();
        }}
      />
    </>
  ),
  // The sweep needs a pointer over the stars: the recorder's drive hovers across them.
  'rating-preview': () => <Rating aria-label="Rate this template" defaultValue={1} data-interaction-trigger="" />,
  'slider-pull': () => (
    <div style={stack}>
      <Slider label="Opacity" unit="%" defaultValue={40} data-interaction-trigger="" />
      <RangeSlider label="Price" unit="SAR" min={0} max={1000} step={50} defaultValue={[200, 800]} thumbLabels={['Minimum price', 'Maximum price']} />
    </div>
  ),
  'slider-bubble': () => (
    <div style={stack}>
      <Slider label="Zoom" unit="%" min={10} max={400} defaultValue={120} data-interaction-trigger="" />
      <RangeSlider label="Budget" unit="SAR" min={0} max={5000} step={10} defaultValue={[900, 3200]} thumbLabels={['Lowest budget', 'Highest budget']} />
    </div>
  ),
  'slider-fill': () => (
    <div style={stack}>
      <Slider label="Opacity" unit="%" defaultValue={20} data-interaction-trigger="" />
      <RangeSlider label="Price" unit="SAR" min={0} max={1000} step={50} defaultValue={[200, 800]} thumbLabels={['Minimum price', 'Maximum price']} />
    </div>
  ),
  'slider-rubber-band': () => (
    <div style={stack}>
      <Slider label="Volume" unit="%" defaultValue={80} data-interaction-trigger="" />
    </div>
  ),
  'slider-nudge': () => (
    <div style={{ inlineSize: '100%' }}>
      <Slider label="Volume" unit="%" defaultValue={100} data-interaction-trigger="" />
    </div>
  ),
};
