// DropdownMenu: a menu of actions or options opened from a trigger. The twin
// of packages/react/src/components/DropdownMenu/DropdownMenu.tsx, hand built
// on the CDK (Portal, Directionality) with the Radix DropdownMenu behavior:
// roles menu, menuitem, menuitemcheckbox, menuitemradio; roving focus,
// typeahead, Home and End, submenus toward the inline end, Escape and focus
// back to the trigger, a click or focus outside closes it.
//
//   <ng-container dsDropdownMenu size="sm">
//     <button dsButton dsDropdownMenuTrigger end="chevron-down">Board actions</button>
//     <ng-template dsDropdownMenuContent>
//       <div dsDropdownMenuLabel>Board</div>
//       <div dsDropdownMenuItem start="edit" shortcut="F2" (select)="rename()">Rename board</div>
//       <ng-container dsDropdownMenuSub>
//         <div dsDropdownMenuSubTrigger start="link">Share board</div>
//         <ng-template dsDropdownMenuSubContent>
//           <div dsDropdownMenuItem>Copy link</div>
//         </ng-template>
//       </ng-container>
//       <div dsDropdownMenuSeparator></div>
//       <div dsDropdownMenuCheckboxItem [(checked)]="grid">Show grid</div>
//       <div dsDropdownMenuRadioGroup [(value)]="sort">
//         <div dsDropdownMenuRadioItem value="name">Name</div>
//       </div>
//     </ng-template>
//   </ng-container>
//
// The DOM is React's, element for element and attribute for attribute,
// including the names Radix gives its internals (data-radix-popper-content-
// wrapper, data-radix-menu-content, data-radix-collection-item and the
// --radix-* variables), because DropdownMenu.css and Tour.css read some of
// them and the contract compares the rest:
//
//   <button data-ds="button" aria-haspopup="menu">     the trigger: a dsButton with dsDropdownMenuTrigger
//   <body>
//     <div data-ds="theme" data-menu-layer>             the portal theme (the layer component's host)
//       <div data-radix-popper-content-wrapper>         fixed, translate (behavior/popper.ts)
//         <div data-ds="dropdown-menu" role="menu">     the root, then the items from the template
//
// Why not Angular Aria Menu or the CDK Menu: both own the trigger and the
// menu element and stamp their own attributes and classes (cdk-menu,
// cdk-menu-item and so on), and the CDK Menu opens in a CDK Overlay pane, an
// element the React DOM does not have. Angular Aria is not installed (A3.0
// installs it). So the behavior is written here, the way the Dialog port does
// it, with the CDK Portal for the layer.
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  Injector,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
  untracked,
  viewChild,
  type Signal,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ComponentPortal, DomPortalOutlet } from '@angular/cdk/portal';
import { Directionality } from '@angular/cdk/bidi';
import { DsIcon } from '@the-system/icons/angular';
import type { Size, Tone } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { animationsDone, hideOthers } from '../../behavior';
import { autoPlace, computePopper, writePopper, type PopperAlign, type PopperSide } from '../../behavior/popper';
import { DsThemeScope, DsThemeService, attributesOf, syncDirectionality, themeScopeProviders } from '../../theme';
import type { ThemeValue } from '../../theme';
import { isIconName, type ButtonSlotContent } from '../button/button-base';

/** Menu sizes: sm rows are 24px, md rows follow menu.item.height (28px at default density). */
export type DropdownMenuSize = Extract<Size, 'sm' | 'md'>;
/** Item tones: danger marks a destructive action. */
export type DropdownMenuItemTone = Extract<Tone, 'neutral' | 'danger'>;
/** Leading or trailing content of an item: a system icon name or a template. */
export type DropdownMenuSlotContent = ButtonSlotContent;
/** Where the menu opens, in logical words: block-end is below the trigger, inline-end is after it in reading order. */
export type DropdownMenuSide = 'block-start' | 'block-end' | 'inline-start' | 'inline-end';
/** How the menu lines up with the trigger along that side. start follows the reading direction. */
export type DropdownMenuAlign = PopperAlign;
/** A checkbox item's state. */
export type DropdownMenuChecked = boolean | 'indeterminate';

/** Gap between a trigger and its menu, px. */
const TRIGGER_GAP = 4;
/** Space kept between a menu and the viewport edge, px. */
const VIEWPORT_GUTTER = 8;
const ITEM_SELECTOR = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
const FIRST_KEYS = ['ArrowDown', 'PageUp', 'Home'];
const LAST_KEYS = ['ArrowUp', 'PageDown', 'End'];
const SELECTION_KEYS = ['Enter', ' '];
/** The content's own style, as Radix writes it: the --radix-dropdown-menu-* names map the popper variables. */
const CONTENT_STYLE =
  'outline: none; --radix-dropdown-menu-content-transform-origin: var(--radix-popper-transform-origin); --radix-dropdown-menu-content-available-width: var(--radix-popper-available-width); --radix-dropdown-menu-content-available-height: var(--radix-popper-available-height); --radix-dropdown-menu-trigger-width: var(--radix-popper-anchor-width); --radix-dropdown-menu-trigger-height: var(--radix-popper-anchor-height);';

let nextId = 0;
/** The textValue input of each item element, for typeahead. */
const textValues = new WeakMap<HTMLElement, () => string | undefined>();
const newId = (part: string) => `ds-menu-${part}-${++nextId}`;

/** Logical side to the physical side. */
function physicalSide(side: DropdownMenuSide, dir: 'ltr' | 'rtl'): PopperSide {
  if (side === 'block-start') return 'top';
  if (side === 'block-end') return 'bottom';
  const end = dir === 'rtl' ? 'left' : 'right';
  const start = dir === 'rtl' ? 'right' : 'left';
  return side === 'inline-end' ? end : start;
}

