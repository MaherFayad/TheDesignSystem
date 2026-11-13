// Stages of the Angular /interactions page for the actions family (orders
// 1.21 and 1.22), the twin of apps/gallery-react/src/interactions/actions.tsx.
// One standalone component per interaction id. Each stage marks the control
// that plays it with data-interaction-trigger, so the page's replay control
// can press it again. Same copy as React. Each host is display contents, so
// the controls sit in the stage's flex row as React's fragments do.
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, type Type } from '@angular/core';
import {
  DsButton,
  DsButtonGroup,
  DsCloseButton,
  DsCopyButton,
  DsDropdownMenu,
  DsDropdownMenuContent,
  DsDropdownMenuItem,
  DsDropdownMenuTrigger,
  DsFloatingActionButton,
  DsIconButton,
  DsLink,
  DsSplitButton,
  DsSplitButtonMenu,
  DsSwitch,
  DsTheme,
  DsToggleButton,
} from '@the-system/angular';

const host = { style: 'display: contents' };

@Component({
  selector: 'ds-stage-button-press',
  imports: [DsButton, DsIconButton, DsToggleButton, DsCloseButton, DsFloatingActionButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <button dsButton data-interaction-trigger="">Save draft</button>
    <button dsButton tone="accent" emphasis="solid" start="plus">Add member</button>
    <button dsIconButton icon="copy" label="Copy layer"></button>
    <button dsToggleButton icon="grid" label="Grid view"></button>
    <button dsCloseButton label="Close panel"></button>
    <button dsFloatingActionButton icon="plus" label="Create board" position="static" size="md"></button>
  `,
})
class ButtonPressStage {}

@Component({
  selector: 'ds-stage-segment-press',
  imports: [DsButton, DsButtonGroup, DsSplitButton, DsSplitButtonMenu, DsDropdownMenuItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div dsButtonGroup aria-label="Text alignment" attached>
      <button dsButton data-interaction-trigger="">Start</button>
      <button dsButton>Center</button>
      <button dsButton>End</button>
    </div>
    <div dsSplitButton label="Publish page" menuLabel="More publish options">
      <ng-template dsSplitButtonMenu>
        <div dsDropdownMenuItem start="clock">Schedule publish</div>
        <div dsDropdownMenuItem start="file">Save as draft</div>
      </ng-template>
    </div>
  `,
})
class SegmentPressStage {}

/** A button that loads for a moment after each press, then comes back. */
@Component({
  selector: 'ds-stage-button-loading',
  imports: [DsButton, DsIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <button dsButton tone="accent" emphasis="solid" [loading]="loading()" loadingLabel="Saving" (click)="run(loading)" data-interaction-trigger="">
      Save changes
    </button>
    <button dsIconButton icon="refresh" label="Refresh list" [loading]="iconLoading()" (click)="run(iconLoading)"></button>
  `,
})
class ButtonLoadingStage {
  protected readonly loading = signal(false);
  protected readonly iconLoading = signal(false);
  private readonly timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach(clearTimeout));
  }

  protected run(state: { set: (v: boolean) => void }): void {
    state.set(true);
    // The stand in action: it ends after a moment, as the React stage.
    this.timers.push(setTimeout(() => state.set(false), 1400));
  }
}

@Component({
  selector: 'ds-stage-copy-swap',
  imports: [DsCopyButton, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <button dsCopyButton value="npm install @the-system/react" label="Copy command" data-interaction-trigger=""></button>
    <button dsCopyButton value="npm install @the-system/react" label="Copy command" iconOnly></button>
    <div dsTheme [lang]="'ar'">
      <button dsCopyButton value="npm install @the-system/react" label="نسخ الأمر"></button>
    </div>
  `,
})
class CopySwapStage {}

@Component({
  selector: 'ds-stage-button-nudge',
  imports: [DsButton, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <button dsButton end="arrow-forward" data-interaction-trigger="">Next step</button>
    <div dsTheme [lang]="'ar'">
      <button dsButton end="arrow-forward">الخطوة التالية</button>
    </div>
  `,
})
class ButtonNudgeStage {}

@Component({
  selector: 'ds-stage-close-turn',
  imports: [DsCloseButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <button dsCloseButton label="Close panel" data-interaction-trigger=""></button>
    <button dsCloseButton label="Close panel" size="lg"></button>
  `,
})
class CloseTurnStage {}

@Component({
  selector: 'ds-stage-split-chevron',
  imports: [DsSplitButton, DsSplitButtonMenu, DsDropdownMenuItem, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div dsSplitButton label="Publish page" menuLabel="More publish options" tone="accent" emphasis="solid">
      <ng-template dsSplitButtonMenu>
        <div dsDropdownMenuItem start="clock">Schedule publish</div>
        <div dsDropdownMenuItem start="upload">Publish to staging</div>
        <div dsDropdownMenuItem start="file">Save as draft</div>
      </ng-template>
    </div>
    <div dsTheme [lang]="'ar'">
      <div dsSplitButton label="نشر الصفحة" menuLabel="خيارات النشر الأخرى">
        <ng-template dsSplitButtonMenu>
          <div dsDropdownMenuItem start="clock">جدولة النشر</div>
          <div dsDropdownMenuItem start="file">الحفظ كمسودة</div>
        </ng-template>
      </div>
    </div>
  `,
})
class SplitChevronStage {}

/** A floating action button that opens a menu and can show its label. */
@Component({
  selector: 'ds-stage-fab-morph',
  imports: [DsFloatingActionButton, DsDropdownMenu, DsDropdownMenuTrigger, DsDropdownMenuContent, DsDropdownMenuItem, DsToggleButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <ng-container dsDropdownMenu>
      <button dsFloatingActionButton dsDropdownMenuTrigger icon="plus" label="Create item" position="static" [extended]="extended()" data-interaction-trigger=""></button>
      <ng-template dsDropdownMenuContent align="end">
        <div dsDropdownMenuItem start="file">New page</div>
        <div dsDropdownMenuItem start="folder">New folder</div>
      </ng-template>
    </ng-container>
    <button dsToggleButton size="sm" [pressed]="extended()" (pressedChange)="extended.set(!!$event)">Show label</button>
  `,
})
class FabMorphStage {
  protected readonly extended = signal(false);
}

@Component({
  selector: 'ds-stage-toggle-pop',
  imports: [DsToggleButton, DsButtonGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <button dsToggleButton start="grid" data-interaction-trigger="">Grid view</button>
    <button dsToggleButton icon="bell" label="Mute alerts"></button>
    <div dsButtonGroup aria-label="View" attached>
      <button dsToggleButton>List</button>
      <button dsToggleButton>Board</button>
    </div>
  `,
})
class TogglePopStage {}

@Component({
  selector: 'ds-stage-switch-stretch',
  imports: [DsSwitch, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div dsSwitch label="Auto save" data-interaction-trigger=""></div>
    <div dsSwitch label="Snap to grid" defaultChecked size="lg"></div>
    <div dsTheme [lang]="'ar'">
      <div dsSwitch label="حفظ تلقائي"></div>
    </div>
  `,
})
class SwitchStretchStage {}

@Component({
  selector: 'ds-stage-link-underline',
  imports: [DsLink, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <a dsLink href="#pricing" standalone data-interaction-trigger="" (click)="$event.preventDefault()">Read the pricing guide</a>
    <a dsLink href="https://example.com" standalone external>Open the help center</a>
    <div dsTheme [lang]="'ar'">
      <a dsLink href="#pricing" standalone (click)="$event.preventDefault()">دليل الأسعار</a>
    </div>
  `,
})
class LinkUnderlineStage {}

/** Live stages by interaction id. */
export const stages: Record<string, Type<unknown>> = {
  'button-press': ButtonPressStage,
  'segment-press': SegmentPressStage,
  'button-loading': ButtonLoadingStage,
  'copy-swap': CopySwapStage,
  'button-nudge': ButtonNudgeStage,
  'close-turn': CloseTurnStage,
  'split-chevron': SplitChevronStage,
  'fab-morph': FabMorphStage,
  'toggle-pop': TogglePopStage,
  'switch-stretch': SwitchStretchStage,
  'link-underline': LinkUnderlineStage,
};
