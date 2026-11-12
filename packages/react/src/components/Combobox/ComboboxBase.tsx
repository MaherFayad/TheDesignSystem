'use client';
// The internals Combobox and Autocomplete share: a text input with
// role combobox, a popup on Radix Popover holding a ListBox with
// virtualFocus, filtering through filterListBoxItems, the result count
// announced once per query, and the themed portal. Not exported from the
// package barrel: Autocomplete imports it from '../Combobox/ComboboxBase'.
//
//   mode 'select' (Combobox)      the value must be an option; the text is a
//                                 filter and goes back to the chosen label on
//                                 blur; the first match is highlighted, so
//                                 Enter picks it; trigger and clear buttons.
//   mode 'free'   (Autocomplete)  the value is the text; options are
//                                 suggestions; nothing is highlighted until an
//                                 arrow key moves, so Enter keeps the typed text.
//
// The DOM (Combobox; Autocomplete has no trigger and no clear):
//
//   <div data-ds="combobox" data-size data-shape data-invalid? data-disabled? data-readonly? data-loading?>
//     <input data-part="control" role="combobox" aria-expanded aria-controls aria-activedescendant aria-autocomplete="list">
//     <button data-ds="icon-button" data-part="clear" tabindex="-1">     clears the value
//     <button data-ds="icon-button" data-part="trigger" tabindex="-1">   opens and closes the list
//     <span data-part="status" role="status">                            the result count, visually hidden
//   <body>
//     <div data-ds="theme" data-menu-layer>                              the portal Theme (the DropdownMenu pattern)
//       <div data-radix-popper-content-wrapper>
//         <div data-ds="combobox" data-part="popup" data-size data-state>  Radix Popover Content, its own root
//           <div data-ds="list-box" role="listbox">                      the options
//           <div data-part="empty">                                      no match, or loading
//
// The popup is its own root carrying the parent's part name (anatomy.md, as
// the DropdownMenu sub-content), so its parts belong to it once it is
// portaled out of the field. data-state (open, closed) is on the popup only:
// the field reads as open through aria-expanded on the input. Focus never leaves the input: the ListBox
// options take no focus and the input points aria-activedescendant at the
// highlighted one.
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { createPortal } from 'react-dom';
import { Popover } from 'radix-ui';
import { edgeEnabledIndex, nextEnabledIndex, type Shape, type Size } from '@the-system/shared';
import { Theme } from '../../theme/Theme';
import { useTheme } from '../../theme/hooks';
import { useField, useFieldControl } from '../Field/Field';
import { IconButton } from '../IconButton';
import {
  ListBox,
  filterListBoxItems,
  flattenListBoxItems,
  listBoxOptionId,
  type ListBoxItem,
  type ListBoxOption,
} from '../ListBox';
import { useControllable } from '../Window/useControllable';

export type ComboboxSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type ComboboxShape = Extract<Shape, 'default' | 'pill'>;

/** Space kept between the popup and the viewport edge, in CSS px (Radix measures in px). */
const VIEWPORT_GUTTER = 8;
/** Gap between the field and the popup, in CSS px. */
const FIELD_GAP = 4;
/** The count is announced once typing pauses this long, so a screen reader says it once per query. */
const ANNOUNCE_DELAY = 400;

/** The default result count, pluralized for the language (Western digits in Arabic too). */
export function defaultResultCount(count: number, lang: string): string {
  if (lang.startsWith('ar')) {
    const rule = new Intl.PluralRules('ar').select(count);
    if (count === 0) return 'ما فيه نتائج';
    if (rule === 'one') return 'نتيجة وحدة';
    if (rule === 'two') return 'نتيجتين';
    if (rule === 'few') return `${count} نتائج`;
    return `${count} نتيجة`;
  }
  if (count === 0) return 'No results';
  return new Intl.PluralRules('en').select(count) === 'one' ? '1 result' : `${count} results`;
}

