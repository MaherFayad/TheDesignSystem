'use client';
// CommandPalette: search and run commands from anywhere. A modal on Radix
// Dialog through DialogBase (the themed portal, the focus rule and the focus
// return, toasts above, scroll lock), a SearchField as the search box, and a
// list of commands on the shared listbox logic. Mod+K (Command K on a Mac,
// Control K elsewhere) opens and closes it from anywhere on the page.
//
// Sources: Figma-Killer-2 `ContextMenu/MenuSearchHeader.tsx` (the query is
// owned by the header, the list only renders what matches), GoBanana
// `shortcutKeys.ts` through @the-system/shared shortcut.ts (Mod resolves to
// Command or Control, the keycaps drawn by Kbd). GoBanana was not reachable
// in this session; the look follows Dialog and ListBox.
//
// Why the list is not a ListBox root: a part belongs to the nearest root. The
// order names item, group and shortcut as parts of the palette, and ListBox
// has no slot at the end of an option for the shortcut. So the palette draws
// its own listbox, on the same logic as ListBox: filterListBoxItems (Arabic
// folding through filter.ts), listBoxOptionId, nextEnabledIndex and
// edgeEnabledIndex from @the-system/shared, and the same row tokens.
//
// Focus stays in the search box. The box is a combobox that points
// aria-activedescendant at the highlighted command, as in Combobox.
//
//   <body>
//     <div data-ds="theme" data-dialog-layer>
//       <div data-ds="command-palette" data-size data-state data-loading?>
//         <div data-part="backdrop">                             Radix Overlay
//         <div data-part="panel" role="dialog">                  Radix Content
//           <h2 data-part="title">                               visually hidden, names the dialog
//           <div data-ds="search-field" data-part="search">      input role combobox
//           <button data-ds="icon-button" data-part="close">     at the inline end of the search band
//           <div data-part="list" role="listbox">
//             <div data-part="group" role="group">
//               <div data-part="group-label">
//               <div data-part="item" role="option" aria-selected data-highlighted? data-disabled?>
//                 <span data-part="item-icon">
//                 <span data-part="item-label">                  the match in a <mark>
//                 <span data-part="item-description">
//                 <kbd data-ds="kbd" data-part="shortcut">
//           <div data-part="empty">                              in place of the list
//           <span data-part="status" role="status">              the result count, once per query
//           <div data-part="footer">                             key hints
//
// Motion (order 1.22, proposed). CommandPalette.css springs the panel open
// (interaction "command-palette-open"). Here: the rows of results arrive one
// stagger step apart on open and on each new list (staggerGroup, capped at
// eight rows; the lit row is there at once, it shows where the arrow keys
// are), while the rows that stay from the last list slide to their new
// place (a FLIP, interaction "command-palette-results"); and the lit fill
// slides from the old row to the new one (interaction
// "command-palette-row-slide"). Typing is never held back: the list is
// rendered at once and only its drawing moves.
//
// Running a command closes the palette first. The command runs once the
// palette has closed and focus is back where it was (the Radix close focus
// event), so a command may move focus itself.
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Dialog as RadixDialog } from 'radix-ui';
import { Icon, type IconName } from '@the-system/icons/react';
import { ariaKeyShortcuts, edgeEnabledIndex, matchRanges, nextEnabledIndex, type OverlaySize } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { useControllable } from '../../internal/useControllable';
import { DialogBase, assignRef, type DialogBaseState } from '../Dialog/DialogBase';
import { defaultResultCount } from '../Combobox/ComboboxBase';
import { IconButton } from '../IconButton';
import { Kbd, useKeyboardPlatform } from '../Kbd';
import { filterListBoxItems, listBoxOptionId, type ListBoxItem, type ListBoxOption } from '../ListBox';
import { SearchField } from '../SearchField';
import { hasCommandModifier, isEditableTarget, matchShortcut } from './matchShortcut';
import { flipPlay, flipSnapshot, staggerGroup, type FlipSnapshot } from '@the-system/motion';
import { useMotion } from '../../internal/motion';
import { HighlightMarker, useHighlightMarker } from '../ListBox/highlightMarker';

/** The most rows that stagger in; the rest of a long list is there at once. */
const STAGGER_ROWS = 8;

/** Widths from the dialog width tokens: md 520, lg 640 px. */
export type CommandPaletteSize = Extract<OverlaySize, 'md' | 'lg'>;

