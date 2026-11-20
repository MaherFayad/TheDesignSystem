// PageShell: the frame of a page. A skip link, a header, the navigation
// column, the main content, an aside and a footer, each in its landmark.
// The twin of packages/react/src/components/PageShell/PageShell.tsx, on the
// same DOM, so PageShell.css and ios-shell.css apply as they are.
//
//   <div dsPageShell [header]="header" [nav]="nav" [footer]="footer" placement="auto">
//     <ng-template #header><strong>Northwind studio</strong></ng-template>
//     <ng-template #nav><nav aria-label="Main">...</nav></ng-template>
//     <ng-template #footer>Northwind studio, 2026</ng-template>
//     <h1>Boards</h1>                                    the main content
//   </div>
//
// The DOM, as React:
//
//   <div data-ds="page-shell" data-sidebar data-placement?>
//     <a data-ds="skip-link" data-part="skip" href="#main">     the first tab stop
//     <header data-part="header">                              banner
//       <button data-ds="icon-button" data-part="menu">        opens the navigation Drawer; only while the column is hidden
//     <div data-part="nav">                                    holds the navigation, itself the nav landmark
//     <main data-part="main" id="main" tabindex="-1">          the one main, the skip target
//     <aside data-part="aside" aria-label>                     complementary
//     <footer data-part="footer">                              contentinfo
//
// Names that differ from React, by frameworks.md:
// - Node props (`header`, `nav`, `aside`, `footer`) take a TemplateRef.
//   Declare them inside the shell element: DI follows declaration, so a bar
//   declared there takes the shell's placement (DS_BAR_PLACEMENT).
// - `sidebar` is a model: `[(sidebar)]` is React's sidebar with
//   onSidebarChange. React's usePageShell() is the shell itself:
//   inject(DsPageShell) or a template reference, with `shownSidebar` (the
//   context's sidebar, hidden on narrow screens), `sidebar` (the state for
//   wide screens), `setSidebar`, `narrow` and `setDrawerOpen`.
// - The narrow check is the CDK BreakpointObserver on breakpoint.tablet,
//   read after the first render, as React's effect.
//
// Placement (order DU1, DU7): `placement` is auto, bottom or side. It
// stamps data-placement only when not auto and provides DS_BAR_PLACEMENT,
// which every TabBar inside reads when it has no placement of its own. A
// nested shell provides its own, so a parent's placement never passes
// through it. The DOM order never changes with placement.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { consumeHostAttributes } from '../../internal/host';
import { DS_BAR_PLACEMENT, placementAttr, type BarPlacement } from '../../internal/placement';
import { DsThemeService } from '../../theme/theme';
import { DsDrawer, DsDrawerBody, DsDrawerContent } from '../drawer/drawer';
import { DsIconButton } from '../icon-button/icon-button';
import { DsSkipLink } from '../skip-link/skip-link';

/** The navigation column: drawn full, drawn as icons, or not drawn (reached through the menu button). */
export type PageShellSidebar = 'expanded' | 'collapsed' | 'hidden';
/** Where the bars of a phone shell sit. */
export type PageShellPlacement = BarPlacement;

/** The built in words. Arabic: Gulf MSA noun forms. */
export const pageShellWords = {
  en: {
    skip: 'Skip to main content',
    menu: 'Open navigation',
    drawer: 'Navigation',
    main: 'Main content',
    aside: 'More on this page',
  },
  ar: {
    skip: 'الانتقال للمحتوى الرئيسي',
    menu: 'فتح التنقل',
    drawer: 'التنقل',
    main: 'المحتوى الرئيسي',
    aside: 'تفاصيل إضافية',
  },
} as const;

/** The query for breakpoint.tablet. Media queries cannot read custom properties. */
const NARROW_QUERY = '(width < 48rem)'; // breakpoint.tablet

