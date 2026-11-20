// TabBar: the bottom bar of three to five destinations on phone layouts. The
// twin of packages/react/src/components/TabBar/TabBar.tsx: the same DOM, so
// the same CSS draws it.
//
//   <nav dsTabBar aria-label="Main" size="lg" [accessory]="player">
//     <a dsTabBarItem href="#home" icon="home" label="Home" active></a>
//     <a dsTabBarItem routerLink="/inbox" icon="inbox" label="Inbox" [badge]="3"></a>
//     <ng-container dsTabBarSearch label="Search" href="#search" [active]="searching" [field]="searchField" />
//   </nav>
//   <ng-template #searchField let-label>
//     <div dsSearchField shape="pill" [aria-label]="label" placeholder="Songs, artists and lists"></div>
//   </ng-template>
//
// The DOM:
//
//   <nav data-ds="tab-bar" aria-label data-size data-placement? data-compact?>
//     <div data-part="accessory">                          `accessory`, first child (order C2)
//     <a data-part="item" href aria-current="page"? data-active?>
//       <span data-part="item-icon">                       a system icon, decorative
//         <span data-part="item-badge">                    a count or a dot
//       <span data-part="item-label">
//       <span data-part="item-status">                     the badge words, in the link name
//     <a data-part="search" href aria-current="page"?>     the search item, last child (order M9.9)
//     <div data-part="search" data-expanded data-active>   the same item while it is its field
//
// Names that differ from React, by frameworks.md:
// - TabBarItem is the anchor itself, `a[dsTabBarItem]`; a router link is the
//   same element with the router directive on it, so `asChild` has no form.
// - `accessory` takes a TemplateRef. The bar renders it in its part
//   accessory: first, or in the compact bar just before the search item.
//   React keys the accessory so it moves when compact changes; Angular
//   renders the template again in its new place, so state held inside the
//   accessory's own elements starts over when compact changes.
// - TabBarSearch changes its element (a link, then a div holding the
//   field), so it cannot be a directive on its host element. It is a
//   directive on `ng-container` that holds the inputs; the bar draws the
//   item last, after the projected items, as React requires it last. It
//   takes `href` (no router directive can sit on an element the bar draws)
//   and the `select` output, React's onSelect, for a router that navigates
//   by hand. `field` is a TemplateRef; its context's $implicit is the
//   label, so the field can take it as its aria-label. A field that names
//   nothing gets the label on its text box after render, as React clones
//   it in.
//
// Placement (order DU7): `placement` is auto, bottom or side, inherited
// from the nearest PageShell (DS_BAR_PLACEMENT) when not set. It stamps
// data-placement only when not auto. The DOM never changes with it.
//
// Keys, as React: every item stays a tab stop. The arrow keys move along the
// bar as it is drawn: Left and Right in a row (flipped in right to left), Up
// and Down in a column; Home and End go to the first and last item; the
// arrows wrap. The axis comes from the placement, and for auto from where
// the items are at the key press. The accessory's content keeps its own keys.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DsIcon } from '@the-system/icons/angular';
import type { IconName } from '@the-system/icons';
import type { Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { trackPressed } from '../../internal/pressed';
import { trackPressOrigin } from '../../internal/press-origin';
import { injectInheritedPlacement, placementAttr, resolvePlacement, type BarPlacement } from '../../internal/placement';
import { DsThemeService } from '../../theme/theme';

/** Where the bar sits: CSS decides (auto), always at the bottom, or always in a column at the inline end. */
export type TabBarPlacement = BarPlacement;

/** md: a 48px bar (icon 16px). lg: a 56px bar with 24px icons and 44px targets, for touch layouts. */
export type TabBarSize = Extract<Size, 'md' | 'lg'>;

/** The words a badge adds to the link name. */
export const tabBarBadgeWords = { en: { count: 'new', dot: 'New' }, ar: { count: 'جديد', dot: 'جديد' } } as const;

/** What a focusable element in the search field is. */
const FOCUSABLE = 'input, textarea, select, button, a[href], [tabindex]:not([tabindex="-1"])';

/**
 * The items of this bar, not of a bar nested inside it: every item (only
 * the current one in the compact bar), and the search item while it is a
 * link. The accessory's own content is left out.
 */
export function tabBarItemsOf(bar: HTMLElement): HTMLElement[] {
  const item = bar.hasAttribute('data-compact') ? '[data-part="item"][data-active]' : '[data-part="item"]';
  return Array.from(bar.querySelectorAll<HTMLElement>(`${item}, [data-part="search"]:not([data-expanded])`)).filter((el) => {
    if (el.closest('[data-ds="tab-bar"]') !== bar) return false;
    const accessory = el.closest('[data-part="accessory"]');
    return accessory === null || !bar.contains(accessory);
  });
}

/** The axis the bar is drawn on: from the placement, and for auto from where the first two items are now. */
function axisOf(items: HTMLElement[], placement: BarPlacement): 'row' | 'column' {
  if (placement === 'side') return 'column';
  if (placement === 'bottom' || items.length < 2) return 'row';
  const a = items[0]!.getBoundingClientRect();
  const b = items[1]!.getBoundingClientRect();
  return Math.abs(b.top - a.top) > Math.abs(b.left - a.left) ? 'column' : 'row';
}

/**
 * The search destination of the bar, drawn last by the bar: a link with the
 * part search, or, while `active` with a `field`, a div holding the field.
 * Put it on an `ng-container` inside the `nav[dsTabBar]`.
 */
@Directive({ selector: 'ng-container[dsTabBarSearch], ng-template[dsTabBarSearch]', exportAs: 'dsTabBarSearch' })
export class DsTabBarSearch {
  /** The name of the destination: Search (Arabic: بحث). The link name, and the visible label on web and android. */
  readonly label = input.required<string>();
  /** A system icon name, decorative. Default search. */
  readonly icon = input<IconName>('search');
  /** The current destination: aria-current="page" and data-active. Default false. */
  readonly active = input(false, { transform: booleanAttribute });
  /** The link target. Without it the item is a focusable link that only emits `select`. */
  readonly href = input<string | undefined>(undefined);
  /**
   * A SearchField the item turns into while it is active (data-expanded).
   * The template's $implicit is the label, its accessible name.
   */
  readonly field = input<TemplateRef<{ $implicit: string }> | undefined>(undefined);
  /** A caller's own aria-current, kept while the item is not active. */
  readonly ariaCurrent = input<string | undefined>(undefined, { alias: 'aria-current' });
  /** A caller's own aria-disabled: no press mark while true. */
  readonly ariaDisabled = input<string | boolean | undefined>(undefined, { alias: 'aria-disabled' });
  /** Emits on a press of the item, before the link is followed; call preventDefault to stay. React's onSelect. */
  readonly select = output<MouseEvent>();

  /** True while the item turns into its field. */
  readonly expanded = computed(() => this.active() && this.field() !== undefined);
}

/** One destination of the bar: an icon over a label, with an optional badge. */
@Component({
  selector: 'a[dsTabBarItem]',
  exportAs: 'dsTabBarItem',
  imports: [DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-part': 'item',
    '[attr.data-active]': 'active() ? "" : null',
    '[attr.aria-current]': 'active() ? "page" : (ariaCurrent() ?? null)',
  },
  template: `
    <span data-part="item-icon">
      <svg dsIcon [name]="icon()" [size]="iconSize()"></svg>
      @if (showBadge()) {
        <span data-part="item-badge" [attr.data-dot]="count() === null ? '' : null" dir="ltr" aria-hidden="true">{{ count() }}</span>
      }
    </span>
    <span data-part="item-label">{{ label() }}</span>
    @if (showBadge()) {
      <span data-part="item-status">{{ status() }}</span>
    }
  `,
})
export class DsTabBarItem {
  /** The visible label, a short noun: Home, Search, Inbox. Always shown. */
  readonly label = input.required<string>();
  /** A system icon name, decorative: the label names the link. */
  readonly icon = input.required<IconName>();
  /** The current destination: aria-current="page" and data-active. Default false. */
  readonly active = input(false, { transform: booleanAttribute });
  /** A count (Western digits, 99+ past 99) or true for a dot. */
  readonly badge = input<number | boolean | undefined>(undefined);
  /** The words the badge adds to the link name. Default "new" after a count, "New" for a dot (Arabic: "جديد"). */
  readonly badgeLabel = input<string | undefined>(undefined);
  /** A caller's own aria-current, kept while the item is not active. */
  readonly ariaCurrent = input<string | undefined>(undefined, { alias: 'aria-current' });

  private readonly bar = inject(DsTabBar, { optional: true });
  private readonly theme = inject(DsThemeService);
  private readonly host = consumeHostAttributes(['dsTabBarItem', 'label', 'icon', 'active', 'badge', 'badgeLabel']);

  protected readonly iconSize = computed(() => (this.bar?.size() === 'lg' ? 'lg' : 'md'));
  protected readonly showBadge = computed(() => {
    const b = this.badge();
    return b !== undefined && b !== false && b !== 0;
  });
  protected readonly count = computed(() => {
    const b = this.badge();
    return typeof b === 'number' ? (b > 99 ? '99+' : String(b)) : null;
  });
  protected readonly status = computed(() => {
    const ar = this.theme.value().lang === 'ar';
    const w = tabBarBadgeWords[ar ? 'ar' : 'en'];
    const comma = ar ? '،' : ',';
    const count = this.count();
    return count !== null ? `${comma} ${count} ${this.badgeLabel() ?? w.count}` : `${comma} ${this.badgeLabel() ?? w.dot}`;
  });

  constructor() {
    const destroy = inject(DestroyRef);
    destroy.onDestroy(trackPressOrigin(this.host, 'tab-bar'));
    destroy.onDestroy(trackPressed(this.host, () => this.host.getAttribute('aria-disabled') === 'true'));
  }
}

/** The bottom navigation of a phone layout: a nav landmark with a name (aria-label or aria-labelledby). */
@Component({
  selector: 'nav[dsTabBar]',
  exportAs: 'dsTabBar',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'tab-bar',
    '[attr.data-size]': 'size()',
    '[attr.data-placement]': 'placementValue()',
    '[attr.data-compact]': 'compact() ? "" : null',
  },
  template: `
    @if (accessory() && !compact()) {
      <div data-part="accessory"><ng-container [ngTemplateOutlet]="accessory()!" /></div>
    }
    <ng-content />
    @if (accessory() && compact()) {
      <div data-part="accessory"><ng-container [ngTemplateOutlet]="accessory()!" /></div>
    }
    @if (search(); as s) {
      @if (s.expanded()) {
        <div
          #searchBox
          data-part="search"
          data-expanded=""
          data-active=""
          (focusin)="here = true"
          (focusout)="onSearchBlur($event)"
        >
          <ng-container [ngTemplateOutlet]="s.field()!" [ngTemplateOutletContext]="{ $implicit: s.label() }" />
        </div>
      } @else {
        <a
          #searchLink
          data-part="search"
          [attr.href]="s.href() ?? null"
          [attr.role]="s.href() === undefined ? 'link' : null"
          [attr.tabindex]="s.href() === undefined ? 0 : null"
          [attr.data-active]="s.active() ? '' : null"
          [attr.aria-current]="s.active() ? 'page' : (s.ariaCurrent() ?? null)"
          [attr.aria-disabled]="s.ariaDisabled() ?? null"
          (focus)="here = true"
          (blur)="onSearchBlur($event)"
          (click)="onSearchClick($event, s)"
          (keydown)="onSearchKey($event, s)"
        >
          <span data-part="item-icon"><svg dsIcon [name]="s.icon()" [size]="size() === 'lg' ? 'lg' : 'md'"></svg></span>
          <span data-part="item-label">{{ s.label() }}</span>
        </a>
      }
    }
  `,
})
export class DsTabBar {
  /** Default md. lg gives 44px targets for touch layouts. */
  readonly size = input<TabBarSize>('md');
  /**
   * Where the bar sits. auto: CSS decides from the PageShell's size. bottom:
   * always a row at the bottom. side: always a column at the inline end.
   * Default: the nearest PageShell's placement, else auto. Stamps
   * data-placement only when not auto.
   */
  readonly placement = input<TabBarPlacement | undefined>(undefined);
  /** Content that belongs to the bar but is not a destination, such as a mini player. Drawn in the part accessory. */
  readonly accessory = input<TemplateRef<unknown> | undefined>(undefined);
  /** The compact bar of a pushed or scrolled screen: the current item, the accessory and the search item. Default false. */
  readonly compact = input(false, { transform: booleanAttribute });

