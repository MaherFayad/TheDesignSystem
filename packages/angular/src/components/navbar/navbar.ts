// Navbar: the top bar of a site or app. A brand, primary links and menus
// with panels, actions at the end, and a menu button on phones. The twin of
// packages/react/src/components/Navbar/Navbar.tsx, on the same DOM, so
// Navbar.css and the platform files apply as they are.
//
//   <nav dsNavbar label="Main" [items]="items" [brand]="brand" [end]="end" placement="auto"></nav>
//   <nav dsNavbar label="Songs" [items]="[]" [back]="{ label: 'Library', href: '#library' }" heading="Songs"></nav>
//
// The DOM, as React with Radix NavigationMenu:
//
//   <nav data-ds="navbar" aria-label data-orientation="horizontal" dir data-size data-sticky? data-placement?
//        data-collapsed? data-inline-title?>
//     <div data-part="start">                     back and start actions (order C2)
//       <button|a data-ds="icon-button" data-part="back">
//     <div data-part="brand">
//     <div style="position: relative">           Radix's indicator track
//       <ul data-part="list" data-orientation dir>
//         <li data-part="item">
//           <a data-part="link" data-active? aria-current?>
//           <button data-ds="button" data-part="trigger" data-state aria-expanded>   a ghost Button, the chevron its end part
//           <span aria-hidden tabindex="0">  <span aria-owns>     while its panel is open: Radix's focus proxy
//       <div data-part="indicator">               while a panel is open
//     <div data-part="viewport" data-state>       while a panel is open
//       <div data-part="content" aria-labelledby>
//         <ul data-part="content-list"><li><a data-part="link"> link-label, link-description
//     <div data-part="end">
//     <button data-ds="icon-button" data-part="menu-button">   opens the phone list, a Drawer from the start
//     <h1 data-part="heading">                    the large title (order C2)
//
// Behavior follows Radix NavigationMenu, written here by hand on our own
// elements (the CDK has no navigation menu): a press on a trigger toggles
// its panel, a mouse over it opens the panel after 200ms (at once within
// 300ms of a close), leaving the trigger and the panel closes it after
// 150ms, ArrowDown on an open trigger moves into the panel, Escape closes it
// back to the trigger, the arrow keys, Home and End move between the items
// of the bar in the reading direction, and Tab from an open trigger goes
// through the panel by the focus proxy. A press outside closes the panel.
//
// The phone list (under breakpoint.tablet) is the Angular Drawer, from the
// inline start, root part mobile, holding the Sidebar's DOM with collapsible
// false: Angular has no Sidebar yet, so the Navbar draws the expanded form of
// its markup (nav data-ds sidebar, body, groups, lists and items) itself.
//
// Large title collapse (order K1), two line title (order C5) and placement
// (order DU1, DU7) follow React: data-collapsed from main's scroll on ios in
// a PageShell header, the heading's height on the shell as
// --_navbar-heading-size, data-inline-title from the heading's text,
// data-placement only when not auto, inherited from the nearest PageShell.
//
// Names that differ from React, by frameworks.md: node props (`brand`,
// `start`, `end`, `heading`) take a TemplateRef (`heading` also a string);
// `linkAs` has no Angular form (a router link directive goes on an `a` the
// app renders in its own templates); NavbarBack's onClick is a function in
// the object, as React's.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  TemplateRef,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { IconName } from '@the-system/icons';
import { DsIcon } from '@the-system/icons/angular';
import type { Size } from '@the-system/shared';
import { createTrack, inFrame, planFollow, planInk, prefersReducedMotion } from '@the-system/motion';
import { consumeHostAttributes } from '../../internal/host';
import { injectHoverFollow } from '../../internal/indicator';
import { injectMotion } from '../../internal/motion';
import { injectInheritedPlacement, placementAttr, resolvePlacement, type BarPlacement } from '../../internal/placement';
import { VISUALLY_HIDDEN } from '../../internal/visually-hidden';
import { DsThemeService } from '../../theme';
import { DsButton } from '../button/button';
import { DS_DRAWER } from '../drawer/drawer';
import { DsIconButton } from '../icon-button/icon-button';

export type NavbarPlacement = BarPlacement;
export type NavbarSize = Extract<Size, 'md' | 'lg'>;

