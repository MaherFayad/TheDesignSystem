// StatusDot: a small state marker next to text (online, failed, syncing).
//
// Sources: GoBanana was not reachable from the lane session, so this is
// designed from the dials table in PLAN.md section 3.7 and Toast's tones.
//
// Anatomy: root [data-ds=status-dot] with data-tone and data-size, the parts
// dot (drawn, hidden from assistive tech) and label (the meaning, in text).
// The label is required: the dot is never the only carrier of the state
// (WCAG 1.4.1). With hideLabel the label is visually hidden and still read,
// only where visible text nearby already names the same state (a group
// heading such as Online now).
//
// data-pulse marks a live state (syncing, recording). The pulse plays three
// times and stops, so it never runs longer than five seconds (WCAG 2.2.2),
// and it does not play at all under reduced motion. It does not restart on
// a re-render; the label keeps saying the state after the pulse ends.
import type { HTMLAttributes, ReactNode, Ref } from 'react';
import type { Size, Tone } from '@the-system/shared';

export type StatusDotSize = Extract<Size, 'sm' | 'md'>;
export type StatusDotTone = Tone;

/** No `title` attribute: hints come from Tooltip. */
export interface StatusDotProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'title' | 'children'> {
  /** The state in words: Online, Sync failed. Required, never color alone. */
  label: ReactNode;
  /** Default neutral. */
  tone?: StatusDotTone;
  /** Default md. */
  size?: StatusDotSize;
  /** Pulses the dot for a live state (syncing, recording). Default false. */
  pulse?: boolean;
  /** Hides the label visually; it is still read. Default false. */
  hideLabel?: boolean;
  ref?: Ref<HTMLSpanElement>;
}

export function StatusDot({ label, tone = 'neutral', size = 'md', pulse = false, hideLabel = false, ...rest }: StatusDotProps) {
  return (
    <span
      {...rest}
      data-ds="status-dot"
      data-tone={tone}
      data-size={size}
      data-pulse={pulse ? '' : undefined}
      data-hide-label={hideLabel ? '' : undefined}
    >
      <span data-part="dot" aria-hidden="true" />
      <span data-part="label">{label}</span>
    </span>
  );
}
