'use client';
// InlineEdit: text that turns into an Input to edit in place, such as the
// name of a board in its header.
//
// Sources: Figma-Killer-2 `VariableField/` (a value shown as text that
// opens an editor in place) and `Input/` (the editor). Hand built.
//
// Viewing, the display part is a ghost Button that shows the value. A
// press, Enter or Space starts editing: the nested Input (the control part)
// takes focus with its text selected, with a save and a cancel IconButton.
// Enter or save keeps the value, Escape or cancel drops it; both return
// focus to the display. Leaving the editor saves, but never an invalid
// value: the editor stays open with the message.
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { Icon } from '@the-system/icons/react';
import type { Size } from '@the-system/shared';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Input } from '../Input/Input';

export type InlineEditSize = Size;
export type InlineEditState = 'viewing' | 'editing';

export interface InlineEditProps extends Omit<ComponentProps<'div'>, 'title' | 'defaultValue' | 'onChange' | 'children'> {
  /** The name of what is edited: the editor's name, and part of the display's. Required. English: Board name. */
  label: string;
  /** The value, controlled. Pair it with onValueChange. */
  value?: string;
  /** The first value, uncontrolled. Default empty. */
  defaultValue?: string;
  /** Called with the new value when it is saved. */
  onValueChange?: (value: string) => void;
  /** Opens in the editor, for a new item named right away. Focus moves to it only when editing starts later. Default false. */
  defaultEditing?: boolean;
  /** Called when editing starts or ends. */
  onEditingChange?: (editing: boolean) => void;
  /**
   * Checks a value before it is saved. Return a message that says how to
   * fix it, or nothing when the value is fine. An invalid value is never
   * saved, on Enter or on leaving the editor.
   */
  validate?: (value: string) => string | undefined | null;
  /** Shown in the display while the value is empty. Default "Add a name". */
  placeholder?: string;
  /** The display's name after the value. Default "Edit" plus the label in lower case. Arabic: "تعديل اسم اللوحة". */
  editLabel?: string;
  /** The save button's name. Default "Save changes". Arabic: "حفظ التغييرات". */
  saveLabel?: string;
  /** The cancel button's name. Default "Discard changes". Arabic: "إلغاء التغييرات". */
  cancelLabel?: string;
  /** Said once by a polite status after a save. Default "Saved". Arabic: "تم الحفظ". */
  savedLabel?: string;
  /** Height from size.control. Default md. */
  size?: InlineEditSize;
  /** The display cannot start editing; it keeps aria-disabled and stays focusable. */
  disabled?: boolean;
  /** Marks the value invalid from outside, for example after a server check. Pair it with error. */
  invalid?: boolean;
  /**
   * A message from outside (a server check) that says how to fix the value.
   * Shown under the display or the editor and linked to both; it marks the
   * value invalid.
   */
  error?: ReactNode;
  /** Goes to the native input while editing. */
  inputRef?: Ref<HTMLInputElement>;
  ref?: Ref<HTMLDivElement>;
}

