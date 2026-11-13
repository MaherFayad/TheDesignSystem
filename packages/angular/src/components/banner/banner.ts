// Banner: a page wide notice at the top of the app. The host element is the
// root, `section[dsBanner]`, a region named by `label`, and the template
// renders the parts in the React order: icon, body, actions, close.
//
//   <section dsBanner tone="warning" [actions]="pay" [onDismiss]="hide">Your trial ends in 3 days.</section>
//
// The twin of packages/react/src/components/Banner/Banner.tsx. The body is
// the projected content. `actions` and `icon` take a template (an icon name
// for icon). `onDismiss` is a function input: the close button is rendered
// only when there is a handler. On dismiss focus moves to `returnFocus`
// (default the first main element), then the handler runs; the banner
// stores nothing. With `sticky` it reserves scroll padding on its scroll
// container for its own height, through a ResizeObserver.
import {
  ChangeDetectionStrategy,
  Component,
  HostAttributeToken,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  type TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DsIcon } from '@the-system/icons/angular';
import type { IconName } from '@the-system/icons';
import type { Emphasis, Tone } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { dismissWithExit } from '@the-system/motion';
import { DsThemeService } from '../../theme/theme';
import { DsCloseButton } from '../close-button/close-button';
import { messageIcons, wordsFor } from '../alert/message';
import type { MessageContent } from '../alert/alert';

export type BannerTone = Tone;
export type BannerEmphasis = Extract<Emphasis, 'soft' | 'solid'>;

/** Default words of the banner chrome, by language. */
export const bannerLabels = {
  en: {
    region: 'Announcement',
    close: 'Dismiss announcement',
    tone: { neutral: 'Notice', accent: 'Notice', info: 'Information', success: 'Success', warning: 'Warning', danger: 'Error' },
  },
  ar: {
    region: 'إعلان',
    close: 'إغلاق الإعلان',
    tone: { neutral: 'إشعار', accent: 'إشعار', info: 'معلومة', success: 'نجاح', warning: 'تنبيه', danger: 'خطأ' },
  },
} as const;

/** Where focus goes when the banner is dismissed: the start of the main content. */
const MAIN_SELECTOR = 'main, [role="main"]';

/** The ancestor a sticky element sticks to: the nearest one whose block overflow is not visible, or the document's scrolling element. */
function scrollContainer(el: HTMLElement): HTMLElement {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if (overflow !== 'visible' && overflow !== 'clip' && overflow !== '') return node;
  }
  return (el.ownerDocument.scrollingElement as HTMLElement | null) ?? el.ownerDocument.documentElement;
}

/** Moves focus to the target, making it focusable by script when it is not. */
function focusTarget(doc: Document, target: HTMLElement | string | undefined) {
  let el: HTMLElement | null = null;
  try {
    el = typeof target === 'string' || target === undefined ? doc.querySelector<HTMLElement>(target ?? MAIN_SELECTOR) : target;
  } catch {
    // An invalid selector: focus stays where it is, and onDismiss still runs.
    el = null;
  }
  if (!el) return;
  if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus();
}

