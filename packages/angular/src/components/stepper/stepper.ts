// Stepper: the steps of a process and where the user is. The twin of
// packages/react/src/components/Stepper/Stepper.tsx. The host is the
// ordered list itself.
//
//   <ol dsStepper [steps]="steps" [current]="current()" [onStepSelect]="go" aria-label="Checkout steps"></ol>
//
// A step the user may move to renders its title as the system Button
// (button[dsButton], or a[dsButton] when the step has href); every other
// step is plain text. aria-current="step" sits on the current step's li.
// The state logic is packages/shared/src/stepper.ts.
//
// Motion, interaction "stepper-travel" (order 1.22, proposed): when the
// current step changes, a ring (the indicator's ::after, drawn only while
// it travels) slides from the old current indicator to the new one, in
// the direction of the change, stretched along the way on the snappy
// spring (internal/indicator.ts), and fades as it lands; the new current
// indicator pops from scale.anticipate past rest, and the connector fill
// grows or shrinks on the soft spring (CSS). No DOM is added. It plays
// from afterRenderEffect, after the steps show the new state. Round 3
// (order 1.23): a step that turns complete draws its check with
// stroke-dashoffset, short stroke first, over duration.spring-soft on
// ease.out (full mode only), as React's drawCheck.
//
// Names that differ from React: `onStepSelect` is a function input, not an
// output, because the stepper must know whether it is passed (steps become
// actions only then, as in React). `title` and `description` of a step take
// a string or a TemplateRef.
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, afterRenderEffect, computed, effect, inject, input, signal, untracked, type TemplateRef } from '@angular/core';
import { DsIcon } from '@the-system/icons/angular';
import { canGoTo, createStepperState, stepStatus, type Size, type StepperMode, type StepStatus } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { readDuration, readEasing, type PatternMode } from '@the-system/motion';
import { createTrack, followIndicator, popIn } from '../../internal/indicator';
import { injectMotion } from '../../internal/motion';
import { DsThemeService } from '../../theme/theme';
import { DsButton } from '../button/button';

/** The length of the system check path (M20 6 9 17l-5-5) in its 24 unit box, rounded up. */
const CHECK_LENGTH = 24;

/**
 * Round 3: draws a check path from its end (the short stroke) to its start
 * with stroke-dashoffset, on the soft spring. Full mode only; the check is
 * whole at once otherwise, and whole again when the animation ends.
 */
export function drawCheck(path: Element | null | undefined, mode: PatternMode): Animation | null {
  if (!path || mode !== 'full' || typeof path.animate !== 'function') return null;
  const dash = `${CHECK_LENGTH} ${CHECK_LENGTH}`;
  return path.animate(
    [
      { strokeDasharray: dash, strokeDashoffset: -CHECK_LENGTH },
      { strokeDasharray: dash, strokeDashoffset: 0 },
    ],
    { duration: readDuration(path, 'duration.spring-soft'), easing: readEasing(path, 'ease.out'), id: 'ds-motion:stepper-check' },
  );
}

export type StepperSize = Extract<Size, 'sm' | 'md'>;
export type StepperOrientation = 'horizontal' | 'vertical';
export type { StepperMode, StepStatus };
/** A node prop in Angular: text, or a template. */
export type StepperText = string | TemplateRef<unknown>;

export interface StepperStep {
  /** The step name. Short, a noun: Account, Address, Review. */
  title: StepperText;
  /** One line under the title. */
  description?: StepperText;
  /** The step has errors to fix. Shows the danger glyph and says so. */
  invalid?: boolean;
  /** The step cannot be reached. It is skipped by next and back. */
  disabled?: boolean;
  /** When the step may be reached, it renders as a link to this address. */
  href?: string;
  /** A stable key. Default the index. */
  id?: string;
}

/** The hidden words of each state, and the list name. */
export interface StepperLabels {
  /** The accessible name of the list. Default "Steps", in Arabic "الخطوات". */
  list: string;
  /** Said after the current step's title. */
  current: string;
  complete: string;
  invalid: string;
  disabled: string;
}

