// AspectRatio: keeps media at a ratio. Built on Radix AspectRatio, which wraps
// the root in a relative box with a padding trick and stretches the root over
// it. The root (`data-ds="aspect-ratio"`) is the inner element, the one that
// takes className, style and ref. Media inside fills it and is cropped
// (cover) or letterboxed (contain).
//
// No source: designed from the dials table and the nearest components.
// The plain alternative is the native `aspect-ratio` CSS property on the media
// element itself, noted in the manifest.
import { AspectRatio as RadixAspectRatio } from 'radix-ui';
import type { HTMLAttributes, ReactNode, Ref } from 'react';

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
export function AspectRatio({ ratio = 16 / 9, fit = 'cover', ref, children, ...rest }: AspectRatioProps) {
  const safe = Number.isFinite(ratio) && ratio > 0 ? ratio : 16 / 9;
  return (
    <RadixAspectRatio.Root {...rest} ref={ref} ratio={safe} data-ds="aspect-ratio" data-fit={fit}>
      {children}
    </RadixAspectRatio.Root>
  );
}
