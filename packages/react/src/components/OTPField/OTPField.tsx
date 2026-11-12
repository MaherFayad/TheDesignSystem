'use client';
import {
  Fragment,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type Ref,
  type SyntheticEvent,
} from 'react';
import { codeInputHints, codeSeparatorIndexes, parseCode, type CodeCharset, type Shape, type Size } from '@the-system/shared';
import { useMotion } from '../../internal/motion';
import { useFieldControl } from '../Field/Field';
import { landPop, playBeat, runStep, token } from '../Input/fieldMotion';
import { useErrorShake } from '../Input/useErrorShake';

export type OTPFieldSize = Size;
export type OTPFieldShape = Extract<Shape, 'default' | 'pill'>;
export type OTPFieldCharset = CodeCharset;

export interface OTPFieldProps
  extends Omit<
    ComponentProps<'input'>,
    'size' | 'type' | 'value' | 'defaultValue' | 'maxLength' | 'minLength' | 'pattern' | 'title' | 'ref' | 'className' | 'style' | 'children'
  > {
  /** Number of cells. Default 6. */
  length?: number;
  /**
   * Group sizes, for a separator between groups: `[3, 3]` shows 123 456.
   * Ignored when the sizes do not add up to `length`.
   */
  groups?: number[];
  /** numeric: digits and the number keypad. alphanumeric: letters and digits, upper cased. Default numeric. */
  charset?: OTPFieldCharset;
  /** The code (controlled). */
  value?: string;
  /** The first code (uncontrolled). */
  defaultValue?: string;
  /** Called with the parsed code each time it changes. */
  onValueChange?: (value: string) => void;
  /** Called once each time the code becomes complete, with the full code. */
  onComplete?: (value: string) => void;
  /** Cell height from size.control. Default md. */
  size?: OTPFieldSize;
  /** default: radius.field from the style. pill: fully round cells. */
  shape?: OTPFieldShape;
  /** Marks the code invalid. Inside a Field it follows the Field. */
  invalid?: boolean;
  /** Class name of the root. */
  className?: string;
  /** Inline style of the root. */
  style?: ComponentProps<'div'>['style'];
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
  /** Goes to the native input that holds the code. */
  ref?: Ref<HTMLInputElement>;
}

interface Selection {
  start: number;
  end: number;
}

/**
 * The selection the field keeps: one character selected, so the next key
 * replaces the character in the active cell, or a caret after the last
 * character while the code is not full.
 */
function cellSelection(pos: number, valueLength: number, length: number): Selection {
  const at = Math.max(0, Math.min(pos, valueLength, length - 1));
  if (at < valueLength) return { start: at, end: at + 1 };
  return { start: at, end: at };
}

/**
 * A one time code shown in separate cells.
 *
 * One real `<input>` holds the whole code and sits on top of the cells with
 * a transparent text and caret. The cells are a drawing of its value
 * (`aria-hidden`). One input, not one per cell, because:
 *
 * - the SMS autofill of iOS and Android (`autocomplete="one-time-code"`) and
 *   password managers fill one field with the whole code;
 * - a paste lands in one field, with no script that splits it;
 * - a screen reader meets one field with one name ("Verification code") and
 *   the code as its value, not six unnamed boxes;
 * - a Field label points at it with `htmlFor`, like any other control.
 *
 * The field keeps one character selected, so typing replaces the active cell
 * and moves on. Backspace clears and moves back. ArrowLeft and ArrowRight
 * move one cell, Home and End to the ends. A paste replaces the whole code.
 * Spaces, dashes and Arabic Indic digits are read (`parseCode`). A code runs
 * left to right in every language, so the root carries `dir="ltr"`.
 *
 * Motion (order 1.21): each new character pops into its cell, a paste in a
 * short run over the cells (otp-fill), on an unnamed span inside the cell;
 * the selection moves on at once. The row shakes when the code turns
 * invalid (error-shake).
 */
