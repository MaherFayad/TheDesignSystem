'use client';
// SelectionMenu: a horizontal menu of actions over a selection or a point
// (order M9.11, proposed). The edit menu capsule: cut, copy, paste and the
// app's own actions, in a row over a selection the app draws (a message, a
// canvas object, a chip, a block of read only text).
//
// The DOM:
//
//   <body>
//     <div data-ds="theme" data-selection-menu-layer>        the portal Theme, display: contents
//       <div data-radix-popper-content-wrapper>
//         <div data-ds="selection-menu" role="menu" aria-orientation="horizontal"
//              aria-label data-state data-side data-align>      Radix Popover Content
//           <div data-part="more" role="menuitem" aria-label>   back, on every page but the first
//           <span data-part="separator" aria-hidden="true">
//           <div data-part="item" role="menuitem" data-tone? data-disabled? aria-disabled?>
//             <svg data-ds="icon">                             when the action has an icon
//             <span>Copy</span>
//           <span data-part="separator" aria-hidden="true">
//           <div data-part="item" role="menuitem">...
//           <div data-part="more" role="menuitem" aria-label>   forward, on every page but the last
//
// Decisions:
// - Behavior: Radix Popover, not modal, anchored through a virtual anchor
//   (Tour does the same): the box of a Range, of a DOMRect getter, or of the
//   owner element. Radix keeps it on screen (collision padding) and follows
//   the selection when the page scrolls; it hides when the selection
//   scrolls away. The Content takes role menu, so the root is the menu.
// - Placement: above the selection, else below it when there is no room
//   above (selectionSide in @the-system/shared), so it never covers the
//   selection (WCAG 2.4.11). Radix flips the same way on scroll.
// - Keyboard: one tab stop (a roving tabindex). Left and Right move along
//   the row as drawn, so they swap in right to left layouts; Home and End go
//   to the ends of the row; Enter and Space run an action; Escape closes;
//   Tab closes. Closing from inside the menu returns focus to the owner.
// - Opening: the app passes open, or passes owner (the element that holds
//   the selection) and the menu opens itself: on Shift+F10 or the context
//   menu key while the owner has focus (focus moves to the first action),
//   and after a pointer selection inside the owner (focus stays where it
//   is, as on the platforms, so the selection keeps its look). It never
//   opens for a selection inside a native text field or an editable region:
//   the browser's own menu serves those.
// - A press on the menu does not take focus or clear the selection
//   (pointerdown is cancelled on the root); the action runs on click.
// - Overflow: when the actions do not fit the width, the row is split into
//   pages (pageActions in @the-system/shared); a forward control at the end
//   of a page shows the next one and a back control at its start the one
//   before, as the platforms do. Both are part more.
// - Clipboard: editActions() builds cut, copy and paste on the Clipboard
//   API, each only when the page may use it (clipboardAccess). Paste reads
//   the clipboard inside the click, a user activation.
// - Motion, pattern "menu-scale" (interaction "selection-menu-pop"): the
//   capsule grows from scale.menu-enter out of the selection side and fades
//   in on the snappy spring, and leaves faster. Paging swaps the row at once.
//   Under reduced motion it appears and leaves at once.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Popover as RadixPopover } from 'radix-ui';
import {
  clipboardAccess,
  EMPTY_SELECTION_BOX,
  isMenuKey,
  isTextEntry,
  pageActions,
  rangeRect,
  selectionBox,
  selectionSide,
  type SelectionBox,
  type SelectionSide,
} from '@the-system/shared';
import { Icon, type IconName } from '../Icon';
import { Theme } from '../../theme/Theme';
import { useTheme } from '../../theme/hooks';
import { useControllable } from '../../internal/useControllable';

/** One action of the menu. */
export interface SelectionMenuItem {
  /** A stable id, unique in the menu. */
  id: string;
  /** The visible label, and the accessible name. Short: one or two words. */
  label: string;
  /** A system icon drawn before the label. */
  icon?: IconName;
  /** danger draws a destructive action in the danger text color. */
  tone?: 'neutral' | 'danger';
  /** Runs the action. The menu closes after it. */
  onSelect: () => void;
  /** Shown but not run: stays focusable, aria-disabled. */
  disabled?: boolean;
}

