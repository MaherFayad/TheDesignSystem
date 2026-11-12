// Demo helper, not exported: the DOM of React's Bidi
// (packages/react/src/theme/Bidi.tsx), which has no Angular port yet. It
// isolates the Latin runs inside Arabic copy so sentence punctuation stays
// at the logical end of the line. The field family demos use it for Arabic
// error messages, as the React demos do.
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { splitLatinRuns } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';

@Component({
  selector: 'span[data-ds=bidi]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (p of parts(); track $index) {@if (p.latin) {<bdi dir="ltr" data-part="run">{{ p.text }}</bdi>} @else {{{ p.text }}}}`,
})
export class DemoBidi {
  readonly text = input.required<string>();
  protected readonly parts = computed(() => splitLatinRuns(this.text()));

  constructor() {
    consumeHostAttributes(['text']);
  }
}
