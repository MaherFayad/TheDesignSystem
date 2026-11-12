// The interaction registry of order 1.21: every small piece of feedback the
// components play, by id, with its trigger, its pattern, its reduced form and
// the private properties a style sets to turn a CSS one off. The gallery page
// `/interactions` plays each one; docs/reports/interactions.md explains them.
// Every row is a proposal to the owner.
import type { PatternMode } from './core';
import { buttonsInteractions } from './interactions/buttons';
import { contentInteractions } from './interactions/content';
import { fieldsInteractions } from './interactions/fields';
import { overlaysInteractions } from './interactions/overlays';
import { selectionInteractions } from './interactions/selection';
import type { Interaction } from './interactions/types';
import type { StyleMotionPreset } from './preset';

export type { Interaction, InteractionDrive } from './interactions/types';

/** Every interaction, in the order the gallery shows them. */
export const interactions: readonly Interaction[] = [
  ...buttonsInteractions,
  ...selectionInteractions,
  ...fieldsInteractions,
  ...overlaysInteractions,
  ...contentInteractions,
];

/** The interaction with this id, or undefined. */
export function getInteraction(id: string): Interaction | undefined {
  return interactions.find((i) => i.id === id);
}

/**
 * How a style plays an interaction: its own row in the preset, else the mode
 * of the interaction's pattern in that preset, else the full form. A row of
 * `reduced` or `none` turns the motion off and keeps the state change.
 */
export function interactionMode(style: StyleMotionPreset, id: string): PatternMode {
  const row = style.interactions?.[id];
  if (row) return row;
  const pattern = getInteraction(id)?.pattern;
  return (pattern && style.patterns?.[pattern]?.mode) || 'full';
}

/**
 * The recipe CSS that turns off the CSS interactions a style plays in its
 * reduced form or not at all. Scoped with `[data-style='<id>']` in the
 * `ds.recipes` layer, so it follows the style pack contract: it sets private
 * properties and nothing else. `npm run gen` should write it to
 * `packages/styles/<id>/motion.css` (a change requested from the lead); the
 * gallery injects it until then.
 */
export function interactionRecipes(styleId: string, style: StyleMotionPreset): string {
  const rules: string[] = [];
  for (const i of interactions) {
    if (i.drive !== 'css' || !i.off || interactionMode(style, i.id) === 'full') continue;
    for (const [selector, decls] of Object.entries(i.off)) {
      const body = Object.entries(decls)
        .map(([k, v]) => `    ${k}: ${v};`)
        .join('\n');
      rules.push(`  /* ${i.id} */\n  [data-style='${styleId}'] ${selector} {\n${body}\n  }`);
    }
  }
  return rules.length ? `@layer ds.recipes {\n${rules.join('\n')}\n}\n` : '';
}
