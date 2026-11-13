// SegmentedControl: one choice among two to five views or modes, always one
// selected. A track holds the items; a thumb (the indicator) sits under the
// selected one and slides to the next with the `tab-indicator` pattern. The
// twin of packages/react/src/components/SegmentedControl/SegmentedControl.tsx.
//
//   <div dsSegmentedControl aria-label="Calendar range" [(value)]="range">
//     <button dsSegmentedControlItem value="day">Day</button>
//     <button dsSegmentedControlItem value="week">Week</button>
//   </div>
//
// The host is the root with the Radix ToggleGroup type single DOM: role
// radiogroup, dir, data-orientation horizontal, the roving tab stop and
// outline none. Its first child is the indicator span; the items follow.
// Each item is a `button[dsSegmentedControlItem]` on the Button base
// (../toggle-group/group-item.ts), a ToggleButton root with
// data-part="item", role radio and aria-checked.
//
// Behavior, as React: the value never goes empty (a press on the selected
// item is ignored), and selection follows focus (an arrow key selects).
// Focus on a disabled item does not select it. Roving focus from
// behavior/roving-radio.ts, as ToggleGroup.
//
// The indicator is measured from the selected item after each render that
// changes the value, and placed with logical private properties, so RTL
// needs nothing more. It moves with `transform` only: interaction
// "tab-slide" (order 1.22, proposed), the shared pill of
// internal/indicator.ts, slides it from where it is drawn (a second change
// mid travel starts there) on the snappy spring, stretched along its
// travel. Round 3 (order 1.23): the labels no longer dip and pop; the text
// under the thumb takes the selected color where the thumb is, with the
// aria-hidden `label-ink` twins of nav-ink.ts in @the-system/motion. No motion under
// reduced motion, where it jumps. A ResizeObserver on the root
// and the items places it again (a jump) when sizes change.
//
// Names that differ from React: `onValueChange` is the `valueChange` output
// of `[(value)]`. `start` and `icon` take an icon name or a TemplateRef.
// Works with reactive and template forms (ControlValueAccessor).
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Directionality } from '@angular/cdk/bidi';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DsIcon } from '@the-system/icons/angular';
import { inFrame, planInk, planSlide, startSlide } from '@the-system/motion';
import type { Shape, Size } from '@the-system/shared';
import { RovingRadioGroup, type RovingRadioItem } from '../../behavior/roving-radio';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { DS_BUTTON_GROUP, type ButtonGroupAxes } from '../button-group/button-group-context';
import type { ButtonEmphasis } from '../button/button-base';
import { DS_TOGGLE_ITEM_GROUP, DsGroupItemBase, type ToggleItemGroup } from '../toggle-group/group-item';

export type SegmentedControlSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export type SegmentedControlShape = Extract<Shape, 'default' | 'pill' | 'square'>;

const ITEM = ":scope > [data-part='item']";
/** The parts whose color crosses under the thumb, of one item and of the whole control. */
const INKED_OWN = ':scope > :is([data-part="label"], [data-part="start"], [data-part="icon"])';
const INKED = `${ITEM} > :is([data-part="label"], [data-part="start"], [data-part="icon"])`;

/**
 * The frame of the selected item inside the root, in logical px from the
 * root's padding box. Read from the rects, then divided by the root's scale,
 * so a parent that animates scale (a Dialog opening) does not skew it.
 */
function measure(root: HTMLElement, item: HTMLElement) {
  const rr = root.getBoundingClientRect();
  const ir = item.getBoundingClientRect();
  // offsetWidth is a whole number: a ratio within 2% of 1 is rounding, not a scale.
  const ratio = (a: number, b: number) => (b > 0 && a > 0 && Math.abs(a / b - 1) > 0.02 ? a / b : 1);
  const sx = ratio(rr.width, root.offsetWidth);
  const sy = ratio(rr.height, root.offsetHeight);
  const cs = getComputedStyle(root);
  const rtl = cs.direction === 'rtl';
  const borderStart = Number.parseFloat(cs.borderInlineStartWidth) || 0;
  const borderTop = Number.parseFloat(cs.borderBlockStartWidth) || 0;
  return {
    start: (rtl ? rr.right - ir.right : ir.left - rr.left) / sx - borderStart,
    top: (ir.top - rr.top) / sy - borderTop,
    inline: ir.width / sx,
    block: ir.height / sy,
    /** The box the thumb rests in once placed, in viewport px: the item's (order 1.29, so nothing is read after the writes). */
    rect: { x: ir.x, y: ir.y, width: ir.width, height: ir.height },
  };
}

