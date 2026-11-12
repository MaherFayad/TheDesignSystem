// Separator: a line between groups. Built on Radix Separator, which sets
// role separator (or none when decorative), aria-orientation and
// data-orientation.
//
// Sources: Figma-Killer-2 `Separator/` (orientation, decorative, a 1px line
// that stretches in a flex row); GoBanana `.st-menu-sep` could not be read in
// this session. Changed here: no spacing prop (the parent Stack or Grid gap
// spaces the groups); an optional centered label with two line parts.
//
// Color: a decorative line uses color.border.subtle. A semantic one (it
// carries meaning, so assistive tech hears it) uses color.border.control,
// which meets 3:1 on body and surface 1 to 3 (WCAG 1.4.11);
// on surface 4 and 5 it measures 2.4 to 2.9 in the dark schemes and Neutral light.
import { Separator as RadixSeparator } from 'radix-ui';
import { useId, type HTMLAttributes, type ReactNode, type Ref } from 'react';

export type SeparatorOrientation = 'horizontal' | 'vertical';

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  /** horizontal runs along the line, between stacked groups. vertical stands between items in a row. Default horizontal. */
  orientation?: SeparatorOrientation;
  /**
   * Default true: purely visual, hidden from assistive tech (role none),
   * drawn with color.border.subtle. false: role separator, announced, and
   * drawn at 3:1 with color.border.control.
   */
  decorative?: boolean;
  /** Short centered text on the line, for example Or. It names a semantic separator. */
  label?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/** A line between groups of content, with an optional centered label. */
export function Separator({ orientation = 'horizontal', decorative = true, label, ref, ...rest }: SeparatorProps) {
  const labelId = useId();
  const hasLabel = label !== undefined && label !== null && label !== false && label !== '';
  return (
    <RadixSeparator.Root
      aria-labelledby={hasLabel && !decorative ? labelId : undefined}
      {...rest}
      ref={ref}
      orientation={orientation}
      decorative={decorative}
      data-ds="separator"
      data-decorative={decorative ? '' : undefined}
      data-labelled={hasLabel ? '' : undefined}
    >
      {hasLabel && (
        <>
          <span data-part="line" aria-hidden="true" />
          <span data-part="label" id={labelId}>
            {label}
          </span>
          <span data-part="line" aria-hidden="true" />
        </>
      )}
    </RadixSeparator.Root>
  );
}