/** One link in the bar, or in a panel. */
export interface NavbarLink {
  /** Visible text, a noun: "Pricing", "Docs". */
  label: string;
  href: string;
  /** One line under the label, in a panel only. */
  description?: string;
  /** The current page. */
  active?: boolean;
  /** A leading icon in the phone list. */
  start?: IconName;
}

/** A menu: a trigger in the bar that opens a panel of links. */
export interface NavbarMenu {
  label: string;
  links: NavbarLink[];
}

export type NavbarItem = NavbarLink | NavbarMenu;

/** The back control of a pushed screen: an IconButton with the chevron-back glyph. */
export interface NavbarBack {
  /** The accessible name, after where it goes: Library. Arabic: المكتبة. Required. */
  label: string;
  /** The page it goes back to. With href the button is a link; without, a button that calls onClick. */
  href?: string;
  /** Called on a press, before a link is followed. */
  onClick?: (event: MouseEvent) => void;
}

/** The built in words, the same strings as React. */
export const navbarLabels = {
  en: { button: 'Menu', panel: 'Site menu' },
  ar: { button: 'القائمة', panel: 'قائمة الموقع' },
} as const;

/** The links of the bar itself, not those in a panel. */
const BAR_LINK = '[data-part="list"] > [data-part="item"] > [data-part="link"]';
/** The heading's measured height, written on the PageShell root for ios.css (order C5). */
const HEADING_SIZE = '--_navbar-heading-size';
/** breakpoint.tablet */
const WIDE_QUERY = '(min-width: 48rem)';
const ARROW_KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'];

const isMenu = (item: NavbarItem): item is NavbarMenu => 'links' in item;

/** Plain links run together into one unnamed group; each menu becomes a named group. */
function groupsOf(items: readonly NavbarItem[]): { label?: string; links: NavbarLink[] }[] {
  const groups: { label?: string; links: NavbarLink[] }[] = [];
  for (const item of items) {
    if (isMenu(item)) groups.push({ label: item.label, links: item.links });
    else {
      const last = groups.at(-1);
      if (last && last.label === undefined) last.links.push(item);
      else groups.push({ links: [item] });
    }
  }
  return groups;
}

/** True where the heading follows the scroll in CSS (ios.css): scroll timelines exist and motion is not reduced. */
function titleFollowsScroll(): boolean {
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('animation-timeline: scroll()') && !prefersReducedMotion();
}

/** Tab stops of a scope, as Radix's getTabbableCandidates. */
function candidates(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('*')).filter((node) => {
    const el = node as HTMLElement & { disabled?: boolean };
    if (el.disabled || el.hidden || (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'hidden')) return false;
    return el.tabIndex >= 0;
  });
}

/** Focuses the first that takes focus, as Radix's focusFirst. */
function focusFirst(list: HTMLElement[]): boolean {
  const doc = list[0]?.ownerDocument;
  const before = doc?.activeElement;
  return list.some((c) => {
    if (c === before) return true;
    c.focus();
    return doc?.activeElement !== before;
  });
}

let nextId = 0;

