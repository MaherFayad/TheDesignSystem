'use client';
// RadioCard: a radio choice drawn as a card with a title, text, an optional
// icon and optional end content (plans, shipping options).
//
// Behavior: Radix RadioGroup, as RadioGroup. The Radix root is the system
// root (`data-ds="radio-card"`, role radiogroup) and each Radix item is the
// `item` part: the whole card is one radio button, so the whole card is the
// target. Its name is the title and its description is the text, through
// aria-labelledby and aria-describedby, so the end content (a price) does
// not make the name long.
//
// Source: no source (the order says so). Designed from the dials table in
// PLAN.md 3.7, RadioGroup (the indicator) and the card radius and surface
// steps of the active style.
import { createContext, use, useId, useMemo, type ComponentProps, type ReactNode } from 'react';
import { RadioGroup as RadixRadioGroup } from 'radix-ui';
import { isIconName, type IconName } from '@the-system/icons';
import { Icon } from '@the-system/icons/react';
import type { Size, Tone } from '@the-system/shared';
import { useControllable } from '../../internal/useControllable';

export type RadioCardSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type RadioCardTone = Extract<Tone, 'neutral' | 'accent'>;
export type RadioCardOrientation = 'vertical' | 'horizontal';

const RadioCardContext = createContext<{ size: RadioCardSize } | null>(null);

export interface RadioCardProps
  extends Omit<
    ComponentProps<'div'>,
    'title' | 'dir' | 'defaultValue' | 'onChange' | 'children' | 'role' | 'aria-orientation'
  > {
  /** The checked value, controlled. */
  value?: string;
  /** The checked value at first render, uncontrolled. */
  defaultValue?: string;
  /** Called with the new value when a person picks a card. */
  onValueChange?: (value: string) => void;
  /** Disables every card. Native disabled: the cards leave the tab order. */
  disabled?: boolean;
  /** Sets aria-required on the group and required on the hidden inputs. */
  required?: boolean;
  /** Marks the group invalid: aria-invalid and the danger border. Pair it with a message the group's aria-describedby points at. */
  invalid?: boolean;
  /** The form field name of the hidden inputs. */
  name?: string;
  /** vertical: one card per line. horizontal: cards side by side in a grid that wraps. Default vertical. */
  orientation?: RadioCardOrientation;
  /** Padding, title and icon size. Default md. */
  size?: RadioCardSize;
  /** neutral: the checked card takes the text color. accent: the primary fill. Default neutral. */
  tone?: RadioCardTone;
  /** Arrow keys wrap from the last card to the first. Default true. */
  loop?: boolean;
  /** RadioCardItem elements. */
  children?: ReactNode;
}

/**
 * A group of radio cards. Name the group with aria-labelledby (a heading
 * above it) or aria-label. One card is checked at a time.
 */
export function RadioCard({
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  required = false,
  invalid = false,
  name,
  orientation = 'vertical',
  size = 'md',
  tone = 'neutral',
  loop = true,
  children,
  ...rest
}: RadioCardProps) {
  const [current, setCurrent] = useControllable<string>(value, defaultValue ?? '', onValueChange);
  const context = useMemo(() => ({ size }), [size]);
  return (
    <RadioCardContext value={context}>
      <RadixRadioGroup.Root
        {...rest}
        aria-invalid={invalid ? true : undefined}
        aria-orientation={orientation}
        value={current}
        onValueChange={setCurrent}
        disabled={disabled}
        required={required}
        name={name}
        loop={loop}
        data-ds="radio-card"
        data-size={size}
        data-tone={tone}
        data-orientation={orientation}
        data-invalid={invalid ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
      >
        {children}
      </RadixRadioGroup.Root>
    </RadioCardContext>
  );
}

export interface RadioCardItemProps
  extends Omit<ComponentProps<'button'>, 'title' | 'value' | 'children' | 'type'> {
  /** The value this card sets. */
  value: string;
  /** The visible name of the option. It is the accessible name. */
  title: ReactNode;
  /** A line or two of help under the title. Joins aria-describedby. */
  description?: ReactNode;
  /** A system icon name or a node before the text. Decoration: aria-hidden. */
  icon?: IconName | ReactNode;
  /** Content at the inline end, such as a price or a delivery date. Read after the description. */
  end?: ReactNode;
  /** Disables this card only. */
  disabled?: boolean;
}

/**
 * One card: the indicator, an optional icon, the title and description, and
 * optional end content. The whole card is the radio button and gets the ref
 * and the native props.
 */
export function RadioCardItem({
  value,
  title,
  description,
  icon,
  end,
  disabled,
  'aria-describedby': describedBy,
  ...rest
}: RadioCardItemProps) {
  const group = use(RadioCardContext);
  const base = useId();
  const has = (node: ReactNode) => node !== undefined && node !== null && node !== false;
  const ids = { title: `${base}title`, description: `${base}description`, end: `${base}end` };
  const describedByIds =
    [has(description) ? ids.description : undefined, has(end) ? ids.end : undefined, describedBy]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <RadixRadioGroup.Item
      aria-labelledby={ids.title}
      {...rest}
      aria-describedby={describedByIds}
      value={value}
      disabled={disabled}
      data-part="item"
    >
      <RadixRadioGroup.Indicator forceMount data-part="indicator">
        {/* The dot that pops in (radio-card-lift). Decorative, no part name. */}
        <span aria-hidden="true" />
      </RadixRadioGroup.Indicator>
      {has(icon) && (
        <span data-part="icon" aria-hidden="true">
          {typeof icon === 'string' && isIconName(icon) ? <Icon name={icon} size={group?.size === 'sm' ? 'md' : 'lg'} /> : icon}
        </span>
      )}
      <span id={ids.title} data-part="title">
        {title}
      </span>
      {has(description) && (
        <span id={ids.description} data-part="description">
          {description}
        </span>
      )}
      {has(end) && (
        <span id={ids.end} data-part="end">
          {end}
        </span>
      )}
    </RadixRadioGroup.Item>
  );
}
