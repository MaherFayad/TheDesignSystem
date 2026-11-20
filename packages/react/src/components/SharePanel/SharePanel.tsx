'use client';
// SharePanel: the app's own share panel (order M9.12, proposed). The system
// share sheet comes first: a press on the trigger calls share() from
// @the-system/shared, which opens the system sheet where it exists
// (navigator.share on the web) and resolves 'fallback' where it does not;
// only then does this panel open. A page cannot list the device's apps or
// contacts, so the panel shows only what the app passes in: its own people,
// its own targets and its own actions, plus two built in actions, Copy link
// (feature tested, with a "Link copied" toast) and More options (the system
// sheet, shown only where it exists).
//
// The container follows the platform (frameworks.md "System services"):
// on ios and android a Sheet (modal, from the bottom edge, its own handle,
// title, close control and focus rule); on web and macos a Popover from the
// trigger (not modal, with its arrow). Without a trigger child it is always
// a Sheet: a popover needs something to point at. The container owns the
// title (the item title, which names the dialog) and the close control;
// this component owns what is inside:
//
//   <div data-ds="sheet"> or <div data-ds="popover" role="dialog">   the container, named by the item title
//     ... the container's header: the title and the close control
//     <div data-part="body">                            the container's body: its padding and its scroll
//     <div data-ds="share-panel" data-state>
//       <div data-part="preview">                       optional: the image, the link and the text
//         <img alt="">                                  decorative: the title names the item
//         <p data-part="link"><bdi dir="ltr">           the host and path, always left to right, aligned to the line start
//         <p data-part="text">
//       <div data-part="people" role="group" aria-label="People">
//         <button data-ds="button" data-part="person">   Avatar (decorative) and the name
//       <div data-part="targets" role="group" aria-label="Share to">
//         <button data-ds="button" data-part="target">   the icon (decorative) and the label
//       <div data-part="actions" role="group" aria-label="Actions">
//         <button data-ds="button" data-part="action">   Copy link, the app's actions, More options
//
// Each row is one Tab stop (roving tabindex): Left and Right move along it,
// mirrored in right to left, Home and End go to its ends. The first item of
// the first row carries data-autofocus, so the container's focus rule opens
// on it. A press on a person or a target calls onShare(id, kind) and closes
// the panel; an action runs its onSelect and closes it.
//
// No motion of its own: the container's pattern (sheet, menu-scale) moves it.
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import type { IconName } from '@the-system/icons';
import { canSystemShare, share, shareLinkLabel, toast, type ShareData, type ShareResult, type ShareSystem } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { useControllable } from '../../internal/useControllable';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { Popover, PopoverAnchor, PopoverBody, PopoverContent } from '../Popover';
import { Sheet, SheetBody, SheetContent } from '../Sheet';
import { copyToClipboard } from '../CopyButton/copy';

/** The built in words. Arabic: noun forms, no diacritics. */
export const sharePanelLabels = {
  en: {
    people: 'People',
    targets: 'Share to',
    actions: 'Actions',
    copyLink: 'Copy link',
    copied: 'Link copied',
    copyFailed: 'Could not copy link',
    moreOptions: 'More options',
    close: 'Close share panel',
  },
  ar: {
    people: 'الأشخاص',
    targets: 'المشاركة عبر',
    actions: 'الإجراءات',
    copyLink: 'نسخ الرابط',
    copied: 'تم نسخ الرابط',
    copyFailed: 'تعذر نسخ الرابط',
    moreOptions: 'خيارات إضافية',
    close: 'إغلاق لوحة المشاركة',
  },
} as const;

/** What is shared. */
export interface ShareItem {
  /** The title. It names the panel and is the title of the system share. Required. */
  title: string;
  /** The link. Shown under the title, copied by Copy link, and passed to the system share. */
  url?: string;
  /** A picture of the item for the preview, decorative (the title says what it is). */
  image?: string;
  /** A short text passed to the system share, shown in the preview. */
  text?: string;
}

/** One of the app's own people. */
export interface SharePerson {
  id: string;
  /** The name, drawn under the avatar and the accessible name of the button. */
  name: string;
  /** The picture URL. Without it the avatar shows the initials. */
  avatar?: string;
}

/** One of the app's own places to send to: a chat, a board, a list. Never a third party app. */
export interface ShareTarget {
  id: string;
  label: string;
  /** A system icon name or a node, decorative next to the label. */
  icon: IconName | ReactElement;
}

/** An action on the item: Add to list, Save image. */
export interface ShareAction {
  id: string;
  /** A verb plus a noun in English, a noun form in Arabic. */
  label: string;
  icon: IconName | ReactElement;
  onSelect: () => void;
  /** aria-disabled: it stays in the row and a press does nothing. */
  disabled?: boolean;
}