/** The frame of a page, with its landmarks and a skip link first. */
@Component({
  selector: 'div[dsPageShell]',
  exportAs: 'dsPageShell',
  imports: [NgTemplateOutlet, DsSkipLink, DsIconButton, DsDrawer, DsDrawerContent, DsDrawerBody],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: DS_BAR_PLACEMENT, useFactory: () => inject(DsPageShell).placement }],
  host: {
    'data-ds': 'page-shell',
    '[attr.data-sidebar]': 'shownSidebar()',
    '[attr.data-placement]': 'placementValue()',
  },
  template: `
    <a dsSkipLink data-part="skip" [href]="'#' + mainId()">{{ skipLabel() ?? words().skip }}</a>
    @if (header() || (nav() && shownSidebar() === 'hidden')) {
      @if (embedded()) {
        <div data-part="header"><ng-container [ngTemplateOutlet]="headerBody" /></div>
      } @else {
        <header data-part="header"><ng-container [ngTemplateOutlet]="headerBody" /></header>
      }
    }
    @if (nav(); as navTemplate) {
      <!-- The column is not drawn while hidden: its links are in the Drawer then, never twice in the page. -->
      <div data-part="nav" [attr.hidden]="shownSidebar() === 'hidden' ? '' : null">
        @if (shownSidebar() !== 'hidden') {
          <ng-container [ngTemplateOutlet]="navTemplate" />
        }
      </div>
    }
    @if (embedded()) {
      <div data-part="main" [id]="mainId()" tabindex="-1" role="region" [attr.aria-label]="words().main">
        <ng-container [ngTemplateOutlet]="mainBody" />
      </div>
    } @else {
      <main data-part="main" [id]="mainId()" tabindex="-1"><ng-container [ngTemplateOutlet]="mainBody" /></main>
    }
    @if (aside(); as asideTemplate) {
      @if (embedded()) {
        <div data-part="aside" [attr.aria-label]="asideLabel() ?? words().aside" role="group">
          <ng-container [ngTemplateOutlet]="asideTemplate" />
        </div>
      } @else {
        <aside data-part="aside" [attr.aria-label]="asideLabel() ?? words().aside"><ng-container [ngTemplateOutlet]="asideTemplate" /></aside>
      }
    }
    @if (footer(); as footerTemplate) {
      @if (embedded()) {
        <div data-part="footer"><ng-container [ngTemplateOutlet]="footerTemplate" /></div>
      } @else {
        <footer data-part="footer"><ng-container [ngTemplateOutlet]="footerTemplate" /></footer>
      }
    }

    <ng-template #mainBody><ng-content /></ng-template>
    <ng-template #headerBody>
      @if (nav(); as navTemplate) {
        <ng-container dsDrawer [(open)]="drawerOpen" side="start" size="sm">
          <!-- Not a dsDrawerTrigger: that would stamp data-state on a part of a shell that has no open state. Focus still returns here: the Drawer gives it back to what had it on open. -->
          <button dsIconButton data-part="menu" icon="menu" [label]="menuLabel() ?? words().menu" aria-haspopup="dialog"
            [attr.aria-expanded]="drawerOpen() ? 'true' : 'false'" (click)="drawerOpen.set(true)"></button>
          <ng-template dsDrawerContent [title]="drawerTitle() ?? words().drawer">
            <div dsDrawerBody (click)="onDrawerBodyClick($event)">
              <ng-container [ngTemplateOutlet]="navTemplate" />
            </div>
          </ng-template>
        </ng-container>
      }
      @if (header(); as headerTemplate) {
        <ng-container [ngTemplateOutlet]="headerTemplate" />
      }
    </ng-template>
  `,
})
export class DsPageShell {
  /** The top bar: a brand and actions. Rendered in the header landmark. */
  readonly header = input<TemplateRef<unknown> | undefined>(undefined);
  /** The navigation: a labelled nav landmark of its own. */
  readonly nav = input<TemplateRef<unknown> | undefined>(undefined);
  /** Secondary content next to main: an inspector, related links. On narrower screens it goes under main. */
  readonly aside = input<TemplateRef<unknown> | undefined>(undefined);
  /** The accessible name of the aside landmark. Default "More on this page". */
  readonly asideLabel = input<string | undefined>(undefined);
  /** Rendered in the footer landmark. */
  readonly footer = input<TemplateRef<unknown> | undefined>(undefined);
  /** The id of main, the skip link target. Default "main". Keep one per page. */
  readonly mainId = input('main');
  /** The skip link text. Default "Skip to main content". */
  readonly skipLabel = input<string | undefined>(undefined);
  /** The column state on wide screens. Two way: `[(sidebar)]`; sidebarChange is React's onSidebarChange. */
  readonly sidebar = model<PageShellSidebar | undefined>(undefined);
  /** Default expanded. */
  readonly defaultSidebar = input<PageShellSidebar>('expanded');
  /** The accessible name of the menu button. Default "Open navigation". */
  readonly menuLabel = input<string | undefined>(undefined);
  /** The title of the navigation Drawer, visually its header. Default "Navigation". */
  readonly drawerTitle = input<string | undefined>(undefined);
  /** A preview of a page inside another page: the same frame, with no landmarks (main becomes a labelled region). Default false. */
  readonly embedded = input(false, { transform: booleanAttribute });
  /**
   * Where the TabBar sits on a phone shell. auto: CSS decides from the
   * shell's size. bottom: always at the bottom. side: always in a column at
   * the inline end. Passed down to every bar inside that sets none of its
   * own. Default auto, which stamps nothing.
   */
  readonly placement = input<BarPlacement>('auto');

