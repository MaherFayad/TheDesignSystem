// ToggleGroup: a set of ToggleButtons where one (type single) or several
// (type multiple) can be on: text alignment, filter chips, view options.
// The twin of packages/react/src/components/ToggleGroup/ToggleGroup.tsx.
//
//   <div dsToggleGroup type="multiple" aria-label="Text style" [(value)]="styles">
//     <button dsToggleGroupItem value="bold">Bold</button>
//     <button dsToggleGroupItem value="italic">Italic</button>
//   </div>
//   <div dsToggleGroup type="single" aria-label="Board view" attached defaultValue="grid">
//     <button dsToggleGroupItem value="list" icon="list" label="List view"></button>
//   </div>
//
// The host is the root with the Radix ToggleGroup DOM: role radiogroup
// (single) or toolbar (multiple), dir, data-orientation, the roving tab stop
// (tabindex) and outline none. Each item is a `button[dsToggleGroupItem]`
// on the Button base (group-item.ts), a ToggleButton root with
// data-part="item". The group passes size, emphasis and shape to the items
// through DS_BUTTON_GROUP, as ButtonGroup does; an item's own input wins.
//
// Behavior: React gets it from Radix ToggleGroup on RovingFocusGroup. Here
// it runs on behavior/roving-radio.ts (the Radix roving tab stop, with the
// key moves on the CDK FocusKeyManager and the reading direction from the
// CDK Directionality), with every item enabled for the roving focus, as
// React does not tell Radix about disabled items. Focus alone does not
// toggle; Space and Enter toggle through the native button click.
//
// Motion, interaction "tab-slide" (order 1.22, proposed): in a single choice
// group every item holds an empty aria-hidden span, inside the item part,
// that draws the on fill of the on item (ToggleGroup.css). When the value
// changes, the shared pill (internal/indicator.ts) slides that fill from the
// item it leaves to the item it reaches on the snappy spring, stretched
// along its travel. Round 3 (order 1.23): the labels no longer dip and pop;
// the text under the pill takes the on color where the pill is, with the
// aria-hidden `label-ink` twins of nav-ink.ts in @the-system/motion. As in
// React (order 1.29, angular-sync-3 section 6 item 2), the label under the
// pill is kept outside the track: followIndicator gets the pill alone, so it
// never dips and pops a label. A multiple group has no pill. It plays from
// afterRenderEffect, after the items show the new state.
//
// Names that differ from React: `onValueChange` is the `valueChange` output
// of `[(value)]`. `start`, `end` and `icon` take an icon name or a
// TemplateRef. Works with reactive and template forms
// (ControlValueAccessor): a string for single, a list for multiple.
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  afterRenderEffect,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  booleanAttribute,
  computed,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Directionality } from '@angular/cdk/bidi';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DsIcon } from '@the-system/icons/angular';
import type { Emphasis, Shape, Size } from '@the-system/shared';
import { RovingRadioGroup, type RovingRadioItem } from '../../behavior/roving-radio';
import { consumeHostAttributes } from '../../internal/host';
import { createTrack, followIndicator, fromLocal, playInk } from '@the-system/motion';
import { injectMotion } from '../../internal/motion';
import { DS_BUTTON_GROUP, type ButtonGroupAxes } from '../button-group/button-group-context';
import type { ButtonEmphasis, ButtonSlotContent } from '../button/button-base';
import { DS_TOGGLE_ITEM_GROUP, DsGroupItemBase, type ToggleItemGroup } from './group-item';

export type ToggleGroupType = 'single' | 'multiple';
export type ToggleGroupSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export type ToggleGroupEmphasis = Extract<Emphasis, 'solid' | 'soft' | 'outline' | 'ghost'>;
export type ToggleGroupShape = Extract<Shape, 'default' | 'pill' | 'square'>;
export type ToggleGroupOrientation = 'horizontal' | 'vertical';
/** A string for single ('' for none), a list for multiple. */
export type ToggleGroupValue = string | string[];

/** The parts whose color crosses under the pill, of one item and of the whole group. */
const INKED_OWN = ':scope > :is([data-part="label"], [data-part="start"], [data-part="icon"], [data-part="end"])';
const INKED = ':scope > [data-part="item"] > :is([data-part="label"], [data-part="start"], [data-part="icon"], [data-part="end"])';

function toList(value: ToggleGroupValue | null | undefined): string[] {
  if (value === undefined || value === null || value === '') return [];
  return Array.isArray(value) ? [...value] : [value];
}

