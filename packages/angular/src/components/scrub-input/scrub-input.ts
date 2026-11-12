// ScrubInput: the Studio inspector number. Drag the label to scrub, type a
// value or an expression (`12*2`), or nudge with the arrow keys. The twin of
// packages/react/src/components/ScrubInput/ScrubInput.tsx.
//
//   <div dsScrubInput label="W" aria-label="Width" unit="px" [min]="0" [(value)]="width" (changeEnd)="saveUndo($event)"></div>
//   <div dsField label="Width"><div dsScrubInput label="W" unit="px" formControlName="width"></div></div>
//
// The math is packages/shared (scrub.ts, number.ts), as in React. Behavior is
// hand built, with React's rules:
// - The label is a pointer handle. A drag captures the pointer and moves the
//   value one step per pixel (Shift ten steps, Alt a tenth), toward the
//   inline end to grow, so the direction flips in RTL. A press with no move
//   focuses the input and selects its text.
// - The input is the only tab stop and the key path for the drag: ArrowUp
//   and ArrowDown by step, Shift by ten, Alt by a tenth. Enter commits and
//   keeps focus; Escape reverts the typed text; blur commits.
// - Mixed shows the mixed word as the placeholder and has no baseline, so
//   drag and arrows wait for a typed value.
//
// It implements ControlValueAccessor, so ngModel, formControl and
// formControlName work on the host.
//
// Motion (order 1.22), as in React: a drag or an arrow nudge rolls the new
// value digit by digit (scrub-roll) in the same decorative layer as
// NumberField, an unnamed aria-hidden span after the input, empty at rest.
// Typing never rolls. The handle lift is CSS.
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
  type TemplateRef,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { isIconName, type IconName } from '@the-system/icons';
