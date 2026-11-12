// Native style recipes, keyed by style id. A recipe lives in the style pack
// (`packages/styles/<id>/native/<Component>.ts`, section 3.7 of PLAN.md) and
// adjusts the base styles of one component: `(base, theme, variants) =>
// adjustments`. A style with no recipe for a component has no entry here.
//
// Add a line when a style pack ships a native recipe.
import type { Theme } from '@the-system/tokens/native';
import deskButton from '@the-system/styles/desk/native/Button';

/** Style adjustments per part: each part's entries are merged over the base styles. */
export type RecipeAdjustments<Part extends string> = Partial<Record<Part, Record<string, unknown>>>;

/**
 * A native recipe. `base` holds the plain style objects of each part before
 * StyleSheet.create; the result is merged over them.
 */
export type NativeRecipe<Part extends string = string, Variants = unknown> = (
  base: Readonly<Record<Part, Record<string, unknown>>>,
  theme: Theme,
  variants: Variants,
) => RecipeAdjustments<Part>;

/** A recipe with the id that names it in style caches. */
export interface RegisteredRecipe<Part extends string = string, Variants = unknown> {
  id: string;
  recipe: NativeRecipe<Part, Variants>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registry: Readonly<Record<string, Readonly<Record<string, NativeRecipe<any, any>>>>> = {
  desk: { Button: deskButton },
};

/** The recipe a style pack ships for a component, or undefined. */
export function recipeFor<Part extends string, Variants>(
  style: string,
  component: string,
): RegisteredRecipe<Part, Variants> | undefined {
  const recipe = registry[style]?.[component];
  return recipe ? { id: `${style}/${component}`, recipe } : undefined;
}
