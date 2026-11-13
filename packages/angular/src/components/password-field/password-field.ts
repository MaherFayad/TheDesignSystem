// PasswordField: a password input with a show and hide toggle, built on
// Input. The twin of packages/react/src/components/PasswordField/PasswordField.tsx.
//
//   <div dsField label="Password"><div dsPasswordField [(value)]="password"></div></div>
//   <div dsPasswordField autoComplete="new-password" [(visible)]="shown"></div>
//
// The root is the bordered box. The nested dsInput is the control part and
// keeps the native input and the Field wiring. The toggle is an IconButton
// with aria-pressed; its name says what a press does. Paste is never
// blocked. The value hides again when the form around it submits.
//
// React's visible and defaultVisible are the visible model (`[(visible)]`),
// onVisibleChange its visibleChange output. defaultValue is value. Native
// props of the inner input are inputs, as on dsInput.
//
// Motion (orders 1.21 to 1.23), as in React: a press on the toggle morphs
// the eye into the eye off glyph or back (password-reveal). Since order 1.23
// the two glyphs trade places along a 45 degree line (a clip-path wipe over
// duration.morph): showing draws the slash from the top left, hiding wipes
// it off from the bottom right. The leaving glyph stays for one morph in an
// unnamed aria-hidden span inside the toggle icon. The field text fades back in. The type changes at once.
// The box shakes when the field turns invalid (error-shake).
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DsIcon } from '@the-system/icons/angular';
import { diagonalWipe, fadeOutBeat, playBeat, settled, type ShakeBox } from '@the-system/motion';
import type { Shape, Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { errorShake } from '../../internal/motion-fields';
import { DsFieldContext } from '../field/field-context';
import { DsIconButton } from '../icon-button/icon-button';
import { DsInputGroupContext } from '../input-group/input-group-context';
import { DsInput } from '../input/input';

export type PasswordFieldSize = Size;
export type PasswordFieldShape = Extract<Shape, 'default' | 'pill'>;

const INTERACTIVE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]';

/** The bordered box: the root, around the nested Input. */
const fieldBox: ShakeBox = (input) => input.closest("[data-ds='password-field']");

/** The interaction id of the toggle morph in the registry and the style presets. */
const PASSWORD_REVEAL = 'password-reveal';

function optionalBoolean(value: unknown): boolean | undefined {
  return value === undefined || value === null ? undefined : booleanAttribute(value);
}

let nextId = 0;

const ATTRIBUTES = [
  'dsPasswordField',
  'size',
  'shape',
  'value',
  'visible',
  'showLabel',
  'hideLabel',
  'autoComplete',
  'invalid',
  'disabled',
  'readOnly',
  'required',
  'id',
  'name',
  'placeholder',
  'inputMode',
  'enterKeyHint',
  'maxLength',
  'minLength',
  'pattern',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
];

