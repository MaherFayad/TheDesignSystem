import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import ResizablePanelsDemo from './ResizablePanels.demo';
import { ResizableHandle, ResizablePanel, ResizablePanels, type ResizablePanelsProps } from './index';

function Group(props: Omit<ResizablePanelsProps, 'children'>) {
  return (
    <ResizablePanels {...props}>
      <ResizablePanel defaultSize={30} min={20} max={40} collapsible>
        A
      </ResizablePanel>
      <ResizableHandle label="Resize sidebar" />
      <ResizablePanel min={30}>B</ResizablePanel>
    </ResizablePanels>
  );
}

function parts(container: HTMLElement) {
  const root = container.querySelector<HTMLElement>('[data-ds="resizable-panels"]');
  const handle = container.querySelector<HTMLElement>('[data-part="handle"]');
  const panels = Array.from(container.querySelectorAll<HTMLElement>('[data-part="panel"]'));
  if (!root || !handle) throw new Error('no group rendered');
  return { root, handle, panels };
}

const size = (el: HTMLElement | undefined) => Number(el?.style.getPropertyValue('--_resizable-panels-size'));

describe('ResizablePanels', () => {
  it('renders the anatomy and the window splitter attributes', () => {
    const { container } = render(<Group />);
    const { root, handle, panels } = parts(container);
    expect(root.getAttribute('data-orientation')).toBe('horizontal');
    expect(panels).toHaveLength(2);
    expect(handle.getAttribute('role')).toBe('separator');
    expect(handle.getAttribute('tabindex')).toBe('0');
    expect(handle.getAttribute('aria-label')).toBe('Resize sidebar');
    expect(handle.getAttribute('aria-orientation')).toBe('vertical');
    expect(handle.getAttribute('aria-valuenow')).toBe('30');
    expect(handle.getAttribute('aria-valuemin')).toBe('0');
    expect(handle.getAttribute('aria-valuemax')).toBe('40');
    expect(handle.getAttribute('aria-controls')).toBe(panels[0]?.id);
    expect(handle.querySelector('[data-part="handle-grip"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(size(panels[0])).toBe(30);
    expect(size(panels[1])).toBe(70);
  });

  it('resizes with the arrow keys and reports the layout', () => {
    const onLayout = vi.fn();
    const { container } = render(<Group onLayout={onLayout} />);
    const { handle } = parts(container);
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(handle.getAttribute('aria-valuenow')).toBe('35');
    expect(onLayout).toHaveBeenLastCalledWith([35, 65]);
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(handle.getAttribute('aria-valuenow')).toBe('25');
  });

  it('flips the arrows in RTL', () => {
    const { container } = render(
      <Theme lang="ar">
        <Group />
      </Theme>,
    );
    const { handle } = parts(container);
    expect(handle.getAttribute('aria-label')).toBe('Resize sidebar');
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(handle.getAttribute('aria-valuenow')).toBe('35');
  });

  it('uses Up and Down in a vertical group', () => {
    const { container } = render(<Group orientation="vertical" />);
    const { handle } = parts(container);
    expect(handle.getAttribute('aria-orientation')).toBe('horizontal');
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(handle.getAttribute('aria-valuenow')).toBe('30');
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    expect(handle.getAttribute('aria-valuenow')).toBe('35');
  });

  it('jumps with Home and End', () => {
    const { container } = render(<Group />);
    const { handle } = parts(container);
    fireEvent.keyDown(handle, { key: 'End' });
    expect(handle.getAttribute('aria-valuenow')).toBe('40');
    fireEvent.keyDown(handle, { key: 'Home' });
    expect(handle.getAttribute('aria-valuenow')).toBe('20');
  });

  it('collapses with Enter and restores the last size', () => {
    const { container } = render(<Group />);
    const { handle, panels } = parts(container);
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    fireEvent.keyDown(handle, { key: 'Enter' });
    expect(panels[0]?.hasAttribute('data-collapsed')).toBe(true);
    expect(panels[0]?.hasAttribute('inert')).toBe(true);
    expect(handle.getAttribute('aria-valuenow')).toBe('0');
    fireEvent.keyDown(handle, { key: 'Enter' });
    expect(panels[0]?.hasAttribute('data-collapsed')).toBe(false);
    expect(handle.getAttribute('aria-valuenow')).toBe('35');
  });

  it('opens a collapsed panel with the arrow that grows it', () => {
    const { container } = render(<Group defaultSizes={[0, 100]} />);
    const { handle, panels } = parts(container);
    expect(panels[0]?.hasAttribute('data-collapsed')).toBe(true);
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(handle.getAttribute('aria-valuenow')).toBe('20');
  });

  it('drags with the pointer and marks the handle while it drags', () => {
    const onLayout = vi.fn();
    const onSizesChange = vi.fn();
    const { container } = render(<Group onLayout={onLayout} onSizesChange={onSizesChange} />);
    const { handle, panels } = parts(container);
    for (const [i, w] of [300, 700].entries()) {
      panels[i]!.getBoundingClientRect = () => ({ width: w, height: 100 }) as DOMRect;
    }
    fireEvent.pointerDown(handle, { button: 0, clientX: 300, pointerId: 1 });
    expect(handle.getAttribute('data-dragging')).toBe('');
    fireEvent.pointerMove(handle, { clientX: 350, pointerId: 1 });
    expect(handle.getAttribute('aria-valuenow')).toBe('35');
    expect(onLayout).not.toHaveBeenCalled();
    fireEvent.pointerUp(handle, { clientX: 350, pointerId: 1 });
    expect(handle.hasAttribute('data-dragging')).toBe(false);
    expect(onLayout).toHaveBeenCalledWith([35, 65]);
    expect(onSizesChange).toHaveBeenCalled();
  });

  it('follows controlled sizes', () => {
    const onSizesChange = vi.fn();
    const { container } = render(<Group sizes={[25, 75]} onSizesChange={onSizesChange} />);
    const { handle } = parts(container);
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(onSizesChange).toHaveBeenCalledWith([30, 70]);
    expect(handle.getAttribute('aria-valuenow')).toBe('25');
  });

  it('names the handle in Arabic by default under lang ar', () => {
    const { container } = render(
      <Theme lang="ar">
        <ResizablePanels>
          <ResizablePanel>A</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>B</ResizablePanel>
        </ResizablePanels>
      </Theme>,
    );
    expect(parts(container).handle.getAttribute('aria-label')).toBe('تغيير حجم الأقسام');
  });

  it('renders the demo', () => {
    const { container } = render(<ResizablePanelsDemo />);
    expect(container.querySelectorAll('[data-ds="resizable-panels"]').length).toBeGreaterThan(5);
  });
});
