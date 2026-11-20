// List: a vertical list of rows with optional start, end, description and
// actions. The twin of packages/react/src/components/List/List.tsx: the same
// DOM, so List.css and the platform CSS draw it.
//
//   <ul dsList variant="inset" aria-label="Inbox">
//     <li dsListItem href="#mail-1" start="mail" title="Sara Alqahtani" description="Brand review moved" end="09:24" [actions]="del"></li>
//     <li dsListItem title="Play the mix" [onSelect]="play" [active]="playing"></li>
//   </ul>
//   <div dsList variant="inset" empty="No mail yet. Mail you get from your team shows here."></div>
//
//   <ul dsList variant="inset" aria-label="Settings">                 sections (order M9.2)
//     <li dsListSection id="network" header="Network" footer="Large files wait for Wi-Fi.">
//       <ng-container>
//         <li dsListItem start="download" title="Sync over mobile data" href="#sync" end="Off"></li>
//       </ng-container>
//     </li>
//   </ul>
//
// The rows of a section sit in an ng-container (or a @for block): the
// template parser follows the HTML rule that an li closes an open li, so an
// li written straight inside the section's li would end the section.
//
// The DOM, as React:
//
//   <ul|ol data-ds="list" role="list" data-size data-variant>        rows
//     <li data-part="item" data-linked? data-action? data-active? data-tone? data-disabled? data-no-chevron? data-title-lines?>
//       <span data-part="separator" aria-hidden>
//       <span aria-hidden>                                       the hover fill (row-glide)
//       <span data-part="start">  <a|span data-part="title">  <span data-part="description">
//       <div data-part="control">  <span data-part="end">  <span data-part="actions">  <div data-part="footer">
//   <div data-ds="list" data-size data-variant role="group"?>       no rows
//     <p data-part="empty">
//   <ul|ol data-ds="list" role="group|none" data-size>               sections
//     <li data-part="section" role="presentation">
//       <hN data-part="section-header" id tabindex="-1">
//       <ul data-ds="list" role="list" aria-labelledby aria-describedby data-size data-variant>   the rows
//       <p data-part="section-footer" id>
//
// Names and forms that differ from React, by frameworks.md:
// - The element is the author's: `ul[dsList]`, `ol[dsList]` (React's
//   ordered) or `div[dsList]`. React swaps to a div when a List has no rows;
//   an Angular host cannot change its element, so an empty list is the div
//   form, which draws `empty`. A ListSection draws its own nested list and
//   swaps it to the div form when it has no rows, as React.
// - Node props (`title`, `description`, `start`, `end`, `actions`,
//   `control`, `footer`, the section's `header` and `footer`, `empty`) take
//   a short text (`start` an icon name) or a TemplateRef.
// - `onSelect` is a function input: the row must know whether it has one
//   (it makes the title a button). `linkProps` takes the anchor's attributes
//   (target, rel, aria-current, tabIndex, download, hreflang); a router link
//   on the title is `href` plus the app's own click handling.
// - `swipe` (order M9.7) waits for the Angular SwipeActions.
//
// Motion as React: list-stagger on the first paint of the rows (the stagger
// primitive, never again), collection-flip when rows are added, removed or
// moved, and row-glide for the hover fill of a linked or action row. The
// server render of an Angular app is not told apart: rows hydrated from
// server HTML play the stagger once more.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  numberAttribute,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DsIcon } from '@the-system/icons/angular';
import type { IconName } from '@the-system/icons';
import type { Size, Tone } from '@the-system/shared';
import { setPressPoint, staggerGroup, watchGlide } from '@the-system/motion';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { injectFlipGroup } from '../../internal/motion-selection';
import { trackPressed } from '../../internal/pressed';

export type ListSize = Extract<Size, 'sm' | 'md'>;
/** The tone of one row: danger for a destructive row. */
export type ListItemTone = Extract<Tone, 'neutral' | 'danger'>;
export type ListVariant = 'plain' | 'divided' | 'inset' | 'flush';
/** How many lines a row's title may take before it ends with an ellipsis; all never cuts it. */
export type ListTitleLines = 1 | 2 | 3 | 'all';
/** Text content of a part: a short text, or a TemplateRef. */
export type ListContent = string | TemplateRef<unknown>;
/** Leading content: a system icon name, or a TemplateRef. */
export type ListSlotContent = IconName | TemplateRef<unknown>;
export type ListSectionLevel = 2 | 3 | 4 | 5 | 6;
/** The anchor attributes of a linked row, React's linkProps. */
export interface ListLinkProps {
  target?: string;
  rel?: string;
  download?: string;
  hreflang?: string;
  'aria-current'?: string;
  tabIndex?: number;
}