// Keyboard or pointer: a menu opened with the keyboard moves focus to its
// first item, one opened with the pointer focuses the menu itself (Radix
// Menu's isUsingKeyboard).
let usingKeyboard = false;
let tracking = false;
function trackInput(doc: Document): void {
  if (tracking) return;
  tracking = true;
  doc.addEventListener('keydown', () => (usingKeyboard = true), { capture: true });
  const pointer = () => (usingKeyboard = false);
  doc.addEventListener('pointerdown', pointer, { capture: true });
  doc.addEventListener('pointermove', pointer, { capture: true });
}

/** Focuses the first element of the list that takes focus. */
function focusFirst(candidates: HTMLElement[], doc: Document): void {
  const before = doc.activeElement;
  for (const el of candidates) {
    if (el === before) return;
    el.focus({ preventScroll: true });
    if (doc.activeElement !== before) return;
  }
}

/** Radix's typeahead match: a repeated letter cycles, the current match is skipped for one letter. */
function nextMatch(values: string[], search: string, current: string | undefined): string | undefined {
  const repeated = search.length > 1 && Array.from(search).every((c) => c === search[0]);
  const normalized = repeated ? (search[0] ?? '') : search;
  const index = current ? values.indexOf(current) : -1;
  let wrapped = values.map((_, i) => values[(Math.max(index, 0) + i) % values.length] as string);
  if (normalized.length === 1) wrapped = wrapped.filter((v) => v !== current);
  const match = wrapped.find((v) => v.toLowerCase().startsWith(normalized.toLowerCase()));
  return match !== current ? match : undefined;
}

// ------------------------------------------------------------------ dsDropdownMenu

/**
 * The root: state and the size axis. Renders no element of its own: put it
 * on an ng-container. `onOpenChange` is the `openChange` output of
 * `[(open)]`.
 */
@Directive({ selector: '[dsDropdownMenu]', exportAs: 'dsDropdownMenu' })
export class DsDropdownMenu {
  /** Open. Two way with `[(open)]`. */
  readonly open = model<boolean | undefined>(undefined);
  /** Open at first, when `open` is not bound. Default false. */
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /**
   * true: while open, the rest of the page is hidden from assistive tech.
   * Default false: the menu button pattern needs no more.
   */
  readonly modal = input(false, { transform: booleanAttribute });
  /** Row height and type size: sm 24px, md menu.item.height. Default md. */
  readonly size = input<DropdownMenuSize>('md');

  /** The shown state: the bound value, or the local one. */
  readonly isOpen = linkedSignal(() => this.open() ?? this.defaultOpen());
  /** The trigger's id: its own id attribute when it has one, as in Radix. */
  triggerId = newId('trigger');
  readonly contentId = newId('content');
  trigger: HTMLElement | null = null;
  /** Set by ArrowUp on the trigger: focus the last item once the menu is open. */
  focusLast = false;
  /** The close came from a click or focus outside: focus stays where it went. */
  interactedOutside = false;
  /** Where the root menu is placed, for the trigger's data-radix-popper-* attributes. */
  readonly placed = signal<{ side: PopperSide; align: PopperAlign } | null>(null);

  constructor() {
    consumeHostAttributes(['dsDropdownMenu', 'open', 'defaultOpen', 'modal', 'size']);
    trackInput(inject(DOCUMENT));
  }

  setOpen(open: boolean): void {
    if (this.isOpen() === open) return;
    this.isOpen.set(open);
    this.open.set(open);
  }
}

function injectMenu(name: string): DsDropdownMenu {
  const menu = inject(DsDropdownMenu, { optional: true });
  if (!menu) throw new Error(`${name} must be used inside a dsDropdownMenu.`);
  return menu;
}

// ------------------------------------------------------------------ dsDropdownMenuTrigger

/**
 * Opens the menu. Put it on the system button that opens it:
 * `<button dsButton dsDropdownMenuTrigger end="chevron-down">`. Enter, Space
 * and ArrowDown open it with focus on the first item; ArrowUp opens it with
 * focus on the last item; a press of the pointer toggles it. Focus returns
 * here on close.
 */
@Directive({
  selector: '[dsDropdownMenuTrigger]',
  exportAs: 'dsDropdownMenuTrigger',
  host: {
    '[id]': 'menu.triggerId',
    'aria-haspopup': 'menu',
    '[attr.aria-expanded]': 'menu.isOpen() ? "true" : "false"',
    '[attr.aria-controls]': 'menu.isOpen() ? menu.contentId : null',
    '[attr.data-state]': 'menu.isOpen() ? "open" : "closed"',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-radix-popper-side]': 'menu.placed()?.side ?? null',
    '[attr.data-radix-popper-align]': 'menu.placed()?.align ?? null',
    '(pointerdown)': 'onPointerDown($event)',
    '(keydown)': 'onKeyDown($event)',
  },
})
export class DsDropdownMenuTrigger {
  /** The trigger cannot open the menu. Also set disabled on the button itself. */
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly menu = injectMenu('dsDropdownMenuTrigger');
  private readonly el = consumeHostAttributes(['dsDropdownMenuTrigger']);

  constructor() {
    if (this.el.id) this.menu.triggerId = this.el.id;
    this.menu.trigger = this.el;
    inject(DestroyRef).onDestroy(() => {
      if (this.menu.trigger === this.el) this.menu.trigger = null;
    });
  }

  private inert(): boolean {
    return this.disabled() || this.el.getAttribute('aria-disabled') === 'true';
  }

