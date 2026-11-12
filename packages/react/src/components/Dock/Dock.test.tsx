import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Theme } from '../../theme/Theme';
import DockDemo from './Dock.demo';
import { Dock, DockItem, DockSeparator } from './index';

function Example({ size }: { size?: 'md' | 'lg' }) {
  return (
    <Dock aria-label="Apps" size={size}>
      <DockItem href="#files" icon="folder" label="Files" active open />
      <DockItem href="#mail" icon="mail" label="Mail" />
      <DockSeparator />
      <DockItem href="#photo" icon={<img src="data:," alt="" data-testid="img" />} label="Photos" />
    </Dock>
  );
}

describe('Dock', () => {
  it('renders a named nav of links with the parts', () => {
    const { container } = render(<Example />);
    const nav = screen.getByRole('navigation', { name: 'Apps' });
    expect(nav.getAttribute('data-ds')).toBe('dock');
    expect(nav.getAttribute('data-size')).toBe('md');
    const files = screen.getByRole('link', { name: 'Files, open' });
    const parts = Array.from(files.children).map((c) => c.getAttribute('data-part'));
    expect(parts).toEqual(['item-icon', 'item-label', 'item-indicator']);
    expect(files.querySelector('[data-part="item-indicator"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[data-part="separator"]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the name in the link text, never in a title', () => {
    const { container } = render(<Example />);
    const mail = screen.getByRole('link', { name: 'Mail' });
    expect(mail.querySelector('[data-part="item-label"]')?.textContent).toBe('Mail');
    expect(container.querySelector('[title]')).toBeNull();
  });

  it('marks the active and open states', () => {
    render(<Example size="lg" />);
    const files = screen.getByRole('link', { name: 'Files, open' });
    expect(files.getAttribute('aria-current')).toBe('page');
    expect(files.getAttribute('data-active')).toBe('');
    expect(files.getAttribute('data-open')).toBe('');
    const mail = screen.getByRole('link', { name: 'Mail' });
    expect(mail.hasAttribute('data-open')).toBe(false);
    expect(mail.querySelector('[data-part="item-indicator"]')).toBeNull();
    expect(screen.getByRole('navigation').getAttribute('data-size')).toBe('lg');
  });

  it('Escape hides the drawn name until focus leaves', async () => {
    render(<Example />);
    const mail = screen.getByRole('link', { name: 'Mail' });
    mail.focus();
    await userEvent.keyboard('{Escape}');
    expect(mail.getAttribute('data-label-hidden')).toBe('');
    await userEvent.tab();
    expect(mail.hasAttribute('data-label-hidden')).toBe(false);
  });

  it('takes a node as the icon', () => {
    render(<Example />);
    expect(screen.getByTestId('img').closest('[data-part="item-icon"]')).not.toBeNull();
  });

  it('says open in Arabic', () => {
    render(
      <Theme lang="ar" dir="rtl">
        <Dock aria-label="التطبيقات">
          <DockItem href="#f" icon="folder" label="الملفات" open />
        </Dock>
      </Theme>,
    );
    expect(screen.getByRole('link', { name: 'الملفات، مفتوح' })).toBeTruthy();
  });

  it('renders a router link with asChild', () => {
    render(
      <Dock aria-label="Apps">
        <DockItem icon="folder" label="Files" asChild>
          <a href="/files" data-router="">
            x
          </a>
        </DockItem>
      </Dock>,
    );
    const link = screen.getByRole('link', { name: 'Files' });
    expect(link.getAttribute('data-router')).toBe('');
    expect(link.getAttribute('data-part')).toBe('item');
  });

  it('every item is a tab stop', async () => {
    render(<Example />);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Files, open' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Mail' }));
  });

  it('renders the demo with every case', () => {
    const { container } = render(<DockDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic']);
  });
});