/** The rows of a list element. */
const rowsOf = (list: Element) => Array.from(list.querySelectorAll(":scope > [data-part='item']"));
/** Rows whose hover fill glides (row-glide), as React. */
const GLIDE_ROWS = "[data-part='item']:is([data-linked], [data-action]):not([data-disabled], [data-active])";

const present = <T>(value: T | null | undefined | false | ''): value is T => value !== undefined && value !== null && value !== false && value !== '';

function toTitleLines(value: unknown): ListTitleLines | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === 'all') return 'all';
  const n = Number(value);
  return n === 2 || n === 3 ? n : 1;
}

let nextSection = 0;

/**
 * The motion of one list element, as React's useFirstPaintStagger: the
 * first paint stagger, the flip of later changes and the row glide. Call
 * in an injection context; `el` returns the list element (or null) and
 * `rows` is read so the effect runs after each change of the rows.
 */
function listMotion(el: () => HTMLElement | null | undefined, rows: () => number): void {
  const motion = injectMotion();
  const flip = injectFlipGroup({ items: rowsOf });
  let played = false;
  let glided: Element | null = null;
  let stopGlide: (() => void) | null = null;
  inject(DestroyRef).onDestroy(() => stopGlide?.());
  afterRenderEffect(() => {
    const count = rows();
    const node = el() ?? null;
    untracked(() => {
      if (node !== glided) {
        stopGlide?.();
        glided = node;
        stopGlide = node ? watchGlide(node, GLIDE_ROWS, null, () => motion.mode('row-glide')) : null;
      }
      if (!node || count === 0) {
        flip.update(node);
        return;
      }
      if (!played) {
        played = true;
        // The first paint of the rows: they rise and fade in on the soft spring, one stagger step apart.
        staggerGroup(rowsOf(node), { phase: 'enter', spring: 'soft', mode: motion.mode('list-stagger') });
      }
      flip.update(node);
    });
  });
}

/**
 * A list of rows. `ul[dsList]` or `ol[dsList]` with ListItem or ListSection
 * children; `div[dsList]` for a list with no rows, which draws `empty`.
 */
@Component({
  selector: 'ul[dsList], ol[dsList], div[dsList]',
  exportAs: 'dsList',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'list',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': 'sectioned() ? null : variant()',
    '[attr.role]': 'roleValue()',
    '[attr.aria-label]': 'ariaLabel() ?? null',
    '[attr.aria-labelledby]': 'ariaLabelledby() ?? null',
  },
  template: `
    @if (isDiv) {
      @if (empty() !== undefined) {
        <p data-part="empty">@if (asTemplate(empty()); as t) {<ng-container [ngTemplateOutlet]="t" />} @else {{{ empty() }}}</p>
      }
    } @else {
      <ng-content />
    }
  `,
})
export class DsList {
  /** sm or md row height and text. Default md. */
  readonly size = input<ListSize>('md');
  /** plain, divided, inset or flush. Default plain. */
  readonly variant = input<ListVariant>('plain');
  /** How many lines each row's title may wrap to; a row's own titleLines wins. Default 1. */
  readonly titleLines = input<ListTitleLines, unknown>(1, { transform: (v: unknown) => toTitleLines(v) ?? 1 });
  /** Shown by the div form, a list with no rows: what is missing and what to do next. */
  readonly empty = input<ListContent | undefined>(undefined);
  /** The list's name. A named empty list is a group; a named list of sections is a group. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  /** A role of the caller's own, for the div form. */
  readonly role = input<string | undefined>(undefined);

  protected readonly items = contentChildren(DsListItemToken);
  protected readonly sections = contentChildren(DsListSectionToken);
  private readonly host = consumeHostAttributes(['dsList', 'size', 'variant', 'titleLines', 'empty', 'role']);
  /** True for the div form. */
  protected readonly isDiv = this.host.tagName === 'DIV';
  /** ol: rows whose order means something. Read by sections for their nested list. */
  readonly ordered = this.host.tagName === 'OL';

  /** A list whose children are sections. */
  readonly sectioned = computed(() => !this.isDiv && this.sections().length > 0);
  protected readonly roleValue = computed(() => {
    const named = Boolean(this.ariaLabel() || this.ariaLabelledby());
    if (this.isDiv) return named ? 'group' : (this.role() ?? null);
    if (this.sectioned()) return named ? 'group' : 'none';
    // list-style: none makes Safari and VoiceOver drop the list role, so it is set again.
    return 'list';
  });
  protected readonly asTemplate = asTemplate;

