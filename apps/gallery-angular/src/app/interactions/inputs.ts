// Stages of the Angular /interactions page for the inputs family (orders
// 1.21 and 1.22), the twin of apps/gallery-react/src/interactions/inputs.tsx.
// One standalone component per interaction id. Each stage marks the control
// that plays it with data-interaction-trigger, so the page's replay control
// can press it again. Same copy as React.
//
// React spreads data-interaction-trigger on the native input of Input; an
// Angular dsInput keeps its attributes on the root, so the stage stamps the
// mark on the native input after first render, to keep the DOM the same.
import { ChangeDetectionStrategy, Component, afterNextRender, signal, viewChild, type Type } from '@angular/core';
import { DsButton, DsField, DsInput, DsNumberField, DsOTPField, DsPasswordField, DsScrubInput, DsSearchField, DsTextarea } from '@the-system/angular';

/** The stage around a trigger. */
const stageOf = (el: EventTarget | null): HTMLElement | null => (el instanceof Element ? el.closest('[data-interaction-stage]') : null);

/** Writes a value into a native input the way typing does, so the component hears the change. */
function typeInto(input: HTMLInputElement | null | undefined, value: string): void {
  if (!input) return;
  input.focus();
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** A key on an element, as the keyboard sends it. */
function key(el: Element | null | undefined, k: string): void {
  if (!(el instanceof HTMLElement)) return;
  el.focus();
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  el.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true, cancelable: true }));
}

const click = (stage: HTMLElement, selector: string) => stage.querySelector<HTMLElement>(selector)?.click();

/** Runs `act` on the stage of the pressed control. */
function play(event: Event, act: (stage: HTMLElement) => void): void {
  const stage = stageOf(event.currentTarget);
  if (stage) act(stage);
}

/** Puts data-interaction-trigger on the native input of a dsInput, as React renders it. */
function markTrigger(input: () => DsInput | undefined): void {
  afterNextRender(() => input()?.nativeInput.setAttribute('data-interaction-trigger', ''));
}

