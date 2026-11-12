'use client';
// ScrubInput: the Studio inspector number. Drag the label to scrub, type a
// value or an expression (`12*2`), or nudge with the arrow keys.
//
// Source: Figma-Killer-2 `ScrubInput/` (ScrubInput.tsx, useScrubDrag.ts,
// scrubMath.ts, numericExpression.ts). The math lives in
// `@the-system/shared` (scrub.ts, number.ts) so Angular uses the same rules.
//
// Behavior is hand built:
// - The label is a pointer handle. A drag captures the pointer and moves the
//   value one step per pixel (Shift ten steps, Alt a tenth), toward the
//   inline end to grow, so the direction flips in RTL. A press with no move
//   focuses the input and selects its text.
// - The input is the only tab stop and the key path for the drag (WCAG
//   2.5.7): ArrowUp and ArrowDown by step, Shift by ten, Alt by a tenth.
//   Enter commits and keeps focus; Escape reverts the typed text; blur
//   commits. A typed text that is not arithmetic in the field unit goes
//   back to the last value.
// - Mixed (a selection whose values differ) shows the mixed word as the
//   placeholder; there is no baseline, so drag and arrows wait for a typed
//   value.
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { isIconName, type IconName } from '@the-system/icons';
import { Icon } from '@the-system/icons/react';
import { formatScrub, nudgeStepFor, nudgeValue, resolveCommit, scrubValue, type Size } from '@the-system/shared';
import { useMotion } from '../../internal/motion';
import { useControllable } from '../../internal/useControllable';
import { useField, useFieldControl } from '../Field/Field';
import { useDigitLayer } from '../NumberField/useDigitLayer';

/** The interaction id of the value roll in the registry and the style presets. */
const SCRUB_ROLL = 'scrub-roll';

export type ScrubInputSize = Extract<Size, 'xs' | 'sm' | 'md'>;

export interface ScrubInputProps
  extends Omit<
    ComponentProps<'input'>,
    'size' | 'type' | 'prefix' | 'title' | 'ref' | 'className' | 'style' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step' | 'children'
  > {
  /**
   * The scrub handle: a short letter (`W`, `H`, `X`) or an icon name. It is
   * decoration for assistive tech: the field is named by aria-label or the
   * Field label.
   */
  label: IconName | (string & {}) | ReactNode;
  /** The value, controlled. `null` is empty. */
  value?: number | null;
  /** The first value, uncontrolled. Default empty. */
  defaultValue?: number | null;
  /** Called with every committed value: each drag move, each nudge, a typed commit. */
  onChange?: (value: number) => void;
  /**
   * Called once when a change is done: at the end of a drag, after a nudge
   * and after a typed commit. Use it for one undo entry per gesture, while
   * onChange follows every pixel of a drag.
   */
  onChangeEnd?: (value: number) => void;
  /** The lowest value. */
  min?: number;
  /** The highest value. */
  max?: number;
  /** One step of the arrow keys, and one pixel of drag. Shift is ten steps, Alt a tenth. Default 1. */
  step?: number;
  /** Decimals the value keeps and shows. Default 2. */
  precision?: number;
  /** The unit shown after the value (`px`, `%`, `deg`). A typed value may carry it, or none. */
  unit?: string;
  /** A selection whose values differ: the field is empty and shows `mixedLabel`. */
  mixed?: boolean;
  /** The word shown while mixed. Default "Mixed". Arabic: "متعدد". */
  mixedLabel?: string;
  /** Height from size.control. Default md. */
  size?: ScrubInputSize;
  /** Marks the value invalid. Inside a Field it follows the Field. */
  invalid?: boolean;
  /** Class name of the root. */
  className?: string;
  /** Inline style of the root. */
  style?: ComponentProps<'div'>['style'];
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
  /** Goes to the native input. */
  ref?: Ref<HTMLInputElement>;
}

interface Drag {
  pointerId: number;
  startX: number;
  from: number;
  /** -1 in rtl: a drag toward the inline end grows the value. */
  sign: 1 | -1;
  moved: boolean;
  /** No scrub: a press only focuses (read only, or mixed with no baseline). */
  pressOnly: boolean;
  /** The last value the drag sent. */
  last: number | null;
}

/** Pixels of travel before a press counts as a drag, so a click still focuses. */
const DRAG_THRESHOLD = 2;

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') ref(node);
  else if (ref) ref.current = node;
}

/**
 * A filled inspector field: a scrub handle, the value and its unit. The
 * input gets the ref and every native prop; className, style and rootProps
 * go to the root.
 */