  constructor() {
    listMotion(
      () => (this.isDiv || this.sectioned() ? null : this.host),
      () => (this.isDiv || this.sectioned() ? 0 : this.items().length),
    );
  }
}

/** A TemplateRef, or null for text. */
function asTemplate(value: unknown): TemplateRef<unknown> | null {
  return value instanceof TemplateRef ? value : null;
}

/** Tokens the List queries, so the classes below can be declared after it. */
export abstract class DsListItemToken {}
export abstract class DsListSectionToken {}

/**
 * One section of a List: a heading, the rows as a nested list and a footer.
 * Put the id a SectionIndex targets on the section; the jump focuses the
 * heading inside it.
 */
@Component({
  selector: 'li[dsListSection]',
  exportAs: 'dsListSection',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: DsListSectionToken, useExisting: forwardRef(() => DsListSection) }],
  host: {
    role: 'presentation',
    'data-part': 'section',
  },
  template: `
    <ng-template #text let-c>@if (asTemplate(c); as t) {<ng-container [ngTemplateOutlet]="t" />} @else {{{ c }}}</ng-template>
    <!-- One projection slot, rendered in the ul or the ol: two slots would project into one of them only. -->
    <ng-template #rowsContent><ng-content /></ng-template>
    @if (headerId(); as hid) {
      @switch (level()) {
        @case (2) { <h2 data-part="section-header" [id]="hid" tabindex="-1"><ng-container *ngTemplateOutlet="text; context: { $implicit: header() }" /></h2> }
        @case (4) { <h4 data-part="section-header" [id]="hid" tabindex="-1"><ng-container *ngTemplateOutlet="text; context: { $implicit: header() }" /></h4> }
        @case (5) { <h5 data-part="section-header" [id]="hid" tabindex="-1"><ng-container *ngTemplateOutlet="text; context: { $implicit: header() }" /></h5> }
        @case (6) { <h6 data-part="section-header" [id]="hid" tabindex="-1"><ng-container *ngTemplateOutlet="text; context: { $implicit: header() }" /></h6> }
        @default { <h3 data-part="section-header" [id]="hid" tabindex="-1"><ng-container *ngTemplateOutlet="text; context: { $implicit: header() }" /></h3> }
      }
    }
    @if (items().length === 0) {
      <div
        data-ds="list"
        [attr.data-size]="size()"
        [attr.data-variant]="variant()"
        [attr.role]="headerId() ? 'group' : null"
        [attr.aria-labelledby]="headerId()"
        [attr.aria-describedby]="footerId()"
      >
        @if (empty() !== undefined) {
          <p data-part="empty"><ng-container *ngTemplateOutlet="text; context: { $implicit: empty() }" /></p>
        }
      </div>
    } @else if (ordered()) {
      <ol #rows role="list" data-ds="list" [attr.data-size]="size()" [attr.data-variant]="variant()" [attr.aria-labelledby]="headerId()" [attr.aria-describedby]="footerId()">
        <ng-container [ngTemplateOutlet]="rowsContent" />
      </ol>
    } @else {
      <ul #rows role="list" data-ds="list" [attr.data-size]="size()" [attr.data-variant]="variant()" [attr.aria-labelledby]="headerId()" [attr.aria-describedby]="footerId()">
        <ng-container [ngTemplateOutlet]="rowsContent" />
      </ul>
    }
    @if (footerId(); as fid) {
      <p data-part="section-footer" [id]="fid"><ng-container *ngTemplateOutlet="text; context: { $implicit: footer() }" /></p>
    }
  `,
})
export class DsListSection extends DsListSectionToken {
  /** The section heading. It names the section's list and is where a SectionIndex jump puts focus. */
  readonly header = input<ListContent | undefined>(undefined);
  /** A note under the rows, read as the description of the section's list. */
  readonly footer = input<ListContent | undefined>(undefined);
  /** The heading level of the header. Default 3. */
  readonly level = input<ListSectionLevel, unknown>(3, { transform: (v: unknown) => (numberAttribute(v, 3) as ListSectionLevel) });
  /** Shown when the section has no rows. */
  readonly empty = input<ListContent | undefined>(undefined);

  private readonly list = inject(DsList, { optional: true });
  protected readonly items = contentChildren(DsListItemToken);
  private readonly rowsEl = viewChild<ElementRef<HTMLElement>>('rows');
  private readonly id = `ds-list-section-${nextSection++}`;
  protected readonly asTemplate = asTemplate;

