// FieldError: what is wrong and how to fix it, a danger icon and a message.
// The twin of packages/react/src/components/FieldError/FieldError.tsx. The
// host paragraph is the root.
//
//   <p dsFieldError id="width-error" size="sm">Use 1 px or more.</p>
//
// Inside a dsField it is the error part: it takes the field's error id,
// joins the control's aria-describedby and makes the field invalid while it
// exists. It is not a live region and never role="alert".
//
// React renders nothing when FieldError has no children. An Angular host
// element cannot leave the DOM by itself, so here the caller decides with
// `@if`: `@if (error()) { <p dsFieldError>{{ error() }}</p> }`. The one line
// `error` input of dsField does that already, and also follows
// `[invalid]="false"`.
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input } from '@angular/core';
import type { Size } from '@the-system/shared';
import { DsIcon } from '@the-system/icons/angular';
import { consumeHostAttributes } from '../../internal/host';
import { DsFieldContext } from '../field/field-context';

export type FieldErrorSize = Extract<Size, 'sm' | 'md'>;

@Component({
  selector: 'p[dsFieldError]',
  exportAs: 'dsFieldError',
  imports: [DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'field-error',
    '[attr.id]': 'hostId()',
    '[attr.data-part]': 'field ? "error" : null',
    '[attr.data-size]': 'size()',
  },
  template: `<svg dsIcon name="danger" [size]="size() === 'sm' ? 'sm' : 'md'" data-part="icon"></svg><span data-part="message"><ng-content /></span>`,
})
export class DsFieldError {
  /** Text size. md matches a Field; sm sits under a small control. Default md. */
  readonly size = input<FieldErrorSize>('md');
  /** The id a control points at with aria-describedby. Inside a Field the field's error id wins. */
  readonly id = input<string | undefined>(undefined);

  protected readonly field = inject(DsFieldContext, { optional: true });
  protected readonly hostId = computed(() => (this.field ? this.field.errorId : (this.id() ?? null)));

  constructor() {
    consumeHostAttributes(['dsFieldError', 'size', 'id']);
    const unregister = this.field?.register('error');
    if (unregister) inject(DestroyRef).onDestroy(unregister);
  }
}
