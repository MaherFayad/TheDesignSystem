// Popover: non modal content anchored to a trigger, for a small form or
// details. The twin of packages/react/src/components/Popover/Popover.tsx, on
// the same DOM, so Popover.css applies as it is.
//
//   <ng-container dsPopover size="md">
//     <button dsButton dsPopoverTrigger>Rename</button>
//     <ng-template dsPopoverContent title="Rename layer" side="bottom">
//       <div dsPopoverBody><div dsField label="Layer name"><div dsInput value="Hero image"></div></div></div>
//       <div dsPopoverFooter><button dsButton dsPopoverClose size="sm">Cancel rename</button></div>
//     </ng-template>
//   </ng-container>
//
// The DOM, as React:
//
//   <body>
//     <div data-ds="theme" data-popover-layer>        the portal theme, display: contents
//       <div data-radix-popper-content-wrapper>       fixed, translate (internal/popper.ts)
//         <div data-ds="popover" role="dialog" data-size data-state data-side data-align>
//           <div data-part="titlebar" data-ds="title-bar">   optional part: the title and the close
//           <h2 data-part="title">
//           <button data-part="close" data-ds="close-button">
//           <div data-part="body">  <div data-part="footer">
//           <span><svg data-part="arrow"></span>        the Radix arrow wrapper, placed per side
//
// The popup layer (internal/popper.ts) mounts it and places it with the
// steps Radix Popper asks of Floating UI (offset with the arrow height,
// shift, flip, size, arrow, transform origin); the collision padding takes
// the side column and the fold (order DU5, internal/fold.ts foldCollision).
// It is not modal: the page stays usable, a press outside closes it, Tab
// wraps inside it (Radix runs its focus scope with loop on), Escape closes it
// and focus goes back to the trigger. On a page with a modal overlay, the
// modal's Tab and focus guards leave a popover layer alone, as Radix's focus
// scope stack does.
//
// Names that differ from React, by frameworks.md: `onOpenChange` is the
// `openChange` output of `[(open)]`; the title is the `title` input of
// dsPopoverContent; PopoverAnchor is `[dsPopoverAnchor]`.
import {
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
  inject,
  input,
  model,
  numberAttribute,
  untracked,
  type Signal,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import type { PhysicalPadding, Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { foldCollision } from '../../internal/fold';
import { PopupLayer, type PopperAlign, type PopperResult, type PopperSide, type PopupLayerHost } from '../../internal/popper';
import { followTriggerTitle, injectTriggerRow } from '../../internal/trigger-row';
import { tabbables } from '../../behavior';
import { DsLayerTheme, DsThemeService, layerThemeProviders, syncDirectionality } from '../../theme';
import type { ThemeValue } from '../../theme';
import { DsCloseButton } from '../close-button/close-button';
import { DsTitleBar } from '../title-bar/title-bar';
import { DsWindowControls } from '../window-controls/window-controls';
import { isInsideToaster } from '../toast/is-inside-toaster';

export type PopoverSize = Extract<Size, 'sm' | 'md' | 'lg'>;
/** The preferred side. start and end follow the reading direction. */
export type PopoverSide = 'top' | 'bottom' | 'start' | 'end';
export type PopoverAlign = PopperAlign;

/** The built in words, the same strings as React. Arabic: Gulf MSA noun forms. */
export const popoverLabels = {
  en: { close: 'Close popover', controls: 'Popover controls', minimize: 'Minimize popover', zoom: 'Zoom popover' },
  ar: { close: 'إغلاق', controls: 'أزرار النافذة المنبثقة', minimize: 'تصغير النافذة المنبثقة', zoom: 'تكبير النافذة المنبثقة' },
} as const;

const isArabic = (lang: string) => lang === 'ar' || lang.startsWith('ar-');

/** Maps a logical side to the physical side for a direction. */
export function physicalSide(side: PopoverSide, dir: string): PopperSide {
  const rtl = dir === 'rtl';
  if (side === 'start') return rtl ? 'right' : 'left';
  if (side === 'end') return rtl ? 'left' : 'right';
  return side;
}

/** Fields first, then actions: where focus goes when the popover opens. */
const FIELD_SELECTOR =
  'input:not([type="hidden"]), select, textarea, [role="switch"], [role="checkbox"], [role="radio"], [role="combobox"], [role="slider"], [contenteditable="true"]';
const ACTION_SELECTOR = 'button, a[href], [tabindex]:not([tabindex="-1"])';

function firstUsable(scope: Element | null | undefined, selector: string): HTMLElement | null {
  if (!scope) return null;
  for (const el of Array.from(scope.querySelectorAll<HTMLElement>(selector))) {
    if (el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true' || el.closest('[hidden], [inert]')) continue;
    return el;
  }
  return null;
}

/** The first `[data-part=<part>]` of this root, not of a popover nested inside it. */
function ownPart(root: HTMLElement, part: string): HTMLElement | null {
  return (
    Array.from(root.querySelectorAll<HTMLElement>(`[data-part="${part}"]`)).find((el) => el.parentElement?.closest('[data-ds="popover"]') === root) ??
    null
  );
}

/** The popover focus rule (manifest Popover a11y.focus), as React. Null: the root itself. */
export function popoverInitialFocus(root: HTMLElement): HTMLElement | null {
  return (
    firstUsable(root, '[data-autofocus]') ??
    firstUsable(ownPart(root, 'body'), FIELD_SELECTOR) ??
    firstUsable(ownPart(root, 'footer'), ACTION_SELECTOR) ??
    null
  );
}

/** The arrow wrapper per placed side, as Radix's PopperArrow writes it. */
const arrowTransform: Record<PopperSide, { origin: string; transform: string }> = {
  top: { origin: '', transform: 'translateY(100%)' },
  right: { origin: '0 0', transform: 'translateY(50%) rotate(90deg) translateX(-50%)' },
  bottom: { origin: 'center 0', transform: 'rotate(180deg)' },
  left: { origin: '100% 0', transform: 'translateY(50%) rotate(-90deg) translateX(50%)' },
};
const oppositeSide: Record<PopperSide, PopperSide> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

/** The content's own style, as Radix writes it: the --radix-popover-* names map the popper variables. */
const CONTENT_STYLE =
  '--radix-popover-content-transform-origin: var(--radix-popper-transform-origin); --radix-popover-content-available-width: var(--radix-popper-available-width); --radix-popover-content-available-height: var(--radix-popper-available-height); --radix-popover-trigger-width: var(--radix-popper-anchor-width); --radix-popover-trigger-height: var(--radix-popper-anchor-height);';

let nextId = 0;

// ------------------------------------------------------------------ dsPopover

/** The root: state and the size. Renders no element of its own: put it on an ng-container. */
@Directive({ selector: '[dsPopover]', exportAs: 'dsPopover' })
export class DsPopover {
  /** The open state. Two way: `[(open)]`. Emits false for Escape, an outside press, the close control and dsPopoverClose. */
  readonly open = model(false);
  /** Opens on first render when true. */
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** The width: sm 240, md 320, lg 440 px, never wider than the space beside the trigger. Default md. */
  readonly size = input<PopoverSize>('md');

  private readonly base = `ds-popover-${++nextId}`;
  readonly contentId = `${this.base}-content`;
  readonly titleId = `${this.base}-title`;
  /** The trigger, where focus returns, and the anchor unless a dsPopoverAnchor is set. */
  trigger: HTMLElement | null = null;
  anchor: HTMLElement | null = null;

  constructor() {
    consumeHostAttributes(['dsPopover', 'open', 'defaultOpen', 'size']);
    afterNextRender(() => {
      if (this.defaultOpen() && !this.open()) this.open.set(true);
    });
  }

  setOpen(open: boolean): void {
    this.open.set(open);
  }
}

function injectPopover(name: string): DsPopover {
  const popover = inject(DsPopover, { optional: true });
  if (!popover) throw new Error(`${name} must be used inside a dsPopover.`);
  return popover;
}

// ------------------------------------------------------------------ trigger, anchor, close, body, footer

/**
 * Opens and closes the popover. Put it on a dsButton or a dsIconButton, or
 * on a List row (`li[dsListItem]`), whose title then carries the trigger and
 * is the anchor (internal/trigger-row.ts).
 */
@Directive({
  selector: '[dsPopoverTrigger]',
  host: {
    '[attr.aria-haspopup]': 'row ? null : "dialog"',
    '[attr.aria-expanded]': 'row ? null : popover.open() ? "true" : "false"',
    '[attr.aria-controls]': '!row && popover.open() ? popover.contentId : null',
    '[attr.data-state]': 'row ? null : popover.open() ? "open" : "closed"',
    '(click)': 'row || popover.setOpen(!popover.open())',
  },
})
export class DsPopoverTrigger {
  protected readonly popover = injectPopover('dsPopoverTrigger');
  protected readonly row = injectTriggerRow();

  constructor() {
    const el = consumeHostAttributes(['dsPopoverTrigger']);
    const popover = this.popover;
    popover.trigger = el;
    let current: HTMLElement = el;
    inject(DestroyRef).onDestroy(() => {
      if (popover.trigger === current) popover.trigger = null;
    });
    const row = this.row;
    if (row) {
      row.connect(
        () => ({ id: null, haspopup: 'dialog', expanded: popover.open(), controls: popover.open() ? popover.contentId : null, state: popover.open() ? 'open' : 'closed' }),
        { click: () => popover.setOpen(!popover.open()) },
      );
      followTriggerTitle(row, (title) => (popover.trigger = current = title));
    }
  }
}

/** Positions the popover against this element instead of the trigger. */
@Directive({ selector: '[dsPopoverAnchor]' })
export class DsPopoverAnchor {
  constructor() {
    const el = consumeHostAttributes(['dsPopoverAnchor']);
    const popover = injectPopover('dsPopoverAnchor');
    popover.anchor = el;
    inject(DestroyRef).onDestroy(() => {
      if (popover.anchor === el) popover.anchor = null;
    });
  }
}

/** Closes the popover. Put it on a dsButton. */
@Directive({ selector: '[dsPopoverClose]', host: { '(click)': 'popover.setOpen(false)' } })
export class DsPopoverClose {
  protected readonly popover = injectPopover('dsPopoverClose');
  constructor() {
    consumeHostAttributes(['dsPopoverClose']);
  }
}

/** The content. It scrolls inside when the popover reaches the space left in the viewport. */
@Directive({ selector: '[dsPopoverBody]', host: { 'data-part': 'body' } })
export class DsPopoverBody {
  constructor() {
    consumeHostAttributes(['dsPopoverBody']);
  }
}

/** Up to two actions at the inline end. */
@Directive({ selector: '[dsPopoverFooter]', host: { 'data-part': 'footer' } })
export class DsPopoverFooter {
  constructor() {
    consumeHostAttributes(['dsPopoverFooter']);
  }
}

// ------------------------------------------------------------------ the layer

interface LayerData {
  content: DsPopoverContent;
  popover: DsPopover;
  theme: Signal<ThemeValue>;
}

const POPOVER_LAYER = new InjectionToken<LayerData>('DS_POPOVER_LAYER');

/** The themed portal wrapper, the Radix popper wrapper and the root. Internal: dsPopoverContent creates it. */
@Component({
  selector: 'div[data-popover-layer]',
  imports: [NgTemplateOutlet, DsCloseButton, DsTitleBar, DsWindowControls],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: layerThemeProviders(() => inject(POPOVER_LAYER).theme),
  hostDirectives: [DsLayerTheme],
  template: `
    <div data-radix-popper-content-wrapper="">
      <div data-ds="popover" role="dialog" [id]="popover.contentId" tabindex="-1" [attr.data-size]="popover.size()" [attr.data-state]="owner.state()"
        [attr.aria-labelledby]="owner.title() !== undefined ? popover.titleId : null" [attr.aria-label]="owner.ariaLabel() ?? null"
        [attr.style]="contentStyle" (keydown)="onKeydown($event)">
        @if (titlebarOn()) {
          <div dsTitleBar data-part="titlebar" [as]="owner.title() !== undefined ? 'h2' : 'div'"
            [title]="owner.title() !== undefined ? barTitle : undefined"
            [controls]="controlsOn() && owner.close() ? lights : undefined"
            [actions]="!controlsOn() && owner.close() ? closeButton : undefined"></div>
        } @else {
          @if (owner.title() !== undefined) {
            <h2 [id]="popover.titleId" data-part="title">{{ owner.title() }}</h2>
          }
          @if (owner.close()) {
            <ng-container [ngTemplateOutlet]="closeButton" />
          }
        }
        <ng-container [ngTemplateOutlet]="owner.template" />
        @if (owner.arrow()) {
          <span><svg data-part="arrow" viewBox="0 0 12 6" preserveAspectRatio="none" aria-hidden="true" focusable="false" width="10" height="5" style="display: block;"><path d="M0 0 L6 6 L12 0" /></svg></span>
        }
      </div>
    </div>
    <ng-template #barTitle><span data-popover-title [id]="popover.titleId">{{ owner.title() }}</span></ng-template>
    <ng-template #lights>
      <div dsWindowControls [label]="words().controls" [closeLabel]="closeName()" [minimizeLabel]="words().minimize"
        [zoomLabel]="words().zoom" [onClose]="closeFn"></div>
    </ng-template>
    <ng-template #closeButton>
      <button dsCloseButton data-part="close" [label]="closeName()" size="xs" (click)="close()"></button>
    </ng-template>
  `,
})
export class DsPopoverLayer implements PopupLayerHost {
  private readonly data = inject(POPOVER_LAYER);
  protected readonly owner = this.data.content;
  protected readonly popover = this.data.popover;
  private readonly theme = inject(DsThemeService);
  private readonly checker = inject(InteractivityChecker);
  readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly contentStyle = CONTENT_STYLE;
  protected readonly words = computed(() => (isArabic(this.theme.value().lang) ? popoverLabels.ar : popoverLabels.en));
  protected readonly closeName = computed(() => this.owner.closeLabel() ?? this.words().close);
  protected readonly titlebarOn = this.theme.optionalPart('popover', 'titlebar');
  protected readonly controlsOn = this.theme.optionalPart('popover', 'controls');
  protected readonly closeFn = () => this.close();

  constructor() {
    syncDirectionality(inject(Directionality), this.theme.value);
  }

  get wrapper(): HTMLElement {
    return this.host.firstElementChild as HTMLElement;
  }

  /** The popover root inside the wrapper. */
  get content(): HTMLElement | null {
    return (this.wrapper?.firstElementChild as HTMLElement | null) ?? null;
  }

  close(): void {
    this.popover.setOpen(false);
  }

  /** Tab wraps inside the popover, as Radix's focus scope with loop on. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
    const root = event.currentTarget as HTMLElement;
    const stops = tabbables(root, this.checker).filter((el) => el.closest('[data-ds="popover"]') === root);
    const active = root.ownerDocument.activeElement;
    if (stops.length === 0) {
      if (active === root) event.preventDefault();
      return;
    }
    const first = stops[0] as HTMLElement;
    const last = stops[stops.length - 1] as HTMLElement;
    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && (active === first || active === root)) {
      event.preventDefault();
      last.focus();
    }
  }
}

// ------------------------------------------------------------------ dsPopoverContent

/**
 * The popover content: an ng-template with the body and the footer. While
 * the popover is open it renders in a themed layer at the end of body, with
 * the title, the close control and the arrow around it.
 */
@Directive({ selector: 'ng-template[dsPopoverContent]', exportAs: 'dsPopoverContent' })
export class DsPopoverContent {
  /** The title. It names the popover (aria-labelledby). */
  readonly title = input<string | undefined>(undefined);
  /** The preferred side. start and end follow the reading direction. It flips when there is no room. Default bottom. */
  readonly side = input<PopoverSide>('bottom');
  /** Alignment along the trigger. start and end follow the reading direction. Default center. */
  readonly align = input<PopoverAlign>('center');
  /** Distance from the trigger in px. Default 8; the arrow's height is added, as Radix does. */
  readonly sideOffset = input(8, { transform: numberAttribute });
  /** Space kept from the viewport edges in px, one number or per physical side. The fold and the side column add to it. Default 8. */
  readonly collisionPadding = input<number | PhysicalPadding>(8);
  /** Shows the arrow that points at the trigger. Default true. */
  readonly arrow = input(true, { transform: booleanAttribute });
  /** Shows the CloseButton (part close). Default true. Escape and an outside press always close. */
  readonly close = input(true, { transform: booleanAttribute });
  /** Accessible name of the close control. Default "Close popover" (Arabic under lang ar). */
  readonly closeLabel = input<string | undefined>(undefined);
  /** The name when there is no title. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
  private readonly popover = injectPopover('dsPopoverContent');
  private readonly theme = inject(DsThemeService);
  private readonly doc = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  private readonly layer: PopupLayer = new PopupLayer({
    template: () => null,
    anchor: () => this.anchor(),
    sideOffset: 8,
    padding: 8,
    component: DsPopoverLayer,
    providers: () => [{ provide: POPOVER_LAYER, useValue: { content: this, popover: this.popover, theme: this.theme.value } satisfies LayerData }],
    resolve: () => this.placement(),
    placed: (result) => this.placeArrow(result),
  });

  /** open while open, closed while the exit is drawn. */
  readonly state = computed(() => (this.popover.open() && !this.layer.closing() ? 'open' : 'closed'));
  private undo: (() => void)[] = [];
  /** What had focus on open: the fallback for the focus return when there is no trigger (an anchor only). */
  private openedFrom: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const open = this.popover.open();
      untracked(() => (open ? this.show() : this.hide()));
    });
    inject(DestroyRef).onDestroy(() => {
      this.stopListening();
      this.layer.dispose();
    });
  }

  private anchor(): HTMLElement | null {
    return this.popover.anchor ?? this.popover.trigger;
  }

  private root(): HTMLElement | null {
    return this.layer.content;
  }

  private arrowWrap(): HTMLElement | null {
    const root = this.root();
    const svg = root ? Array.from(root.querySelectorAll<SVGElement>('[data-part="arrow"]')).find((el) => el.closest('[data-ds="popover"]') === root) : null;
    return (svg?.parentElement as HTMLElement | null) ?? null;
  }

  private placement() {
    const root = this.root();
    const wrap = this.arrowWrap();
    const arrow = wrap
      ? {
          width: wrap.offsetWidth,
          height: wrap.offsetHeight,
          clientSize: (axis: 'x' | 'y') => {
            const parent = wrap.offsetParent as HTMLElement | null;
            return parent ? (axis === 'x' ? parent.clientWidth : parent.clientHeight) : 0;
          },
        }
      : null;
    return {
      side: physicalSide(this.side(), this.theme.value().dir),
      align: this.align(),
      sideOffset: this.sideOffset() + (arrow?.height ?? 0),
      padding: root ? foldCollision(root, this.anchor(), this.collisionPadding()) : this.collisionPadding(),
      arrow,
    };
  }

  /** The arrow wrapper's style, as Radix's PopperArrow writes it. */
  private placeArrow(result: PopperResult): void {
    const wrap = this.arrowWrap();
    if (!wrap) return;
    const base = oppositeSide[result.side];
    const parts = ['position: absolute'];
    if (result.arrowX !== undefined && base !== 'left') parts.push(`left: ${result.arrowX}px`);
    if (result.arrowY !== undefined && base !== 'top') parts.push(`top: ${result.arrowY}px`);
    parts.push(`${base}: 0px`);
    const t = arrowTransform[result.side];
    if (t.origin) parts.push(`transform-origin: ${t.origin}`);
    parts.push(`transform: ${t.transform}`);
    if (result.arrowCenterOffset !== undefined && result.arrowCenterOffset !== 0) parts.push('visibility: hidden');
    wrap.style.cssText = parts.join('; ') + ';';
  }

  private show(): void {
    const reopening = this.layer.mounted();
    if (!reopening) {
      const active = this.doc.activeElement;
      this.openedFrom = active instanceof HTMLElement && active !== this.doc.body ? active : null;
    }
    this.layer.open();
    if (reopening) return;
    this.listen();
    afterNextRender(
      () => {
        this.layer.place();
        const root = this.root();
        if (root && untracked(this.popover.open)) (popoverInitialFocus(root) ?? root).focus();
      },
      { injector: this.injector },
    );
  }

  private hide(): void {
    if (!this.layer.mounted()) return;
    const root = this.root();
    const active = this.doc.activeElement;
    // Focus moved on while this popover closed (another popover opened, or the person went on): leave it there.
    const back = !active || active === this.doc.body || (root?.contains(active) ?? false);
    this.stopListening();
    this.layer.close();
    if (!back) {
      this.openedFrom = null;
      return;
    }
    const trigger = this.popover.trigger;
    const target = trigger?.isConnected ? trigger : this.openedFrom;
    this.openedFrom = null;
    if (target?.isConnected) target.focus();
  }

  private listen(): void {
    const down = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || this.layer.contains(target)) return;
      // The trigger toggles on its own click; the anchor and a menu opened from inside are not outside.
      const trigger = this.popover.trigger;
      if (trigger?.contains(target)) return;
      if (target instanceof Element && target.closest('[data-menu-layer]')) return;
      if (isInsideToaster(target)) return;
      this.popover.setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (isInsideToaster(event.target)) return;
      // The top popover only: one opened later takes the key first.
      if (!this.isTopPopover()) return;
      event.preventDefault();
      this.popover.setOpen(false);
    };
    const focus = (event: FocusEvent) => {
      const target = event.target as Node | null;
      if (!target || this.layer.contains(target)) return;
      if (this.popover.trigger?.contains(target)) return;
      if (target instanceof Element && target.closest('[data-menu-layer]')) return;
      if (isInsideToaster(target)) return;
      this.popover.setOpen(false);
    };
    this.doc.addEventListener('pointerdown', down, true);
    this.doc.addEventListener('keydown', key, true);
    this.doc.addEventListener('focusin', focus);
    openPopovers.push(this);
    this.undo = [
      () => this.doc.removeEventListener('pointerdown', down, true),
      () => this.doc.removeEventListener('keydown', key, true),
      () => this.doc.removeEventListener('focusin', focus),
      () => {
        const i = openPopovers.indexOf(this);
        if (i >= 0) openPopovers.splice(i, 1);
      },
    ];
  }

  private stopListening(): void {
    for (const fn of this.undo.reverse()) fn();
    this.undo = [];
  }

  private isTopPopover(): boolean {
    return openPopovers[openPopovers.length - 1] === this;
  }
}

/** The open popovers, the newest last: Escape belongs to the newest. */
const openPopovers: DsPopoverContent[] = [];

/** Everything a template needs for a popover. */
export const DS_POPOVER = [
  DsPopover,
  DsPopoverTrigger,
  DsPopoverAnchor,
  DsPopoverClose,
  DsPopoverContent,
  DsPopoverBody,
  DsPopoverFooter,
] as const;
