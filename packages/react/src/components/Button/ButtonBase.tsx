'use client';
// The internals Button and IconButton share: the variant axes, the inert
// states (disabled and loading), `asChild` through Radix Slot, and the one
// bare <button> the system renders. Not exported from the package barrel:
// IconButton imports it from '../Button/ButtonBase'.
import {
  cloneElement,
  isValidElement,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Slot } from 'radix-ui';
import { Icon, type IconName } from '@the-system/icons/react';
import { buttonMorph, settled } from '@the-system/motion';
import type { Emphasis, Shape, Size, Tone } from '@the-system/shared';
import { useButtonGroup } from '../ButtonGroup/ButtonGroupContext';
import { NAVIGATION_KEYS } from '../../internal/keys';
import { useMotion } from '../../internal/motion';

/** The shared axes, all of them: Button takes every value. */
export type ButtonSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export type ButtonTone = Extract<Tone, 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'>;
export type ButtonEmphasis = Extract<Emphasis, 'solid' | 'soft' | 'outline' | 'ghost' | 'link'>;
export type ButtonShape = Extract<Shape, 'default' | 'pill' | 'square'>;
/** Leading or trailing content: a system icon name, or a node (for example `<Icon name="plus" size="sm" />`). */
export type ButtonSlotContent = IconName | ReactElement;

/** The props Button and IconButton share. No `title`: hints come from Tooltip, never the native title attribute. */
export interface ButtonBaseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  /** Height from the size.control tokens: xs 24, sm 28, md 32, lg 44 (default density). Default md. */
  size?: ButtonSize;
  /** The color family. accent is the primary action color of the active style. Default neutral. */
  tone?: ButtonTone;
  /** How loud the button is. tone accent with emphasis solid is the primary action. */
  emphasis?: ButtonEmphasis;
  /** default takes the style's control radius, pill is fully round, square has small corners. Default default. */
  shape?: ButtonShape;
  /**
   * An action is in flight: shows the spinner, adds a visually hidden status
   * (`loadingLabel`), sets `aria-busy` and `data-loading`, keeps the width
   * and focus, and blocks activation.
   */
  loading?: boolean;
  /** The words the hidden status says while loading. Default "Loading". Arabic: "جار التحميل". */
  loadingLabel?: string;
  /**
   * Blocks activation. The button stays focusable and in the tab order,
   * with `aria-disabled` and `data-disabled`, so a Tooltip can say why.
   * The native `disabled` attribute is never set.
   */
  disabled?: boolean;
  /** Renders the single child element (a link, a router link) as the button. Default false. */
  asChild?: boolean;
  /** Native button type. Default "button", so a button never submits a form by accident. Ignored with asChild. */
  type?: 'button' | 'submit' | 'reset';
  ref?: Ref<HTMLButtonElement>;
}

/** Renders leading or trailing content: a name becomes a 16px system Icon, a node is used as is. */
export function renderSlotContent(content: ButtonSlotContent): ReactNode {
  return typeof content === 'string' ? <Icon name={content} size="md" /> : content;
}

/** The spinner and the hidden status, shown while loading. The spinner is hidden from assistive tech. */
export function ButtonLoading({ label }: { label: string }) {
  return (
    <>
      <span data-part="spinner" aria-hidden="true" />
      <span data-part="status" role="status">
        {label}
      </span>
    </>
  );
}

/** The components that play the press (interaction button-press). Button.css scales them on :active. */
const PRESS_DS: ReadonlySet<ButtonDs> = new Set(['button', 'icon-button', 'toggle-button', 'close-button', 'copy-button', 'floating-action-button']);

/** Sets a ref of any kind. */
export function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref && typeof ref === 'object') (ref as { current: T | null }).current = value;
}

/**
 * The loading morph (interaction button-morph, order 1.22). When `loading`
 * turns on, the button dips, the label (or the icon) rolls up and out and
 * the spinner pops in; when it turns off, the spinner shrinks away and the
 * label rolls back in. The width holds: every part stays in place and
 * Button.css holds the rest look of each one per state. The spinner that
 * leaves stays for its exit in `leaving` (aria-hidden, at opacity 0 at
 * rest) and goes when the exit settles. Nothing waits for it: aria-busy,
 * the status and activation change at once. With no Web Animations API,
 * or a style that turns it off, nothing extra renders.
 */
