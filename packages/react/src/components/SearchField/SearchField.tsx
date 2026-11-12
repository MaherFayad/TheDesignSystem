'use client';
// SearchField: a search box with a clear button, an optional end slot and a
// loading state, built on Input.
//
// Source: Figma-Killer-2 `SearchBar/` (a search icon, an Input and a ghost
// clear button in one row; clear falls back to an empty value).
//
// The root is the bordered box. The nested Input is the control part: it
// keeps the native input, the Field wiring and the ref, and this
// component's CSS clears its own box through its private --_input-*
// properties. The clear part is an IconButton. When CloseButton (order
// 1.1.9) lands, it takes its place with the same part name.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { Icon } from '@the-system/icons/react';
import type { Shape, Size } from '@the-system/shared';
import { useField } from '../Field/Field';
import { IconButton } from '../IconButton/IconButton';
import { Input, type InputProps } from '../Input/Input';

export type SearchFieldSize = Size;
export type SearchFieldShape = Extract<Shape, 'default' | 'pill'>;

export interface SearchFieldProps
  extends Omit<InputProps, 'type' | 'start' | 'end' | 'value' | 'defaultValue' | 'size' | 'shape' | 'onSubmit' | 'ref'> {
  /** Height from size.control. Default md. */
  size?: SearchFieldSize;
  /** default takes radius.control from the style (a pill in Studio and Desk). pill is always fully round. */
  shape?: SearchFieldShape;
  /** The query, controlled. Pair it with onValueChange. */
  value?: string;
  /** The first query, uncontrolled. Default empty. */
  defaultValue?: string;
  /** Called with the new query on every edit and when the clear button or Escape clears it. */
  onValueChange?: (value: string) => void;
  /** Called with the query when Enter is pressed. A form around the field still submits as usual. */
  onSubmit?: (value: string) => void;
  /** Called after the query is cleared, by the clear button or by Escape. */
  onClear?: () => void;
  /** The accessible name of the clear button. Default "Clear search". Arabic: "مسح البحث". */
  clearLabel?: string;
  /** Results are on their way: a spinner at the start of the end slot and a polite status. */
  loading?: boolean;
  /** What the status says while loading. Default "Searching". Arabic: "جاري البحث". */
  loadingLabel?: string;
  /** Content at the end of the box, after the clear button: a filter IconButton, a keyboard hint. */
  end?: ReactNode;
  /** Goes to the native input. */
  ref?: Ref<HTMLInputElement>;
}

const INTERACTIVE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]';

/**
 * A search box. Escape clears the query; a second Escape on the empty box
 * bubbles, so a dialog or a menu around it can close. Enter calls onSubmit.
 * The clear button shows while there is a query and returns focus to the
 * input. The browser's own clear button is hidden, so only one shows.
 */
export function SearchField({
  size = 'md',
  shape = 'default',
  value,
  defaultValue = '',
  onValueChange,
  onSubmit,
  onClear,
  clearLabel = 'Clear search',
  loading = false,
  loadingLabel = 'Searching',
  end,
  invalid,
  disabled,
  readOnly,
  className,
  style,
  rootProps,
  onChange,
  onKeyDown,
  ref,
  ...rest
}: SearchFieldProps) {
  const field = useField();
  const inner = useRef<HTMLInputElement | null>(null);
  const [own, setOwn] = useState(defaultValue);
  const query = value ?? own;

  const isInvalid = invalid ?? field?.invalid ?? false;
  const isDisabled = disabled ?? field?.disabled ?? false;
  const isReadOnly = readOnly ?? field?.readOnly ?? false;
  const empty = query === '';

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

  const change = (next: string) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  const clear = () => {
    change('');
    onClear?.();
    inner.current?.focus();
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    change(event.target.value);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    // A key that ends an IME composition (keyCode 229 in Safari) is not a command.
    const composing = event.nativeEvent.isComposing || event.keyCode === 229;
    if (composing) return;
    if (event.key === 'Enter') {
      onSubmit?.(query);
    }
  };

  // The first Escape clears. Radix layers (Dialog, Popover) listen for Escape
  // on the document in the capture phase, before React sees the key, so the
  // clear runs in a window capture listener, which comes first, and marks the
  // key handled. An Escape on the empty box passes, so the layer closes.
  const escape = useRef<(event: globalThis.KeyboardEvent) => void>(() => undefined);
  escape.current = (event) => {
    if (event.key !== 'Escape' || event.target !== inner.current) return;
    if (event.isComposing || event.keyCode === 229 || empty || isReadOnly || event.defaultPrevented) return;
    event.preventDefault();
    event.stopPropagation();
    clear();
  };
  useEffect(() => {
    const listener = (event: globalThis.KeyboardEvent) => escape.current(event);
    window.addEventListener('keydown', listener, { capture: true });
    return () => window.removeEventListener('keydown', listener, { capture: true });
  }, []);

  const onRootMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    rootProps?.onMouseDown?.(event);
    const input = inner.current;
    if (event.defaultPrevented || !input || input.disabled) return;
    const target = event.target as Element;
    if (target === input) return;
    const root = event.currentTarget;
    const match = target.closest(INTERACTIVE);
    if (match && match !== root && root.contains(match)) return;
    event.preventDefault();
    input.focus();
  };

  const clearSize = size === 'lg' ? 'sm' : 'xs';
  const hasEnd = end !== undefined && end !== null && end !== false;

  return (
    <div
      {...rootProps}
      className={className}
      style={style}
      onMouseDown={onRootMouseDown}
      data-ds="search-field"
      data-size={size}
      data-shape={shape}
      data-empty={empty ? '' : undefined}
      data-invalid={isInvalid ? '' : undefined}
      data-disabled={isDisabled ? '' : undefined}
      data-readonly={isReadOnly ? '' : undefined}
      data-loading={loading ? '' : undefined}
    >
      <span data-part="icon" aria-hidden="true">
        <Icon name="search" />
      </span>
      <Input
        {...rest}
        ref={setRef}
        type="search"
        size={size}
        shape={shape}
        value={query}
        onChange={onInputChange}
        onKeyDown={onInputKeyDown}
        invalid={invalid}
        disabled={disabled}
        readOnly={readOnly}
        rootProps={{ 'data-part': 'control' } as ComponentProps<'div'>}
      />
      {!empty && !isDisabled && !isReadOnly && (
        <IconButton data-part="clear" icon="close" label={clearLabel} size={clearSize} shape="pill" onClick={clear} />
      )}
      {(loading || hasEnd) && (
        <span data-part="end">
          {/* The spinner goes before the end content, never in its place, so a focused end button keeps focus. */}
          {loading && <span data-part="spinner" aria-hidden="true" />}
          {end}
        </span>
      )}
      <span data-part="status" role="status">
        {loading ? loadingLabel : ''}
      </span>
    </div>
  );
}
