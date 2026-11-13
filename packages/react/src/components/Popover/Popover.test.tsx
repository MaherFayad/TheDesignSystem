import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { ThemeContext } from '../../theme/context';
import { resolveTheme } from '../../theme/resolve';
import { Button } from '../Button';
import { Field } from '../Field';
import { Input } from '../Input';
import PopoverDemo from './Popover.demo';
import { physicalSide } from './FloatingLayer';
import {
  Popover,
  PopoverAnchor,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverFooter,
  PopoverTrigger,
  type PopoverContentProps,
  type PopoverProps,
} from './index';

// jsdom has no ResizeObserver, which Radix Popper reads for the arrow size.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const rootEl = () => document.body.querySelector<HTMLElement>('[data-ds="popover"]');
const part = (name: string) => rootEl()?.querySelector<HTMLElement>(`[data-part="${name}"]`) ?? null;

function Basic({
  field = true,
  content,
  ...props
}: PopoverProps & { field?: boolean; content?: Partial<PopoverContentProps> }) {
  return (
    <Popover {...props}>
      <PopoverTrigger>
        <Button>Rename layer</Button>
      </PopoverTrigger>
      <PopoverContent title="Rename layer" {...content}>
        <PopoverBody>
          {field ? (
            <Field label="Layer name">
              <Input defaultValue="Hero image" />
            </Field>
          ) : (
            <p>Edited 5 minutes ago.</p>
          )}
        </PopoverBody>
        <PopoverFooter>
          <PopoverClose>
            <Button>Cancel rename</Button>
          </PopoverClose>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
}

describe('Popover', () => {
  it('renders nothing until the trigger opens it', () => {
    render(<Basic />);
    expect(rootEl()).toBeNull();
    const trigger = screen.getByRole('button', { name: 'Rename layer' });
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(trigger?.getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('opens on click with the anatomy, the axes and the state', async () => {
    const user = userEvent.setup();
    render(<Basic size="lg" />);
    await user.click(screen.getByRole('button', { name: 'Rename layer' }));
    const root = rootEl();
    expect(root).not.toBeNull();
    expect(root?.getAttribute('data-size')).toBe('lg');
    expect(root?.getAttribute('data-state')).toBe('open');
    expect(root?.getAttribute('data-side')).toBe('bottom');
    expect(root?.getAttribute('role')).toBe('dialog');
    expect(root?.hasAttribute('data-part')).toBe(false);
    for (const name of ['title', 'close', 'body', 'footer', 'arrow']) expect(part(name)).not.toBeNull();
    expect(part('close')?.getAttribute('data-ds')).toBe('close-button');
    expect(part('close')?.getAttribute('aria-label')).toBe('Close popover');
    // Named by its title.
    expect(root?.getAttribute('aria-labelledby')).toBe(part('title')?.id);
  });

  it('defaults to size md', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Rename layer' }));
    expect(rootEl()?.getAttribute('data-size')).toBe('md');
  });

  it('renders in a portal Theme that copies the axes of the current Theme', async () => {
    const user = userEvent.setup();
    render(
      <Theme style="desk" scheme="light" dir="rtl" lang="ar">
        <Basic />
      </Theme>,
    );
    await user.click(screen.getByRole('button', { name: 'Rename layer' }));
    const layer = rootEl()?.closest('[data-popover-layer]');
    expect(layer?.getAttribute('data-ds')).toBe('theme');
    expect(layer?.getAttribute('data-style')).toBe('desk');
    expect(layer?.getAttribute('data-scheme')).toBe('light');
    expect(layer?.getAttribute('dir')).toBe('rtl');
    expect(part('close')?.getAttribute('aria-label')).toBe('إغلاق');
  });

  it('moves focus to the first field in the body', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Rename layer' }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Layer name' })));
  });

  it('moves focus to the first footer action when the body has no field', async () => {
    const user = userEvent.setup();
    render(<Basic field={false} />);
    await user.click(screen.getByRole('button', { name: 'Rename layer' }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel rename' })));
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole('button', { name: 'Rename layer' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it('closes from the close control and from PopoverClose', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Rename layer' }));
    await user.click(screen.getByRole('button', { name: 'Close popover' }));
    await waitFor(() => expect(rootEl()).toBeNull());
    await user.click(screen.getByRole('button', { name: 'Rename layer' }));
    await user.click(screen.getByRole('button', { name: 'Cancel rename' }));
    await waitFor(() => expect(rootEl()).toBeNull());
  });

  it('opens with Enter and Space on the trigger', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const trigger = screen.getByRole('button', { name: 'Rename layer' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(rootEl()).not.toBeNull();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());
    await user.keyboard(' ');
    expect(rootEl()).not.toBeNull();
  });

  it('is controlled through open and onOpenChange', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Basic open={false} onOpenChange={onOpenChange} />);
    expect(rootEl()).toBeNull();
    rerender(<Basic open onOpenChange={onOpenChange} />);
    expect(rootEl()).not.toBeNull();
    const user = userEvent.setup();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Still controlled: open until the owner says otherwise.
    expect(rootEl()).not.toBeNull();
  });

  it('hides the close control and the arrow on request', async () => {
    const user = userEvent.setup();
    render(<Basic content={{ close: false, arrow: false }} />);
    await user.click(screen.getByRole('button', { name: 'Rename layer' }));
    expect(part('close')).toBeNull();
    expect(part('arrow')).toBeNull();
  });

  it('takes a custom close label, className and style on the root', async () => {
    const user = userEvent.setup();
    render(<Basic content={{ closeLabel: 'Close rename', className: 'x', style: { color: 'red' } }} />);
    await user.click(screen.getByRole('button', { name: 'Rename layer' }));
    expect(part('close')?.getAttribute('aria-label')).toBe('Close rename');
    expect(rootEl()?.classList.contains('x')).toBe(true);
  });

  it('a disabled trigger stays focusable and does not open', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>
          <Button disabled>Rename layer</Button>
        </PopoverTrigger>
        <PopoverContent title="Rename layer" />
      </Popover>,
    );
    const trigger = screen.getByRole('button', { name: 'Rename layer' });
    await user.click(trigger);
    expect(rootEl()).toBeNull();
    (document.activeElement as HTMLElement | null)?.blur();
    await user.tab();
    expect(document.activeElement).toBe(trigger);
  });

  it('places side start on the right in a right to left Theme', async () => {
    const user = userEvent.setup();
    render(
      <Theme dir="rtl" lang="ar">
        <Basic content={{ side: 'start' }} />
      </Theme>,
    );
    await user.click(screen.getByRole('button', { name: 'Rename layer' }));
    expect(rootEl()?.getAttribute('data-side')).toBe('right');
  });

  it('gives focus to an element marked data-autofocus first', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>
          <Button>Rename layer</Button>
        </PopoverTrigger>
        <PopoverContent title="Rename layer">
          <PopoverBody>
            <Input aria-label="Layer name" />
          </PopoverBody>
          <PopoverFooter>
            <Button data-autofocus="">Apply name</Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByRole('button', { name: 'Rename layer' }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Apply name' })));
  });

  it('focuses a switch or checkbox in the body before the footer', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>
          <Button>Show settings</Button>
        </PopoverTrigger>
        <PopoverContent title="Settings">
          <PopoverBody>
            <div role="switch" aria-checked="false" aria-label="Snap to grid" tabIndex={0} />
          </PopoverBody>
          <PopoverFooter>
            <Button>Apply settings</Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByRole('button', { name: 'Show settings' }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('switch')));
  });

  it('with only an anchor, returns focus to what had it on open', async () => {
    const user = userEvent.setup();
    function Anchored() {
      const [open, setOpen] = useState(false);
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverAnchor asChild>
            <span>Anchor</span>
          </PopoverAnchor>
          <Button onClick={() => setOpen(true)}>Open details</Button>
          <PopoverContent aria-label="Details">
            <PopoverBody>
              <p>Details</p>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      );
    }
    render(<Anchored />);
    const opener = screen.getByRole('button', { name: 'Open details' });
    await user.click(opener);
    await waitFor(() => expect(rootEl()).not.toBeNull());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(document.activeElement).toBe(opener);
  });

  it('maps logical sides to physical sides by direction', () => {
    expect(physicalSide('start', 'ltr')).toBe('left');
    expect(physicalSide('start', 'rtl')).toBe('right');
    expect(physicalSide('end', 'ltr')).toBe('right');
    expect(physicalSide('end', 'rtl')).toBe('left');
    expect(physicalSide('top', 'rtl')).toBe('top');
  });

  it('renders the demo with every content case', () => {
    const { container } = render(<PopoverDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((el) => el.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'disabled', 'readonly']);
    expect(container.querySelectorAll('[data-demo-trigger]').length).toBeGreaterThan(8);
  });

  it('Tab wraps inside the popover, as the manifest says', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Rename layer' }));
    const field = screen.getByRole('textbox', { name: 'Layer name' });
    await waitFor(() => expect(document.activeElement).toBe(field));
    const stops = new Set<Element | null>();
    for (let i = 0; i < 6; i += 1) {
      await user.tab();
      stops.add(document.activeElement);
    }
    for (const el of stops) expect(rootEl()?.contains(el)).toBe(true);
    expect(stops.has(field)).toBe(true);
    const manifest = JSON.parse(readFileSync(join(process.cwd(), 'packages/manifest/src/component/Popover.manifest.json'), 'utf8')) as {
      a11y: { keys: Record<string, string> };
    };
    expect(manifest.a11y.keys.Tab).toMatch(/wraps/);
  });
});