function useLoadingMorph(root: { current: HTMLElement | null }, loading: boolean, interaction: string) {
  const motion = useMotion();
  const last = useRef(loading);
  const [leaving, setLeaving] = useState(0);
  const changed = last.current !== loading;
  // The spinner's exit needs its element for one more render: decide during render, before commit.
  if (changed && !loading && leaving === 0 && typeof root.current?.animate === 'function' && motion.mode(interaction) !== 'none') {
    setLeaving((n) => n + 1);
  }
  useLayoutEffect(() => {
    if (last.current === loading) return;
    last.current = loading;
    const el = root.current;
    if (!el) return;
    // When loading ends straight into a result (Button's data-result), the
    // label stays out under the result glyph: only the spinner leaves.
    const label = !loading && el.hasAttribute('data-result') ? null : (el.querySelector(':scope > [data-part="label"]') ?? el.querySelector(':scope > [data-part="icon"]'));
    const spinner = el.querySelector(':scope > [data-part="spinner"]');
    const played = buttonMorph({ root: el, label, spinner }, loading ? 'idle' : 'loading', loading ? 'loading' : 'idle', { mode: motion.mode(interaction) });
    if (loading) return;
    const exit = spinner ? played.find((a) => a.effect && (a.effect as KeyframeEffect).target === spinner) : undefined;
    let live = true;
    void settled(exit ?? null).then(() => {
      if (live) setLeaving(0);
    });
    return () => {
      live = false;
    };
  }, [loading, motion, root, interaction]);
  return leaving > 0 && !loading;
}

/** The components built on ButtonRoot. */
export type ButtonDs = 'button' | 'icon-button' | 'toggle-button' | 'close-button' | 'copy-button' | 'floating-action-button' | 'chip';

interface ButtonRootProps extends ButtonBaseProps {
  /** The root `data-ds` value. */
  ds: ButtonDs;
  /** An icon only control (IconButton, CloseButton, a FAB without a label): it never takes link from a group. */
  iconOnly?: boolean;
  /** Default emphasis of this component. */
  defaultEmphasis: ButtonEmphasis;
  /** Builds the parts around the content: the children, or the asChild element's children. */
  render: (content: ReactNode) => ReactNode;
}

/**
 * The root of Button and IconButton. Stamps the anatomy and variant
 * attributes, swallows activation while disabled or loading, and renders
 * either the bare <button> or, with asChild, the child element through Slot.
 */
