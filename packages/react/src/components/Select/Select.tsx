'use client';
// Select: one value from a list in a closed trigger. Behavior from Radix
// Select (the trigger has role combobox, the list role listbox, focus moves
// into the list while it is open, typeahead on the trigger and in the list).
//
// The order names Figma-Killer-2 `Select/` (with `selectKeyboard.ts`) and
// GoBanana `.st-menu` as sources. Neither repo was reachable in the lane
// session. The trigger follows the Combobox field (the Input box), the list
// follows the Combobox popup and its rows equal ListBox option rows (the same
// row height, padding, gap, radius, type and highlight tokens).
//
// The DOM:
//
//   <button data-ds="select" role="combobox" aria-expanded data-size data-shape
//           data-placeholder? data-invalid? data-disabled? data-readonly? data-loading?>   Radix Trigger, the root
//     <span data-part="value">                     the chosen label, or the placeholder
//     <span data-part="icon">                      chevrons-up-down, or a spinner while loading
//   <body>
//     <div data-ds="theme" data-menu-layer>        the portal Theme, only while open
//       <div data-radix-popper-content-wrapper>
//         <div data-ds="select" data-part="content" data-size data-state="open">   Radix Content, its own root
//           <div data-part="scroll-up">            shown when the list scrolls up
//           <div data-part="viewport" role="presentation">
//             <div data-part="item" role="option" data-state="checked|unchecked" data-highlighted? data-disabled?>
//               <span data-part="indicator">       the check, on every row so labels line up
//               <span data-part="item-icon">       leading icon, decorative
//               <span data-part="item-label">      Radix ItemText: the trigger shows this text
//               <span data-part="item-description">
//             <div data-part="group" role="group">
//               <div data-part="label">            the group title
//             <div data-part="separator">           between groups
//             <span data-part="highlight" aria-hidden>  the marker of the lit row (order 1.23)
//           <div data-part="scroll-down">
//
// The content is its own root carrying the parent's part name (anatomy.md,
// as the Combobox popup), so its parts belong to it once it is portaled.
// data-state (open) is on the content only: the trigger reads as open
// through aria-expanded, so the closed trigger stamps no data-state.
// Radix Select has no exit presence: the content leaves at once on close.
// With no option the list does not open (an empty listbox is not valid): the
// trigger is described by the empty words instead, as it is while loading.
import { useId, useLayoutEffect, useMemo, useRef, type ComponentProps, type ReactElement, type ReactNode, type Ref } from 'react';
import { ANIMATION_ID_PREFIX, readDuration, readEasing, type PatternMode } from '@the-system/motion';
import { createPortal } from 'react-dom';
import { Select as RadixSelect } from 'radix-ui';
import { Icon, type IconName } from '@the-system/icons/react';
import type { Shape, Size } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { useField, useFieldControl } from '../Field/Field';
import { flattenListBoxItems, isListBoxSection, listBoxOptionId, type ListBoxItem, type ListBoxOption } from '../ListBox';
import { Spinner } from '../Spinner';
import { useControllable } from '../../internal/useControllable';
import { useThemedLayer } from './popupLayer';
import { useMotion } from '../../internal/motion';
import { useStaggerOnOpen } from '../ListBox/selectionMotion';
import { HighlightMarker, drawnScale, useHighlightMarker } from '../ListBox/highlightMarker';

export type SelectSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type SelectShape = Extract<Shape, 'default' | 'pill'>;
export type SelectItem = ListBoxItem;
export type SelectOption = ListBoxOption;

/** Space kept between the list and the viewport edge, in CSS px (Radix measures in px). */
const VIEWPORT_GUTTER = 8;
/** Gap between the trigger and the list, in CSS px. */
const TRIGGER_GAP = 4;

const words = {
  en: { placeholder: 'Choose an option', empty: 'No options to choose from yet.', loading: 'Loading options' },
  ar: { placeholder: 'اختيار من القائمة', empty: 'ما فيه خيارات للاختيار.', loading: 'جار تحميل الخيارات' },
} as const;

