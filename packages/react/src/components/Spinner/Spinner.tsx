// Spinner: a small busy sign for work of unknown length.
//
// Sources: GoBanana `.st-spinner` (not reachable in this session) and the
// `spinner` part of Button, which this component copies: a ring in the track
// color with one arc in the mark color, turning once per duration.spin.
//
// Two forms:
// - With `label`: `role="status"` and a visually hidden label, so a screen
//   reader hears "Loading files" once when the spinner appears.
// - `decorative`: `aria-hidden`, no label. For a spinner next to visible
//   text, or inside a container that already says it is busy (`aria-busy`).
import type { HTMLAttributes, Ref } from 'react';
import type { Size, Tone } from '@the-system/shared';

export type SpinnerSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export type SpinnerTone = Extract<Tone, 'neutral' | 'accent'>;

interface SpinnerBaseProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'title' | 'children' | 'role'> {
  /** Ring size: xs 12, sm 16, md 24, lg 36 px. Default md. */
  size?: SpinnerSize;
  /** neutral draws the arc in the text color, accent in the primary mark color of the style. Default neutral. */
  tone?: SpinnerTone;
  ref?: Ref<HTMLSpanElement>;
}

interface SpinnerLabelledProps extends SpinnerBaseProps {
  /** The accessible name, said once by the status region: "Loading files", "جار تحميل الملفات". Required unless decorative. */
  label: string;
  decorative?: false;
}

interface SpinnerDecorativeProps extends SpinnerBaseProps {
  /** Hides the spinner from assistive tech. Use it when visible text or an `aria-busy` parent already says the area is busy. */
  decorative: true;
  label?: undefined;
}

export type SpinnerProps = SpinnerLabelledProps | SpinnerDecorativeProps;

/**
 * A ring that turns while something loads. Under reduced motion it stops
 * and stays as a still ring with its arc; the label is still read.
 */
export function Spinner({ size = 'md', tone = 'neutral', label, decorative = false, ref, ...rest }: SpinnerProps) {
  return (
    <span
      {...rest}
      ref={ref}
      data-ds="spinner"
      data-size={size}
      data-tone={tone}
      role={decorative ? undefined : 'status'}
      aria-hidden={decorative ? true : rest['aria-hidden']}
    >
      {!decorative && <span data-part="label">{label}</span>}
    </span>
  );
}
