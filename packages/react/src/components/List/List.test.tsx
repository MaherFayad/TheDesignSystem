import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { act, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { IconButton } from '../IconButton';
import ListDemo from './List.demo';
import { List, ListItem } from './index';

const root = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="list"]')!;

describe('List', () => {
  it('renders a ul with rows and the defaults', () => {
    const { container } = render(
      <List aria-label="Inbox">
        <ListItem title="One" />
        <ListItem title="Two" description="Second line" start="mail" end="09:24" />
      </List>,
    );
    const el = root(container);
    expect(el.tagName).toBe('UL');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-variant')).toBe('plain');
    const items = el.querySelectorAll(':scope > [data-part="item"]');
    expect(items).toHaveLength(2);
    expect(items[0]!.tagName).toBe('LI');
    const second = items[1]!;
    expect(second.querySelector('[data-part="title"]')?.textContent).toBe('Two');
    expect(second.querySelector('[data-part="description"]')?.textContent).toBe('Second line');
    expect(second.querySelector('[data-part="end"]')?.textContent).toBe('09:24');
    expect(second.querySelector('[data-part="start"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(second.querySelector('[data-part="separator"]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders an ol when ordered, and takes size and variant', () => {
    const { container } = render(
      <List ordered size="sm" variant="inset">
        <ListItem title="Step" />
      </List>,
    );
    expect(root(container).tagName).toBe('OL');
    expect(root(container).getAttribute('data-size')).toBe('sm');
    expect(root(container).getAttribute('data-variant')).toBe('inset');
  });

  it('renders the empty message in a div when there are no rows', () => {
    const { container } = render(<List empty="No mail yet" />);
    expect(root(container).tagName).toBe('DIV');
    expect(container.querySelector('[data-part="empty"]')?.textContent).toBe('No mail yet');
    expect(container.querySelector('ul')).toBeNull();
  });

  it('makes the title a link with href, with aria-current when active', () => {
    render(
      <List>
        <ListItem title="Inbox" href="#inbox" active />
      </List>,
    );
    const link = screen.getByRole('link', { name: 'Inbox' });
    expect(link.getAttribute('href')).toBe('#inbox');
    expect(link.getAttribute('data-part')).toBe('title');
    expect(link.getAttribute('aria-current')).toBe('true');
    const item = link.closest('[data-part="item"]')!;
    expect(item.getAttribute('data-active')).toBe('');
    expect(item.getAttribute('data-linked')).toBe('');
  });

  it('takes link props, and aria-current from them', () => {
    render(
      <List>
        <ListItem title="Home" href="/" active linkProps={{ 'aria-current': 'page', target: '_self' }} />
      </List>,
    );
    const link = screen.getByRole('link', { name: 'Home' });
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(link.getAttribute('target')).toBe('_self');
  });

  it('keeps a disabled link focusable and blocks its click handler', async () => {
    let clicks = 0;
    render(
      <List>
        <ListItem title="Finance" href="#finance" disabled linkProps={{ onClick: () => void (clicks += 1) }} />
      </List>,
    );
    const link = screen.getByRole('link', { name: 'Finance' });
    await userEvent.tab();
    expect(document.activeElement).toBe(link);
    await userEvent.click(link);
    expect(clicks).toBe(0);
  });

  it('says which row is current when the row has no link', () => {
    const { container } = render(
      <List>
        <ListItem title="Now" active />
      </List>,
    );
    expect(container.querySelector('[data-part="item"]')?.getAttribute('aria-current')).toBe('true');
  });

  it('sets role list on ul and ol, and makes a labelled empty list a group', () => {
    const { container, rerender } = render(
      <List ordered>
        <ListItem title="Step" />
      </List>,
    );
    expect(root(container).getAttribute('role')).toBe('list');
    rerender(<List aria-label="Inbox" empty="No mail yet" />);
    expect(root(container).getAttribute('role')).toBe('group');
    rerender(<List />);
    expect(root(container).tagName).toBe('DIV');
    expect(root(container).hasAttribute('role')).toBe(false);
    expect(container.querySelector('[data-part="empty"]')).toBeNull();
  });

  it('drops the href and marks the row when disabled', () => {
    const { container } = render(
      <List>
        <ListItem title="Finance" href="#finance" disabled />
      </List>,
    );
    const link = screen.getByRole('link', { name: 'Finance' });
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(container.querySelector('[data-part="item"]')?.getAttribute('data-disabled')).toBe('');
  });

  it('tabs through the row link, then its actions', async () => {
    render(
      <List>
        <ListItem title="Mail" href="#m" actions={<IconButton icon="trash" label="Delete mail" />} />
        <ListItem title="Plain row" />
      </List>,
    );
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Mail' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Delete mail' }));
  });

  it('passes props and refs to the root and the row', () => {
    let list: HTMLElement | null = null;
    let row: HTMLLIElement | null = null;
    const { container } = render(
      <List className="x" ref={(n) => void (list = n)}>
        <ListItem title="A" className="y" ref={(n) => void (row = n)} />
      </List>,
    );
    expect(root(container).className).toBe('x');
    expect(list).toBe(root(container));
    expect(row).toBe(container.querySelector('[data-part="item"]'));
  });

  it('renders the demo cases in order', () => {
    const { container } = render(<ListDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
  });

  describe('list-stagger', () => {
    function withAnimate(run: (animate: ReturnType<typeof vi.fn>) => void | Promise<void>) {
      const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel() {} }) as unknown as Animation);
      const proto = HTMLElement.prototype as unknown as { animate?: unknown };
      const original = proto.animate;
      proto.animate = animate;
      return Promise.resolve(run(animate)).finally(() => {
        proto.animate = original;
      });
    }

    /** Desk plays list-stagger in full; Studio and Neutral play its reduced form. */
    const desk = (ui: ReactNode) => <Theme style="desk">{ui}</Theme>;
    const rows = (n: number) => Array.from({ length: n }, (_, i) => <ListItem key={i} title={`Row ${i + 1}`} />);

    it('fades and rises every row in on the first paint, and never again on a re-render, an added row or a reorder', () =>
      withAnimate((animate) => {
        const { rerender } = render(desk(<List aria-label="Rows">{rows(12)}</List>));
        expect(animate).toHaveBeenCalledTimes(12);
        const timings = animate.mock.calls.map((c) => (c as unknown as [Keyframe[], KeyframeAnimationOptions])[1]);
        for (const t of timings) expect(t.id).toBe('ds-motion:list-stagger');
        const [frames] = animate.mock.calls[0] as unknown as [Keyframe[]];
        expect(frames[0]?.opacity).toBe(0);
        expect(String(frames[0]?.transform)).toContain('translateY(');
        // Every row is in the DOM and named at once.
        expect(screen.getAllByRole('listitem')).toHaveLength(12);
        rerender(desk(<List aria-label="Rows">{rows(13)}</List>));
        rerender(desk(<List aria-label="Rows">{rows(13).reverse()}</List>));
        expect(animate).toHaveBeenCalledTimes(12);
      }));

    it('plays when rows arrive after an empty first paint', () =>
      withAnimate((animate) => {
        const { rerender } = render(desk(<List empty="No rows yet">{[]}</List>));
        expect(animate).not.toHaveBeenCalled();
        rerender(desk(<List empty="No rows yet">{rows(2)}</List>));
        expect(animate).toHaveBeenCalledTimes(2);
      }));

    it('plays a fade with no rise under reduced motion', () =>
      withAnimate((animate) => {
        const original = window.matchMedia;
        window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
        try {
          render(desk(<List>{rows(3)}</List>));
          expect(animate).toHaveBeenCalledTimes(3);
          for (const call of animate.mock.calls) {
            const [frames, timing] = call as unknown as [Keyframe[], KeyframeAnimationOptions];
            expect(frames.every((f) => !('transform' in f))).toBe(true);
            expect(timing.delay).toBe(0);
          }
        } finally {
          window.matchMedia = original;
        }
      }));

    it('plays the reduced fade in a style whose preset asks for it (Studio)', () =>
      withAnimate((animate) => {
        render(
          <Theme style="studio">
            <List>{rows(2)}</List>
          </Theme>,
        );
        expect(animate).toHaveBeenCalledTimes(2);
        for (const call of animate.mock.calls) expect((call as unknown as [Keyframe[]])[0].every((f) => !('transform' in f))).toBe(true);
      }));

    it('skips rows that come from server HTML', () =>
      withAnimate(async (animate) => {
        const ui = desk(<List>{rows(3)}</List>);
        const host = document.createElement('div');
        host.innerHTML = renderToString(ui);
        document.body.append(host);
        await act(async () => {
          hydrateRoot(host, ui);
        });
        expect(host.querySelectorAll('[data-part="item"]')).toHaveLength(3);
        expect(animate).not.toHaveBeenCalled();
        host.remove();
      }));
  });
});