  protected readonly search = contentChild(DsTabBarSearch);
  private readonly searchLink = viewChild<ElementRef<HTMLAnchorElement>>('searchLink');
  private readonly searchBox = viewChild<ElementRef<HTMLDivElement>>('searchBox');

  private readonly inherited = injectInheritedPlacement();
  private readonly host = consumeHostAttributes(['dsTabBar', 'size', 'placement', 'accessory', 'compact']);
  private readonly injector = inject(Injector);

  /** The placement in use: its own, else the PageShell's, else auto. */
  readonly resolvedPlacement = computed(() => resolvePlacement(this.placement(), this.inherited));
  protected readonly placementValue = computed(() => placementAttr(this.resolvedPlacement()));

  /**
   * True while the search item or its field holds focus, or after a press on
   * it: the person is at the search item, so focus follows when it changes form.
   */
  protected here = false;

  constructor() {
    const destroy = inject(DestroyRef);
    // The bar's keys listen from after the first render, so a caller's own
    // (keydown) on the nav, added when the element is made, runs first and
    // can handle a key, as React's onKeyDown does before the bar's move.
    const onKey = (event: KeyboardEvent) => this.onKeyDown(event);
    afterNextRender(() => this.host.addEventListener('keydown', onKey));
    destroy.onDestroy(() => this.host.removeEventListener('keydown', onKey));
    let releaseLink: (() => void) | null = null;
    // The search link's press point and press mark, as an item's.
    effect(() => {
      const link = this.searchLink()?.nativeElement;
      releaseLink?.();
      releaseLink = null;
      if (!link) return;
      const offOrigin = trackPressOrigin(link, 'tab-bar');
      const offPressed = trackPressed(link, () => link.getAttribute('aria-disabled') === 'true');
      releaseLink = () => {
        offOrigin();
        offPressed();
      };
    });
    destroy.onDestroy(() => releaseLink?.());

    // Focus follows the search item when it changes form, so focus is never dropped (WCAG 2.4.3).
    let was: boolean | undefined;
    effect(() => {
      const expanded = this.search()?.expanded() ?? false;
      const previous = was;
      was = expanded;
      afterNextRender(
        () => {
          // Inputs of the search item are set by now; the effect may run before a binding of a projected item is.
          if (expanded) this.nameField(untracked(() => this.search()?.label() ?? ''));
          if (previous === undefined || previous === expanded || !untracked(() => this.here)) return;
          const doc = this.host.ownerDocument;
          const now = doc.activeElement;
          const box = this.searchBox()?.nativeElement;
          const link = this.searchLink()?.nativeElement;
          // Leave focus alone when it already moved somewhere real.
          if (now && now !== doc.body && now.isConnected && !(box?.contains(now) || link === now)) return;
          if (expanded) box?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
          else link?.focus();
        },
        { injector: this.injector },
      );
    });
  }

