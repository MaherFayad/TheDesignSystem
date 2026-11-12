'use client';
// TagField: type and add free tags, with optional suggestions. Hand built;
// the suggestions are a ListBox with virtualFocus in a Radix Popover, as in
// Autocomplete (any text is allowed, nothing is highlighted until an arrow
// key moves, so Enter adds the typed text).
//
// The order names Figma-Killer-2 `TagPill/` and `AddablePropertyField/` as
// sources. They were not reachable in the lane session. The box follows the
// Combobox field (the Input box), the tags follow Chip (a soft pill with a
// remove button named "Remove <label>"), the popup the list family popup.
//
// The DOM:
//
//   <div data-ds="tag-field" data-size data-shape data-invalid? data-disabled? data-readonly?>   root: the bordered box, wraps
//     <div data-part="tags" role="group" aria-labelledby aria-disabled?>  display contents: the tags sit in the box's flow
//       <span data-part="tag">
//         <span data-part="tag-label">
//         <button data-ds="close-button" data-part="tag-remove" tabindex="-1" aria-label="Remove tag design">
//     <input data-part="control" role="combobox"? aria-expanded? aria-controls? aria-activedescendant?>
//     <span data-part="status" role="status">                             every add, removal and refusal, visually hidden
//   <p data-ds="field-error" id>                                           after the root, only while text was refused (max or a duplicate)
//   <body>
//     <div data-ds="theme" data-menu-layer>
//       <div data-ds="tag-field" data-part="popup" data-size data-state>  Radix Popover Content, its own root
//         <div data-ds="list-box" role="listbox">                         the suggestions not added yet
//
// Keys in the control: Enter, the comma and the Arabic comma add the typed
// text (pasting text with commas or lines adds each part). Backspace on an
// empty control focuses the last tag's remove button; Backspace or Delete
// there removes it. The arrow key toward the start (reading direction), with
// the caret at the start, moves to the last tag; the arrows move between
// tags and past the last one back to the control. The remove buttons are not
// in the tab order: the control is the one tab stop.
//
// Text that is refused (past max, or a duplicate) is said twice: once in the
// polite status and as a visible message under the box (a FieldError of its
// own, outside any Field wiring) that the control is described by. The
// message clears on the next edit, add or removal.
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type Ref,
} from 'react';
import { Popover } from 'radix-ui';
import {
  addTags,
  hasTag,
  hasTagSeparator,
  nextEnabledIndex,
  splitTags,
  type Shape,
  type Size,
} from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { CloseButton } from '../CloseButton';
import { useField, useFieldControl } from '../Field/Field';
import { FieldContext } from '../Field/context';
import { FieldError } from '../FieldError/FieldError';
import { ListBox, filterListBoxItems, flattenListBoxItems, listBoxOptionId, type ListBoxItem, type ListBoxOption } from '../ListBox';
import { usePopupLayer } from '../Select/popupLayer';
import { useFlipGroup, useStaggerOnOpen } from '../ListBox/selectionMotion';

/** The tags and the input of the box, the items that move together. */
const tagsAndInputOf = (root: Element) => Array.from(root.querySelectorAll(":scope > [data-part='tags'] > [data-part='tag'], :scope > [data-part='control']"));
import { useControllable } from '../../internal/useControllable';

export type TagFieldSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type TagFieldShape = Extract<Shape, 'default' | 'pill'>;

const VIEWPORT_GUTTER = 8;
const FIELD_GAP = 4;
const EMPTY: readonly string[] = [];