  protected readonly size = computed(() => this.list?.size() ?? 'md');
  protected readonly variant = computed(() => this.list?.variant() ?? 'plain');
  protected readonly ordered = computed(() => this.list?.ordered ?? false);
  /** The title line count the section's rows use. */
  readonly titleLines = computed<ListTitleLines>(() => this.list?.titleLines() ?? 1);
  protected readonly headerId = computed(() => (present(this.header()) ? `${this.id}-header` : null));
  protected readonly footerId = computed(() => (present(this.footer()) ? `${this.id}-footer` : null));

  constructor() {
    super();
    consumeHostAttributes(['dsListSection', 'header', 'footer', 'level', 'empty']);
    listMotion(
      () => this.rowsEl()?.nativeElement,
      () => this.items().length,
    );
  }
}

/** One row of a List: text, a link (`href`), an action (`onSelect`) or a control row (`control`). */
@Component({
  selector: 'li[dsListItem]',
  exportAs: 'dsListItem',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: DsListItemToken, useExisting: forwardRef(() => DsListItem) }],
  host: {
    'data-part': 'item',
    '[attr.data-active]': 'active() ? "" : null',
    '[attr.data-tone]': 'tone() === "danger" ? "danger" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-linked]': 'linked() ? "" : null',
    '[attr.data-action]': 'action() ? "" : null',
    '[attr.data-no-chevron]': 'linked() && !chevron() ? "" : null',
    '[attr.data-title-lines]': 'lines() !== 1 && !controlRow() ? lines() + "" : null',
    '[attr.aria-current]': '!linked() && !action() && active() ? "true" : (ariaCurrent() ?? null)',
  },
  template: `
    <ng-template #text let-c>@if (asTemplate(c); as t) {<ng-container [ngTemplateOutlet]="t" />} @else {{{ c }}}</ng-template>
    <span data-part="separator" aria-hidden="true"></span>
    <span aria-hidden="true"></span>
    @if (start(); as s) {
      @if (asTemplate(s); as t) {
        <span data-part="start"><ng-container [ngTemplateOutlet]="t" /></span>
      } @else {
        <span data-part="start" aria-hidden="true"><svg dsIcon [name]="$any(s)" size="md"></svg></span>
      }
    }
    @if (linked()) {
      <a
        data-part="title"
        [attr.href]="disabled() ? null : href()"
        [attr.aria-disabled]="disabled() ? 'true' : null"
        [attr.role]="disabled() ? 'link' : null"
        [attr.tabindex]="disabled() ? 0 : (linkProps()?.tabIndex ?? null)"
        [attr.aria-current]="active() ? (linkProps()?.['aria-current'] ?? 'true') : (linkProps()?.['aria-current'] ?? null)"
        [attr.target]="linkProps()?.target ?? null"
        [attr.rel]="linkProps()?.rel ?? null"
        [attr.download]="linkProps()?.download ?? null"
        [attr.hreflang]="linkProps()?.hreflang ?? null"
        (click)="onLinkClick($event)"
      ><ng-container *ngTemplateOutlet="text; context: { $implicit: title() }" /></a>
    } @else if (action()) {
      <span
        data-part="title"
        role="button"
        tabindex="0"
        [attr.aria-disabled]="disabled() ? 'true' : null"
        [attr.aria-current]="active() ? 'true' : null"
        (click)="select($event)"
        (keydown)="onActionKeyDown($event)"
        (keyup)="onActionKeyUp($event)"
      ><ng-container *ngTemplateOutlet="text; context: { $implicit: title() }" /></span>
    } @else if (hasTitle()) {
      <span data-part="title"><ng-container *ngTemplateOutlet="text; context: { $implicit: title() }" /></span>
    }
    @if (!controlRow() && hasDescription()) {
      <span data-part="description"><ng-container *ngTemplateOutlet="text; context: { $implicit: description() }" /></span>
    }
    @if (control(); as c) {
      <div data-part="control"><ng-container [ngTemplateOutlet]="c" /></div>
    }
    @if (hasEnd()) {
      <span data-part="end"><ng-container *ngTemplateOutlet="text; context: { $implicit: end() }" /></span>
    }
    @if (actions(); as a) {
      <span data-part="actions"><ng-container [ngTemplateOutlet]="a" /></span>
    }
    @if (!controlRow() && footer(); as f) {
      <div data-part="footer"><ng-container [ngTemplateOutlet]="f" /></div>
    }
  `,
})
export class DsListItem extends DsListItemToken {
  /** The row's main text. With href it becomes the link, with onSelect the button. Optional in a control row. */
  readonly title = input<ListContent | undefined>(undefined);
  /** A second line under the title. */
  readonly description = input<ListContent | undefined>(undefined);
  /** Leading content: an icon name (decorative) or a TemplateRef. */
  readonly start = input<ListSlotContent | undefined>(undefined);
  /** Trailing content that is not an action: a time, a count, a Badge. */
  readonly end = input<ListContent | undefined>(undefined);
  /** Buttons or IconButtons for this row, their own Tab stops above the row link. */
  readonly actions = input<TemplateRef<unknown> | undefined>(undefined);
  /** Makes the row a link: the title becomes an anchor whose hit area covers the row. */
  readonly href = input<string | undefined>(undefined);
  /** Extra attributes for the anchor. */
  readonly linkProps = input<ListLinkProps | undefined>(undefined);
  /** Makes the row act in place: the title becomes a button. Runs on a click, Enter or Space. Ignored with href. */
  readonly onSelect = input<((event: MouseEvent | KeyboardEvent) => void) | undefined>(undefined);
  /** On a linked row, false asks the platform not to draw its disclosure chevron. Default true. */
  readonly chevron = input(true, { transform: booleanAttribute });
  /** How many lines the title may wrap to. Default: the List's titleLines. */
  readonly titleLines = input<ListTitleLines | undefined, unknown>(undefined, { transform: toTitleLines });
  /** The row's own buttons under its text. */
  readonly footer = input<TemplateRef<unknown> | undefined>(undefined);
  /** One control that spans the row, such as a Slider. The row is then not a link or an action. */
  readonly control = input<TemplateRef<unknown> | undefined>(undefined);
  /** The current row: data-active, and aria-current on the link, the button or the row. */
  readonly active = input(false, { transform: booleanAttribute });
  /** danger: a destructive row. Default neutral (no attribute). */
  readonly tone = input<ListItemTone | undefined>(undefined);
  /** Dims the row. A link loses its href and keeps focus with aria-disabled. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** A caller's own aria-current on the row. */
  readonly ariaCurrent = input<string | undefined>(undefined, { alias: 'aria-current' });

