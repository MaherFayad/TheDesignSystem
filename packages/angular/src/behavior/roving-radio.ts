// The radio group behavior RadioGroup, RadioCard and Rating share: the
// Angular twin of Radix RadioGroup on Radix RovingFocusGroup
// (node_modules/@radix-ui/react-radio-group and react-roving-focus).
//
// What it copies, with the same DOM:
// - The root takes tabindex 0 (or -1 while Shift+Tab leaves the group, or
//   when no item can take focus). Focus that reaches the root by keyboard
//   moves on to the checked item, else the last focused item, else the first
//   enabled one. Each item has tabindex -1 until it takes focus; then it is
//   the tab stop (tabindex 0).
// - Arrows move focus and select the item focus lands on (selection follows
//   focus). With no orientation all four arrows work; horizontal ignores Up
//   and Down. Left and Right follow the reading direction from the CDK
//   Directionality, which the nearest dsTheme provides. Home, End, PageUp
//   and PageDown move focus to the first or last item without selecting.
//   Disabled items are skipped. `loop` wraps. A key with a modifier does
//   nothing.
// - Enter does nothing; Space is a native button click and selects.
// - Each item carries `data-radix-collection-item`, the marker Radix
//   Collection stamps, so the DOM equals React's.
//
// The key moves run on the CDK FocusKeyManager (wrap, vertical and
// horizontal orientation with the direction, Home and End, PageUp and
// PageDown as first and last, a skip predicate for disabled items). The tab
// stop rules above (a focusable root that hands focus on, items at -1 until
// focused, the Shift+Tab exit) are not something the key manager has, so
// they are hand built here. Angular Aria has no radio group pattern; if one
// lands, it would replace this file.
import { Directionality } from '@angular/cdk/bidi';
import { FocusKeyManager, type FocusableOption } from '@angular/cdk/a11y';
import { computed, effect, signal, untracked, type Signal } from '@angular/core';

/** One radio of a group, as the group sees it. */
export interface RovingRadioItem extends FocusableOption {
  /** The value the item selects. */
  readonly value: string;
  /** The element with role radio. */
  readonly element: HTMLElement;
  /** Group or item disabled. Read in a reactive context, it is tracked. */
  readonly disabled: boolean;
}

export interface RovingRadioOptions {
  /** The root element, role radiogroup. */
  readonly host: HTMLElement;
  /** The checked value, '' for none. */
  readonly value: Signal<string>;
  /** Called when a person picks an item that is not checked. */
  readonly select: (value: string) => void;
  /** Radix `orientation`: undefined takes all four arrows. */
  readonly orientation: Signal<'horizontal' | 'vertical' | undefined>;
  readonly loop: Signal<boolean>;
  readonly dir: Directionality;
  /** False while the root is not a radio group (a read only Rating): no tabindex then. Default true. */
  readonly active?: Signal<boolean>;
}

const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const HOME_END = ['Home', 'End', 'PageUp', 'PageDown'];

export class RovingRadioGroup {
  private readonly items = signal<readonly RovingRadioItem[]>([]);
  private readonly tabStop = signal<RovingRadioItem | null>(null);
  private readonly tabbingBackOut = signal(false);
  private clickFocus = false;

  /** The tabindex of the root, as Radix RovingFocusGroup sets it. */
  readonly rootTabIndex = computed(() =>
    this.tabbingBackOut() || this.items().every((item) => item.disabled) ? -1 : 0,
  );

  constructor(private readonly options: RovingRadioOptions) {
    // The root tabindex is written here and again at once in the Shift+Tab
    // handler: the browser moves focus right after keydown, before change
    // detection would run.
    effect(() => {
      this.options.active?.();
      this.writeRootTabIndex(this.rootTabIndex());
    });
  }

  /** Adds an item; returns the function that removes it. */
  register(item: RovingRadioItem): () => void {
    this.items.update((list) => [...list, item]);
    return () => {
      this.items.update((list) => list.filter((i) => i !== item));
      if (untracked(this.tabStop) === item) this.tabStop.set(null);
    };
  }

  /** The tabindex of one item: 0 for the current tab stop, else -1. */
  itemTabIndex(item: RovingRadioItem): number {
    return this.tabStop() === item ? 0 : -1;
  }

  /** Items in document order. */
  private ordered(): RovingRadioItem[] {
    return [...untracked(this.items)].sort((a, b) =>
      a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    );
  }

  private writeRootTabIndex(value: number): void {
    const active = this.options.active ? untracked(this.options.active) : true;
    if (active) this.options.host.setAttribute('tabindex', String(value));
    else this.options.host.removeAttribute('tabindex');
  }

