// AspectRatio: keeps media at a ratio. One element: the root
// (`data-ds="aspect-ratio"`) carries the native aspect-ratio property, read
// from the private `--_aspect-ratio-ratio` set here from the prop. className,
// style and ref land on that same element, so a width or margin set by the
// consumer keeps the ratio. Angular renders the same single div.
//
// No source: designed from the dials table and the nearest components.
// The plain alternative is the native `aspect-ratio` CSS property on the media
// element itself, noted in the manifest.
import { Slot } from 'radix-ui';
import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from 'react';

export type AspectRatioFit = 'cover' | 'contain';

export interface AspectRatioProps extends HTMLAttributes<HTMLDivElement> {
  /** Width divided by height: 16 / 9, 4 / 3, 1, 3 / 4. Default 16 / 9. */
  ratio?: number;
  /** How an img, video or iframe child fills the box. cover crops, contain letterboxes. Default cover. */
  fit?: AspectRatioFit;
  /** Renders the single child element as the root, through Radix Slot. */
  asChild?: boolean;
  ref?: Ref<HTMLDivElement>;
  children?: ReactNode;
}

/** A box that keeps a ratio of width to height at any width. */
export function AspectRatio({
  ratio = 16 / 9,
  fit = 'cover',
  asChild = false,
  style,
  ref,
  children,
  ...rest
}: AspectRatioProps) {
  const safe = Number.isFinite(ratio) && ratio > 0 ? ratio : 16 / 9;
  const attrs = {
    ...rest,
    ref,
    'data-ds': 'aspect-ratio',
    'data-fit': fit,
    style: { '--_aspect-ratio-ratio': String(safe), ...style } as CSSProperties,
  };
  if (asChild) return <Slot.Root {...attrs}>{children}</Slot.Root>;
  return <div {...attrs}>{children}</div>;
}