export const stepperLabels: Record<'en' | 'ar', StepperLabels> = {
  en: { list: 'Steps', current: 'current step', complete: 'complete', invalid: 'has errors', disabled: 'unavailable' },
  ar: { list: 'الخطوات', current: 'الخطوة الحالية', complete: 'مكتملة', invalid: 'فيها أخطاء', disabled: 'غير متاحة' },
};

interface StepView {
  key: string | number;
  index: number;
  step: StepperStep;
  status: StepStatus;
  interactive: boolean;
  statusWords: string;
}

@Component({
  selector: 'ol[dsStepper]',
  exportAs: 'dsStepper',
  imports: [NgTemplateOutlet, DsIcon, DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'stepper',
    '[attr.aria-label]': 'ariaLabel() ?? (ariaLabelledby() ? null : words().list)',
    '[attr.aria-labelledby]': 'ariaLabelledby() ?? null',
    '[attr.data-size]': 'size()',
    '[attr.data-orientation]': 'orientation()',
  },
  template: `
    @for (v of view(); track v.key) {
      <li data-part="step" [attr.data-state]="v.status" [attr.data-invalid]="v.step.invalid ? '' : null"
        [attr.data-disabled]="v.step.disabled ? '' : null" [attr.aria-current]="v.status === 'current' ? 'step' : null">
        <span data-part="indicator" aria-hidden="true">@if (v.step.invalid) {<svg dsIcon name="danger" size="md"></svg>} @else if (v.status === 'complete') {<svg dsIcon name="check" size="md"></svg>} @else {{{ v.index + 1 }}}</span>
        @if (v.interactive) {
          @if (v.step.href !== undefined) {
            <a dsButton data-part="title" emphasis="ghost" size="xs" wrap [href]="v.step.href" (click)="select(v.index)"><ng-container *ngTemplateOutlet="title; context: { $implicit: v }" /></a>
          } @else {
            <button dsButton data-part="title" emphasis="ghost" size="xs" wrap (click)="select(v.index)"><ng-container *ngTemplateOutlet="title; context: { $implicit: v }" /></button>
          }
        } @else {
          <span data-part="title"><ng-container *ngTemplateOutlet="title; context: { $implicit: v }" /></span>
        }
        @if (hasContent(v.step.description)) {
          <span data-part="description"><ng-container *ngTemplateOutlet="text; context: { $implicit: v.step.description }" /></span>
        }
        @if (v.index < view().length - 1) {
          <span data-part="connector" aria-hidden="true"></span>
        }
      </li>
    }
    <ng-template #title let-v><ng-container *ngTemplateOutlet="text; context: { $implicit: v.step.title }" />@if (v.statusWords !== '') {<span data-part="status"><ng-container>{{ separator() }}</ng-container>{{ v.statusWords }}</span>}</ng-template>
    <ng-template #text let-value>@if (isText(value)) {{{ value }}} @else {<ng-container [ngTemplateOutlet]="value" />}</ng-template>
  `,
})
export class DsStepper {
  readonly steps = input.required<readonly StepperStep[]>();
  /** The index of the current step, from 0. Controlled: a pick does not change it, onStepSelect does. */
  readonly current = input<number | undefined>(undefined);
  /** The first current step when `current` is not set. Default 0. */
  readonly defaultCurrent = input(0);
  /** Indexes of the complete steps. Default every step before the furthest one reached. */
  readonly completed = input<readonly number[] | undefined>(undefined);
  /** linear: a later step may be reached only when every step before it is complete. free: any step. Default linear. */
  readonly mode = input<StepperMode>('linear');
  /** Called with the index when the user picks a step. When it is set, or a step has href, every reachable step is an action. */
  readonly onStepSelect = input<((index: number) => void) | undefined>(undefined);
  /** Default horizontal. A horizontal stepper turns vertical under breakpoint.phone, in CSS. */
  readonly orientation = input<StepperOrientation>('horizontal');
  /** The indicator and text size. Default md. */
  readonly size = input<StepperSize>('md');
  /** The hidden words and the list name. Defaults follow the theme language. */
  readonly labels = input<Partial<StepperLabels> | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  private readonly theme = inject(DsThemeService);
  private readonly ar = computed(() => this.theme.value().lang === 'ar');
  protected readonly words = computed<StepperLabels>(() => ({ ...stepperLabels[this.ar() ? 'ar' : 'en'], ...this.labels() }));
  protected readonly separator = computed(() => (this.ar() ? '، ' : ', '));
  private readonly own = signal<number | undefined>(undefined);
  /** defaultCurrent is read once, at the first use, as React's useState. */
  private seeded: number | undefined;
  private firstCurrent(): number {
    this.seeded ??= this.defaultCurrent();
    return this.seeded;
  }
  /** The furthest step reached. Without a completed input, every step before it stays complete, so going back never loses progress. */
  private readonly furthest = signal(0);

