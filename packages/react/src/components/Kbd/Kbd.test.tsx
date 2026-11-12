import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Theme } from '../../theme/Theme';
import KbdDemo from './Kbd.demo';
import { Kbd } from './index';

const root = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="kbd"]')!;
const keys = (c: HTMLElement) => Array.from(c.querySelectorAll('[data-part="key"]')).map((k) => k.textContent);

describe('Kbd', () => {
  it('renders a kbd root with the default size and a left to right direction', () => {
    const { container } = render(<Kbd>Esc</Kbd>);
    const el = root(container);
    expect(el.tagName).toBe('KBD');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('dir')).toBe('ltr');
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(keys(container)).toEqual(['Esc']);
  });

  it('takes the size', () => {
    const { container } = render(<Kbd size="xs">K</Kbd>);
    expect(root(container).getAttribute('data-size')).toBe('xs');
  });

  it('draws Ctrl and plus separators on other platforms', () => {
    const { container } = render(<Kbd platform="other">Mod+Shift+P</Kbd>);
    expect(keys(container)).toEqual(['Ctrl', 'Shift', 'P']);
    expect(container.querySelectorAll('[data-part="separator"]')).toHaveLength(2);
  });

  it('draws Mac symbols with no separators on mac', () => {
    const { container } = render(<Kbd platform="mac">Mod+Shift+P</Kbd>);
    expect(keys(container)).toEqual(['⇧', '⌘', 'P']);
    expect(container.querySelectorAll('[data-part="separator"]')).toHaveLength(0);
  });

  it('treats an iOS Theme as mac', () => {
    const { container } = render(
      <Theme platform="ios">
        <Kbd>Mod+K</Kbd>
      </Theme>,
    );
    expect(keys(container)).toEqual(['⌘', 'K']);
  });

  it('takes a custom separator', () => {
    const { container } = render(
      <Kbd platform="mac" separator="then">
        G+I
      </Kbd>,
    );
    expect(container.querySelector('[data-part="separator"]')?.textContent).toBe('then');
  });

  it('hides the keycaps and says the spoken names', () => {
    const { container } = render(<Kbd platform="other">Mod+K</Kbd>);
    for (const k of container.querySelectorAll('[data-part="key"], [data-part="separator"]')) {
      expect(k.getAttribute('aria-hidden')).toBe('true');
    }
    expect(container.querySelector('[data-part="spoken"]')?.textContent).toBe('Control K');
    expect(container.querySelector('[data-part="spoken"]')?.getAttribute('lang')).toBe('en');
  });

  it('leaves a node keycap readable when it has no label', () => {
    const { container } = render(
      <Kbd>
        <span>fn</span>
      </Kbd>,
    );
    expect(container.querySelector('[data-part="key"]')?.hasAttribute('aria-hidden')).toBe(false);
    expect(container.querySelector('[data-part="spoken"]')).toBeNull();
  });

  it('uses the label as the spoken text', () => {
    const { container } = render(
      <Kbd platform="other" label="كنترول K">
        Ctrl+K
      </Kbd>,
    );
    expect(container.querySelector('[data-part="spoken"]')?.textContent).toBe('كنترول K');
    expect(container.querySelector('[data-part="spoken"]')?.hasAttribute('lang')).toBe(false);
  });

  it('renders a node as one keycap', () => {
    const { container } = render(
      <Kbd label="Fn">
        <span>fn</span>
      </Kbd>,
    );
    expect(keys(container)).toEqual(['fn']);
    expect(container.querySelector('[data-part="spoken"]')?.textContent).toBe('Fn');
  });

  it('is hidden from assistive tech when decorative', () => {
    const { container } = render(<Kbd decorative>Mod+K</Kbd>);
    expect(root(container).getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[data-part="spoken"]')).toBeNull();
  });

  it('passes props and the ref to the root, and never a title', () => {
    let node: HTMLElement | null = null;
    const { container } = render(
      <Kbd className="x" data-testid="k" ref={(n) => void (node = n)}>
        K
      </Kbd>,
    );
    expect(root(container).className).toBe('x');
    expect(node).toBe(root(container));
    expect(root(container).hasAttribute('title')).toBe(false);
  });

  it('renders the demo cases in order', () => {
    const { container } = render(<KbdDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'long-text', 'long-arabic']);
  });
});