  protected onPointerDown(event: PointerEvent): void {
    if (this.inert() || event.button !== 0 || event.ctrlKey) return;
    const wasOpen = this.menu.isOpen();
    this.menu.setOpen(!wasOpen);
    // Opening: keep focus off the trigger, the menu takes it.
    if (!wasOpen) event.preventDefault();
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (this.inert() || event.defaultPrevented) return;
    if (event.key === 'Enter' || event.key === ' ') this.menu.setOpen(!this.menu.isOpen());
    else if (event.key === 'ArrowDown') this.menu.setOpen(true);
    else if (event.key === 'ArrowUp' && !this.menu.isOpen()) {
      this.menu.focusLast = true;
      this.menu.setOpen(true);
    } else return;
    event.preventDefault();
  }
}

// ------------------------------------------------------------------ the panels

/** A menu surface: the root content or a submenu. Items inject the nearest one. */
export abstract class MenuPanel {
  abstract readonly isOpen: Signal<boolean>;
  abstract readonly template: TemplateRef<unknown>;
  abstract readonly id: string;
  abstract readonly labelledBy: string;
  abstract readonly part: string | null;
  abstract readonly root: DsDropdownMenu;
  /** The menu element while mounted. */
  element: HTMLElement | null = null;
  /** The roving tab stop: the last item that had focus. */
  readonly tabStop = signal<HTMLElement | null>(null);
  /** Open submenus of this panel. */
  readonly children = new Set<MenuPanel>();
  search = '';
  searchTimer: ReturnType<typeof setTimeout> | undefined;

  /** Inside this menu or one of its open submenus. */
  contains(node: Node | null): boolean {
    if (!node) return false;
    if (this.element?.contains(node)) return true;
    for (const child of this.children) if (child.contains(node)) return true;
    return false;
  }

  /** The enabled items that belong to this menu (not to a nested one). */
  items(): HTMLElement[] {
    const el = this.element;
    if (!el) return [];
    return Array.from(el.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
      (item) => item.closest('[data-ds="dropdown-menu"]') === el && !item.hasAttribute('data-disabled'),
    );
  }

  /** Keys on the menu element: Tab stays, typeahead, and the first or last item from the menu itself. */
  onKeyDown(event: KeyboardEvent): void {
    const el = this.element;
    if (!el) return;
    const target = event.target as Element;
    const inside = target.closest('[data-radix-menu-content]') === el;
    const modifier = event.ctrlKey || event.altKey || event.metaKey;
    if (inside) {
      if (event.key === 'Tab') event.preventDefault();
      if (!modifier && event.key.length === 1) this.typeahead(event.key, el.ownerDocument);
    }
    if (target !== el) return;
    if (![...FIRST_KEYS, ...LAST_KEYS].includes(event.key)) return;
    event.preventDefault();
    const items = this.items();
    if (LAST_KEYS.includes(event.key)) items.reverse();
    focusFirst(items, el.ownerDocument);
  }

  /** The roving keys on an item: next, previous, first, last. No wrap. */
  onItemKeyDown(event: KeyboardEvent, item: HTMLElement): void {
    if (event.target !== item) return;
    const key = event.key;
    const intent =
      key === 'ArrowDown' ? 'next' : key === 'ArrowUp' ? 'prev' : key === 'Home' || key === 'PageUp' ? 'first' : key === 'End' || key === 'PageDown' ? 'last' : null;
    if (!intent || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    let items = this.items();
    if (intent === 'last' || intent === 'prev') items.reverse();
    if (intent === 'prev' || intent === 'next') items = items.slice(items.indexOf(item) + 1);
    focusFirst(items, item.ownerDocument);
  }

  private typeahead(key: string, doc: Document): void {
    const search = this.search + key;
    const items = this.items();
    const text = (el: HTMLElement) => textValues.get(el)?.() ?? el.querySelector('[data-part="text"]')?.textContent?.trim() ?? '';
    const values = items.map(text);
    const active = doc.activeElement;
    const current = items.find((el) => el === active);
    const match = nextMatch(values, search, current ? text(current) : undefined);
    const target = items.find((el) => text(el) === match);
    this.search = search;
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => (this.search = ''), 1000);
    if (target) setTimeout(() => target.focus());
  }

  /** The pointer left an item: the menu takes focus and no item is the tab stop. */
  onItemLeave(): void {
    this.element?.focus({ preventScroll: true });
    this.tabStop.set(null);
  }

  /** Closes the whole menu, from any level. */
  closeAll(): void {
    this.root.setOpen(false);
  }
}

export const DS_MENU_PANEL = new InjectionToken<MenuPanel>('DsMenuPanel');

function injectPanel(name: string): MenuPanel {
  const panel = inject(DS_MENU_PANEL, { optional: true });
  if (!panel) throw new Error(`${name} must be inside a dsDropdownMenuContent.`);
  return panel;
}

interface LayerData {
  panel: MenuPanel;
  theme: Signal<ThemeValue>;
  size: Signal<DropdownMenuSize>;
}

const MENU_LAYER = new InjectionToken<LayerData>('DS_MENU_LAYER');

/**
 * The portal: the themed wrapper (its own host, data-menu-layer), the
 * popper wrapper and the menu. Internal: the content directives create it.
 */
