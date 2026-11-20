// The popup layer of the list family (Combobox, Autocomplete, Select,
// MultiSelect, TagField): the same DOM and the same pixels as React, where
// the popup is a Radix Popover or Select Content portaled in a themed layer:
//
//   <body>
//     <div data-ds="theme" data-menu-layer ...axes>     the host of DsPopupLayer, drawn as contents
//       <div data-radix-popper-content-wrapper style="position: fixed; ... transform: translate(x, y); ...">
//         <div data-ds="<owner>" data-part="popup|content" data-side data-align data-state ...>   the owner's template
//
// Why not the CDK Overlay: its container, host and pane elements are not in
// the React DOM, and its positions do not match the Radix pixels. The layer
// is a CDK ComponentPortal attached to document.body through a
// DomPortalOutlet (the Dialog pattern), its host element is the themed
// wrapper itself. The position is computed here by hand with the same
// steps, in the same order, as the Floating UI middleware Radix Popper runs
// (offset, shift with limitShift, flip, size, transformOrigin), so the
// wrapper style, data-side and data-align equal the React ones. Angular Aria
// has no positioning of its own, so this stays when @angular/aria arrives.
//
// Order A5 (Popover): the padding may differ per side (the fold and the side
// column as collision padding, foldPadding in @the-system/shared), an arrow
// step runs after size as Floating UI's arrow middleware, and the transform
// origin then follows the arrow as Radix's transformOrigin middleware does.
// The layer component can be another one with the same wrapper and content
// (the Popover's `div[data-popover-layer]`).
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  InjectionToken,
  Injector,
  afterNextRender,
  inject,
  signal,
  type Signal,
  type StaticProvider,
  type TemplateRef,
  type Type,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { Directionality } from '@angular/cdk/bidi';
import { ComponentPortal, DomPortalOutlet } from '@angular/cdk/portal';
import { exitGhost } from '@the-system/motion';
import { paddingOf, type PhysicalPadding } from '@the-system/shared';
import { DsLayerTheme, DsThemeService, layerThemeProviders, syncDirectionality } from '../theme';
import type { ThemeValue } from '../theme';

// ------------------------------------------------------------------ position

export type PopperSide = 'top' | 'right' | 'bottom' | 'left';
export type PopperAlign = 'start' | 'center' | 'end';
type Axis = 'x' | 'y';
type Length = 'width' | 'height';

export interface PopperRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PopperOptions {
  side: PopperSide;
  align: PopperAlign;
  /** Gap between the anchor and the popup, in CSS px. */
  sideOffset: number;
  /** Space kept from the viewport edge, in CSS px: one number, or per physical side. */
  padding: number | PhysicalPadding;
  rtl: boolean;
  /** The arrow, measured: its box and the inner size of its offset parent along an axis. */
  arrow?: PopperArrow | null;
}

export interface PopperArrow {
  width: number;
  height: number;
  /** clientWidth (x) or clientHeight (y) of the arrow's offset parent; 0 when unknown. */
  clientSize: (axis: 'x' | 'y') => number;
}

export interface PopperResult {
  x: number;
  y: number;
  side: PopperSide;
  align: PopperAlign;
  availableWidth: number;
  availableHeight: number;
  anchorWidth: number;
  anchorHeight: number;
  origin: string;
  /** With an arrow: its place along the side (x for top and bottom, y for left and right), and the offset Radix hides it at when not 0. */
  arrowX?: number;
  arrowY?: number;
  arrowCenterOffset?: number;
}

