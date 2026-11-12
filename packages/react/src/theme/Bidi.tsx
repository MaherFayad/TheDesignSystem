import { Fragment, type HTMLAttributes, type Ref } from 'react';
import { splitLatinRuns } from '@the-system/shared';

export interface BidiProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The copy. Plain text only, so the runs can be found. */
  children: string;
  ref?: Ref<HTMLSpanElement>;
}

/**
 * Isolates the Latin runs inside Arabic copy (JSON, Figma, file names, URLs),
 * so sentence punctuation stays at the logical end of the line. Renders a
 * span (`data-ds="bidi"`) and wraps each run in `<bdi dir="ltr"
 * data-part="run">`. A run gets an explicit direction because one that opens
 * with neutrals, like ~/.cursor, must not guess. Text without Arabic comes
 * back unchanged inside the span.
 *
 * Ported from GoBanana `app/(site)/_components/Bidi.tsx`. The splitting is in
 * `@the-system/shared` (`splitLatinRuns`).
 */
export function Bidi({ children, ...rest }: BidiProps) {
  const parts = splitLatinRuns(children);
  return (
    <span {...rest} data-ds="bidi">
      {parts.map((p, i) =>
        p.latin ? (
          <bdi key={i} dir="ltr" data-part="run">
            {p.text}
          </bdi>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )}
    </span>
  );
}