  private readonly section = inject(DsListSection, { optional: true });
  private readonly list = inject(DsList, { optional: true });
  private readonly host = consumeHostAttributes([
    'dsListItem', 'title', 'description', 'start', 'end', 'actions', 'href', 'linkProps', 'onSelect', 'chevron', 'titleLines', 'footer', 'control', 'active', 'tone', 'disabled',
  ]);
  protected readonly asTemplate = asTemplate;

  protected readonly controlRow = computed(() => this.control() !== undefined);
  protected readonly linked = computed(() => !this.controlRow() && this.href() !== undefined);
  protected readonly action = computed(() => !this.controlRow() && !this.linked() && this.onSelect() !== undefined);
  protected readonly lines = computed<ListTitleLines>(() => this.titleLines() ?? this.section?.titleLines() ?? this.list?.titleLines() ?? 1);
  protected readonly hasTitle = computed(() => present(this.title()));
  protected readonly hasDescription = computed(() => present(this.description()));
  protected readonly hasEnd = computed(() => present(this.end()));

  constructor() {
    super();
    const destroy = inject(DestroyRef);
    const host = this.host;
    // Platform hook: where the press landed in the row, for a ripple from the touch point.
    const down = (event: PointerEvent) => setPressPoint(host, 'list', event.clientX, event.clientY);
    host.addEventListener('pointerdown', down);
    destroy.onDestroy(() => host.removeEventListener('pointerdown', down));
    // Order M4: a linked or action row carries data-pressed from pointerdown to the release.
    destroy.onDestroy(trackPressed(host, () => !(this.linked() || this.action()) || this.disabled()));
  }

  protected onLinkClick(event: MouseEvent): void {
    if (this.disabled()) event.preventDefault();
  }

  protected select(event: MouseEvent | KeyboardEvent): void {
    if (!this.disabled()) this.onSelect()?.(event);
  }

  /** The action title answers the keys of a native button: Enter on key down, Space on key up. */
  protected onActionKeyDown(event: KeyboardEvent): void {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!event.repeat) this.select(event);
    } else if (event.key === ' ') {
      // Key down only stops the page scroll.
      event.preventDefault();
    }
  }

  protected onActionKeyUp(event: KeyboardEvent): void {
    if (event.target === event.currentTarget && event.key === ' ') this.select(event);
  }
}