@Component({
  selector: 'nav[dsNavbar]',
  exportAs: 'dsNavbar',
  imports: [NgTemplateOutlet, DsButton, DsIcon, DsIconButton, DS_DRAWER],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-label]': 'label()',
    'data-orientation': 'horizontal',
    '[attr.dir]': 'dir()',
    'data-ds': 'navbar',
    '[attr.data-size]': 'size()',
    '[attr.data-sticky]': 'sticky() ? "" : null',
    '[attr.data-placement]': 'placementValue()',
    '[attr.data-collapsed]': 'collapsed() ? "" : null',
    '[attr.data-inline-title]': 'inlineTitle() || null',
  },
  template: `
    @if (back() !== undefined || start() !== undefined) {
      <div data-part="start">
        @if (back(); as b) {
          @if (b.href !== undefined) {
            <a dsIconButton data-part="back" icon="chevron-back" [label]="b.label" [size]="controlSize()" [href]="b.href" (click)="b.onClick?.($event)"></a>
          } @else {
            <button dsIconButton data-part="back" icon="chevron-back" [label]="b.label" [size]="controlSize()" (click)="b.onClick?.($event)"></button>
          }
        }
        @if (start(); as s) {
          <ng-container [ngTemplateOutlet]="s" />
        }
      </div>
    }
    @if (brand(); as b) {
      <div data-part="brand"><ng-container [ngTemplateOutlet]="b" /></div>
    }
    <div style="position: relative;">
      <ul #list data-orientation="horizontal" [attr.dir]="dir()" data-part="list">
        @for (item of items(); track $index; let i = $index) {
          <li data-part="item">
            @if (isMenu(item)) {
              @let open = value() === key(i);
              <button dsButton [id]="triggerId(i)" data-part="trigger" emphasis="ghost" [size]="controlSize()" [end]="chevron"
                [attr.data-active]="hasActive(item) ? '' : null" [attr.data-state]="open ? 'open' : 'closed'"
                [attr.aria-expanded]="open ? 'true' : 'false'" [attr.aria-controls]="open ? contentId(i) : null" data-radix-collection-item=""
                (pointerenter)="wasClickClose = false; wasEscapeClose = false" (pointermove)="onTriggerMove($event, i)"
                (pointerleave)="onTriggerLeave($event)" (click)="onTriggerClick(i)" (keydown)="onTriggerKeydown($event, i)">{{ item.label }}</button>
              @if (open) {
                <span aria-hidden="true" tabindex="0" [attr.style]="visuallyHidden" (focus)="onProxyFocus($event, i)"></span>
                <span [attr.aria-owns]="contentId(i)"></span>
              }
            } @else {
              <a [attr.href]="item.href" [attr.data-active]="item.active ? '' : null" [attr.aria-current]="item.active ? 'page' : null"
                data-part="link" data-radix-collection-item="" (keydown)="onGroupKeydown($event)" (click)="onLinkClick($event)">{{ item.label }}</a>
            }
          </li>
        }
      </ul>
      @if (indicator(); as at) {
        <div aria-hidden="true" [attr.data-state]="value() ? 'visible' : 'hidden'" data-orientation="horizontal" data-part="indicator"
          [attr.style]="'position: absolute; left: 0px; width: ' + at.size + 'px; transform: translateX(' + at.offset + 'px); --radix-navigation-menu-indicator-translate-x: ' + at.offset + 'px;'"></div>
      }
    </div>
    @if (shown() !== null) {
      <div #viewport [attr.data-state]="value() ? 'open' : 'closed'" data-orientation="horizontal" data-part="viewport" [attr.style]="viewportStyle()"
        (pointerenter)="clearClose()" (pointerleave)="onContentLeave($event)">
        @if (shownMenu(); as m) {
          <div #content [id]="contentId(m.index)" [attr.aria-labelledby]="triggerId(m.index)" [attr.data-motion]="motionAttr()" data-orientation="horizontal"
            [attr.data-state]="value() === key(m.index) ? 'open' : 'closed'" data-part="content" [attr.dir]="dir()" (keydown)="onContentKeydown($event, m.index)">
            <ul data-part="content-list">
              @for (link of m.menu.links; track $index) {
                <li>
                  <a [attr.href]="link.href" [attr.data-active]="link.active ? '' : null" [attr.aria-current]="link.active ? 'page' : null"
                    data-part="link" data-radix-collection-item="" (keydown)="onGroupKeydown($event)" (click)="onLinkClick($event)">
                    <span data-part="link-label">{{ link.label }}</span>
                    @if (link.description) {
                      <span data-part="link-description">{{ link.description }}</span>
                    }
                  </a>
                </li>
              }
            </ul>
          </div>
        }
      </div>
    }
    @if (end(); as e) {
      <div data-part="end"><ng-container [ngTemplateOutlet]="e" /></div>
    }
    @if (items().length > 0) {
      <ng-container dsDrawer [open]="mobileOpen()" (openChange)="mobileOpen.set($event)" side="start" size="sm">
        <button dsIconButton dsDrawerTrigger data-part="menu-button" icon="menu" [size]="controlSize()" [label]="words().button"></button>
        <ng-template dsDrawerContent [title]="words().panel" rootPart="mobile">
          <div dsDrawerBody>
            <nav [attr.aria-label]="words().panel" data-ds="sidebar" data-size="md" data-state="expanded">
              <div data-part="body">
                @for (group of groups(); track $index; let g = $index) {
                  <div data-part="group">
                    @if (group.label) {
                      <div data-part="group-label" [id]="groupId(g)">{{ group.label }}</div>
                    }
                    <ul data-part="list" [attr.aria-labelledby]="group.label ? groupId(g) : null">
                      @for (link of group.links; track $index) {
                        <li>
                          <a [attr.href]="link.href" data-part="item" [attr.data-active]="link.active ? '' : null" [attr.aria-current]="link.active ? 'page' : null"
                            (click)="mobileOpen.set(false)">
                            @if (link.start) {
                              <span data-part="item-icon" aria-hidden="true"><svg dsIcon [name]="link.start" size="md"></svg></span>
                            }
                            <span data-part="item-label">{{ link.label }}</span>
                          </a>
                        </li>
                      }
                    </ul>
                  </div>
                }
              </div>
            </nav>
          </div>
          @if (end(); as e) {
            <div dsDrawerFooter><ng-container [ngTemplateOutlet]="e" /></div>
          }
        </ng-template>
      </ng-container>
    }
    @if (hasHeading()) {
      <h1 #headingEl data-part="heading">
        @if (headingTemplate(); as t) {
          <ng-container [ngTemplateOutlet]="t" />
        } @else {
          {{ heading() }}
        }
      </h1>
    }
    <ng-template #chevron><svg dsIcon name="chevron-down" size="sm"></svg></ng-template>
  `,
})
export class DsNavbar {
  /** The accessible name of the nav landmark ("Main"). Required. */
  readonly label = input.required<string>();
  /** Bar height and type: md 48px, lg 60px at default density. Default md. */
  readonly size = input<NavbarSize>('md');
  /** The brand: a logo link to the home page. */
  readonly brand = input<TemplateRef<unknown> | undefined>(undefined);
  /** The primary links and menus. */
  readonly items = input.required<readonly NavbarItem[]>();
  /** Actions at the inline end. An attached ButtonGroup of IconButtons is one capsule of bar buttons. */
  readonly end = input<TemplateRef<unknown> | undefined>(undefined);
  /** Actions at the inline start of the button row, after the back button. They stay in the bar on phones. */
  readonly start = input<TemplateRef<unknown> | undefined>(undefined);
  /** The back control of a pushed screen (part back). Its glyph mirrors in right to left. Default none. */
  readonly back = input<NavbarBack | undefined>(undefined);
  /** The page's title as its h1, on a row of its own under the buttons (part heading): text or a template. Default none. */
  readonly heading = input<string | TemplateRef<unknown> | undefined>(undefined);
  /** Keeps the bar at the top of the scrolling page and reserves scroll padding. Sets data-sticky. Default false. */
  readonly sticky = input(false, { transform: booleanAttribute });
  /** The label of a menu whose panel is open at first render. Default none. */
  readonly defaultOpenMenu = input<string | undefined>(undefined);
  /** The menu button's name and the phone list's name. Default "Menu" and "Site menu", in Arabic too. */
  readonly menuLabels = input<{ button: string; panel: string } | undefined>(undefined);
  /** Where the actions sit on a phone shell: auto, bottom or side. Default: the nearest PageShell's, else auto. */
  readonly placement = input<NavbarPlacement | undefined>(undefined);

