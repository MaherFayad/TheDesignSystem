// Stages of the Angular /interactions page owned by the sliders family of the
// round 3 sync (order A-sync3). Entries here win over an entry with the same
// id in an older family file (see page.ts).
//
// The twins of the slider and rating stages in
// apps/gallery-react/src/interactions/inputs.tsx, with the same copy. React
// passes `data-interaction-trigger` through Slider's rest props to the Radix
// root, the control part, so the replay control and the timing sampler press
// the track. The Angular host is the slider root, so each slider stage moves
// the marker to its control part after the first render, and the DOM hook is
// the same in both galleries.
import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, type Type } from '@angular/core';
import { DsButton, DsRangeSlider, DsRating, DsSlider } from '@the-system/angular';

const host = { style: 'display: contents' };
const stack = 'display: grid; gap: var(--ds-space-m); inline-size: 100%;';

/** The stage around a trigger. */
const stageOf = (el: EventTarget | null): HTMLElement | null => (el instanceof Element ? el.closest('[data-interaction-stage]') : null);

/** Puts the trigger marker on the control part of the marked slider, where React's rest props land. */
function markControl(): void {
  const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  afterNextRender(() => {
    const root = el.querySelector('[data-slider-trigger]');
    root?.removeAttribute('data-slider-trigger');
    root?.querySelector(':scope > [data-part="control"]')?.setAttribute('data-interaction-trigger', '');
  });
}

@Component({
  selector: 'ds-stage-slider-pull',
  imports: [DsSlider, DsRangeSlider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div [style]="stack">
      <div dsSlider label="Opacity" unit="%" [defaultValue]="40" data-slider-trigger=""></div>
      <div dsRangeSlider label="Price" unit="SAR" [min]="0" [max]="1000" [step]="50" [defaultValue]="[200, 800]" [thumbLabels]="['Minimum price', 'Maximum price']"></div>
    </div>
  `,
})
class SliderPullStage {
  protected readonly stack = stack;
  constructor() {
    markControl();
  }
}

@Component({
  selector: 'ds-stage-slider-bubble',
  imports: [DsSlider, DsRangeSlider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div [style]="stack">
      <div dsSlider label="Zoom" unit="%" [min]="10" [max]="400" [defaultValue]="120" data-slider-trigger=""></div>
      <div dsRangeSlider label="Budget" unit="SAR" [min]="0" [max]="5000" [step]="10" [defaultValue]="[900, 3200]" [thumbLabels]="['Lowest budget', 'Highest budget']"></div>
    </div>
  `,
})
class SliderBubbleStage {
  protected readonly stack = stack;
  constructor() {
    markControl();
  }
}

@Component({
  selector: 'ds-stage-slider-fill',
  imports: [DsSlider, DsRangeSlider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div [style]="stack">
      <div dsSlider label="Opacity" unit="%" [defaultValue]="20" data-slider-trigger=""></div>
      <div dsRangeSlider label="Price" unit="SAR" [min]="0" [max]="1000" [step]="50" [defaultValue]="[200, 800]" [thumbLabels]="['Minimum price', 'Maximum price']"></div>
    </div>
  `,
})
class SliderFillStage {
  protected readonly stack = stack;
  constructor() {
    markControl();
  }
}

@Component({
  selector: 'ds-stage-slider-rubber-band',
  imports: [DsSlider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div [style]="stack">
      <div dsSlider label="Volume" unit="%" [defaultValue]="80" data-slider-trigger=""></div>
    </div>
  `,
})
class SliderRubberBandStage {
  protected readonly stack = stack;
  constructor() {
    markControl();
  }
}

@Component({
  selector: 'ds-stage-slider-nudge',
  imports: [DsSlider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div style="inline-size: 100%;">
      <div dsSlider label="Volume" unit="%" [defaultValue]="100" data-slider-trigger=""></div>
    </div>
  `,
})
class SliderNudgeStage {
  constructor() {
    markControl();
  }
}

@Component({
  selector: 'ds-stage-rating-fill',
  imports: [DsButton, DsRating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div dsRating aria-label="Rate this template" [defaultValue]="2"></div>
    <button dsButton size="sm" emphasis="soft" data-interaction-trigger="" (click)="pick($event)">Pick a score</button>
  `,
})
class RatingFillStage {
  protected pick(event: Event): void {
    const stage = stageOf(event.currentTarget);
    if (!stage) return;
    const checked = stage.querySelector('[role="radio"][aria-checked="true"]');
    const stars = [...stage.querySelectorAll<HTMLElement>('[role="radio"]')];
    stars[stars.indexOf(checked as HTMLElement) === 4 ? 1 : 4]?.click();
  }
}

/** The sweep needs a pointer over the stars: the recorder's drive hovers across them. */
@Component({
  selector: 'ds-stage-rating-preview',
  imports: [DsRating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `<div dsRating aria-label="Rate this template" [defaultValue]="1" data-interaction-trigger=""></div>`,
})
class RatingPreviewStage {}

export const stages: Record<string, Type<unknown>> = {
  'slider-pull': SliderPullStage,
  'slider-bubble': SliderBubbleStage,
  'slider-fill': SliderFillStage,
  'slider-rubber-band': SliderRubberBandStage,
  'slider-nudge': SliderNudgeStage,
  'rating-fill': RatingFillStage,
  'rating-preview': RatingPreviewStage,
};
