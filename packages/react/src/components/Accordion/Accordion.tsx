'use client';
// Accordion: stacked sections that open and close. Behavior from Radix
// Accordion (single or multiple, arrow keys between triggers, Home and End).
//
// Sources: Figma-Killer-2 `Section/` (a title that doubles as the toggle,
// a hairline between sections, a chevron that turns). GoBanana
// `.st-section-toggle` and the MailApp rows could not be read in this
// session; values come from the dials table in PLAN.md section 3.7.
//
//   <div data-ds="accordion" data-size data-variant data-orientation>          Radix Root
//     <div data-part="item" data-state [data-disabled]>                         Radix Item
//       <h3 data-part="header" data-state>                                       Radix Header, level from headingLevel
//         <button data-ds="button" data-part="trigger" aria-expanded data-state> Radix Trigger on the system Button
//           <span data-part="label">Title</span>
//           <span data-part="end"><svg data-ds="icon" data-icon="chevron-down"/></span>
//       <div data-part="content" role="region" data-state>                      Radix Content
//
// The trigger is the system Button (no bare button), so its chevron sits in
// the Button's own `end` part. The order proposed an `icon` part of the
// accordion; a part inside the Button would belong to the Button by the
// ownership rule in anatomy.md, so the chevron is the Button's end content.
//
// Motion (accordion-height): the content fades in and slides down a step as
// it opens, transform and opacity only, never height. Closing is at once, so
// Radix unmounts the content without waiting for any animation event.
import { createContext, use, type ComponentProps, type ReactNode, type Ref } from 'react';
import { Accordion as RadixAccordion } from 'radix-ui';
import { Icon } from '@the-system/icons/react';
import type { Size } from '@the-system/shared';
import { Button } from '../Button';

export type AccordionSize = Extract<Size, 'sm' | 'md'>;
export type AccordionVariant = 'plain' | 'divided' | 'card';
export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

interface AccordionContextValue {
  size: AccordionSize;
  headingLevel: AccordionHeadingLevel;
}

const AccordionContext = createContext<AccordionContextValue>({ size: 'md', headingLevel: 3 });

interface AccordionCommonProps {
  /** Row height and type size: sm (28px trigger, text s) or md (44px trigger, text m). Default md. */
  size?: AccordionSize;
  /** plain: no lines. divided: a hairline between sections. card: each section on its own surface. Default divided. */
  variant?: AccordionVariant;
  /** The heading level each trigger sits in, so the sections fit the outline of the page. Default 3. */
  headingLevel?: AccordionHeadingLevel;
  ref?: Ref<HTMLDivElement>;
}

type RadixSingle = Omit<ComponentProps<typeof RadixAccordion.Root> & { type: 'single' }, 'type' | 'asChild'>;
type RadixMultiple = Omit<ComponentProps<typeof RadixAccordion.Root> & { type: 'multiple' }, 'type' | 'asChild'>;

export interface AccordionSingleProps extends AccordionCommonProps, Omit<RadixSingle, keyof AccordionCommonProps | 'value' | 'defaultValue' | 'onValueChange' | 'collapsible'> {
  /** single: one section open at a time. Default single. */
  type?: 'single';
  /** The open section, controlled. An empty string closes all. */
  value?: string;
  /** The section open at first. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** The open section can be closed again. Default true. */
  collapsible?: boolean;
}

export interface AccordionMultipleProps extends AccordionCommonProps, Omit<RadixMultiple, keyof AccordionCommonProps | 'value' | 'defaultValue' | 'onValueChange'> {
  /** multiple: any number of sections open. */
  type: 'multiple';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

/** The accordion root: stamps the axes, passes size and heading level to the triggers. */
export function Accordion({ size = 'md', variant = 'divided', headingLevel = 3, ...rest }: AccordionProps) {
  const attrs = { 'data-ds': 'accordion', 'data-size': size, 'data-variant': variant };
  const root =
    rest.type === 'multiple' ? (
      <RadixAccordion.Root {...rest} {...attrs} />
    ) : (
      <RadixAccordion.Root {...rest} collapsible={rest.collapsible ?? true} type="single" {...attrs} />
    );
  return <AccordionContext value={{ size, headingLevel }}>{root}</AccordionContext>;
}

export interface AccordionItemProps extends Omit<ComponentProps<typeof RadixAccordion.Item>, 'asChild'> {
  /** The id of this section, unique in the accordion. */
  value: string;
  /** The section cannot open or close. Its trigger stays focusable with aria-disabled. Default false. */
  disabled?: boolean;
}

/** One section: a header with its trigger, and the content. */
export function AccordionItem(props: AccordionItemProps) {
  return <RadixAccordion.Item {...props} data-part="item" />;
}

export interface AccordionTriggerProps extends Omit<ComponentProps<typeof RadixAccordion.Trigger>, 'asChild' | 'children'> {
  /** The section title. It is the trigger's name. */
  children: ReactNode;
}

/** The section title as a heading, holding the system Button that opens and closes the section. */
export function AccordionTrigger({ children, ref, ...rest }: AccordionTriggerProps) {
  const { size, headingLevel } = use(AccordionContext);
  const Heading = `h${headingLevel}` as const;
  return (
    <RadixAccordion.Header asChild>
      <Heading data-part="header">
        <RadixAccordion.Trigger {...rest} asChild>
          <Button
            ref={ref}
            data-part="trigger"
            emphasis="ghost"
            size={size === 'sm' ? 'sm' : 'md'}
            fullWidth
            wrap
            end={<Icon name="chevron-down" size="md" />}
          >
            {children}
          </Button>
        </RadixAccordion.Trigger>
      </Heading>
    </RadixAccordion.Header>
  );
}

export type AccordionContentProps = Omit<ComponentProps<typeof RadixAccordion.Content>, 'asChild'>;

/** The section body. Mounted only while open. */
export function AccordionContent(props: AccordionContentProps) {
  return <RadixAccordion.Content {...props} data-part="content" />;
}
