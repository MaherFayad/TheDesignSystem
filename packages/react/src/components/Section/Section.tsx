'use client';
// Section: a titled region of a page or a panel, optionally collapsible.
//
// Source: Figma-Killer-2 `Section/` (the inspector section): a titled block
// set off from its neighbour by a hairline, no fill, no radius; the title is
// the disclosure toggle; the trailing actions sit outside the toggle, since a
// control inside a control is invalid and out of reach by keyboard; a
// section with nothing in it is not a disclosure, so it draws the header
// alone. GoBanana (`.st-section`, admin `ui.tsx`) could not be read in the
// lane session that built this file.
//
// Structure:
//
//   section[data-ds=section]          data-size, data-state when collapsible
//     div[data-part=header]
//       h<level>[data-part=title]     the title, or the toggle holding it
//         Button[data-part=toggle]    collapsible only: Radix Collapsible.Trigger
//       div[data-part=actions]        optional
//       p[data-part=description]      optional
//     div[data-part=body]             the children; Collapsible.Content when collapsible
//
// The heading level is a prop with no default: only the page knows its
// outline. The toggle is a system Button inside the heading (the disclosure
// pattern of the ARIA practices), so the heading keeps its level in the
// outline and the button its name, the title. Its chevron points forward
// when closed and down when open; chevron-forward mirrors in right to left
// layouts (packages/icons).
import { Children, useId, useState, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { Collapsible } from 'radix-ui';
import type { Size } from '@the-system/shared';
import { Button } from '../Button';

export type SectionSize = Extract<Size, 'sm' | 'md'>;
export type SectionLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The title. Plain text, or a node with a Bidi run. Required. */
  title: ReactNode;
  /** The heading level of the title, 1 to 6. Required: it follows the page outline and is never guessed. */
  level: SectionLevel;
  /** A line under the title. The toggle points aria-describedby at it. */
  description?: ReactNode;
  /** Trailing actions in the header: IconButtons or small Buttons. They sit outside the toggle. */
  actions?: ReactNode;
  /** sm for panels and inspectors, md for pages. Default md. */
  size?: SectionSize;
  /**
   * The title becomes a toggle that shows and hides the body. Default false.
   * A collapsible section with no children draws the header alone, with no
   * toggle: there is nothing to disclose.
   */
  collapsible?: boolean;
  /** Controlled open state. Only with collapsible. */
  open?: boolean;
  /** Open state on first render, uncontrolled. Default true. Only with collapsible. */
  defaultOpen?: boolean;
  /** Called with the next open state. Only with collapsible. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Names the section with its title (aria-labelledby), which makes it a
   * region landmark. Default false: most sections are parts of a page, not
   * places to jump to.
   */
  landmark?: boolean;
  /** The body. */
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
}

const present = (node: ReactNode) => node !== undefined && node !== null && node !== false;

/** A titled region, optionally collapsible. */
export function Section({
  title,
  level,
  description,
  actions,
  size = 'md',
  collapsible = false,
  open,
  defaultOpen = true,
  onOpenChange,
  landmark = false,
  children,
  ...rest
}: SectionProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const Heading = `h${level}` as const;
  const hasBody = Children.toArray(children).length > 0;
  const hasDescription = present(description);
  const disclosure = collapsible && hasBody;
  // Open state, controlled or not, so the toggle can show the matching chevron.
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const isOpen = open ?? innerOpen;
  const setOpen = (next: boolean) => {
    if (open === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };

  const header = (
    <div data-part="header">
      <Heading data-part="title" id={titleId}>
        {disclosure ? (
          <Collapsible.Trigger asChild>
            <Button
              data-part="toggle"
              emphasis="ghost"
              shape="square"
              size={size}
              fullWidth
              wrap
              start={isOpen ? 'chevron-down' : 'chevron-forward'}
              aria-describedby={hasDescription ? descriptionId : undefined}
            >
              {title}
            </Button>
          </Collapsible.Trigger>
        ) : (
          title
        )}
      </Heading>
      {present(actions) && <div data-part="actions">{actions}</div>}
      {hasDescription && (
        <p data-part="description" id={descriptionId}>
          {description}
        </p>
      )}
    </div>
  );

  const rootProps = {
    ...rest,
    'data-ds': 'section',
    'data-size': size,
    'aria-labelledby': landmark ? titleId : rest['aria-labelledby'],
  };

  if (!disclosure) {
    return (
      <section {...rootProps}>
        {header}
        {hasBody && <div data-part="body">{children}</div>}
      </section>
    );
  }

  return (
    <Collapsible.Root asChild open={isOpen} onOpenChange={setOpen}>
      <section {...rootProps}>
        {header}
        <Collapsible.Content data-part="body">{children}</Collapsible.Content>
      </section>
    </Collapsible.Root>
  );
}