/**
 * One choice among two to five options, always one selected. Arrow keys move
 * the selection; the thumb slides to it. Name it with `aria-label` or
 * `aria-labelledby`.
 */
@Component({
  selector: 'div[dsSegmentedControl]',
  exportAs: 'dsSegmentedControl',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsSegmentedControl), multi: true },
    { provide: DS_BUTTON_GROUP, useFactory: () => inject(DsSegmentedControl).axes },
    { provide: DS_TOGGLE_ITEM_GROUP, useFactory: () => inject(DsSegmentedControl).context },
  ],
  host: {
    role: 'radiogroup',
    'data-ds': 'segmented-control',
    'data-orientation': 'horizontal',
    '[attr.dir]': 'dir.valueSignal()',
    '[style.outline]': '"none"',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-full-width]': 'fullWidth() ? "" : null',
    '(mousedown)': 'roving.onRootMousedown()',
    '(focusin)': 'roving.onRootFocusin($event)',
    '(focusout)': 'onFocusout()',
  },
  template: `<span #indicator data-part="indicator" aria-hidden="true" hidden></span><ng-content />`,
})
export class DsSegmentedControl implements ControlValueAccessor {
  /** The selected value. Two way: `[(value)]`. */
  readonly value = model<string | undefined>(undefined);
  /** The value selected at first, when `value` is not bound. Set it: one item is always selected. */
  readonly defaultValue = input<string | undefined>(undefined);
  /** Height of the whole control from size.control: 24, 28, 32 and 44 px in the default density. Default md. */
  readonly size = input<SegmentedControlSize>('md');
  /** pill is fully round, default takes radius.control, square takes radius.sm. Default pill. */
  readonly shape = input<SegmentedControlShape>('pill');
  /** Every item is disabled; items keep focus and aria-disabled. Default false. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Fills the width of its container; the items share it equally. Default false. */
  readonly fullWidth = input(false, { transform: booleanAttribute });

  protected readonly host = consumeHostAttributes([
    'dsSegmentedControl', 'value', 'defaultValue', 'size', 'shape', 'disabled', 'fullWidth',
  ]);
  protected readonly dir = inject(Directionality);
  private readonly indicator = viewChild.required<ElementRef<HTMLSpanElement>>('indicator');

  /** The selected value: the model, else defaultValue, moved by presses, focus and forms. */
  private readonly current = linkedSignal<string>(() => this.value() ?? this.defaultValue() ?? '');
  private readonly formDisabled = signal(false);
  private readonly items = signal<readonly RovingRadioItem[]>([]);
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly roving = new RovingRadioGroup({
    host: this.host,
    value: this.current,
    // Focus selects: the arrows move focus, and the item that takes it selects.
    select: () => {},
    orientation: signal('horizontal'),
    loop: signal(true),
    dir: this.dir,
  });

  readonly axes: ButtonGroupAxes = { size: this.size, emphasis: signal(undefined), shape: signal(undefined) };

  readonly context: ToggleItemGroup = {
    type: signal('single'),
    orientation: signal('horizontal'),
    disabled: this.isDisabled,
    roving: this.roving,
    isOn: (value) => this.current() === value,
    press: (value) => this.select(value),
    focused: (value) => this.select(value),
    register: (item) => {
      this.items.update((list) => [...list, item]);
      const leave = this.roving.register(item);
      return () => {
        this.items.update((list) => list.filter((i) => i !== item));
        leave();
      };
    },
  };

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  /** The value the indicator was last placed for; null before the first placing. */
  private placed: string | null = null;
  /** The last frame written, so a resize with the same frame leaves a running slide alone. */
  private frame = '';
  /** The label under the thumb: its color is the rest color once the thumb leaves it. */
  private lastLabel: Element | null = null;
  private readonly motion = injectMotion();

  constructor() {
    // On every value change: slide when it changed after the first placing.
    afterRenderEffect(() => {
      const value = this.current();
      untracked(() => {
        const slide = this.placed !== null && this.placed !== value;
        // Order 1.29 (review B14): a slide reads with every other list of
        // the render (inFrame) and writes after, as React.
        if (slide) inFrame(() => this.place(true));
        else this.place(false)?.();
        this.placed = value;
      });
    });
    // Sizes change with density, font loading, the label and the container: jump.
    const destroyRef = inject(DestroyRef);
    let observer: ResizeObserver | null = null;
    afterRenderEffect(() => {
      const items = this.items();
      untracked(() => {
        observer?.disconnect();
        if (typeof ResizeObserver === 'undefined') return;
        observer = new ResizeObserver(() => this.place(false)?.());
        observer.observe(this.host);
        for (const item of items) observer.observe(item.element);
      });
    });
    destroyRef.onDestroy(() => observer?.disconnect());
  }

