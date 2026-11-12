// Label: the visible name of a control, a native label. The twin of
// packages/react/src/components/Label/Label.tsx (Radix Label). The host
// label is the root.
//
//   <label dsLabel for="board-name" required>Board name</label>
//   <label dsLabel for="company" optional="Optional">Company</label>
//
// React's htmlFor is the `htmlFor` input, or the native `for` attribute.
// Inside a dsField, `label[dsFieldLabel]` is the same component in its
// FieldLabel form: it takes the field's label id, points at the field's
// control and carries `data-part="label"`. A plain dsLabel written inside a
// field follows the field's state but takes no ids.
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, booleanAttribute, computed, inject, input, type TemplateRef } from '@angular/core';
import type { Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { VISUALLY_HIDDEN } from '../../internal/visually-hidden';
import { DsThemeService } from '../../theme/theme';
import { DsFieldContext } from '../field/field-context';

export type LabelSize = Extract<Size, 'sm' | 'md'>;
/** Text after the label: a string, or a template for richer content. */
export type LabelOptional = string | TemplateRef<unknown>;

const LABEL_INPUTS = ['dsLabel', 'dsFieldLabel', 'size', 'required', 'requiredText', 'optional', 'disabled', 'invalid', 'id', 'for', 'htmlFor'];

@Component({
  selector: 'label[dsLabel], label[dsFieldLabel]',
  exportAs: 'dsLabel',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'label',
    '[attr.data-size]': 'size()',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-part]': 'fieldLabel ? "label" : null',
    '[attr.id]': 'hostId()',
    '[attr.for]': 'hostFor()',
    '(mousedown)': 'onMouseDown($event)',
  },
  template: `
    <ng-content />
    @if (isRequired()) {
      @if (word(); as w) {
        <span data-part="required"><span aria-hidden="true">*</span><span [attr.style]="visuallyHidden">{{ ' ' + w }}</span></span>
      } @else {
        <span data-part="required" aria-hidden="true">*</span>
      }
    }
    @if (hasOptional()) {
      <!-- A real space, so the name reads "Company Optional", not "CompanyOptional". -->
      {{ ' ' }}<span data-part="optional">
        @if (optionalText(); as text) {
          {{ text }}
        } @else {
          <ng-container [ngTemplateOutlet]="optionalTemplate()" />
        }
      </span>
    }
  `,
})
export class DsLabel {
  /** Text size. md matches the label of a Field; sm sits next to a small control. Default md. */
  readonly size = input<LabelSize>('md');
  /**
   * Shows the required mark, an aria-hidden asterisk. Inside a Field it
   * follows the Field, whose control carries aria-required. Outside a Field
   * the word in requiredText joins the label.
   */
  readonly required = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** The word read after the label outside a Field when required is set. Default "required", or "مطلوب" in an Arabic theme. */
  readonly requiredText = input<string | undefined>(undefined);
  /** Text after the label for a field that may stay empty, for example "Optional". */
  readonly optional = input<LabelOptional | undefined>(undefined);
  /** Draws the label as disabled. Inside a Field it follows the Field. */
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Marks the label of an invalid control. Inside a Field it follows the Field. */
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });

  /** The id of the label. A FieldLabel takes the field's label id when it is not set. */
  readonly id = input<string | undefined>(undefined);
  /** The id of the control the label names. A FieldLabel points at the field's control when it is not set. */
  readonly htmlFor = input<string | undefined>(undefined);
  /** The native attribute name of htmlFor. */
  readonly forAttr = input<string | undefined>(undefined, { alias: 'for' });

  protected readonly field = inject(DsFieldContext, { optional: true });
  /** The FieldLabel form: `label[dsFieldLabel]`. */
  protected readonly fieldLabel: boolean;
  private readonly theme = inject(DsThemeService);
  protected readonly visuallyHidden = VISUALLY_HIDDEN;

  protected readonly isRequired = computed(() => this.required() ?? this.field?.required() ?? false);
  protected readonly isDisabled = computed(() => this.disabled() ?? this.field?.disabled() ?? false);
  protected readonly isInvalid = computed(() => this.invalid() ?? this.field?.invalid() ?? false);
  protected readonly hasOptional = computed(() => {
    const o = this.optional();
    return o !== undefined && o !== null && o !== '' && !this.isRequired();
  });
  protected readonly optionalText = computed(() => {
    const o = this.optional();
    return typeof o === 'string' ? o : undefined;
  });
  protected readonly optionalTemplate = computed(() => {
    const o = this.optional();
    return typeof o === 'string' || o === undefined ? null : o;
  });
  /** Inside a required Field the control carries aria-required, so the word would be read twice. */
  protected readonly word = computed(() => {
    if (this.field?.required()) return undefined;
    return this.requiredText() ?? (this.theme.value().lang === 'ar' ? 'مطلوب' : 'required');
  });

  protected readonly hostId = computed(() => this.id() ?? (this.fieldLabel ? this.field?.labelId : undefined) ?? null);
  protected readonly hostFor = computed(
    () => this.htmlFor() ?? this.forAttr() ?? (this.fieldLabel ? this.field?.controlId() : undefined) ?? null,
  );

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    this.fieldLabel = typeof host.hasAttribute === 'function' && host.hasAttribute('dsFieldLabel');
    consumeHostAttributes(LABEL_INPUTS);
  }

  /** As Radix Label: a double click does not select the label text. */
  protected onMouseDown(event: MouseEvent): void {
    const target = event.target as Element | null;
    if (target?.closest?.('button, input, select, textarea')) return;
    if (!event.defaultPrevented && event.detail > 1) event.preventDefault();
  }
}

/** A boolean input that stays undefined when not written, so a Field can fill it. */
function optionalBoolean(value: unknown): boolean | undefined {
  return value === undefined || value === null ? undefined : booleanAttribute(value);
}