/** The words of the buttons and the popup, per language. */
const words = {
  en: { trigger: 'Show options', clear: 'Clear value', empty: 'No results. Try another word.', loading: 'Loading options' },
  ar: { trigger: 'عرض الخيارات', clear: 'مسح القيمة', empty: 'ما فيه نتائج. جرب كلمة ثانية.', loading: 'جار تحميل الخيارات' },
} as const;

export interface ComboboxBaseProps
  extends Omit<
    ComponentProps<'input'>,
    'size' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'onSelect' | 'title' | 'ref' | 'className' | 'style' | 'children' | 'role'
  > {
  /** The options, plain or in titled groups. They are filtered by the text. */
  items: readonly ListBoxItem[];
  /** Field height and the row size of the list. Default md. */
  size?: ComboboxSize;
  /** default: the style's control radius. pill: fully round. */
  shape?: ComboboxShape;
  /** The popup is open, controlled with onOpenChange. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The text in the field, controlled with onInputValueChange. */
  inputValue?: string;
  defaultInputValue?: string;
  onInputValueChange?: (text: string) => void;
  /** Marks the value invalid. Inside a Field it follows the Field. */
  invalid?: boolean;
  /** Options are on their way: the trigger shows a spinner, the popup says so, data-loading is set. */
  loading?: boolean;
  /** Shown in the popup when nothing matches. Default "No results. Try another word." (Arabic in an Arabic Theme). */
  empty?: ReactNode;
  /** The words the popup and the status say while loading. Default "Loading options". */
  loadingLabel?: string;
  /** The words read for the result count after each query. Default "3 results", pluralized in Arabic. */
  formatCount?: (count: number) => string;
  /** ArrowDown on the last option goes to the first. Default true. */
  loop?: boolean;
  /** Class name of the root, the bordered box. */
  className?: string;
  /** Inline style of the root, the bordered box. */
  style?: ComponentProps<'div'>['style'];
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
  /** Goes to the native input. */
  ref?: Ref<HTMLInputElement>;
}

interface ModeProps {
  ds: 'combobox' | 'autocomplete';
  mode: 'select' | 'free';
  /** select mode: the chosen option value. */
  value: string | null;
  /** Chooses an option (click, Enter) or clears (null). */
  onSelect: (option: ListBoxOption | null) => void;
  /** The text to show for the chosen value when not typing (select mode). */
  selectedLabel: string;
  triggerLabel?: string;
  clearLabel?: string;
  /** Submits the value under this name: a hidden input in select mode, the input itself in free mode. */
  name?: string;
  /** free mode: Enter with nothing highlighted, with the typed text. */
  onCommit?: (text: string) => void;
}

/** Portals its child into <body> inside a Theme that copies every axis of the Theme it is rendered in. */
function usePopupLayer(open: boolean) {
  const theme = useTheme();
  const [body, setBody] = useState<HTMLElement | null>(null);
  useEffect(() => setBody(document.body), []);
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  const openRef = useRef(open);
  openRef.current = open;
  // The layer leaves once the content has played its exit and unmounted.
  const onContent = useCallback((node: HTMLElement | null) => {
    if (!node && !openRef.current) setMounted(false);
  }, []);
  const render = (children: ReactNode) =>
    body && mounted
      ? createPortal(
          <Theme
            style={theme.style}
            scheme={theme.scheme}
            density={theme.density}
            contrast={theme.contrast}
            platform={theme.platform}
            glass={theme.glass}
            dir={theme.dir}
            lang={theme.lang}
            data-menu-layer=""
          >
            {children}
          </Theme>,
          body,
        )
      : null;
  return { render, onContent };
}