@Component({
  selector: 'div[dsPasswordField]',
  exportAs: 'dsPasswordField',
  imports: [DsIcon, DsIconButton, DsInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsPasswordField), multi: true }],
  // The inner Input is this field's control, never the control of a group around it.
  viewProviders: [{ provide: DsInputGroupContext, useValue: null }],
  host: {
    'data-ds': 'password-field',
    '[attr.data-part]': 'group ? "control" : null',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-shape]': 'resolvedShape()',
    '[attr.data-visible]': 'visible() ? "" : null',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-readonly]': 'isReadOnly() ? "" : null',
    '(mousedown)': 'onRootMouseDown($event)',
  },
  template: `
    <div
      dsInput
      data-part="control"
      [id]="inputId()"
      [type]="visible() ? 'text' : 'password'"
      [size]="resolvedSize()"
      [shape]="resolvedShape()"
      [autoComplete]="autoComplete()"
      [inputMode]="inputMode()"
      [enterKeyHint]="enterKeyHint()"
      [maxLength]="maxLength()"
      [minLength]="minLength()"
      [pattern]="pattern()"
      autoCapitalize="none"
      autoCorrect="off"
      [spellCheck]="false"
      [value]="value()"
      [invalid]="ownInvalid()"
      [disabled]="ownDisabled()"
      [readOnly]="ownReadOnly()"
      [required]="required()"
      [name]="name()"
      [placeholder]="placeholder()"
      [aria-label]="ariaLabel()"
      [aria-labelledby]="ariaLabelledby()"
      [aria-describedby]="describedBy()"
      (valueChange)="change($event)"
      (focusout)="onTouched()"
    ></div>
    <button
      dsIconButton
      data-part="toggle"
      [icon]="toggleIcon"
      [label]="visible() ? hideLabel() : showLabel()"
      [attr.aria-pressed]="visible() ? 'true' : 'false'"
      [attr.aria-controls]="controls()"
      [size]="resolvedSize() === 'lg' ? 'sm' : 'xs'"
      shape="pill"
      [disabled]="isDisabled()"
      (click)="toggle()"
    ></button>
    <ng-template #toggleIcon>
      <svg dsIcon [name]="visible() ? 'eye-off' : 'eye'" size="md"></svg>
      @for (l of leaving(); track l.id) {
        <span aria-hidden="true"><svg dsIcon [name]="l.icon" size="md"></svg></span>
      }
    </ng-template>
  `,
})
export class DsPasswordField implements ControlValueAccessor {
  /** Height from size.control. Default md. */
  readonly size = input<PasswordFieldSize | undefined>(undefined);
  /** default takes radius.control from the style. pill is always fully round. */
  readonly shape = input<PasswordFieldShape | undefined>(undefined);
  /** The value. Two way: `[(value)]`. */
  readonly value = model<string | undefined>(undefined);
  /** The value shows as plain text. Two way: `[(visible)]`. Default false. */
  readonly visible = model(false);
  /** The toggle's name while the value is hidden. Default "Show password". Arabic: "إظهار كلمة المرور". */
  readonly showLabel = input('Show password');
  /** The toggle's name while the value shows. Default "Hide password". Arabic: "إخفاء كلمة المرور". */
  readonly hideLabel = input('Hide password');
  /** current-password to sign in, new-password to set one, so password managers fill and suggest (WCAG 3.3.8). */
  readonly autoComplete = input<string>('current-password');
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly readOnly = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly required = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly id = input<string | undefined>(undefined);
  readonly name = input<string | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  readonly inputMode = input<string | undefined>(undefined);
  readonly enterKeyHint = input<string | undefined>(undefined);
  readonly maxLength = input<number | undefined>(undefined);
  readonly minLength = input<number | undefined>(undefined);
  readonly pattern = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  private readonly field = inject(DsFieldContext, { optional: true });
  protected readonly group = inject(DsInputGroupContext, { optional: true, skipSelf: true });
  private readonly host = consumeHostAttributes(ATTRIBUTES);
  private readonly motion = injectMotion();
  /** The glyph that leaves, kept for one morph in an aria-hidden span after the new one. A list, so each morph gets a new span. */
  protected readonly leaving = signal<readonly { id: number; icon: 'eye' | 'eye-off' }[]>([]);
  private morphs = 0;
  /** Set by a press on the toggle, read once the new type is drawn. */
  private toggled = false;
  private readonly inputRef = viewChild.required(DsInput);
  private readonly generated = `ds-password-field-${++nextId}`;
  private readonly formDisabled = signal(false);
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  protected readonly resolvedSize = computed(() => this.size() ?? this.group?.size() ?? 'md');
  protected readonly resolvedShape = computed(() => this.shape() ?? this.group?.shape() ?? 'default');
  protected readonly ownInvalid = computed(() => this.invalid() ?? this.group?.invalid());
  protected readonly ownDisabled = computed(() => this.disabled() ?? this.group?.disabled() ?? (this.formDisabled() || undefined));
  protected readonly ownReadOnly = computed(() => this.readOnly() ?? this.group?.readOnly());
  protected readonly isInvalid = computed(() => this.ownInvalid() ?? this.field?.invalid() ?? false);
  protected readonly isDisabled = computed(() => this.ownDisabled() ?? this.field?.disabled() ?? false);
  protected readonly isReadOnly = computed(() => this.ownReadOnly() ?? this.field?.readOnly() ?? false);
  /** Inside a Field the Field gives the id; alone, the toggle needs one to point at. */
  protected readonly inputId = computed(() => this.id() ?? (this.field ? undefined : this.generated));
  protected readonly controls = computed(() => this.inputId() ?? this.field?.controlId() ?? null);
  protected readonly describedBy = computed(
    () => [...(this.group?.addonIds() ?? []), this.ariaDescribedby()].filter(Boolean).join(' ') || undefined,
  );

