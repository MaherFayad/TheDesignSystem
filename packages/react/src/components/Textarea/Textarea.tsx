'use client';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type CSSProperties,
  type MouseEvent,
  type Ref,
} from 'react';
import { VisuallyHidden } from 'radix-ui';
import type { Shape, Size } from '@the-system/shared';
import { useFieldControl } from '../Field/Field';
import { useTheme } from '../../theme/hooks';

export type TextareaSize = Size;
/** A pill never wraps lines, so default is the only shape. */
export type TextareaShape = Extract<Shape, 'default'>;

export interface TextareaProps extends Omit<ComponentProps<'textarea'>, 'title' | 'ref' | 'className' | 'style' | 'maxLength'> {
  /** Text size and padding, in step with Input. Default md. */
  size?: TextareaSize;
  /** default only: the field radius. A pill never wraps lines. */
  shape?: TextareaShape;
  /** Marks the value invalid. Inside a Field it follows the Field. Past the limit it is always invalid. */
  invalid?: boolean;
  /** Lines shown when empty, the floor of the auto height. Default 3. */
  rows?: number;
  /** Lines the auto height grows to before the text scrolls. No cap by default. */
  maxRows?: number;
  /** Grows with the text from rows to maxRows. false keeps rows lines with a vertical resize handle. Default true. */
  autoHeight?: boolean;
  /**
   * The character limit for the count. Past it the count turns danger and
   * the value is invalid. It never cuts the text: the person decides what
   * to remove.
   */
  limit?: number;
  /** Shows the count under the text. Default true when there is a limit. */
  showCount?: boolean;
  /**
   * The words announced near and past the limit. Default English, or
   * Arabic when the nearest Theme is Arabic.
   */
  countMessage?: (left: number) => string;
  /** Class name of the root, the bordered box. */
  className?: string;
  /** Inline style of the root, the bordered box. */
  style?: CSSProperties;
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
  /** Goes to the native textarea. */
  ref?: Ref<HTMLTextAreaElement>;
}

/** Characters as a person counts them: code points, so an emoji is one. */
function lengthOf(value: unknown): number {
  return value === undefined || value === null ? 0 : Array.from(String(value)).length;
}

function englishMessage(left: number): string {
  if (left >= 0) return left === 1 ? '1 character left' : `${left} characters left`;
  const over = -left;
  return over === 1 ? '1 character over the limit' : `${over} characters over the limit`;
}

function arabicCount(n: number): string {
  if (n === 1) return 'حرف واحد';
  if (n === 2) return 'حرفين';
  if (n <= 10) return `${n} حروف`;
  return `${n} حرف`;
}

function arabicMessage(left: number): string {
  if (left === 0) return 'ما باقي ولا حرف';
  if (left > 0) return `باقي ${arabicCount(left)}`;
  return `زاد ${arabicCount(-left)} عن الحد`;
}

/**
 * Near the limit: the last tenth, and never fewer than the last 10
 * characters, but an empty value is never near, so a small limit still has
 * a near message to say.
 */
function nearAt(limit: number): number {
  return Math.min(limit - 1, Math.max(10, Math.ceil(limit / 10)));
}

/** The count in words, for aria-describedby: "39 of 200 characters". */
function countWords(length: number, limit: number | undefined, arabic: boolean): string {
  if (arabic) return limit ? `${length} من ${limit} حرف` : `${length} حرف`;
  return limit ? `${length} of ${limit} characters` : length === 1 ? '1 character' : `${length} characters`;
}

type Zone = 'under' | 'near' | 'over';

/**
 * Multi line text in a bordered box, with an optional character count.
 * The box is the root (`data-ds="textarea"`); the `<textarea>` is the
 * control part and gets the ref and every native prop.
 *
 * Auto height comes from CSS `field-sizing: content` between a rows floor
 * and a maxRows cap. Where the browser lacks it, a script sets the height
 * from scrollHeight on input.
 *
 * The count is announced politely only when it enters the last stretch
 * before the limit and when it goes past it, never on every key.
 *
 * Inside a Field it reads its id, aria-describedby, invalid, disabled, read
 * only and required state through `useFieldControl()`.
 */
