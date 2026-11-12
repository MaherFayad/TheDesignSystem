// The shape of one interaction of the rounds in orders 1.21 and 1.22. An
// interaction is a small piece of feedback on one or more components, played
// by a catalog pattern, a primitive of order 1.22, or a CSS transition that
// reads tokens. Each one is a proposal to the owner until it is approved.
import type { PatternId } from '../core';

/** The six families of order 1.22, one registry file each. */
export type InteractionFamily = 'actions' | 'inputs' | 'selection' | 'overlays' | 'navigation' | 'feedback';

/** The primitives of order 1.22 (packages/motion/src/primitives). */
export type PrimitiveId = 'flip' | 'stagger' | 'icon-morph' | 'digit-roll' | 'button-morph';

/** How the interaction is played on the web. */
export type InteractionDrive =
  /** A CSS transition or `@starting-style` in the component CSS, timed by tokens. */
  | 'css'
  /** A catalog pattern played with the Web Animations API from the component code. */
  | 'waapi';

export interface Interaction {
  /** A kebab case id, unique across the registry. */
  id: string;
  /** The React component names that play it. */
  components: readonly string[];
  /** The catalog pattern it follows: its timing, keyframes and reduced form. */
  pattern: PatternId;
  drive: InteractionDrive;
  /** What the person does. */
  trigger: string;
  /** What the person sees, with its timing in token names. */
  feedback: string;
  /** What the reduced motion form shows. */
  reduced: string;
  /**
   * For a `css` interaction: the private properties a style sets on the
   * component root to turn the motion off, as `selector` to declarations.
   * The selector is the root's `[data-ds='...']`. The motion preset of a style
   * writes these as a recipe (see `interactionRecipes`).
   */
  off?: Readonly<Record<string, Readonly<Record<`--_${string}`, string>>>>;
  /**
   * The beats, in order, with their tokens and the base timing (order 1.22):
   * anticipation, action, overshoot, settle, and what else reacts. Optional
   * for the rows of order 1.21 that one property carries.
   */
  beats?: readonly string[];
  /** The primitive it plays, if any (order 1.22). */
  primitive?: PrimitiveId;
  /** How the three styles differ, in a few words each (order 1.22). */
  styles?: Readonly<Partial<Record<'studio' | 'desk' | 'neutral', string>>>;
  /** The round that added or last reworked it. Default 1. */
  round?: 1 | 2;
  /** Set by the registry from the file it lives in. */
  family?: InteractionFamily;
  /** Every interaction waits for the owner. */
  status: 'proposed';
}
