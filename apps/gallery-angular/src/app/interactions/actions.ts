// Stages of the Angular /interactions page for the actions family (orders
// 1.21, 1.22 and 1.23), the twin of
// apps/gallery-react/src/interactions/actions.tsx. One standalone component
// per interaction id. Each stage marks the control that plays it with
// data-interaction-trigger, so the page's replay control can press it again.
// A stage that shows a row wraps it in data-stage-region with React's inline
// style, so the recorder's crop holds all of it. Same copy as React. Each
// host is display contents, so the controls sit in the stage's flex row as
// React's fragments do. The toggle-pop and switch-stretch stages here are
// superseded by toggles.ts, which the page spreads after this map.
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal, type Type } from '@angular/core';
import {
  type ButtonResult,
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

/** React's Row: a region the recorder crops whole, with the same inline style. */
const ROW = 'display: flex; flex-wrap: wrap; gap: 12px; align-items: center; padding: 8px;';

@Component({
  selector: 'ds-stage-button-press',
  imports: [DsButton, DsIconButton, DsToggleButton, DsCloseButton, DsFloatingActionButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div data-stage-region="" style="${ROW}">
      <button dsButton size="sm" data-stage-press="">Save draft</button>
      <button dsButton data-stage-press="">Save draft</button>
      <button dsButton size="lg" data-stage-press="" data-interaction-trigger="">Save draft</button>
      <button dsButton size="lg" tone="accent" emphasis="solid" start="plus" data-stage-press="">Add member</button>
      <button dsIconButton icon="copy" label="Copy layer"></button>
      <button dsToggleButton icon="grid" label="Grid view"></button>
      <button dsCloseButton label="Close panel"></button>
    </div>
  `,
})
class ButtonPressStage {}

@Component({
  selector: 'ds-stage-button-glow',
  imports: [DsButton, DsFloatingActionButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div data-stage-region="" style="${ROW}">
      <button dsButton size="lg" tone="accent" emphasis="solid" start="upload" data-interaction-trigger="">Publish the release notes</button>
      <button dsFloatingActionButton icon="plus" label="Create board" position="static" size="md"></button>
    </div>
  `,
})
class ButtonGlowStage {}

@Component({
  selector: 'ds-stage-segment-press',
  imports: [DsButton, DsButtonGroup, DsSplitButton, DsSplitButtonMenu, DsDropdownMenuItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div data-stage-region="" style="${ROW}">
      <div dsButtonGroup aria-label="Text alignment" attached>
        <button dsButton data-interaction-trigger="" data-stage-press="">Start</button>
        <button dsButton data-stage-press="">Center</button>
        <button dsButton data-stage-press="">End</button>
      </div>
      <div dsSplitButton label="Publish page" menuLabel="More publish options">
        <ng-template dsSplitButtonMenu>
          <div dsDropdownMenuItem start="clock">Schedule publish</div>
          <div dsDropdownMenuItem start="file">Save as draft</div>
        </ng-template>
      </div>
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

const resultWords = {
  en: { label: 'Save changes', loading: 'Saving', success: 'Saved', error: 'Could not save' },
  ar: { label: 'حفظ التغييرات', loading: 'جار الحفظ', success: 'تم الحفظ', error: 'تعذر الحفظ' },
} as const;

/**
 * The whole state machine of an action: rest, press, loading, then a result
 * that holds for delay.feedback and goes back. Presses take turns between a
 * success and an error, so both endings can be seen. As React's ResultStage.
 */
@Component({
  selector: 'ds-stage-result-button',
  imports: [DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <button
      dsButton
      tone="accent"
      emphasis="solid"
      size="lg"
      [loading]="loading()"
      [loadingLabel]="words().loading"
      [result]="result()"
      [resultLabel]="result() === 'error' ? words().error : words().success"
      [attr.data-interaction-trigger]="lang() === 'en' ? '' : null"
      (click)="run()"
    >
      {{ words().label }}
    </button>
  `,
})
class ResultButton {
  readonly lang = input<'en' | 'ar'>('en');
  protected readonly words = computed(() => resultWords[this.lang()]);
  protected readonly loading = signal(false);
  protected readonly result = signal<ButtonResult | undefined>(undefined);
  private turn = 0;
  private readonly timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach(clearTimeout));
  }

  protected run(): void {
    if (this.loading() || this.result()) return;
    const ending: ButtonResult = this.turn % 2 === 0 ? 'success' : 'error';
    this.turn += 1;
    this.loading.set(true);
    // The stand in action: it ends after a moment, then the result holds for delay.feedback, as the React stage.
    this.timers.push(
      setTimeout(() => {
        this.loading.set(false);
        this.result.set(ending);
      }, 900),
    );
    this.timers.push(setTimeout(() => this.result.set(undefined), 900 + 2000));
  }
}

@Component({
  selector: 'ds-stage-button-result',
  imports: [ResultButton, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div data-stage-region="" style="${ROW}">
      <ds-stage-result-button />
      <div dsTheme [lang]="'ar'" [dir]="'rtl'">
        <ds-stage-result-button lang="ar" />
      </div>
    </div>
  `,
})
class ButtonResultStage {}

@Component({
  selector: 'ds-stage-copy-swap',
  imports: [DsCopyButton, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div data-stage-region="" style="${ROW}">
      <button dsCopyButton value="https://the-system.dev/r/button" label="Copy link" emphasis="soft" data-interaction-trigger=""></button>
      <button dsCopyButton value="npm install @the-system/react" label="Copy command"></button>
      <div dsTheme [lang]="'ar'" [dir]="'rtl'">
        <button dsCopyButton value="https://the-system.dev/r/button" label="نسخ الرابط" emphasis="soft"></button>
      </div>
    </div>
  `,
})
class CopySwapStage {}

@Component({
  selector: 'ds-stage-copy-bubble',
  imports: [DsCopyButton, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div data-stage-region="" style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center; padding: 40px;">
      <button dsCopyButton value="npm install @the-system/react" label="Copy command" iconOnly emphasis="soft" data-interaction-trigger=""></button>
      <button dsCopyButton value="npm install @the-system/react" label="Copy command" iconOnly size="lg"></button>
      <div dsTheme [lang]="'ar'" [dir]="'rtl'">
        <button dsCopyButton value="npm install @the-system/react" label="نسخ الأمر" iconOnly></button>
      </div>
    </div>
  `,
})
class CopyBubbleStage {}

@Component({
  selector: 'ds-stage-button-nudge',
  imports: [DsButton, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <button dsButton end="arrow-forward" data-interaction-trigger="">Next step</button>
    <div dsTheme [lang]="'ar'" [dir]="'rtl'">
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
    <div data-stage-region="" style="${ROW}">
      <button dsCloseButton label="Close panel" size="lg" data-interaction-trigger=""></button>
      <button dsCloseButton label="Close panel"></button>
      <button dsCloseButton label="Close panel" size="sm"></button>
    </div>
  `,
})
class CloseTurnStage {}

@Component({
  selector: 'ds-stage-split-chevron',
  imports: [DsSplitButton, DsSplitButtonMenu, DsDropdownMenuItem, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div data-stage-region="" [attr.style]="region">
      <div dsSplitButton label="Publish page" menuLabel="More publish options" tone="accent" emphasis="solid">
        <ng-template dsSplitButtonMenu>
          <div dsDropdownMenuItem start="clock">Schedule publish</div>
          <div dsDropdownMenuItem start="upload">Publish to staging</div>
          <div dsDropdownMenuItem start="file">Save as draft</div>
        </ng-template>
      </div>
      <div dsTheme [lang]="'ar'" [dir]="'rtl'">
        <div dsSplitButton label="نشر الصفحة" menuLabel="خيارات النشر الأخرى">
          <ng-template dsSplitButtonMenu>
            <div dsDropdownMenuItem start="clock">جدولة النشر</div>
            <div dsDropdownMenuItem start="file">الحفظ كمسودة</div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
})
class SplitChevronStage {
  /** React's inline style, set as the attribute so the browser keeps padding-block-end apart, as React writes it. */
  protected readonly region = 'display: flex; gap: 12px; align-items: flex-start; padding: 8px; padding-block-end: 140px;';

  constructor() {
    // The interaction is the chevron: the menu button of the first SplitButton is the stage's trigger, as React.
    const box = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    afterNextRender(() => box.querySelector('button[aria-haspopup]')?.setAttribute('data-interaction-trigger', ''));
  }
}

/** A floating action button that opens a menu and can show its label. */
@Component({
  selector: 'ds-stage-fab-morph',
  imports: [DsFloatingActionButton, DsDropdownMenu, DsDropdownMenuTrigger, DsDropdownMenuContent, DsDropdownMenuItem, DsToggleButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div data-stage-region="" style="display: flex; gap: 16px; align-items: center; padding: 8px;">
      <ng-container dsDropdownMenu>
        <button dsFloatingActionButton dsDropdownMenuTrigger icon="plus" label="Create item" position="static" [extended]="extended()" data-interaction-trigger=""></button>
        <ng-template dsDropdownMenuContent align="end">
          <div dsDropdownMenuItem start="file">New page</div>
          <div dsDropdownMenuItem start="folder">New folder</div>
        </ng-template>
      </ng-container>
      <button dsToggleButton size="sm" [pressed]="extended()" (pressedChange)="extended.set(!!$event)" data-stage-extend="">Show label</button>
    </div>
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
    <div data-stage-region="" style="${ROW}">
      <a dsLink href="#pricing" standalone data-interaction-trigger="" (click)="$event.preventDefault()">Read the pricing guide</a>
      <a dsLink href="https://example.com" standalone external>Open the help center</a>
      <div dsTheme [lang]="'ar'" [dir]="'rtl'">
        <a dsLink href="#pricing" standalone (click)="$event.preventDefault()" data-stage-ar="">دليل الأسعار</a>
      </div>
    </div>
  `,
})
class LinkUnderlineStage {}

/** Live stages by interaction id. */
export const stages: Record<string, Type<unknown>> = {
  'button-press': ButtonPressStage,
  'button-glow': ButtonGlowStage,
  'segment-press': SegmentPressStage,
  'button-loading': ButtonLoadingStage,
  'button-result': ButtonResultStage,
  'copy-swap': CopySwapStage,
  'copy-bubble': CopyBubbleStage,
  'button-nudge': ButtonNudgeStage,
  'close-turn': CloseTurnStage,
  'split-chevron': SplitChevronStage,
  'fab-morph': FabMorphStage,
  'toggle-pop': TogglePopStage,
  'switch-stretch': SwitchStretchStage,
  'link-underline': LinkUnderlineStage,
};