export function ButtonRoot({
  ds,
  iconOnly = ds === 'icon-button',
  defaultEmphasis,
  render,
  size,
  tone = 'neutral',
  emphasis,
  shape,
  loading = false,
  loadingLabel: _loadingLabel,
  disabled = false,
  asChild = false,
  type = 'button',
  children,
  onClick,
  onAuxClick,
  onPointerDown,
  onPointerMove,
  onKeyDown,
  onKeyUp,
  onBlur,
  ref,
  ...rest
}: ButtonRootProps) {
  const inert = disabled || loading;
  const motion = useMotion();
  const own = useRef<HTMLElement | null>(null);
  const spinnerLeaving = useLoadingMorph(own, loading, 'button-morph');
  const setOwn = useCallback(
    (node: HTMLButtonElement | null) => {
      own.current = node;
      setRef(ref, node);
    },
    [ref],
  );
  // The press for Enter (interaction button-press). Space and the pointer
  // press through :active in Button.css; Enter activates on key down and the
  // browser draws no :active for it, so the press pattern plays here. It
  // decorates only: the click has already happened.
  // The spinner that leaves after loading ends, for its exit only. Decorative.
  const withLeaving = (parts: ReactNode) =>
    spinnerLeaving ? (
      <>
        {parts}
        <span data-part="spinner" aria-hidden="true" />
      </>
    ) : (
      parts
    );
  const pressable = PRESS_DS.has(ds) && !inert && rest['aria-disabled'] !== true && rest['aria-disabled'] !== 'true';
  const pressed = useRef(false);
  const release = (el: Element) => {
    if (!pressed.current) return;
    pressed.current = false;
    motion.play(el, 'press', 'button-press', { phase: 'exit' });
  };
  // A ButtonGroup passes size, emphasis and shape through context, so they
  // reach a child through any wrapper. The child's own prop always wins. An
  // icon only control never takes link from a group.
  const group = useButtonGroup();
  const s = size ?? group?.size ?? 'md';
  const sh = shape ?? group?.shape ?? 'default';
  const groupEmphasis = group?.emphasis && !(iconOnly && (group.emphasis as string) === 'link') ? group.emphasis : undefined;
  const em = emphasis ?? groupEmphasis ?? defaultEmphasis;
  // The glow that follows the pointer (interaction button-glow, order 1.23;
  // drawn on solid fills, and on others where a style turns it on): the
  // pointer's place as a share of the box, so
  // it holds at any zoom. A custom property on the element, not React state:
  // no render per move. A touch sets it on pointer down, so the press lights
  // up under the finger. Button.css decides whether the glow shows.
  const placeGlow = (event: PointerEvent<HTMLButtonElement>) => {
    if (em === 'link') return;
    const el = event.currentTarget;
    const box = el.getBoundingClientRect();
    if (!(box.width > 0 && box.height > 0)) return;
    const share = (n: number) => `${Math.round(Math.min(1, Math.max(0, n)) * 1000) / 10}%`;
    el.style.setProperty('--_button-glow-x', share((event.clientX - box.left) / box.width));
    el.style.setProperty('--_button-glow-y', share((event.clientY - box.top) / box.height));
  };
  // The ripple origin (a platform hook, order 1.23): where a press starts, in
  // px from the root's inline start and block start, for a style or a
  // platform that draws a press from the touch point (Android). Every
  // emphasis. Button.css declares both at 50% and draws nothing with them.
  // Distances are in the root's own CSS px, so they hold under CSS zoom.
  const placeRipple = (event: PointerEvent<HTMLButtonElement>) => {
    const el = event.currentTarget;
    const box = el.getBoundingClientRect();
    if (!(box.width > 0 && box.height > 0)) return;
    const fromLeft = (event.clientX - box.left) / box.width;
    const rtl = getComputedStyle(el).direction === 'rtl';
    const x = (rtl ? 1 - fromLeft : fromLeft) * el.offsetWidth;
    const y = ((event.clientY - box.top) / box.height) * el.offsetHeight;
    el.style.setProperty('--_button-ripple-x', `${Math.round(Math.min(el.offsetWidth, Math.max(0, x)))}px`);
    el.style.setProperty('--_button-ripple-y', `${Math.round(Math.min(el.offsetHeight, Math.max(0, y)))}px`);
  };
  const attrs = {
    ...rest,
    ref: setOwn,
    'data-ds': ds,
    'data-size': s,
    'data-tone': tone,
    'data-emphasis': em,
    'data-shape': sh,
    'data-loading': loading ? '' : undefined,
    'data-disabled': disabled ? '' : undefined,
    'aria-disabled': inert ? true : rest['aria-disabled'],
    'aria-busy': loading ? true : rest['aria-busy'],
    // While inert, the handlers of the caller (and of a Radix trigger that
    // wraps this button with asChild) do not run, and a click, middle click
    // included, does not submit a form or follow a link.
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      if (inert) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    },
    onAuxClick: (event: MouseEvent<HTMLButtonElement>) => {
      if (inert) {
        event.preventDefault();
        return;
      }
      onAuxClick?.(event);
    },
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (!inert) {
        placeGlow(event);
        placeRipple(event);
        onPointerDown?.(event);
      }
    },
    onPointerMove: (event: PointerEvent<HTMLButtonElement>) => {
      if (!inert) placeGlow(event);
      onPointerMove?.(event);
    },
    // While inert, navigation keys (arrows, Home, End, Page keys, Tab) still
    // reach the handler, so a roving group can move past a disabled item.
    // Every other key, activation and Delete included, is swallowed.
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (pressable && event.key === 'Enter' && !event.repeat) {
        pressed.current = motion.play(event.currentTarget, 'press', 'button-press', { phase: 'enter' }) !== null;
      }
      if (!inert || NAVIGATION_KEYS.has(event.key)) onKeyDown?.(event);
    },
    onKeyUp: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter') release(event.currentTarget);
      onKeyUp?.(event);
    },
    onBlur: (event: FocusEvent<HTMLButtonElement>) => {
      release(event.currentTarget);
      onBlur?.(event);
    },
  };

  if (asChild) {
    if (!isValidElement<{ href?: string; role?: string }>(children)) {
      throw new Error(`${ds} with asChild needs one element as its child.`);
    }
    // An inert link loses its href, so no click, middle click, context menu
    // or drag can open it. role="link" keeps it announced as a link.
    const child =
      inert && children.props.href !== undefined
        ? cloneElement(children, {
            href: undefined,
            role: children.props.role ?? 'link',
          })
        : children;
    return (
      <Slot.Root {...attrs}>
        <Slot.Slottable child={child}>{(content: ReactNode) => withLeaving(render(content))}</Slot.Slottable>
      </Slot.Root>
    );
  }

  return (
    <button type={type} {...attrs}>
      {withLeaving(render(children))}
    </button>
  );
}