@Component({
  selector: 'div[data-menu-layer]',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: themeScopeProviders(() => new DsThemeScope(inject(MENU_LAYER).theme)),
  host: {
    'data-ds': 'theme',
    '[attr.data-style]': 'attrs()["data-style"]',
    '[attr.data-scheme]': 'attrs()["data-scheme"]',
    '[attr.data-density]': 'attrs()["data-density"]',
    '[attr.data-contrast]': 'attrs()["data-contrast"]',
    '[attr.data-platform]': 'attrs()["data-platform"]',
    '[attr.data-glass]': 'attrs()["data-glass"]',
    '[attr.dir]': 'attrs().dir',
    '[attr.lang]': 'attrs().lang',
  },
  template: `
    <div #wrapper data-radix-popper-content-wrapper="" [attr.dir]="attrs().dir">
      <div #menu data-ds="dropdown-menu" [attr.data-part]="panel.part" role="menu" [id]="panel.id"
        [attr.aria-labelledby]="panel.labelledBy" aria-orientation="vertical" data-orientation="vertical"
        data-radix-menu-content="" [attr.data-state]="state()" [attr.data-side]="side()" [attr.data-align]="align()"
        [attr.data-size]="data.size()" [attr.dir]="attrs().dir" tabindex="-1" (keydown)="panel.onKeyDown($event)">
        <ng-container [ngTemplateOutlet]="panel.template" />
      </div>
    </div>
  `,
})
export class DsMenuLayer {
  protected readonly data = inject(MENU_LAYER);
  protected readonly panel = this.data.panel;
  private readonly theme = inject(DsThemeService);
  protected readonly attrs = computed(() => attributesOf(this.theme.value()));
  readonly wrapper = viewChild.required<ElementRef<HTMLElement>>('wrapper');
  readonly menu = viewChild.required<ElementRef<HTMLElement>>('menu');
  readonly closing = signal(false);
  readonly state = computed(() => (this.panel.isOpen() && !this.closing() ? 'open' : 'closed'));
  readonly side = signal<PopperSide>('bottom');
  readonly align = signal<PopperAlign>('start');

  constructor() {
    // The host comes from the selector, so it already carries data-menu-layer="".
    syncDirectionality(inject(Directionality), this.theme.value);
  }
}

/** Mounts and unmounts a panel's layer, places it and runs its focus rules. Shared by the root and the submenus. */
abstract class MenuPanelHost extends MenuPanel {
  protected readonly injector = inject(Injector);
  private readonly appRef = inject(ApplicationRef);
  protected readonly doc = inject(DOCUMENT);
  protected readonly themeService = inject(DsThemeService);
  private outlet: DomPortalOutlet | null = null;
  protected layer: DsMenuLayer | null = null;
  private undo: (() => void)[] = [];
  private generation = 0;

  /** The element the menu opens from. */
  protected abstract anchor(): HTMLElement | null;
  /** The placement options. */
  protected abstract placement(dir: 'ltr' | 'rtl'): { side: PopperSide; align: PopperAlign; sideOffset: number; alignOffset: number; padding: number };
  /** Called once the layer is in the DOM. */
  protected abstract opened(menu: HTMLElement): void;
  /** Called when it closes (before the exit plays). */
  protected abstract closed(): void;
  /** Extra listeners while open; returns their cleanup. */
  protected abstract listen(menu: HTMLElement): (() => void)[];
  protected onPlaced(_side: PopperSide, _align: PopperAlign): void {}

  protected watch(): void {
    effect(() => {
      const open = this.isOpen();
      untracked(() => (open ? this.mount() : this.unmountAfterExit()));
    });
    inject(DestroyRef).onDestroy(() => this.dispose());
  }

  private mount(): void {
    this.generation += 1;
    if (this.layer) {
      this.layer.closing.set(false);
      return;
    }
    const injector = Injector.create({
      parent: this.injector,
      providers: [{ provide: MENU_LAYER, useValue: { panel: this, theme: this.themeService.value, size: this.root.size } satisfies LayerData }],
    });
    this.outlet = new DomPortalOutlet(this.doc.body, this.appRef, injector);
    const ref = this.outlet.attach(new ComponentPortal(DsMenuLayer, null, injector));
    ref.changeDetectorRef.detectChanges();
    const layer = ref.instance;
    this.layer = layer;
    const menu = layer.menu().nativeElement;
    const wrapper = layer.wrapper().nativeElement;
    menu.setAttribute('style', CONTENT_STYLE);
    this.element = menu;

    const zIndex = getComputedStyle(menu).zIndex;
    writePopper(wrapper, null, zIndex === 'auto' ? '' : zIndex);
    const anchor = this.anchor();
    const place = () => {
      if (!anchor) return;
      const dir = this.themeService.value().dir === 'rtl' ? 'rtl' : 'ltr';
      const o = this.placement(dir);
      // The size variables change the menu's size, so place again until it holds still.
      let last = '';
      for (let i = 0; i < 3; i += 1) {
        const r = computePopper(anchor, wrapper, { ...o, rtl: dir === 'rtl' });
        writePopper(wrapper, r, zIndex === 'auto' ? '' : zIndex);
        layer.side.set(r.side);
        layer.align.set(r.align);
        this.onPlaced(r.side, r.align);
        const key = JSON.stringify(r);
        if (key === last) break;
        last = key;
      }
      ref.changeDetectorRef.detectChanges();
    };
    this.undo = [autoPlace(anchor ?? wrapper, wrapper, place), ...this.listen(menu)];
    if (this.root.modal() && !this.part) this.undo.push(hideOthers(ref.location.nativeElement as Element));
    this.opened(menu);
  }

  private unmountAfterExit(): void {
    const layer = this.layer;
    if (!layer) return;
    this.closed();
    const generation = this.generation;
    layer.closing.set(true);
    afterNextRender(
      () => {
        void animationsDone([layer.menu().nativeElement]).then(() => {
          if (generation === this.generation && this.layer === layer) this.dispose();
        });
      },
      { injector: this.injector },
    );
  }