@Component({
  selector: 'section[dsBanner]',
  exportAs: 'dsBanner',
  imports: [DsIcon, DsCloseButton, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'banner',
    '[attr.lang]': 'lang() ?? null',
    '[attr.aria-label]': 'regionName()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-emphasis]': 'emphasis()',
    '[attr.data-sticky]': 'sticky() ? "" : null',
  },
  template: `
    @let ic = icon();
    @if (ic === undefined || isText(ic)) {
      <span data-part="icon"><svg dsIcon [name]="$any(ic ?? defaultIcon())" size="md" [label]="word()"></svg></span>
    } @else {
      <span data-part="icon" role="img" [attr.aria-label]="word()"><ng-container [ngTemplateOutlet]="ic" /></span>
    }
    <div data-part="body"><ng-content /></div>
    @if (actions(); as a) {
      <div data-part="actions">@if (isText(a)) {{{ a }}} @else {<ng-container [ngTemplateOutlet]="a" />}</div>
    }
    @if (onDismiss()) {
      <button dsCloseButton data-part="close" size="xs" [label]="closeName()" (click)="dismiss()"></button>
    }
  `,
})
export class DsBanner {
  /** The color, the icon and the tone word. Default neutral. */
  readonly tone = input<BannerTone>('neutral');
  /** soft is a tinted bar, solid a full tone fill. Default soft. */
  readonly emphasis = input<BannerEmphasis>('soft');
  /** Up to two Buttons, size sm, as a template. */
  readonly actions = input<MessageContent | undefined>(undefined);
  /** The name of the region. Default "Announcement", or Arabic under lang ar. */
  readonly label = input<string | undefined>(undefined);
  /** A system icon name or a template in place of the tone icon. */
  readonly icon = input<IconName | TemplateRef<unknown> | undefined>(undefined);
  /** The word the icon says. Default the tone word in the page language. */
  readonly toneLabel = input<string | undefined>(undefined);
  /** Sticks to the top of its scroll container and reserves scroll padding for its height. Default false. */
  readonly sticky = input(false, { transform: booleanAttribute });
  /** Renders the close button and is called by it, after focus has moved to the start of the main content. */
  readonly onDismiss = input<(() => void) | undefined>(undefined);
  /** Where focus goes on dismiss: an element or a selector. Default the first main element. */
  readonly returnFocus = input<HTMLElement | string | undefined>(undefined);
  /** The accessible name of the close button. Default "Dismiss announcement", or Arabic under lang ar. */
  readonly closeLabel = input<string | undefined>(undefined);
  /** The language of the banner. Picks the default words; stamped as the lang attribute. */
  readonly lang = input<string | undefined>(undefined);

  private readonly host = consumeHostAttributes([
    'dsBanner', 'tone', 'emphasis', 'actions', 'label', 'icon', 'toneLabel', 'sticky', 'onDismiss', 'returnFocus', 'closeLabel',
  ]);
  private readonly ownLabelledBy = inject(new HostAttributeToken('aria-labelledby'), { optional: true });
  private readonly ownLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly theme = inject(DsThemeService);
  private readonly motion = injectMotion();
  private readonly words = computed(() => wordsFor(bannerLabels, this.lang() ?? this.theme.value().lang));
  protected readonly regionName = computed(() =>
    this.ownLabelledBy !== null ? null : (this.label() ?? this.ownLabel ?? this.words().region),
  );
  /** An empty toneLabel falls back to the tone word: the icon always has a name. */
  protected readonly word = computed(() => this.toneLabel() || this.words().tone[this.tone()]);
  protected readonly defaultIcon = computed(() => messageIcons[this.tone()]);
  protected readonly closeName = computed(() => this.closeLabel() ?? this.words().close);
  protected readonly isText = (v: unknown): v is string => typeof v === 'string';

  constructor() {
    // After the render, so the banner is in the document and its scroll container is known.
    afterRenderEffect((onCleanup) => {
      const el = this.host;
      if (!this.sticky()) return;
      const container = scrollContainer(el);
      const previous = container.style.scrollPaddingBlockStart;
      const apply = () => {
        container.style.scrollPaddingBlockStart = `${el.getBoundingClientRect().height}px`;
      };
      apply();
      const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(apply);
      observer?.observe(el);
      onCleanup(() => {
        observer?.disconnect();
        container.style.scrollPaddingBlockStart = previous;
      });
    });
  }

  protected dismiss(): void {
    focusTarget(this.host.ownerDocument, this.returnFocus());
    const done = this.onDismiss();
    if (!done) return;
    // alert-dismiss (order 1.22): the banner goes at once; a ghost of it shrinks away while the page slides up.
    dismissWithExit(this.host, this.motion.mode('alert-dismiss'), done);
  }
}