export type ShareKind = 'person' | 'target';

export interface SharePanelProps {
  /** What is shared. */
  item: ShareItem;
  /** The app's own people, in the first row. */
  people?: readonly SharePerson[];
  /** The app's own targets, in the second row. */
  targets?: readonly ShareTarget[];
  /** Actions on the item, in the last row, between Copy link and More options. */
  actions?: readonly ShareAction[];
  /** Called with the id and kind of the person or target pressed. The panel then closes. */
  onShare?: (id: string, kind: ShareKind) => void;
  /**
   * The trigger press: prefer calls the system share sheet first and opens
   * the panel only on 'fallback'; never always opens the panel (an app whose
   * targets are its own). Default prefer.
   */
  system?: ShareSystem;
  /** Called with the result of the trigger press: 'system', 'cancelled' or 'fallback'. */
  onResult?: (result: ShareResult) => void;
  /** Shows the built in Copy link action when the item has a url and copying can work here. Default true. */
  copyLink?: boolean;
  /** Shows the built in More options action, which opens the system sheet, where one exists. Default true. */
  moreOptions?: boolean;
  /** Controlled open state of the panel, with onOpenChange. */
  open?: boolean;
  /** Default false. */
  defaultOpen?: boolean;
  /** Called with true when the panel opens and false when it closes. */
  onOpenChange?: (open: boolean) => void;
  /** Accessible name of the container's close control. Default "Close share panel" (Arabic under lang ar). */
  closeLabel?: string;
  /** Built in words in this language: en or ar. Default the theme's language. */
  lang?: string;
  /** One element, a system Button: the share button. A press shares; the web popover points at it. */
  children?: ReactElement;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/** True where the page can put text on the clipboard: the Clipboard API, or the copy command. */
function clipboardWorks(): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') return true;
  if (typeof document === 'undefined') return false;
  try {
    return typeof document.queryCommandSupported === 'function' && document.queryCommandSupported('copy');
  } catch {
    return false;
  }
}

/** The data the system share takes. */
export function shareDataOf(item: ShareItem): ShareData {
  const data: ShareData = { title: item.title };
  if (item.text) data.text = item.text;
  if (item.url) data.url = item.url;
  return data;
}

// ------------------------------------------------------------------ rows

/**
 * Scrolls a row back so its first item sits at the row's inline start
 * (order C6, item 4). It moves the row by the distance between the first
 * item's start edge and the row's content edge, so it holds in every
 * scrollLeft convention of right to left (negative, as the standard says,
 * or positive from the left, as older WebKit has it). It acts only when the
 * first item is cut off past the start edge, so a row at its start never
 * moves. Exported for the tests.
 */
export function scrollRowToStart(row: HTMLElement, rtl: boolean): void {
  const first = row.querySelector<HTMLElement>(':scope > [data-part]');
  if (!first) return;
  const box = row.getBoundingClientRect();
  const item = first.getBoundingClientRect();
  const style = row.ownerDocument.defaultView?.getComputedStyle(row);
  const px = (value: string | undefined) => Number.parseFloat(value ?? '') || 0;
  const delta = rtl
    ? item.right - (box.right - px(style?.borderRightWidth) - px(style?.paddingRight))
    : item.left - (box.left + px(style?.borderLeftWidth) + px(style?.paddingLeft));
  // rtl: the first item sits past the right edge; ltr: past the left edge.
  if (rtl ? delta > 0.5 : delta < -0.5) row.scrollLeft += delta;
}

interface RowProps {
  part: 'people' | 'targets' | 'actions';
  label: string;
  count: number;
  /** The first row takes focus when the panel opens. */
  first: boolean;
  rtl: boolean;
  children: (index: number, tabIndex: number, autoFocus: boolean) => ReactNode;
}

/**
 * One row: a named group with one Tab stop. Left and Right (mirrored in
 * right to left), Home and End move focus along it; the row scrolls inline
 * to the focused item (the browser does that on focus).
 *
 * The row opens at its start (order C6, item 4): in Arabic a row whose
 * tiles do not fit opened scrolled toward its end, the first person out of
 * view. It is set back to its start when it mounts, a frame later (after
 * the container moved and the browser snapped it), and whenever its first
 * item takes focus (the container's focus rule on open, or Home).
 */
