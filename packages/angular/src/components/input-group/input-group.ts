// InputGroup: an Input joined with add ons and actions in one row, for a
// unit, a fixed prefix such as a URL, or a Button that acts on the value.
// The twin of packages/react/src/components/InputGroup/InputGroup.tsx.
//
//   <div dsInputGroup size="sm">
//     <span dsInputGroupAddon>https://</span>
//     <div dsInput aria-label="Board address" type="url"></div>
//     <button dsIconButton icon="copy" label="Copy address" emphasis="outline" size="sm"></button>
//   </div>
//
// Role group, no key of its own: every control and action stays in the tab
// order. React clones its children to stamp the parts. Angular reads the
// group through DI instead:
// - the control (dsInput, dsSearchField, dsPasswordField) takes
//   data-part="control", the group's size, shape, invalid, disabled and
//   read only where it sets none, and the add on ids in aria-describedby;
// - an add on is `span[dsInputGroupAddon]`;
// - a dsButton or dsIconButton in the group takes data-part="action"
//   through DsInputGroupAction (part of DS_INPUT_GROUP), and is disabled
//   with the group. It cannot fill the button's own inputs, so write size,
//   shape and emphasis="outline" on the action as React would fill them.
import { ChangeDetectionStrategy, Component, DestroyRef, Directive, ElementRef, afterRenderEffect, computed, forwardRef, inject, input, signal } from '@angular/core';
import type { Shape, Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { DsFieldContext } from '../field/field-context';
import { DsInputGroupContext } from './input-group-context';

export type InputGroupSize = Size;
export type InputGroupShape = Extract<Shape, 'default' | 'pill'>;

function optionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  return value !== false && value !== 'false';
}

let nextId = 0;

@Component({
  selector: 'div[dsInputGroup]',
  exportAs: 'dsInputGroup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: DsInputGroupContext, useExisting: forwardRef(() => DsInputGroup) }],
  host: {
    role: 'group',
    'data-ds': 'input-group',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-readonly]': 'isReadOnly() ? "" : null',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
  },
  template: '<ng-content />',
})
export class DsInputGroup extends DsInputGroupContext {
  /** Passed to the control that does not set its own. Default md. */
  readonly size = input<InputGroupSize>('md');
  /** Passed to the control that does not set its own. Default default. */
  readonly shape = input<InputGroupShape>('default');
  /** Marks the control invalid. Inside a Field it follows the Field. */
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Disables the control. Inside a Field it follows the Field. Write disabled on each action too. */
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Marks the control read only; the add ons dash with it. Inside a Field it follows the Field. */
  readonly readOnly = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });

  private readonly field = inject(DsFieldContext, { optional: true });
  private readonly addons = signal<readonly string[]>([]);
  readonly addonIds = this.addons.asReadonly();
  readonly base = `ds-input-group-${++nextId}-`;
  private count = 0;

  protected readonly isInvalid = computed(() => this.invalid() ?? this.field?.invalid() ?? false);
  /** Disabled by the group or by the Field around it. */
  readonly isDisabled = computed(() => this.disabled() ?? this.field?.disabled() ?? false);
  protected readonly isReadOnly = computed(() => this.readOnly() ?? this.field?.readOnly() ?? false);

  constructor() {
    super();
    consumeHostAttributes(['dsInputGroup', 'size', 'shape', 'invalid', 'disabled', 'readOnly']);
  }

  /** An add on joins the control's aria-describedby. Returns its id and the remove function. */
  addAddon(own: string | undefined): [string, () => void] {
    const id = own ?? `${this.base}addon-${this.count++}`;
    this.addons.update((ids) => [...ids, id]);
    return [id, () => this.addons.update((ids) => ids.filter((x) => x !== id))];
  }
}

/**
 * Text joined to the control: a unit, a currency, a fixed prefix or suffix.
 * The group links it to the control as a description.
 */
@Directive({
  selector: 'span[dsInputGroupAddon]',
  exportAs: 'dsInputGroupAddon',
  host: {
    'data-part': 'addon',
    '[attr.id]': 'id',
  },
})
export class DsInputGroupAddon {
  protected readonly id: string | null;

  constructor() {
    const host = consumeHostAttributes(['dsInputGroupAddon']);
    const own = host.getAttribute?.('id') ?? undefined;
    const group = inject(DsInputGroup, { optional: true });
    if (group) {
      const [id, remove] = group.addAddon(own);
      this.id = id;
      inject(DestroyRef).onDestroy(remove);
    } else {
      this.id = own ?? null;
    }
  }
}

/**
 * Stamps data-part="action" on a dsButton or dsIconButton written in a
 * group. While the group or its Field is disabled, the action is disabled
 * the way Button disables itself: aria-disabled and data-disabled, still
 * focusable, click and auxclick blocked.
 */
@Directive({
  selector: 'button[dsButton], a[dsButton], button[dsIconButton], a[dsIconButton]',
})
export class DsInputGroupAction {
  constructor() {
    // Outside a group it writes nothing, so a data-part of the caller's own stays.
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const group = inject(DsInputGroup, { optional: true });
    if (!group || typeof host.setAttribute !== 'function') return;
    host.setAttribute('data-part', 'action');
    let stamped = false;
    // After render, so the button's own first host binding write does not clear it.
    afterRenderEffect(() => {
      const off = group.isDisabled();
      if (off && !host.hasAttribute('aria-disabled')) {
        host.setAttribute('aria-disabled', 'true');
        host.setAttribute('data-disabled', '');
        stamped = true;
      } else if (!off && stamped) {
        host.removeAttribute('aria-disabled');
        host.removeAttribute('data-disabled');
        stamped = false;
      }
    });
    const block = (event: Event) => {
      if (!stamped) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    for (const type of ['click', 'auxclick']) host.addEventListener(type, block, { capture: true });
  }
}

/** Everything a template needs for an input group. */
export const DS_INPUT_GROUP = [DsInputGroup, DsInputGroupAddon, DsInputGroupAction] as const;