  private dispose(): void {
    if (!this.layer) return;
    for (const fn of this.undo.reverse()) fn();
    this.undo = [];
    // detach, not dispose: DomPortalOutlet.dispose removes its outlet element, here document.body.
    this.outlet?.detach();
    this.outlet = null;
    this.layer = null;
    this.element = null;
    this.tabStop.set(null);
    clearTimeout(this.searchTimer);
    this.search = '';
  }
}

// ------------------------------------------------------------------ dsDropdownMenuContent

/**
 * The menu: an ng-template with the labels, items, groups, separators and
 * submenus. While open it renders in a portal at the end of body, inside a
 * theme that copies every axis of the theme it is declared in, as the root
 * `data-ds="dropdown-menu"`, role menu, named by the trigger. It never grows
 * past the viewport: a long menu scrolls inside.
 */
@Directive({
  selector: 'ng-template[dsDropdownMenuContent]',
  exportAs: 'dsDropdownMenuContent',
  providers: [{ provide: DS_MENU_PANEL, useExisting: forwardRef(() => DsDropdownMenuContent) }],
})
export class DsDropdownMenuContent extends MenuPanelHost {
  /** Where the menu opens. Default block-end (below the trigger). It flips when there is no room. */
  readonly side = input<DropdownMenuSide>('block-end');
  /** How it lines up with the trigger. Default start. */
  readonly align = input<DropdownMenuAlign>('start');
  /** Gap to the trigger in px. Default 4. */
  readonly sideOffset = input<number>(TRIGGER_GAP);
  /** Space kept from the viewport edge in px. Default 8. */
  readonly collisionPadding = input<number>(VIEWPORT_GUTTER);

  readonly root = injectMenu('dsDropdownMenuContent');
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
  readonly isOpen = this.root.isOpen;
  readonly id = this.root.contentId;
  get labelledBy(): string {
    return this.root.triggerId;
  }
  readonly part = null;

  constructor() {
    super();
    this.watch();
  }

  protected anchor(): HTMLElement | null {
    return this.root.trigger;
  }

  protected placement(dir: 'ltr' | 'rtl') {
    return {
      side: physicalSide(this.side(), dir),
      align: this.align(),
      sideOffset: this.sideOffset(),
      alignOffset: 0,
      padding: this.collisionPadding(),
    };
  }

  protected override onPlaced(side: PopperSide, align: PopperAlign): void {
    this.root.placed.set({ side, align });
  }

  protected opened(menu: HTMLElement): void {
    this.root.interactedOutside = false;
    menu.focus({ preventScroll: true });
    if (this.root.focusLast) {
      this.root.focusLast = false;
      this.items().at(-1)?.focus({ preventScroll: true });
    } else if (usingKeyboard) {
      // Radix's entry focus: a keyboard open lands on the first item.
      focusFirst(this.items(), this.doc);
    }
  }

  protected closed(): void {
    this.root.placed.set(null);
    const trigger = this.root.trigger;
    const outside = this.root.interactedOutside;
    this.root.interactedOutside = false;
    const active = this.doc.activeElement;
    // Back to the trigger, unless the close came from a click or focus elsewhere.
    if (!outside && trigger?.isConnected && (active === this.doc.body || !active || this.contains(active))) trigger.focus();
  }

  protected listen(): (() => void)[] {
    const doc = this.doc;
    const outside = (target: EventTarget | null) => {
      const node = target instanceof Node ? target : null;
      return !!node && !this.contains(node) && !this.root.trigger?.contains(node);
    };
    const pointerdown = (event: PointerEvent) => {
      if (!outside(event.target) || !this.isOpen()) return;
      this.root.interactedOutside = true;
      this.closeAll();
    };
    const focusin = (event: FocusEvent) => {
      if (!outside(event.target) || !this.isOpen()) return;
      this.root.interactedOutside = true;
      this.closeAll();
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !this.isOpen() || event.defaultPrevented) return;
      event.preventDefault();
      this.closeAll();
    };
    // Registered after this event loop turn, so the press that opened the menu does not close it.
    const timer = setTimeout(() => doc.addEventListener('pointerdown', pointerdown));
    doc.addEventListener('focusin', focusin);
    doc.addEventListener('keydown', keydown, { capture: true });
    return [
      () => clearTimeout(timer),
      () => doc.removeEventListener('pointerdown', pointerdown),
      () => doc.removeEventListener('focusin', focusin),
      () => doc.removeEventListener('keydown', keydown, { capture: true }),
    ];
  }
}

// ------------------------------------------------------------------ submenus

/** A submenu: a dsDropdownMenuSubTrigger and an ng-template dsDropdownMenuSubContent. Put it on an ng-container. */
@Directive({ selector: '[dsDropdownMenuSub]', exportAs: 'dsDropdownMenuSub' })
export class DsDropdownMenuSub {
  /** Open. Two way with `[(open)]`. */
  readonly open = model<boolean | undefined>(undefined);
  /** Open at first. Default false. */
  readonly defaultOpen = input(false, { transform: booleanAttribute });

  readonly parent = injectPanel('dsDropdownMenuSub');
  readonly isOpen = linkedSignal(() => this.open() ?? this.defaultOpen());
  /** The sub trigger's id: its own id attribute when it has one. */
  triggerId = newId('sub-trigger');
  readonly contentId = newId('sub-content');
  trigger: HTMLElement | null = null;
  openTimer: ReturnType<typeof setTimeout> | undefined;
  /** Where the submenu is placed, for the sub trigger's data-radix-popper-* attributes. */
  readonly placed = signal<{ side: PopperSide; align: PopperAlign } | null>(null);

  constructor() {
    consumeHostAttributes(['dsDropdownMenuSub', 'open', 'defaultOpen']);
    // A submenu closes with its parent.
    effect(() => {
      if (!this.parent.isOpen()) untracked(() => this.setOpen(false));
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.openTimer));
  }

