'use client';
// Rating: pick or show a score from 1 to 5 (or 10) as stars.
//
// Behavior: Radix RadioGroup with one star button (role radio) per score,
// as the order asks. Radix gives the roving tab stop, arrows that move and
// select in the reading direction, and Space. Home and End select the
// lowest and the highest score here, since Radix only moves focus on them.
//
// Read only is plain markup, not a radio group: the stars sit in one
// element with role img and a label ("4.5 of 5 stars"), and the text after
// them stays outside it, so it is read. Half stars
// show only in this form; the star-half icon mirrors in right to left.
//
// Source: GoBanana admin FeedbackList could not be fetched in the lane
// session. Designed from the dials table in PLAN.md 3.7 and RadioGroup.
import { useId, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react';
import { RadioGroup as RadixRadioGroup } from 'radix-ui';
import { Icon } from '@the-system/icons/react';
import type { Size, Tone } from '@the-system/shared';
import { useControllable } from '../../internal/useControllable';

export type RatingSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type RatingTone = Extract<Tone, 'accent' | 'warning'>;
export type RatingMax = 5 | 10;

/** The name of one star, "3 of 5 stars". Pass your own for another language. */
export function ratingItemLabel(score: number, max: number): string {
  return `${score} of ${max} stars`;
}

/** The name of a read only rating, "4.5 of 5 stars", or "Not rated" for 0. */
export function ratingValueLabel(value: number, max: number): string {
  return value > 0 ? `${value} of ${max} stars` : 'Not rated';
}

/** How a star draws for a value: full, half or empty. Rounds to the nearest half. */
export function starFill(score: number, value: number): 'full' | 'half' | 'empty' {
  const rounded = Math.round(value * 2) / 2;
  if (rounded >= score) return 'full';
  if (rounded >= score - 0.5) return 'half';
  return 'empty';
}

const ICON = { full: 'star-filled', half: 'star-half', empty: 'star' } as const;
const ICON_SIZE = { sm: 'md', md: 'lg', lg: 'lg' } as const;

export interface RatingProps
  extends Omit<
    ComponentProps<'div'>,
    'title' | 'dir' | 'defaultValue' | 'onChange' | 'children' | 'role'
  > {
  /** The score, controlled. 0 means not rated. Read only accepts halves (4.5). */
  value?: number;
  /** The score at first render, uncontrolled. Default 0. */
  defaultValue?: number;
  /** Called with the new score when a person picks a star. */
  onValueChange?: (value: number) => void;
  /** The number of stars. Default 5. */
  max?: RatingMax;
  /** Shows the score as plain text with star icons, role img and a label. Not focusable. */
  readOnly?: boolean;
  /** Disables every star. Native disabled: the stars leave the tab order. */
  disabled?: boolean;
  /** Sets aria-required on the group and required on the hidden inputs. */
  required?: boolean;
  /** The form field name of the hidden inputs. */
  name?: string;
  /** Star and target size. Default md. */
  size?: RatingSize;
  /** The color of the filled stars. warning: amber. accent: the primary color. Default warning. */
  tone?: RatingTone;
  /** Shows the score as text after the stars, for example 4.5. Default false. */
  showValue?: boolean;
  /** The name of one star. Default "3 of 5 stars". */
  getItemLabel?: (score: number, max: number) => string;
  /** The name of a read only rating. Default "4.5 of 5 stars". */
  getValueLabel?: (value: number, max: number) => string;
  /** Text after the stars, in place of the score when showValue is set: "(128 reviews)". */
  children?: ReactNode;
}

/**
 * A star rating. Name the interactive form with aria-label or
 * aria-labelledby; the read only form names itself from the score.
 */
export function Rating({
  value,
  defaultValue = 0,
  onValueChange,
  max = 5,
  readOnly = false,
  disabled = false,
  required = false,
  name,
  size = 'md',
  tone = 'warning',
  showValue = false,
  getItemLabel = ratingItemLabel,
  getValueLabel = ratingValueLabel,
  children,
  onKeyDown,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  ...rest
}: RatingProps) {
  const [current, setCurrent] = useControllable<number>(value, defaultValue, onValueChange);
  const valueId = useId();
  const starsId = useId();
  const scores = Array.from({ length: max }, (_, i) => i + 1);
  const hasText = showValue || (children !== undefined && children !== null && children !== false);
  const text = (
    <span id={valueId} data-part="value">
      {showValue && current > 0 ? current : null}
      {showValue && current > 0 && children ? ' ' : null}
      {children}
    </span>
  );

  if (readOnly) {
    const label = getValueLabel(current, max);
    // The stars are one image named by the score. The text after them is a
    // sibling, outside the image, so it is read too.
    return (
      <div
        {...rest}
        data-ds="rating"
        data-size={size}
        data-tone={tone}
        data-readonly=""
        data-disabled={disabled ? '' : undefined}
      >
        <span
          id={starsId}
          role="img"
          aria-label={ariaLabel ? `${ariaLabel}: ${label}` : label}
          aria-labelledby={labelledBy ? `${labelledBy} ${starsId}` : undefined}
          data-part="stars"
        >
          {scores.map((score) => {
            const fill = starFill(score, current);
            return (
              <span key={score} data-part="item" data-filled={fill !== 'empty' ? '' : undefined}>
                <Icon name={ICON[fill]} size={ICON_SIZE[size]} data-part="icon" />
              </span>
            );
          })}
        </span>
        {hasText && text}
      </div>
    );
  }

  const whole = Math.round(current);
  const onRootKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    // Radix prevents the default of Home and End itself, so defaultPrevented is not a signal here.
    if (disabled) return;
    if (event.key === 'Home' || event.key === 'End') {
      // Radix moves focus to the first or last star; the score follows it.
      setCurrent(event.key === 'Home' ? 1 : max);
    }
  };

  return (
    <RadixRadioGroup.Root
      {...rest}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-describedby={[rest['aria-describedby'], hasText ? valueId : undefined].filter(Boolean).join(' ') || undefined}
      onKeyDown={onRootKeyDown}
      value={whole > 0 ? String(whole) : ''}
      onValueChange={(next) => setCurrent(Number(next))}
      disabled={disabled}
      required={required}
      name={name}
      orientation="horizontal"
      loop={false}
      data-ds="rating"
      data-size={size}
      data-tone={tone}
      data-disabled={disabled ? '' : undefined}
    >
      {scores.map((score) => {
        const filled = score <= whole;
        return (
          <RadixRadioGroup.Item
            key={score}
            value={String(score)}
            aria-label={getItemLabel(score, max)}
            data-part="item"
            data-filled={filled ? '' : undefined}
          >
            <Icon name={filled ? 'star-filled' : 'star'} size={ICON_SIZE[size]} data-part="icon" />
          </RadixRadioGroup.Item>
        );
      })}
      {hasText && text}
    </RadixRadioGroup.Root>
  );
}