export function OTPField({
  length: lengthProp = 6,
  groups,
  charset = 'numeric',
  value: valueProp,
  defaultValue,
  onValueChange,
  onComplete,
  size = 'md',
  shape = 'default',
  invalid,
  disabled,
  readOnly,
  required,
  className,
  style,
  rootProps,
  id,
  ref,
  autoComplete = 'one-time-code',
  'aria-describedby': describedBy,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  onPaste,
  onSelect,
  onClick,
  ...rest
}: OTPFieldProps) {
  const length = Math.max(1, Math.floor(lengthProp));
  const control = useFieldControl({ id, 'aria-describedby': describedBy, invalid, disabled, readOnly, required });
  const options = { length, charset };
  const [own, setOwn] = useState(() => parseCode(defaultValue ?? '', options).value);
  const value = valueProp !== undefined ? parseCode(valueProp, options).value : own;
  const [focused, setFocused] = useState(false);
  const [sel, setSel] = useState<Selection>({ start: 0, end: 0 });
  const inner = useRef<HTMLInputElement | null>(null);
  const pending = useRef<number | null>(null);
  const lastSel = useRef<Selection>({ start: 0, end: 0 });
  // Bumped when a change is refused, so the selection effect runs although the value did not change.
  const [refused, setRefused] = useState(0);
  const motion = useMotion();
  // The code the cells drew last, so only the characters that changed pop.
  const drawn = useRef(value);
  useErrorShake(inner, Boolean(control['aria-invalid']));

  // otp-fill: each character that is new in its cell lands, after React drew it. One character
  // grows from scale.morph past full size on the bouncy spring and settles; a paste or an SMS fill
  // lands as one run on the snappy spring, spread over two stagger steps.
  // otp-complete: when the code turns full, the cells lift by distance.lift and settle, as one
  // short wave from the first cell (never on first paint, never while invalid).
  const complete = value.length === length;
  const invalidNow = Boolean(control['aria-invalid']);
  const wasComplete = useRef(complete);
  useLayoutEffect(() => {
    const before = drawn.current;
    drawn.current = value;
    const root = inner.current?.parentElement;
    const was = wasComplete.current;
    wasComplete.current = value.length === length;
    if (!root || value === before) return;
    const cells = [...root.querySelectorAll(':scope > [data-part="cell"]')];
    const changed: number[] = [];
    for (let i = 0; i < value.length; i++) if (value[i] !== before[i]) changed.push(i);
    const fill = motion.mode('otp-fill');
    const run = changed.length > 1;
    changed.forEach((cell, i) => {
      const extra = run
        ? {
            duration: 'duration.spring-snappy' as const,
            easing: 'ease.spring-snappy' as const,
            delay: 'delay.stagger' as const,
            steps: runStep(i, changed.length),
          }
        : {};
      playBeat(cells[cell]?.firstElementChild, landPop(undefined, extra), 'otp-fill', fill);
    });
    if (value.length === length && !was && !invalidNow) {
      const wave = motion.mode('otp-complete');
      cells.forEach((cell, i) => {
        playBeat(
          cell,
          {
            keyframes: [
              { transform: 'none', easing: 'ease.out' },
              {
                transform: `translateY(calc(-1 * ${token.lift}))`,
                offset: 0.35,
                easing: 'ease.spring-soft',
              },
              { transform: 'none' },
            ],
            duration: 'duration.celebrate',
            easing: 'linear',
            delay: 'delay.stagger',
            steps: runStep(i, cells.length),
          },
          'otp-complete',
          wave,
          null,
        );
      });
    }
  }, [value, length, motion, invalidNow]);

  const setRef = useCallback(
    (node: HTMLInputElement | null): (() => void) | undefined => {
      inner.current = node;
      if (typeof ref === 'function') {
        const cleanup = ref(node);
        return () => {
          if (typeof cleanup === 'function') cleanup();
          else ref(null);
        };
      }
      if (ref) {
        ref.current = node;
        return () => {
          ref.current = null;
        };
      }
      return undefined;
    },
    [ref],
  );

  /** Puts the selection on the cell at `pos` and draws it. */
  const place = useCallback(
    (pos: number, valueLength: number) => {
      const input = inner.current;
      const next = cellSelection(pos, valueLength, length);
      lastSel.current = next;
      setSel(next);
      if (!input || input.ownerDocument.activeElement !== input) return;
      if (input.selectionStart !== next.start || input.selectionEnd !== next.end) {
        input.setSelectionRange(next.start, next.end);
      }
    },
    [length],
  );

  // After a change React writes the value; then the selection goes where the change asked.
  useLayoutEffect(() => {
    if (pending.current === null) return;
    const pos = pending.current;
    pending.current = null;
    place(pos, value.length);
  }, [value, refused, place]);

  const commit = (next: string, caret: number) => {
    // A caret asked for by the key that caused the change (Backspace) wins.
    pending.current ??= caret;
    if (next !== value) {
      if (valueProp === undefined) setOwn(next);
      onValueChange?.(next);
      // A full code that is new: typed to the end, pasted, filled, or one digit of a full code fixed.
      if (next.length === length) onComplete?.(next);
    }
    // Always run the selection effect: the value may stay the same (a refused key, the same digit
    // typed again, or a controlled parent that keeps its value), and the pending caret must not go stale.
    setRefused((n) => n + 1);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    if (event.defaultPrevented) return;
    const input = event.currentTarget;
    const raw = input.value;
    const parsed = parseCode(raw, options);
    // One key the code cannot hold (a letter in a numeric code, typed over a cell or at the end) is
    // refused: the cell keeps its character and stays active. A longer insert keeps what it can.
    if (parsed.rejected && raw.length <= value.length + 1) {
      pending.current = null;
      commit(value, lastSel.current.start);
      return;
    }
    // The native caret sits after what was typed, pasted or filled. Separators the parse dropped can push it past the end.
    const caret = Math.min(input.selectionStart ?? parsed.value.length, parsed.value.length);
    commit(parsed.value, caret);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    // Shift with an arrow keeps its native meaning: it extends the selection.
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const at = lastSel.current.start;
    // The cells always run left to right, so ArrowLeft is the previous cell in every language.
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        place(at - 1, value.length);
        return;
      case 'ArrowRight':
        event.preventDefault();
        place(at + 1, value.length);
        return;
      case 'Home':
        event.preventDefault();
        place(0, value.length);
        return;
      case 'End':
        event.preventDefault();
        place(value.length, value.length);
        return;
      case 'Backspace': {
        if (readOnly || control.readOnly) return;
        const { start, end } = lastSel.current;
        // A selected character is cleared and the cell before it becomes active.
        if (end > start && start > 0) pending.current = start - 1;
        // The native delete runs and fires the input event, so forms hear it.
        return;
      }
      default:
    }
  };

  const handleSelect = (event: SyntheticEvent<HTMLInputElement>) => {
    onSelect?.(event);
    const input = event.currentTarget;
    if (pending.current !== null) return;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? start;
    // A selection the person drags over several cells stays as it is.
    if (end - start > 1) {
      lastSel.current = { start, end };
      setSel({ start, end });
      return;
    }
    place(start, value.length);
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    onFocus?.(event);
    setFocused(true);
    // Tab lands on the first empty cell, or the last cell of a full code.
    place(value.length, value.length);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);
    setFocused(false);
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    onPaste?.(event);
    if (event.defaultPrevented) return;
    // A paste replaces the whole code: select all, then let the native paste run.
    const input = event.currentTarget;
    input.setSelectionRange(0, input.value.length);
  };

  // A click picks the cell under the pointer: the text is transparent, so the native caret position means nothing.
  const handleClick = (event: MouseEvent<HTMLInputElement>) => {
    onClick?.(event);
    const root = event.currentTarget.parentElement;
    if (!root) return;
    const cells = Array.from(root.querySelectorAll<HTMLElement>(':scope > [data-part="cell"]'));
    let index = cells.findIndex((cell) => {
      const r = cell.getBoundingClientRect();
      return r.width > 0 && event.clientX <= r.right;
    });
    if (index < 0) index = cells.length - 1;
    place(index, value.length);
  };

  const separators = codeSeparatorIndexes(length, groups);
  const hints = codeInputHints(charset);
  const activeStart = sel.start;
  const activeEnd = Math.max(sel.end, sel.start + 1);

  return (
    <div
      {...rootProps}
      className={className}
      style={style}
      dir="ltr"
      data-ds="otp-field"
      data-size={size}
      data-shape={shape}
      data-invalid={control['aria-invalid'] ? '' : undefined}
      data-disabled={control.disabled ? '' : undefined}
      data-readonly={control.readOnly ? '' : undefined}
      data-complete={complete ? '' : undefined}
    >
      <input
        {...rest}
        {...control}
        ref={setRef}
        type="text"
        data-part="control"
        value={value}
        autoComplete={autoComplete}
        inputMode={rest.inputMode ?? hints.inputMode}
        pattern={hints.pattern}
        autoCapitalize={charset === 'alphanumeric' ? 'characters' : 'off'}
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint={rest.enterKeyHint ?? 'done'}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPaste={handlePaste}
        onClick={handleClick}
      />
      {Array.from({ length }, (_, i) => (
        <Fragment key={i}>
          {separators.includes(i) && <span data-part="separator" aria-hidden="true" />}
          <span
            data-part="cell"
            aria-hidden="true"
            data-active={focused && i >= activeStart && i < activeEnd ? '' : undefined}
            data-filled={i < value.length ? '' : undefined}
          >
            {value[i] ? <span>{value[i]}</span> : null}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
