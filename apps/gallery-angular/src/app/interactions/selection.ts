// Stages of the Angular /interactions page for the selection family (orders
// 1.21 and 1.22), the twin of apps/gallery-react/src/interactions/selection.tsx.
// One standalone component per interaction id. Each stage marks the control
// that plays it with data-interaction-trigger, so the page's replay control
// can press it again. Same copy as React.
//
// React spreads data-interaction-trigger on the inner control of Checkbox,
// RadioGroupItem and Slider (the Radix root or button); an Angular host keeps
// its attributes on the root, so those stages stamp the mark on the same
// inner element after first render, to keep the DOM the same.
//
// No stage yet for list-stagger and chip-check-pop: List and Chip have no
// Angular port. row-glide and collection-flip leave out their List part.
import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, signal, type Type } from '@angular/core';
import {
  DsCheckbox,
  DsCheckboxGroup,
  DsCombobox,
  DsFilterBar,
  DsListBox,
  DsMultiSelect,
  DsRadioCard,
  DsRadioCardItem,
  DsRadioGroup,
  DsRadioGroupItem,
  DsRangeSlider,
  DsSelect,
  DsSlider,
  DsTagField,
} from '@the-system/angular';

const fruit = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
];

const stack = 'display: grid; gap: var(--ds-space-m); inline-size: 100%;';

/** Puts data-interaction-trigger on the first element of the stage that matches, as React renders it. */
function markTrigger(selector: string): void {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  afterNextRender(() => host.querySelector(selector)?.setAttribute('data-interaction-trigger', ''));
}

