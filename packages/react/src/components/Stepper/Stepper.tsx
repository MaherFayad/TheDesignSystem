'use client';
// Stepper: the steps of a process and where the user is. An ordered list.
// A step the user may move to renders its title as a system Button (or, with
// `href`, a link through Button asChild); every other step is plain text.
//
// No source: designed from the dials table in PLAN.md 3.7 and the nearest
// components in this repo (Button for the step action, Field for the state
// colors). The state logic is `packages/shared/src/stepper.ts`.
//
// Decisions:
// - The root is the `<ol>` itself, so the anatomy needs no list part.
// - aria-current="step" sits on the current step's `<li>`. The current step
//   is never a button: there is nowhere to go.
// - Complete shows a check, invalid a danger glyph, so state is never color
//   alone (WCAG 1.4.1). The indicator is hidden from assistive tech; hidden
//   words in the `status` part say complete, has errors or unavailable.
// - The list number is read by the screen reader from the `<ol>`, so the
//   indicator number is not read twice.
// - Vertical on narrow screens: a horizontal stepper lays out as vertical
//   under breakpoint.phone, in CSS. data-orientation keeps the prop value.
// - Motion, interaction "stepper-travel" (order 1.22, proposed): when the
//   current step changes, a ring (the indicator's ::after, drawn only while
//   it travels) slides from the old current indicator to the new one, in
//   the direction of the change, stretched along the way on the snappy
//   spring (react/src/internal/indicator.ts), and fades as it lands; the
//   new current indicator pops from scale.anticipate past rest, and the
//   connector fill grows or shrinks on the soft spring (CSS). No DOM is
//   added.
import { useCallback, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode, type Ref } from 'react';
import { Icon } from '@the-system/icons/react';
import {
  canGoTo,
  createStepperState,
  stepStatus,
  type Size,
  type StepperMode,
  type StepStatus,
} from '@the-system/shared';
import { useTheme } from '../../theme';
import { Button } from '../Button';
import { followIndicator, popIn, useIndicatorTrack } from '../../internal/indicator';
import { useMotion } from '../../internal/motion';

export type StepperSize = Extract<Size, 'sm' | 'md'>;
export type StepperOrientation = 'horizontal' | 'vertical';
export type { StepperMode, StepStatus };

export interface StepperStep {
  /** The step name. Short, a noun: Account, Address, Review. */
  title: ReactNode;
  /** One line under the title. */
  description?: ReactNode;
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

const defaultLabels: Record<'en' | 'ar', StepperLabels> = {
  en: { list: 'Steps', current: 'current step', complete: 'complete', invalid: 'has errors', disabled: 'unavailable' },
  ar: { list: 'الخطوات', current: 'الخطوة الحالية', complete: 'مكتملة', invalid: 'فيها أخطاء', disabled: 'غير متاحة' },
};

export interface StepperProps extends Omit<ComponentProps<'ol'>, 'title' | 'onChange' | 'ref'> {
  steps: readonly StepperStep[];
  /** The index of the current step, from 0. Controlled. */
  current?: number;
  /** The first current step when `current` is not passed. Default 0. */
  defaultCurrent?: number;
  /** Indexes of the complete steps. Default every step before the current one. */
  completed?: readonly number[];
  /**
   * linear: a step after the current one may be reached only when every
   * step before it is complete. free: any step may be reached. Default linear.
   */
  mode?: StepperMode;
  /**
   * Called with the index when the user picks a step. When it is passed, or
   * a step has href, every step the user may reach renders as an action.
   */
  onStepSelect?: (index: number) => void;
  /** Default horizontal. A horizontal stepper turns vertical under breakpoint.phone. */
  orientation?: StepperOrientation;
  /** The indicator and text size. Default md. */
  size?: StepperSize;
  /** The hidden words and the list name. Defaults follow the Theme language. */
  labels?: Partial<StepperLabels>;
  ref?: Ref<HTMLOListElement>;
}

function hasContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '';
}

