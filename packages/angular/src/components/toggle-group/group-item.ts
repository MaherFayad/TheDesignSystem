// What ToggleGroup and SegmentedControl share: the items, drawn on the
// Button base as ToggleButton roots with data-part="item", and the roving
// focus they take from the group. The twin of the Radix ToggleGroup item
// (Toggle on RovingFocusGroup.Item) with ButtonRoot as its child in
// packages/react/src/components/ToggleGroup/ToggleGroup.tsx, and of
// inertItems.ts next to it. Not exported from the package barrel.
//
// The DOM is the one Radix renders: type single items take role radio and
// aria-checked, type multiple items aria-pressed; every item carries
// data-state (on, off), tabindex (0 for the tab stop, else -1),
// data-orientation and data-radix-collection-item.
//
// Disabled items stay focusable and in the arrow order (anatomy rule 5):
// Radix is not told about them, so the roving focus treats every item as
// enabled. The Button base makes them inert: aria-disabled, data-disabled,
// and its capture listener stops the click. An item is disabled by its own
// `disabled` or by the group's.
//
// A press is decided in a click listener added after the first render, so
// it runs after a caller's own (click) on the item (Angular registers that
// one when the item is created). A caller that calls preventDefault() keeps
// the state, as with Radix Toggle, and the decision is synchronous.
import {
  DestroyRef,
  Directive,
  InjectionToken,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  type Signal,
} from '@angular/core';
import type { RovingRadioGroup, RovingRadioItem } from '../../behavior/roving-radio';
import { rovingItem } from '../../behavior/roving-radio';
import { consumeHostAttributes } from '../../internal/host';
import { DsButtonBase, isIconName, type ButtonSlotContent } from '../button/button-base';

/** What a ToggleGroup or a SegmentedControl gives its items through DI. */
export interface ToggleItemGroup {
  /** single: role radio with aria-checked. multiple: aria-pressed. */
  readonly type: Signal<'single' | 'multiple'>;
  readonly orientation: Signal<'horizontal' | 'vertical'>;
  /** The whole group is disabled. */
  readonly disabled: Signal<boolean>;
  readonly roving: RovingRadioGroup;
  /** True when the value of this item is on. Tracked. */
  isOn(value: string): boolean;
  /** A press that was not prevented, on an item that is not inert. */
  press(value: string): void;
  /** Focus landed on an item that is not inert. */
  focused(value: string): void;
  /** Adds an item; returns the function that removes it. */
  register(item: RovingRadioItem): () => void;
}

export const DS_TOGGLE_ITEM_GROUP = new InjectionToken<ToggleItemGroup>('DsToggleItemGroup');

/** Input attributes every item consumes (see internal/host.ts). */
export const ITEM_INPUTS = ['value', 'icon', 'label', 'start', 'aria-label'];

/**
 * The item of a ToggleGroup or a SegmentedControl, on the Button base. Each
 * component declares its own selector, emphasis and template.
 */
@Directive({
  host: {
    'data-ds': 'toggle-button',
    'data-part': 'item',
    'data-radix-collection-item': '',
    '[attr.role]': 'single() ? "radio" : null',
    '[attr.aria-checked]': 'single() ? (on() ? "true" : "false") : null',
    '[attr.aria-pressed]': 'single() ? null : on() ? "true" : "false"',
    '[attr.data-state]': 'on() ? "on" : "off"',
    '[attr.tabindex]': 'toggles.roving.itemTabIndex(rovingRef)',
    '[attr.data-orientation]': 'toggles.orientation()',
    '[attr.aria-label]': 'icon() !== undefined ? (label() ?? null) : (ariaLabel() ?? null)',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '(mousedown)': 'toggles.roving.onItemMousedown(rovingRef, $event)',
    '(focus)': 'onFocus()',
    '(keydown)': 'onKeydown($event)',
  },
})
export abstract class DsGroupItemBase extends DsButtonBase {
  /** The value this item adds to the group value. Unique in the group. */
  readonly value = input.required<string>();
  /**
   * The item is disabled: aria-disabled, no press, stays focusable and in
   * the arrow order. The group's disabled also disables it. The same public
   * name as the base input, so the base never sees it: the item writes
   * data-disabled itself from both.
   */
  readonly itemDisabled = input(false, { alias: 'disabled', transform: booleanAttribute });
  /** Leading content before the label: an icon name or a template. */
  readonly start = input<ButtonSlotContent | undefined>(undefined);
  /** The icon only form: the icon, with `label` as the accessible name. Content is ignored. */
  readonly icon = input<ButtonSlotContent | undefined>(undefined);
  /** The accessible name of the icon only form, set as aria-label. Required with `icon`. */
  readonly label = input<string | undefined>(undefined);
  /** A name of the caller's own on a text item. The icon only form takes `label`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  protected readonly toggles = inject(DS_TOGGLE_ITEM_GROUP);
  protected readonly isIconName = isIconName;
  protected readonly single = computed(() => this.toggles.type() === 'single');
  readonly on = computed(() => this.toggles.isOn(this.value()));
  /** Own or group disabled. */
  readonly isDisabled = computed(() => this.itemDisabled() || this.toggles.disabled());
  override readonly inert = computed(() => this.isDisabled() || this.loading());
  private readonly hasIcon = computed(() => this.icon() !== undefined);

  protected readonly rovingRef: RovingRadioItem = rovingItem({
    value: () => this.value(),
    element: () => this.host,
    // Radix is not told about disabled items: they stay in the arrow order.
    disabled: () => false,
  });

  constructor() {
    super();
    consumeHostAttributes(ITEM_INPUTS);
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(this.toggles.register(this.rovingRef));
    const press = (event: MouseEvent) => {
      if (event.defaultPrevented || this.inert()) return;
      this.toggles.press(this.value());
    };
    afterNextRender(() => {
      this.host.addEventListener('click', press);
      destroyRef.onDestroy(() => this.host.removeEventListener('click', press));
    });
  }

  protected override isIconOnly(): boolean {
    return this.hasIcon();
  }

  protected onFocus(): void {
    this.toggles.roving.onItemFocus(this.rovingRef);
    if (!this.inert()) this.toggles.focused(this.value());
  }

  protected onKeydown(event: KeyboardEvent): void {
    // Enter and Space press the item through the native button click (the
    // Button base stops it on an inert item). Every other key goes to the
    // roving focus, from a disabled item too.
    if (event.key === 'Enter' || event.key === ' ') return;
    this.toggles.roving.onItemKeydown(this.rovingRef, event);
  }
}
