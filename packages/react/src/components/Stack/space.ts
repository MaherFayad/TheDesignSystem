// The space steps a layout prop takes (gap, padding, gutter), in the order of
// the `space.*` token scale. Each name maps to `--ds-space-<name>`, which is
// fluid and follows the density axis. `none` is zero.
//
// Shared by the layout primitives of lane 8A (Stack, Grid, Container) so the
// same words work everywhere. Never a number: a layout reads the token scale.

export const spaceSteps = [
  'none',
  '4xs',
  '3xs',
  '2xs',
  'xs',
  's',
  'm',
  'l',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  '8xl',
  '9xl',
  '10xl',
  '11xl',
  '12xl',
] as const;

export type SpaceStep = (typeof spaceSteps)[number];
