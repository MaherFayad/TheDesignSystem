import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import BannerDemo from './Banner.demo';
import { Banner } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="banner"]');
  if (!el) throw new Error('no banner rendered');
  return el;
}

describe('Banner', () => {
  it('renders a named region with the anatomy and the default axes', () => {
    const { container } = render(<Banner>Maintenance on Friday.</Banner>);
    const el = root(container);
    expect(screen.getByRole('region', { name: 'Announcement' })).toBe(el);
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.getAttribute('data-emphasis')).toBe('soft');
    expect(el.hasAttribute('data-sticky')).toBe(false);
    expect(el.hasAttribute('data-size')).toBe(false);
    expect(el.querySelector('[data-part="body"]')?.textContent).toBe('Maintenance on Friday.');
    expect(el.querySelector('[data-part="close"]')).toBeNull();
    expect(el.querySelector('[data-part="actions"]')).toBeNull();
  });

  it('sets the axes, a custom label and the tone word', () => {
    const { container } = render(
      <Banner tone="danger" emphasis="solid" label="Service status">
        Sync is down.
      </Banner>,
    );
    const el = root(container);
    expect(el.getAttribute('data-tone')).toBe('danger');
    expect(el.getAttribute('data-emphasis')).toBe('solid');
    expect(screen.getByRole('region', { name: 'Service status' })).toBe(el);
    expect(screen.getByRole('img', { name: 'Error' })).toBeTruthy();
  });

  it('speaks Arabic under a Theme in Arabic', () => {
    render(
      <Theme lang="ar">
        <Banner tone="info" onDismiss={() => undefined}>
          صيانة مجدولة
        </Banner>
      </Theme>,
    );
    expect(screen.getByRole('region', { name: 'إعلان' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'إغلاق الإعلان' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'معلومة' })).toBeTruthy();
  });

  it('moves focus to the main content, then calls onDismiss', async () => {
    const order: string[] = [];
    const onDismiss = vi.fn(() => order.push(document.activeElement?.tagName ?? ''));
    render(
      <>
        <Banner onDismiss={onDismiss} actions={<Button size="sm">Add payment method</Button>}>
          Trial ends soon.
        </Banner>
        <main>Boards</main>
      </>,
    );
    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe('Add payment method');
    await userEvent.tab();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Dismiss announcement');
    await userEvent.keyboard('{Enter}');
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['MAIN']);
    expect(document.querySelector('main')?.getAttribute('tabindex')).toBe('-1');
  });

  it('returns focus to a given element', async () => {
    render(
      <>
        <Banner onDismiss={() => undefined} returnFocus="#start">
          Trial ends soon.
        </Banner>
        <h1 id="start">Boards</h1>
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss announcement' }));
    expect(document.activeElement?.id).toBe('start');
  });

  it('reserves scroll padding on its scroll container while sticky, and restores it', () => {
    const { container, rerender, unmount } = render(
      <div data-testid="box" style={{ overflowY: 'auto', scrollPaddingBlockStart: '4px' }}>
        <Banner sticky>Maintenance on Friday.</Banner>
      </div>,
    );
    const box = screen.getByTestId('box');
    expect(root(container).hasAttribute('data-sticky')).toBe(true);
    // jsdom has no layout, so the height is 0; the padding is set from it.
    expect(box.style.scrollPaddingBlockStart).toBe('0px');
    rerender(
      <div data-testid="box" style={{ overflowY: 'auto', scrollPaddingBlockStart: '4px' }}>
        <Banner>Maintenance on Friday.</Banner>
      </div>,
    );
    expect(box.style.scrollPaddingBlockStart).toBe('4px');
    unmount();
  });

  it('passes ref and rest props to the root', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Banner ref={ref} id="notice" className="x">
        Text
      </Banner>,
    );
    expect(ref.current?.id).toBe('notice');
    expect(ref.current?.tagName).toBe('SECTION');
  });

  it('renders the demo with every case it applies to', () => {
    const { container } = render(<BannerDemo />);
    const ids = [...container.querySelectorAll('[data-demo-case]')].map((el) => el.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic']);
  });
});
