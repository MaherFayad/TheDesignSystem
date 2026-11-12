// StatusDot: a small state marker next to text (online, failed, syncing).
// The host element is the root, `span[dsStatusDot]`, and the template
// renders the parts in the React order: dot, label.
//
//   <span dsStatusDot tone="success" label="Online"></span>
//
// The twin of packages/react/src/components/StatusDot/StatusDot.tsx. The
// label is required: the dot is never the only carrier of the state. React
// takes a node; Angular takes a string or a template.
import { ChangeDetectionStrategy, Component, booleanAttribute, input, type TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { Size, Tone } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';

export type StatusDotSize = Extract<Size, 'sm' | 'md'>;
export type StatusDotTone = Tone;

@Component({
  selector: 'span[dsStatusDot]',
  exportAs: 'dsStatusDot',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'status-dot',
    '[attr.data-tone]': 'tone()',
    '[attr.data-size]': 'size()',
    '[attr.data-pulse]': 'pulse() ? "" : null',
    '[attr.data-hide-label]': 'hideLabel() ? "" : null',
  },
  template: `<span data-part="dot" aria-hidden="true"></span><span data-part="label">@if (isText(label())) {{{ label() }}} @else {<ng-container [ngTemplateOutlet]="$any(label())" />}</span>`,
})
export class DsStatusDot {
  /** The state in words: Online, Sync failed. Required, never color alone. */
  readonly label = input.required<string | TemplateRef<unknown>>();
  /** Default neutral. */
  readonly tone = input<StatusDotTone>('neutral');
  /** Default md. */
  readonly size = input<StatusDotSize>('md');
  /** Pulses the dot for a live state (syncing, recording). Default false. */
  readonly pulse = input(false, { transform: booleanAttribute });
  /** Hides the label visually; it is still read. Default false. */
  readonly hideLabel = input(false, { transform: booleanAttribute });

  protected readonly isText = (v: unknown): v is string => typeof v === 'string';

  constructor() {
    consumeHostAttributes(['dsStatusDot', 'label', 'tone', 'size', 'pulse', 'hideLabel']);
  }
}