  private readonly theme = inject(DsThemeService);
  private readonly host = consumeHostAttributes([
    'dsNavbar', 'label', 'size', 'brand', 'items', 'end', 'start', 'back', 'heading', 'sticky', 'defaultOpenMenu', 'menuLabels', 'placement',
  ]);
  private readonly inherited = injectInheritedPlacement();
  private readonly motion = injectMotion();
  private readonly base = `ds-navbar-${++nextId}`;

  protected readonly visuallyHidden = VISUALLY_HIDDEN;
  protected readonly isMenu = isMenu;
  protected readonly dir = computed(() => this.theme.value().dir);
  protected readonly words = computed(() => this.menuLabels() ?? (this.theme.value().lang === 'ar' ? navbarLabels.ar : navbarLabels.en));
  protected readonly controlSize = computed(() => (this.size() === 'lg' ? 'lg' : 'md'));
  protected readonly placementValue = computed(() => placementAttr(resolvePlacement(this.placement(), this.inherited)));
  protected readonly groups = computed(() => groupsOf(this.items()));
  protected readonly hasHeading = computed(() => {
    const h = this.heading();
    return h !== undefined && h !== null && h !== '';
  });
  protected readonly headingTemplate = computed(() => {
    const h = this.heading();
    return h instanceof TemplateRef ? h : null;
  });
  private readonly headingText = signal('');
  /** The text of the inline title: the heading itself when it is text, else the heading element's text, read after render. */
  protected readonly inlineTitle = computed(() => {
    if (!this.hasHeading()) return '';
    const h = this.heading();
    return (typeof h === 'string' ? h : this.headingText()).trim();
  });
  protected readonly collapsed = signal(false);
  protected readonly mobileOpen = signal(false);