/** One command. `value` is unique in the palette. */
export interface CommandPaletteCommand {
  value: string;
  /** The visible name, plain text, a verb plus a noun: Create board. */
  label: string;
  /** A second line, read as the description of the command. */
  description?: string;
  /** Leading icon or node. Decorative. */
  start?: IconName | ReactElement;
  /** The command's own shortcut, drawn as keycaps at the end of the row: `Mod+Shift+N`. */
  shortcut?: string;
  /** More words the command is found by. Not shown. */
  keywords?: readonly string[];
  /** Stays in the list, announced as unavailable, skipped by the arrow keys, never run. */
  disabled?: boolean;
  /** Runs when the command is chosen, after the palette has closed. */
  onRun?: () => void;
}

/** A titled group of commands. */
export interface CommandPaletteGroup {
  /** The visible group title, which also names the group. */
  label: string;
  commands: readonly CommandPaletteCommand[];
  /** A stable key. Default: the label. */
  key?: string;
}

export type CommandPaletteItem = CommandPaletteCommand | CommandPaletteGroup;

function isGroup(item: CommandPaletteItem): item is CommandPaletteGroup {
  return 'commands' in item;
}

/** The built in words, per language. A prop always wins. */
const paletteWords = {
  en: {
    label: 'Command palette',
    closeLabel: 'Close command palette',
    placeholder: 'Search commands',
    clear: 'Clear search',
    loading: 'Loading commands',
    empty: 'No commands match. Try another word.',
    recent: 'Recent',
    move: 'Move',
    run: 'Run',
    close: 'Close',
  },
  ar: {
    label: 'لوحة الأوامر',
    closeLabel: 'إغلاق لوحة الأوامر',
    placeholder: 'بحث في الأوامر',
    clear: 'مسح البحث',
    loading: 'جار تحميل الأوامر',
    empty: 'ما فيه أوامر مطابقة. جرب كلمة ثانية.',
    recent: 'آخر الأوامر',
    move: 'تنقل',
    run: 'تشغيل',
    close: 'إغلاق',
  },
} as const;

function wordsFor(lang: string) {
  return lang === 'ar' || lang.startsWith('ar-') ? paletteWords.ar : paletteWords.en;
}

/** The count is announced once typing pauses this long, so a screen reader says it once per query. */
const ANNOUNCE_DELAY = 400;

interface PaletteContextValue extends DialogBaseState {
  shortcut: string | null;
  /** What had focus when the shortcut opened the palette; null when a trigger opened it. */
  openedFrom: { current: Element | null };
}

/** One row of the list: a command in a group (the recent group repeats commands, so rows have their own key). */
interface Row {
  key: string;
  command: CommandPaletteCommand;
}

/** A drawn group: a title (or none for loose commands) and its rows. */
interface Section {
  key: string;
  label: string | null;
  rows: Row[];
}

/** The label with the matched range wrapped in <mark>. */
function MarkedLabel({ text, query }: { text: string; query: string }) {
  const [range] = query ? matchRanges(text, query) : [];
  if (!range) return <>{text}</>;
  return (
    <>
      {text.slice(0, range.start)}
      <mark>{text.slice(range.start, range.end)}</mark>
      {text.slice(range.end)}
    </>
  );
}

/** The commands as ListBox items, so filterListBoxItems can rank them. */
function toListItems(items: readonly CommandPaletteItem[]): ListBoxItem[] {
  return items.map((item) =>
    isGroup(item) ? { label: item.label, key: item.key ?? item.label, options: item.commands as readonly ListBoxOption[] } : (item as ListBoxOption),
  );
}

// ------------------------------------------------------------------ CommandPalette

