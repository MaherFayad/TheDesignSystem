// TitleBar: the bar at the top of a window or a panel. The controls slot at
// the start (WindowControls in Desk), the title, then trailing actions. The
// twin of packages/react/src/components/TitleBar/TitleBar.tsx, ported to the
// minimum Dialog needs: no move handle yet (`moveLabel` arrives with Window).
//
//   <div dsTitleBar [title]="'Report.pdf'" [controls]="lights"></div>
//   <div dsTitleBar [controls]="lights"><ng-template dsTitleBarTitle><b>Report</b>.pdf</ng-template></div>
import { ChangeDetectionStrategy, Component, Directive, TemplateRef, booleanAttribute, computed, contentChild, inject, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { consumeHostAttributes } from '../../internal/host';

export type TitleBarHeading = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
/** A string, or a template (a file name with a Bidi run, the dialog title). */
export type TitleBarContent = string | TemplateRef<unknown>;

/** A title as markup, the same as a template passed to the title input. */
@Directive({ selector: 'ng-template[dsTitleBarTitle]' })
export class DsTitleBarTitle {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

@Component({
  selector: 'div[dsTitleBar]',
  exportAs: 'dsTitleBar',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'title-bar',
    '[attr.data-state]': 'active() ? "active" : "inactive"',
  },
  template: `
    @if (controls(); as c) {
      <div data-part="controls"><ng-container [ngTemplateOutlet]="c" /></div>
    }
    @switch (heading()) {
      @case ('h1') { <h1 data-part="title" [attr.id]="titleId() ?? null"><ng-container [ngTemplateOutlet]="titleTpl" /></h1> }
      @case ('h3') { <h3 data-part="title" [attr.id]="titleId() ?? null"><ng-container [ngTemplateOutlet]="titleTpl" /></h3> }
      @case ('h4') { <h4 data-part="title" [attr.id]="titleId() ?? null"><ng-container [ngTemplateOutlet]="titleTpl" /></h4> }
      @case ('h5') { <h5 data-part="title" [attr.id]="titleId() ?? null"><ng-container [ngTemplateOutlet]="titleTpl" /></h5> }
      @case ('h6') { <h6 data-part="title" [attr.id]="titleId() ?? null"><ng-container [ngTemplateOutlet]="titleTpl" /></h6> }
      @case ('div') { <div data-part="title" [attr.id]="titleId() ?? null"><ng-container [ngTemplateOutlet]="titleTpl" /></div> }
      @default { <h2 data-part="title" [attr.id]="titleId() ?? null"><ng-container [ngTemplateOutlet]="titleTpl" /></h2> }
    }
    @if (actions(); as a) {
      <div data-part="actions"><ng-container [ngTemplateOutlet]="a" /></div>
    }
    <ng-template #titleTpl>
      @let t = title() ?? projectedTitle()?.template;
      @if (isTemplate(t)) {
        <ng-container [ngTemplateOutlet]="t" />
      } @else if (t !== undefined) {
        {{ t }}
      }
    </ng-template>
  `,
})
export class DsTitleBar {
  /** The title. Truncates with an ellipsis. */
  readonly title = input<TitleBarContent | undefined>(undefined);
  /** The element of the title. Default h2. */
  readonly as = input<TitleBarHeading>('h2');
  /** `as` is a keyword in template expressions, so the template reads it here. */
  protected readonly heading = computed(() => this.as());
  protected readonly projectedTitle = contentChild(DsTitleBarTitle);
  /** id of the title element, so a window or dialog can point aria-labelledby at it. */
  readonly titleId = input<string | undefined>(undefined);
  /** The start slot: a template with WindowControls. */
  readonly controls = input<TemplateRef<unknown> | undefined>(undefined);
  /** The end slot: a template with IconButtons and small Buttons. */
  readonly actions = input<TemplateRef<unknown> | undefined>(undefined);
  /** Whether the window has focus. Sets data-state active or inactive. Default true. */
  readonly active = input(true, { transform: booleanAttribute });

  constructor() {
    consumeHostAttributes(['dsTitleBar', 'title', 'as', 'titleId', 'controls', 'actions', 'active']);
  }

  protected isTemplate(value: TitleBarContent | undefined): value is TemplateRef<unknown> {
    return typeof value === 'object' && value !== null;
  }
}
