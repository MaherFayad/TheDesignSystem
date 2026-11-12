'use client';
// SegmentedControl: one choice among two to five views or modes, always one
// selected. A track holds the items; a thumb (the indicator) sits under the
// selected one and slides to the next with the `tab-indicator` pattern.
//
// Sources: Figma-Killer-2 `SegmentedControl` (the track: an overlay fill, a
// hairline and a small inset; the selected segment a stronger overlay) and
// `RangeTabs`, GoBanana site `PricingToggle.tsx`.
//
// Behavior from Radix ToggleGroup type single: role radiogroup with radio
// items (aria-checked), roving focus, arrows follow the reading direction.
// Two changes: the value never goes empty (a press on the selected item is
// ignored), and selection follows focus (an arrow key selects).
//
// The items are drawn on the Button base as ToggleButton roots carrying
// data-part="item"; SegmentedControl.css restyles them through Button's
// private properties. The indicator is measured from the selected item and
// placed with logical private properties, so RTL needs nothing more. It
// moves with `transform` only: interaction "tab-slide" (order 1.22,
// proposed), the shared pill of react/src/internal/indicator.ts, slides it
// from where it is drawn (a second change mid travel starts there) on the
// snappy spring, stretched along its travel, and the label it leaves dips
// while the one it reaches pops. No motion under reduced motion, where it
// jumps.
import {
  createContext,
  use,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';
import { ToggleGroup as RadixToggleGroup } from 'radix-ui';
import { settle } from '@the-system/motion';
import { answerLabels, slideTo } from '../../internal/indicator';
import { useMotion } from '../../internal/motion';
import type { Shape, Size } from '@the-system/shared';
import { ButtonGroupContext, type ButtonGroupContextValue } from '../ButtonGroup/ButtonGroupContext';
import { ButtonRoot, renderSlotContent, type ButtonBaseProps, type ButtonSlotContent } from '../Button/ButtonBase';
import { useTheme } from '../../theme';
import { GroupDisabledContext, moveFromInertItem, useGroupDisabled } from '../ToggleGroup/inertItems';

export type SegmentedControlSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export type SegmentedControlShape = Extract<Shape, 'default' | 'pill' | 'square'>;

interface SegmentedControlOwnProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role' | 'dir' | 'defaultValue' | 'onChange' | 'children'> {
  /** SegmentedControlItems. Two to five. */
  children?: ReactNode;
  /** The selected value, controlled. Pair with `onValueChange`. */
  value?: string;
  /** The value selected at first, uncontrolled. Set it: one item is always selected. */
  defaultValue?: string;
  /** Called with the new value. Never called with an empty value. */
  onValueChange?: (value: string) => void;
  /** Height of the whole control from size.control: 24, 28, 32 and 44 px in the default density. Default md. */
  size?: SegmentedControlSize;
  /** pill is fully round, default takes radius.control, square takes radius.sm. Default pill. */
  shape?: SegmentedControlShape;
  /** Every item is disabled; items keep focus and aria-disabled. Sets data-disabled on the root. Default false. */
  disabled?: boolean;
  /** Fills the width of its container; the items share it equally. Default false. Sets data-full-width. */
  fullWidth?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/** A control needs a name: `aria-label`, or `aria-labelledby` pointing at a visible heading. */
export type SegmentedControlProps = SegmentedControlOwnProps &
  ({ 'aria-label': string; 'aria-labelledby'?: string } | { 'aria-labelledby': string; 'aria-label'?: string });

interface SegmentedContextValue {
  select: (value: string) => void;
}

const SegmentedContext = createContext<SegmentedContextValue | null>(null);

const ITEM = ":scope > [data-part='item']";

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
  };
}

/**
 * One choice among two to five options, always one selected. Arrow keys move
 * the selection; the thumb slides to it.
 */