  private readonly headingRef = viewChild<ElementRef<HTMLElement>>('headingEl');
  private readonly listRef = viewChild.required<ElementRef<HTMLElement>>('list');
  private readonly viewportRef = viewChild<ElementRef<HTMLElement>>('viewport');
  private readonly contentRef = viewChild<ElementRef<HTMLElement>>('content');

  // ---------------------------------------------------------------- the menu state, as Radix NavigationMenu
  /** The open menu's key, '' when none. */
  protected readonly value = signal('');
  /** The menu the viewport shows: the open one, else the one leaving. */
  protected readonly shown = signal<string | null>(null);
  protected readonly shownMenu = computed(() => {
    const key = this.shown();
    if (key === null) return null;
    const index = Number(key.slice('item-'.length));
    const item = this.items()[index];
    return item && isMenu(item) ? { index, menu: item } : null;
  });
  protected readonly motionAttr = signal<string | null>(null);
  protected readonly viewportSize = signal<{ width: number; height: number } | null>(null);
  protected readonly viewportStyle = computed(() => {
    const s = this.viewportSize();
    const parts: string[] = [];
    if (!this.value()) parts.push('pointer-events: none');
    if (s) parts.push(`--radix-navigation-menu-viewport-width: ${s.width}px`, `--radix-navigation-menu-viewport-height: ${s.height}px`);
    return parts.length ? parts.join('; ') + ';' : null;
  });
  protected readonly indicator = signal<{ size: number; offset: number } | null>(null);
  private openTimer = 0;
  private closeTimer = 0;
  private skipTimer = 0;
  private openDelayed = true;
  private moveOpened = new Set<number>();
  protected wasClickClose = false;
  protected wasEscapeClose = false;
  private readonly track = createTrack();

