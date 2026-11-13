// The internals Button and IconButton share: the variant axes, the inert
// states (disabled and loading) and the link form. The twin of
// packages/react/src/components/Button/ButtonBase.tsx.
//
// The host element is the root: `button[dsButton]` or `a[dsButton]`, so no
// wrapper sits between the root and its parts and Button.css applies as is.
import {
  DestroyRef,
  Directive,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  linkedSignal,
  untracked,
  type Signal,
  type TemplateRef,
} from '@angular/core';
import type { IconName } from '@the-system/icons';
import { buttonMorph, settled } from '@the-system/motion';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { DS_BUTTON_GROUP } from '../button-group/button-group-context';
import type { Emphasis, Shape, Size, Tone } from '@the-system/shared';

export type ButtonSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export type ButtonTone = Extract<Tone, 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'>;
export type ButtonEmphasis = Extract<Emphasis, 'solid' | 'soft' | 'outline' | 'ghost' | 'link'>;
export type ButtonShape = Extract<Shape, 'default' | 'pill' | 'square'>;
/** Leading or trailing content: a system icon name, or a template (for example an svg dsIcon of another size). */
export type ButtonSlotContent = IconName | TemplateRef<unknown>;

/** Narrows slot content for the template: a name renders as a 16px icon. */
export function isIconName(content: ButtonSlotContent | undefined): content is IconName {
  return typeof content === 'string';
}

const BLOCKED = ['click', 'auxclick'] as const;

/** The components that play the press (interaction button-press). Button.css scales them on :active. */
const PRESS_DS: ReadonlySet<string> = new Set(['button', 'icon-button', 'toggle-button', 'close-button', 'copy-button', 'floating-action-button']);

/** Input attributes the base consumes (see internal/host.ts). href, type and role are stamped back by host bindings. */
const BASE_INPUTS = ['dsButton', 'dsIconButton', 'size', 'tone', 'shape', 'loading', 'loadingLabel', 'disabled', 'emphasis'];

/**
 * Inputs and host bindings shared by DsButton and DsIconButton. Disabled and
 * loading block activation: a capture listener on the host stops click and
 * auxclick before any other listener on the element (a (click) binding, a
 * dialog close directive) runs, and prevents the default (no form submit,
 * no link). The button stays focusable with aria-disabled. An inert link
 * loses its href and is announced with role link.
 */
@Directive({
  host: {
    '[attr.type]': 'isButton ? type() : null',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-emphasis]': 'resolvedEmphasis()',
    '[attr.data-shape]': 'resolvedShape()',
    '[attr.data-loading]': 'loading() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.aria-disabled]': 'inert() ? "true" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.href]': 'isButton ? null : inert() ? null : href()',
    '[attr.role]': 'linkRole()',
  },
})
export abstract class DsButtonBase {
  /** Height from the size.control tokens: xs 24, sm 28, md 32, lg 44. Default md, or the size of the ButtonGroup. */
  readonly size = input<ButtonSize | undefined>(undefined);
  /** The color family. accent is the primary action color of the active style. Default neutral. */
  readonly tone = input<ButtonTone>('neutral');
  /** default takes the style's control radius, pill is fully round, square has small corners. Default default, or the shape of the ButtonGroup. */
  readonly shape = input<ButtonShape | undefined>(undefined);
  /** An action is in flight: spinner, hidden status, aria-busy, data-loading, blocks activation. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** The words the hidden status says while loading. Default "Loading". */
  readonly loadingLabel = input<string>('Loading');
  /** Blocks activation. Stays focusable with aria-disabled. The native disabled attribute is never set. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Native button type. Default "button". Ignored on a link. */
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  /** The link target, on `a[dsButton]`. Removed while inert. */
  readonly href = input<string | undefined>(undefined);
  /** A role of the caller's own, kept on an inert link. */
  readonly role = input<string | undefined>(undefined);