/** What the menu points at: a Range, a box, a function that returns the box now, or nothing (the owner's box). */
export type SelectionMenuAnchor = Range | DOMRect | SelectionBox | (() => DOMRect | SelectionBox | null) | null;

export interface SelectionMenuProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect' | 'role' | 'children'> {
  /** The actions, in reading order. */
  items: readonly SelectionMenuItem[];
  /** Open, controlled. */
  open?: boolean;
  /** Open at first, uncontrolled. Default false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** What the menu points at. Without it, the selection inside the owner, else the owner's box. */
  anchor?: SelectionMenuAnchor;
  /**
   * The element that holds the selection. Given, the menu opens itself on
   * Shift+F10 or the context menu key on it and after a pointer selection
   * in it, and focus returns to it when the menu closes from inside.
   */
  owner?: RefObject<HTMLElement | null>;
  /** The accessible name of the menu. Default "Selection actions", or the Arabic. */
  label?: string;
  /** The accessible name of the forward control on a page that overflows. Default "More actions", or the Arabic. */
  overflowLabel?: string;
  /** The accessible name of the back control. Default "Previous actions", or the Arabic. */
  backLabel?: string;
  /** Move focus to the first action on open. Default: when the menu opened from the keyboard. */
  focusOnOpen?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/** The space between the selection and the menu, and from the viewport edges, in CSS px. */
const GAP = 8;
const EDGE = 8;

const WORDS = {
  en: { label: 'Selection actions', more: 'More actions', back: 'Previous actions', cut: 'Cut', copy: 'Copy', paste: 'Paste' },
  ar: { label: 'إجراءات التحديد', more: 'إجراءات أكثر', back: 'الإجراءات السابقة', cut: 'قص', copy: 'نسخ', paste: 'لصق' },
} as const;