/** Items in document order. */
function ordered(items: readonly RovingRadioItem[]): RovingRadioItem[] {
  return [...items].sort((a, b) => (a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
}

/**
 * A labelled set of toggles with one tab stop. `type="single"` keeps at most
 * one on (and lets it turn off); `type="multiple"` lets any number be on.
 * Name it with `aria-label` or `aria-labelledby`.
 */
@Directive({
  selector: 'div[dsToggleGroup]',
  exportAs: 'dsToggleGroup',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsToggleGroup), multi: true },
    { provide: DS_BUTTON_GROUP, useFactory: () => inject(DsToggleGroup).axes },
    { provide: DS_TOGGLE_ITEM_GROUP, useFactory: () => inject(DsToggleGroup).context },
  ],
  host: {
    'data-ds': 'toggle-group',
    '[attr.role]': 'type() === "single" ? "radiogroup" : "toolbar"',
    '[attr.dir]': 'dir.valueSignal()',
    '[attr.data-orientation]': 'orientation()',
    '[style.outline]': '"none"',
    '[attr.data-size]': 'size()',
    '[attr.data-emphasis]': 'emphasis() ?? null',
    '[attr.data-shape]': 'shape() ?? null',
    '[attr.data-attached]': 'attached() ? "" : null',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '(mousedown)': 'roving.onRootMousedown()',
    '(focusin)': 'roving.onRootFocusin($event)',
    '(focusout)': 'onFocusout()',
  },
})
export class DsToggleGroup implements ControlValueAccessor {
  /** single: at most one item on, role radiogroup. multiple: any number on, role toolbar. */
  readonly type = input.required<ToggleGroupType>();
  /** The value. Two way: `[(value)]`. A string for single ('' for none), a list for multiple. */
  readonly value = model<ToggleGroupValue | undefined>(undefined);
  /** The value at first, when `value` is not bound. */
  readonly defaultValue = input<ToggleGroupValue | undefined>(undefined);
  /** Passed to every item that does not set its own. Default md. */
  readonly size = input<ToggleGroupSize>('md');
  /** Passed to every item that does not set its own. Default none: items are soft, as ToggleButton. */
  readonly emphasis = input<ToggleGroupEmphasis | undefined>(undefined);
  /** Passed to every item that does not set its own. Default none. */
  readonly shape = input<ToggleGroupShape | undefined>(undefined);
  /** A row (ArrowLeft and ArrowRight) or a column (ArrowUp and ArrowDown). Default horizontal. */
  readonly orientation = input<ToggleGroupOrientation>('horizontal');
  /** Joins the items into one seamed control. Default false. */
  readonly attached = input(false, { transform: booleanAttribute });
  /** Every item is disabled; items keep aria-disabled and stay focusable, in the arrow order. Default false. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Arrow keys wrap from the last item to the first. Default true. */
  readonly loop = input(true, { transform: booleanAttribute });

  protected readonly host = consumeHostAttributes([
    'dsToggleGroup', 'type', 'value', 'defaultValue', 'size', 'emphasis', 'shape', 'orientation', 'attached', 'disabled', 'loop',
  ]);
  protected readonly dir = inject(Directionality);

  /** The on values: the model, else defaultValue, moved by presses and forms. */
  private readonly current = linkedSignal<string[]>(() => toList(this.value() ?? this.defaultValue()));
  private readonly formDisabled = signal(false);
  private readonly items = signal<readonly RovingRadioItem[]>([]);
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  /** The item Tab enters on: the first on item in document order, as Radix's active item. */
  private readonly entryValue = computed(() => {
    const on = this.current();
    return ordered(this.items()).find((item) => on.includes(item.value))?.value ?? '';
  });

  protected readonly roving = new RovingRadioGroup({
    host: this.host,
    value: this.entryValue,
    // Arrows only move focus in a ToggleGroup: a press goes through the item.
    select: () => {},
    orientation: this.orientation,
    loop: this.loop,
    dir: this.dir,
  });

  readonly axes: ButtonGroupAxes = { size: this.size, emphasis: this.emphasis, shape: this.shape };

  readonly context: ToggleItemGroup = {
    type: this.type,
    orientation: this.orientation,
    disabled: this.isDisabled,
    roving: this.roving,
    isOn: (value) => this.current().includes(value),
    press: (value) => this.press(value),
    focused: () => {},
    register: (item) => {
      this.items.update((list) => [...list, item]);
      const leave = this.roving.register(item);
      return () => {
        this.items.update((list) => list.filter((i) => i !== item));
        leave();
      };
    },
  };