  constructor() {
    const view = this.host.ownerDocument.defaultView;
    const destroy = inject(DestroyRef);
    // The menu open at first render.
    afterNextRender(() => {
      const label = this.defaultOpenMenu();
      if (label === undefined) return;
      const index = this.items().findIndex((item) => item.label === label);
      if (index >= 0) this.setValue(this.key(index));
    });
    // The viewport keeps the menu that leaves until its exit has played.
    effect(() => {
      const value = this.value();
      untracked(() => {
        if (value) {
          this.shown.set(value);
          return;
        }
        if (this.shown() === null) return;
        afterNextRender(() => void this.exitDone(), { injector: this.injectorRef });
      });
    });
    // The viewport size and the indicator: measured after each render while a panel shows.
    afterRenderEffect(() => {
      this.value();
      this.shown();
      const content = this.contentRef()?.nativeElement;
      const next = content ? { width: content.offsetWidth, height: content.offsetHeight } : null;
      const prev = untracked(this.viewportSize);
      if (next && (!prev || prev.width !== next.width || prev.height !== next.height)) this.viewportSize.set(next);
      const value = this.value();
      const trigger = value ? this.host.ownerDocument.getElementById(this.triggerId(Number(value.slice(5)))) : null;
      const at = trigger ? { size: trigger.offsetWidth, offset: trigger.offsetLeft } : untracked(this.indicator);
      const was = untracked(this.indicator);
      if (!value && this.shown() === null) {
        if (was) this.indicator.set(null);
      } else if (at && (!was || was.size !== at.size || was.offset !== at.offset)) this.indicator.set(at);
    });
    // The inline title from a heading template's text.
    afterRenderEffect(() => {
      this.heading();
      const text = this.headingRef()?.nativeElement.textContent?.trim() ?? '';
      if (untracked(this.headingText) !== text) this.headingText.set(text);
    });
    // nav-current-slide: the bar under the current link slides from the link that was current.
    afterRenderEffect(() => {
      this.items();
      this.followCurrent();
    });
    injectHoverFollow(this.host, { item: BAR_LINK, pseudo: '::after', mode: () => this.motion.mode('nav-hover-follow') });
    // A press outside the bar and the panel closes the panel.
    const down = (event: PointerEvent) => {
      if (!this.value()) return;
      const target = event.target as Node | null;
      if (target && this.host.contains(target)) return;
      this.dismiss();
    };
    this.host.ownerDocument.addEventListener('pointerdown', down, true);
    // Close the phone list when the window grows past the breakpoint and the bar shows again.
    const query = view && typeof view.matchMedia === 'function' ? view.matchMedia(WIDE_QUERY) : null;
    const onWide = () => {
      if (!query?.matches || !this.mobileOpen()) return;
      this.mobileOpen.set(false);
      // The button is hidden now, so focus goes to the first item of the bar once the list has left.
      setTimeout(() => this.listRef().nativeElement.querySelector<HTMLElement>('a, button')?.focus(), 0);
    };
    query?.addEventListener?.('change', onWide);
    // The large title collapse (order K1) and the heading height (order C5).
    let stopCollapse: (() => void) | null = null;
    afterNextRender(() => {
      effect(
        () => {
          const active = this.hasHeading() && this.theme.value().platform === 'ios';
          stopCollapse?.();
          stopCollapse = untracked(() => this.watchCollapse(active));
        },
        { injector: this.injectorRef },
      );
    });
    destroy.onDestroy(() => {
      this.host.ownerDocument.removeEventListener('pointerdown', down, true);
      query?.removeEventListener?.('change', onWide);
      stopCollapse?.();
      clearTimeout(this.openTimer);
      clearTimeout(this.closeTimer);
      clearTimeout(this.skipTimer);
    });
  }

  private readonly injectorRef = inject(Injector);

  protected key(index: number): string {
    return `item-${index}`;
  }

  protected triggerId(index: number): string {
    return `${this.base}-trigger-item-${index}`;
  }

  protected contentId(index: number): string {
    return `${this.base}-content-item-${index}`;
  }

  protected groupId(index: number): string {
    return `${this.base}-group-${index}`;
  }

  protected hasActive(menu: NavbarMenu): boolean {
    return menu.links.some((l) => l.active);
  }

  // ---------------------------------------------------------------- open and close

  private setValue(next: string): void {
    const prev = this.value();
    if (prev === next) return;
    this.motionAttr.set(this.motionFor(next, prev));
    clearTimeout(this.skipTimer);
    if (next) this.openDelayed = false;
    else this.skipTimer = window.setTimeout(() => (this.openDelayed = true), 300);
    this.value.set(next);
  }

  /** data-motion of the content, as Radix: from-start or from-end when a panel replaces another. */
  private motionFor(next: string, prev: string): string | null {
    if (!next || !prev) return null;
    const keys = this.items().map((_, i) => this.key(i));
    if (this.dir() === 'rtl') keys.reverse();
    return keys.indexOf(next) > keys.indexOf(prev) ? 'from-end' : 'from-start';
  }

  private async exitDone(): Promise<void> {
    const viewport = this.viewportRef()?.nativeElement;
    const running = viewport && typeof viewport.getAnimations === 'function' ? viewport.getAnimations({ subtree: true }) : [];
    await Promise.all(running.map((a) => a.finished.catch(() => undefined)));
    if (!this.value()) {
      this.shown.set(null);
      this.viewportSize.set(null);
    }
  }

  protected clearClose(): void {
    clearTimeout(this.closeTimer);
  }

  private startClose(): void {
    clearTimeout(this.closeTimer);
    this.closeTimer = window.setTimeout(() => this.setValue(''), 150);
  }