@Component({
  selector: 'ds-stage-focus-glow',
  imports: [DsInput, DsSearchField, DsTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div dsInput aria-label="Board name" placeholder="Board name"></div>
    <div dsSearchField aria-label="Search files" placeholder="Search files"></div>
    <div dsTextarea aria-label="Note" placeholder="Add a note" [rows]="2"></div>
  `,
})
class FocusGlowStage {
  private readonly input = viewChild(DsInput);
  constructor() {
    markTrigger(this.input);
  }
}

@Component({
  selector: 'ds-stage-error-shake',
  imports: [DsButton, DsInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div dsInput aria-label="Email" value="sara@" [invalid]="invalid()"></div>
    <button dsButton size="sm" emphasis="soft" data-interaction-trigger="" (click)="invalid.set(!invalid())">{{ invalid() ? 'Clear the error' : 'Show an error' }}</button>
  `,
})
class ErrorShakeStage {
  protected readonly invalid = signal(false);
}

@Component({
  selector: 'ds-stage-field-label-focus',
  imports: [DsField, DsInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div dsField label="Project name" description="Shown in the sidebar.">
      <div dsInput value="Spring launch"></div>
    </div>
  `,
})
class FieldLabelFocusStage {
  private readonly input = viewChild(DsInput);
  constructor() {
    markTrigger(this.input);
  }
}

@Component({
  selector: 'ds-stage-password-reveal',
  imports: [DsButton, DsPasswordField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div dsPasswordField aria-label="Password" value="spring-launch-26"></div>
    <button dsButton size="sm" emphasis="soft" data-interaction-trigger="" (click)="act($event)">Show the password</button>
  `,
})
class PasswordRevealStage {
  protected act(event: Event): void {
    play(event, (s) => click(s, '[data-part="toggle"]'));
  }
}

@Component({
  selector: 'ds-stage-search-clear',
  imports: [DsButton, DsSearchField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div dsSearchField aria-label="Search files" value="brief"></div>
    <button dsButton size="sm" emphasis="soft" data-interaction-trigger="" (click)="act($event)">Clear or fill the search</button>
  `,
})
class SearchClearStage {
  protected act(event: Event): void {
    play(event, (s) => {
      const input = s.querySelector<HTMLInputElement>('input');
      if (input?.value) click(s, '[data-part="clear"]');
      else typeInto(input, 'brief');
    });
  }
}

@Component({
  selector: 'ds-stage-search-submit',
  imports: [DsButton, DsSearchField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div dsSearchField aria-label="Search files" value="brief"></div>
    <button dsButton size="sm" emphasis="soft" data-interaction-trigger="" (click)="act($event)">Send the search</button>
  `,
})
class SearchSubmitStage {
  protected act(event: Event): void {
    play(event, (s) => key(s.querySelector('input'), 'Enter'));
  }
}

@Component({
  selector: 'ds-stage-otp-fill',
  imports: [DsButton, DsOTPField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div dsOTPField aria-label="Verification code" [groups]="[3, 3]"></div>
    <button dsButton size="sm" emphasis="soft" data-interaction-trigger="" (click)="act($event)">Paste a code</button>
  `,
})
class OtpFillStage {
  protected act(event: Event): void {
    play(event, (s) => {
      const input = s.querySelector<HTMLInputElement>('input');
      typeInto(input, '');
      requestAnimationFrame(() => typeInto(input, '482913'));
    });
  }
}

@Component({
  selector: 'ds-stage-otp-caret',
  imports: [DsButton, DsOTPField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div dsOTPField aria-label="Verification code" [length]="4"></div>
    <button dsButton size="sm" emphasis="soft" data-interaction-trigger="" (click)="act($event)">Type a digit</button>
  `,
})
class OtpCaretStage {
  protected act(event: Event): void {
    play(event, (s) => {
      const input = s.querySelector<HTMLInputElement>('input');
      typeInto(input, input && input.value.length < 4 ? `${input.value}7` : '');
    });
  }
}

@Component({
  selector: 'ds-stage-otp-complete',
  imports: [DsButton, DsOTPField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div dsOTPField aria-label="Verification code" [length]="4" value="482"></div>
    <button dsButton size="sm" emphasis="soft" data-interaction-trigger="" (click)="act($event)">Finish the code</button>
  `,
})
class OtpCompleteStage {
  protected act(event: Event): void {
    play(event, (s) => {
      const input = s.querySelector<HTMLInputElement>('input');
      typeInto(input, '482');
      requestAnimationFrame(() => typeInto(input, '4826'));
    });
  }
}

@Component({
  selector: 'ds-stage-field-step',
  imports: [DsButton, DsNumberField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div dsNumberField aria-label="Quantity" [value]="98" [min]="0" [max]="1000"></div>
    <button dsButton size="sm" emphasis="soft" data-interaction-trigger="" (click)="act($event)">Step the quantity up</button>
  `,
})
class FieldStepStage {
  protected act(event: Event): void {
    play(event, (s) => key(s.querySelector('input'), 'ArrowUp'));
  }
}

@Component({
  selector: 'ds-stage-scrub-roll',
  imports: [DsButton, DsScrubInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div dsScrubInput label="W" aria-label="Width" [value]="128" [precision]="0"></div>
    <button dsButton size="sm" emphasis="soft" data-interaction-trigger="" (click)="act($event)">Nudge the width</button>
  `,
})
class ScrubRollStage {
  protected act(event: Event): void {
    play(event, (s) => key(s.querySelector('input'), 'ArrowUp'));
  }
}

/** Live stages by interaction id. */
export const stages: Record<string, Type<unknown>> = {
  'focus-glow': FocusGlowStage,
  'error-shake': ErrorShakeStage,
  'field-label-focus': FieldLabelFocusStage,
  'password-reveal': PasswordRevealStage,
  'search-clear': SearchClearStage,
  'search-submit': SearchSubmitStage,
  'otp-fill': OtpFillStage,
  'otp-caret': OtpCaretStage,
  'otp-complete': OtpCompleteStage,
  'field-step': FieldStepStage,
  'scrub-roll': ScrubRollStage,
};
