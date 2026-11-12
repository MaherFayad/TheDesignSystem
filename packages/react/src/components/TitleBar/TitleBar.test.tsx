import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WindowControls } from '../WindowControls';
import TitleBarDemo from './TitleBar.demo';
import { TitleBar } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="title-bar"]');
  if (!el) throw new Error('no title bar rendered');
  return el;
}

describe('TitleBar', () => {
  it('renders the title as an h2 and leaves out empty slots', () => {
    const { container } = render(<TitleBar title="Release notes" />);
    const el = root(container);
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(el.getAttribute('data-state')).toBe('active');
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['title']);
    expect(el.querySelector('[data-part="title"]')?.tagName).toBe('H2');
    expect(el.hasAttribute('title')).toBe(false);
  });

  it('puts controls first and actions last, with the heading level and title id', () => {
    const { container } = render(
      <TitleBar
        title="brief.md"
        as="h3"
        titleId="t1"
        active={false}
        controls={<WindowControls onClose={() => undefined} />}
        actions={<span>More</span>}
        className="x"
      />,
    );
    const el = root(container);
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['controls', 'title', 'actions']);
    expect(el.querySelector('[data-part="controls"] > [data-ds="window-controls"]')).not.toBeNull();
    const title = el.querySelector('[data-part="title"]');
    expect(title?.tagName).toBe('H3');
    expect(title?.id).toBe('t1');
    expect(el.getAttribute('data-state')).toBe('inactive');
    expect(el.className).toBe('x');
  });

  it('renders every demo case', () => {
    const { container } = render(<TitleBarDemo />);
    for (const id of ['variants', 'one', 'many', 'long-text', 'long-arabic', 'disabled']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
  });
});