  // Root events.

  onRootMousedown(): void {
    this.clickFocus = true;
  }

  /** focusin on the root: a keyboard focus of the root itself moves on to an item. */
  onRootFocusin(event: FocusEvent): void {
    const keyboard = !this.clickFocus;
    if (event.target === this.options.host && keyboard && !untracked(this.tabbingBackOut)) {
      const items = this.ordered().filter((item) => !item.disabled);
      const value = untracked(this.options.value);
      const active = items.find((item) => item.value === value);
      const current = items.find((item) => item === untracked(this.tabStop));
      const candidates = [active, current, ...items].filter((item): item is RovingRadioItem => item !== undefined);
      focusFirst(candidates.map((item) => item.element));
    }
    this.clickFocus = false;
  }

  /** focusout on the root, from the root or any item. */
  onRootFocusout(): void {
    this.tabbingBackOut.set(false);
    this.writeRootTabIndex(untracked(this.rootTabIndex));
  }

  // Item events.

  onItemMousedown(item: RovingRadioItem, event: MouseEvent): void {
    if (item.disabled) event.preventDefault();
    else this.tabStop.set(item);
  }

  onItemFocus(item: RovingRadioItem): void {
    this.tabStop.set(item);
  }

  /** A click, or Space: selects the item when it is not checked. */
  onItemClick(item: RovingRadioItem): void {
    if (untracked(this.options.value) !== item.value) this.options.select(item.value);
  }

  onItemKeydown(item: RovingRadioItem, event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      return;
    }
    if (event.key === 'Tab' && event.shiftKey) {
      this.tabbingBackOut.set(true);
      this.writeRootTabIndex(-1);
      return;
    }
    if (event.target !== event.currentTarget) return;
    const isArrow = ARROWS.includes(event.key);
    if (!isArrow && !HOME_END.includes(event.key)) return;
    const orientation = untracked(this.options.orientation);
    if (orientation === 'vertical' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) return;
    if (orientation === 'horizontal' && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) return;
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;

    const items = this.ordered();
    const manager = new FocusKeyManager(items)
      .withWrap(untracked(this.options.loop))
      .withVerticalOrientation(orientation !== 'horizontal')
      .withHorizontalOrientation(orientation === 'vertical' ? null : this.options.dir.valueSignal())
      .withHomeAndEnd()
      .withPageUpDown(true, items.length)
      .skipPredicate((option) => option.disabled);
    manager.updateActiveItem(item);
    // The key manager reads keyCode; a keydown made in a test may only carry key.
    manager.onKeydown(withKeyCode(event));
    if (!event.defaultPrevented) event.preventDefault();
    const next = manager.activeItem;
    manager.destroy();
    if (!next || next === item) return;
    if (isArrow) this.onItemClick(next);
  }
}

const KEY_CODES: Record<string, number> = {
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  Home: 36,
  End: 35,
  PageUp: 33,
  PageDown: 34,
};

function withKeyCode(event: KeyboardEvent): KeyboardEvent {
  if (event.keyCode) return event;
  return new Proxy(event, {
    get(target, prop) {
      if (prop === 'keyCode') return KEY_CODES[target.key] ?? 0;
      const value = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

/** Focuses the first candidate that takes focus, as Radix focusFirst. */
function focusFirst(candidates: readonly HTMLElement[]): void {
  const previous = document.activeElement;
  for (const candidate of candidates) {
    if (candidate === previous) return;
    candidate.focus();
    if (document.activeElement !== previous) return;
  }
}

/**
 * The hidden native radio Radix renders after each item inside a form, so
 * the value posts with it. The style is what Radix ends with after it has
 * measured the control: its own keys first, then the size it adds.
 */
export function bubbleInputStyle(control: HTMLElement): Record<string, string> {
  return {
    position: 'absolute',
    'pointer-events': 'none',
    opacity: '0',
    margin: '0px',
    transform: 'translateX(-100%)',
    width: `${control.offsetWidth}px`,
    height: `${control.offsetHeight}px`,
  };
}

/** Makes a roving item from three readers. Reading `disabled` in a reactive context tracks it. */
export function rovingItem(read: { value: () => string; element: () => HTMLElement; disabled: () => boolean }): RovingRadioItem {
  return {
    get value() {
      return read.value();
    },
    get element() {
      return read.element();
    },
    get disabled() {
      return read.disabled();
    },
    focus: () => read.element().focus(),
  };
}
