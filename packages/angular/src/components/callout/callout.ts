// Callout: a static note inside content. The host element is the root:
// `div[dsCallout]` (role note) or `aside[dsCallout]` (a complementary
// landmark). The template renders the parts in the React order: icon,
// title, body.
//
//   <div dsCallout tone="accent" title="Move faster with the keyboard">Press the slash key to search.</div>
//   <aside dsCallout tone="accent" title="Related: share a board">...</aside>
//
// The twin of packages/react/src/components/Callout/Callout.tsx. React's
// `as` prop has no input: the host tag is the form, as `a[dsButton]` is the
// link form of Button. The body is the projected content; the part is left
// out while it is empty. The name is the icon's tone word, then the title:
// aria-labelledby points at both, with ids from the CDK id generator.
import { ChangeDetectionStrategy, Component, HostAttributeToken, computed, inject, input, type TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { _IdGenerator } from '@angular/cdk/a11y';
import { DsIcon } from '@the-system/icons/angular';
import type { IconName } from '@the-system/icons';
import type { Emphasis, Tone } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { DsThemeService } from '../../theme/theme';
import { DsFilledPart, messageIcons, wordsFor } from '../alert/message';
import type { MessageContent } from '../alert/alert';

export type CalloutTone = Tone;
export type CalloutEmphasis = Extract<Emphasis, 'soft' | 'outline'>;

/** The tone word of each tone, by language. It is the accessible name of the icon and starts the callout's name. */
export const calloutLabels = {
  en: { tone: { neutral: 'Note', accent: 'Tip', info: 'Information', success: 'Success', warning: 'Warning', danger: 'Caution' } },
  ar: { tone: { neutral: 'ملاحظة', accent: 'نصيحة', info: 'معلومة', success: 'نجاح', warning: 'تنبيه', danger: 'تحذير' } },
} as const;

@Component({
  selector: 'div[dsCallout], aside[dsCallout]',
  exportAs: 'dsCallout',
  imports: [DsIcon, DsFilledPart, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'callout',
    '[attr.id]': 'id() ?? null',
    '[attr.lang]': 'lang() ?? null',
    '[attr.role]': 'isDiv ? "note" : null',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-emphasis]': 'emphasis()',
  },
  template: `
    @let ic = icon();
    @if (ic === undefined || isText(ic)) {
      <span data-part="icon"><svg dsIcon [attr.id]="iconId()" [name]="$any(ic ?? defaultIcon())" size="md" [label]="word()"></svg></span>
    } @else {
      <span data-part="icon" [attr.id]="iconId()" role="img" [attr.aria-label]="word()"><ng-container [ngTemplateOutlet]="ic" /></span>
    }
    @if (hasTitle()) {
      <div data-part="title" [attr.id]="titleId()">@if (isText(title())) {{{ title() }}} @else {<ng-container [ngTemplateOutlet]="$any(title())" />}</div>
    }
    <div data-part="body" dsFilledPart><ng-content /></div>
  `,
})
export class DsCallout {
  /** The color, the icon and the tone word. Default neutral. */
  readonly tone = input<CalloutTone>('neutral');
  /** soft is a tinted box, outline a tone border on the surface. Default soft. */
  readonly emphasis = input<CalloutEmphasis>('soft');
  /** A short line that sums up the note. Optional: without it the tone word names the callout. Not the native title attribute. */
  readonly title = input<MessageContent | undefined>(undefined);
  /** A system icon name or a template in place of the tone icon. */
  readonly icon = input<IconName | TemplateRef<unknown> | undefined>(undefined);
  /** The word the icon says. Default the tone word in the page language (Note, Tip, Caution). */
  readonly toneLabel = input<string | undefined>(undefined);
  /** The id of the root; the icon and title ids derive from it. */
  readonly id = input<string | undefined>(undefined);
  /** The language of the callout. Picks the tone word; stamped as the lang attribute. */
  readonly lang = input<string | undefined>(undefined);

  private readonly host = consumeHostAttributes(['dsCallout', 'tone', 'emphasis', 'title', 'icon', 'toneLabel', 'id']);
  protected readonly isDiv = this.host.tagName === 'DIV';
  private readonly ownLabelledBy = inject(new HostAttributeToken('aria-labelledby'), { optional: true });
  private readonly ownLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly theme = inject(DsThemeService);
  private readonly auto = inject(_IdGenerator).getId('ds-callout-');
  private readonly base = computed(() => this.id() ?? this.auto);
  protected readonly iconId = computed(() => `${this.base()}-icon`);
  protected readonly titleId = computed(() => `${this.base()}-title`);
  protected readonly hasTitle = computed(() => {
    const t = this.title();
    return t !== undefined && t !== null && t !== '';
  });
  protected readonly labelledBy = computed(() => {
    if (this.ownLabelledBy !== null) return this.ownLabelledBy;
    if (this.ownLabel !== null) return null;
    return this.hasTitle() ? `${this.iconId()} ${this.titleId()}` : this.iconId();
  });
  private readonly words = computed(() => wordsFor(calloutLabels, this.lang() ?? this.theme.value().lang));
  /** An empty toneLabel falls back to the tone word: the icon always has a name. */
  protected readonly word = computed(() => this.toneLabel() || this.words().tone[this.tone()]);
  protected readonly defaultIcon = computed(() => messageIcons[this.tone()]);
  protected readonly isText = (v: unknown): v is string => typeof v === 'string';
}