  setOpen(open: boolean): void {
    clearTimeout(this.openTimer);
    this.openTimer = undefined;
    if (this.isOpen() === open) return;
    this.isOpen.set(open);
    this.open.set(open);
  }
}

/**
 * The nested menu: an ng-template. A root of its own
 * (`data-ds="dropdown-menu"`) carrying the part name sub-content, in its own
 * themed layer. It opens toward the inline end of its trigger and flips
 * when there is no room.
 */
@Directive({
  selector: 'ng-template[dsDropdownMenuSubContent]',
  exportAs: 'dsDropdownMenuSubContent',
  providers: [{ provide: DS_MENU_PANEL, useExisting: forwardRef(() => DsDropdownMenuSubContent) }],
})
export class DsDropdownMenuSubContent extends MenuPanelHost {
  /** Gap to the sub trigger in px. Default 0. */
  readonly sideOffset = input<number>(0);
  /** Shift along the trigger, px. Default -5: the first item lines up with the trigger. */
  readonly alignOffset = input<number>(-(TRIGGER_GAP + 1));
  /** Space kept from the viewport edge in px. Default 8. */
  readonly collisionPadding = input<number>(VIEWPORT_GUTTER);

  private readonly sub = (() => {
    const sub = inject(DsDropdownMenuSub, { optional: true });
    if (!sub) throw new Error('dsDropdownMenuSubContent must be used inside a dsDropdownMenuSub.');
    return sub;
  })();
  readonly root = injectMenu('dsDropdownMenuSubContent');
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
  readonly isOpen = this.sub.isOpen;
  readonly id = this.sub.contentId;
  get labelledBy(): string {
    return this.sub.triggerId;
  }
  readonly part = 'sub-content';
  private readonly parentPanel = this.sub.parent;

  constructor() {
    super();
    this.watch();
  }

  protected anchor(): HTMLElement | null {
    return this.sub.trigger;
  }

  protected placement(dir: 'ltr' | 'rtl') {
    return {
      side: (dir === 'rtl' ? 'left' : 'right') as PopperSide,
      align: 'start' as PopperAlign,
      sideOffset: this.sideOffset(),
      alignOffset: this.alignOffset(),
      padding: this.collisionPadding(),
    };
  }

  protected override onPlaced(side: PopperSide, align: PopperAlign): void {
    this.sub.placed.set({ side, align });
  }

  protected opened(menu: HTMLElement): void {
    this.parentPanel.children.add(this);
    if (usingKeyboard) {
      menu.focus({ preventScroll: true });
      focusFirst(this.items(), this.doc);
    }
  }

  protected closed(): void {
    this.sub.placed.set(null);
    this.parentPanel.children.delete(this);
  }

  protected listen(menu: HTMLElement): (() => void)[] {
    const doc = this.doc;
    // Focus that moves out of the submenu, and not to its trigger, closes it.
    const focusin = (event: FocusEvent) => {
      const node = event.target instanceof Node ? event.target : null;
      if (!node || this.contains(node) || node === this.sub.trigger) return;
      this.sub.setOpen(false);
    };
    // ArrowLeft (ArrowRight in rtl) closes it and returns to the trigger.
    const keydown = (event: KeyboardEvent) => {
      const closeKey = this.themeService.value().dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
      if (event.key !== closeKey || !menu.contains(event.target as Node)) return;
      this.sub.setOpen(false);
      this.sub.trigger?.focus();
      event.preventDefault();
    };
    doc.addEventListener('focusin', focusin);
    menu.addEventListener('keydown', keydown);
    return [() => doc.removeEventListener('focusin', focusin), () => menu.removeEventListener('keydown', keydown)];
  }
}

// ------------------------------------------------------------------ items

/** The item behavior every item kind shares: roles, roving tab stop, highlight, pointer, select. */
@Directive({
  host: {
    'data-orientation': 'vertical',
    'data-radix-collection-item': '',
    '[attr.tabindex]': 'panel.tabStop() === host ? 0 : -1',
    '[attr.data-highlighted]': 'highlighted() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '(focus)': 'onFocus()',
    '(blur)': 'highlighted.set(false)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerleave)': 'onPointerLeave($event)',
    '(mousedown)': 'onMouseDown($event)',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeyDown($event)',
  },
})
export abstract class MenuItemBase {
  /** Leading content: a system icon name or a template. Decorative: the text names the item. */
  readonly start = input<DropdownMenuSlotContent | undefined>(undefined);
  /** Trailing content: a system icon name or a template. Decorative. */
  readonly end = input<DropdownMenuSlotContent | undefined>(undefined);
  /** A key hint at the inline end, plain text (for example "Ctrl+D"). It does not bind the key. */
  readonly shortcut = input<string | undefined>(undefined);
  /** Skipped by the arrow keys and on select, announced with aria-disabled. Default false. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The text typeahead matches. Default the visible text. */
  readonly textValue = input<string | undefined>(undefined);
  /**
   * Runs on click, Enter and Space, before the menu closes. Call
   * `event.preventDefault()` to keep the menu open.
   */
  readonly select = output<Event>();

  protected readonly panel = injectPanel('A dropdown menu item');
  readonly host = consumeHostAttributes(['start', 'end', 'shortcut', 'disabled', 'textValue']);
  readonly highlighted = signal(false);
  protected readonly isIconName = isIconName;

  constructor() {
    textValues.set(this.host, () => this.textValue());
  }

  protected onFocus(): void {
    this.highlighted.set(true);
    this.panel.tabStop.set(this.host);
  }