// ------------------------------------------------------------------ motion, order 1.22

describe('motion (order 1.22): Popover.css and HoverCard.css', () => {
  const popover = readFileSync(join(process.cwd(), 'packages/css/src/components/Popover.css'), 'utf8');
  const hoverCard = readFileSync(join(process.cwd(), 'packages/css/src/components/HoverCard.css'), 'utf8');
  it('popover-spring: both land on the bouncy spring and leave faster', () => {
    for (const [css, name] of [
      [popover, 'popover'],
      [hoverCard, 'hover-card'],
    ] as const) {
      expect(css).toContain(`--_${name}-ease-in: var(--ds-ease-spring-bouncy);`);
      expect(css).toContain(`--_${name}-enter-scale: var(--ds-scale-enter);`);
      // Order 1.29 (review 3, N22): the exit is never slower than the entrance (Studio enters in 70ms).
      expect(css).toMatch(new RegExp(`--_${name}-duration-out: min\\(var\\(--ds-duration-(quick|fast)\\), var\\(--_${name}-duration-in\\)\\);`));
    }
  });
  it('staggers the parts; a part with focus is there at once', () => {
    expect(popover).toContain("> :is([data-part='title'], [data-part='body'], [data-part='footer']):focus-within {\n    animation-duration: 0s;");
  });
  it('review 3 N23: the hover card stops blurring under reduced transparency, as the popover does', () => {
    for (const css of [popover, hoverCard]) expect(css).toMatch(/@media \(prefers-reduced-transparency: reduce\) \{\s*\[data-ds='(popover|hover-card)'\] \{\s*--_(popover|hover-card)-blur: 0;/);
  });
  it('review B2: the reduced forms apply under data-motion="reduce" too', () => {
    expect(popover).toContain(":root[data-motion='reduce'] [data-ds='popover'][data-state],");
    expect(hoverCard).toContain(":root[data-motion='reduce'] [data-ds='hover-card'][data-state],");
  });
});

/** A Desk theme whose style.json would turn on these optional parts (order 1.29: no style does yet). */
function WithParts({ parts, children }: { parts: string[]; children: ReactNode }) {
  const base = resolveTheme({ style: 'desk' });
  const value = { ...base, styleData: { ...base.styleData, optionalParts: { ...base.styleData.optionalParts, popover: parts } } };
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

describe('Popover optional parts (order 1.29)', () => {
  it('renders no title bar unless the style turns it on', () => {
    render(
      <Theme style="neutral">
        <Basic defaultOpen />
      </Theme>,
    );
    expect(part('titlebar')).toBeNull();
    expect(part('title')?.textContent).toBe('Rename layer');
  });

  it('puts the title and the close control in the title bar; the title still names the popover', async () => {
    render(
      <WithParts parts={['titlebar']}>
        <Basic defaultOpen />
      </WithParts>,
    );
    const root = await screen.findByRole('dialog', { name: 'Rename layer' });
    const bar = part('titlebar');
    expect(root.firstElementChild).toBe(bar);
    expect(bar?.querySelector('[data-part="title"]')?.textContent).toBe('Rename layer');
    expect(bar?.querySelector('[data-part="close"]')?.getAttribute('aria-label')).toBe('Close popover');
    // The title renders once in the popover: inside the bar, not again in place.
    expect(Array.from(root.querySelectorAll('[data-part="title"]'))).toHaveLength(1);
  });

  it('with controls, the close light closes it', async () => {
    const user = userEvent.setup();
    render(
      <WithParts parts={['titlebar', 'controls']}>
        <Basic defaultOpen />
      </WithParts>,
    );
    await screen.findByRole('dialog');
    expect(part('titlebar')?.querySelector('[data-ds="window-controls"]')?.getAttribute('aria-label')).toBe('Popover controls');
    await user.click(screen.getByRole('button', { name: 'Close popover' }));
    await waitFor(() => expect(rootEl()).toBeNull());
  });
});