export interface SelectProps
  extends Omit<
    ComponentProps<'button'>,
    'value' | 'defaultValue' | 'onChange' | 'title' | 'children' | 'type' | 'dir' | 'ref' | 'disabled'
  > {
  /** The options, plain or in titled groups, as ListBox takes them. A separator is drawn between groups. */
  items: readonly SelectItem[];
  /** The chosen option value, controlled with onValueChange. null: none, the placeholder shows. */
  value?: string | null;
  defaultValue?: string | null;
  /** Called with the chosen value. */
  onValueChange?: (value: string | null) => void;
  /** The list is open, controlled with onOpenChange. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Shown when nothing is chosen. Default "Choose an option" (Arabic in an Arabic Theme). */
  placeholder?: string;
  /** Trigger height and the row size of the list: sm uses sm rows, md and lg use list.row.height. Default md. */
  size?: SelectSize;
  /** default: the style's control radius. pill: fully round. Default default. */
  shape?: SelectShape;
  /** Marks the value invalid. Inside a Field it follows the Field. */
  invalid?: boolean;
  /** Native disabled: out of the tab order. Inside a Field it follows the Field. */
  disabled?: boolean;
  /** The value can be read and focused but not changed: the list does not open. */
  readOnly?: boolean;
  /** Read as required (aria-required). Inside a Field it follows the Field. */
  required?: boolean;
  /** Options are on their way: the icon is a spinner, aria-busy is set, the trigger is described by loadingLabel and the list does not open. */
  loading?: boolean;
  /** Read and shown while loading. Default "Loading options". */
  loadingLabel?: string;
  /**
   * With no option the list does not open and the trigger is described by
   * these words. Pass them: say why there is no option and what to do next
   * ("No statuses yet. Add one from Settings."). The default, "No options to
   * choose from yet.", cannot know the next step.
   */
  empty?: ReactNode;
  /** Submits the value under this name in a form (Radix renders a hidden native select). */
  name?: string;
  /** Goes to the trigger, the root. */
  ref?: Ref<HTMLButtonElement>;
}

const ROLL_ID = `${ANIMATION_ID_PREFIX}picker-value-roll`;

/**
 * Interaction "picker-value-roll": the value part rolls to the new label like
 * a drum. The new label comes up from one line below and the old one, drawn
 * once more by an inert aria-hidden copy laid over the value part, leaves one
 * line up. A clip-path that moves against the travel keeps both inside the
 * value box (the value part itself is what moves, so its own overflow cannot
 * clip it). The new label is the real text from the first frame. Reduced: a
 * fade of the new label. Never waits on animationend.
 */
function rollValue(el: HTMLElement | null, before: string | null, mode: PatternMode): void {
  if (!el || mode === 'none' || typeof el.animate !== 'function') return;
  const reduced = mode === 'reduced';
  const duration = readDuration(el, reduced ? 'duration.base' : 'duration.spring-snappy');
  for (const a of el.getAnimations?.() ?? []) if (String(a.id) === ROLL_ID) a.cancel();
  if (reduced) {
    el.animate([{ opacity: 0 }, { opacity: 1 }], { id: ROLL_ID, duration, easing: readEasing(el, 'ease.out') });
    return;
  }
  const easing = readEasing(el, 'ease.spring-snappy');
  el.animate(
    [
      { transform: 'translateY(100%)', clipPath: 'inset(0 0 100% 0)' },
      { transform: 'none', clipPath: 'inset(0 0 0 0)' },
    ],
    { id: ROLL_ID, duration, easing },
  );
  const host = el.parentElement;
  if (!before || !host) return;
  // The old label, once more, over the value part: it rolls up and out, faster than the new one comes in.
  const ghost = document.createElement('span');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.setAttribute('inert', '');
  ghost.textContent = before;
  // The value part may still be empty here (Radix fills it after this commit): the copy spans from its
  // inline start to the icon, over the full height of the trigger, its text centred as the value's is.
  const h = host.getBoundingClientRect();
  const v = el.getBoundingClientRect();
  const icon = el.nextElementSibling as HTMLElement | null;
  const hs = getComputedStyle(host);
  const rtl = hs.direction === 'rtl';
  // Drawn px back to CSS px (a CSS zoom on the page).
  const k = drawnScale(host);
  const start = (rtl ? h.right - v.right : v.left - h.left) / k - host.clientLeft;
  const padEnd = parseFloat(rtl ? hs.paddingLeft : hs.paddingRight) || 0;
  const gap = parseFloat(hs.columnGap) || 0;
  const room = host.clientWidth - start - padEnd - (icon?.offsetWidth ?? 0) - gap;
  const g = ghost.style;
  g.position = 'absolute';
  g.insetBlockStart = '0';
  g.insetInlineStart = `${start}px`;
  g.inlineSize = `${Math.max(0, room)}px`;
  g.blockSize = `${host.clientHeight}px`;
  g.display = 'flex';
  g.alignItems = 'center';
  g.overflow = 'hidden';
  g.whiteSpace = 'nowrap';
  g.textOverflow = 'ellipsis';
  g.pointerEvents = 'none';
  g.color = getComputedStyle(el).color;
  host.append(ghost);
  const out = ghost.animate(
    [
      { transform: 'none', clipPath: 'inset(0 0 0 0)', opacity: 1 },
      { transform: 'translateY(-100%)', clipPath: 'inset(100% 0 0 0)', opacity: 0 },
    ],
    { id: ROLL_ID, duration: readDuration(el, 'duration.quick') || duration, easing: readEasing(el, 'ease.exit'), fill: 'forwards' },
  );
  const drop = () => ghost.remove();
  out.finished.then(drop, drop);
}

