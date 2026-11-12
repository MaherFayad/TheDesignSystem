// WindowControls: the traffic lights of a window title bar. Close, minimize
// and zoom, in that order. The twin of
// packages/react/src/components/WindowControls/WindowControls.tsx.
//
// Each light is a dsIconButton. A light with no handler is disabled:
// aria-disabled, data-disabled and out of the tab order. The handlers are
// function inputs named like the React props (onClose, onMinimize, onZoom),
// because an Angular output cannot tell whether anyone listens, and a light
// with no listener must be disabled.
//
//   <div dsWindowControls [onClose]="close"></div>
import { ChangeDetectionStrategy, Component, booleanAttribute, computed, inject, input } from '@angular/core';
import { DsIcon } from '@the-system/icons/angular';
import { consumeHostAttributes } from '../../internal/host';
import { DsThemeService } from '../../theme/theme';
import { DsIconButton } from '../icon-button/icon-button';

/** The built in labels, per language. An input always wins. Arabic: noun form, no diacritics. */
export const windowControlsLabels = {
  en: { close: 'Close window', minimize: 'Minimize window', zoom: 'Zoom window', group: 'Window controls' },
  ar: { close: 'إغلاق النافذة', minimize: 'تصغير النافذة', zoom: 'تكبير النافذة', group: 'أزرار النافذة' },
} as const;

function labelsFor(lang: string) {
  return lang === 'ar' || lang.startsWith('ar-') ? windowControlsLabels.ar : windowControlsLabels.en;
}

export type WindowControlsHandler = (event: MouseEvent) => void;

@Component({
  selector: 'div[dsWindowControls]',
  exportAs: 'dsWindowControls',
  imports: [DsIconButton, DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'window-controls',
    role: 'group',
    '[attr.data-state]': 'active() ? "active" : "inactive"',
    '[attr.aria-label]': 'label() ?? words().group',
  },
  template: `
    <button dsIconButton data-part="close" [icon]="closeIcon" [label]="closeLabel() ?? words().close" size="xs" shape="pill"
      [disabled]="!onClose()" [attr.tabindex]="onClose() ? null : -1" (click)="run(onClose(), $event)"></button>
    <button dsIconButton data-part="minimize" [icon]="minimizeIcon" [label]="minimizeLabel() ?? words().minimize" size="xs" shape="pill"
      [disabled]="!onMinimize()" [attr.tabindex]="onMinimize() ? null : -1" (click)="run(onMinimize(), $event)"></button>
    <button dsIconButton data-part="zoom" [icon]="zoomIcon" [label]="zoomLabel() ?? words().zoom" size="xs" shape="pill"
      [disabled]="!onZoom()" [attr.tabindex]="onZoom() ? null : -1"
      [attr.aria-pressed]="onZoom() && zoomed() !== undefined ? zoomed() : null" (click)="run(onZoom(), $event)"></button>
    <ng-template #closeIcon><svg dsIcon name="close" size="sm"></svg></ng-template>
    <ng-template #minimizeIcon><svg dsIcon name="minimize" size="sm"></svg></ng-template>
    <ng-template #zoomIcon><svg dsIcon name="zoom" size="sm"></svg></ng-template>
  `,
})
export class DsWindowControls {
  /** Closes the window. Without it the close light is disabled. */
  readonly onClose = input<WindowControlsHandler | undefined>(undefined);
  /** Minimizes the window. Without it the minimize light is disabled. */
  readonly onMinimize = input<WindowControlsHandler | undefined>(undefined);
  /** Zooms the window. Without it the zoom light is disabled. */
  readonly onZoom = input<WindowControlsHandler | undefined>(undefined);
  /** The zoom state, set as aria-pressed on the zoom light. */
  readonly zoomed = input<boolean | undefined>(undefined);
  /** Accessible name of the close light. Default "Close window", in Arabic "إغلاق النافذة". */
  readonly closeLabel = input<string | undefined>(undefined);
  /** Accessible name of the minimize light. Default "Minimize window", in Arabic "تصغير النافذة". */
  readonly minimizeLabel = input<string | undefined>(undefined);
  /** Accessible name of the zoom light. Default "Zoom window", in Arabic "تكبير النافذة". */
  readonly zoomLabel = input<string | undefined>(undefined);
  /** Accessible name of the group. Default "Window controls", in Arabic "أزرار النافذة". */
  readonly label = input<string | undefined>(undefined);
  /** Whether the window these lights belong to has focus. Default true. */
  readonly active = input(true, { transform: booleanAttribute });

  private readonly theme = inject(DsThemeService);
  protected readonly words = computed(() => labelsFor(this.theme.value().lang));

  constructor() {
    consumeHostAttributes(['dsWindowControls', 'onClose', 'onMinimize', 'onZoom', 'zoomed', 'closeLabel', 'minimizeLabel', 'zoomLabel', 'label', 'active']);
  }

  protected run(handler: WindowControlsHandler | undefined, event: MouseEvent): void {
    handler?.(event);
  }
}
