import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import TabsDemo from './Tabs.demo';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from './index';

function Example(props: Partial<Parameters<typeof Tabs>[0]> & { disabledB?: boolean }) {
  const { disabledB, ...rest } = props;
  return (
    <Tabs defaultValue="a" {...rest}>
      <TabsList aria-label="Board settings">
        <TabsTrigger value="a" start="settings">
          General
        </TabsTrigger>
        <TabsTrigger value="b" disabled={disabledB}>
          Members
        </TabsTrigger>
        <TabsTrigger value="c" count={12}>
          Comments
        </TabsTrigger>
      </TabsList>
      <TabsPanel value="a">General panel</TabsPanel>
      <TabsPanel value="b">Members panel</TabsPanel>
      <TabsPanel value="c">Comments panel</TabsPanel>
    </Tabs>
  );
}

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="tabs"]');
  if (!el) throw new Error('no tabs rendered');
  return el;
}

describe('Tabs', () => {
  it('renders the anatomy with the default axes', () => {
    const { container } = render(<Example />);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-emphasis')).toBe('ghost');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.hasAttribute('data-part')).toBe(false);
    const list = screen.getByRole('tablist', { name: 'Board settings' });
    expect(list.getAttribute('data-part')).toBe('list');
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    for (const t of tabs) expect(t.getAttribute('data-part')).toBe('trigger');
    expect(tabs[0]?.getAttribute('data-state')).toBe('active');
    expect(tabs[1]?.getAttribute('data-state')).toBe('inactive');
    expect(screen.getByRole('tabpanel').getAttribute('data-part')).toBe('panel');
  });

  it('puts the indicator in the active trigger only, before the label', () => {
    const { container } = render(<Example />);
    const indicators = container.querySelectorAll('[data-part="indicator"]');
    expect(indicators).toHaveLength(1);
    const active = screen.getAllByRole('tab')[0];
    expect(active?.firstElementChild?.getAttribute('data-part')).toBe('indicator');
    expect(active?.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    const parts = Array.from(active?.children ?? []).map((c) => c.getAttribute('data-part'));
    expect(parts).toEqual(['indicator', 'start', 'label']);
  });

  it('renders the count after the label and includes it in the name', () => {
    render(<Example />);
    const tab = screen.getByRole('tab', { name: 'Comments 12' });
    expect(tab.lastElementChild?.getAttribute('data-part')).toBe('count');
  });

  it('sets the axes from props', () => {
    const { container } = render(<Example size="sm" emphasis="soft" orientation="vertical" />);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.getAttribute('data-emphasis')).toBe('soft');
    expect(el.getAttribute('data-orientation')).toBe('vertical');
    expect(screen.getByRole('tablist').getAttribute('aria-orientation')).toBe('vertical');
  });

  it('activates a tab on click and calls onValueChange', async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Members' }));
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(screen.getByRole('tabpanel').textContent).toBe('Members panel');
    expect(screen.getByRole('tab', { name: 'Members' }).querySelector('[data-part="indicator"]')).not.toBeNull();
  });

  it('moves and activates with the arrow keys, Home and End (automatic)', async () => {
    render(<Example />);
    const [a, b, c] = screen.getAllByRole('tab');
    a?.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(b);
    expect(b?.getAttribute('data-state')).toBe('active');
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(c);
    expect(c?.getAttribute('data-state')).toBe('active');
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(a);
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(c);
  });

  it('reverses the arrow keys in right to left layouts', async () => {
    render(
      <Theme dir="rtl" lang="ar">
        <Example />
      </Theme>,
    );
    const [a, b] = screen.getAllByRole('tab');
    a?.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(b);
  });

  it('only moves focus with manual activation; Enter shows the panel', async () => {
    render(<Example activationMode="manual" />);
    const [a, b] = screen.getAllByRole('tab');
    a?.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(b);
    expect(b?.getAttribute('data-state')).toBe('inactive');
    await userEvent.keyboard('{Enter}');
    expect(b?.getAttribute('data-state')).toBe('active');
  });

  it('skips a disabled tab and marks it', async () => {
    render(<Example disabledB />);
    const [a, b, c] = screen.getAllByRole('tab');
    expect(b?.hasAttribute('data-disabled')).toBe(true);
    a?.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(c);
  });

  it('works controlled', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Example value="a" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Comments 12' }));
    expect(onValueChange).toHaveBeenCalledWith('c');
    expect(screen.getByRole('tabpanel').textContent).toBe('General panel');
    rerender(<Example value="c" onValueChange={onValueChange} />);
    expect(screen.getByRole('tabpanel').textContent).toBe('Comments panel');
  });

  it('Tab moves from the list to the panel', async () => {
    render(<Example />);
    screen.getAllByRole('tab')[0]?.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('tabpanel'));
  });

  it('throws outside Tabs', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<TabsList aria-label="x" />)).toThrow(/inside Tabs/);
    vi.restoreAllMocks();
  });

  it('renders the demo with every case', () => {
    const { container } = render(<TabsDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
  });
});