export function ComboboxBase({
  ds,
  mode,
  value,
  onSelect,
  selectedLabel,
  triggerLabel,
  clearLabel,
  name,
  onCommit,
  items,
  size = 'md',
  shape = 'default',
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  inputValue: inputProp,
  defaultInputValue,
  onInputValueChange,
  invalid,
  loading = false,
  empty,
  loadingLabel,
  formatCount,
  loop = true,
  disabled,
  readOnly,
  required,
  className,
  style,
  rootProps,
  id,
  ref,
  placeholder,
  'aria-describedby': describedBy,
  onKeyDown,
  onBlur,
  onFocus,
  onClick,
  ...rest
}: ComboboxBaseProps & ModeProps) {
  const control = useFieldControl({ id, 'aria-describedby': describedBy, invalid, disabled, readOnly, required });
  const inert = Boolean(control.disabled || control.readOnly);
  const field = useField();
  const lang: 'en' | 'ar' = useTheme().lang.startsWith('ar') ? 'ar' : 'en';
  const t = words[lang];

  const [open, setOpenState] = useControllable(openProp, defaultOpen, onOpenChange);
  const [text, setText] = useControllable(inputProp, defaultInputValue ?? (mode === 'select' ? selectedLabel : ''), onInputValueChange);
  // select mode: the list is filtered only after the person types; opening on a chosen value shows every option.
  const [typed, setTyped] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const autoId = useId().replace(/:/g, '');
  const listId = `ds-${ds}-list-${autoId}`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const query = mode === 'free' || typed ? text : '';
  const shown = useMemo(() => filterListBoxItems(items, query), [items, query]);
  const options = useMemo(() => flattenListBoxItems(shown), [shown]);
  const hasOptions = options.length > 0;
  // What to say when nothing matches: select mode says the default unless empty is null; free mode says only an empty it is given.
  const emptyContent = mode === 'select' ? (empty === null ? null : (empty ?? t.empty)) : (empty ?? null);
  // The popup needs a list or something to say. A free text field with no suggestion shows nothing.
  const popupOpen = open && !inert && (hasOptions || loading || emptyContent !== null);
  const isDisabled = useCallback((i: number) => options[i]?.disabled ?? false, [options]);

  const firstEnabled = useCallback(() => {
    const i = edgeEnabledIndex(options.length, 'first', isDisabled);
    return i === -1 ? null : (options[i]?.value ?? null);
  }, [options, isDisabled]);

  // Keep the selected label in the field when the value changes from outside and nobody is typing.
  const lastLabel = useRef(selectedLabel);
  useEffect(() => {
    if (mode !== 'select' || lastLabel.current === selectedLabel) return;
    lastLabel.current = selectedLabel;
    if (!typed) setText(selectedLabel);
  }, [mode, selectedLabel, typed, setText]);

  // The highlight stays on a visible option; select mode lands on the first match while typing.
  const highlightVisible = highlighted !== null && options.some((o) => o.value === highlighted && !o.disabled);
  useEffect(() => {
    if (!open) return;
    if (highlighted !== null && !highlightVisible) setHighlighted(mode === 'select' && typed ? firstEnabled() : null);
  }, [open, highlighted, highlightVisible, mode, typed, firstEnabled]);

  // The highlight lands on the first match after each keystroke in select mode, from the filtered list itself.
  const highlightFirst = useRef(false);
  useEffect(() => {
    if (!highlightFirst.current) return;
    highlightFirst.current = false;
    setHighlighted(firstEnabled());
  }, [options, firstEnabled]);

  // The result count, once per query, after typing pauses. The status empties first, so the same count
  // after a new query is read again. formatCount is read through a ref, so an inline function does not restart the timer.
  const [status, setStatus] = useState('');
  const count = options.length;
  const formatRef = useRef(formatCount);
  formatRef.current = formatCount;
  useEffect(() => {
    setStatus('');
    // Only what is shown is announced: a free text field with no suggestion stays silent.
    if (!popupOpen) return undefined;
    const timer = setTimeout(() => {
      if (loading) setStatus(loadingLabel ?? t.loading);
      else setStatus(formatRef.current ? formatRef.current(count) : defaultResultCount(count, lang));
    }, ANNOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [popupOpen, query, count, loading, loadingLabel, lang, t.loading]);

  const openList = (highlight: 'selected' | 'first' | 'last' | 'none') => {
    if (inert) return;
    setOpenState(true);
    if (highlight === 'none') return;
    if (highlight === 'selected' && value !== null && options.some((o) => o.value === value)) {
      setHighlighted(value);
      return;
    }
    const i = highlight === 'last' ? edgeEnabledIndex(options.length, 'last', isDisabled) : edgeEnabledIndex(options.length, 'first', isDisabled);
    setHighlighted(i === -1 ? null : (options[i]?.value ?? null));
  };

  const close = () => {
    setOpenState(false);
    setHighlighted(null);
  };

  /** select mode: the field goes back to the chosen label. */
  const restore = () => {
    if (mode !== 'select') return;
    setTyped(false);
    setText(selectedLabel);
  };

  const choose = (option: ListBoxOption) => {
    if (option.disabled || inert) return;
    onSelect(option);
    setTyped(false);
    setText(option.label);
    lastLabel.current = mode === 'select' ? option.label : lastLabel.current;
    close();
  };

  const move = (step: 1 | -1) => {
    const from = highlighted === null ? -1 : options.findIndex((o) => o.value === highlighted);
    const next = nextEnabledIndex(options.length, from, step, isDisabled, loop);
    if (next !== -1) setHighlighted(options[next]?.value ?? null);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    // keyCode 229: Safari confirms an IME composition with an Enter that says isComposing false.
    if (event.defaultPrevented || event.nativeEvent.isComposing || event.keyCode === 229) return;
    const key = event.key;
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (!popupOpen) {
        // Alt+ArrowUp closes in APG; on a closed list it does nothing.
        if (event.altKey && key === 'ArrowUp') return;
        if (event.altKey) openList('none');
        else openList(key === 'ArrowDown' ? (mode === 'select' ? 'selected' : 'first') : 'last');
        return;
      }
      if (event.altKey && key === 'ArrowUp') {
        // Alt+ArrowUp: choose the highlighted option and close (APG).
        const option = options.find((o) => o.value === highlighted);
        if (option) choose(option);
        else close();
        return;
      }
      move(key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (key === 'Enter') {
      if (!open) {
        if (mode === 'free') onCommit?.(text);
        return;
      }
      const option = options.find((o) => o.value === highlighted);
      if (option) {
        // Enter picks the option; it does not submit the form.
        event.preventDefault();
        choose(option);
        return;
      }
      if (mode === 'free') onCommit?.(text);
      close();
      return;
    }
    if (key === 'Escape') {
      // What counts is what the person sees: an open state with nothing to show closes and clears at once.
      if (popupOpen) {
        event.preventDefault();
        close();
        if (mode === 'select') restore();
        return;
      }
      // A second Escape clears the field.
      if (open) close();
      if (text !== '' || (mode === 'select' && value !== null)) {
        event.preventDefault();
        if (inert) return;
        setText('');
        setTyped(false);
        if (mode === 'select') onSelect(null);
      }
    }
  };

  const onInputChange = (next: string) => {
    if (inert) return;
    setText(next);
    setTyped(true);
    if (!open) setOpenState(true);
    // select mode: the first match is highlighted once the list has filtered (the effect below), so Enter picks it.
    highlightFirst.current = mode === 'select';
    setHighlighted(null);
  };

  const onInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);
    const next = event.relatedTarget as Node | null;
    // Focus that stays in the field (its buttons) or in the popup is not a blur of the combobox.
    if (next && (rootRef.current?.contains(next) || document.getElementById(popupId)?.contains(next))) return;
    if (open) close();
    if (mode === 'select') {
      if (typed && text.trim() === '') onSelect(null);
      else restore();
    }
  };

  const setInputRef = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const activeId = open && highlighted !== null && highlightVisible ? listBoxOptionId(listId, highlighted) : undefined;
  const listSize = size === 'sm' ? 'sm' : 'md';
  const showClear = mode === 'select' && !inert && (value !== null || text !== '');

  const layer = usePopupLayer(popupOpen);
  // An expanded combobox controls something: the list, or the popup that says nothing matched.
  const popupId = `${listId}-popup`;
  const controls = popupOpen ? (hasOptions ? listId : popupId) : undefined;

  const popup = (
    <Popover.Content
      ref={layer.onContent}
      side="bottom"
      align="start"
      sideOffset={FIELD_GAP}
      collisionPadding={VIEWPORT_GUTTER}
      // A popup of options, not a dialog: no role of its own, focus stays in the input.
      role={undefined}
      aria-label={undefined}
      data-ds={ds}
      id={popupId}
      data-part="popup"
      data-size={size}
      // A press anywhere in the popup (padding, a group label, the scrollbar) keeps focus in the input.
      onMouseDown={(e) => e.preventDefault()}
      onOpenAutoFocus={(e) => e.preventDefault()}
      onCloseAutoFocus={(e) => e.preventDefault()}
      onInteractOutside={(e) => {
        if (rootRef.current?.contains(e.target as Node)) e.preventDefault();
      }}
    >
      {hasOptions && (
        <ListBox
          id={listId}
          aria-label={rest['aria-label']}
          aria-labelledby={rest['aria-labelledby'] ?? (rest['aria-label'] ? undefined : field?.labelId)}
          items={shown}
          size={listSize}
          virtualFocus
          query={query}
          highlightedValue={highlighted}
          onHighlightedValueChange={setHighlighted}
          value={mode === 'select' ? value : null}
          onOptionSelect={(v) => {
            const option = options.find((o) => o.value === v);
            if (option) choose(option);
          }}
        />
      )}
      {!hasOptions && (loading || emptyContent !== null) && <div data-part="empty">{loading ? (loadingLabel ?? t.loading) : emptyContent}</div>}
    </Popover.Content>
  );

  return (
    <Popover.Root
      open={popupOpen}
      modal={false}
      // Escape while open, or a press outside the field and the popup: close, and the field shows the chosen label.
      // Radix handles that Escape first and marks it handled, so the input's own Escape rule (clear) runs only when closed.
      onOpenChange={(next) => {
        if (next) return;
        close();
        restore();
      }}
    >
      <Popover.Anchor asChild>
        <div
          {...rootProps}
          ref={rootRef}
          className={className}
          style={style}
          data-ds={ds}
          data-size={size}
          data-shape={shape}
          data-invalid={control['aria-invalid'] ? '' : undefined}
          data-disabled={control.disabled ? '' : undefined}
          data-readonly={control.readOnly ? '' : undefined}
          data-loading={loading ? '' : undefined}
          onMouseDown={(event) => {
            rootProps?.onMouseDown?.(event);
            // A press on the box, not on the input or a button, focuses the input.
            if (event.defaultPrevented || event.target !== event.currentTarget) return;
            event.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <input
            {...rest}
            {...control}
            ref={setInputRef}
            type="text"
            // free mode: the text is the value, so the input itself submits it.
            name={mode === 'free' ? name : undefined}
            role="combobox"
            data-part="control"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={placeholder}
            value={text}
            aria-expanded={popupOpen}
            aria-controls={controls}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-busy={loading || undefined}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onInputKeyDown}
            onBlur={onInputBlur}
            onFocus={onFocus}
            onClick={(event) => {
              onClick?.(event);
              if (!event.defaultPrevented && !open && mode === 'select') openList('selected');
            }}
          />
          {mode === 'select' && name !== undefined && <input type="hidden" name={name} value={value ?? ''} disabled={control.disabled} />}
          {showClear && (
            <IconButton
              data-part="clear"
              icon="close"
              label={clearLabel ?? t.clear}
              size="xs"
              tabIndex={-1}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setText('');
                setTyped(false);
                onSelect(null);
                inputRef.current?.focus();
              }}
            />
          )}
          {mode === 'select' && (
            <IconButton
              data-part="trigger"
              icon="chevron-down"
              label={triggerLabel ?? t.trigger}
              size="xs"
              tabIndex={-1}
              loading={loading}
              loadingLabel={loadingLabel ?? t.loading}
              disabled={inert}
              aria-expanded={popupOpen}
              aria-controls={controls}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (open) {
                  close();
                  restore();
                } else {
                  setTyped(false);
                  openList('selected');
                }
                inputRef.current?.focus();
              }}
            />
          )}
          <span data-part="status" role="status">
            {status}
          </span>
        </div>
      </Popover.Anchor>
      {layer.render(popup)}
    </Popover.Root>
  );
}