export function ScrubInput({
  label,
  value,
  defaultValue = null,
  onChange,
  onChangeEnd,
  min,
  max,
  step = 1,
  precision = 2,
  unit,
  mixed = false,
  mixedLabel = 'Mixed',
  size = 'md',
  invalid,
  disabled,
  readOnly,
  required,
  className,
  style,
  rootProps,
  id,
  ref,
  placeholder,
  'aria-label': ariaLabel,
  'aria-describedby': describedBy,
  onFocus,
  onBlur,
  onKeyDown,
  ...rest
}: ScrubInputProps) {
  const field = useField();
  const unitId = useId();
  const control = useFieldControl({
    id,
    'aria-describedby': [describedBy, unit ? unitId : undefined].filter(Boolean).join(' ') || undefined,
    invalid,
    disabled,
    readOnly,
    required,
  });
  const [current, setCurrent] = useControllable<number | null>(value, defaultValue, onChange as ((next: number | null) => void) | undefined);
  const [draft, setDraft] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<Drag | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const motion = useMotion();
  const digits = useDigitLayer(input);
  // Set by a drag or an arrow nudge: the change that follows rolls (scrub-roll). Typing never rolls.
  const rolling = useRef(false);
  const drawn = useRef('');

  const inert = Boolean(control.disabled || control.readOnly);
  const shown = draft ?? (mixed || current === null ? '' : formatScrub(current, precision));

  // scrub-roll: after a drag or nudge drew a new value, it rolls digit by digit in the layer over the input.
  useLayoutEffect(() => {
    const before = drawn.current;
    drawn.current = shown;
    if (!rolling.current || before === shown || draft !== null) return;
    rolling.current = false;
    digits.roll(input.current, before, shown, {
      mode: motion.mode(SCRUB_ROLL),
    });
  }, [shown, draft, digits, motion]);
  // Outside a Field, a text label names the field when no aria-label is given.
  const name = ariaLabel ?? (field || typeof label !== 'string' || isIconName(label) ? undefined : label);

  const commit = (next: number) => {
    if (mixed || next !== current) setCurrent(next);
  };

  /** A finished change: commit it and tell onChangeEnd. */
  const finish = (next: number) => {
    commit(next);
    onChangeEnd?.(next);
  };

  const commitDraft = (): boolean => {
    if (draft === null) return false;
    const next = resolveCommit(draft, { unit, min, max, precision });
    setDraft(null);
    if (next === null) return false;
    finish(next);
    return true;
  };

  /** The value to step from: the typed text if it reads, else the committed value. */
  const baseline = (): number | null => {
    if (draft !== null) {
      const typed = resolveCommit(draft, { unit, min, max, precision });
      if (typed !== null) return typed;
    }
    return mixed ? null : current;
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || inert) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      // An empty field nudges from zero, as a drag does. Mixed waits for a typed value.
      const from = mixed && draft === null ? null : (baseline() ?? 0);
      if (from === null) return;
      setDraft(null);
      rolling.current = true;
      finish(
        nudgeValue(from, event.key === 'ArrowUp' ? 1 : -1, event, step, {
          min,
          max,
          precision,
        }),
      );
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      commitDraft();
      // Enter keeps focus and selects, so the next key replaces the value.
      requestAnimationFrame(() => input.current?.select());
      return;
    }
    if (event.key === 'Escape' && draft !== null) {
      // Revert the typed text. Escape with nothing typed goes on to a parent (a popover closes).
      event.preventDefault();
      event.stopPropagation();
      setDraft(null);
    }
  };

  const onInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    commitDraft();
    onBlur?.(event);
  };

  const onHandleDown = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0 || control.disabled) return;
    event.preventDefault();
    // An empty field scrubs from zero. Read only and mixed (no baseline) only take a press to focus.
    const pressOnly = Boolean(control.readOnly) || mixed;
    const from = pressOnly ? Number.NaN : (baseline() ?? 0);
    const handle = event.currentTarget;
    handle.setPointerCapture?.(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      from,
      sign: getComputedStyle(handle).direction === 'rtl' ? -1 : 1,
      moved: false,
      pressOnly,
      last: null,
    };
  };

  const dragValue = (d: Drag, event: PointerEvent<HTMLSpanElement>): number =>
    scrubValue(d.from, Math.round((event.clientX - d.startX) * d.sign), nudgeStepFor(event, step), { min, max, precision });

  const onHandleMove = (event: PointerEvent<HTMLSpanElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== event.pointerId) return;
    const dx = (event.clientX - d.startX) * d.sign;
    if (d.pressOnly) return;
    if (!d.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      d.moved = true;
      setDragging(true);
    }
    setDraft(null);
    const next = dragValue(d, event);
    // Compare with the last value sent, not the render's value: two moves can land before a render.
    if (next === d.last) return;
    d.last = next;
    rolling.current = true;
    commit(next);
  };

  const endDrag = (event: PointerEvent<HTMLSpanElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (d.moved) {
      // The release position is the final value, even when no move event came after the last pixel.
      const next = event.type === 'pointerup' ? dragValue(d, event) : (d.last ?? d.from);
      if (next !== d.last) commit(next);
      onChangeEnd?.(next);
    } else if (event.type === 'pointerup') {
      input.current?.focus();
      input.current?.select();
    }
  };

  const labelContent = typeof label === 'string' && isIconName(label) ? <Icon name={label} /> : label;

  return (
    <div
      {...rootProps}
      className={className}
      style={style}
      data-ds="scrub-input"
      data-size={size}
      data-dragging={dragging ? '' : undefined}
      data-invalid={control['aria-invalid'] ? '' : undefined}
      data-disabled={control.disabled ? '' : undefined}
      // The whole field is inactive, its unit text too (WCAG 1.4.3 exempts inactive components).
      aria-disabled={control.disabled ? true : undefined}
      data-readonly={control.readOnly ? '' : undefined}
      data-mixed={mixed ? '' : undefined}
    >
      <span
        data-part="label"
        aria-hidden="true"
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        {labelContent}
      </span>
      <input
        {...rest}
        {...control}
        ref={(node) => {
          input.current = node;
          assignRef(ref, node);
        }}
        aria-label={name}
        type="text"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        data-part="control"
        value={shown}
        placeholder={mixed ? mixedLabel : placeholder}
        onFocus={onFocus}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft(event.target.value)}
        onKeyDown={onInputKeyDown}
        onBlur={onInputBlur}
      />
      {/* The digit roll layer (scrub-roll): decorative, empty at rest. */}
      <span aria-hidden="true" ref={digits.layer} />
      {unit ? (
        // Read once, as the description of the input, not again as page text.
        <span data-part="unit" id={unitId} aria-hidden="true">
          {unit}
        </span>
      ) : null}
    </div>
  );
}
