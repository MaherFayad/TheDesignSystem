// Stages of the Angular /interactions page owned by the toggles family of the
// round 3 sync (order A-sync3), the twin of
// apps/gallery-react/src/interactions/toggles.tsx. Entries here win over an
// entry with the same id in an older family file (see page.ts). Same copy as
// React.
//
// React spreads data-interaction-trigger on the inner control of Switch,
// Checkbox and RadioGroupItem (the Radix root); an Angular host keeps its
// attributes on the root, so those stages stamp the mark on the same inner
// element after first render, to keep the DOM the same.
import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, type Type } from '@angular/core';
import {
  DsButtonGroup,
  DsCheckbox,
  DsCheckboxGroup,
  DsRadioCard,
  DsRadioCardItem,
  DsRadioGroup,
  DsRadioGroupItem,
  DsSwitch,
  DsTheme,
  DsToggleButton,
} from '@the-system/angular';

const host = { style: 'display: contents' };
const stack = 'display: grid; gap: var(--ds-space-m); inline-size: 100%;';

/** Puts data-interaction-trigger on the first element of the stage that matches, as React renders it. */
function markTrigger(selector: string): void {
  const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  afterNextRender(() => el.querySelector(selector)?.setAttribute('data-interaction-trigger', ''));
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
    <div dsSwitch label="Auto save"></div>
    <div dsSwitch label="Snap to grid" defaultChecked size="lg"></div>
    <div dsTheme [lang]="'ar'">
      <div dsSwitch label="حفظ تلقائي"></div>
    </div>
  `,
})
class SwitchStretchStage {
  constructor() {
    markTrigger("[data-ds='switch'] > [data-part='control']");
  }
}

@Component({
  selector: 'ds-stage-switch-drag',
  imports: [DsSwitch, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div dsSwitch label="Wi-Fi" size="lg"></div>
    <div dsTheme [lang]="'ar'">
      <div dsSwitch label="الوضع الليلي" size="lg" defaultChecked></div>
    </div>
  `,
})
class SwitchDragStage {
  constructor() {
    markTrigger("[data-ds='switch'] > [data-part='control']");
  }
}

@Component({
  selector: 'ds-stage-check-draw',
  imports: [DsCheckbox, DsCheckboxGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
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
  selector: 'ds-stage-check-mixed',
  imports: [DsCheckbox, DsCheckboxGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <fieldset dsCheckboxGroup legend="Export layers" selectAll="All layers">
      <div dsCheckbox value="frames" label="Frames"></div>
      <div dsCheckbox value="text" label="Text"></div>
      <div dsCheckbox value="images" label="Images"></div>
    </fieldset>
  `,
})
class CheckMixedStage {
  constructor() {
    markTrigger("[data-ds='checkbox']:not([data-part='select-all']) > [data-part='control']");
  }
}

@Component({
  selector: 'ds-stage-radio-pop',
  imports: [DsRadioGroup, DsRadioGroupItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
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
  host,
  template: `
    <div dsRadioCard aria-label="Plan" defaultValue="team" orientation="horizontal">
      <button dsRadioCardItem value="solo" title="Solo" description="One seat" end="$12" data-interaction-trigger=""></button>
      <button dsRadioCardItem value="team" title="Team" description="Five seats" end="$48"></button>
    </div>
  `,
})
class RadioCardLiftStage {}

export const stages: Record<string, Type<unknown>> = {
  'toggle-pop': TogglePopStage,
  'switch-stretch': SwitchStretchStage,
  'switch-drag': SwitchDragStage,
  'check-draw': CheckDrawStage,
  'check-mixed': CheckMixedStage,
  'radio-pop': RadioPopStage,
  'radio-card-lift': RadioCardLiftStage,
};
