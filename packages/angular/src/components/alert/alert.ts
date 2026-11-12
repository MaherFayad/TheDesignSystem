// Alert: a message about the page or a section that stays until it is fixed
// or dismissed (a form error summary, a sync problem). The host element is
// the root, `div[dsAlert]`, and the template renders the parts in the React
// order: icon, title, body, actions, close.
//
//   <div dsAlert tone="danger" title="Could not sync 3 files" [actions]="retry" [onClose]="dismiss">
//     The server did not answer. Your local copies are safe.
//   </div>
//
// The twin of packages/react/src/components/Alert/Alert.tsx. The body is the
// projected content; the part is left out while it is empty. `title`,
// `actions` and `icon` take a string (an icon name for icon) or a template.
// `onClose` is a function input, as on WindowControls: the close button is
// rendered only when there is a handler, and an output cannot tell.
//
// Live role: none by default. `live` is for an alert mounted after load:
// role alert for danger, role status (with aria-atomic) for the rest.
import { ChangeDetectionStrategy, Component, HostAttributeToken, booleanAttribute, computed, inject, input, type TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DsIcon } from '@the-system/icons/angular';
import type { IconName } from '@the-system/icons';
import type { Emphasis, Size, Tone } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { DsThemeService } from '../../theme/theme';
import { DsCloseButton } from '../close-button/close-button';
import { DsFilledPart, messageIcons, wordsFor } from './message';

export type AlertTone = Tone;
export type AlertEmphasis = Extract<Emphasis, 'soft' | 'outline' | 'solid'>;
export type AlertSize = Extract<Size, 'sm' | 'md'>;

/** Default words of the alert chrome, by language. The tone word is the accessible name of the icon. */
export const alertLabels = {
  en: {
    close: 'Dismiss alert',
    tone: { neutral: 'Notice', accent: 'Notice', info: 'Information', success: 'Success', warning: 'Warning', danger: 'Error' },
  },
  ar: {
    close: 'إغلاق الرسالة',
    tone: { neutral: 'إشعار', accent: 'إشعار', info: 'معلومة', success: 'نجاح', warning: 'تنبيه', danger: 'خطأ' },
  },
} as const;

/** A node prop in Angular: text, or a template. */
export type MessageContent = string | TemplateRef<unknown>;

@Component({
  selector: 'div[dsAlert]',
  exportAs: 'dsAlert',
  imports: [DsIcon, DsCloseButton, DsFilledPart, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'alert',
    '[attr.lang]': 'lang() ?? null',
    '[attr.role]': 'role()',
    '[attr.aria-atomic]': 'role() === "status" ? "true" : ownAtomic',
    '[attr.data-tone]': 'tone()',
    '[attr.data-emphasis]': 'emphasis()',
    '[attr.data-size]': 'size()',
  },
  template: `
    @let ic = icon();
    @if (ic === undefined || isText(ic)) {
      <span data-part="icon"><svg dsIcon [name]="$any(ic ?? defaultIcon())" size="md" [label]="word()"></svg></span>
    } @else {
      <span data-part="icon" role="img" [attr.aria-label]="word()"><ng-container [ngTemplateOutlet]="ic" /></span>
    }
    <div data-part="title">@if (isText(title())) {{{ title() }}} @else {<ng-container [ngTemplateOutlet]="$any(title())" />}</div>
    <div data-part="body" dsFilledPart><ng-content /></div>
    @if (actions(); as a) {
      <div data-part="actions">@if (isText(a)) {{{ a }}} @else {<ng-container [ngTemplateOutlet]="a" />}</div>
    }
    @if (onClose(); as close) {
      <button dsCloseButton data-part="close" size="xs" [label]="closeName()" (click)="close()"></button>
    }
  `,
})
export class DsAlert {
  /** The color, the icon and the tone word. Default neutral. */
  readonly tone = input<AlertTone>('neutral');
  /** soft is a tinted box, outline a tone border on the surface, solid a full tone fill. Default soft. */
  readonly emphasis = input<AlertEmphasis>('soft');
  /** Default md. sm for a dense panel or an inspector. */
  readonly size = input<AlertSize>('md');
  /** One line that names the problem or the result: Could not sync 3 files. Required. Not the native title attribute. */
  readonly title = input.required<MessageContent>();
  /** Buttons that fix the problem, at most two, verb plus noun, as a template. Rendered in the actions part. */
  readonly actions = input<MessageContent | undefined>(undefined);
  /** A system icon name or a template in place of the tone icon. */
  readonly icon = input<IconName | TemplateRef<unknown> | undefined>(undefined);
  /** The word the icon says to assistive tech. Default the tone word in the page language (Error, Warning). */
  readonly toneLabel = input<string | undefined>(undefined);
  /** The alert is mounted after the page loaded and must be announced. Default false. */
  readonly live = input(false, { transform: booleanAttribute });
  /** Renders the close button and is called by it. Without it the alert has no close button. */
  readonly onClose = input<(() => void) | undefined>(undefined);
  /** The accessible name of the close button. Default "Dismiss alert", or Arabic under lang ar. */
  readonly closeLabel = input<string | undefined>(undefined);
  /** The language of the alert. Picks the default words; stamped as the lang attribute. */
  readonly lang = input<string | undefined>(undefined);

  private readonly theme = inject(DsThemeService);
  protected readonly ownAtomic = inject(new HostAttributeToken('aria-atomic'), { optional: true });
  private readonly words = computed(() => wordsFor(alertLabels, this.lang() ?? this.theme.value().lang));
  protected readonly role = computed(() => (this.live() ? (this.tone() === 'danger' ? 'alert' : 'status') : null));
  /** An empty toneLabel falls back to the tone word: the icon always has a name. */
  protected readonly word = computed(() => this.toneLabel() || this.words().tone[this.tone()]);
  protected readonly defaultIcon = computed(() => messageIcons[this.tone()]);
  protected readonly closeName = computed(() => this.closeLabel() ?? this.words().close);
  protected readonly isText = (v: unknown): v is string => typeof v === 'string';

  constructor() {
    consumeHostAttributes(['dsAlert', 'tone', 'emphasis', 'size', 'title', 'actions', 'icon', 'toneLabel', 'live', 'onClose', 'closeLabel']);
  }
}
