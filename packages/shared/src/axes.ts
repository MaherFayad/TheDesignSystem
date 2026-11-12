// The shared variant axes of docs/contracts/anatomy.md: the same words on
// every component and in every framework. A component narrows a type with
// Extract, for example `Extract<Emphasis, 'solid' | 'soft'>`.

export const sizes = ['xs', 'sm', 'md', 'lg'] as const;
export type Size = (typeof sizes)[number];

/** Overlays (Dialog, Drawer) may add xl and 2xl to the size words. */
export const overlaySizes = [...sizes, 'xl', '2xl'] as const;
export type OverlaySize = (typeof overlaySizes)[number];

export const tones = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'] as const;
export type Tone = (typeof tones)[number];

export const emphases = ['solid', 'soft', 'outline', 'ghost', 'link'] as const;
export type Emphasis = (typeof emphases)[number];

export const shapes = ['default', 'pill', 'square'] as const;
export type Shape = (typeof shapes)[number];