/** Text that turns into an Input to edit in place. */
export function InlineEdit({
  label,
  value,
  defaultValue = '',
  onValueChange,
  onEditingChange,
  defaultEditing = false,
  validate,
  placeholder = 'Add a name',
  editLabel,
  saveLabel = 'Save changes',
  cancelLabel = 'Discard changes',
  savedLabel = 'Saved',
  size = 'md',
  disabled = false,
  invalid = false,
  error: outsideError,
  inputRef,
  ref,
  onBlur,
  ...rest
}: InlineEditProps) {
  const base = useId();
  const errorId = `${base}error`;
  const [own, setOwn] = useState(defaultValue);
  const current = value ?? own;
  const [editing, setEditing] = useState(defaultEditing);
  const shownEditing = useRef(defaultEditing);
  const [draft, setDraft] = useState(current);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const display = useRef<HTMLButtonElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  // Set when a key or a button ends editing, so focus returns to the display.
  // Not set when focus left the editor on its own.
  const returnFocus = useRef(false);

  const empty = current === '';
  const hasOutside = outsideError !== undefined && outsideError !== null && outsideError !== false;
  const message: ReactNode = error ?? (hasOutside ? outsideError : null);
  const isInvalid = invalid || message !== null;
  const name = `${empty ? placeholder : current}, ${editLabel ?? `Edit ${label.toLowerCase()}`}`;
  const describedBy = message !== null ? errorId : undefined;

  useEffect(() => {
    // Act only when editing starts or ends, never on the first render: a
    // page that opens with an editor keeps its own focus.
    if (shownEditing.current === editing) return;
    shownEditing.current = editing;
    if (editing) {
      input.current?.focus();
      input.current?.select();
    } else if (returnFocus.current) {
      returnFocus.current = false;
      display.current?.focus();
    }
  }, [editing]);

  const setEditingState = (next: boolean) => {
    setEditing(next);
    onEditingChange?.(next);
  };

  const start = () => {
    if (disabled) return;
    setDraft(current);
    setError(null);
    setStatus('');
    setEditingState(true);
  };

  const check = (next: string): string | null => validate?.(next) || null;

  /** Saves the draft. Returns false and keeps editing when it is invalid. */
  const save = (focusBack: boolean): boolean => {
    const message = check(draft);
    if (message) {
      setError(message);
      // Focus stays in the editor; the status reads the message once.
      setStatus(message);
      return false;
    }
    if (draft !== current) {
      if (value === undefined) setOwn(draft);
      onValueChange?.(draft);
      setStatus(savedLabel);
    }
    returnFocus.current = focusBack;
    setEditingState(false);
    return true;
  };

  const cancel = () => {
    setError(null);
    returnFocus.current = true;
    setEditingState(false);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
    // Once a message shows, it follows the value, so it goes away when fixed.
    if (error !== null) setError(check(event.target.value));
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      save(true);
    }
  };

  // Escape cancels. Radix layers (Dialog, Popover) listen for Escape on the
  // document in the capture phase, before React sees the key, so the cancel
  // runs in a window capture listener, which comes first, and marks the key
  // handled: the dialog around the editor stays open.
  const escape = useRef<(event: globalThis.KeyboardEvent) => void>(() => undefined);
  escape.current = (event) => {
    if (event.key !== 'Escape' || !editing || event.target !== input.current) return;
    if (event.isComposing || event.keyCode === 229 || event.defaultPrevented) return;
    event.preventDefault();
    event.stopPropagation();
    cancel();
  };
  useEffect(() => {
    const listener = (event: globalThis.KeyboardEvent) => escape.current(event);
    window.addEventListener('keydown', listener, { capture: true });
    return () => window.removeEventListener('keydown', listener, { capture: true });
  }, []);

  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof inputRef === 'function') inputRef(node);
      else if (inputRef) inputRef.current = node;
    },
    [inputRef],
  );

  // Leaving the editor saves a valid value. Focus that moves to the save or
  // cancel button stays inside, so it does not count.
  const onRootBlur = (event: FocusEvent<HTMLDivElement>) => {
    onBlur?.(event);
    if (!editing) return;
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) return;
    // Nothing changed: close without a check, so an empty new item never traps the editor.
    if (draft === current) {
      setError(null);
      setEditingState(false);
      return;
    }
    save(false);
  };

  // The buttons keep focus in the input on press, so a press never reads as leaving.
  const keepFocus = (event: MouseEvent) => event.preventDefault();
  const iconSize = size === 'lg' ? 'sm' : 'xs';

  return (
    <div
      {...rest}
      ref={ref}
      onBlur={onRootBlur}
      data-ds="inline-edit"
      data-size={size}
      data-state={editing ? 'editing' : 'viewing'}
      data-empty={empty ? '' : undefined}
      data-invalid={isInvalid ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
    >
      {editing ? (
        <>
          <Input
            ref={setInputRef}
            aria-label={label}
            size={size}
            value={draft}
            onChange={onInputChange}
            onKeyDown={onInputKeyDown}
            invalid={isInvalid}
            aria-describedby={describedBy}
            rootProps={{ 'data-part': 'control' } as ComponentProps<'div'>}
          />
          <IconButton data-part="save" icon="check" label={saveLabel} size={iconSize} onMouseDown={keepFocus} onClick={() => save(true)} />
          <IconButton data-part="cancel" icon="close" label={cancelLabel} size={iconSize} onMouseDown={keepFocus} onClick={cancel} />
        </>
      ) : (
        <Button
          ref={display}
          data-part="display"
          emphasis="ghost"
          size={size}
          end="edit"
          disabled={disabled}
          aria-label={name}
          aria-describedby={describedBy}
          onClick={start}
        >
          {empty ? placeholder : current}
        </Button>
      )}
      {message !== null && (
        <p data-part="error" id={errorId}>
          <Icon name="danger" size="md" />
          <span>{message}</span>
        </p>
      )}
      <span data-part="status" role="status">
        {status}
      </span>
    </div>
  );
}
