// ButtonGroup: a row or a column of related actions, spaced or attached.
// Role group with a name, no roving focus: every child stays in the tab
// order. The axes reach the children through DI (DS_BUTTON_GROUP), and a
// child's own input always wins.
//
//   <div dsButtonGroup attached emphasis="outline" aria-label="Board view">
//     <button dsIconButton icon="list" label="Show as list"></button>
//     <button dsIconButton icon="grid" label="Show as grid"></button>
//   </div>
//
// The twin of packages/react/src/components/ButtonGroup/ButtonGroup.tsx. The
// name is the native aria-label or aria-labelledby attribute on the host.
import { Directive, booleanAttribute, forwardRef, input } from '@angular/core';
import { consumeHostAttributes } from '../../internal/host';
import {
  DS_BUTTON_GROUP,
  type ButtonGroupAxes,
  type ButtonGroupEmphasis,
  type ButtonGroupShape,
  type ButtonGroupSize,
} from './button-group-context';

export type ButtonGroupOrientation = 'horizontal' | 'vertical';

@Directive({
  selector: 'div[dsButtonGroup]',
  exportAs: 'dsButtonGroup',
  providers: [{ provide: DS_BUTTON_GROUP, useExisting: forwardRef(() => DsButtonGroup) }],
  host: {
    role: 'group',
    'data-ds': 'button-group',
    '[attr.data-size]': 'size()',
    '[attr.data-emphasis]': 'emphasis() ?? null',
    '[attr.data-shape]': 'shape() ?? null',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-attached]': 'attached() ? "" : null',
    '[attr.data-full-width]': 'fullWidth() ? "" : null',
  },
})
export class DsButtonGroup implements ButtonGroupAxes {
  /** Passed to every child that does not set its own. Default md. */
  readonly size = input<ButtonGroupSize>('md');
  /** Passed to every child that does not set its own. Default none: each child keeps its own default. */
  readonly emphasis = input<ButtonGroupEmphasis | undefined>(undefined);
  /** Passed to every child that does not set its own. Default none. */
  readonly shape = input<ButtonGroupShape | undefined>(undefined);
  /** A row or a column. Default horizontal. */
  readonly orientation = input<ButtonGroupOrientation>('horizontal');
  /** Joins the children into one seamed control. Default false. */
  readonly attached = input(false, { transform: booleanAttribute });
  /** Fills the width of its container. Default false. */
  readonly fullWidth = input(false, { transform: booleanAttribute });

  constructor() {
    consumeHostAttributes(['dsButtonGroup', 'size', 'emphasis', 'shape', 'orientation', 'attached', 'fullWidth']);
  }
}
