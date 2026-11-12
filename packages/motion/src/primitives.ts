// The primitives of order 1.22, one file each in ./primitives: a FLIP move,
// a staggered group, an icon morph, a digit roll and a stateful button morph.
// Each plays only transform and opacity with token timing, has a reduced
// form, takes a style's mode (full, reduced or none), and never holds the
// state of the component: it plays the way between two rest looks the
// component CSS draws. Every one is proposed to the owner.
export { cancelFlip, flipExit, flipPlay, flipSnapshot, FLIP_ID, invert, moveFrames, rectOf } from './primitives/flip';
export type { FlipOptions, FlipSnapshot } from './primitives/flip';
export { staggerGroup, staggerStep, STAGGER_ID } from './primitives/stagger';
export type { StaggerOptions } from './primitives/stagger';
export { iconInFrames, iconMorph, iconOutFrames, iconParts, iconTurn, ICON_MORPH_ID } from './primitives/icon-morph';
export type { IconMorphOptions } from './primitives/icon-morph';
export { digitSlots, DIGIT_ROLL_ID, renderDigits, rollDigits, rollDirection } from './primitives/digit-roll';
export type { DigitRollOptions, DigitSlot } from './primitives/digit-roll';
export { buttonMorph, BUTTON_MORPH_ID, partFor } from './primitives/button-morph';
export type { MorphParts, MorphState } from './primitives/button-morph';
export { resolveMode, SPRING_NAMES, springTiming, STAGGER_MAX_STEPS } from './primitives/shared';
export type { PrimitiveOptions, MotionSpring } from './primitives/shared';
