// The shape of one interaction of the round in order 1.21. An interaction is
// a small piece of feedback on one or more components, played by a catalog
// pattern or by a CSS transition that reads tokens. Each one is a proposal
// to the owner until it is approved.
import type { PatternId } from '../core';

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
  /** Every interaction of this round waits for the owner. */
  status: 'proposed';
}
