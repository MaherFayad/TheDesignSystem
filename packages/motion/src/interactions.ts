// The interaction registry of orders 1.21 and 1.22: every small piece of
// feedback the components play, by id, with its trigger, its pattern, its
// beats, its reduced form and the private properties a style sets to turn a
// CSS one off. One file per family under ./interactions (order 1.22): actions
// (buttons.ts), inputs (fields.ts), selection, overlays, navigation and
// feedback (content.ts). The gallery page `/interactions` plays each one;
// docs/reports/interactions.md and interactions-2.md explain them. Every row
// is a proposal to the owner.
import type { PatternMode } from './core';
import { buttonsInteractions } from './interactions/buttons';
import { contentInteractions } from './interactions/content';
import { fieldsInteractions } from './interactions/fields';
import { navigationInteractions } from './interactions/navigation';
import { overlaysInteractions } from './interactions/overlays';
import { selectionInteractions } from './interactions/selection';
import type { Interaction, InteractionFamily } from './interactions/types';
import type { StyleMotionPreset } from './preset';

export type { Interaction, InteractionDrive, InteractionFamily, PrimitiveId } from './interactions/types';

/** The families in the order the gallery shows them, with their rows. */
const byFamily: readonly [InteractionFamily, readonly Interaction[]][] = [
  ['actions', buttonsInteractions],
  ['inputs', fieldsInteractions],
  ['selection', selectionInteractions],
  ['overlays', overlaysInteractions],
  ['navigation', navigationInteractions],
  ['feedback', contentInteractions],
];

/** The title of each family. */
export const INTERACTION_FAMILIES: Readonly<Record<InteractionFamily, string>> = {
  actions: 'Actions and toggles',
  inputs: 'Text inputs and forms',
  selection: 'Selection controls and lists',
  overlays: 'Overlays and menus',
  navigation: 'Navigation and shared indicators',
  feedback: 'Feedback, progress, data display and layout',
};

/** Every interaction, in the order the gallery shows them, with its family. */
export const interactions: readonly Interaction[] = byFamily.flatMap(([family, rows]) => rows.map((r) => ({ ...r, family })));

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