  protected onTriggerMove(event: PointerEvent, index: number): void {
    if (event.pointerType !== 'mouse') return;
    if (this.wasClickClose || this.wasEscapeClose || this.moveOpened.has(index)) return;
    this.moveOpened.add(index);
    clearTimeout(this.openTimer);
    const key = this.key(index);
    if (!this.openDelayed) {
      clearTimeout(this.closeTimer);
      this.setValue(key);
      return;
    }
    if (this.value() === key) {
      clearTimeout(this.closeTimer);
      return;
    }
    this.openTimer = window.setTimeout(() => {
      clearTimeout(this.closeTimer);
      this.setValue(key);
    }, 200);
  }

  protected onTriggerLeave(event: PointerEvent): void {
    this.moveOpened.clear();
    if (event.pointerType !== 'mouse') return;
    clearTimeout(this.openTimer);
    this.startClose();
  }

  protected onContentLeave(event: PointerEvent): void {
    if (event.pointerType === 'mouse') this.startClose();
  }

  protected onTriggerClick(index: number): void {
    const key = this.key(index);
    const open = this.value() === key;
    this.setValue(open ? '' : key);
    this.wasClickClose = open;
  }

  protected onTriggerKeydown(event: KeyboardEvent, index: number): void {
    if (this.value() === this.key(index) && event.key === 'ArrowDown') {
      this.enterContent('start');
      event.preventDefault();
      return;
    }
    this.onGroupKeydown(event);
  }

  /** The focus proxy after an open trigger: Tab from the trigger enters the panel, Shift Tab from past it enters at its end. */
  protected onProxyFocus(event: FocusEvent, index: number): void {
    const content = this.contentRef()?.nativeElement;
    const from = event.relatedTarget as Node | null;
    const trigger = this.host.ownerDocument.getElementById(this.triggerId(index));
    const fromTrigger = from === trigger;
    if (fromTrigger || !content?.contains(from)) this.enterContent(fromTrigger ? 'start' : 'end');
  }

  private enterContent(side: 'start' | 'end'): void {
    const content = this.contentRef()?.nativeElement;
    if (!content) return;
    const list = candidates(content);
    if (list.length) focusFirst(side === 'start' ? list : list.reverse());
  }

  /** Tab inside the panel: to the next stop, else past the trigger by the focus proxy. Escape: back to the trigger. */
  protected onContentKeydown(event: KeyboardEvent, index: number): void {
    const content = event.currentTarget as HTMLElement;
    if (event.key === 'Escape') {
      this.wasEscapeClose = true;
      event.preventDefault();
      this.dismiss();
      return;
    }
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
    const list = candidates(content);
    const at = list.indexOf(content.ownerDocument.activeElement as HTMLElement);
    const next = event.shiftKey ? list.slice(0, at).reverse() : list.slice(at + 1);
    if (focusFirst(next)) {
      event.preventDefault();
      return;
    }
    // Out of the panel: to the proxy after the trigger, which hands focus on to the next stop of the page.
    const proxy = this.host.ownerDocument.getElementById(this.triggerId(index))?.nextElementSibling as HTMLElement | null;
    if (event.shiftKey) {
      event.preventDefault();
      this.host.ownerDocument.getElementById(this.triggerId(index))?.focus();
    } else proxy?.focus();
  }

  /** Escape on the bar, or a link followed in a panel: the panel closes, and focus inside it goes back to its trigger. */
  private dismiss(): void {
    const value = this.value();
    if (!value) return;
    const content = this.contentRef()?.nativeElement;
    const inside = content?.contains(this.host.ownerDocument.activeElement) ?? false;
    this.setValue('');
    if (inside) this.host.ownerDocument.getElementById(this.triggerId(Number(value.slice(5))))?.focus();
  }

  protected onLinkClick(event: MouseEvent): void {
    if (!event.metaKey) this.dismiss();
  }