export function SegmentedControl({
  value,
  defaultValue,
  onValueChange,
  size = 'md',
  shape = 'pill',
  disabled = false,
  fullWidth = false,
  children,
  ref,
  onKeyDown,
  ...rest
}: SegmentedControlProps) {
  const { dir } = useTheme();
  const [inner, setInner] = useState(defaultValue ?? '');
  const current = value ?? inner;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const placed = useRef<string | null>(null);
  const frame = useRef('');
  const motion = useMotion();
  const modeRef = useRef(motion.mode);
  modeRef.current = motion.mode;
  const lastLabel = useRef<Element | null>(null);

  const select = useCallback(
    (next: string) => {
      // A press on the selected item would empty the value: ignore it.
      if (next === '' || next === current) return;
      if (value === undefined) setInner(next);
      onValueChange?.(next);
    },
    [current, value, onValueChange],
  );

  // Puts the thumb under the selected item. Slides from where it was when
  // the value changed and the thumb was already placed; jumps otherwise.
  const place = useCallback(
    (slide: boolean) => {
      const root = rootRef.current;
      const thumb = indicatorRef.current;
      if (!root || !thumb) return;
      const item = Array.from(root.querySelectorAll<HTMLElement>(ITEM)).find((el) => el.getAttribute('data-state') === 'on');
      if (!item) {
        thumb.hidden = true;
        frame.current = '';
        return;
      }
      const f = measure(root, item);
      const key = `${f.start} ${f.top} ${f.inline} ${f.block}`;
      // Same frame and no slide asked: leave a running slide alone.
      if (!slide && key === frame.current && !thumb.hidden) return;
      frame.current = key;
      const from = slide && !thumb.hidden ? thumb.getBoundingClientRect() : null;
      settle(thumb);
      thumb.style.setProperty('--_segmented-control-indicator-start', `${f.start}px`);
      thumb.style.setProperty('--_segmented-control-indicator-top', `${f.top}px`);
      thumb.style.setProperty('--_segmented-control-indicator-inline-size', `${f.inline}px`);
      thumb.style.setProperty('--_segmented-control-indicator-block-size', `${f.block}px`);
      thumb.hidden = false;
      const label = item.querySelector(':scope > [data-part="label"], :scope > [data-part="icon"]');
      if (from) {
        const mode = modeRef.current('tab-slide');
        slideTo({ el: thumb }, from, thumb.getBoundingClientRect(), { mode, axis: 'x' });
        answerLabels(lastLabel.current, label, mode);
      }
      lastLabel.current = label;
    },
    [],
  );

  // On every value change: slide when it changed after the first placing.
  useLayoutEffect(() => {
    const slide = placed.current !== null && placed.current !== current;
    place(slide);
    placed.current = current;
  }, [current, place]);

  // Sizes change with density, font loading, the label and the container: jump.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => place(false));
    ro.observe(root);
    for (const item of root.querySelectorAll<HTMLElement>(ITEM)) ro.observe(item);
    return () => ro.disconnect();
  }, [place, children]);

  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      rootRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  const axes = useMemo<ButtonGroupContextValue>(() => ({ size }), [size]);
  const ctx = useMemo<SegmentedContextValue>(() => ({ select }), [select]);

  return (
    <RadixToggleGroup.Root
      {...rest}
      ref={setRef}
      type="single"
      value={current}
      onValueChange={select}
      dir={dir}
      orientation="horizontal"
      onKeyDown={(event) => {
        onKeyDown?.(event);
        moveFromInertItem(event, { orientation: 'horizontal', dir, loop: true });
      }}
      data-ds="segmented-control"
      data-size={size}
      data-shape={shape}
      aria-disabled={disabled ? true : undefined}
      data-disabled={disabled ? '' : undefined}
      data-full-width={fullWidth ? '' : undefined}
    >
      <span ref={indicatorRef} data-part="indicator" aria-hidden="true" hidden />
      <GroupDisabledContext value={disabled}>
        <ButtonGroupContext value={axes}>
          <SegmentedContext value={ctx}>{children}</SegmentedContext>
        </ButtonGroupContext>
      </GroupDisabledContext>
    </RadixToggleGroup.Root>
  );
}


export interface SegmentedControlItemProps
  extends Omit<ButtonBaseProps, 'loading' | 'loadingLabel' | 'asChild' | 'type' | 'tone' | 'emphasis' | 'shape' | 'size' | 'value' | 'children'> {
  /** The value this item selects. Unique in the control. */
  value: string;
  /** The visible label: a short noun for the view or mode ("Month", "List"). */
  children?: ReactNode;
  /** Leading content before the label: an icon name or a node. */
  start?: ButtonSlotContent;
  /** The icon only form: the icon, with `label` as the accessible name. Children are ignored. */
  icon?: ButtonSlotContent;
  /** The accessible name of the icon only form (set as `aria-label`). Required with `icon`. */
  label?: string;
}

/**
 * One option of a SegmentedControl: a ToggleButton root with
 * `data-part="item"`, role radio and aria-checked. Focus selects it.
 */
export function SegmentedControlItem({ value, disabled = false, start, icon, label, children, onFocus, ...rest }: SegmentedControlItemProps) {
  const seg = use(SegmentedContext);
  const groupDisabled = useGroupDisabled();
  const inert = disabled || groupDisabled;
  const iconOnly = icon !== undefined;
  // Radix is not told about disabled: the item stays focusable and in the
  // arrow order (anatomy rule 5). ButtonRoot makes it inert, and focus on it
  // does not select it.
  return (
    <RadixToggleGroup.Item asChild value={value}>
      <ButtonRoot
        {...rest}
        disabled={inert}
        ds="toggle-button"
        data-part="item"
        iconOnly={iconOnly}
        defaultEmphasis="ghost"
        aria-label={iconOnly ? label : rest['aria-label']}
        onFocus={(event: FocusEvent<HTMLButtonElement>) => {
          onFocus?.(event);
          // Selection follows focus, so the arrow keys select.
          if (!inert) seg?.select(value);
        }}
        render={() =>
          iconOnly ? (
            <span data-part="icon">{renderSlotContent(icon)}</span>
          ) : (
            <>
              {start !== undefined && <span data-part="start">{renderSlotContent(start)}</span>}
              <span data-part="label">{children}</span>
            </>
          )
        }
      />
    </RadixToggleGroup.Item>
  );
}