const words = {
  en: {
    remove: (tag: string) => `Remove tag ${tag}`,
    added: (tags: string[]) => (tags.length === 1 ? `Added tag ${tags[0]}` : `Added ${tags.length} tags`),
    removed: (tag: string) => `Removed tag ${tag}`,
    duplicate: (tag: string) => `${tag} is already added`,
    full: (max: number) => `You can add up to ${max} ${max === 1 ? 'tag' : 'tags'}`,
  },
  ar: {
    remove: (tag: string) => `حذف الوسم ${tag}`,
    added: (tags: string[]) => (tags.length === 1 ? `أضفنا الوسم ${tags[0]}` : `أضفنا الوسوم: ${tags.length}`),
    removed: (tag: string) => `حذفنا الوسم ${tag}`,
    duplicate: (tag: string) => `الوسم ${tag} مضاف من قبل`,
    full: (max: number) => `الحد الأعلى للوسوم: ${max}`,
  },
} as const;

export interface TagFieldProps
  extends Omit<
    ComponentProps<'input'>,
    'size' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'title' | 'ref' | 'className' | 'style' | 'children' | 'role' | 'max'
  > {
  /** The tags, controlled with onValueChange. */
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (tags: string[]) => void;
  /** Suggested tags, plain or in groups, as ListBox takes them. Choosing one adds its label. Tags already added are not suggested. */
  suggestions?: readonly ListBoxItem[];
  /** The most tags. Text past it stays in the control, and a message under the box says why. */
  max?: number;
  /** Box height at one line, and the row size of the suggestions. Default md. */
  size?: TagFieldSize;
  /** default: the style's control radius. pill: fully round. */
  shape?: TagFieldShape;
  /** Marks the value invalid. Inside a Field it follows the Field. */
  invalid?: boolean;
  /** The name of each remove button. Default "Remove tag <tag>" (Arabic in an Arabic Theme). */
  removeLabel?: (tag: string) => string;
  /** The words read once after a removal. Default "Removed tag <tag>". */
  formatRemoved?: (tag: string) => string;
  /** Submits each tag under this name in a form (one hidden input per tag). */
  name?: string;
  className?: string;
  style?: ComponentProps<'div'>['style'];
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
  /** Goes to the native input. */
  ref?: Ref<HTMLInputElement>;
}

/**
 * A box of tags and a text control: Enter or a comma adds the typed text as
 * a tag, each tag has a remove button. Duplicates are dropped, case and
 * diacritic insensitive. Native input props go to the input; className,
 * style and rootProps to the root box.
 */