  /** How loud the control is. Each component declares it with its own type; undefined takes the group, then the default. */
  abstract readonly emphasis: Signal<ButtonEmphasis | undefined>;
  /** The emphasis when neither the control nor a ButtonGroup sets one. */
  protected abstract readonly defaultEmphasis: ButtonEmphasis;
  /** An icon only control never takes link from a group. */
  protected isIconOnly(): boolean {
    return false;
  }

  // A ButtonGroup passes size, emphasis and shape through DI. The control's
  // own input always wins, as useButtonGroup() in React.
  private readonly group = inject(DS_BUTTON_GROUP, { optional: true });
  readonly resolvedSize = computed<ButtonSize>(() => this.size() ?? this.group?.size() ?? 'md');
  readonly resolvedShape = computed<ButtonShape>(() => this.shape() ?? this.group?.shape() ?? 'default');
  readonly resolvedEmphasis = computed<ButtonEmphasis>(() => {
    const fromGroup = this.group?.emphasis();
    const groupEmphasis = fromGroup && !(this.isIconOnly() && (fromGroup as string) === 'link') ? fromGroup : undefined;
    return this.emphasis() ?? groupEmphasis ?? this.defaultEmphasis;
  });

  protected readonly host = consumeHostAttributes(BASE_INPUTS);
  protected readonly isButton = this.host.tagName === 'BUTTON';
  readonly inert = computed(() => this.disabled() || this.loading());
  protected readonly linkRole = computed(() => {
    if (this.isButton) return this.role() ?? null;
    if (this.inert() && this.href() !== undefined) return this.role() ?? 'link';
    return this.role() ?? null;
  });

  protected readonly motion = injectMotion();

  /**
   * The spinner that leaves after loading ends, kept for its exit only
   * (interaction button-loading, primitive buttonMorph). Set in the same
   * change as loading, so the template renders it in place of the spinner;
   * it goes when the exit settles. With no Web Animations API, or a style
   * that turns the morph off, nothing extra renders. As useLoadingMorph in
   * React's ButtonBase.tsx.
   */
  private readonly spinnerExit = linkedSignal<boolean, boolean>({
    source: () => this.loading(),
    computation: (loading, previous) =>
      untracked(
        () =>
          previous !== undefined &&
          previous.source &&
          !loading &&
          typeof this.host.animate === 'function' &&
          this.motion.mode('button-morph') !== 'none',
      ),
  });
  /**
   * Renders the leaving spinner: an aria-hidden span[data-part="spinner"]
   * after the parts, at opacity 0 at rest (Button.css). Templates read it in
   * its own @if on every check, so the linked signal sees each loading change.
   */
  readonly spinnerLeaving = computed(() => this.spinnerExit() && !this.loading());

