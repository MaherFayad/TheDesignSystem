// SplitButton: a main action fused to a menu trigger of related actions. The
// twin of packages/react/src/components/SplitButton/SplitButton.tsx, built
// from the system: the action is a dsButton, the trigger a dsIconButton with
// dsDropdownMenuTrigger, the menu a dsDropdownMenuContent named menu.
//
//   <div dsSplitButton tone="accent" emphasis="solid" label="Publish page"
//        menuLabel="More publish options" (action)="publish()">
//     <ng-template dsSplitButtonMenu>
//       <div dsDropdownMenuItem start="clock">Schedule publish</div>
//     </ng-template>
//   </div>
//
// The menu items come in an ng-template, not as projected content: they are
// rendered in the menu layer, and their DI must reach the menu. The host
// provides the menu and its panel to that template.
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { Emphasis, Shape, Size, Tone } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import type { ButtonSlotContent } from '../button/button-base';
import { DsButton } from '../button/button';
import { DS_BUTTON_GROUP } from '../button-group/button-group-context';
import { DsIconButton } from '../icon-button/icon-button';
import {
  DS_MENU_PANEL,
  DsDropdownMenu,
  DsDropdownMenuContent,
  DsDropdownMenuTrigger,
  type DropdownMenuSize,
} from '../dropdown-menu/dropdown-menu';

export type SplitButtonSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export type SplitButtonTone = Extract<Tone, 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'>;
/** No link: a link has no fill to split. */
export type SplitButtonEmphasis = Extract<Emphasis, 'solid' | 'soft' | 'outline' | 'ghost'>;
export type SplitButtonShape = Extract<Shape, 'default' | 'pill' | 'square'>;

/** The menu of a SplitButton: an ng-template with dsDropdownMenuItem elements. One to seven. */
@Directive({ selector: 'ng-template[dsSplitButtonMenu]' })
export class DsSplitButtonMenu {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** Menu rows follow the control: small controls get small rows. */
function menuSizeFor(size: SplitButtonSize): DropdownMenuSize {
  return size === 'xs' || size === 'sm' ? 'sm' : 'md';
}

/**
 * A main action with a menu of related actions behind a chevron trigger.
 * Both halves share size, tone, emphasis and shape and read as one control;
 * the menu opens under it, aligned to its inline end.
 */
@Component({
  selector: 'div[dsSplitButton]',
  exportAs: 'dsSplitButton',
  imports: [DsButton, DsIconButton, DsDropdownMenu, DsDropdownMenuTrigger, DsDropdownMenuContent, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    // The items of the menu template are declared in the caller's template,
    // under this host: give them the menu and its panel from this view.
    { provide: DsDropdownMenu, useFactory: () => inject(DsSplitButton).menu() },
    { provide: DS_MENU_PANEL, useFactory: () => inject(DsSplitButton).content() },
  ],
  host: {
    'data-ds': 'split-button',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-emphasis]': 'resolvedEmphasis()',
    '[attr.data-shape]': 'resolvedShape()',
    '[attr.data-disabled]': 'disabled() ? "" : null',
  },
  template: `
    <button dsButton data-part="action" [size]="resolvedSize()" [tone]="tone()" [emphasis]="resolvedEmphasis()"
      [shape]="resolvedShape()" [disabled]="disabled()" [start]="start()" [loading]="loading()"
      [loadingLabel]="loadingLabel() ?? 'Loading'" (click)="action.emit($event)">{{ label() }}</button>
    <ng-container dsDropdownMenu [(open)]="open" [defaultOpen]="defaultOpen()" [size]="menuSize()">
      <button dsIconButton dsDropdownMenuTrigger data-part="trigger" icon="chevron-down" [label]="menuLabel()"
        [size]="resolvedSize()" [tone]="tone()" [emphasis]="resolvedEmphasis()" [shape]="resolvedShape()"
        [disabled]="disabled()"></button>
      <ng-template dsDropdownMenuContent align="end" part="menu">
        @if (items(); as items) {
          <ng-container [ngTemplateOutlet]="items.template" />
        }
      </ng-template>
    </ng-container>
  `,
})
export class DsSplitButton {
  /** The visible text of the main action. English: a verb plus a noun. Arabic: a noun form. */
  readonly label = input.required<string>();
  /** The accessible name of the menu trigger. It names the menu ("More publish options"). */
  readonly menuLabel = input.required<string>();
  /** Leading content of the action: an icon name or a template. */
  readonly start = input<ButtonSlotContent | undefined>(undefined);
  /** Both halves. Default md, or the size of the ButtonGroup. */
  readonly size = input<SplitButtonSize | undefined>(undefined);
  /** Both halves. Default neutral. */
  readonly tone = input<SplitButtonTone>('neutral');
  /** Both halves. Default soft, or the emphasis of the ButtonGroup. */
  readonly emphasis = input<SplitButtonEmphasis | undefined>(undefined);
  /** Both halves; only the outer corners take it. Default default. */
  readonly shape = input<SplitButtonShape | undefined>(undefined);
  /** The action is in flight: the action shows the spinner and blocks; the menu stays usable. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** The words the hidden status says while loading. Default "Loading". */
  readonly loadingLabel = input<string | undefined>(undefined);
  /** Blocks both halves. They stay focusable with aria-disabled. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The menu is open. Two way with `[(open)]`. */
  readonly open = model<boolean | undefined>(undefined);
  /** Open at first. Default false. */
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** Runs the main action: click, Enter and Space on the action half. React's onClick. */
  readonly action = output<MouseEvent>();

  protected readonly items = contentChild(DsSplitButtonMenu);
  readonly menu = viewChild.required(DsDropdownMenu);
  readonly content = viewChild.required(DsDropdownMenuContent);

  // Inside a ButtonGroup the group axes fill what is unset, as on a Button.
  private readonly group = inject(DS_BUTTON_GROUP, { optional: true });
  protected readonly resolvedSize = computed<SplitButtonSize>(() => this.size() ?? this.group?.size() ?? 'md');
  protected readonly resolvedEmphasis = computed<SplitButtonEmphasis>(() => this.emphasis() ?? this.group?.emphasis() ?? 'soft');
  protected readonly resolvedShape = computed<SplitButtonShape>(() => this.shape() ?? this.group?.shape() ?? 'default');
  protected readonly menuSize = computed(() => menuSizeFor(this.resolvedSize()));

  constructor() {
    consumeHostAttributes([
      'dsSplitButton', 'label', 'menuLabel', 'start', 'size', 'tone', 'emphasis', 'shape', 'loading', 'loadingLabel', 'disabled', 'open', 'defaultOpen',
    ]);
  }
}