interface Overflow {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const opposite: Record<string, string> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left', start: 'end', end: 'start' };
const sideOf = (p: string) => p.split('-')[0] as PopperSide;
const alignOf = (p: string) => p.split('-')[1] as 'start' | 'end' | undefined;
const sideAxis = (p: string): Axis => (sideOf(p) === 'top' || sideOf(p) === 'bottom' ? 'y' : 'x');
const otherAxis = (a: Axis): Axis => (a === 'x' ? 'y' : 'x');
const lengthOf = (a: Axis): Length => (a === 'y' ? 'height' : 'width');
const clamp = (min: number, v: number, max: number) => Math.max(min, Math.min(v, max));
const oppositePlacement = (p: string) => p.replace(/left|right|bottom|top/g, (s) => opposite[s] as string);
const oppositeAlignment = (p: string) => p.replace(/start|end/g, (s) => opposite[s] as string);

function coordsFromPlacement(ref: PopperRect, fl: { width: number; height: number }, placement: string, rtl: boolean) {
  const sAxis = sideAxis(placement);
  const aAxis = otherAxis(sAxis);
  const aLen = lengthOf(aAxis);
  const vertical = sAxis === 'y';
  const commonX = ref.x + ref.width / 2 - fl.width / 2;
  const commonY = ref.y + ref.height / 2 - fl.height / 2;
  const commonAlign = ref[aLen] / 2 - fl[aLen] / 2;
  let c: { x: number; y: number };
  switch (sideOf(placement)) {
    case 'top':
      c = { x: commonX, y: ref.y - fl.height };
      break;
    case 'bottom':
      c = { x: commonX, y: ref.y + ref.height };
      break;
    case 'right':
      c = { x: ref.x + ref.width, y: commonY };
      break;
    default:
      c = { x: ref.x - fl.width, y: commonY };
  }
  const align = alignOf(placement);
  if (align === 'start') c[aAxis] -= commonAlign * (rtl && vertical ? -1 : 1);
  if (align === 'end') c[aAxis] += commonAlign * (rtl && vertical ? -1 : 1);
  return c;
}

/** The viewport Floating UI clips a fixed popup to. */
export function viewportRect(doc: Document): PopperRect {
  const win = doc.defaultView;
  const html = doc.documentElement;
  const vv = win?.visualViewport;
  if (vv) return { x: vv.offsetLeft, y: vv.offsetTop, width: vv.width, height: vv.height };
  return { x: 0, y: 0, width: html.clientWidth, height: html.clientHeight };
}

/**
 * Where a fixed popup goes, by the steps Radix Popper asks of Floating UI.
 * `measure` returns the popup size; `apply` runs the size step (it sets the
 * available size variables, which may change the popup size).
 */
export function computePopper(
  reference: PopperRect,
  measure: () => { width: number; height: number },
  clip: PopperRect,
  options: PopperOptions,
  apply: (r: { availableWidth: number; availableHeight: number; anchorWidth: number; anchorHeight: number }) => void,
): PopperResult {
  const { rtl } = options;
  const pad = paddingOf(options.padding);
  const initial = options.side + (options.align !== 'center' ? `-${options.align}` : '');
  let placement = initial;
  let floating = measure();
  let { x, y } = coordsFromPlacement(reference, floating, placement, rtl);
  const data: {
    offset?: { x: number; y: number; placement: string };
    flip?: { index: number; overflows: { placement: string; overflows: number[] }[] };
    arrow?: { x?: number; y?: number; centerOffset: number; alignmentOffset?: number };
  } = {};
  let available = { availableWidth: 0, availableHeight: 0 };
  let origin = ' ';
  const overflowAt = (px: number, py: number): Overflow => ({
    top: clip.y - py + pad.top,
    bottom: py + floating.height - (clip.y + clip.height) + pad.bottom,
    left: clip.x - px + pad.left,
    right: px + floating.width - (clip.x + clip.width) + pad.right,
  });

  const steps: (() => { reset?: { placement?: string; rects?: boolean } } | void)[] = [
    // offset
    () => {
      // After the arrow moved the popup to keep an aligned arrow on the anchor, the offset is in already.
      if (data.offset?.placement === placement && data.arrow?.alignmentOffset) return;
      const side = sideOf(placement);
      const multi = side === 'top' || side === 'left' ? -1 : 1;
      const diff = sideAxis(placement) === 'y' ? { x: 0, y: options.sideOffset * multi } : { x: options.sideOffset * multi, y: 0 };
      x += diff.x;
      y += diff.y;
      data.offset = { ...diff, placement };
    },
    // shift, main axis only, with limitShift
    () => {
      const cAxis = sideAxis(placement);
      const mAxis = otherAxis(cAxis);
      const o = overflowAt(x, y);
      const coords = { x, y };
      const minSide = mAxis === 'y' ? 'top' : 'left';
      const maxSide = mAxis === 'y' ? 'bottom' : 'right';
      coords[mAxis] = clamp(coords[mAxis] + o[minSide], coords[mAxis], coords[mAxis] - o[maxSide]);
      // limitShift
      const mLen = lengthOf(mAxis);
      const mMin = reference[mAxis] - floating[mLen];
      const mMax = reference[mAxis] + reference[mLen];
      if (coords[mAxis] < mMin) coords[mAxis] = mMin;
      else if (coords[mAxis] > mMax) coords[mAxis] = mMax;
      const cLen = lengthOf(cAxis);
      const originSide = sideOf(placement) === 'top' || sideOf(placement) === 'left';
      const offset = data.offset?.[cAxis] ?? 0;
      const cMin = reference[cAxis] - floating[cLen] + (originSide ? offset : 0);
      const cMax = reference[cAxis] + reference[cLen] + (originSide ? 0 : offset);
      if (coords[cAxis] < cMin) coords[cAxis] = cMin;
      else if (coords[cAxis] > cMax) coords[cAxis] = cMax;
      x = coords.x;
      y = coords.y;
    },
    // flip, with the expanded placements of a start or end alignment
    () => {
      const align = alignOf(initial);
      const fallbacks = align ? [oppositeAlignment(initial), oppositePlacement(initial), oppositeAlignment(oppositePlacement(initial))] : [oppositePlacement(initial)];
      const placements = [initial, ...fallbacks];
      const o = overflowAt(x, y);
      const side = sideOf(placement);
      const overflows = [o[side]];
      // the cross axis: the alignment sides
      const a = alignOf(placement);
      const aAxis = otherAxis(sideAxis(placement));
      const aLen = lengthOf(aAxis);
      let main: PopperSide = aAxis === 'x' ? (a === (rtl ? 'end' : 'start') ? 'right' : 'left') : a === 'start' ? 'bottom' : 'top';
      if (reference[aLen] > floating[aLen]) main = opposite[main] as PopperSide;
      overflows.push(o[main], o[opposite[main] as PopperSide]);
      const all = [...(data.flip?.overflows ?? []), { placement, overflows }];
      if (!overflows.every((v) => v <= 0)) {
        const nextIndex = (data.flip?.index ?? 0) + 1;
        const next = placements[nextIndex];
        if (next) {
          data.flip = { index: nextIndex, overflows: all };
          return { reset: { placement: next } };
        }
        let reset = all
          .filter((d) => (d.overflows[0] ?? 0) <= 0)
          .sort((p, q) => (p.overflows[1] ?? 0) - (q.overflows[1] ?? 0))[0]?.placement;
        if (!reset) {
          reset = all
            .map((d) => [d.placement, d.overflows.filter((v) => v > 0).reduce((s, v) => s + v, 0)] as const)
            .sort((p, q) => p[1] - q[1])[0]?.[0];
        }
        if (reset && placement !== reset) {
          data.flip = { index: data.flip?.index ?? 0, overflows: all };
          return { reset: { placement: reset } };
        }
      }
      return undefined;
    },
    // size
    () => {
      const o = overflowAt(x, y);
      const side = sideOf(placement);
      const a = alignOf(placement);
      let heightSide: PopperSide;
      let widthSide: PopperSide;
      if (side === 'top' || side === 'bottom') {
        heightSide = side;
        widthSide = a === (rtl ? 'start' : 'end') ? 'left' : 'right';
      } else {
        widthSide = side;
        heightSide = a === 'end' ? 'top' : 'bottom';
      }
      const maxHeight = floating.height - o.top - o.bottom;
      const maxWidth = floating.width - o.left - o.right;
      let availableHeight = Math.min(floating.height - o[heightSide], maxHeight);
      let availableWidth = Math.min(floating.width - o[widthSide], maxWidth);
      // shift is on for the main axis only
      if (sideAxis(placement) === 'y') availableWidth = maxWidth;
      else availableHeight = maxHeight;
      available = { availableWidth, availableHeight };
      apply({ availableWidth, availableHeight, anchorWidth: reference.width, anchorHeight: reference.height });
      const next = measure();
      if (next.width !== floating.width || next.height !== floating.height) return { reset: { rects: true } };
      return undefined;
    },
    // arrow (Floating UI's arrow middleware, padding 0)
    () => {
      const arrow = options.arrow;
      if (!arrow) return undefined;
      const axis = otherAxis(sideAxis(placement));
      const len = lengthOf(axis);
      const own = { width: arrow.width, height: arrow.height };
      const coords = { x, y };
      const endDiff = reference[len] + reference[axis] - coords[axis] - floating[len];
      const startDiff = coords[axis] - reference[axis];
      const clientSize = arrow.clientSize(axis) || floating[len];
      const centerToReference = endDiff / 2 - startDiff / 2;
      const largest = clientSize / 2 - own[len] / 2 - 1;
      const minPadding = Math.min(0, largest);
      const maxPadding = Math.min(0, largest);
      const min = minPadding;
      const max = clientSize - own[len] - maxPadding;
      const center = clientSize / 2 - own[len] / 2 + centerToReference;
      const offset = clamp(min, center, max);
      const shouldAdd =
        !data.arrow &&
        alignOf(placement) !== undefined &&
        center !== offset &&
        reference[len] / 2 - (center < min ? minPadding : maxPadding) - own[len] / 2 < 0;
      const alignmentOffset = shouldAdd ? (center < min ? center - min : center - max) : 0;
      coords[axis] += alignmentOffset;
      x = coords.x;
      y = coords.y;
      data.arrow = { ...(axis === 'x' ? { x: offset } : { y: offset }), centerOffset: center - offset - alignmentOffset, ...(shouldAdd ? { alignmentOffset } : {}) };
      return shouldAdd ? { reset: {} } : undefined;
    },
    // transformOrigin, as Radix writes it, with the arrow when there is one
    () => {
      const side = sideOf(placement);
      const noArrow = { start: '0%', center: '50%', end: '100%' }[alignOf(placement) ?? 'center'];
      const hidden = !options.arrow || data.arrow?.centerOffset !== 0;
      const aw = hidden ? 0 : (options.arrow?.width ?? 0);
      const ah = hidden ? 0 : (options.arrow?.height ?? 0);
      const xCenter = `${(data.arrow?.x ?? 0) + aw / 2}px`;
      const yCenter = `${(data.arrow?.y ?? 0) + ah / 2}px`;
      if (side === 'bottom') origin = `${hidden ? noArrow : xCenter} ${-ah}px`;
      else if (side === 'top') origin = `${hidden ? noArrow : xCenter} ${floating.height + ah}px`;
      else if (side === 'right') origin = `${-ah}px ${hidden ? noArrow : yCenter}`;
      else origin = `${floating.width + ah}px ${hidden ? noArrow : yCenter}`;
    },
  ];

  let resets = 0;
  for (let i = 0; i < steps.length; i += 1) {
    const r = (steps[i] as () => { reset?: { placement?: string; rects?: boolean } } | void)();
    if (r?.reset && resets <= 50) {
      resets += 1;
      // An empty reset (the arrow's) runs the steps again from where the popup is, as Floating UI's `reset: true`.
      if (r.reset.placement || r.reset.rects) {
        if (r.reset.placement) placement = r.reset.placement;
        if (r.reset.rects) floating = measure();
        ({ x, y } = coordsFromPlacement(reference, floating, placement, rtl));
      }
      i = -1;
    }
  }
  return {
    x,
    y,
    side: sideOf(placement),
    align: alignOf(placement) ?? 'center',
    ...available,
    anchorWidth: reference.width,
    anchorHeight: reference.height,
    origin,
    ...(data.arrow ? { arrowX: data.arrow.x, arrowY: data.arrow.y, arrowCenterOffset: data.arrow.centerOffset } : {}),
  };
}

// ------------------------------------------------------------------ the layer

interface LayerData {
  template: Signal<TemplateRef<unknown> | null>;
  theme: Signal<ThemeValue>;
}

const POPUP_LAYER = new InjectionToken<LayerData>('DS_POPUP_LAYER');

/** What PopupLayer needs of its layer component: the themed host, the Radix wrapper and the popup root in it. */
export interface PopupLayerHost {
  readonly host: HTMLElement;
  readonly wrapper: HTMLElement;
  readonly content: HTMLElement | null;
}

/** The themed portal wrapper and the Radix popper wrapper around the owner's template. Internal. */
@Component({
  selector: 'div[data-menu-layer]',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: layerThemeProviders(() => inject(POPUP_LAYER).theme),
  hostDirectives: [DsLayerTheme],
  host: {
  },
  template: `<div data-radix-popper-content-wrapper=""><ng-container [ngTemplateOutlet]="data.template()" /></div>`,
})
export class DsPopupLayer implements PopupLayerHost {
  protected readonly data = inject(POPUP_LAYER);
  private readonly theme = inject(DsThemeService);
  readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    syncDirectionality(inject(Directionality), this.theme.value);
  }

