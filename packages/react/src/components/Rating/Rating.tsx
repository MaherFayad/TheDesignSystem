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
// Interactions (orders 1.21 and 1.22, proposed): rating-fill, when a person
// picks a score, moves only the stars whose state changed: stars that fill
// land from scale.morph past full size as one short run (two stagger steps
// at most), the chosen one on the bouncy spring; stars that empty dip and
// spring back. It plays after the score is set and a new pick restarts it,
// so it never holds back the next pick. rating-preview (CSS): the stars
// that join the hover preview dip and spring back, toward the pointer.
//
// Order 1.23 (proposed): rating-preview becomes a color sweep. Each star
// holds a decorative filled glyph (the fill part, aria-hidden) clipped away
// at rest; on hover the clip opens from the inline start, star after star
// (--_rating-index on each item sets its delay), so the color runs up to the
// pointer. rating-fill pops the chosen star and every star before it, as
// one short run from the first: stars that were already filled bounce,
// stars that fill land from scale.morph, the chosen one on the bouncy spring.
//
// Source: GoBanana admin FeedbackList could not be fetched in the lane
// session. Designed from the dials table in PLAN.md 3.7 and RadioGroup.
import { useId, useLayoutEffect, useRef, type ComponentProps, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { RadioGroup as RadixRadioGroup } from 'radix-ui';
import { Icon } from '@the-system/icons/react';
import type { Size, Tone } from '@the-system/shared';
import { useMotion } from '../../internal/motion';
import { useControllable } from '../../internal/useControllable';
import { useTheme } from '../../theme';
import { dipPop, landPop, playBeat, runStep } from '../Input/fieldMotion';

export type RatingSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type RatingTone = Extract<Tone, 'accent' | 'warning'>;
export type RatingMax = 5 | 10;

const isArabic = (lang: string | undefined) => (lang ?? '').toLowerCase().startsWith('ar');

/** The name of one star: "3 of 5 stars", or "3 من 5 نجوم" for Arabic. Western digits in both. */
export function ratingItemLabel(score: number, max: number, lang?: string): string {
  return isArabic(lang) ? `${score} من ${max} نجوم` : `${score} of ${max} stars`;
}

/** The name of a read only rating: "4.5 of 5 stars", or "Not rated" for 0. Arabic: "4.5 من 5 نجوم", "بدون تقييم". */
export function ratingValueLabel(value: number, max: number, lang?: string): string {
  if (value > 0) return ratingItemLabel(value, max, lang);
  return isArabic(lang) ? 'بدون تقييم' : 'Not rated';
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
  /** The name of one star. Default "3 of 5 stars", in Arabic "3 من 5 نجوم", following the Theme language. */
  getItemLabel?: (score: number, max: number) => string;
  /** The name of a read only rating. Default "4.5 of 5 stars" or "Not rated", in Arabic "4.5 من 5 نجوم" or "بدون تقييم". */
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
  getItemLabel: getItemLabelProp,
  getValueLabel: getValueLabelProp,
  children,
  onKeyDown,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  ...rest
}: RatingProps) {
  const { lang } = useTheme();
  const getItemLabel = getItemLabelProp ?? ((score: number, of: number) => ratingItemLabel(score, of, lang));
  const getValueLabel = getValueLabelProp ?? ((score: number, of: number) => ratingValueLabel(score, of, lang));
  const [current, setCurrent] = useControllable<number>(value, defaultValue, onValueChange);
  const whole = Math.round(current);
  const motion = useMotion();
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  // Set by a pick, read once the new score is drawn: the score before it.
  const picked = useRef<number | null>(null);
  const pick = (next: number) => {
    if (next !== whole) picked.current = whole;
    setCurrent(next);
  };
  const valueId = useId();
  const starsId = useId();
  const scores = Array.from({ length: max }, (_, i) => i + 1);
  // rating-fill: only the stars whose state changed move. Stars that fill land from scale.morph
  // past full size, as one run spread over two stagger steps from the first; the chosen star
  // lands on the bouncy spring. Stars that empty dip and spring back. A new pick restarts the run.
  useLayoutEffect(() => {
    const before = picked.current;
    picked.current = null;
    if (before === null || before === whole) return;
    const mode = motion.mode('rating-fill');
    // The chosen star and every star before it pop as one run from the first.
    for (let score = 1; score <= whole; score++) {
      const icon = items.current[score - 1]?.querySelector('[data-part="icon"]');
      const wait = { delay: 'delay.stagger' as const, steps: runStep(score - 1, whole) };
      if (score > before) {
        const last = score === whole;
        const timing = last
          ? {}
          : {
              duration: 'duration.spring-snappy' as const,
              easing: 'ease.spring-snappy' as const,
            };
        playBeat(icon, landPop(undefined, { ...timing, ...wait }), 'rating-fill', mode);
      } else {
        playBeat(icon, dipPop(wait), 'rating-fill', mode, null);
      }
    }
    // Stars that empty dip and spring back, together.
    for (let score = whole + 1; score <= before; score++) {
      playBeat(items.current[score - 1]?.querySelector('[data-part="icon"]'), dipPop(), 'rating-fill', mode, null);
    }
  }, [whole, motion]);

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

  const onRootKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    // Radix prevents the default of Home and End itself, so defaultPrevented is not a signal here.
    if (disabled) return;
    if (event.key === 'Home' || event.key === 'End') {
      // Radix moves focus to the first or last star; the score follows it.
      pick(event.key === 'Home' ? 1 : max);
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
      onValueChange={(next) => pick(Number(next))}
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
            ref={(el) => {
              items.current[score - 1] = el;
            }}
            value={String(score)}
            aria-label={getItemLabel(score, max)}
            data-part="item"
            data-filled={filled ? '' : undefined}
            style={{ '--_rating-index': score - 1 } as CSSProperties}
          >
            <Icon name={filled ? 'star-filled' : 'star'} size={ICON_SIZE[size]} data-part="icon" />
            {/* rating-preview: the color the hover sweeps in, decorative. */}
            <Icon name="star-filled" size={ICON_SIZE[size]} data-part="fill" />
          </RadixRadioGroup.Item>
        );
      })}
      {hasText && text}
    </RadixRadioGroup.Root>
  );
}