  /** The arrow keys, Home and End move between the items of the bar (or of the panel) in the reading direction. */
  protected onGroupKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.value()) {
      this.wasEscapeClose = true;
      event.preventDefault();
      const key = this.value();
      this.setValue('');
      this.host.ownerDocument.getElementById(this.triggerId(Number(key.slice(5))))?.focus();
      return;
    }
    if (!['Home', 'End', ...ARROW_KEYS].includes(event.key)) return;
    const current = event.currentTarget as HTMLElement;
    const group = current.closest('[data-part="content"]') ?? this.listRef().nativeElement;
    let nodes = Array.from(group.querySelectorAll<HTMLElement>('[data-radix-collection-item]')).filter(
      (el) => (el.closest('[data-part="content"]') ?? this.listRef().nativeElement) === group,
    );
    const prevKey = this.dir() === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    if ([prevKey, 'ArrowUp', 'End'].includes(event.key)) nodes.reverse();
    if (ARROW_KEYS.includes(event.key)) nodes = nodes.slice(nodes.indexOf(current) + 1);
    setTimeout(() => focusFirst(nodes));
    event.preventDefault();
  }

  // ---------------------------------------------------------------- motion: nav-current-slide

  private followCurrent(): void {
    const mode = this.motion.mode('nav-current-slide');
    const root = this.host;
    inFrame(() => {
      const current = root.querySelectorAll<HTMLElement>(`${BAR_LINK}[data-active]`);
      if (!root.isConnected || current.length !== 1) {
        this.track.key = null;
        return;
      }
      const link = current[0] as HTMLElement;
      const left = this.track.el;
      const plan = planFollow(this.track, link.getAttribute('href') ?? '', { el: link, pseudo: '::before' }, { mode, anchor: root, axis: 'x' });
      const ink = plan.slide
        ? planInk({
            switch: '--_navbar-ink',
            slide: plan.slide,
            to: plan.to,
            anchor: root,
            parts: Array.from(root.querySelectorAll(BAR_LINK)),
            reaching: [link],
            restFrom: left !== link ? left : null,
            inkFrom: link,
            axis: 'x',
          })
        : null;
      return () => {
        const slide = plan.write();
        ink?.(slide);
      };
    });
  }

  // ---------------------------------------------------------------- large title collapse (order K1, C5)

  /**
   * Active only on ios, with a heading, in the header of a PageShell whose
   * main is the scroller. Reads main's scroll offset once per frame while it
   * scrolls. Returns the stop.
   */
  private watchCollapse(active: boolean): () => void {
    const root = this.host;
    const shell = active ? root.closest<HTMLElement>('[data-ds="page-shell"]') : null;
    const header = root.closest('[data-part="header"]');
    const main = shell?.querySelector<HTMLElement>(':scope > [data-part="main"]');
    if (!shell || !main || !header || header.parentElement !== shell) {
      this.collapsed.set(false);
      return () => undefined;
    }
    const view = root.ownerDocument.defaultView;
    let frame = 0;
    const raf = (cb: () => void) => (view && typeof view.requestAnimationFrame === 'function' ? view.requestAnimationFrame(cb) : window.setTimeout(cb, 16));
    const read = () => {
      frame = 0;
      const title = this.headingRef()?.nativeElement;
      // Where the title follows the scroll it is gone once main has scrolled its height; elsewhere at the first pixel.
      const at = titleFollowsScroll() && title ? Math.max(1, title.offsetHeight) : 1;
      const next = main.scrollTop >= at;
      if (this.collapsed() !== next) this.collapsed.set(next);
    };
    const onScroll = () => {
      if (frame === 0) frame = raf(read);
    };
    const size = () => {
      const title = this.headingRef()?.nativeElement;
      if (!title) return;
      const next = `${title.offsetHeight}px`;
      if (shell.style.getPropertyValue(HEADING_SIZE) !== next) shell.style.setProperty(HEADING_SIZE, next);
      read();
    };
    size();
    const heading = this.headingRef()?.nativeElement;
    const observer = view && typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(size) : null;
    if (observer && heading) observer.observe(heading);
    else view?.addEventListener('resize', size);
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      main.removeEventListener('scroll', onScroll);
      observer?.disconnect();
      view?.removeEventListener('resize', size);
      shell.style.removeProperty(HEADING_SIZE);
      if (frame !== 0) {
        if (view && typeof view.cancelAnimationFrame === 'function') view.cancelAnimationFrame(frame);
        else clearTimeout(frame);
      }
      this.collapsed.set(false);
    };
  }
}