function wordsFor(lang: string) {
  return lang === 'ar' || lang.startsWith('ar-') ? WORDS.ar : WORDS.en;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

function isRange(value: unknown): value is Range {
  return typeof value === 'object' && value !== null && 'startContainer' in value && 'getClientRects' in value;
}

function toBox(r: DOMRect | SelectionBox): SelectionBox {
  return selectionBox(r.x ?? r.left, r.y ?? r.top, r.width, r.height);
}

/**
 * The box the menu points at now: the anchor, else the selection inside the
 * owner (read live, so the menu follows it), else the owner's box.
 */
function anchorBox(anchor: SelectionMenuAnchor | undefined, owner: HTMLElement | null | undefined): SelectionBox {
  if (typeof anchor === 'function') {
    const r = anchor();
    if (r) return toBox(r);
  } else if (isRange(anchor)) {
    return rangeRect(anchor);
  } else if (anchor) {
    return toBox(anchor);
  }
  if (!owner) return EMPTY_SELECTION_BOX;
  const r = selectionIn(owner);
  return r ? rangeRect(r) : toBox(owner.getBoundingClientRect());
}

/** The current selection's range when it is not collapsed and lies inside `owner`, outside any text field. */
function selectionIn(owner: HTMLElement): Range | null {
  const sel = owner.ownerDocument.getSelection?.();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const r = sel.getRangeAt(0);
  if (!owner.contains(r.commonAncestorContainer) || isTextEntry(r.commonAncestorContainer)) return null;
  return r;
}

function SelectionMenuLayer({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const [body, setBody] = useState<HTMLElement | null>(null);
  // The portal needs the document, so it renders after the first commit (safe on the server).
  useEffect(() => setBody(document.body), []);
  if (!body) return null;
  return createPortal(
    <Theme
      style={theme.style}
      scheme={theme.scheme}
      density={theme.density}
      contrast={theme.contrast}
      platform={theme.platform}
      glass={theme.glass}
      dir={theme.dir}
      lang={theme.lang}
      data-selection-menu-layer=""
    >
      {children}
    </Theme>,
    body,
  );
}

type Entry = { kind: 'item'; index: number } | { kind: 'back' } | { kind: 'next' };

/** A horizontal menu of actions over a selection or a point: the edit menu capsule. */
export function SelectionMenu({
  items,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  anchor,
  owner,
  label,
  overflowLabel,
  backLabel,
  focusOnOpen,
  ref,
  className,
  style,
  onKeyDown,
  ...rest
}: SelectionMenuProps) {
  const theme = useTheme();
  const words = wordsFor(theme.lang);
  const [open, setOpenState] = useControllable(openProp, defaultOpen, onOpenChange);
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [side, setSide] = useState<SelectionSide>('top');
  const [pages, setPages] = useState<number[][] | null>(null);
  const [page, setPage] = useState(0);
  const [stop, setStop] = useState(0);
  const fromKeys = useRef(false);
  const returnTo = useRef<HTMLElement | null>(null);
  const focusBack = useRef(false);
  const suppressContextMenu = useRef(false);

  const currentRef = useRef(anchor);
  currentRef.current = anchor;
  const ownerRef = owner;

  const virtual = useMemo(
    () => ({
      current: {
        getBoundingClientRect: () => {
          const b = anchorBox(currentRef.current, ownerRef?.current);
          return { ...b, toJSON: () => b } as DOMRect;
        },
      },
    }),
    [ownerRef],
  );

  const setOpen = useCallback(
    (next: boolean) => {
      if (!next) {
        // Focus goes back only when it was in the menu, never pulled out of the page.
        const active = node?.ownerDocument.activeElement ?? null;
        focusBack.current = !!node && !!active && node.contains(active);
      } else {
        const doc = ownerRef?.current?.ownerDocument ?? (typeof document === 'undefined' ? null : document);
        const active = doc?.activeElement as HTMLElement | null | undefined;
        returnTo.current = active && active !== doc?.body ? active : null;
      }
      setOpenState(next);
    },
    [node, ownerRef, setOpenState],
  );

  // A new set of actions, or a new language, is measured again.
  const signature = items.map((i) => `${i.id}\u0000${i.label}\u0000${i.icon ?? ''}`).join('\u0001') + theme.lang + theme.platform + theme.density;
  useEffect(() => {
    setPages(null);
    setPage(0);
    setStop(0);
  }, [signature]);

  // Every open starts on the first page with the first action as the stop.
  useEffect(() => {
    if (!open) return;
    setPage(0);
    setStop(0);
  }, [open]);

  // Owner mode: the menu keys and a finished pointer selection open the menu.
  useEffect(() => {
    const el = ownerRef?.current;
    if (!el) return;
    const doc = el.ownerDocument;
    const view = doc.defaultView;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (!isMenuKey(event) || isTextEntry(event.target as Node)) return;
      event.preventDefault();
      suppressContextMenu.current = true;
      view?.setTimeout(() => {
        suppressContextMenu.current = false;
      }, 400);
      fromKeys.current = true;
      setOpen(true);
    };
    // The context menu key also fires contextmenu (on key up on some systems): the native menu stays shut then.
    const onContextMenu = (event: MouseEvent) => {
      if (suppressContextMenu.current) event.preventDefault();
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.button !== 0 || !el.contains(event.target as Node)) return;
      // The selection settles after pointerup in some engines.
      view?.setTimeout(() => {
        if (!selectionIn(el)) return;
        fromKeys.current = false;
        setOpen(true);
      }, 0);
    };
    el.addEventListener('keydown', onKey);
    el.addEventListener('contextmenu', onContextMenu);
    doc.addEventListener('pointerup', onPointerUp);
    return () => {
      el.removeEventListener('keydown', onKey);
      el.removeEventListener('contextmenu', onContextMenu);
      doc.removeEventListener('pointerup', onPointerUp);
    };
  }, [ownerRef, setOpen]);

  // Measure once per open and per set of actions: the side, and the pages that fit the width.
  useLayoutEffect(() => {
    if (!open || !node) return;
    const view = node.ownerDocument.defaultView;
    if (!view) return;
    const box = anchorBox(currentRef.current, ownerRef?.current);
    const vv = view.visualViewport;
    setSide(
      selectionSide({
        anchor: box,
        menuHeight: node.offsetHeight,
        viewportTop: vv?.offsetTop ?? 0,
        viewportBottom: vv ? vv.offsetTop + vv.height : view.innerHeight,
        gap: GAP,
        padding: EDGE,
      }),
    );
    if (pages !== null) return;
    const css = view.getComputedStyle(node);
    const inset =
      (Number.parseFloat(css.paddingInlineStart) || 0) +
      (Number.parseFloat(css.paddingInlineEnd) || 0) +
      (Number.parseFloat(css.borderInlineStartWidth) || 0) +
      (Number.parseFloat(css.borderInlineEndWidth) || 0);
    const room = view.innerWidth - EDGE * 2 - inset;
    const els = Array.from(node.querySelectorAll<HTMLElement>(":scope > [data-part='item']"));
    const sep = node.querySelector<HTMLElement>(":scope > [data-part='separator']")?.getBoundingClientRect().width ?? 0;
    const widths = els.map((el, i) => el.getBoundingClientRect().width + (i > 0 ? sep : 0));
    // The forward control is as tall as the row and square.
    const more = node.querySelector<HTMLElement>(":scope > [data-part='item']")?.getBoundingClientRect().height ?? 0;
    setPages(pageActions(widths, room, more + sep));
  }, [open, node, pages, ownerRef]);

  // The row drawn now: every action while measuring, else the actions of the page with its controls.
  const all = pages ?? [items.map((_, i) => i)];
  const shownPage = Math.min(page, all.length - 1);
  const pageItems = all[shownPage] ?? [];
  const entries: Entry[] = [
    ...(shownPage > 0 ? [{ kind: 'back' } as const] : []),
    ...pageItems.map((index) => ({ kind: 'item', index }) as const),
    ...(shownPage < all.length - 1 ? [{ kind: 'next' } as const] : []),
  ];
  const stopAt = Math.min(stop, entries.length - 1);

  const focusEntry = (i: number) => {
    const els = node?.querySelectorAll<HTMLElement>("[role='menuitem']");
    els?.[i]?.focus();
  };

  const goToPage = (next: number) => {
    const inside = !!node && node.contains(node.ownerDocument.activeElement);
    setPage(next);
    // The first action of the new page: after a back control when there is one.
    const first = next > 0 ? 1 : 0;
    setStop(first);
    if (inside) {
      // After the new row renders.
      node?.ownerDocument.defaultView?.requestAnimationFrame(() => focusEntry(first));
      queueMicrotask(() => focusEntry(first));
    }
  };

  const run = (entry: Entry) => {
    if (entry.kind === 'back') return goToPage(shownPage - 1);
    if (entry.kind === 'next') return goToPage(shownPage + 1);
    const item = items[entry.index];
    if (!item || item.disabled) return;
    item.onSelect();
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || entries.length === 0) return;
    const rtl = theme.dir === 'rtl';
    let next: number | undefined;
    if (event.key === 'ArrowRight') next = rtl ? stopAt - 1 : stopAt + 1;
    else if (event.key === 'ArrowLeft') next = rtl ? stopAt + 1 : stopAt - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = entries.length - 1;
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const entry = entries[stopAt];
      if (entry) run(entry);
      return;
    }
    if (next === undefined) return;
    event.preventDefault();
    const clamped = Math.max(0, Math.min(entries.length - 1, next));
    setStop(clamped);
    focusEntry(clamped);
  };

  const setRoot = useCallback(
    (el: HTMLDivElement | null) => {
      setNode(el);
      assignRef(ref, el);
    },
    [ref],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // The press neither takes focus nor clears the selection; the click runs the action.
    event.preventDefault();
  };

  const moreLabel = overflowLabel ?? words.more;
  const prevLabel = backLabel ?? words.back;

  return (
    <SelectionMenuLayer>
      <RadixPopover.Root open={open} onOpenChange={setOpen} modal={false}>
        <RadixPopover.Anchor virtualRef={virtual} />
        <RadixPopover.Content
          {...rest}
          ref={setRoot}
          className={className}
          style={style}
          data-ds="selection-menu"
          role="menu"
          aria-orientation="horizontal"
          aria-label={label ?? words.label}
          side={side}
          align="center"
          sideOffset={GAP}
          collisionPadding={EDGE}
          hideWhenDetached
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            const want = focusOnOpen ?? fromKeys.current;
            fromKeys.current = false;
            if (want) queueMicrotask(() => focusEntry(0));
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (!focusBack.current) return;
            focusBack.current = false;
            const back = ownerRef?.current ?? returnTo.current;
            if (back?.isConnected) back.focus();
          }}
          // Tab leaves the menu: it closes and focus goes back to the owner, before the Radix focus scope loops it.
          onKeyDownCapture={(event) => {
            if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
        >
          {entries.map((entry, i) => {
            const sepBefore = i > 0 ? <span key={`sep-${i}`} data-part="separator" aria-hidden="true" /> : null;
            const common = {
              role: 'menuitem',
              tabIndex: i === stopAt ? 0 : -1,
              onClick: () => run(entry),
              onFocus: () => setStop(i),
            } as const;
            if (entry.kind !== 'item') {
              const back = entry.kind === 'back';
              return [
                sepBefore,
                <div key={entry.kind} {...common} data-part="more" aria-label={back ? prevLabel : moreLabel}>
                  <Icon name={back ? 'chevron-back' : 'chevron-forward'} />
                </div>,
              ];
            }
            const item = items[entry.index]!;
            return [
              sepBefore,
              <div
                key={item.id}
                {...common}
                data-part="item"
                data-tone={item.tone === 'danger' ? 'danger' : undefined}
                data-disabled={item.disabled ? '' : undefined}
                aria-disabled={item.disabled ? true : undefined}
              >
                {item.icon && <Icon name={item.icon} />}
                <span>{item.label}</span>
              </div>,
            ];
          })}
        </RadixPopover.Content>
      </RadixPopover.Root>
    </SelectionMenuLayer>
  );
}