  get wrapper(): HTMLElement {
    return this.host.firstElementChild as HTMLElement;
  }

  get content(): HTMLElement | null {
    return this.wrapper?.firstElementChild as HTMLElement | null;
  }
}

export interface PopupLayerOptions {
  /** The popup template. Its root element is the popup root (Radix Content). */
  template: () => TemplateRef<unknown> | null;
  /** The element the popup is placed against (Radix Anchor or Trigger). */
  anchor: () => HTMLElement | null;
  side?: PopperSide;
  align?: PopperAlign;
  sideOffset: number;
  padding: number;
  /** A dir attribute for the Radix wrapper (Radix Select passes one, Popover does not). */
  wrapperDir?: () => string | null;
  /** Another layer component (order A5: the Popover's), with the providers it injects. Default DsPopupLayer. */
  component?: Type<PopupLayerHost>;
  providers?: () => StaticProvider[];
  /** Read on every placement, over the fixed options: inputs that change while open, the fold padding, the arrow. */
  resolve?: () => { side?: PopperSide; align?: PopperAlign; sideOffset?: number; padding?: number | PhysicalPadding; arrow?: PopperArrow | null };
  /** After each placement, with the result (the arrow's place). */
  placed?: (result: PopperResult) => void;
}

/**
 * Mounts a popup in a themed layer at the end of body, places it like Radix
 * Popper, keeps it placed while the page scrolls or resizes, and removes it
 * on close. Review B6 (order 1.23): the real popup leaves the DOM at once on
 * close (once it has rendered data-state="closed") and an inert aria-hidden
 * copy plays the exit (exitGhost), so a press on the trigger during the exit
 * opens it again at once. Create one per owner, in an injection context.
 */