@Component({
  selector: 'ds-stage-check-draw',
  imports: [DsCheckbox, DsCheckboxGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div [attr.style]="stack">
      <div dsCheckbox label="Snap frames to the grid"></div>
      <fieldset dsCheckboxGroup legend="Notify me about" selectAll="All notifications">
        <div dsCheckbox value="comments" label="Comments"></div>
        <div dsCheckbox value="mentions" label="Mentions"></div>
        <div dsCheckbox value="invites" label="Invites"></div>
        <div dsCheckbox value="reviews" label="Reviews"></div>
      </fieldset>
    </div>
  `,
})
class CheckDrawStage {
  protected readonly stack = stack;
  constructor() {
    markTrigger("[data-ds='checkbox'] > [data-part='control']");
  }
}

@Component({
  selector: 'ds-stage-radio-pop',
  imports: [DsRadioGroup, DsRadioGroupItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div dsRadioGroup label="Export as" defaultValue="png">
      <div dsRadioGroupItem value="png" label="PNG"></div>
      <div dsRadioGroupItem value="svg" label="SVG"></div>
      <div dsRadioGroupItem value="pdf" label="PDF"></div>
    </div>
  `,
})
class RadioPopStage {
  constructor() {
    markTrigger("[role='radio']");
  }
}

@Component({
  selector: 'ds-stage-radio-card-lift',
  imports: [DsRadioCard, DsRadioCardItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div dsRadioCard aria-label="Plan" defaultValue="team" orientation="horizontal">
      <button dsRadioCardItem value="solo" title="Solo" description="One seat" end="$12" data-interaction-trigger=""></button>
      <button dsRadioCardItem value="team" title="Team" description="Five seats" end="$48"></button>
    </div>
  `,
})
class RadioCardLiftStage {}

@Component({
  selector: 'ds-stage-slider-nudge',
  imports: [DsSlider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div style="inline-size: 100%;">
      <div dsSlider label="Volume" unit="%" [defaultValue]="100"></div>
    </div>
  `,
})
class SliderNudgeStage {
  constructor() {
    markTrigger("[data-part='control']");
  }
}

@Component({
  selector: 'ds-stage-slider-pull',
  imports: [DsSlider, DsRangeSlider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div [attr.style]="stack">
      <div dsSlider label="Opacity" unit="%" [defaultValue]="40"></div>
      <div dsRangeSlider label="Price" unit="SAR" [min]="0" [max]="1000" [step]="50" [defaultValue]="[200, 800]" [thumbLabels]="['Minimum price', 'Maximum price']"></div>
    </div>
  `,
})
class SliderPullStage {
  protected readonly stack = stack;
  constructor() {
    markTrigger("[data-part='control']");
  }
}

@Component({
  selector: 'ds-stage-slider-bubble',
  imports: [DsSlider, DsRangeSlider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div [attr.style]="stack">
      <div dsSlider label="Zoom" unit="%" [min]="10" [max]="400" [defaultValue]="120"></div>
      <div dsRangeSlider label="Budget" unit="SAR" [min]="0" [max]="5000" [step]="10" [defaultValue]="[900, 3200]" [thumbLabels]="['Lowest budget', 'Highest budget']"></div>
    </div>
  `,
})
class SliderBubbleStage {
  protected readonly stack = stack;
  constructor() {
    markTrigger("[data-part='control']");
  }
}

@Component({
  selector: 'ds-stage-picker-chevron-turn',
  imports: [DsSelect, DsCombobox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div [attr.style]="stack">
      <button dsSelect aria-label="Fruit" [items]="fruit" defaultValue="apple" data-interaction-trigger=""></button>
      <div dsCombobox aria-label="Fruit search" [items]="fruit" placeholder="Find a fruit"></div>
    </div>
  `,
})
class PickerChevronTurnStage {
  protected readonly stack = stack;
  protected readonly fruit = fruit;
}

@Component({
  selector: 'ds-stage-menu-rows',
  imports: [DsSelect, DsMultiSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div [attr.style]="stack">
      <button dsSelect aria-label="Sort by" [items]="fruit" placeholder="Pick a fruit" data-interaction-trigger=""></button>
      <div dsMultiSelect aria-label="Fruit basket" [items]="fruit" [defaultValue]="['apple']"></div>
    </div>
  `,
})
class MenuRowsStage {
  protected readonly stack = stack;
  protected readonly fruit = fruit;
}

@Component({
  selector: 'ds-stage-picker-value-roll',
  imports: [DsSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<button dsSelect aria-label="Size" [items]="fruit" defaultValue="banana" data-interaction-trigger=""></button>`,
})
class PickerValueRollStage {
  protected readonly fruit = fruit;
}

@Component({
  selector: 'ds-stage-row-glide',
  imports: [DsListBox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div [attr.style]="stack">
      <div dsListBox aria-label="Fruit" [items]="items" style="inline-size: 16rem;" data-interaction-trigger=""></div>
    </div>
  `,
})
class RowGlideStage {
  protected readonly stack = stack;
  protected readonly items = fruit.slice(0, 4);
}

@Component({
  selector: 'ds-stage-collection-flip',
  imports: [DsTagField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div [attr.style]="stack">
      <div dsTagField aria-label="Tags" [defaultValue]="['Design', 'Research', 'Copy']" placeholder="Add a tag"></div>
    </div>
  `,
})
class CollectionFlipStage {
  protected readonly stack = stack;
}

@Component({
  selector: 'ds-stage-filter-count-roll',
  imports: [DsFilterBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div dsFilterBar aria-label="Files" [filters]="filters" [(value)]="value" [resultCount]="128 - value().length * 37" data-interaction-trigger=""></div>
  `,
})
class FilterCountRollStage {
  protected readonly filters = [
    { value: 'images', label: 'Images' },
    { value: 'video', label: 'Video' },
    { value: 'docs', label: 'Documents' },
  ];
  protected readonly value = signal<readonly string[]>([]);
}

/** Live stages by interaction id. */
export const stages: Record<string, Type<unknown>> = {
  'check-draw': CheckDrawStage,
  'radio-pop': RadioPopStage,
  'radio-card-lift': RadioCardLiftStage,
  'slider-nudge': SliderNudgeStage,
  'slider-pull': SliderPullStage,
  'slider-bubble': SliderBubbleStage,
  'picker-chevron-turn': PickerChevronTurnStage,
  'menu-rows': MenuRowsStage,
  'picker-value-roll': PickerValueRollStage,
  'row-glide': RowGlideStage,
  'collection-flip': CollectionFlipStage,
  'filter-count-roll': FilterCountRollStage,
};
