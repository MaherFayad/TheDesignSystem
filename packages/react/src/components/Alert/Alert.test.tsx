import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Icon } from '@the-system/icons/react';
import { Button } from '../Button';
import AlertDemo from './Alert.demo';
import { Alert } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="alert"]');
  if (!el) throw new Error('no alert rendered');
  return el;
}

describe('Alert', () => {
  it('renders the anatomy with the default axes and no live role', () => {
    const { container } = render(<Alert title="Could not sync 3 files">Your local copies are safe.</Alert>);
    const el = root(container);
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.getAttribute('data-emphasis')).toBe('soft');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(el.querySelector('[data-part="title"]')?.textContent).toBe('Could not sync 3 files');
    expect(el.querySelector('[data-part="body"]')?.textContent).toBe('Your local copies are safe.');
    expect(el.querySelector('[data-part="actions"]')).toBeNull();
    expect(el.querySelector('[data-part="close"]')).toBeNull();
  });

  it('sets the axis attributes from props', () => {
    const { container } = render(<Alert tone="warning" emphasis="solid" size="sm" title="Storage almost full" />);
    const el = root(container);
    expect(el.getAttribute('data-tone')).toBe('warning');
    expect(el.getAttribute('data-emphasis')).toBe('solid');
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.querySelector('[data-part="body"]')).toBeNull();
  });

  it('names the tone through the icon, never by color alone', () => {
    render(<Alert tone="danger" title="Could not sync" />);
    expect(screen.getByRole('img', { name: 'Error' })).toBeTruthy();
  });

  it('says the tone word in Arabic under a Theme in Arabic, and takes a custom word', () => {
    const { rerender } = render(
      <Theme lang="ar">
        <Alert tone="warning" title="المساحة قربت تخلص" onClose={() => undefined} />
      </Theme>,
    );
    expect(screen.getByRole('img', { name: 'تنبيه' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'إغلاق الرسالة' })).toBeTruthy();
    rerender(<Alert tone="warning" toneLabel="Heads up" title="Storage almost full" />);
    expect(screen.getByRole('img', { name: 'Heads up' })).toBeTruthy();
  });

  it('puts the tone word on the icon part when a node replaces the icon', () => {
    const { container } = render(<Alert tone="success" icon={<Icon name="check" />} title="Synced" />);
    const icon = container.querySelector('[data-part="icon"]');
    expect(icon?.getAttribute('role')).toBe('img');
    expect(icon?.getAttribute('aria-label')).toBe('Success');
  });

  it('uses role alert for a live danger alert and role status for the other tones', () => {
    const { container, rerender } = render(<Alert live tone="danger" title="Could not sync" />);
    expect(root(container).getAttribute('role')).toBe('alert');
    rerender(<Alert live tone="info" title="Sync paused" />);
    expect(root(container).getAttribute('role')).toBe('status');
    expect(root(container).getAttribute('aria-atomic')).toBe('true');
  });

  it('renders the actions and a close button that calls onClose', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <Alert title="Could not sync" actions={<Button size="sm">Retry sync</Button>} onClose={onClose} />,
    );
    const close = container.querySelector<HTMLElement>('[data-part="close"]');
    expect(close?.getAttribute('data-ds')).toBe('icon-button');
    expect(close?.getAttribute('aria-label')).toBe('Dismiss alert');
    expect(container.querySelector('[data-part="actions"]')?.textContent).toBe('Retry sync');
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss alert' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('reaches the actions and then close with Tab', async () => {
    render(<Alert title="Could not sync" actions={<Button size="sm">Retry sync</Button>} onClose={() => undefined} />);
    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe('Retry sync');
    await userEvent.tab();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Dismiss alert');
  });

  it('passes ref and rest props to the root', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Alert ref={ref} id="sync" className="x" title="Synced" />);
    expect(ref.current?.id).toBe('sync');
    expect(ref.current?.className).toBe('x');
  });

  it('renders the demo with every case it applies to', () => {
    const { container } = render(<AlertDemo />);
    const ids = [...container.querySelectorAll('[data-demo-case]')].map((el) => el.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error']);
  });
});