export class PopupLayer {
  private readonly injector = inject(Injector);
  private readonly appRef = inject(ApplicationRef);
  private readonly theme = inject(DsThemeService);
  private readonly dir = inject(Directionality);
  private readonly doc = inject(DOCUMENT);
  private outlet: DomPortalOutlet | null = null;
  private layer: PopupLayerHost | null = null;
  private undo: (() => void)[] = [];
  private generation = 0;
  private readonly template = signal<TemplateRef<unknown> | null>(null);

  /** The placed side and alignment while mounted, for data-side and the anchor's data-radix-popper-side. */
  readonly side = signal<PopperSide | null>(null);
  readonly align = signal<PopperAlign | null>(null);
  /** True while the popup plays its exit. */
  readonly closing = signal(false);
  readonly mounted = signal(false);

  constructor(private readonly options: PopupLayerOptions) {}

  /** The popup root, while mounted. */
  get content(): HTMLElement | null {
    return this.layer?.content ?? null;
  }

  /** True when the node is inside the popup layer. */
  contains(node: Node | null): boolean {
    return !!node && !!this.layer && this.layer.host.contains(node);
  }

  open(): void {
    this.generation += 1;
    if (this.layer) {
      this.closing.set(false);
      return;
    }
    this.template.set(this.options.template());
    const injector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: POPUP_LAYER, useValue: { template: this.template, theme: this.theme.value } satisfies LayerData },
        ...(this.options.providers?.() ?? []),
      ],
    });
    this.outlet = new DomPortalOutlet(this.doc.body, this.appRef, injector);
    const ref = this.outlet.attach(new ComponentPortal(this.options.component ?? DsPopupLayer, null, injector));
    ref.changeDetectorRef.detectChanges();
    this.layer = ref.instance;
    this.mounted.set(true);
    const content = this.layer.content;
    const wrapper = this.layer.wrapper;
    const dir = this.options.wrapperDir?.();
    if (dir) wrapper.setAttribute('dir', dir);
    const zIndex = content ? (this.doc.defaultView?.getComputedStyle(content).zIndex ?? 'auto') : 'auto';
    // The same properties, in the same order, as the Radix wrapper style.
    wrapper.style.setProperty('position', 'fixed');
    wrapper.style.setProperty('left', '0px');
    wrapper.style.setProperty('top', '0px');
    wrapper.style.setProperty('transform', 'translate(0, -200%)');
    wrapper.style.setProperty('min-width', 'max-content');
    wrapper.style.setProperty('--radix-popper-transform-origin', ' ');
    if (zIndex !== 'auto') wrapper.style.setProperty('z-index', zIndex);
    this.place();

    const update = () => this.place();
    const win = this.doc.defaultView;
    win?.addEventListener('scroll', update, { capture: true, passive: true });
    win?.addEventListener('resize', update);
    this.undo.push(() => {
      win?.removeEventListener('scroll', update, { capture: true });
      win?.removeEventListener('resize', update);
    });
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(update);
      const anchor = this.options.anchor();
      if (anchor) observer.observe(anchor);
      observer.observe(wrapper);
      this.undo.push(() => observer.disconnect());
    }
  }

  /** Places the popup against the anchor. */
  place(): void {
    const wrapper = this.layer?.wrapper;
    const anchor = this.options.anchor();
    if (!wrapper || !anchor) return;
    const win = this.doc.defaultView;
    const r = anchor.getBoundingClientRect();
    const measure = () => {
      const css = win?.getComputedStyle(wrapper);
      let width = parseFloat(css?.width ?? '') || 0;
      let height = parseFloat(css?.height ?? '') || 0;
      if (Math.round(width) !== wrapper.offsetWidth || Math.round(height) !== wrapper.offsetHeight) {
        width = wrapper.offsetWidth;
        height = wrapper.offsetHeight;
      }
      return { width, height };
    };
    const over = this.options.resolve?.() ?? {};
    const result = computePopper(
      { x: r.x, y: r.y, width: r.width, height: r.height },
      measure,
      viewportRect(this.doc),
      {
        side: over.side ?? this.options.side ?? 'bottom',
        align: over.align ?? this.options.align ?? 'start',
        sideOffset: over.sideOffset ?? this.options.sideOffset,
        padding: over.padding ?? this.options.padding,
        rtl: (win?.getComputedStyle(wrapper).direction ?? this.dir.valueSignal()) === 'rtl',
        arrow: over.arrow ?? null,
      },
      (s) => {
        wrapper.style.setProperty('--radix-popper-available-width', `${s.availableWidth}px`);
        wrapper.style.setProperty('--radix-popper-available-height', `${s.availableHeight}px`);
        wrapper.style.setProperty('--radix-popper-anchor-width', `${s.anchorWidth}px`);
        wrapper.style.setProperty('--radix-popper-anchor-height', `${s.anchorHeight}px`);
      },
    );
    const dpr = win?.devicePixelRatio ?? 1;
    const round = (v: number) => Math.round(v * dpr) / dpr;
    wrapper.style.setProperty('transform', `translate(${round(result.x)}px, ${round(result.y)}px)`);
    wrapper.style.setProperty('--radix-popper-transform-origin', result.origin);
    const content = this.layer?.content;
    if (content) {
      content.setAttribute('data-side', result.side);
      content.setAttribute('data-align', result.align);
    }
    this.side.set(result.side);
    this.align.set(result.align);
    this.options.placed?.(result);
  }

  /** Removes the layer; an inert copy plays the exit (the owner's data-state="closed" and inert drive it). */
  close(): void {
    const layer = this.layer;
    if (!layer) return;
    const generation = this.generation;
    this.closing.set(true);
    // Let the owner render data-state="closed" first, then leave at once and leave the exit to a copy.
    afterNextRender(
      () => {
        if (generation !== this.generation || this.layer !== layer) return;
        exitGhost(layer.content);
        this.dispose();
      },
      { injector: this.injector },
    );
  }

  /** Removes the layer at once. */
  dispose(): void {
    for (const fn of this.undo.reverse()) fn();
    this.undo = [];
    // detach, not dispose: DomPortalOutlet.dispose removes its outlet element, here document.body.
    this.outlet?.detach();
    this.outlet = null;
    this.layer = null;
    this.closing.set(false);
    this.mounted.set(false);
    this.side.set(null);
    this.align.set(null);
  }
}