export function TagField({
  value: valueProp,
  defaultValue = EMPTY,
  onValueChange,
  suggestions,
  max,
  size = 'md',
  shape = 'default',
  invalid,
  disabled,
  readOnly,
  required,
  removeLabel,
  formatRemoved,
  name,
  className,
  style,
  rootProps,
  id,
  ref,
  placeholder,
  'aria-describedby': describedBy,
  onKeyDown,
  onBlur,
  onPaste,
  ...rest
}: TagFieldProps) {
  const [notice, setNotice] = useState('');
  const noticeId = `ds-tag-field-notice-${useId().replace(/:/g, '')}`;
  const control = useFieldControl({
    id,
    'aria-describedby': [describedBy, notice ? noticeId : undefined].filter(Boolean).join(' ') || undefined,
    invalid,
    disabled,
    readOnly,
    required,
  });
  const field = useField();
  const inert = Boolean(control.disabled || control.readOnly);
  const lang: 'en' | 'ar' = useTheme().lang.startsWith('ar') ? 'ar' : 'en';
  const t = words[lang];
  const { dir } = useTheme();

  const onArrayChange = useCallback((next: readonly string[]) => onValueChange?.([...next]), [onValueChange]);
  const [tags, setTags] = useControllable<readonly string[]>(valueProp, defaultValue, onArrayChange);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const autoId = useId().replace(/:/g, '');
  const listId = `ds-tag-field-list-${autoId}`;
  const popupId = `${listId}-popup`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const removeRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Suggestions: the ones not added yet that match the text.
  const unused = useMemo(() => {
    if (!suggestions) return [];
    const keep = (o: ListBoxOption) => !hasTag(tags, o.label);
    return suggestions
      .map((item) => ('options' in item ? { ...item, options: item.options.filter(keep) } : item))
      .filter((item) => ('options' in item ? item.options.length > 0 : keep(item)));
  }, [suggestions, tags]);
  const shown = useMemo(() => filterListBoxItems(unused, text), [unused, text]);
  const options = useMemo(() => flattenListBoxItems(shown), [shown]);
  const hasSuggestions = suggestions !== undefined;
  const popupOpen = hasSuggestions && open && !inert && options.length > 0;
  const highlightVisible = highlighted !== null && options.some((o) => o.value === highlighted);

  // Frames still to run are cancelled on unmount, so none sets state after it.
  const frames = useRef(new Set<number>());
  useEffect(() => {
    const pending = frames.current;
    return () => {
      pending.forEach((frame) => cancelAnimationFrame(frame));
      pending.clear();
    };
  }, []);
  const nextFrame = (run: () => void) => {
    const frame = requestAnimationFrame(() => {
      frames.current.delete(frame);
      run();
    });
    frames.current.add(frame);
  };

  // The status empties first, so the same words after a second removal are read again.
  const say = (words: string) => {
    setStatus('');
    nextFrame(() => setStatus(words));
  };

  /**
   * Adds the parts and says what happened once. A refusal (past max, or a
   * duplicate) also shows as the visible message. Returns the parts that were
   * not added past max, so they stay in the control.
   */
  const add = (incoming: string[]): string[] => {
    if (inert || incoming.length === 0) return [];
    const result = addTags(tags, incoming, max);
    if (result.added.length) setTags(result.tags);
    const refused =
      result.overflow.length && max !== undefined
        ? t.full(max)
        : result.duplicates.length
          ? t.duplicate(result.duplicates[0] ?? '')
          : '';
    setNotice(refused);
    if (refused) say(refused);
    else if (result.added.length) say(t.added(result.added));
    return result.overflow;
  };

  const remove = (index: number) => {
    if (inert) return;
    const tag = tags[index];
    if (tag === undefined) return;
    setTags(tags.filter((_, i) => i !== index));
    setNotice('');
    say(formatRemoved ? formatRemoved(tag) : t.removed(tag));
  };

  // Where focus goes after a removal, once the tags have rendered again.
  const focusAfter = useRef<number | 'control' | null>(null);
  useEffect(() => {
    const target = focusAfter.current;
    if (target === null) return;
    focusAfter.current = null;
    if (target === 'control') inputRef.current?.focus();
    else (removeRefs.current[target] ?? inputRef.current)?.focus();
  }, [tags]);

  const removeAt = (index: number) => {
    // The next tag takes the index; at the end, the one before; with none left, the control.
    const left = tags.length - 1;
    focusAfter.current = left === 0 ? 'control' : index < left ? index : index - 1;
    // A controlled parent may refuse the removal: then nothing moves focus later.
    nextFrame(() => {
      focusAfter.current = null;
    });
    remove(index);
  };

  const close = () => {
    setOpen(false);
    setHighlighted(null);
  };

  const choose = (option: ListBoxOption) => {
    if (option.disabled) return;
    add([option.label]);
    setText('');
    close();
  };

  const commitText = () => {
    const parts = splitTags(text);
    if (parts.length === 0) return false;
    // Text past max stays in the control, so nothing typed is lost.
    setText(add(parts).join(', '));
    close();
    return true;
  };

  const backKey = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
  const forwardKey = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing || event.keyCode === 229) return;
    const key = event.key;
    const input = event.currentTarget;
    const atStart = input.selectionStart === 0 && input.selectionEnd === 0;
    if (popupOpen && (key === 'ArrowDown' || key === 'ArrowUp')) {
      event.preventDefault();
      const from = highlighted === null ? -1 : options.findIndex((o) => o.value === highlighted);
      const next = nextEnabledIndex(options.length, from, key === 'ArrowDown' ? 1 : -1, (i) => options[i]?.disabled ?? false, true);
      if (next !== -1) setHighlighted(options[next]?.value ?? null);
      return;
    }
    if (!popupOpen && key === 'ArrowDown' && hasSuggestions && !inert) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (key === 'Enter') {
      const option = popupOpen ? options.find((o) => o.value === highlighted) : undefined;
      if (option) {
        event.preventDefault();
        choose(option);
        return;
      }
      // Enter with text adds it and does not submit the form; on an empty control it does what the form does.
      if (text.trim() && !inert) {
        event.preventDefault();
        commitText();
      }
      return;
    }
    if (key === 'Escape' && popupOpen) {
      event.preventDefault();
      close();
      return;
    }
    if (key === 'Backspace' && text === '' && tags.length > 0 && !inert) {
      event.preventDefault();
      removeRefs.current[tags.length - 1]?.focus();
      return;
    }
    if (key === backKey && atStart && tags.length > 0) {
      event.preventDefault();
      removeRefs.current[tags.length - 1]?.focus();
    }
  };

  const onRemoveKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const key = event.key;
    if (key === 'Backspace' || key === 'Delete') {
      event.preventDefault();
      if (!inert) removeAt(index);
      return;
    }
    if (key === backKey) {
      event.preventDefault();
      removeRefs.current[Math.max(0, index - 1)]?.focus();
      return;
    }
    if (key === forwardKey) {
      event.preventDefault();
      if (index >= tags.length - 1) inputRef.current?.focus();
      else removeRefs.current[index + 1]?.focus();
      return;
    }
    if (key === 'Home' || key === 'End') {
      event.preventDefault();
      if (key === 'Home') removeRefs.current[0]?.focus();
      else inputRef.current?.focus();
    }
  };

  const onInputChange = (next: string) => {
    if (inert) return;
    if (hasTagSeparator(next)) {
      // Every part before the last separator becomes a tag. Parts past max and
      // the text after the last separator stay in the control, as with Enter.
      const lastSep = Math.max(next.lastIndexOf(','), next.lastIndexOf('،'), next.lastIndexOf('\n'));
      const overflow = add(splitTags(next.slice(0, lastSep)));
      const tail = next.slice(lastSep + 1).trimStart();
      setText([...overflow, tail].filter(Boolean).join(', '));
      close();
      return;
    }
    setText(next);
    setNotice('');
    setHighlighted(null);
    if (hasSuggestions) setOpen(next.trim() !== '');
  };

  const onInputPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    onPaste?.(event);
    if (event.defaultPrevented || inert) return;
    const pasted = event.clipboardData.getData('text');
    // A single line inputs as typed text; text with separators or lines becomes tags at once.
    if (!hasTagSeparator(pasted)) return;
    event.preventDefault();
    // The paste replaces the selection, as a native paste does.
    const input = event.currentTarget;
    const start = input.selectionStart ?? text.length;
    const end = input.selectionEnd ?? text.length;
    setText(add(splitTags(text.slice(0, start) + pasted + text.slice(end))).join(', '));
  };

  const onInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);
    const next = event.relatedTarget as Node | null;
    if (next && (rootRef.current?.contains(next) || document.getElementById(popupId)?.contains(next))) return;
    close();
  };

  const setInputRef = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const layer = usePopupLayer(popupOpen);
  // menu-rows: the suggestions arrive one stagger step after the popup surface, each time it opens.
  const popupRef = useStaggerOnOpen("[data-ds='list-box'] [data-part='option']", layer.onContent);
  // collection-flip: tags move, pop in and shrink out; the input closes the gap with them.
  useFlipGroup(rootRef, { items: tagsAndInputOf });
  const activeId = popupOpen && highlightVisible && highlighted !== null ? listBoxOptionId(listId, highlighted) : undefined;
  const labelledBy = rest['aria-labelledby'] ?? (rest['aria-label'] ? undefined : field?.labelId);

  const popup = (
    <Popover.Content
      ref={popupRef}
      side="bottom"
      align="start"
      sideOffset={FIELD_GAP}
      collisionPadding={VIEWPORT_GUTTER}
      role={undefined}
      aria-label={undefined}
      id={popupId}
      data-ds="tag-field"
      data-part="popup"
      data-size={size}
      onMouseDown={(e) => e.preventDefault()}
      onOpenAutoFocus={(e) => e.preventDefault()}
      onCloseAutoFocus={(e) => e.preventDefault()}
      onInteractOutside={(e) => {
        if (rootRef.current?.contains(e.target as Node)) e.preventDefault();
      }}
    >
      <ListBox
        id={listId}
        aria-labelledby={labelledBy}
        aria-label={rest['aria-label']}
        items={shown}
        size={size === 'sm' ? 'sm' : 'md'}
        virtualFocus
        query={text}
        highlightedValue={highlighted}
        onHighlightedValueChange={setHighlighted}
        value={null}
        onOptionSelect={(v) => {
          const option = options.find((o) => o.value === v);
          if (option) choose(option);
        }}
      />
    </Popover.Content>
  );

  return (
    <Popover.Root
      open={popupOpen}
      modal={false}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <Popover.Anchor asChild>
        <div
          {...rootProps}
          ref={rootRef}
          className={className}
          style={style}
          data-ds="tag-field"
          data-size={size}
          data-shape={shape}
          data-invalid={control['aria-invalid'] ? '' : undefined}
          data-disabled={control.disabled ? '' : undefined}
          data-readonly={control.readOnly ? '' : undefined}
          onMouseDown={(event) => {
            rootProps?.onMouseDown?.(event);
            // A press on the box, not on the input or a remove button, focuses the input.
            if (event.defaultPrevented || event.target !== event.currentTarget) return;
            event.preventDefault();
            inputRef.current?.focus();
          }}
        >
          {tags.length > 0 && (
            <div
              data-part="tags"
              role="group"
              aria-labelledby={labelledBy}
              aria-label={rest['aria-label']}
              // A disabled field: the group of tags reads as unavailable, like the native disabled control beside it.
              aria-disabled={control.disabled || undefined}
            >
              {tags.map((tag, i) => (
                // Keyed by the tag (tags are unique), so a removal keeps the elements of the tags after it.
                <span key={tag} data-part="tag">
                  <span data-part="tag-label">{tag}</span>
                  {!control.readOnly && (
                    <CloseButton
                      ref={(node: HTMLButtonElement | null) => {
                        removeRefs.current[i] = node;
                      }}
                      data-part="tag-remove"
                      size="xs"
                      tabIndex={-1}
                      disabled={control.disabled}
                      label={removeLabel ? removeLabel(tag) : t.remove(tag)}
                      onClick={() => {
                        if (!inert) removeAt(i);
                      }}
                      onKeyDown={(event) => onRemoveKeyDown(event, i)}
                    />
                  )}
                </span>
              ))}
            </div>
          )}
          <input
            {...rest}
            {...control}
            ref={setInputRef}
            type="text"
            data-part="control"
            role={hasSuggestions ? 'combobox' : undefined}
            aria-expanded={hasSuggestions ? popupOpen : undefined}
            aria-controls={popupOpen ? listId : undefined}
            aria-activedescendant={activeId}
            aria-autocomplete={hasSuggestions ? 'list' : undefined}
            autoComplete="off"
            enterKeyHint="enter"
            placeholder={placeholder}
            value={text}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onInputKeyDown}
            onPaste={onInputPaste}
            onBlur={onInputBlur}
          />
          {name !== undefined &&
            tags.map((tag, i) => (
              <input key={`${i}-${tag}`} type="hidden" name={name} value={tag} form={rest.form} disabled={control.disabled} />
            ))}
          <span data-part="status" role="status">
            {status}
          </span>
        </div>
      </Popover.Anchor>
      {/* Out of the Field wiring: the Field's own error keeps its id and the Field stays valid. */}
      <FieldContext value={null}>
        <FieldError id={noticeId} size={size === 'sm' ? 'sm' : 'md'}>
          {notice}
        </FieldError>
      </FieldContext>
      {layer.render(popup)}
    </Popover.Root>
  );
}
