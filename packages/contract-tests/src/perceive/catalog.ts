// The interactions the gate drives: the twenty components of the motion
// audit (docs/reports/audit/interactions.md, "The twenty components"), on
// their normal gallery pages, with the same gestures. Each entry says where
// the finger lands, which part is the headline (the one a person watches),
// and which surface opens, if any.
import type { Interaction } from './types';

const tap = 90;

export const INTERACTIONS: Interaction[] = [
  { id: 'button', slug: 'button', name: 'Button', does: 'taps an accent solid button', gesture: 'tap', holdMs: tap, case: 'variants', target: { selector: '[data-ds="button"]', text: 'Publish page' }, headline: 'root', pressable: true },
  { id: 'icon-button', slug: 'icon-button', name: 'IconButton', does: 'taps an icon button', gesture: 'tap', holdMs: tap, case: 'variants', target: { selector: '[data-ds="icon-button"]' }, headline: 'root', pressable: true },
  { id: 'switch', slug: 'switch', name: 'Switch', does: 'taps a switch that is off', gesture: 'tap', holdMs: tap, case: 'variants', target: { selector: '[data-ds="switch"] [role="switch"][aria-checked="false"]' }, headline: '[data-part="thumb"]', pressable: true },
  { id: 'checkbox', slug: 'checkbox', name: 'Checkbox', does: 'taps an empty checkbox', gesture: 'tap', holdMs: tap, case: 'variants', target: { selector: '[data-ds="checkbox"] [role="checkbox"][aria-checked="false"]' }, headline: '[data-part="indicator"]', pressable: true },
  { id: 'radio', slug: 'radio-group', name: 'Radio', does: 'taps the radio that is not chosen', gesture: 'tap', holdMs: tap, case: 'variants', target: { selector: '[data-ds="radio-group"] [role="radio"][aria-checked="false"]' }, root: '[data-ds="radio-group"]', headline: '[role="radio"][aria-checked="true"] [data-part="indicator"]', pressable: true },
  { id: 'tabs', slug: 'tabs', name: 'Tabs', does: 'taps the second tab', gesture: 'tap', holdMs: tap, case: 'variants', target: { selector: '[data-ds="tabs"] [role="tab"]', nth: 1 }, root: '[data-ds="tabs"]', headline: '[data-part="indicator"]', pressable: true },
  { id: 'segmented-control', slug: 'segmented-control', name: 'SegmentedControl', does: 'taps the last segment', gesture: 'tap', holdMs: tap, case: 'variants', target: { selector: '[data-ds="segmented-control"] [role="radio"]', nth: 2 }, root: '[data-ds="segmented-control"]', headline: '[data-part="indicator"]', pressable: true },
  { id: 'select', slug: 'select', name: 'Select', does: 'taps a select to open it', gesture: 'tap', holdMs: tap, case: 'variants', target: { selector: '[data-ds="select"][role="combobox"]' }, overlay: '[role="listbox"]', headline: '[role="listbox"]', headlineIn: 'document' },
  { id: 'dropdown-menu', slug: 'dropdown-menu', name: 'DropdownMenu', does: 'taps a menu button to open its menu', gesture: 'tap', holdMs: tap, case: 'variants', target: { selector: '[data-ds="button"]', text: 'Board actions' }, overlay: '[role="menu"]', headline: '[role="menu"]', headlineIn: 'document' },
  { id: 'dialog', slug: 'dialog', name: 'Dialog', does: 'taps a button that opens a dialog', gesture: 'tap', holdMs: tap, target: { selector: '[data-ds="button"]', text: 'Open sm dialog' }, overlay: '[data-ds="dialog"]', headline: '[data-ds="dialog"] [data-part="panel"]', headlineIn: 'document' },
  { id: 'alert-dialog', slug: 'alert-dialog', name: 'AlertDialog', does: 'taps a button that opens an alert dialog', gesture: 'tap', holdMs: tap, target: { selector: '[data-ds="button"]', text: 'Leave the board (sm)' }, overlay: '[data-ds="alert-dialog"]', headline: '[role="alertdialog"]', headlineIn: 'document' },
  { id: 'sheet', slug: 'sheet', name: 'Sheet', does: 'taps a button that opens a sheet', gesture: 'tap', holdMs: tap, target: { selector: '[data-ds="button"]', text: 'Open sm sheet' }, overlay: '[data-ds="sheet"]', headline: '[data-ds="sheet"] [data-part="panel"]', headlineIn: 'document' },
  { id: 'toast', slug: 'toast', name: 'Toast', does: 'taps a button that shows a toast', gesture: 'tap', holdMs: tap, target: { selector: '[data-ds="button"]', text: 'Show neutral toast' }, overlay: '[data-ds="toaster"] [data-ds="toast"]', headline: '[data-ds="toaster"] [data-ds="toast"]', headlineIn: 'document' },
  { id: 'tooltip', slug: 'tooltip', name: 'Tooltip', does: 'presses and holds an icon button for 900ms', gesture: 'long-press', holdMs: 900, case: 'variants', target: { selector: '[data-ds="icon-button"]' }, overlay: '[data-ds="tooltip"]', headline: '[data-ds="tooltip"]', headlineIn: 'document' },
  { id: 'accordion', slug: 'accordion', name: 'Accordion', does: 'taps a closed item', gesture: 'tap', holdMs: tap, case: 'variants', target: { selector: '[data-ds="accordion"] [data-part="trigger"][aria-expanded="false"]' }, root: '[data-ds="accordion"]', headline: '[data-part="item"][data-state="open"] [data-part="content"]', pressable: true },
  { id: 'input', slug: 'input', name: 'Input', does: 'taps a text field to focus it', gesture: 'tap', holdMs: tap, case: 'variants', target: { selector: '[data-ds="input"] input' }, root: '[data-ds="input"]', headline: 'root' },
  { id: 'copy-button', slug: 'copy-button', name: 'CopyButton', does: 'taps a copy button', gesture: 'tap', holdMs: tap, case: 'variants', target: { selector: '[data-ds="copy-button"]' }, headline: '[data-part="icon"]', pressable: true },
  { id: 'slider', slug: 'slider', name: 'Slider', does: 'drags a slider thumb 54px', gesture: 'drag', dragStep: 3.6, case: 'variants', target: { selector: '[data-ds="slider"] [role="slider"]' }, root: '[data-ds="slider"]', headline: '[data-part="thumb"]' },
  { id: 'chip', slug: 'chip', name: 'Chip', does: 'taps a filter chip that is off', gesture: 'tap', holdMs: tap, case: 'many', target: { selector: 'button[data-ds="chip"][aria-pressed="false"]' }, headline: '[data-part="label"]', pressable: true },
  { id: 'card', slug: 'card', name: 'Card', does: 'taps an interactive card', gesture: 'tap', holdMs: tap, case: 'variants', target: { selector: '[data-ds="card"][data-interactive]' }, at: { x: 0.5, y: 0.3 }, headline: 'root', pressable: true },
];

/** The six in the R0.8 baseline sample. */
export const BASELINE_SAMPLE = ['button', 'switch', 'checkbox', 'tabs', 'toast', 'dialog'];

export function findInteraction(id: string): Interaction | undefined {
  return INTERACTIONS.find((i) => i.id === id || i.slug === id);
}

/** The profile a style gets (ruling 3): Studio and Desk are quiet, the rest rich. */
export function profileFor(style: string): 'rich' | 'quiet' {
  return style === 'studio' || style === 'desk' ? 'quiet' : 'rich';
}