  constructor() {
    errorShake(() => this.nativeInput, () => this.isInvalid(), fieldBox);
    // password-reveal: after the type changed, the eye morphs and the text fades back in.
    afterRenderEffect((onCleanup) => {
      const shown = this.visible();
      if (!this.toggled) return;
      this.toggled = false;
      untracked(() => {
        const input = this.nativeInput;
        const part = this.host.querySelector(":scope > [data-part='toggle'] > [data-part='icon']");
        const mode = this.motion.mode(PASSWORD_REVEAL);
        // Order 1.23: the glyphs trade places along a diagonal line, so showing
        // draws the slash across the eye and hiding wipes it off the other way.
        const back = !shown;
        const anims = [
          playBeat(part?.querySelector(':scope > span[aria-hidden="true"]'), diagonalWipe('ahead', back), `${PASSWORD_REVEAL}-out`, mode, fadeOutBeat),
          playBeat(part?.firstElementChild, diagonalWipe('behind', back), `${PASSWORD_REVEAL}-in`, mode),
        ].filter((a): a is Animation => a !== null);
        this.motion.play(input, 'fade', PASSWORD_REVEAL);
        const id = this.morphs;
        let live = true;
        onCleanup(() => (live = false));
        void Promise.all(anims.map((a) => settled(a))).then(() => {
          if (live) this.leaving.update((l) => (l[0]?.id === id ? [] : l));
        });
      });
    });
    // Hide the value again when the form submits.
    let form: HTMLFormElement | null = null;
    const hide = () => {
      // The input is type password again before the browser reads the form.
      this.nativeInput.type = 'password';
      this.visible.set(false);
    };
    afterRenderEffect(() => {
      const shown = this.visible();
      const next = shown ? this.nativeInput.form : null;
      if (next === form) return;
      form?.removeEventListener('submit', hide);
      form = next;
      form?.addEventListener('submit', hide);
    });
    inject(DestroyRef).onDestroy(() => form?.removeEventListener('submit', hide));
  }

  /** The native input. */
  get nativeInput(): HTMLInputElement {
    return this.inputRef().nativeInput;
  }

  protected toggle(): void {
    const shown = this.visible();
    this.toggled = true;
    if (typeof this.nativeInput.animate === 'function' && this.motion.mode(PASSWORD_REVEAL) !== 'none') {
      this.morphs += 1;
      this.leaving.set([{ id: this.morphs, icon: shown ? 'eye-off' : 'eye' }]);
    }
    this.visible.set(!shown);
  }

  focus(options?: FocusOptions): void {
    this.nativeInput.focus(options);
  }

  protected change(next: string | undefined): void {
    this.value.set(next);
    this.onChange(next ?? '');
  }

  writeValue(value: unknown): void {
    this.value.set(value === null || value === undefined ? undefined : String(value));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  protected onRootMouseDown(event: MouseEvent): void {
    const el = this.nativeInput;
    if (event.defaultPrevented || el.disabled) return;
    const target = event.target as Element;
    if (target === el) return;
    const root = event.currentTarget as Element;
    const match = target.closest(INTERACTIVE);
    if (match && match !== root && root.contains(match)) return;
    event.preventDefault();
    el.focus();
  }
}