import { DsIcon } from '@the-system/icons/angular';
import { formatScrub, nudgeStepFor, nudgeValue, resolveCommit, scrubValue, type Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { digitLayer } from '../../internal/motion-fields';
import { optionalBoolean } from '../../internal/optional-boolean';
import { DsFieldContext, fieldControl } from '../field/field-context';

export type ScrubInputSize = Extract<Size, 'xs' | 'sm' | 'md'>;
/** The scrub handle: a short letter (`W`, `H`, `X`), an icon name, or a template. */
export type ScrubInputLabel = IconName | (string & {}) | TemplateRef<unknown>;

interface Drag {
  pointerId: number;
  startX: number;
  from: number;
  /** -1 in rtl: a drag toward the inline end grows the value. */
  sign: 1 | -1;
  moved: boolean;
  /** No scrub: a press only focuses (read only, or mixed with no baseline). */
  pressOnly: boolean;
  /** The last value the drag sent. */
  last: number | null;
}

/** Pixels of travel before a press counts as a drag, so a click still focuses. */
const DRAG_THRESHOLD = 2;

let nextId = 0;

const SCRUB_INPUT_ATTRIBUTES = [
  'dsScrubInput',
  'label',
  'value',
  'min',
  'max',
  'step',
  'precision',
  'unit',
  'mixed',
  'mixedLabel',
  'size',
  'invalid',
  'disabled',
  'readOnly',
  'required',
  'id',
  'name',
  'placeholder',
  'autofocus',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
];

@Component({
  selector: 'div[dsScrubInput]',
  exportAs: 'dsScrubInput',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsScrubInput), multi: true }],
  host: {
    'data-ds': 'scrub-input',
    '[attr.data-size]': 'size()',
    '[attr.data-dragging]': 'dragging() ? "" : null',
    '[attr.data-invalid]': 'state().invalid ? "" : null',
    '[attr.data-disabled]': 'state().disabled ? "" : null',
    // The whole field is inactive, its unit text too (WCAG 1.4.3 exempts inactive components).
    '[attr.aria-disabled]': 'state().disabled ? "true" : null',
    '[attr.data-readonly]': 'state().readOnly ? "" : null',
    '[attr.data-mixed]': 'mixed() ? "" : null',
  },
  template: `
    @let handle = label();
    <span
      data-part="label"
      aria-hidden="true"
      (pointerdown)="onHandleDown($event)"
      (pointermove)="onHandleMove($event)"
      (pointerup)="endDrag($event)"
      (pointercancel)="endDrag($event)"
      (lostpointercapture)="endDrag($event)"
    >
      @if (isIcon(handle)) {
        <svg dsIcon [name]="handle"></svg>
      } @else if (isText(handle)) {
        {{ handle }}
      } @else {
        <ng-container [ngTemplateOutlet]="handle" />
      }
    </span>
    <input
      #native
      type="text"
      inputmode="text"
      autocomplete="off"
      spellcheck="false"
      data-part="control"
      [attr.id]="state().id ?? null"
      [attr.name]="name() ?? null"
      [attr.aria-label]="accessibleName() ?? null"
      [attr.aria-labelledby]="ariaLabelledby() ?? null"
      [attr.aria-describedby]="state().describedBy ?? null"
      [attr.aria-invalid]="state().invalid ? 'true' : null"
      [attr.aria-required]="state().required ? 'true' : null"
      [attr.data-autofocus]="autofocus() ? '' : null"
      [attr.placeholder]="mixed() ? mixedLabel() : (placeholder() ?? null)"
      [disabled]="state().disabled"
      [readOnly]="state().readOnly"
      [attr.value]="shown()"
      (input)="draft.set(native.value)"
      (keydown)="onKeyDown($event)"
      (blur)="onBlur()"
    />
    <!-- The digit roll layer (scrub-roll): decorative, empty at rest. -->
    <span aria-hidden="true" #layer></span>
    @if (unit()) {
      <!-- Read once, as the description of the input, not again as page text. -->
      <span data-part="unit" aria-hidden="true" [attr.id]="unitId">{{ unit() }}</span>
    }
  `,
})
export class DsScrubInput implements ControlValueAccessor {
  /**
   * The scrub handle: a short letter or an icon name. It is decoration for
   * assistive tech: the field is named by aria-label or the Field label.
   */
  readonly label = input.required<ScrubInputLabel>();
  /** The value. `null` is empty. Two way: `[(value)]`; valueChange fires with every committed value, each drag move too. */
  readonly value = model<number | null | undefined>(undefined);
  /** The lowest value. */
  readonly min = input<number | undefined>(undefined);
  /** The highest value. */
  readonly max = input<number | undefined>(undefined);
  /** One step of the arrow keys, and one pixel of drag. Shift is ten steps, Alt a tenth. Default 1. */
  readonly step = input(1);
  /** Decimals the value keeps and shows. Default 2. */
  readonly precision = input(2);
  /** The unit shown after the value (`px`, `%`, `deg`). A typed value may carry it, or none. */
  readonly unit = input<string | undefined>(undefined);
  /** A selection whose values differ: the field is empty and shows `mixedLabel`. */
  readonly mixed = input(false, { transform: booleanAttribute });
  /** The word shown while mixed. Default "Mixed". */
  readonly mixedLabel = input('Mixed');
  /** Height from size.control. Default md. */
  readonly size = input<ScrubInputSize>('md');
  /** Marks the value invalid. Inside a Field it follows the Field. */
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly readOnly = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Sets aria-required, never the native attribute. */
  readonly required = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** The id of the native input. Inside a Field the label then points at it. */
  readonly id = input<string | undefined>(undefined);
  readonly name = input<string | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  /** Marks the control with data-autofocus, so a Dialog opens with focus on it. */
  readonly autofocus = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });
  /**
   * Fires once when a change is done: at the end of a drag, after a nudge and
   * after a typed commit. Use it for one undo entry per gesture.
   */
  readonly changeEnd = output<number>();

  private readonly field = inject(DsFieldContext, { optional: true });
  private readonly controlRef = viewChild.required<ElementRef<HTMLInputElement>>('native');
  private readonly layerRef = viewChild.required<ElementRef<HTMLSpanElement>>('layer');
  private readonly motion = injectMotion();
  private readonly digits = digitLayer(
    () => this.layerRef().nativeElement,
    () => this.nativeInput,
  );
  private readonly formDisabled = signal(false);
  private onChange: (value: number) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private drag: Drag | null = null;

  protected readonly unitId = `ds-scrub-input-${++nextId}-unit`;
  /** The typed text, until it is committed or reverted. */
  protected readonly draft = signal<string | null>(null);
  protected readonly dragging = signal(false);

  /** The Field wiring merged with this field's own values, as React's useFieldControl. */
  protected readonly state = fieldControl(this.field, () => ({
    id: this.id(),
    describedBy: [this.ariaDescribedby(), this.unit() ? this.unitId : undefined].filter(Boolean).join(' ') || undefined,
    invalid: this.invalid(),
    disabled: this.disabled() ?? (this.formDisabled() || undefined),
    readOnly: this.readOnly(),
    required: this.required(),
  }));

  private readonly current = computed(() => this.value() ?? null);
  private readonly inert = computed(() => this.state().disabled || this.state().readOnly);
  protected readonly shown = computed(() => {
    const draft = this.draft();
    if (draft !== null) return draft;
    const current = this.current();
    return this.mixed() || current === null ? '' : formatScrub(current, this.precision());
  });
  /** Outside a Field, a text label names the field when no aria-label is given. */
  protected readonly accessibleName = computed(() => {
    const own = this.ariaLabel();
    if (own !== undefined) return own;
    const label = this.label();
    return this.field || typeof label !== 'string' || isIconName(label) ? undefined : label;
  });

  protected readonly isIcon = (content: unknown): content is IconName => typeof content === 'string' && isIconName(content);
  protected readonly isText = (content: unknown): content is string => typeof content === 'string';

  constructor() {
    consumeHostAttributes(SCRUB_INPUT_ATTRIBUTES);
    // The native value is written only when it differs, so the caret stays where it is while typing.
    afterRenderEffect(() => {
      const next = this.shown();
      const el = this.nativeInput;
      if (el.value !== next) el.value = next;
    });
    // A control with its own id tells the Field, so the label points at it.
    if (this.field) {
      const field = this.field;
      effect(() => {
        const id = this.id();
        untracked(() => field.setControlId(id));
      });
      inject(DestroyRef).onDestroy(() => {
        if (untracked(this.id) !== undefined) field.setControlId(undefined);
      });
    }
  }

  /** The native input. */
  get nativeInput(): HTMLInputElement {
    return this.controlRef().nativeElement;
  }

  focus(options?: FocusOptions): void {
    this.nativeInput.focus(options);
  }

  private options() {
    return { unit: this.unit(), min: this.min(), max: this.max(), precision: this.precision() };
  }

  private commit(next: number): void {
    if (this.mixed() || next !== this.current()) {
      this.value.set(next);
      this.onChange(next);
    }
    this.show();
  }

  /** scrub-roll: a commit from a drag or a nudge rolls the new text in digit by digit from the text drawn before it. */
  private rollTo(next: number, finish: boolean): void {
    const from = this.nativeInput.value;
    if (finish) this.finish(next);
    else this.commit(next);
    const to = this.nativeInput.value;
    if (from !== to) this.digits.roll(this.nativeInput, from, to, { mode: this.motion.mode('scrub-roll') });
  }

  /** Shows the value now, as React does on a commit, so code that reads the input after the event sees it. */
  private show(): void {
    const el = this.nativeInput;
    const text = this.shown();
    if (el.value !== text) el.value = text;
  }

  /** A finished change: commit it and tell changeEnd. */
  private finish(next: number): void {
    this.commit(next);
    this.changeEnd.emit(next);
  }

  private commitDraft(): boolean {
    const draft = this.draft();
    if (draft === null) return false;
    const next = resolveCommit(draft, this.options());
    this.draft.set(null);
    this.show();
    if (next === null) return false;
    this.finish(next);
    return true;
  }

  /** The value to step from: the typed text if it reads, else the committed value. */
  private baseline(): number | null {
    const draft = this.draft();
    if (draft !== null) {
      const typed = resolveCommit(draft, this.options());
      if (typed !== null) return typed;
    }
    return this.mixed() ? null : this.current();
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.defaultPrevented || this.inert()) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      // An empty field nudges from zero, as a drag does. Mixed waits for a typed value.
      const from = this.mixed() && this.draft() === null ? null : (this.baseline() ?? 0);
      if (from === null) return;
      this.draft.set(null);
      this.rollTo(nudgeValue(from, event.key === 'ArrowUp' ? 1 : -1, event, this.step(), this.options()), true);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitDraft();
      // Enter keeps focus and selects, so the next key replaces the value.
      requestAnimationFrame(() => this.nativeInput.select());
      return;
    }
    if (event.key === 'Escape' && this.draft() !== null) {
      // Revert the typed text. Escape with nothing typed goes on to a parent (a popover closes).
      event.preventDefault();
      event.stopPropagation();
      this.draft.set(null);
      this.show();
    }
  }

  protected onBlur(): void {
    this.commitDraft();
    this.onTouched();
  }

  protected onHandleDown(event: PointerEvent): void {
    if (event.button !== 0 || this.state().disabled) return;
    event.preventDefault();
    // An empty field scrubs from zero. Read only and mixed (no baseline) only take a press to focus.
    const pressOnly = this.state().readOnly || this.mixed();
    const from = pressOnly ? Number.NaN : (this.baseline() ?? 0);
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture?.(event.pointerId);
    this.drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      from,
      sign: getComputedStyle(handle).direction === 'rtl' ? -1 : 1,
      moved: false,
      pressOnly,
      last: null,
    };
  }

  private dragValue(d: Drag, event: PointerEvent): number {
    return scrubValue(d.from, Math.round((event.clientX - d.startX) * d.sign), nudgeStepFor(event, this.step()), {
      min: this.min(),
      max: this.max(),
      precision: this.precision(),
    });
  }

  protected onHandleMove(event: PointerEvent): void {
    const d = this.drag;
    if (!d || d.pointerId !== event.pointerId || d.pressOnly) return;
    const dx = (event.clientX - d.startX) * d.sign;
    if (!d.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      d.moved = true;
      this.dragging.set(true);
    }
    this.draft.set(null);
    const next = this.dragValue(d, event);
    // Compare with the last value sent, not the shown value: two moves can land before a render.
    if (next === d.last) return;
    d.last = next;
    this.rollTo(next, false);
  }

  protected endDrag(event: PointerEvent): void {
    const d = this.drag;
    if (!d || d.pointerId !== event.pointerId) return;
    this.drag = null;
    this.dragging.set(false);
    const handle = event.currentTarget as HTMLElement;
    if (handle.hasPointerCapture?.(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    if (d.moved) {
      // The release position is the final value, even when no move event came after the last pixel.
      const next = event.type === 'pointerup' ? this.dragValue(d, event) : (d.last ?? d.from);
      if (next !== d.last) this.commit(next);
      this.changeEnd.emit(next);
    } else if (event.type === 'pointerup') {
      this.nativeInput.focus();
      this.nativeInput.select();
    }
  }

  // ControlValueAccessor.

  writeValue(value: unknown): void {
    this.value.set(typeof value === 'number' ? value : null);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