export function Textarea({
  size = 'md',
  shape = 'default',
  invalid,
  disabled,
  readOnly,
  required,
  rows = 3,
  maxRows,
  autoHeight = true,
  limit,
  showCount,
  countMessage,
  className,
  style,
  rootProps,
  id,
  ref,
  value,
  defaultValue,
  onChange,
  'aria-describedby': describedBy,
  ...rest
}: TextareaProps) {
  const { lang } = useTheme();
  const arabic = lang.startsWith('ar');
  const [ownLength, setOwnLength] = useState(() => lengthOf(defaultValue));
  const length = value !== undefined ? lengthOf(value) : ownLength;
  const hasLimit = limit !== undefined && limit > 0;
  const over = hasLimit && length > limit;
  const countShown = showCount ?? hasLimit;
  const countId = useId();

  const control = useFieldControl({
    id,
    'aria-describedby': [describedBy, countShown ? countId : undefined].filter(Boolean).join(' ') || undefined,
    invalid: over ? true : invalid,
    disabled,
    readOnly,
    required,
  });

  // The live message changes only when the zone changes, so it is read once.
  const zone: Zone = !hasLimit ? 'under' : over ? 'over' : limit - length <= nearAt(limit) ? 'near' : 'under';
  const [announcement, setAnnouncement] = useState('');
  const lastZone = useRef<Zone>(zone);
  useEffect(() => {
    if (zone === lastZone.current) return;
    lastZone.current = zone;
    if (zone === 'under' || !hasLimit) {
      setAnnouncement('');
      return;
    }
    const message = countMessage ?? (arabic ? arabicMessage : englishMessage);
    setAnnouncement(message(limit - length));
  }, [zone, hasLimit, limit, length, countMessage, arabic]);

  const inner = useRef<HTMLTextAreaElement | null>(null);
  const setRef = useCallback(
    (node: HTMLTextAreaElement | null): (() => void) | undefined => {
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

  // Fallback for browsers without field-sizing: measure, between the CSS floor and cap.
  const fit = useCallback(() => {
    const node = inner.current;
    if (!node || typeof CSS === 'undefined' || CSS.supports('field-sizing', 'content')) return;
    if (!autoHeight) {
      node.style.blockSize = '';
      return;
    }
    node.style.blockSize = 'auto';
    node.style.blockSize = `${node.scrollHeight}px`;
  }, [autoHeight]);
  useLayoutEffect(fit, [fit, value, rows, maxRows]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (value === undefined) setOwnLength(lengthOf(event.target.value));
    fit();
    onChange?.(event);
  };

  // A press on the box outside the text (the count, the padding) focuses the text, as Input does.
  const onRootMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    rootProps?.onMouseDown?.(event);
    const node = inner.current;
    if (event.defaultPrevented || !node || node.disabled || event.target === node) return;
    event.preventDefault();
    node.focus();
  };

  const lines = { '--_textarea-rows': rows, '--_textarea-max-rows': maxRows } as CSSProperties;

  return (
    <div
      {...rootProps}
      className={className}
      style={{ ...lines, ...style }}
      onMouseDown={onRootMouseDown}
      data-ds="textarea"
      data-size={size}
      data-shape={shape}
      data-auto-height={autoHeight ? '' : undefined}
      data-invalid={control['aria-invalid'] ? '' : undefined}
      data-disabled={control.disabled ? '' : undefined}
      data-readonly={control.readOnly ? '' : undefined}
      data-over={over ? '' : undefined}
    >
      <textarea {...rest} {...control} ref={setRef} rows={rows} value={value} defaultValue={defaultValue} onChange={handleChange} data-part="control" />
      {countShown && (
        <span id={countId} data-part="count">
          {/* The digits are drawn; the words are read. */}
          <span aria-hidden="true">{hasLimit ? `${length}/${limit}` : length}</span>
          <VisuallyHidden.Root>{countWords(length, hasLimit ? limit : undefined, arabic)}</VisuallyHidden.Root>
        </span>
      )}
      {/* The live region: not an anatomy part, so no data-part. */}
      <VisuallyHidden.Root aria-live="polite" aria-atomic="true">
        {announcement}
      </VisuallyHidden.Root>
    </div>
  );
}