  /** A field that names nothing takes the label, as React clones it in. */
  private nameField(label: string): void {
    const field = this.searchBox()?.nativeElement.querySelector<HTMLElement>('input, textarea');
    if (!field || field.hasAttribute('aria-label') || field.hasAttribute('aria-labelledby')) return;
    field.setAttribute('aria-label', label);
  }

  protected onSearchBlur(event: FocusEvent): void {
    // Focus that moves to another element ends the stay; focus that is dropped (the element left the page) keeps it.
    const to = event.relatedTarget as Node | null;
    const current = event.currentTarget as HTMLElement;
    if (to && !current.contains(to)) this.here = false;
  }

  protected onSearchClick(event: MouseEvent, s: DsTabBarSearch): void {
    this.here = true;
    s.select.emit(event);
    if (s.href() === undefined) event.preventDefault();
  }

  protected onSearchKey(event: KeyboardEvent, s: DsTabBarSearch): void {
    // With no href an anchor does nothing on Enter: give it the press.
    if (s.href() === undefined && !event.defaultPrevented && event.key === 'Enter') (event.currentTarget as HTMLElement).click();
  }

  /** Arrow keys along the bar's axis, Home and End; every item stays a tab stop. */
  private onKeyDown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const bar = this.host;
    const items = tabBarItemsOf(bar);
    const from = items.indexOf(event.target as HTMLElement);
    if (from < 0) return;
    const last = items.length - 1;
    let to: number | null = null;
    if (event.key === 'Home') to = 0;
    else if (event.key === 'End') to = last;
    else {
      const axis = axisOf(items, this.resolvedPlacement());
      const rtl = bar.closest('[dir]')?.getAttribute('dir') === 'rtl';
      const steps: Record<string, number> =
        axis === 'column' ? { ArrowDown: 1, ArrowUp: -1 } : { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 };
      const step = steps[event.key];
      if (step !== undefined) to = (from + step + items.length) % items.length;
    }
    if (to === null) return;
    event.preventDefault();
    items[to]!.focus();
  }
}
