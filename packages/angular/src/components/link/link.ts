// Link: navigation to another page or place, in running text or standing
// alone. The host is the anchor itself, `a[dsLink]`; a router link is the
// same element with the router directive on it, so `asChild` has no form.
//
//   <p>Storage is almost full. <a dsLink href="#storage">Review large files</a>.</p>
//   <a dsLink standalone external href="https://example.com/docs">Open the docs</a>
//
// The twin of packages/react/src/components/Link/Link.tsx: always
// underlined; standalone makes a 24px target; disabled drops the href, keeps
// role link and stays in the tab order with aria-disabled.
import { ChangeDetectionStrategy, Component, booleanAttribute, computed, inject, input } from '@angular/core';
import { DsIcon } from '@the-system/icons/angular';
import type { Size, Tone } from '@the-system/shared';
import { ownAttribute } from '../../internal/own-attribute';
import { consumeHostAttributes } from '../../internal/host';
import { DsThemeService } from '../../theme/theme';

export type LinkTone = Extract<Tone, 'neutral' | 'accent'>;
export type LinkSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;

/** What the hidden text after an external link says, per language. */
export const linkExternalLabels = { en: 'opens in a new tab', ar: 'يفتح في تبويب جديد' } as const;

const BLOCKED = ['click', 'auxclick'] as const;

function toTabIndex(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

@Component({
  selector: 'a[dsLink]',
  exportAs: 'dsLink',
  imports: [DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'link',
    '[attr.data-tone]': 'tone()',
    '[attr.data-size]': 'size() ?? null',
    '[attr.data-standalone]': 'standalone() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.href]': 'disabled() ? null : (href() ?? null)',
    '[attr.target]': 'opensOut() ? (target() ?? "_blank") : (target() ?? null)',
    '[attr.rel]': 'opensOut() ? (rel() ?? "noopener noreferrer") : (rel() ?? null)',
    '[attr.role]': 'disabled() ? (role() ?? "link") : (role() ?? null)',
  },
  template: `
    <span data-part="label"><ng-content /></span>
    @if (external()) {
      <span data-part="end"><svg dsIcon name="external" size="sm"></svg><span>{{ hidden() }}</span></span>
    }
  `,
})
export class DsLink {
  /** neutral reads as text, accent takes the primary color on a surface. Default neutral. */
  readonly tone = input<LinkTone>('neutral');
  /** Font size from the font.size tokens. Default none: the link inherits the size of the text around it. */
  readonly size = input<LinkSize | undefined>(undefined);
  /** Opens in a new tab and shows the external icon with hidden words. Default false. */
  readonly external = input(false, { transform: booleanAttribute });
  /** The hidden words after an external link. Default "opens in a new tab", in Arabic "يفتح في تبويب جديد". */
  readonly externalLabel = input<string | undefined>(undefined);
  /** A link on its own line: at least 24px tall (WCAG 2.5.8). Default false. */
  readonly standalone = input(false, { transform: booleanAttribute });
  /** Cannot be followed: no href, aria-disabled, still focusable. Default false. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The link target. Removed while disabled. */
  readonly href = input<string | undefined>(undefined);
  /** Native target. Default _blank when external. */
  readonly target = input<string | undefined>(undefined);
  /** Native rel. Default "noopener noreferrer" when external. */
  readonly rel = input<string | undefined>(undefined);
  /** A role of the caller's own. */
  readonly role = input<string | undefined>(undefined);
  /** A tab index of the caller's own. Default 0 while disabled, so it stays in the tab order. */
  readonly tabIndex = input<number | undefined>(undefined);
  /** The static `tabindex="-1"` an author writes. `tabIndex` wins when both are set. */
  readonly tabindexAttr = input<number | undefined, unknown>(undefined, { alias: 'tabindex', transform: toTabIndex });
  /** A caller's own aria-disabled, kept while the link is not disabled, as React passes it through. */
  readonly ariaDisabled = input<string | undefined>(undefined, { alias: 'aria-disabled' });

  private readonly theme = inject(DsThemeService);
  private readonly host = consumeHostAttributes([
    'dsLink', 'tone', 'size', 'external', 'externalLabel', 'standalone', 'disabled', 'href', 'target', 'rel', 'role', 'tabIndex',
  ]);
  protected readonly ownTabIndex = computed(() => this.tabIndex() ?? this.tabindexAttr());
  protected readonly opensOut = computed(() => this.external() && !this.disabled());
  /** A comma before the hidden words, so they read as a pause after the link text. */
  protected readonly hidden = computed(() => {
    const ar = this.theme.value().lang.toLowerCase().startsWith('ar');
    return `${ar ? '،' : ','} ${this.externalLabel() ?? linkExternalLabels[ar ? 'ar' : 'en']}`;
  });

  constructor() {
    const block = (event: Event) => {
      if (!this.disabled()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    for (const type of BLOCKED) this.host.addEventListener(type, block, { capture: true });
    // Written only while the link has a value, so a caller's [attr.tabindex] or
    // [attr.aria-disabled] stays (review angular-2 R2, WCAG 2.4.3).
    ownAttribute(this.host, 'aria-disabled', () => (this.disabled() ? 'true' : this.ariaDisabled()));
    ownAttribute(this.host, 'tabindex', () => {
      const own = this.ownTabIndex();
      return this.disabled() ? String(own ?? 0) : own === undefined ? undefined : String(own);
    });
  }
}