  protected onMouseDown(event: MouseEvent): void {
    if (this.disabled()) event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || event.defaultPrevented) return;
    if (this.disabled()) {
      this.panel.onItemLeave();
      return;
    }
    if (this.host.ownerDocument.activeElement !== this.host) this.host.focus({ preventScroll: true });
  }

  protected onPointerLeave(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    this.pointerLeft();
    if (this.keepsHighlightOnLeave()) return;
    this.panel.onItemLeave();
  }

  protected pointerLeft(): void {}

  /** A sub trigger with its submenu open keeps the highlight. */
  protected keepsHighlightOnLeave(): boolean {
    return false;
  }

  protected onClick(event: MouseEvent): void {
    if (this.disabled()) return;
    this.activate(event);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    this.panel.onItemKeyDown(event, this.host);
    if (event.defaultPrevented || this.disabled() || event.target !== this.host) return;
    if (this.panel.search !== '' && event.key === ' ') return;
    if (SELECTION_KEYS.includes(event.key)) {
      this.host.click();
      event.preventDefault();
    }
  }

  /** Runs the select: the item's own change first, then the event, then the close. */
  protected activate(_event: MouseEvent): void {
    this.beforeSelect();
    const event = new CustomEvent('menu.itemSelect', { bubbles: true, cancelable: true });
    this.select.emit(event);
    if (!event.defaultPrevented) this.panel.closeAll();
  }

  protected beforeSelect(): void {}
}

const ITEM_TEMPLATE = `
  <ng-template #slot let-content>
    @if (isIconName(content)) {
      <svg dsIcon [name]="content" size="md"></svg>
    } @else {
      <ng-container [ngTemplateOutlet]="content" />
    }
  </ng-template>
  @if (start(); as content) {
    <span data-part="start" aria-hidden="true"><ng-container [ngTemplateOutlet]="slot" [ngTemplateOutletContext]="{ $implicit: content }" /></span>
  }
  <span data-part="text"><ng-content /></span>
  @if (shortcut() !== undefined) {
    <span data-part="shortcut" dir="ltr">{{ shortcut() }}</span>
  }
  @if (end(); as content) {
    <span data-part="end" aria-hidden="true"><ng-container [ngTemplateOutlet]="slot" [ngTemplateOutletContext]="{ $implicit: content }" /></span>
  }
`;

/**
 * An action. `select` runs on click, Enter and Space, then the menu closes
 * (call `event.preventDefault()` to keep it open). `disabled` keeps it in
 * the menu with aria-disabled and skips it.
 */
@Component({
  selector: '[dsDropdownMenuItem]',
  exportAs: 'dsDropdownMenuItem',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'menuitem',
    'data-part': 'item',
    '[attr.data-tone]': 'tone() === "danger" ? "danger" : null',
  },
  template: ITEM_TEMPLATE,
})
export class DsDropdownMenuItem extends MenuItemBase {
  /** danger: a destructive action, drawn in the danger text color. Default neutral. */
  readonly tone = input<DropdownMenuItemTone>('neutral');

  constructor() {
    super();
    consumeHostAttributes(['dsDropdownMenuItem', 'tone']);
  }
}

/**
 * An option that is on or off (role menuitemcheckbox). The check icon shows
 * the state, never color alone; `checked="indeterminate"` shows a minus.
 * `onCheckedChange` is the `checkedChange` output of `[(checked)]`.
 */
@Component({
  selector: '[dsDropdownMenuCheckboxItem]',
  exportAs: 'dsDropdownMenuCheckboxItem',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'menuitemcheckbox',
    'data-part': 'checkbox-item',
    '[attr.aria-checked]': 'state() === "indeterminate" ? "mixed" : state() === "checked" ? "true" : "false"',
    '[attr.data-state]': 'state()',
  },
  template: `
    <span data-part="indicator" aria-hidden="true">
      @if (state() !== 'unchecked') {
        <span [attr.data-state]="state()"><svg dsIcon [name]="state() === 'indeterminate' ? 'minus' : 'check'" size="md"></svg></span>
      }
    </span>
    ${ITEM_TEMPLATE}
  `,
})
export class DsDropdownMenuCheckboxItem extends MenuItemBase {
  /** Checked. Two way with `[(checked)]`. Default false. */
  readonly checked = model<DropdownMenuChecked>(false);

  protected readonly state = computed(() => {
    const c = this.checked();
    return c === 'indeterminate' ? 'indeterminate' : c ? 'checked' : 'unchecked';
  });

  constructor() {
    super();
    consumeHostAttributes(['dsDropdownMenuCheckboxItem', 'checked']);
  }

  protected override beforeSelect(): void {
    const c = this.checked();
    this.checked.set(c === 'indeterminate' ? true : !c);
  }
}

/** A set of radio items where one is chosen (role group). `onValueChange` is the `valueChange` output of `[(value)]`. */
@Directive({
  selector: '[dsDropdownMenuRadioGroup]',
  exportAs: 'dsDropdownMenuRadioGroup',
  host: { role: 'group', 'data-part': 'group' },
})
export class DsDropdownMenuRadioGroup {
  /** The chosen value. Two way with `[(value)]`. */
  readonly value = model<string | undefined>(undefined);

  constructor() {
    consumeHostAttributes(['dsDropdownMenuRadioGroup', 'value']);
  }
}