  constructor() {
    const block = (event: Event) => {
      if (!this.inert()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    for (const type of BLOCKED) this.host.addEventListener(type, block, { capture: true });
    this.pressOnEnter();
    this.morphOnLoading();
    this.trackPointer();
  }

  /**
   * The glow that follows the pointer (interaction button-glow) and the
   * ripple origin (a platform hook), as placeGlow and placeRipple in React's
   * ButtonRoot. Both are custom properties on the host, written in the
   * event: no change detection per move. Button.css decides whether the
   * glow shows; the ripple origin is drawn only by a style or a platform
   * that asks for it.
   */
  private trackPointer(): void {
    const el = this.host;
    // The pointer's place as a share of the box, so it holds at any zoom. A
    // touch sets it on pointer down, so the press lights up under the finger.
    const placeGlow = (event: PointerEvent) => {
      if (this.resolvedEmphasis() === 'link') return;
      const box = el.getBoundingClientRect();
      if (!(box.width > 0 && box.height > 0)) return;
      const share = (n: number) => `${Math.round(Math.min(1, Math.max(0, n)) * 1000) / 10}%`;
      el.style.setProperty('--_button-glow-x', share((event.clientX - box.left) / box.width));
      el.style.setProperty('--_button-glow-y', share((event.clientY - box.top) / box.height));
    };
    // Where a press starts, in px from the root's inline start and block
    // start, in the root's own CSS px, so they hold under CSS zoom. Every
    // emphasis.
    const placeRipple = (event: PointerEvent) => {
      const box = el.getBoundingClientRect();
      if (!(box.width > 0 && box.height > 0)) return;
      const fromLeft = (event.clientX - box.left) / box.width;
      const rtl = getComputedStyle(el).direction === 'rtl';
      const x = (rtl ? 1 - fromLeft : fromLeft) * el.offsetWidth;
      const y = ((event.clientY - box.top) / box.height) * el.offsetHeight;
      el.style.setProperty('--_button-ripple-x', `${Math.round(Math.min(el.offsetWidth, Math.max(0, x)))}px`);
      el.style.setProperty('--_button-ripple-y', `${Math.round(Math.min(el.offsetHeight, Math.max(0, y)))}px`);
    };
    el.addEventListener('pointerdown', (event) => {
      if (this.inert()) return;
      placeGlow(event);
      placeRipple(event);
    });
    el.addEventListener('pointermove', (event) => {
      if (!this.inert()) placeGlow(event);
    });
  }

  /**
   * The press for Enter (interaction button-press). Space and the pointer
   * press through :active in Button.css; Enter activates on key down and the
   * browser draws no :active for it, so the press pattern plays here. It
   * decorates only: the click has already happened.
   */
  private pressOnEnter(): void {
    let pressed = false;
    const release = () => {
      if (!pressed) return;
      pressed = false;
      this.motion.play(this.host, 'press', 'button-press', { phase: 'exit' });
    };
    const keydown = (event: KeyboardEvent) => {
      const pressable = PRESS_DS.has(this.host.getAttribute('data-ds') ?? '') && !this.inert() && this.host.getAttribute('aria-disabled') !== 'true';
      if (pressable && event.key === 'Enter' && !event.repeat) {
        pressed = this.motion.play(this.host, 'press', 'button-press', { phase: 'enter' }) !== null;
      }
    };
    const keyup = (event: KeyboardEvent) => {
      if (event.key === 'Enter') release();
    };
    this.host.addEventListener('keydown', keydown);
    this.host.addEventListener('keyup', keyup);
    this.host.addEventListener('blur', release);
  }

  /**
   * The loading morph. When loading turns on, the button dips, the label
   * (or the icon) rolls up and out and the spinner pops in; when it turns
   * off, the leaving spinner shrinks away and the label rolls back in.
   * Plays after the render that changed the parts, so the spinner of each
   * state is in the DOM. aria-busy, the status and activation never wait.
   */
  private morphOnLoading(): void {
    // The first run only records the state: a button that starts loading
    // does not morph, as React's useRef(loading). Inputs are not set yet in
    // the constructor, so the first value is read here.
    let last: boolean | undefined;
    let run = 0;
    inject(DestroyRef).onDestroy(() => (run += 1));
    afterRenderEffect({
      write: () => {
        const loading = this.loading();
        const first = last === undefined;
        if (loading === last) return;
        last = loading;
        if (first) return;
        const el = this.host;
        // When loading ends straight into a result (Button's data-result),
        // the label stays out under the result glyph: only the spinner leaves.
        const label =
          !loading && el.hasAttribute('data-result')
            ? null
            : (el.querySelector(':scope > [data-part="label"]') ?? el.querySelector(':scope > [data-part="icon"]'));
        const spinner = el.querySelector(':scope > [data-part="spinner"]');
        const mode = untracked(() => this.motion.mode('button-morph'));
        const played = buttonMorph({ root: el, label, spinner }, loading ? 'idle' : 'loading', loading ? 'loading' : 'idle', { mode });
        const id = ++run;
        if (loading) return;
        const exit = spinner ? played.find((a) => a.effect && (a.effect as KeyframeEffect).target === spinner) : undefined;
        void settled(exit ?? null).then(() => {
          if (id === run) this.spinnerExit.set(false);
        });
      },
    });
  }
}