  private onChange: (value: ToggleGroupValue) => void = () => {};
  private onTouched: () => void = () => {};
  /** Where the on fill was last drawn, so the next change slides from there. */
  private readonly track = createTrack();
  /** The label under the pill: its color is the rest color once the pill leaves it. */
  private lastLabel: Element | null = null;
  private readonly motion = injectMotion();

  constructor() {
    // Interaction "tab-slide": after the items show the new value, the on
    // fill slides from the item it left.
    afterRenderEffect(() => {
      const single = this.type() === 'single';
      const key = this.current()[0] ?? '';
      this.items();
      untracked(() => this.follow(single, key));
    });
  }

  private follow(single: boolean, key: string): void {
    const root = this.host;
    if (!single) return;
    const item = root.querySelector<HTMLElement>(':scope > [data-part="item"][data-state="on"]');
    const pill = item?.querySelector(':scope > span[aria-hidden="true"]:not([data-part])');
    if (!item || !pill) {
      this.track.key = null;
      return;
    }
    const lastLabel = this.lastLabel;
    const label = item.querySelector(':scope > [data-part="label"], :scope > [data-part="icon"]');
    const slide = followIndicator(this.track, key, { el: pill }, { mode: this.motion.mode('tab-slide'), anchor: root });
    this.lastLabel = label;
    // Round 3: the text under the pill takes the on color where the pill is.
    playInk({
      switch: '--_toggle-group-ink',
      slide,
      to: this.track.rect ? fromLocal(this.track.rect, root) : pill.getBoundingClientRect(),
      anchor: root,
      parts: Array.from(root.querySelectorAll(INKED)),
      reaching: Array.from(item.querySelectorAll(INKED_OWN)),
      restFrom: lastLabel,
      inkFrom: label,
      axis: untracked(this.orientation) === 'vertical' ? 'y' : 'x',
    });
  }

  /** Turns an item on or off, as Radix onItemActivate and onItemDeactivate. */
  private press(value: string): void {
    const list = untracked(this.current);
    const single = untracked(this.type) === 'single';
    const wasOn = list.includes(value);
    let next: string[];
    if (single) next = wasOn ? [] : [value];
    else next = wasOn ? list.filter((v) => v !== value) : [...list, value];
    this.current.set(next);
    const out: ToggleGroupValue = single ? (next[0] ?? '') : next;
    this.value.set(out);
    this.onChange(out);
  }

  protected onFocusout(): void {
    this.roving.onRootFocusout();
    this.onTouched();
  }

  writeValue(value: ToggleGroupValue | null | undefined): void {
    this.current.set(toList(value));
  }

  registerOnChange(fn: (value: ToggleGroupValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}

/**
 * One option of a ToggleGroup: a ToggleButton root with data-part="item".
 * data-state (on, off), and aria-checked with role radio (single) or
 * aria-pressed (multiple).
 */
@Component({
  selector: 'button[dsToggleGroupItem]',
  exportAs: 'dsToggleGroupItem',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #slot let-content>
      @if (isIconName(content)) {
        <svg dsIcon [name]="content" size="md"></svg>
      } @else {
        <ng-container [ngTemplateOutlet]="content" />
      }
    </ng-template>
    @if (single()) {
      <span aria-hidden="true"></span>
    }
    @if (icon(); as content) {
      <span data-part="icon"><ng-container [ngTemplateOutlet]="slot" [ngTemplateOutletContext]="{ $implicit: content }" /></span>
    } @else {
      @if (start(); as content) {
        <span data-part="start"><ng-container [ngTemplateOutlet]="slot" [ngTemplateOutletContext]="{ $implicit: content }" /></span>
      }
      <span data-part="label"><ng-content /></span>
      @if (end(); as content) {
        <span data-part="end"><ng-container [ngTemplateOutlet]="slot" [ngTemplateOutletContext]="{ $implicit: content }" /></span>
      }
    }
    <span data-part="hit" aria-hidden="true"></span>
  `,
})
export class DsToggleGroupItem extends DsGroupItemBase {
  /** Default soft, or the emphasis of the group. */
  readonly emphasis = input<ButtonEmphasis | undefined>(undefined);
  /** Trailing content after the label: an icon name or a template. */
  readonly end = input<ButtonSlotContent | undefined>(undefined);

  protected readonly defaultEmphasis: ButtonEmphasis = 'soft';

  constructor() {
    super();
    consumeHostAttributes(['dsToggleGroupItem', 'end']);
  }
}

/** The group and its item, for `imports`. */
export const DS_TOGGLE_GROUP = [DsToggleGroup, DsToggleGroupItem] as const;