/** One choice in a dsDropdownMenuRadioGroup (role menuitemradio). The chosen one carries the check icon. */
@Component({
  selector: '[dsDropdownMenuRadioItem]',
  exportAs: 'dsDropdownMenuRadioItem',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'menuitemradio',
    'data-part': 'radio-item',
    '[attr.aria-checked]': 'isChecked() ? "true" : "false"',
    '[attr.data-state]': 'isChecked() ? "checked" : "unchecked"',
  },
  template: `
    <span data-part="indicator" aria-hidden="true">
      @if (isChecked()) {
        <span data-state="checked"><svg dsIcon name="check" size="md"></svg></span>
      }
    </span>
    ${ITEM_TEMPLATE}
  `,
})
export class DsDropdownMenuRadioItem extends MenuItemBase {
  /** The value this choice sets on its group. */
  readonly value = input.required<string>();

  private readonly group = (() => {
    const group = inject(DsDropdownMenuRadioGroup, { optional: true });
    if (!group) throw new Error('dsDropdownMenuRadioItem must be used inside a dsDropdownMenuRadioGroup.');
    return group;
  })();
  protected readonly isChecked = computed(() => this.group.value() === this.value());

  constructor() {
    super();
    consumeHostAttributes(['dsDropdownMenuRadioItem', 'value']);
  }

  protected override beforeSelect(): void {
    this.group.value.set(this.value());
  }
}

/**
 * The item that opens a submenu. ArrowRight opens it (ArrowLeft in rtl), as
 * do Enter, Space and the pointer. The chevron at the inline end points
 * toward the submenu and mirrors in rtl.
 */
@Component({
  selector: '[dsDropdownMenuSubTrigger]',
  exportAs: 'dsDropdownMenuSubTrigger',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'menuitem',
    'data-part': 'sub-trigger',
    'aria-haspopup': 'menu',
    '[id]': 'sub.triggerId',
    '[attr.aria-expanded]': 'sub.isOpen() ? "true" : "false"',
    '[attr.aria-controls]': 'sub.isOpen() ? sub.contentId : null',
    '[attr.data-state]': 'sub.isOpen() ? "open" : "closed"',
    '[attr.data-radix-popper-side]': 'sub.placed()?.side ?? null',
    '[attr.data-radix-popper-align]': 'sub.placed()?.align ?? null',
  },
  template: ITEM_TEMPLATE,
})
export class DsDropdownMenuSubTrigger extends MenuItemBase {
  protected readonly sub = (() => {
    const sub = inject(DsDropdownMenuSub, { optional: true });
    if (!sub) throw new Error('dsDropdownMenuSubTrigger must be used inside a dsDropdownMenuSub.');
    return sub;
  })();
  private readonly dir = inject(Directionality);

  constructor() {
    super();
    consumeHostAttributes(['dsDropdownMenuSubTrigger']);
    if (this.host.id) this.sub.triggerId = this.host.id;
    this.sub.trigger = this.host;
    inject(DestroyRef).onDestroy(() => {
      if (this.sub.trigger === this.host) this.sub.trigger = null;
    });
  }

  // The chevron is fixed: end is not an input of a sub trigger in React.
  override readonly end = input<DropdownMenuSlotContent | undefined>('chevron-forward');

  protected override keepsHighlightOnLeave(): boolean {
    return this.sub.isOpen();
  }

  protected override pointerLeft(): void {
    clearTimeout(this.sub.openTimer);
    this.sub.openTimer = undefined;
  }

  protected override onPointerMove(event: PointerEvent): void {
    super.onPointerMove(event);
    if (event.pointerType !== 'mouse' || this.disabled() || this.sub.isOpen() || this.sub.openTimer) return;
    this.sub.openTimer = setTimeout(() => this.sub.setOpen(true), 100);
  }

  protected override onClick(event: MouseEvent): void {
    if (this.disabled() || event.defaultPrevented) return;
    this.host.focus();
    if (!this.sub.isOpen()) this.sub.setOpen(true);
  }

  protected override onKeyDown(event: KeyboardEvent): void {
    this.panel.onItemKeyDown(event, this.host);
    if (event.defaultPrevented || this.disabled() || event.target !== this.host) return;
    if (this.panel.search !== '' && event.key === ' ') return;
    const openKey = this.dir.value === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    if ([...SELECTION_KEYS, openKey].includes(event.key)) {
      this.sub.setOpen(true);
      event.preventDefault();
    }
  }
}

// ------------------------------------------------------------------ label, group, separator

/** A short heading over the items that follow. Not focusable, skipped by the arrow keys. */
@Directive({ selector: '[dsDropdownMenuLabel]', host: { 'data-part': 'label' } })
export class DsDropdownMenuLabel {
  constructor() {
    consumeHostAttributes(['dsDropdownMenuLabel']);
  }
}

/** Groups related items (role group). */
@Directive({ selector: '[dsDropdownMenuGroup]', host: { role: 'group', 'data-part': 'group' } })
export class DsDropdownMenuGroup {
  constructor() {
    consumeHostAttributes(['dsDropdownMenuGroup']);
  }
}

/** A line between groups of items (role separator). */
@Directive({
  selector: '[dsDropdownMenuSeparator]',
  host: { role: 'separator', 'aria-orientation': 'horizontal', 'data-part': 'separator' },
})
export class DsDropdownMenuSeparator {
  constructor() {
    consumeHostAttributes(['dsDropdownMenuSeparator']);
  }
}

/** Everything a template needs for a dropdown menu. */
export const DS_DROPDOWN_MENU = [
  DsDropdownMenu,
  DsDropdownMenuTrigger,
  DsDropdownMenuContent,
  DsDropdownMenuItem,
  DsDropdownMenuCheckboxItem,
  DsDropdownMenuRadioGroup,
  DsDropdownMenuRadioItem,
  DsDropdownMenuLabel,
  DsDropdownMenuGroup,
  DsDropdownMenuSeparator,
  DsDropdownMenuSub,
  DsDropdownMenuSubTrigger,
  DsDropdownMenuSubContent,
] as const;