  /**
   * Puts the thumb under the selected item. Slides from where it was when
   * asked and already placed; jumps otherwise. It reads, then returns its
   * writes (order 1.29, review B14), as place in React's SegmentedControl.
   */
  private place(slide: boolean): (() => void) | undefined {
    const thumb = this.indicator().nativeElement;
    if (!this.host.isConnected) return undefined;
    const item = Array.from(this.host.querySelectorAll<HTMLElement>(ITEM)).find((el) => el.getAttribute('data-state') === 'on');
    if (!item) {
      return () => {
        thumb.hidden = true;
        this.frame = '';
      };
    }
    const f = measure(this.host, item);
    const key = `${f.start} ${f.top} ${f.inline} ${f.block}`;
    // Same frame and no slide asked: leave a running slide alone.
    if (!slide && key === this.frame && !thumb.hidden) return undefined;
    this.frame = key;
    const from = slide && !thumb.hidden ? thumb.getBoundingClientRect() : null;
    const label = item.querySelector(':scope > [data-part="label"], :scope > [data-part="icon"]');
    // Read here: getAnimations updates style, so after the writes of another list it would cost a style pass.
    const running = typeof thumb.getAnimations === 'function' ? thumb.getAnimations() : [];
    const plan = from ? planSlide({ el: thumb }, from, f.rect, { mode: this.motion.mode('tab-slide'), axis: 'x' }) : null;
    // Round 3: the text under the thumb takes the selected color where the thumb is.
    const ink = from
      ? planInk({
          switch: '--_segmented-control-ink',
          slide: plan,
          to: f.rect,
          anchor: this.host,
          parts: Array.from(this.host.querySelectorAll(INKED)),
          reaching: Array.from(item.querySelectorAll(INKED_OWN)),
          restFrom: this.lastLabel,
          inkFrom: label,
          axis: 'x',
          indicator: thumb,
        })
      : null;
    return () => {
      for (const a of running) a.cancel();
      thumb.style.setProperty('--_segmented-control-indicator-start', `${f.start}px`);
      thumb.style.setProperty('--_segmented-control-indicator-top', `${f.top}px`);
      thumb.style.setProperty('--_segmented-control-indicator-inline-size', `${f.inline}px`);
      thumb.style.setProperty('--_segmented-control-indicator-block-size', `${f.block}px`);
      thumb.hidden = false;
      ink?.(startSlide({ el: thumb }, plan));
      this.lastLabel = label;
    };
  }

  /** A press or a focus on an item that is not inert. A press on the selected item would empty the value: ignored. */
  private select(next: string): void {
    if (next === '' || next === untracked(this.current)) return;
    this.current.set(next);
    this.value.set(next);
    this.onChange(next);
  }

  protected onFocusout(): void {
    this.roving.onRootFocusout();
    this.onTouched();
  }

  writeValue(value: string | null | undefined): void {
    this.current.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}

/**
 * One option of a SegmentedControl: a ToggleButton root with
 * data-part="item", role radio and aria-checked. Focus selects it.
 */
@Component({
  selector: 'button[dsSegmentedControlItem]',
  exportAs: 'dsSegmentedControlItem',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #slot let-content>
      @if (isIconName(content)) {
        <svg dsIcon [name]="content" size="md"></svg>
      } @else {
        <ng-container [ngTemplateOutlet]="content" />
      }
    </ng-template>
    @if (icon(); as content) {
      <span data-part="icon"><ng-container [ngTemplateOutlet]="slot" [ngTemplateOutletContext]="{ $implicit: content }" /></span>
    } @else {
      @if (start(); as content) {
        <span data-part="start"><ng-container [ngTemplateOutlet]="slot" [ngTemplateOutletContext]="{ $implicit: content }" /></span>
      }
      <span data-part="label"><ng-content /></span>
    }
    <span data-part="hit" aria-hidden="true"></span>
  `,
})
export class DsSegmentedControlItem extends DsGroupItemBase {
  /** Not an input: items are always ghost, as React leaves emphasis out of the item props. */
  readonly emphasis = signal<ButtonEmphasis | undefined>(undefined).asReadonly();

  protected readonly defaultEmphasis: ButtonEmphasis = 'ghost';

  constructor() {
    super();
    consumeHostAttributes(['dsSegmentedControlItem']);
  }
}

/** The control and its item, for `imports`. */
export const DS_SEGMENTED_CONTROL = [DsSegmentedControl, DsSegmentedControlItem] as const;
