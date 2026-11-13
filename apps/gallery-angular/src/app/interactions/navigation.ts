// Stages of the Angular /interactions page for the navigation family (orders
// 1.21 to 1.23), the twin of apps/gallery-react/src/interactions/navigation.tsx.
// One standalone component per interaction id. Each stage marks the control
// that plays it with data-interaction-trigger, so the page's replay control
// can press it again. Same copy as React.
//
// Components the Angular port does not have yet (Tabs, Navbar, Sidebar,
// Rail, Breadcrumbs, Pagination, TableOfContents, TabBar, Dock, Toolbar,
// LanguageSwitch, SkipLink) are left out of a stage, and an id with none of
// its components ported has no stage.
import { ChangeDetectionStrategy, Component, signal, type Type } from '@angular/core';
import { DS_SEGMENTED_CONTROL, DS_TOGGLE_GROUP, DsButton, DsStepper, type ToggleGroupValue } from '@the-system/angular';

const rangeValues = ['day', 'week', 'month'] as const;
const alignValues = ['start', 'center', 'end'] as const;

@Component({
  selector: 'gallery-stage-tab-slide',
  imports: [DS_SEGMENTED_CONTROL, DS_TOGGLE_GROUP, DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: grid; gap: var(--ds-space-l); justify-items: start">
      <button dsButton size="sm" emphasis="soft" end="arrow-forward" data-interaction-trigger="" (click)="play()">Move every pill</button>
      <!-- Round 3: the crop of the recorder holds the pill lists, where the ink crosses (React also has the soft Tabs here). -->
      <div style="display: grid; gap: var(--ds-space-l); justify-items: start" data-stage-region="">
        <div dsSegmentedControl aria-label="Range" [(value)]="range">
          <button dsSegmentedControlItem value="day">Day</button>
          <button dsSegmentedControlItem value="week">Week</button>
          <button dsSegmentedControlItem value="month">Month</button>
        </div>
        <div dsToggleGroup type="single" aria-label="Text alignment" [value]="align()" (valueChange)="setAlign($event)" attached>
          <button dsToggleGroupItem value="start">Start</button>
          <button dsToggleGroupItem value="center">Center</button>
          <button dsToggleGroupItem value="end">End</button>
        </div>
      </div>
    </div>
  `,
})
class TabSlide {
  private step = 0;
  protected readonly range = signal<string | undefined>('day');
  protected readonly align = signal<string>('start');

  protected play(): void {
    this.step = (this.step + 1) % 3;
    this.range.set(rangeValues[this.step]);
    this.align.set(alignValues[this.step] ?? 'start');
  }

  /** As React: only a value that is not empty is kept. */
  protected setAlign(value: ToggleGroupValue | undefined): void {
    if (typeof value === 'string' && value !== '') this.align.set(value);
  }
}

const steps = [{ title: 'Account' }, { title: 'Address' }, { title: 'Payment' }, { title: 'Review' }];

@Component({
  selector: 'gallery-stage-stepper-travel',
  imports: [DsStepper, DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: grid; gap: var(--ds-space-l); justify-items: stretch">
      <div style="display: flex; flex-wrap: wrap; gap: var(--ds-space-l); align-items: flex-start">
        <button dsButton size="sm" emphasis="soft" end="arrow-forward" data-interaction-trigger="" (click)="next()">Next step</button>
        <button dsButton size="sm" emphasis="ghost" start="arrow-back" (click)="back()">Back one step</button>
      </div>
      <ol dsStepper [steps]="steps" [current]="current()" [onStepSelect]="select" orientation="vertical"></ol>
    </div>
  `,
})
class StepperTravel {
  protected readonly steps = steps;
  protected readonly current = signal(0);
  protected readonly select = (index: number): void => this.current.set(index);

  protected next(): void {
    this.current.update((c) => (c + 1) % steps.length);
  }

  protected back(): void {
    this.current.update((c) => Math.max(0, c - 1));
  }
}

/** Live stages by interaction id. */
export const stages: Record<string, Type<unknown>> = {
  'tab-slide': TabSlide,
  'stepper-travel': StepperTravel,
};
