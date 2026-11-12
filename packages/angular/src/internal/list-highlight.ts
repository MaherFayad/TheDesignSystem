// The highlight (the keyboard cursor) of an option list, shared by ListBox
// and the list family popups (Combobox, Autocomplete, Select, MultiSelect,
// TagField). It keeps the highlighted value in a signal the component owns,
// and an ActiveDescendantKeyManager from @angular/cdk/a11y in step with it,
// so the CDK knows the active item for aria-activedescendant owners.
//
// Which option a key lands on is decided by the shared helpers in
// @the-system/shared (listbox.ts: nextEnabledIndex, edgeEnabledIndex,
// typeaheadIndex), never by the CDK: the CDK typeahead does not fold Arabic
// alef forms and diacritics, and its ends behave differently from the React
// lists. The manager is told the result with setActiveItem.
//
// Angular Aria (Listbox and Combobox in @angular/aria) would replace this
// once order A3.0 installs @angular/aria; it would then be imported in
// packages/angular/src/behavior/ only.
import { ActiveDescendantKeyManager, type Highlightable } from '@angular/cdk/a11y';
import { computed, type Injector, type Signal, type WritableSignal } from '@angular/core';
import { edgeEnabledIndex, nextEnabledIndex } from '@the-system/shared';

/** The part of an option the highlight needs. */
export interface HighlightOption {
  value: string;
  disabled?: boolean;
}

/** One option as the CDK manager sees it. Styles come from data-highlighted, so the hooks are empty. */
class OptionHandle implements Highlightable {
  constructor(
    readonly value: string,
    readonly disabled: boolean,
  ) {}
  setActiveStyles(): void {}
  setInactiveStyles(): void {}
}

export class ListHighlight {
  private readonly handles: Signal<OptionHandle[]>;
  private readonly manager: ActiveDescendantKeyManager<OptionHandle>;

  constructor(
    private readonly options: Signal<readonly HighlightOption[]>,
    /** The highlighted value, owned by the component (a model or a signal). */
    readonly value: WritableSignal<string | null>,
    injector: Injector,
  ) {
    this.handles = computed(() => this.options().map((o) => new OptionHandle(o.value, o.disabled === true)));
    this.manager = new ActiveDescendantKeyManager<OptionHandle>(this.handles, injector).skipPredicate((h) => h.disabled);
  }

  /** The index of the highlighted option in the visible options, or -1. */
  index(): number {
    const v = this.value();
    return v === null ? -1 : this.options().findIndex((o) => o.value === v);
  }

  private isDisabled = (i: number): boolean => this.options()[i]?.disabled ?? false;

  /** Highlights the option at `index` (or clears with -1). */
  setIndex(index: number): void {
    const option = this.options()[index];
    if (index >= 0) this.manager.setActiveItem(index);
    else this.manager.updateActiveItem(-1);
    this.value.set(option ? option.value : null);
  }

  /** Highlights a value directly (the pointer, a focus event, an owner). */
  set(value: string | null): void {
    const i = value === null ? -1 : this.options().findIndex((o) => o.value === value);
    if (i >= 0) this.manager.updateActiveItem(i);
    this.value.set(value);
  }

  /** The index one step from `from`, skipping disabled options (shared nextEnabledIndex). */
  next(from: number, step: 1 | -1, loop: boolean): number {
    return nextEnabledIndex(this.options().length, from, step, this.isDisabled, loop);
  }

  /** The first or last enabled index (shared edgeEnabledIndex). */
  edge(edge: 'first' | 'last'): number {
    return edgeEnabledIndex(this.options().length, edge, this.isDisabled);
  }

  /** The value of the first or last enabled option, or null. */
  edgeValue(edge: 'first' | 'last'): string | null {
    const i = this.edge(edge);
    return i === -1 ? null : (this.options()[i]?.value ?? null);
  }

  destroy(): void {
    this.manager.destroy();
  }
}
