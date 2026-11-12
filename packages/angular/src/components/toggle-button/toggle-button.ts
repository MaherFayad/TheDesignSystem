// ToggleButton: a Button that stays pressed or not (bold, mute, grid view).
// On the Button base, so the axes, the inert states and the look are
// Button's. The host carries aria-pressed and data-state (on, off), as Radix
// Toggle sets them in React. Space and Enter toggle it through the native
// button click.
//
//   <button dsToggleButton start="grid" [(pressed)]="grid">Grid view</button>
//   <button dsToggleButton icon="eye" label="Show guides" defaultPressed></button>
//
// The twin of packages/react/src/components/ToggleButton/ToggleButton.tsx.
// `onPressedChange` is the `pressedChange` output of `[(pressed)]`.
import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, linkedSignal, model } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DsIcon } from '@the-system/icons/angular';
import { consumeHostAttributes } from '../../internal/host';
import { DsButtonBase, isIconName, type ButtonEmphasis, type ButtonSlotContent } from '../button/button-base';

@Component({
  selector: 'button[dsToggleButton]',
  exportAs: 'dsToggleButton',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'toggle-button',
    '[attr.aria-pressed]': 'on() ? "true" : "false"',
    '[attr.data-state]': 'on() ? "on" : "off"',
    '[attr.aria-label]': 'icon() !== undefined ? label() : null',
    '(click)': 'toggle($event)',
  },
  template: `
    <ng-template #slot let-content>
      @if (isIconName(content)) {
        <svg dsIcon [name]="content" size="md"></svg>
      } @else {
        <ng-container [ngTemplateOutlet]="content" />
      }
    </ng-template>
    @if (icon(); as content) {
      <span data-part="icon"><ng-container [ngTemplateOutlet]="slot" [ngTemplateOutletContext]="{ $implicit: content }" /></span>
    } @else {
      @if (start(); as content) {
        <span data-part="start"><ng-container [ngTemplateOutlet]="slot" [ngTemplateOutletContext]="{ $implicit: content }" /></span>
      }
      <span data-part="label"><ng-content /></span>
      @if (end(); as content) {
        <span data-part="end"><ng-container [ngTemplateOutlet]="slot" [ngTemplateOutletContext]="{ $implicit: content }" /></span>
      }
    }
  `,
})
export class DsToggleButton extends DsButtonBase {
  /** Pressed. Two way with `[(pressed)]`; the `pressedChange` output says the new value. */
  readonly pressed = model<boolean | undefined>(undefined);
  /** Pressed at first, when `pressed` is not bound. Default false. */
  readonly defaultPressed = input(false, { transform: booleanAttribute });
  /** Default soft, or the emphasis of the ButtonGroup. */
  readonly emphasis = input<ButtonEmphasis | undefined>(undefined);
  /** Leading content before the label: an icon name or a template. */
  readonly start = input<ButtonSlotContent | undefined>(undefined);
  /** Trailing content after the label: an icon name or a template. */
  readonly end = input<ButtonSlotContent | undefined>(undefined);
  /** The icon only form: the icon, with `label` as the accessible name. Content is ignored. */
  readonly icon = input<ButtonSlotContent | undefined>(undefined);
  /** The accessible name of the icon only form, set as aria-label. Required with `icon`. */
  readonly label = input<string | undefined>(undefined);

  protected readonly defaultEmphasis: ButtonEmphasis = 'soft';
  protected readonly isIconName = isIconName;
  /** The shown state: the bound value, or the local one from defaultPressed and clicks. */
  readonly on = linkedSignal(() => this.pressed() ?? this.defaultPressed());
  private readonly hasIcon = computed(() => this.icon() !== undefined);

  constructor() {
    super();
    consumeHostAttributes(['dsToggleButton', 'pressed', 'defaultPressed', 'start', 'end', 'icon', 'label']);
  }

  protected override isIconOnly(): boolean {
    return this.hasIcon();
  }

  /** Runs after the base: an inert toggle never gets here (the capture listener stops the click). */
  protected async toggle(event: Event): Promise<void> {
    // A caller's (click) that prevents the default keeps the state, as with
    // Radix Toggle. Angular runs this host listener before the caller's, so
    // wait one microtask for it.
    await Promise.resolve();
    if (event.defaultPrevented) return;
    const next = !this.on();
    this.on.set(next);
    this.pressed.set(next);
  }
}