function renderStart(start: IconName | ReactElement) {
  return typeof start === 'string' ? <Icon name={start} size="md" /> : start;
}

/**
 * A closed trigger that opens a list and keeps one value from it. Use it
 * for up to about 12 options people read rather than search; a longer list
 * is a Combobox. Props spread onto the trigger, which is the root.
 */
export function Select({
  items,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  placeholder,
  size = 'md',
  shape = 'default',
  invalid,
  disabled,
  readOnly,
  required,
  loading = false,
  loadingLabel,
  empty,
  name,
  form,
  id,
  'aria-describedby': describedBy,
  onKeyDown,
  onPointerDown,
  ref,
  ...rest
}: SelectProps) {
  const field = useField();
  const noteId = `ds-select-note-${useId().replace(/:/g, '')}`;
  const options = useMemo(() => flattenListBoxItems(items), [items]);
  const isEmpty = options.length === 0;
  // While loading, or with no option, the trigger is described by those words (the list cannot open to say them).
  const hasNote = loading || isEmpty;
  const control = useFieldControl({
    id,
    'aria-describedby': [describedBy, hasNote ? noteId : undefined].filter(Boolean).join(' ') || undefined,
    invalid,
    disabled,
    readOnly,
    required,
  });
  const { readOnly: controlReadOnly, disabled: controlDisabled, ...controlAttrs } = control;
  const lang: 'en' | 'ar' = useTheme().lang.startsWith('ar') ? 'ar' : 'en';
  const t = words[lang];
  const layer = useThemedLayer();
  const baseId = `ds-select-${useId().replace(/:/g, '')}`;

  const [value, setValue] = useControllable<string | null>(valueProp, defaultValue, onValueChange);
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const inert = Boolean(controlReadOnly || loading || isEmpty);
  const shown = open && !inert;
  const listSize = size === 'sm' ? 'sm' : 'md';

  // menu-rows: the rows arrive one stagger step after the surface.
  const contentRef = useStaggerOnOpen("[data-part='viewport'] [data-part='item']");
  // highlight-marker: one marker in the viewport draws the lit row's fill and slides between rows.
  const markerRef = useHighlightMarker({ rows: "[data-part='item']" });
  // picker-value-roll: the old label rolls up and out while the new one rolls in from below. Not on first paint.
  const motion = useMotion();
  const valueRef = useRef<HTMLSpanElement>(null);
  const lastValue = useRef(value);
  useLayoutEffect(() => {
    const was = lastValue.current;
    if (was === value) return;
    lastValue.current = value;
    const before = was === null ? (placeholder ?? t.placeholder) : (options.find((o) => o.value === was)?.label ?? null);
    rollValue(valueRef.current, before, motion.mode('picker-value-roll'));
    // Runs on a new value only; the labels are read as they are then.
  }, [value, motion]);

  const renderItem = (option: ListBoxOption) => {
    const descId = option.description ? `${listBoxOptionId(baseId, option.value)}-description` : undefined;
    return (
      <RadixSelect.Item
        key={option.value}
        value={option.value}
        disabled={option.disabled}
        textValue={option.label}
        data-part="item"
        aria-describedby={descId}
      >
        <span data-part="indicator" aria-hidden="true">
          {value === option.value && <Icon name="check" size="md" />}
        </span>
        {option.start !== undefined && (
          <span data-part="item-icon" aria-hidden="true">
            {renderStart(option.start)}
          </span>
        )}
        <RadixSelect.ItemText asChild>
          <span data-part="item-label">{option.label}</span>
        </RadixSelect.ItemText>
        {option.description !== undefined && (
          <span data-part="item-description" id={descId}>
            {option.description}
          </span>
        )}
      </RadixSelect.Item>
    );
  };

  let drawn = 0;
  const content = (
    <RadixSelect.Content
      ref={contentRef}
      position="popper"
      side="bottom"
      align="start"
      sideOffset={TRIGGER_GAP}
      collisionPadding={VIEWPORT_GUTTER}
      data-ds="select"
      data-part="content"
      aria-labelledby={rest['aria-labelledby'] ?? (rest['aria-label'] ? undefined : field?.labelId)}
      aria-label={rest['aria-label']}
      data-size={listSize}
    >
      <RadixSelect.ScrollUpButton data-part="scroll-up">
        <Icon name="chevron-up" size="md" />
      </RadixSelect.ScrollUpButton>
      <RadixSelect.Viewport ref={markerRef} data-part="viewport">
        {items.map((item) => {
          if (!isListBoxSection(item)) {
            drawn += 1;
            return renderItem(item);
          }
          if (item.options.length === 0) return null;
          const key = item.key ?? item.label;
          // A separator only between drawn groups: an empty group earlier in the list draws none.
          const first = drawn === 0;
          drawn += 1;
          return [
            !first ? <RadixSelect.Separator key={`separator-${key}`} data-part="separator" /> : null,
            <RadixSelect.Group key={`group-${key}`} data-part="group">
              <RadixSelect.Label data-part="label">{item.label}</RadixSelect.Label>
              {item.options.map(renderItem)}
            </RadixSelect.Group>,
          ];
        })}
        <HighlightMarker />
      </RadixSelect.Viewport>
      <RadixSelect.ScrollDownButton data-part="scroll-down">
        <Icon name="chevron-down" size="md" />
      </RadixSelect.ScrollDownButton>
    </RadixSelect.Content>
  );

  return (
    <RadixSelect.Root
      // Radix reads '' as no value, so the placeholder shows.
      value={value ?? ''}
      onValueChange={(next) => setValue(next === '' ? null : next)}
      open={shown}
      onOpenChange={(next) => {
        if (next && inert) return;
        setOpen(next);
      }}
      disabled={controlDisabled}
      required={Boolean(control['aria-required'])}
      name={name}
      form={form}
    >
      <RadixSelect.Trigger
        {...rest}
        {...controlAttrs}
        ref={ref}
        data-ds="select"
        // The open state is on the content root only; the trigger reads as open through aria-expanded.
        data-state={undefined}
        data-size={size}
        data-shape={shape}
        data-invalid={control['aria-invalid'] ? '' : undefined}
        data-readonly={controlReadOnly ? '' : undefined}
        data-loading={loading ? '' : undefined}
        aria-readonly={controlReadOnly || undefined}
        aria-busy={loading || undefined}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          // Read only, loading and empty: the pointer does not open the list (Radix skips its handler).
          if (inert) event.preventDefault();
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          // Read only, loading and empty: no key opens the list or changes the value by typeahead.
          // Other keys (Tab, browser shortcuts with a modifier) pass.
          const opens = ['Enter', ' ', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key);
          const types = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
          if (inert && (opens || types)) event.preventDefault();
        }}
      >
        <RadixSelect.Value ref={valueRef} data-part="value" placeholder={placeholder ?? t.placeholder} />
        <RadixSelect.Icon data-part="icon">
          {loading ? <Spinner size="sm" decorative /> : <Icon name="chevrons-up-down" size="md" />}
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      {hasNote && (
        <span id={noteId} hidden>
          {loading ? (loadingLabel ?? t.loading) : (empty ?? t.empty)}
        </span>
      )}
      {shown && typeof document !== 'undefined' ? createPortal(layer(content), document.body) : content}
    </RadixSelect.Root>
  );
}