  private readonly disabledIndexes = computed(() => this.steps().flatMap((s, i) => (s.disabled ? [i] : [])));
  private readonly base = computed(() =>
    createStepperState({
      count: Math.max(this.steps().length, 1),
      current: this.current() ?? this.own() ?? untracked(() => this.firstCurrent()),
      disabled: this.disabledIndexes(),
      mode: this.mode(),
    }),
  );
  private readonly state = computed(() => {
    const base = this.base();
    const reached = Math.max(this.furthest(), base.current);
    return createStepperState({
      count: base.count,
      current: base.current,
      completed: this.completed() ?? Array.from({ length: reached }, (_, i) => i),
      disabled: this.disabledIndexes(),
      mode: this.mode(),
    });
  });

  protected readonly view = computed<StepView[]>(() => {
    const state = this.state();
    const words = this.words();
    const join = this.separator();
    const canSelect = this.onStepSelect() !== undefined;
    return this.steps().map((step, index) => {
      const status = stepStatus(state, index);
      const reachable = status !== 'current' && canGoTo(state, index);
      const list = [
        status === 'current' ? words.current : undefined,
        status === 'complete' ? words.complete : undefined,
        step.invalid ? words.invalid : undefined,
        step.disabled ? words.disabled : undefined,
      ].filter(Boolean);
      return {
        key: step.id ?? index,
        index,
        step,
        status,
        interactive: reachable && (canSelect || step.href !== undefined),
        statusWords: list.join(join),
      };
    });
  });

  protected readonly isText = (v: unknown): v is string => typeof v === 'string';
  protected readonly hasContent = (v: unknown): boolean => v !== undefined && v !== null && v !== '';

  private readonly motion = injectMotion();
  /** Where the ring was last drawn, so the next change travels from there. */
  private readonly track = createTrack();

  constructor() {
    const root = consumeHostAttributes([
      'dsStepper', 'steps', 'current', 'defaultCurrent', 'completed', 'mode', 'onStepSelect', 'orientation', 'size', 'labels', 'aria-label', 'aria-labelledby',
    ]);
    // Interaction "stepper-travel", after every render of the steps (React runs it after every commit).
    afterRenderEffect(() => {
      const current = this.base().current;
      this.view();
      untracked(() => {
        const indicator = root.querySelector(':scope > [data-part="step"][data-state="current"] > [data-part="indicator"]');
        if (!indicator) {
          this.track.key = null;
          return;
        }
        const mode = this.motion.mode('stepper-travel');
        const before = this.track.key === null ? null : Number(this.track.key);
        const moved = followIndicator(this.track, String(current), { el: indicator, pseudo: '::after' }, { mode, anchor: root, ghost: true });
        if (moved) popIn(indicator, mode);
        // Round 3: a step that turns complete draws its check, short stroke first.
        if (before !== null && current > before) {
          const steps = root.querySelectorAll(':scope > [data-part="step"]');
          for (let i = before; i < current; i++) {
            const path = steps[i]?.querySelector(':scope > [data-part="indicator"] [data-icon="check"] path');
            drawCheck(path, mode);
          }
        }
      });
    });
    // Track the furthest step reached, as the React state that only grows.
    effect(() => {
      const current = this.base().current;
      untracked(() => {
        if (current > this.furthest()) this.furthest.set(current);
      });
    });
  }

  /** A link step follows its href after onStepSelect runs. */
  protected select(index: number): void {
    if (this.current() === undefined) this.own.set(index);
    this.onStepSelect()?.(index);
  }
}
