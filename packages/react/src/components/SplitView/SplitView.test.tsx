import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import SplitViewDemo from './SplitView.demo';
import { SplitView, splitViewState, type SplitViewLayout } from './index';

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

function Reader({ layout = 'split', onShow }: { layout?: SplitViewLayout; onShow?: (v: boolean) => void }) {
  const [show, setShow] = useState(false);
  return (
    <SplitView
      layout={layout}
      showSecondary={show}
      onShowSecondaryChange={(v) => {
        setShow(v);
        onShow?.(v);
      }}
      primaryLabel="Messages"
      primary={<Button onClick={() => setShow(true)}>Open invoice</Button>}
      secondary={<p>Invoice for October</p>}
    />
  );
}

function parts(container: HTMLElement) {
  const root = container.querySelector<HTMLElement>('[data-ds="split-view"]');
  const primary = container.querySelector<HTMLElement>('[data-part="primary"]');
  const secondary = container.querySelector<HTMLElement>('[data-part="secondary"]');
  if (!root || !primary || !secondary) throw new Error('no split view rendered');
  return { root, primary, secondary, handle: container.querySelector<HTMLElement>('[data-part="handle"]'), back: container.querySelector<HTMLElement>('[data-part="back"]') };
}

describe('splitViewState', () => {
  it('stacks under breakpoint.tablet of the root width', () => {
    expect(splitViewState('auto', 1024, 16, false)).toBe('split');
    expect(splitViewState('auto', 600, 16, false)).toBe('primary');
    expect(splitViewState('auto', 600, 16, true)).toBe('secondary');
    expect(splitViewState('auto', 0, 16, true)).toBe('split');
    expect(splitViewState('split', 300, 16, true)).toBe('split');
    expect(splitViewState('stacked', 2000, 16, false)).toBe('primary');
  });
});

describe('SplitView', () => {
  it('renders both panes and the handle when split', () => {
    const { container } = render(<Reader />);
    const { root, primary, secondary, handle, back } = parts(container);
    expect(root.getAttribute('data-state')).toBe('split');
    expect(primary.hidden).toBe(false);
    expect(secondary.hidden).toBe(false);
    expect(primary.getAttribute('role')).toBe('region');
    expect(primary.getAttribute('aria-label')).toBe('Messages');
    expect(handle?.getAttribute('role')).toBe('separator');
    expect(handle?.getAttribute('aria-label')).toBe('Resize list');
    expect(handle?.getAttribute('aria-controls')).toBe(primary.id);
    expect(back).toBeNull();
  });

  it('resizes the list with the arrow keys', () => {
    const onLayout = vi.fn();
    const { container } = render(<SplitView layout="split" primary="List" secondary="Detail" onLayout={onLayout} />);
    const { handle } = parts(container);
    fireEvent.keyDown(handle!, { key: 'ArrowRight' });
    expect(handle?.getAttribute('aria-valuenow')).toBe('40');
    expect(onLayout).toHaveBeenCalledWith([40, 60]);
  });

  it('shows one pane when stacked, with back returning focus to the opener', () => {
    const onShow = vi.fn();
    const { container } = render(<Reader layout="stacked" onShow={onShow} />);
    let p = parts(container);
    expect(p.root.getAttribute('data-state')).toBe('primary');
    expect(p.secondary.hidden).toBe(true);
    expect(p.handle).toBeNull();
    const opener = screen.getByRole('button', { name: 'Open invoice' });
    opener.focus();
    fireEvent.click(opener);
    p = parts(container);
    expect(p.root.getAttribute('data-state')).toBe('secondary');
    expect(p.primary.hidden).toBe(true);
    expect(document.activeElement).toBe(p.secondary);
    expect(p.back?.getAttribute('data-ds')).toBe('button');
    expect(p.back?.textContent).toContain('Return to list');
    fireEvent.click(p.back!);
    expect(onShow).toHaveBeenLastCalledWith(false);
    expect(parts(container).root.getAttribute('data-state')).toBe('primary');
    expect(document.activeElement).toBe(opener);
  });

  it('names both panes by default and moves focus out of a pane that hides', () => {
    function Narrowing() {
      const [layout, setLayout] = useState<SplitViewLayout>('split');
      return (
        <SplitView
          layout={layout}
          defaultShowSecondary
          primary={<Button onClick={() => setLayout('stacked')}>Stack the view</Button>}
          secondary="Detail text"
        />
      );
    }
    const { container } = render(<Narrowing />);
    const p = parts(container);
    expect(p.primary.getAttribute('aria-label')).toBe('List');
    expect(p.secondary.getAttribute('aria-label')).toBe('Detail');
    const button = screen.getByRole('button', { name: 'Stack the view' });
    button.focus();
    fireEvent.click(button);
    expect(parts(container).root.getAttribute('data-state')).toBe('secondary');
    expect(document.activeElement).toBe(parts(container).secondary);
  });

  it('labels the handle and back in Arabic under lang ar', () => {
    const { container } = render(
      <Theme lang="ar">
        <SplitView layout="stacked" defaultShowSecondary primary="القائمة" secondary="التفاصيل" />
      </Theme>,
    );
    expect(parts(container).back?.textContent).toContain('الرجوع للقائمة');
  });

  it('renders the demo', () => {
    const { container } = render(<SplitViewDemo />);
    expect(container.querySelectorAll('[data-ds="split-view"]').length).toBeGreaterThan(5);
  });
});