export interface CommandPaletteProps {
  /** Controlled open state, with onOpenChange. */
  open?: boolean;
  /** Default false. */
  defaultOpen?: boolean;
  /** Called with true for the open shortcut and the trigger, false for Escape, a backdrop click and a run. */
  onOpenChange?: (open: boolean) => void;
  /** The commands, plain or in titled groups. */
  items: readonly CommandPaletteItem[];
  /** Runs when a command is chosen, after its own onRun, once the palette has closed. */
  onRun?: (value: string, command: CommandPaletteCommand) => void;
  /** Values of recently run commands, newest first. Shown as the first group while the query is empty. */
  recent?: readonly string[];
  /** The title of the recent group. Default "Recent". */
  recentLabel?: string;
  /** md 520px, lg 640px wide. Default md. */
  size?: CommandPaletteSize;
  /**
   * The shortcut that opens and closes the palette from anywhere on the
   * page. `Mod` is Command on a Mac and Control elsewhere. null turns it off.
   * Default `Mod+K`.
   */
  shortcut?: string | null;
  /** The accessible name of the palette (a visually hidden title). Default "Command palette". */
  label?: string;
  /** The accessible name of the close button. Default "Close command palette". */
  closeLabel?: string;
  /** The search box placeholder. Default "Search commands". */
  placeholder?: string;
  /** The query, controlled, with onQueryChange. */
  query?: string;
  /** The first query when uncontrolled. Default empty. */
  defaultQuery?: string;
  /** Called on every edit of the query. */
  onQueryChange?: (query: string) => void;
  /** Commands are on their way: a spinner in the search box and a polite status. */
  loading?: boolean;
  /** What the palette says while loading. Default "Loading commands". */
  loadingLabel?: string;
  /** Shown when no command matches: say what to do next. Default "No commands match. Try another word." */
  empty?: ReactNode;
  /** The announced result count. Default "3 results", pluralized per language. */
  formatCount?: (count: number) => string;
  /** The key hints at the bottom. false hides them. Default: move, run and close. */
  footer?: ReactNode;
  /** false keeps the palette open after a run. Default true. */
  closeOnRun?: boolean;
  /** A CommandPaletteTrigger, for a visible way in. */
  children?: ReactNode;
  /** Class name of the root, the layer that holds the backdrop and the panel. */
  className?: string;
  /** Inline style of the root. */
  style?: CSSProperties;
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

/**
 * A modal that searches the commands and runs the chosen one. Typing
 * filters; ArrowDown and ArrowUp move; Enter runs; Escape clears the query,
 * then closes. The shortcut opens it from anywhere.
 */
export function CommandPalette({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  items,
  onRun,
  recent,
  recentLabel,
  size = 'md',
  shortcut = 'Mod+K',
  label,
  closeLabel,
  placeholder,
  query: queryProp,
  defaultQuery = '',
  onQueryChange,
  loading = false,
  loadingLabel,
  empty,
  formatCount,
  footer,
  closeOnRun = true,
  children,
  className,
  style,
  rootProps,
}: CommandPaletteProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const [query, setQuery] = useControllable(queryProp, defaultQuery, onQueryChange);
  const triggerRef = useRef<HTMLElement | null>(null);
  const theme = useTheme();
  const words = wordsFor(theme.lang);
  const platform = useKeyboardPlatform();
  const autoId = useId().replace(/:/g, '');
  const listId = `ds-command-palette-${autoId}-list`;

  // The open shortcut, from anywhere on the page. It also closes an open palette.
  const openRef = useRef(open);
  openRef.current = open;
  const openedFrom = useRef<Element | null>(null);
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;
  useEffect(() => {
    if (!shortcut) return undefined;
    const listener = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return;
      // A shortcut with no Ctrl, Meta or Alt (/ or ?) types a character, so it never fires while the person types in a field (WCAG 2.1.4).
      if (!hasCommandModifier(shortcut, platform) && isEditableTarget(event.target)) return;
      if (!matchShortcut(event, shortcut, platform)) return;
      event.preventDefault();
      if (!openRef.current) openedFrom.current = document.activeElement;
      setOpenRef.current(!openRef.current);
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [shortcut, platform]);

  // A closed palette forgets its query, so it opens empty next time (uncontrolled only).
  useEffect(() => {
    if (!open && queryProp === undefined && query !== defaultQuery) setQuery(defaultQuery);
  }, [open, queryProp, query, defaultQuery, setQuery]);

  const state = useMemo<PaletteContextValue>(
    () => ({ open, setOpen, dismissible: true, triggerRef, shortcut, openedFrom }),
    [open, setOpen, shortcut],
  );

  // The sections and rows on show: the recent group first while the query is empty, then the matches.
  const sections = useMemo<Section[]>(() => {
    const out: Section[] = [];
    const typed = query.trim() !== '';
    if (!typed && recent && recent.length > 0) {
      const all = new Map<string, CommandPaletteCommand>();
      for (const item of items) {
        if (isGroup(item)) for (const c of item.commands) all.set(c.value, c);
        else all.set(item.value, item);
      }
      const rows = recent.flatMap((value) => {
        const command = all.get(value);
        return command ? [{ key: `recent:${value}`, command }] : [];
      });
      if (rows.length) out.push({ key: 'recent', label: recentLabel ?? words.recent, rows });
    }
    let loose: Row[] = [];
    const flush = (i: number) => {
      if (loose.length) out.push({ key: `loose-${i}`, label: null, rows: loose });
      loose = [];
    };
    filterListBoxItems(toListItems(items), query).forEach((item, i) => {
      if ('options' in item) {
        flush(i);
        out.push({
          key: `group:${item.key ?? item.label}`,
          label: item.label,
          rows: item.options.map((o) => ({ key: o.value, command: o as CommandPaletteCommand })),
        });
      } else {
        loose.push({ key: item.value, command: item as CommandPaletteCommand });
      }
    });
    flush(-1);
    return out;
  }, [items, query, recent, recentLabel, words.recent]);
  const rows = useMemo(() => sections.flatMap((s) => s.rows), [sections]);
  const isDisabled = useCallback((i: number) => rows[i]?.command.disabled ?? false, [rows]);

  // The highlight lands on the first enabled command when the palette opens and after each keystroke.
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const firstKey = useMemo(() => {
    const i = edgeEnabledIndex(rows.length, 'first', isDisabled);
    return i === -1 ? null : (rows[i]?.key ?? null);
  }, [rows, isDisabled]);
  const firstKeyRef = useRef(firstKey);
  firstKeyRef.current = firstKey;
  useEffect(() => {
    if (open) setHighlighted(firstKeyRef.current);
  }, [open, query]);
  // Commands that arrive later (loaded) keep the arrow position; a highlight that left the list goes back to the first.
  useEffect(() => {
    if (open && (highlighted === null || !rows.some((r) => r.key === highlighted))) setHighlighted(firstKey);
  }, [open, rows, highlighted, firstKey]);
  const highlightIndex = highlighted === null ? -1 : rows.findIndex((r) => r.key === highlighted);

  // Keep the highlighted row in view when the keys move it.
  const listRef = useRef<HTMLDivElement | null>(null);
  const fromKeys = useRef(false);
  const rowId = useCallback((key: string) => listBoxOptionId(listId, key), [listId]);
  useEffect(() => {
    if (!fromKeys.current || highlighted === null) return;
    fromKeys.current = false;
    listRef.current?.querySelector<HTMLElement>(`#${CSS.escape(rowId(highlighted))}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [highlighted, rowId]);

  // Interaction "highlight-marker" (order 1.23; it replaces the ::after slide of command-palette-row-slide):
  // one marker in the list draws the lit fill and slides from row to row, and follows the lit row on a new query.
  const motion = useMotion();
  const markerRef = useHighlightMarker({ rows: '[data-part="item"]', interaction: 'command-palette-row-slide' });
  // Stable, so the marker keeps watching the list across renders.
  const setListRef = useCallback(
    (node: HTMLDivElement | null) => {
      listRef.current = node;
      markerRef(node);
    },
    [markerRef],
  );

  // Interaction "command-palette-results": the rows arrive in order on open
  // and on a new list; rows that stay slide from where they were. The
  // snapshot is taken before the query changes (onQueryInput), while the old
  // rows are still drawn.
  const rowsBefore = useRef<FlipSnapshot | null>(null);
  const shownOnce = useRef(false);
  useLayoutEffect(() => {
    const list = listRef.current;
    const snap = rowsBefore.current;
    rowsBefore.current = null;
    if (!open) {
      shownOnce.current = false;
      return;
    }
    if (!list) return;
    const mode = motion.mode('command-palette-results');
    const all = Array.from(list.querySelectorAll<HTMLElement>('[data-part="item"]'));
    const first = !shownOnce.current;
    shownOnce.current = true;
    if (!first && !snap) return;
    const staying = snap ? all.filter((el) => snap.rects.has(el)) : [];
    if (snap && staying.length) flipPlay(snap, { items: staying, spring: 'snappy', enter: 'none', mode });
    // The lit row is there at once: the one lit now, and the first one, which the highlight lands on after a new list.
    const litIds = new Set([highlighted, firstKey].filter((k): k is string => k !== null).map(rowId));
    const arriving = all.filter((el) => !staying.includes(el) && !litIds.has(el.id)).slice(0, STAGGER_ROWS);
    // On open the rows follow the panel by one step.
    staggerGroup(arriving, { mode, offset: first ? 1 : 0 });
    // Runs when the list changes; the highlight is read as it is then.
  }, [open, rows, motion]);
  const onQueryInput = (next: string) => {
    const list = listRef.current;
    if (list) rowsBefore.current = flipSnapshot(list.querySelectorAll('[data-part="item"]'));
    setQuery(next);
  };

  // The result count, once per query, after typing pauses. The status empties first, so the same count after a new query is read again.
  const [status, setStatus] = useState('');
  const formatRef = useRef(formatCount);
  formatRef.current = formatCount;
  // Distinct commands: the recent group repeats commands that also show below it.
  const count = useMemo(() => new Set(rows.map((r) => r.command.value)).size, [rows]);
  useEffect(() => {
    setStatus('');
    if (!open) return undefined;
    const timer = setTimeout(() => {
      // SearchField's own status says the loading label.
      if (!loading) setStatus(formatRef.current ? formatRef.current(count) : defaultResultCount(count, theme.lang));
    }, ANNOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [open, query, count, loading, loadingLabel, words.loading, theme.lang]);

  // The command waiting for the palette to close.
  const pending = useRef<CommandPaletteCommand | null>(null);
  useEffect(() => {
    if (open) pending.current = null;
  }, [open]);
  const runRow = (row: Row | undefined) => {
    if (!row || row.command.disabled) return;
    const fire = (command: CommandPaletteCommand) => {
      command.onRun?.();
      onRun?.(command.value, command);
    };
    if (!closeOnRun) {
      fire(row.command);
      return;
    }
    pending.current = row.command;
    setOpen(false);
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = nextEnabledIndex(rows.length, highlightIndex, event.key === 'ArrowDown' ? 1 : -1, isDisabled, true);
      if (next !== -1) {
        fromKeys.current = true;
        setHighlighted(rows[next]?.key ?? null);
      }
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      runRow(rows[highlightIndex]);
    }
  };

  const hasRows = rows.length > 0;
  const activeId = highlighted !== null && highlightIndex !== -1 ? rowId(highlighted) : undefined;

  const renderRow = (row: Row) => {
    const { command } = row;
    const id = rowId(row.key);
    const lit = row.key === highlighted;
    const off = command.disabled === true;
    return (
      <div
        key={row.key}
        id={id}
        role="option"
        data-part="item"
        aria-selected={lit}
        aria-disabled={off || undefined}
        aria-labelledby={`${id}-label`}
        aria-describedby={command.description ? `${id}-description` : undefined}
        aria-keyshortcuts={command.shortcut ? ariaKeyShortcuts(command.shortcut, platform) : undefined}
        data-highlighted={lit ? '' : undefined}
        data-disabled={off ? '' : undefined}
        onPointerMove={off || lit ? undefined : () => setHighlighted(row.key)}
        // Focus stays in the search box: a press on a row must not move it.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => runRow(row)}
      >
        {command.start !== undefined && (
          <span data-part="item-icon" aria-hidden="true">
            {typeof command.start === 'string' ? <Icon name={command.start} size="md" /> : command.start}
          </span>
        )}
        <span data-part="item-label" id={`${id}-label`}>
          <MarkedLabel text={command.label} query={query} />
        </span>
        {command.description !== undefined && (
          <span data-part="item-description" id={`${id}-description`}>
            {command.description}
          </span>
        )}
        {command.shortcut && (
          <Kbd data-part="shortcut" size="xs" decorative>
            {command.shortcut}
          </Kbd>
        )}
      </div>
    );
  };

  const hints =
    footer === undefined ? (
      <>
        <span data-part="hint">
          <Kbd size="xs" decorative separator="">
            ↑↓
          </Kbd>
          {words.move}
        </span>
        <span data-part="hint">
          <Kbd size="xs" decorative>
            Enter
          </Kbd>
          {words.run}
        </span>
        <span data-part="hint">
          <Kbd size="xs" decorative>
            Esc
          </Kbd>
          {words.close}
        </span>
      </>
    ) : (
      footer
    );

  return (
    <RadixDialog.Root open={open} onOpenChange={setOpen}>
      <PaletteContext value={state}>{children}</PaletteContext>
      <DialogBase
        state={state}
        kind="command-palette"
        devName="CommandPalette"
        rootAttributes={{ 'data-size': size, 'data-loading': loading }}
        Backdrop={RadixDialog.Overlay}
        Panel={RadixDialog.Content}
        panelProps={{ 'aria-describedby': undefined }}
        className={className}
        style={style}
        rootProps={rootProps}
        onCloseAutoFocus={(event) => {
          // Opened by the shortcut: focus goes back to what had it then, not to a trigger elsewhere on the page.
          const from = openedFrom.current;
          openedFrom.current = null;
          if (from instanceof HTMLElement && from.isConnected && from !== document.body) {
            event.preventDefault();
            from.focus();
          }
          // DialogBase returns focus right after this; the command runs once that is done.
          const command = pending.current;
          pending.current = null;
          if (!command) return;
          queueMicrotask(() => {
            command.onRun?.();
            onRun?.(command.value, command);
          });
        }}
      >
        <RadixDialog.Title data-part="title">{label ?? words.label}</RadixDialog.Title>
        <SearchField
          size="lg"
          value={query}
          onValueChange={onQueryInput}
          placeholder={placeholder ?? words.placeholder}
          clearLabel={words.clear}
          loading={loading}
          loadingLabel={loadingLabel ?? words.loading}
          rootProps={{ 'data-part': 'search' } as ComponentProps<'div'>}
          data-autofocus=""
          role="combobox"
          aria-label={placeholder ?? words.placeholder}
          aria-expanded={hasRows}
          aria-controls={hasRows ? listId : undefined}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-busy={loading || undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onKeyDown={onSearchKeyDown}
        />
        {/* A visible way out for touch and pointer, and a second tab stop next to the search box. */}
        <RadixDialog.Close asChild>
          <IconButton data-part="close" icon="close" label={closeLabel ?? words.closeLabel} size="sm" />
        </RadixDialog.Close>
        {hasRows ? (
          <div
            ref={setListRef}
            id={listId}
            role="listbox"
            data-part="list"
            aria-label={label ?? words.label}
          >
            {sections.map((section, i) =>
              section.label === null ? (
                section.rows.map(renderRow)
              ) : (
                <div key={section.key} role="group" data-part="group" aria-labelledby={`${listId}-group-${i}`}>
                  <div data-part="group-label" id={`${listId}-group-${i}`} role="presentation">
                    {section.label}
                  </div>
                  {section.rows.map(renderRow)}
                </div>
              ),
            )}
            <HighlightMarker />
          </div>
        ) : (
          <div data-part="empty">{loading ? (loadingLabel ?? words.loading) : (empty ?? words.empty)}</div>
        )}
        <span data-part="status" role="status">
          {status}
        </span>
        {footer !== false && footer !== null && <div data-part="footer">{hints}</div>}
      </DialogBase>
    </RadixDialog.Root>
  );
}

// ------------------------------------------------------------------ CommandPaletteTrigger

export interface CommandPaletteTriggerProps extends Omit<ComponentProps<typeof RadixDialog.Trigger>, 'asChild' | 'children'> {
  /** One element, a system Button, that opens the palette. It also says the shortcut through aria-keyshortcuts. */
  children: ReactElement;
}

/** A visible way to open the palette. Renders its child, a Button. Focus returns to it on close. */
export function CommandPaletteTrigger({ children, ref, ...rest }: CommandPaletteTriggerProps) {
  const ctx = use(PaletteContext);
  if (!ctx) throw new Error('CommandPaletteTrigger must be used inside a CommandPalette.');
  const platform = useKeyboardPlatform();
  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      ctx.triggerRef.current = node;
      assignRef(ref, node);
    },
    [ctx.triggerRef, ref],
  );
  return (
    <RadixDialog.Trigger
      {...rest}
      ref={setRef}
      onClick={(event) => {
        rest.onClick?.(event);
        ctx.openedFrom.current = null;
      }}
      aria-keyshortcuts={ctx.shortcut ? ariaKeyShortcuts(ctx.shortcut, platform) : undefined}
      asChild
    >
      {children}
    </RadixDialog.Trigger>
  );
}