export interface EditActionsOptions {
  /** The language of the labels. Default en. */
  lang?: string;
  /** The selected text, read when copy or cut runs. Without it, the document selection. */
  getText?: () => string;
  /** Given, a Cut action is offered: it copies, then calls this to remove the text. Only for selections the app can edit. */
  onCut?: (text: string) => void;
  /** Given, a Paste action is offered: it reads the clipboard inside the click and passes the text. */
  onPaste?: (text: string) => void;
  /** Called after a copy or cut wrote the clipboard, for a "Copied" note. */
  onCopied?: (text: string) => void;
  /** Called when the clipboard refused (no permission, no focus). */
  onError?: (error: unknown) => void;
  /** The environment to test. Default the page's window. */
  env?: { isSecureContext?: boolean; navigator?: Navigator };
}

/**
 * Cut, copy and paste on the Clipboard API, each only when the page may
 * use it (feature tested, never assumed) and the app asked for it: copy
 * when text can be written, cut when also onCut is given, paste when text
 * can be read and onPaste is given. Put them first in `items`.
 */
export function editActions({ lang = 'en', getText, onCut, onPaste, onCopied, onError, env }: EditActionsOptions = {}): SelectionMenuItem[] {
  const w = wordsFor(lang);
  const scope = env ?? (typeof window === 'undefined' ? undefined : window);
  const access = clipboardAccess(scope);
  const clip = scope?.navigator?.clipboard;
  const text = () => getText?.() ?? (typeof document === 'undefined' ? '' : (document.getSelection?.()?.toString() ?? ''));
  const write = (after?: (t: string) => void) => () => {
    const t = text();
    clip?.writeText(t).then(
      () => {
        after?.(t);
        onCopied?.(t);
      },
      (error: unknown) => onError?.(error),
    );
  };
  const out: SelectionMenuItem[] = [];
  if (access.write && onCut) out.push({ id: 'cut', label: w.cut, onSelect: write(onCut) });
  if (access.write) out.push({ id: 'copy', label: w.copy, onSelect: write() });
  if (access.read && onPaste) {
    out.push({
      id: 'paste',
      label: w.paste,
      onSelect: () => {
        clip?.readText().then(onPaste, (error: unknown) => onError?.(error));
      },
    });
  }
  return out;
}