function Row({ part, label, count, first, rtl, children }: RowProps) {
  const [active, setActive] = useState(0);
  const current = Math.min(active, Math.max(0, count - 1));
  const own = useRef<HTMLDivElement | null>(null);
  const items = () => Array.from(own.current?.querySelectorAll<HTMLElement>(`:scope > [data-part]`) ?? []);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const at = list.indexOf(event.target as HTMLElement);
    if (at < 0) return;
    let next = -1;
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === forward) next = Math.min(list.length - 1, at + 1);
    else if (event.key === back) next = Math.max(0, at - 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = list.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    list[next]?.focus();
  };
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const at = items().indexOf(event.target as HTMLElement);
    if (at >= 0 && at !== current) setActive(at);
    if (at === 0 && own.current) scrollRowToStart(own.current, rtl);
  };
  const shown = count > 0;
  useLayoutEffect(() => {
    const row = own.current;
    if (!shown || !row) return undefined;
    scrollRowToStart(row, rtl);
    const view = row.ownerDocument.defaultView;
    if (!view || typeof view.requestAnimationFrame !== 'function') return undefined;
    const frame = view.requestAnimationFrame(() => scrollRowToStart(row, rtl));
    return () => view.cancelAnimationFrame(frame);
  }, [shown, rtl]);
  if (count === 0) return null;
  const out: ReactNode[] = [];
  for (let i = 0; i < count; i += 1) out.push(children(i, i === current ? 0 : -1, first && i === 0));
  return (
    <div ref={own} data-part={part} role="group" aria-label={label} onKeyDown={onKeyDown} onFocus={onFocus}>
      {out}
    </div>
  );
}

// ------------------------------------------------------------------ the panel

interface PanelProps {
  item: ShareItem;
  people: readonly SharePerson[];
  targets: readonly ShareTarget[];
  actions: readonly ShareAction[];
  open: boolean;
  close: () => void;
  onShare?: (id: string, kind: ShareKind) => void;
  showCopy: boolean;
  showMore: boolean;
  words: (typeof sharePanelLabels)['en'] | (typeof sharePanelLabels)['ar'];
  rtl: boolean;
  className?: string;
  panelRef?: Ref<HTMLDivElement>;
}

function Panel({ item, people, targets, actions, open, close, onShare, showCopy, showMore, words, rtl, className, panelRef }: PanelProps) {
  const all: ShareAction[] = [];
  if (showCopy && item.url) {
    const url = item.url;
    all.push({
      id: 'copy-link',
      label: words.copyLink,
      icon: 'link',
      onSelect: () => {
        void copyToClipboard(url).then((ok) => {
          if (ok) toast.success(words.copied);
          else toast.warning(words.copyFailed);
        });
      },
    });
  }
  all.push(...actions);
  if (showMore) {
    all.push({
      id: 'more-options',
      label: words.moreOptions,
      icon: 'more',
      onSelect: () => {
        void share(shareDataOf(item));
      },
    });
  }
  const rows = [people.length > 0, targets.length > 0, all.length > 0];
  const firstRow = rows.indexOf(true);
  const link = item.url ? shareLinkLabel(item.url) : undefined;
  const hasPreview = Boolean(item.image || item.text || link);
  return (
    <div ref={panelRef} className={className} data-ds="share-panel" data-state={open ? 'open' : 'closed'}>
      {hasPreview && (
        <div data-part="preview">
          {item.image && <img src={item.image} alt="" />}
          {link && (
            <p data-part="link">
              <bdi dir="ltr">{link}</bdi>
            </p>
          )}
          {item.text && <p data-part="text">{item.text}</p>}
        </div>
      )}
      <Row part="people" label={words.people} count={people.length} first={firstRow === 0} rtl={rtl}>
        {(i, tabIndex, autoFocus) => {
          const p = people[i]!;
          return (
            <Button
              key={p.id}
              data-part="person"
              emphasis="ghost"
              wrap
              tabIndex={tabIndex}
              data-autofocus={autoFocus ? '' : undefined}
              start={<Avatar name={p.name} src={p.avatar} size="lg" decorative />}
              onClick={() => {
                onShare?.(p.id, 'person');
                close();
              }}
            >
              {p.name}
            </Button>
          );
        }}
      </Row>
      <Row part="targets" label={words.targets} count={targets.length} first={firstRow === 1} rtl={rtl}>
        {(i, tabIndex, autoFocus) => {
          const t = targets[i]!;
          return (
            <Button
              key={t.id}
              data-part="target"
              emphasis="ghost"
              wrap
              tabIndex={tabIndex}
              data-autofocus={autoFocus ? '' : undefined}
              start={t.icon}
              onClick={() => {
                onShare?.(t.id, 'target');
                close();
              }}
            >
              {t.label}
            </Button>
          );
        }}
      </Row>
      <Row part="actions" label={words.actions} count={all.length} first={firstRow === 2} rtl={rtl}>
        {(i, tabIndex, autoFocus) => {
          const a = all[i]!;
          return (
            <Button
              key={a.id}
              data-part="action"
              emphasis="ghost"
              wrap
              tabIndex={tabIndex}
              data-autofocus={autoFocus ? '' : undefined}
              start={a.icon}
              disabled={a.disabled}
              onClick={() => {
                if (a.disabled) return;
                a.onSelect();
                close();
              }}
            >
              {a.label}
            </Button>
          );
        }}
      </Row>
    </div>
  );
}