  private readonly theme = inject(DsThemeService);

  protected readonly words = computed(() => {
    const lang = this.theme.value().lang;
    return lang === 'ar' || lang.startsWith('ar-') ? pageShellWords.ar : pageShellWords.en;
  });
  protected readonly placementValue = computed(() => placementAttr(this.placement()));

  /** The state the app set for wide screens: the model, else defaultSidebar. */
  private readonly own = linkedSignal<PageShellSidebar>(() => this.sidebar() ?? this.defaultSidebar());
  readonly wideSidebar = this.own.asReadonly();
  /** True under breakpoint.tablet, after the first render: the navigation lives in the Drawer. */
  readonly narrow = signal(false);
  /** The state the root shows: hidden on narrow screens and with no nav, whatever the app set. */
  readonly shownSidebar = computed<PageShellSidebar>(() => (!this.nav() || this.narrow() ? 'hidden' : this.own()));
  protected readonly drawerOpen = signal(false);

  constructor() {
    consumeHostAttributes([
      'dsPageShell', 'header', 'nav', 'aside', 'asideLabel', 'footer', 'mainId', 'skipLabel', 'sidebar', 'defaultSidebar',
      'menuLabel', 'drawerTitle', 'embedded', 'placement',
    ]);
    const breakpoints = inject(BreakpointObserver);
    const destroy = inject(DestroyRef);
    // The first render draws the wide frame, as the server does; CSS hides the column on narrow screens from the first paint.
    afterNextRender(() => {
      const sub = breakpoints.observe(NARROW_QUERY).subscribe((state) => this.narrow.set(state.matches));
      destroy.onDestroy(() => sub.unsubscribe());
    });
    // The Drawer is for a hidden column only: it closes when the column shows again.
    effect(() => {
      if (this.shownSidebar() !== 'hidden') this.drawerOpen.set(false);
    });
  }

  /** Sets the column state for wide screens, as the Sidebar toggle does. */
  setSidebar(next: PageShellSidebar): void {
    this.own.set(next);
    this.sidebar.set(next);
  }

  /** Opens or closes the navigation Drawer. */
  setDrawerOpen(open: boolean): void {
    this.drawerOpen.set(open);
  }

  /** Following a link closes the Drawer, so a client routed page does not open under it. */
  protected onDrawerBodyClick(event: MouseEvent): void {
    if ((event.target as Element | null)?.closest?.('a[href]')) this.drawerOpen.set(false);
  }
}
