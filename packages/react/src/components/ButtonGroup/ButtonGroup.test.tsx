import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, use } from 'react';
import { describe, expect, it } from 'vitest';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import ButtonGroupDemo from './ButtonGroup.demo';
import { ButtonGroupContext } from './ButtonGroupContext';
import { ButtonGroup } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="button-group"]');
  if (!el) throw new Error('no button group rendered');
  return el;
}

describe('ButtonGroup', () => {
  it('renders a named group with the default attributes', () => {
    const { container } = render(
      <ButtonGroup aria-label="Page actions">
        <Button>Save draft</Button>
        <Button>Preview page</Button>
      </ButtonGroup>,
    );
    const el = root(container);
    expect(screen.getByRole('group', { name: 'Page actions' })).toBe(el);
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('data-emphasis')).toBe(false);
    expect(el.hasAttribute('data-shape')).toBe(false);
    expect(el.hasAttribute('data-attached')).toBe(false);
    expect(el.hasAttribute('data-full-width')).toBe(false);
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(el.hasAttribute('aria-orientation')).toBe(false);
  });

  it('sets the axis and state attributes from props', () => {
    const { container } = render(
      <ButtonGroup aria-labelledby="h" size="sm" emphasis="outline" shape="pill" orientation="vertical" attached fullWidth>
        <Button>Save draft</Button>
      </ButtonGroup>,
    );
    const el = root(container);
    expect(el.getAttribute('aria-labelledby')).toBe('h');
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.getAttribute('data-emphasis')).toBe('outline');
    expect(el.getAttribute('data-shape')).toBe('pill');
    expect(el.getAttribute('data-orientation')).toBe('vertical');
    expect(el.getAttribute('data-attached')).toBe('');
    expect(el.getAttribute('data-full-width')).toBe('');
  });

  it('passes size, emphasis and shape to the children, and a child prop wins', () => {
    const { container } = render(
      <ButtonGroup aria-label="Page actions" size="lg" emphasis="outline" shape="square">
        <Button>Save draft</Button>
        <Button size="sm" emphasis="ghost" shape="pill">
          Preview page
        </Button>
        <IconButton icon="more" label="Open more actions" />
      </ButtonGroup>,
    );
    const [first, second, third] = Array.from(root(container).children);
    expect(first?.getAttribute('data-size')).toBe('lg');
    expect(first?.getAttribute('data-emphasis')).toBe('outline');
    expect(first?.getAttribute('data-shape')).toBe('square');
    expect(second?.getAttribute('data-size')).toBe('sm');
    expect(second?.getAttribute('data-emphasis')).toBe('ghost');
    expect(second?.getAttribute('data-shape')).toBe('pill');
    expect(third?.getAttribute('data-ds')).toBe('icon-button');
    expect(third?.getAttribute('data-size')).toBe('lg');
    expect(third?.getAttribute('data-emphasis')).toBe('outline');
  });

  it('keeps tone per child and leaves emphasis to each child when the group sets none', () => {
    const { container } = render(
      <ButtonGroup aria-label="Pages">
        <Button tone="accent">Publish page</Button>
        <IconButton icon="chevron-forward" label="Open next page" />
      </ButtonGroup>,
    );
    const [button, icon] = Array.from(root(container).children);
    expect(button?.getAttribute('data-tone')).toBe('accent');
    expect(button?.getAttribute('data-emphasis')).toBe('soft');
    expect(icon?.getAttribute('data-emphasis')).toBe('ghost');
  });

  it('leaves DOM children alone and provides the axes through context', () => {
    let seen: unknown = null;
    function Probe() {
      seen = use(ButtonGroupContext);
      return null;
    }
    const { container } = render(
      <ButtonGroup aria-label="Page actions" size="xs" emphasis="soft">
        <span data-testid="plain">Saved</span>
        <>
          <Probe />
        </>
      </ButtonGroup>,
    );
    const plain = container.querySelector('[data-testid="plain"]');
    expect(plain?.hasAttribute('size')).toBe(false);
    expect(plain?.hasAttribute('emphasis')).toBe(false);
    expect(seen).toEqual({ size: 'xs', emphasis: 'soft', shape: undefined });
  });

  it('adds no keys of its own: Tab walks every child, disabled ones included', async () => {
    const user = userEvent.setup();
    render(
      <ButtonGroup attached aria-label="Page actions">
        <Button>Save draft</Button>
        <Button disabled>Preview page</Button>
        <Button>Share board</Button>
      </ButtonGroup>,
    );
    const names = [];
    for (let i = 0; i < 3; i += 1) {
      await user.tab();
      names.push(document.activeElement?.textContent);
    }
    expect(names).toEqual(['Save draft', 'Preview page', 'Share board']);
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement?.textContent).toBe('Share board');
  });

  it('takes ref as a prop, and passes className, style and other props through', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <ButtonGroup ref={ref} aria-label="Page actions" className="x" style={{ opacity: 0.5 }} data-testid="g">
        <Button>Save draft</Button>
      </ButtonGroup>,
    );
    const el = root(container);
    expect(ref.current).toBe(el);
    expect(el.className).toBe('x');
    expect(el.style.opacity).toBe('0.5');
    expect(el.getAttribute('data-testid')).toBe('g');
  });

  it('renders every demo case', () => {
    const { container } = render(<ButtonGroupDemo />);
    for (const id of ['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'disabled']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('[data-demo-case="variants"] [data-ds="theme"][lang="ar"]')).not.toBeNull();
    const variants = container.querySelector('[data-demo-case="variants"]');
    const shown = (attr: string) =>
      new Set(Array.from(variants?.querySelectorAll(`[data-ds="button-group"][${attr}]`) ?? []).map((g) => g.getAttribute(attr)));
    expect(shown('data-size')).toEqual(new Set(['xs', 'sm', 'md', 'lg']));
    expect(shown('data-emphasis')).toEqual(new Set(['solid', 'soft', 'outline', 'ghost']));
    expect(shown('data-shape')).toEqual(new Set(['default', 'pill', 'square']));
    // At most five children in any group of the demo.
    for (const group of Array.from(container.querySelectorAll('[data-ds="button-group"]'))) {
      if (group.closest('[data-demo-case="too-many"]') && !group.hasAttribute('data-attached')) continue;
      expect(group.children.length).toBeLessThanOrEqual(5);
    }
  });
});