/** Shows the steps of a process: complete with a check, the current one marked, the rest upcoming. */
export function Stepper({
  steps,
  current: currentProp,
  defaultCurrent = 0,
  completed,
  mode = 'linear',
  onStepSelect,
  orientation = 'horizontal',
  size = 'md',
  labels: labelsProp,
  ref,
  ...rest
}: StepperProps) {
  const { lang } = useTheme();
  const labels = { ...defaultLabels[lang === 'ar' ? 'ar' : 'en'], ...labelsProp };
  const [own, setOwn] = useState(defaultCurrent);
  const count = steps.length;
  const disabled = steps.flatMap((s, i) => (s.disabled ? [i] : []));
  const base = createStepperState({ count: Math.max(count, 1), current: currentProp ?? own, disabled, mode });
  // The furthest step reached. Without a completed prop, every step before it
  // stays complete, so going back never loses progress.
  const [furthest, setFurthest] = useState(base.current);
  if (base.current > furthest) setFurthest(base.current);
  const reached = Math.max(furthest, base.current);
  const state = createStepperState({
    count: base.count,
    current: base.current,
    completed: completed ?? Array.from({ length: reached }, (_, i) => i),
    disabled,
    mode,
  });

  const motion = useMotion();
  const track = useIndicatorTrack();
  const rootRef = useRef<HTMLOListElement | null>(null);
  const setRootRef = useCallback(
    (node: HTMLOListElement | null) => {
      rootRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  useLayoutEffect(() => {
    const root = rootRef.current;
    const indicator = root?.querySelector(':scope > [data-part="step"][data-state="current"] > [data-part="indicator"]');
    if (!root || !indicator) {
      track.key = null;
      return;
    }
    const mode = motion.mode('stepper-travel');
    const moved = followIndicator(track, String(base.current), { el: indicator, pseudo: '::after' }, { mode, anchor: root, ghost: true });
    if (moved) popIn(indicator, mode);
  });

  const select = (index: number) => {
    if (currentProp === undefined) setOwn(index);
    onStepSelect?.(index);
  };

  return (
    <ol
      aria-label={rest['aria-labelledby'] ? undefined : labels.list}
      {...rest}
      ref={setRootRef}
      data-ds="stepper"
      data-size={size}
      data-orientation={orientation}
    >
      {steps.map((step, index) => {
        const status: StepStatus = stepStatus(state, index);
        const reachable = status !== 'current' && canGoTo(state, index);
        const interactive = reachable && (onStepSelect !== undefined || step.href !== undefined);
        const words = [
          status === 'current' ? labels.current : undefined,
          status === 'complete' ? labels.complete : undefined,
          step.invalid ? labels.invalid : undefined,
          step.disabled ? labels.disabled : undefined,
        ].filter(Boolean);
        const statusPart =
          words.length > 0 ? (
            <span data-part="status">
              {lang === 'ar' ? '، ' : ', '}
              {words.join(lang === 'ar' ? '، ' : ', ')}
            </span>
          ) : null;

        let title: ReactNode;
        if (interactive) {
          // A link step follows its href after onStepSelect runs.
          const onClick = () => select(index);
          title = step.href !== undefined ? (
            <Button asChild data-part="title" emphasis="ghost" size="xs" wrap onClick={onClick}>
              <a href={step.href}>
                {step.title}
                {statusPart}
              </a>
            </Button>
          ) : (
            <Button data-part="title" emphasis="ghost" size="xs" wrap onClick={onClick}>
              {step.title}
              {statusPart}
            </Button>
          );
        } else {
          title = (
            <span data-part="title">
              {step.title}
              {statusPart}
            </span>
          );
        }

        return (
          <li
            key={step.id ?? index}
            data-part="step"
            data-state={status}
            data-invalid={step.invalid ? '' : undefined}
            data-disabled={step.disabled ? '' : undefined}
            aria-current={status === 'current' ? 'step' : undefined}
          >
            <span data-part="indicator" aria-hidden="true">
              {step.invalid ? (
                <Icon name="danger" size="md" />
              ) : status === 'complete' ? (
                <Icon name="check" size="md" />
              ) : (
                index + 1
              )}
            </span>
            {title}
            {hasContent(step.description) && <span data-part="description">{step.description}</span>}
            {index < count - 1 && <span data-part="connector" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
