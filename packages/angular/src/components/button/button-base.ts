// The internals Button and IconButton share: the variant axes, the inert
// states (disabled and loading) and the link form. The twin of
// packages/react/src/components/Button/ButtonBase.tsx.
//
// The host element is the root: `button[dsButton]` or `a[dsButton]`, so no
// wrapper sits between the root and its parts and Button.css applies as is.
import { Directive, booleanAttribute, computed, input, type TemplateRef } from '@angular/core';
import type { IconName } from '@the-system/icons';
import { consumeHostAttributes } from '../../internal/host';
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
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-loading]': 'loading() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.aria-disabled]': 'inert() ? "true" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.href]': 'isButton ? null : inert() ? null : href()',
    '[attr.role]': 'linkRole()',
  },
})
export abstract class DsButtonBase {
  /** Height from the size.control tokens: xs 24, sm 28, md 32, lg 44. Default md. */
  readonly size = input<ButtonSize>('md');
  /** The color family. accent is the primary action color of the active style. Default neutral. */
  readonly tone = input<ButtonTone>('neutral');
  /** default takes the style's control radius, pill is fully round, square has small corners. */
  readonly shape = input<ButtonShape>('default');
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

  protected readonly host = consumeHostAttributes(BASE_INPUTS);
  protected readonly isButton = this.host.tagName === 'BUTTON';
  readonly inert = computed(() => this.disabled() || this.loading());
  protected readonly linkRole = computed(() => {
    if (this.isButton) return this.role() ?? null;
    if (this.inert() && this.href() !== undefined) return this.role() ?? 'link';
    return this.role() ?? null;
  });

  constructor() {
    const block = (event: Event) => {
      if (!this.inert()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    for (const type of BLOCKED) this.host.addEventListener(type, block, { capture: true });
  }
}