// ------------------------------------------------------------------ SharePanel

/** Sets a ref of any kind. */
function assign<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/**
 * The share button and the app's share panel. A press on the child shares
 * through the system sheet first (system prefer) and opens the panel only
 * when that is not possible. The panel is a Sheet on ios and android and a
 * Popover from the button on web and macos.
 */
export function SharePanel({
  item,
  people = [],
  targets = [],
  actions = [],
  onShare,
  system = 'prefer',
  onResult,
  copyLink = true,
  moreOptions = true,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  closeLabel,
  lang,
  children,
  className,
  ref,
}: SharePanelProps) {
  const theme = useTheme();
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const words = (lang ?? theme.lang).startsWith('ar') ? sharePanelLabels.ar : sharePanelLabels.en;
  const rtl = theme.dir === 'rtl';
  // Feature tests after mount only: the server and the first render match.
  const [canCopy, setCanCopy] = useState(false);
  const [canSystem, setCanSystem] = useState(false);
  const data = shareDataOf(item);
  const dataKey = `${data.title}\u0000${data.text ?? ''}\u0000${data.url ?? ''}`;
  useEffect(() => {
    setCanCopy(clipboardWorks());
    setCanSystem(canSystemShare(data));
  }, [dataKey]);

  const trigger = isValidElement(children) ? (children as ReactElement<Record<string, unknown>>) : null;
  const triggerEl = useRef<HTMLElement | null>(null);
  const busy = useRef(false);
  const childRef = trigger ? (trigger.props.ref as Ref<HTMLElement> | undefined) : undefined;
  const setTriggerRef = useCallback(
    (node: HTMLElement | null) => {
      triggerEl.current = node;
      assign(childRef, node);
    },
    [childRef],
  );

  const onTriggerClick = async (event: MouseEvent<HTMLElement>) => {
    const own = trigger?.props.onClick as ((e: MouseEvent<HTMLElement>) => void) | undefined;
    own?.(event);
    if (event.defaultPrevented || busy.current) return;
    if (open) {
      setOpen(false);
      return;
    }
    // No system sheet to try: open at once, in the same press.
    if (system === 'never' || !canSystemShare(data)) {
      onResult?.('fallback');
      setOpen(true);
      return;
    }
    busy.current = true;
    try {
      const result = await share(data, { system });
      onResult?.(result);
      if (result === 'fallback') setOpen(true);
    } finally {
      busy.current = false;
    }
  };

  const form: 'sheet' | 'popover' = trigger && (theme.platform === 'web' || theme.platform === 'macos') ? 'popover' : 'sheet';
  const button = trigger
    ? cloneElement(trigger, {
        ref: setTriggerRef,
        onClick: onTriggerClick,
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
      })
    : null;

  const panel = (
    <Panel
      item={item}
      people={people}
      targets={targets}
      actions={actions}
      open={open}
      close={() => setOpen(false)}
      onShare={onShare}
      showCopy={copyLink && canCopy}
      showMore={moreOptions && canSystem}
      words={words}
      rtl={rtl}
      className={className}
      panelRef={ref}
    />
  );
  if (form === 'popover') {
    return (
      <Popover open={open} onOpenChange={setOpen} size="md">
        <PopoverAnchor asChild>{button}</PopoverAnchor>
        <PopoverContent
          title={item.title}
          closeLabel={closeLabel ?? words.close}
          side="bottom"
          onInteractOutside={(event) => {
            // A press on the share button toggles the panel itself.
            if (triggerEl.current && event.target instanceof Node && triggerEl.current.contains(event.target)) event.preventDefault();
          }}
        >
          <PopoverBody>{panel}</PopoverBody>
        </PopoverContent>
      </Popover>
    );
  }
  return (
    <Sheet open={open} onOpenChange={setOpen} size="md">
      {button}
      <SheetContent title={item.title} closeLabel={closeLabel ?? words.close}>
        <SheetBody>{panel}</SheetBody>
      </SheetContent>
    </Sheet>
  );
}
